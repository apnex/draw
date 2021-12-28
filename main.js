import grid from './grid.js';
import model from './model.js';
import iconset from './iconset.js';
import drawFactory from './draw.js';
var root = document.getElementById('container');
initHandlers(root)
var nodeGroup = document.getElementById('nodes');
var dockGroup = document.getElementById('zones');
var linkGroup = document.getElementById('links');
var gridGroup = document.getElementById('grid');
var defs = document.getElementById('defs');
var currentLine = null;
var currentZone = null;
var currentGroup = null;
var zonePos1 = null;
var currentNode = null;
var currentButton = null;
var currentKey = null;
var currentPoint = null;
var selectedNode = null;
var selectedPoint = null;

// init canvas
var nodes = model.nodes; // rework main to remove this need
var links = model.links; // rework main to remove this need
var draw = drawFactory(model, grid, iconset);
init();

// attach handlers
function initHandlers(obj) {
	let listeners = {
		"mouseup"	: (event) => { end(event); },
		"mousedown"	: (event) => { start(event); },
		"mousemove"	: (event) => { update(event); },
		"mouseover"	: (event) => { mouseover(event); },
		"mouseout"	: (event) => { mouseout(event); },
		//"mouseenter":	"hilight(evt)",
		//"mouseleave":	"hilight(evt)"
	}
	Object.entries(listeners).forEach((entry) => {
		obj.addEventListener(entry[0], entry[1]);
	});
	window.addEventListener('contextmenu', (event) => {
		event.preventDefault();
		event.stopPropagation();
		return false;
	});
	document.addEventListener('keydown', (event) => { keyDown(event); });
	document.addEventListener('keyup', (event) => {	keyUp(event); });
}

// test key trigger
function keyDown(event) {
	if(event.defaultPrevented) {
		return; // Do nothing if the event was already processed
	}
	// move all setAttribute manipulation to draw.js
	// consider using persistent 'layers' mapped to 1-4 keys - use shift+1 for layer 1 - default plain shift to 1
	currentKey = event.key;
	console.log('CURRENTKEY: ' + event.key);
	let myGroup;
	let kind;
	let styles;
	if(currentGroup) { // move to draw.js
		myGroup = document.getElementById(currentGroup);
	}
	if(currentNode) {
		kind = nodes[currentNode.id].type;
		styles = iconset.icons[kind].class;
	}
	if(currentKey == 'Meta') {
		if(myGroup) {
			myGroup.setAttribute("class", "groupDelete");
		}
	}
	if(currentKey == 'Alt') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", styles.delete);
		}
	}
	if(currentKey == 'Control') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", styles.clone);
		}
	}
	if(currentKey == 'Shift') {
		draw.showGrid();
		if(myGroup) {
			if(event.altKey) {
				myGroup.setAttribute("class", "groupDelete");
			}
		}
	}
	console.log('[ KEYDOWN ]: ' + event.key);
}

// test key trigger
function keyUp(event) {
	console.log('[ KEYUP ]: ' + event.key);
	let myGroup;
	let kind;
	let styles;
	if(currentGroup) { // move to draw.js
		myGroup = document.getElementById(currentGroup);
	}
	if(currentNode) {
		kind = nodes[currentNode.id].type;
		styles = iconset.icons[kind].class;
	}
	if(event.key == 'Meta') {
		if(myGroup) {
			myGroup.setAttribute("class", "group");
		}
	}
	if(event.key == 'Alt') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", styles.mouseover);
		}
	}
	if(event.key == 'Control') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", styles.mouseover);
		}
	}
	if(event.key == 'Shift') {
		draw.hideGrid();
		if(myGroup) {
			myGroup.setAttribute("class", "group");
		}
	}
	currentKey = null;
}

// draw initial icons
function init() {
	// load iconset
	[
		'host',
		'router',
		'vxlan',
		'firewall',
		'loadbalancer',
		'server'
	].forEach((kind) => {
		iconset.createIcon(kind, {
			"mouseover"	: "mon",
			"mouseout"	: "mof",
			"delete"	: "delete",
			"clone"		: "clone"
		});
	});
	iconset.createIcon('waypoint', {
		"mouseover"	: "mon2",
		"mouseout"	: "mof2",
		"delete"	: "delete2",
		"clone"		: "clone2"
	});
	iconset.createIcon('export', {
		"mouseover"	: "mon2",
		"mouseout"	: "mof2",
		"delete"	: "delete2",
		"clone"		: "clone2"
	});

	// rework and merge create group/dock/zone function inside draw.js
	// dock panel (remove and merge with draw)
	[
		'host',
		'server',
		'loadbalancer',
		'firewall',
		'vxlan',
		'router'
	].forEach((icon, x) => {
		draw.createNode(icon, {x, y: 0}, 'dock');
	});
	draw.createZone2({
		id	: 'dockPanel',
		class	: 'panel',
		start	: {x: 0, y: 0},
		end	: {x: 5, y: 0},
		tags	: []
	});

	// save panel
	[
		'export',
		'waypoint'
	].forEach((icon, x) => {
		draw.createNode(icon, {x, y: 1}, 'control');
	});
	draw.createZone2({
		id	: 'controlPanel',
		class	: 'panel',
		start	: {x: 0, y: 1},
		end	: {x: 1, y: 1},
		tags	: []
	});
}

function saveJson() {
	// generate new model string blob
	let myString = JSON.stringify(model.state, null, "\t");
	let string_blob = new Blob([myString], {'type': "application/json"});
	var blobUrl = URL.createObjectURL(string_blob);

	// download json
	var dLink = document.createElement("a");
	dLink.href = blobUrl;
	dLink.download = "save-data.json";
	document.body.appendChild(dLink);
	dLink.click();
	document.body.removeChild(dLink);
}

// mousedown
function start(evt) {
	// logic for CLICK events
	// map inputs and transfer evt state to draw.js - draw.js handles render and model logic
	// -> ifCurrentButtonAlreadyDown
	// -> ifLayer (shift, alt, ctrl)

	// inputs need to resolve 'context' and 'action'
	// #context - spatial - where is the cursor? am I over a zone, a node, or both?
	// #action - what keys/mouse are being pressed? what function is triggered?
	// let's try for context first - delegate responsibility to individual components
	// -- mousemove
	// -- mouseout
	// -- mouseover
	/*
		# tag 'panel:control'
		contextTree.add({
		});
		contextTree.fire(evt);
	*/

	currentButton = evt.button;
	if(evt.shiftKey) {
		if(evt.altKey) {
			console.log('[ LAYER-01 ] - Delete Group');
			draw.deleteZone(currentGroup);
		} else {
			if(currentButton == 0) { // left-click
				console.log('[ LAYER-01 ] - Create Group');
				zonePos1 = grid.getNearestGroupPoint({
					x: evt.clientX,
					y: evt.clientY
				});
				currentZone = draw.createZone(zonePos1, 'liveZone');
			}
		}
	} else {
		if(currentNode) {
			selectedNode = currentNode.id;
			let currentPos = {
				x: currentNode.getAttribute("x"),
				y: currentNode.getAttribute("y")
			};
			let nearestPos = grid.getNearestPoint(currentPos);
			// check tags
			if(nodes[selectedNode].tag == "dock") {
				if(currentButton == 2) { // dock - create new node
					draw.showPoint(nearestPos);
					selectedNode = draw.createNode(nodes[selectedNode].type, currentPos, 'notdock');
					console.log('[ DOCK ]: doing dock things onmousedown');
				}
				if(currentButton == 0) { // dock - ?? save json
					console.log('[ DOCK ]: saving json string');
					saveJson();
				}
			} else {
				if(currentButton == 0) { // start line drag
					console.log('Start event: ' + evt + ' button: ' + currentButton + ' nodepos: ' + currentPos.x + ':' + currentPos.y);
					currentLine = draw.createLink(currentPos);
				}
				if(currentButton == 2) { // node on canvas
					if(!(evt.altKey && evt.ctrlKey)) { // rework logic for simpler events
						draw.showPoint(nearestPos);
						if(evt.altKey) {
							draw.deleteNode(selectedNode);
							selectedNode = null;
							currentNode = null;
						} else {
							if(evt.ctrlKey) {
								selectedNode = draw.createNode(nodes[selectedNode].type, currentPos, 'clone');
								console.log('[ CLONE ]: cloning current NODE with CTRL+Right-Click');
							}
						}
					}
				}
			}
		} else { // DEBUG BOTH CLICKS
			if(currentButton == 0) { // start line drag
				console.log('[[ EXISTING BUTTON ]]: LEFT already selected');
			}
			if(currentButton == 2) { // start grid box drag
				console.log('[[ EXISTING BUTTON ]]: RIGHT already selected');
			}
		}
	}
}

// update line
function update(evt) {
	let currentPos = {
		x: evt.clientX,
		y: evt.clientY
	};
	if(selectedNode) {
		if(nodes[selectedNode].tag == "dock") { // check if dock
			// do dock things
		} else { // not the dock
			if(currentButton == 0) { // left button
				// draw.updateLine
				if(currentLine) { // mode to updateLink
					draw.updateLink(currentLine, currentPos);
				}
			}
			if(currentButton == 2) { // right button
				draw.updateNode(selectedNode, currentPos);
				// point should self update inside draw.js? yes
				let nearestPos = grid.getNearestPoint(currentPos);
				draw.updatePoint(nearestPos);
			}
		}
	} else {
		if(evt.shiftKey) {
			if(currentButton == 0 && currentZone) { // left button
				console.log('Update ZONE Draw');
				draw.updateZone(currentZone, zonePos1, currentPos);
			}
			draw.updateGroupPoint(currentPos);
			/* might adjust to have 2 points? a start point and end point - visual change
			} else {
				console.log('No node selected - updating point: ' + currentButton);
				draw.updateGroupPoint(currentPos);
			}
			*/
		}
	}
}

// finish line
function end(evt) {
	console.log('[END]');
	let currentPos = {
		x: evt.clientX,
		y: evt.clientY
	};
	if(evt.shiftKey) {
		if(currentZone) {
			let zonePos2 = grid.getNearestGroupPoint(currentPos);
			draw.commitZone(currentZone, zonePos1, zonePos2);
			currentZone = null;
		}
	} else {
		if(selectedNode) {
			if((currentButton == 0) && currentLine) {
				if(currentNode) {
					// change currentNode from DOM object to just ID
					let dst = currentNode.getAttribute("id");
					draw.addLink(selectedNode, dst);
				}
				draw.deleteLink(currentLine);
				currentLine = null;
			}
			if((currentButton == 2)) {
				let pos = grid.getNearestPoint(currentPos);
				draw.commitNode(selectedNode, pos);
			}
		}
		draw.hidePoint();
		selectedNode = null;
		currentButton = null;
	}
}

// mouseover
function mouseover(event) {
	let context = draw.context.mouseover(event);
	let activeNodes = context.activeNodes();

	console.log('ActiveNode test in MAIN');
	console.log(JSON.stringify(activeNodes, null, "\t"));
	/*
	// rework all mouseover logic to be externalised in "context" module
	let activeZones = context.activeZones();

	// what entities are being returned? Model Entities!
	// Model Entity includes setClass function()
	// draw is responsible for class attribute manipulation

	// update active nodes
	activeNodes.forEach((node) => {
		let styles = iconset.icons[node.kind].class;
		if(!(event.altKey && event.ctrlKey)) {
			if(event.altKey) {
				node.setClass(styles.delete);
			} else {
				if(event.ctrlKey) {
					node.setClass(styles.clone);
				} else {
					node.setClass(styles.hover);
				}
			}
		} else {
			node.setClass(styles.hover);
		}
	});

	// update active zones
	activeZones.forEach((zone) => {
		if(event.shiftKey) {
			if(event.altKey) {
				zone.setClass("zoneDelete");
			}
		}
	});
	*/

	let target = event.target
	if(target.nodeName == "use") {
		currentNode = target;

		// trigger node specific actions on mouse over
		// this will require moving logic to a 'node' object with actions
		/*
		let kind = nodes[target.id].type;
		let styles = iconset.icons[kind].class;
		if(!(event.altKey && event.ctrlKey)) {
			if(event.altKey) { // works pretty well
				target.setAttribute("class", styles.delete);
			} else {
				if(event.ctrlKey) { // works pretty well
					target.setAttribute("class", styles.clone);
				} else {
					target.setAttribute("class", styles.mouseover);
				}
			}
		} else {
			target.setAttribute("class", styles.mouseover);
		}
		*/
	} else {
		if(target.getAttribute('class') == 'group') {
			currentGroup = target.getAttribute('id');
			//console.log('META - switch class:: ALT:' + event.altKey + ' SHIFT:' + event.shiftKey);
			if(event.shiftKey) {
				if(event.altKey) {
					target.setAttribute("class", "groupDelete");
				}
			}
		}
	}
}

// mouseout
function mouseout(event) {
	let context = draw.context.mouseout(event);
	let inactiveNodes = context.inactiveNodes();

	console.log('inActiveNode test in MAIN');
	console.log(JSON.stringify(inactiveNodes, null, "\t"));
	/*
	// context to provide 4 states
	// - active entity
	// - active entity - last event
	// - inactive entity
	// - inactive entity - last event
	// this resolves nodes that have recently become inactive
	let context = draw.context.mouseout(event);
	let inactiveNodes = context.inactiveNodes(true);
	let inactiveZones = context.inactiveZones(true);

	// update recent inactive node
	inactiveNodes.forEach((node) => {
		zone.setClass("node");
	});

	// update recent inactive zones
	inactiveZones.forEach((zone) => {
		zone.setClass("zone");
	});
	*/

	let target = event.target
	if(target.nodeName == "use") {
		//if(nodes[target.id].type != "dock") { // look at type/tag from model
			currentNode = null;
			let kind = nodes[target.id].type;
			let style = iconset.icons[kind].class.mouseout;
			target.setAttribute("class", style);
		//}
	} else {
		if(target.getAttribute('class') == 'groupDelete') {
			currentGroup = null;
			//if(event.shiftKey) {
				//if(event.altKey) {
					target.setAttribute("class", "group");
				//}
			//}
		}
	}
}

import ky from './lib/ky.min.js';
import grid from './grid.js';
import model from './model.js';
import iconset from './iconset.js';
import engFactory from './core/engineer.js';
var root = document.getElementById('container');
initHandlers(root)
var currentLine = null;
var zonePos1 = null;
var currentButton = null;
var currentKey = null;
var currentPoint = null;
var selectedNode = null;
var selectedPoint = null;

/*
MAIN implements user interactivity and menu inputs by handling initial mouse and key events from DOM
From here, logic is orchestrated and handed off to Draw, Context and other modules for desired processing of events
*/

// init canvas
var nodes = model.nodes; // rework main to remove this need
var draw = engFactory(model, grid, iconset);
init();

// attach handlers
function initHandlers(obj) {
	let listeners = {
		"mousedown"	: (event) => { mousedown(event); },
		"mousemove"	: (event) => { mousemove(event); },
		"mouseup"	: (event) => { mouseup(event); },
		"mouseover"	: (event) => { mouseover(event); },
		"mouseout"	: (event) => { mouseout(event); }
		//"mouseenter":	"hilight(event)",
		//"mouseleave":	"hilight(event)"
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
	let context = draw.context;
	let activeNode = context.activeNodes()[0];
	let activeZone = context.activeZones()[0];
	if(event.defaultPrevented) {
		return; // Do nothing if the event was already processed
	}
	// consider using persistent 'layers' mapped to 1-4 keys - use shift+1 for layer 1 - default plain shift to 1
	currentKey = event.key;
	console.log('[ KEYDOWN ]: ' + event.key);
	let styles;
	if(activeNode) {
		styles = iconset.icons[activeNode.type].class;
	}
	if(currentKey == 'Meta') {
		if(activeZone) {
			activeZone.setClass('zoneDelete');
		}
	}
	if(currentKey == 'Alt') {
		if(activeNode) {
			activeNode.setClass(styles.delete);
		}
	}
	if(currentKey == 'Control') {
		if(activeNode) {
			activeNode.setClass(styles.clone);
		}
	}
	if(currentKey == 'Shift') {
		draw.showGrid();
		if(activeZone) {
			if(event.altKey) {
				activeZone.setClass('zoneDelete');
			}
		}
	}
}

// test key trigger
function keyUp(event) {
	let context = draw.context;
	let activeNode = context.activeNodes()[0];
	let activeZone = context.activeZones()[0];
	console.log('[ KEYUP ]: ' + event.key);
	let styles;
	if(activeNode) {
		styles = iconset.icons[activeNode.type].class;
	}
	if(event.key == 'Meta') {
		if(activeZone) {
			activeZone.setClass('zone');
		}
	}
	if(event.key == 'Alt') {
		if(activeNode) {
			activeNode.setClass(styles.mouseover);
		}
	}
	if(event.key == 'Control') {
		if(activeNode) {
			activeNode.setClass(styles.mouseover);
		}
	}
	if(event.key == 'Shift') {
		draw.hideGrid();
		draw.deleteZone('liveZone');
		if(activeZone) {
			activeZone.setClass('zoneActive');
		}
	}
	currentKey = null;
}

// draw initial icons
async function init() {
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
		draw.createNode(icon, grid.getCoord({x, y: 0}), {
			button: true
		}); // need to adjust to be cell coord, not raw x,y
		//draw.createNode(icon, {x, y: 0}, 'dock');
	});

	// new addZone function - update to remove getGroupCoord, and have it resolve from grid cell coord
	// split zoneGrid from nodeGrid - make two instances of the same object
	// use shift key to move between grids
	draw.addZone({
		type	: 'panel',
		class	: 'panel',
		pos1	: grid.getGroupCoord({x: 0, y: 0}),
		pos2	: grid.getGroupCoord({x: 6, y: 1}),
		tags	: {
			enable: false
		}
	});

	// save panel
	[
		'export',
		'waypoint'
	].forEach((icon, x) => {
		draw.createNode(icon, grid.getCoord({x, y: 1}), {
			button: true
		});
	});

	// new addZone function - update to remove getGroupCoord
	draw.addZone({
		type	: 'panel',
		class	: 'panel',
		pos1	: grid.getGroupCoord({x: 0, y: 1}),
		pos2	: grid.getGroupCoord({x: 2, y: 2}),
		tags	: {
			enable: false
		}
	});

	// test diagram load
	console.log('Loading Model [ /examples/test1.json');
	let newModel = await ky.get('/examples/test1.json').json();
	console.log('Loading Model [ /examples/test1.json - DONE!');
	draw.importDiagram(newModel);
	//model.import(newModel); ??
}

// mousedown
function mousedown(event) {
	let context = draw.context;
	let activeNode = context.activeNodes()[0];
	let activeZone = context.activeZones()[0];

	// logic for CLICK events
	// map inputs and transfer evt state to draw.js - draw.js handles render and model logic
	// -> ifCurrentButtonAlreadyDown
	// -> ifLayer (shift, alt, ctrl)

	// inputs need to resolve 'context' and 'action'
	// #context - spatial - where is the cursor? am I over a zone, a node, or both?
	// #action - what keys/mouse are being pressed? what function is triggered?
	// let's try for context first - delegate responsibility to individual components
	currentButton = event.button;
	if(event.shiftKey) {
		if(event.altKey) {
			if(activeZone) { // handle no zone active
				console.log('[ LAYER-01 ] - Delete Zone');
				draw.deleteZone(activeZone.id);
			}
		} else {
			if(currentButton == 0) { // left-click
				console.log('[ LAYER-01 ] - Create Group');
		                // create placeholder 'liveZone'
				// need to remove need for zonePos1 global variable
				zonePos1 = grid.getNearestGroupPoint({
					x: event.clientX,
					y: event.clientY
				});
				draw.drawZone({
					id	:'liveZone',
					class	: 'zone',
					pos1	: zonePos1,
					pos2	: zonePos1
				});
			}
		}
	} else {
		if(activeNode) {
			selectedNode = activeNode.id;
			let currentPos = { // update model.node to be node.pos.x, node.pos.y ?
				x: activeNode.x,
				y: activeNode.y
			};
			let nearestPos = grid.getNearestPoint(currentPos);
			// check tags
			if(nodes[selectedNode].tags.button) {
				if(currentButton == 2) { // dock - create new node
					console.log('[ DOCK ]: button pressed');
					draw.showPoint(nearestPos);
					selectedNode = draw.createNode(nodes[selectedNode].type, currentPos, 'notdock');
				}
				if(currentButton == 0) { // dock - ?? save json
					console.log('[ DOCK ]: saving json string');
					draw.exportDiagram();
				}
			} else {
				if(currentButton == 0) { // start line drag
					currentLine = draw.createLink(currentPos);
				}
				if(currentButton == 2) { // node on canvas
					if(!(event.altKey && event.ctrlKey)) { // rework logic for simpler events
						draw.showPoint(nearestPos);
						if(event.altKey) {
							draw.deleteNode(selectedNode);
							selectedNode = null;
						} else {
							if(event.ctrlKey) {
								console.log('[ CLONE ]: cloning current NODE with CTRL+Right-Click');
								selectedNode = draw.createNode(nodes[selectedNode].type, currentPos, 'clone');
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

// update line/node/group
function mousemove(event) {
	let currentPos = {
		x: event.clientX,
		y: event.clientY
	};
	if(selectedNode) {
		// need to implement a filter here to check NODE ACTION before update!!! to save cycles

		//if(nodes[selectedNode].tag == "dock") { // check if dock
			// do dock things
		//} else { // not the dock
			console.log('UPDATE: DOCK TEST');
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
		//}
	} else {
		if(event.shiftKey) {
			let currentZone = document.getElementById('liveZone');
			if(currentButton == 0 && currentZone) { // left button
				draw.updateZone('liveZone', zonePos1, currentPos);
			}
			draw.updateGroupPoint(currentPos);
		}
	}
}

// commit update
function mouseup(event) {
	let context = draw.context;
	let activeNode = context.activeNodes()[0];
	let activeZone = context.activeZones()[0];
	let currentPos = {
		x: event.clientX,
		y: event.clientY
	};
	if(event.shiftKey) {
		let currentZone = document.getElementById('liveZone');
		if(currentZone) {
			let zonePos2 = grid.getNearestGroupPoint(currentPos);
			draw.commitZone('liveZone', zonePos1, zonePos2);
		}
	} else {
		if(selectedNode) {
			if((currentButton == 0) && currentLine) {
				if(activeNode) {
					draw.addLink(selectedNode, activeNode.id);
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
	//console.log('MAIN.MOUSEOVER target: ' + event.target.id);
	let context = draw.context.mouseover(event);
	let activeNodes = context.activeNodes();
	let activeZones = context.activeZones();

	// update active nodes
	activeNodes.forEach((entity) => {
		if(!event.shiftKey) {
			let styles = iconset.icons[entity.type].class;
			if(!(event.altKey && event.ctrlKey)) {
				if(event.altKey) {
					entity.setClass(styles.delete);
				} else {
					if(event.ctrlKey) {
						entity.setClass(styles.clone);
					} else {
						entity.setClass(styles.mouseover);
					}
				}
			} else {
				entity.setClass(styles.mouseover);
			}
		}
	});

	// update active zones
	activeZones.forEach((entity) => {
		if(event.shiftKey) {
			// does not trigger - if zone was deleted on top of another zone (no shift or alt is reflected here)
			if(event.altKey) {
				entity.setClass('zoneDelete');
			}
		} else {
			entity.setClass('zoneActive');
		}
	});
}

// mouseout
function mouseout(event) {
	//console.log('MAIN.MOUSEOUT target: ' + event.target.id);
	let context = draw.context.mouseout(event);
	let updateNodes = context.updateNodes();
	let updateZones = context.updateZones();

	// update nodes
	updateNodes.forEach((entity) => {
		let styles = iconset.icons[entity.type].class;
		entity.setClass(styles.mouseout);
		entity.setTag('update', false);
	});

	// update zones
	updateZones.forEach((entity) => {
		entity.setClass('zone');
		entity.setTag('update', false);
	});
}

import grid from './grid.js';
import model from './model.js';
import drawFactory from './draw.js';
var root = document.getElementById('container');
initHandlers(root)
var nodeGroup = document.getElementById('nodes');
var dockGroup = document.getElementById('groups');
var linkGroup = document.getElementById('links');
var gridGroup = document.getElementById('grid');
var defs = document.getElementById('defs');
var currentLine = null;
var currentNode = null;
var currentButton = null;
var currentKey = null;
var currentPoint = null;
var selectedNode = null;
var selectedPoint = null;
var nodes = model.nodes;
var links = model.links;
var icons = [
	'host',
	'router',
	'vxlan',
	'firewall',
	'loadbalancer',
	'server'
];

var draw = drawFactory(model, grid);
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
	document.addEventListener('keydown', (event) => {
		keyDown(event);
	});
	document.addEventListener('keyup', (event) => {
		keyUp(event);
	});
}

// test key trigger
function keyDown(event) {
	currentKey = event.key;
	if(currentKey == 'Alt') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", "delete");
		}
	}
	if(currentKey == 'Control') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", "clone");
		}
	}
	if(currentKey == 'Shift') {
		draw.showGrid();
		/*
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", "clone");
		}
		*/
	}
	console.log('[ KEYDOWN ]: ' + event.key);
}

// test key trigger
function keyUp(event) {
	console.log('[ KEYUP ]: ' + event.key);
	if(currentKey == 'Alt') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", "mon");
		}
	}
	if(currentKey == 'Control') {
		if(currentNode) {
			currentNode.setAttributeNS(null, "class", "mon");
		}
	}
	if(currentKey == 'Shift') {
		draw.hideGrid();
	}
	currentKey = null;
}

// draw initial icons
function init() {
	// build the initial dock
	let myList = [];
	let x = 0;
	icons.forEach((icon) => {
		myList.push(draw.createNode(icon, {x: x++, y: 0}, 'dock'));
	});

	// calculate diff x/y on cells
	let x1 = 0;
	let y1 = 0;
	let x2 = 0;
	let y2 = 0;
	myList.forEach((id) => { // scan for dimension
		if(nodes[id].x < x1) {
			x1 = nodes[id].x;
		} else {
			if(nodes[id].x > x2) {
				x2 = nodes[id].x;
			}
		}
		if(nodes[id].y < y1) {
			y1 = nodes[id].y;
		} else {
			if(nodes[id].y > y2) {
				y2 = nodes[id].y;
			}
		}
	});
	console.log(JSON.stringify(grid.getCoord({x: 3, y: 3}), null, "\t"));
	// rework group into draw
	createGroup({
		start	: {x: x1, y: y1},
		end	: {x: x2, y: y2}
	});
}

// mousedown
function start(evt) {
	// logic
	// -> ifCurrentButtonAlreadyDown
	// -> ifLayer (shift, alt, ctrl)
	if(!currentButton) {
		currentButton = evt.button;
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
			} else {
				if(currentButton == 0) { // start line drag
					console.log('Start event: ' + evt + ' button: ' + currentButton + ' nodepos: ' + currentPos.x + ':' + currentPos.y);
					if(evt.shiftKey) {
						console.log('[ SHIFT IS PRESSED ]');
					} else {
						currentLine = draw.createLink(currentPos);
					}
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
	} else {
		// maybe??
		currentButton = null;
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
					let line = document.getElementById(currentLine);
					draw.assignAttr(line, {
						x2: evt.clientX,
						y2: evt.clientY
					});
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
			if(currentButton == 0) { // left button
				console.log('Update BOX Draw');
			} else {
				console.log('No node selected - updating point: ' + currentButton);
				draw.updateGroupPoint(currentPos);
			}
		}
	}
}

// finish line
function end(evt) {
	console.log('[END]');
	if(selectedNode) {
		if((currentButton == 0) && currentLine) {
			if(currentNode) {
				let dst = currentNode.getAttribute("id");
				draw.addLink(selectedNode, dst);
			}
			// delete 'active' line
			draw.deleteLink(currentLine);
			currentLine = null;
		}
		//if((currentButton == 2) && selectedPoint) {
		if((currentButton == 2)) {
			// update + render
			let pos = grid.getNearestPoint({
				x: evt.clientX,
				y: evt.clientY
			});
			draw.updateNode(selectedNode, pos);
			model.updateNode(selectedNode, pos);
			//draw.hidePoint();
		}
	}
	draw.hidePoint();
	selectedNode = null;
	currentButton = null;
}

// mouseover
function mouseover(evt) {
	let target = evt.target
	if(target.nodeName == "use") {
		// rework logic to detect different events
		if(!(evt.altKey && evt.ctrlKey)) {
			if(evt.altKey) { // works pretty well
				currentNode = target;
				target.setAttributeNS(null, "class", "delete");
			} else {
				if(evt.ctrlKey) { // works pretty well
					currentNode = target;
					target.setAttributeNS(null, "class", "clone");
				} else {
					currentNode = target;
					target.setAttributeNS(null, "class", "mon");
				}
			}
		} else {
			currentNode = target;
			target.setAttributeNS(null, "class", "mon");
		}
	}
}

// mouseout
function mouseout(evt) {
	let target = evt.target
	if(target.nodeName == "use") {
		//if(nodes[target.id].type != "dock") {
			currentNode = null;
			target.setAttributeNS(null, "class", "mof");
			return;
		//}
	}
}

// create group
function createGroup(spec) {
	// create rectangle for dock
	let start = grid.getCoord(spec.start);
	let end = grid.getCoord(spec.end);
	dockGroup.appendChild(draw.createShape('rect', {
		"id"		: 'dockPanel',
		"x"		: start.x - (grid.gap.x / 2),
		"y"		: start.y - (grid.gap.y / 2),
		"width"		: (end.x - start.x) + (grid.gap.x),
		"height"	: (end.y - start.y) + (grid.gap.y),
		"class"		: 'dock'
	}));
}

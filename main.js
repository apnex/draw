import grid from './grid.js';
import model from './model.js';
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
var frameCounter = 0;
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
	currentKey = null;
}

// draw initial icons
function init() {
	// build the initial dock
	let myList = [];
	let x = 0;
	icons.forEach((icon) => {
		myList.push(createNode(icon, {x: x++, y: 0}, 'dock'));
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
	createGroup({
		start	: {x: x1, y: y1},
		end	: {x: x2, y: y2}
	});
}

// mousedown
function start(evt) {
	if((!currentButton) && currentNode) {
		currentButton = evt.button;
		selectedNode = currentNode.id;
		let currentPos = {
			x: currentNode.getAttribute("x"),
			y: currentNode.getAttribute("y")
		};
		// check tags
		if(nodes[selectedNode].tag == "dock") {
			if(currentButton == 2) { // dock - create new node
				selectedNode = createNode(nodes[selectedNode].type, currentPos, 'notdock');
				createPoint(currentPos);
				console.log('[ DOCK ]: doing dock things onmousedown');
			}
		} else {
			if(currentButton == 0) { // start line drag
				console.log('Start event: ' + evt + ' button: ' + currentButton + ' nodepos: ' + currentPos.x + ':' + currentPos.y);
				createLink(currentPos);
			}
			if(currentButton == 2) { // dock - create new node
				if(!(evt.altKey && evt.ctrlKey)) { // rework logic for simpler events
					if(evt.altKey) { // works pretty well
						deleteNode(selectedNode);
					} else {
						if(evt.ctrlKey) { // works pretty well
							selectedNode = createNode(nodes[selectedNode].type, currentPos, 'clone');
							createPoint(currentPos);
							console.log('[ CLONE ]: cloning current NODE with CTRL+Right-Click');
						} else {
							deletePoint();
							createPoint(currentPos);
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

// update line
function update(evt) {
//	if(selectedNode && currentButton) { // only update if a node and button is selected
	if(selectedNode) { // only update if a node and button is selected
		if(nodes[selectedNode].tag == "dock") { // check if dock
			// do dock things
		} else { // not the dock
			if(currentButton == 0) { // left button
				if(currentLine) { // mode to updateLink
					let line = document.getElementById(currentLine);
					assignAttr(line, {
						x2: evt.clientX,
						y2: evt.clientY
					});
					frameCounter++;
				}
			}
			if(currentButton == 2) { // right button
				let currentPos = {
					x: evt.clientX,
					y: evt.clientY
				};
				updateNode(selectedNode, currentPos);
				frameCounter++;
				let nearestPos = grid.getNearestPoint(currentPos);
				if(!grid.isSamePos(selectedPoint, nearestPos)) {
					updatePoint(nearestPos);
				}
			}
		}
	}
}

// finish line
function end(evt) {
	if(selectedNode) {
		if((currentButton == 0) && currentLine) {
			if(currentNode) {
				// commit link to model
				let dst = currentNode.getAttribute("id");
				addLink(selectedNode, dst);
				console.log('[ END ] frameCounter: ' + frameCounter + ' End event: ' + evt);
			}
			// delete 'active' line
			deleteLink();
		}
		if((currentButton == 2) && selectedPoint) {
			// update + render
			let pos = grid.getNearestPoint({
				x: evt.clientX,
				y: evt.clientY
			});
			updateNode(selectedNode, pos);
			commitNode(selectedNode, pos); // duplicate?
			console.log('[ UPDATE ]: frameCounter ' + frameCounter + ': ' + JSON.stringify(nodes[selectedNode], null, "\t"));
			// delete 'active' grid point
			// grid.point.delete();
			deletePoint();
		}
	}
	selectedNode = null;
	currentButton = null;
	frameCounter = 0;
}

// mouseover
function mouseover(evt) {
	let target = evt.target
	if(target.nodeName == "use") {
		// rework logic to detect different events
		if(!(evt.altKey && evt.ctrlKey)) { // works pretty well
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
	dockGroup.appendChild(createShape('rect', {
		"id"		: 'dockPanel',
		"x"		: start.x - (grid.gap.x / 2),
		"y"		: start.y - (grid.gap.y / 2),
		"width"		: (end.x - start.x) + (grid.gap.x),
		"height"	: (end.y - start.y) + (grid.gap.y),
		"class"		: 'dock'
	}));
}

// create node
function createNode(kind, pos, tag) {
	let id = model.createNode(kind, pos, tag);
	nodeGroup.appendChild(createUse(kind, {
		"id"	: id,
		"x"	: grid.getCoord(pos).x,
		"y"	: grid.getCoord(pos).y,
		"class"	: 'mof'
	}));
	return id;
}

// delete node
function deleteNode(id) {
	Object.keys(nodes[id].links).forEach((link) => {
		linkGroup.removeChild(document.getElementById(link));
	});
	nodeGroup.removeChild(document.getElementById(id));
	model.deleteNode(id);
	currentNode = null;
	selectedNode = null;
}

// create point
function createPoint(pos) { // change to show/hide mechanism
	let rect = root.getBoundingClientRect(); // get the svg bounding rectangle
	console.log('[ CREATE ]: point { ' + rect.width + ':' + rect.height + ' }');
	gridGroup.appendChild(createShape('line', {
		"id"		: 'vline',
		"x1"		: pos.x,
		"y1"		: 0,
		"x2"		: pos.x,
		"y2"		: rect.height,
		"class"		: 'gridline'
	}));
	gridGroup.appendChild(createShape('line', {
		"id"		: 'hline',
		"x1"		: 0,
		"y1"		: pos.y,
		"x2"		: rect.width,
		"y2"		: pos.y,
		"class"		: 'gridline'
	}));
	gridGroup.appendChild(createShape('rect', {
		"id"		: 'box',
		"x"		: pos.x - 50,
		"y"		: pos.y - 50,
		"width"		: 100,
		"height"	: 100,
		"class"		: 'box'
	}));
	selectedPoint = {
		x: pos.x,
		y: pos.y
	};
}

// update point
function updatePoint(pos) {
	let box = document.getElementById('box');
	assignAttr(box, {
		x: pos.x - (box.getAttribute("width") / 2),
		y: pos.y - (box.getAttribute("height") / 2)
	});
	let vline = document.getElementById('vline');
	assignAttr(vline, {
		x1: pos.x,
		x2: pos.x
	});
	let hline = document.getElementById('hline');
	assignAttr(hline, {
		y1: pos.y,
		y2: pos.y
	});
	selectedPoint = {
		x: pos.x,
		y: pos.y
	};
}

// delete point
function deletePoint() {
	if(selectedPoint) {
		gridGroup.removeChild(document.getElementById('box'));
		gridGroup.removeChild(document.getElementById('vline'));
		gridGroup.removeChild(document.getElementById('hline'));
		selectedPoint = null;
	}
}

// create link
function createLink(pos) {
	let id = Math.random() * 10;
	linkGroup.appendChild(createShape('line', {
		"id"		: id,
		"x1"		: pos.x,
		"y1"		: pos.y,
		"x2"		: pos.x,
		"y2"		: pos.y,
		"class"		: "link"
	}));
	currentLine = id;
	frameCounter = 0;
}

// delete link
function deleteLink() {
	linkGroup.removeChild(document.getElementById(currentLine));
	currentLine = null;
}

// commit node
function commitNode(id, pos) {
	model.updateNode(id, pos);
}

// update node
function updateNode(id, pos) {
	if(nodes[id]) {
		// render updated node
		let node = document.getElementById(id);
		assignAttr(node, {
			x: pos.x,
			y: pos.y
		});
		// render update links on node
		for(let linkId in nodes[id].links) {
			let link = document.getElementById(linkId);
			if(links[linkId].src == id) {
				assignAttr(link, {
					x1: pos.x,
					y1: pos.y
				});
			} else {
				assignAttr(link, {
					x2: pos.x,
					y2: pos.y
				});
			}
		}
	}
}

function addLink(src, dst) {
	let id = model.createLink(src, dst);
	if(id) {
		let srcPos = {
			x: document.getElementById(src).getAttribute("x"),
			y: document.getElementById(src).getAttribute("y")
		};
		console.log('addLink: SRC ' + srcPos.x + ':' + srcPos.y);
		let dstPos = {
			x: document.getElementById(dst).getAttribute("x"),
			y: document.getElementById(dst).getAttribute("y")
		};
		console.log('addLink: DST ' + dstPos.x + ':' + dstPos.y);
		linkGroup.appendChild(createShape('line', {
			"id"		: id,
			"x1"		: srcPos.x,
			"y1"		: srcPos.y,
			"x2"		: dstPos.x,
			"y2"		: dstPos.y,
			"class"		: 'link'
		}));
	}
}

// create <use>
function createUse(type, attributes) {
	var aUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	aUse.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#' + type);
	for(let key in attributes) {
		aUse.setAttribute(key, attributes[key]);
	}
	return aUse;
}

// create shape
function createShape(type, attributes) {
	var shape = document.createElementNS('http://www.w3.org/2000/svg', type);
	for(let key in attributes) {
		shape.setAttribute(key, attributes[key]);
	}
	return shape;
}

// map attributes
function assignAttr(o, a) {
	for(let i in a) {
		o.setAttributeNS(null, i, a[i])
	}
}

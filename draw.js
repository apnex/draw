/*
Draw provides a visual canvas and API for rendering SVG elements to the DOM
*/

// main class
class Draw {
	constructor(model, layout) {
		console.log('INIT new { DRAW }');
		//import grid from './grid.js';
		//import model from './model.js';
		this.state = {
			model: model,
			layout: layout,
			groups: {
				nodes: document.getElementById('nodes'),
				dock: document.getElementById('groups'),
				links: document.getElementById('links'),
				grid: document.getElementById('grid'),
				point: document.getElementById('point')
			}
		};

		// work out screen size, layout gap, and create intermediate grid point dimensions
		// rework - to be a dedicated model, with its own snap points (getNearestPoint)
		let root = document.getElementById('container');
		let rect = root.getBoundingClientRect();
		console.log('[ BUILD ]: grid { ' + rect.width + ':' + rect.height + ' }');

		let gridSize = {
			x: Math.floor(rect.width / (layout.gap.x / 2)),
			y: Math.floor(rect.height / (layout.gap.y / 2))
		};
		console.log('GRIDSIZE: ' + gridSize.x + ':' + gridSize.y);

		// create and hide grid points
		// move this to a layer object
		this.hideGrid();
		let groups = this.state.groups;
		for(let y = 0; y < gridSize.y; y++) {
			for(let x = 0; x < gridSize.x; x++) {
				let pos = {x, y};
				groups.grid.appendChild(this.createShape('circle', {
					"r"	: 6,
					"cx"	: layout.getGroupCoord(pos).x,
					"cy"	: layout.getGroupCoord(pos).y,
					"class"	: 'gridPoints'
				}));
			}
		}

		// create and hide node point
		this.hidePoint();
		this.createPoint({x: 0, y: 0});

		// create and hide group point
		//this.hideGroupPoint();
		this.createGroupPoint({x: 0, y: 0});
	}
	addLink(src, dst) {
		let model = this.state.model;
		let groups = this.state.groups;
		let id = model.createLink(src, dst);
		if(id) {
			let srcPos = {
				x: document.getElementById(src).getAttribute("x"),
				y: document.getElementById(src).getAttribute("y")
			};
			console.log('[ DRAW ]: addLink: SRC ' + srcPos.x + ':' + srcPos.y);
			let dstPos = {
				x: document.getElementById(dst).getAttribute("x"),
				y: document.getElementById(dst).getAttribute("y")
			};
			console.log('[ DRAW ]: addLink: DST ' + dstPos.x + ':' + dstPos.y);
			groups.links.appendChild(this.createShape('line', {
				"id"		: id,
				"x1"		: srcPos.x,
				"y1"		: srcPos.y,
				"x2"		: dstPos.x,
				"y2"		: dstPos.y,
				"class"		: 'link'
			}));
		}
		return id;
	}
	createLink(pos) {
		let groups = this.state.groups;
		let id = Math.random() * 10;
		console.log('[ DRAW ]: createLink: SRC ' + pos.x + ':' + pos.y);
		groups.links.appendChild(this.createShape('line', {
			"id"		: id,
			"x1"		: pos.x,
			"y1"		: pos.y,
			"x2"		: pos.x,
			"y2"		: pos.y,
			"class"		: "link"
		}));
		return id;
	}
	deleteLink(id) {
		let groups = this.state.groups;
		groups.links.removeChild(document.getElementById(id));
	}
	createNode(kind, pos, tag) {
		let model = this.state.model;
		let groups = this.state.groups;
		let layout = this.state.layout;
		let id = model.createNode(kind, pos, tag);
		groups.nodes.appendChild(this.createUse(kind, {
			"id"	: id,
			"x"	: layout.getCoord(pos).x,
			"y"	: layout.getCoord(pos).y,
			"class"	: 'mof'
		}));
		return id;
	}
	showGrid() {
		let groups = this.state.groups;
		groups.grid.setAttribute('visibility', 'visible');
	}
	hideGrid() {
		let groups = this.state.groups;
		groups.grid.setAttribute('visibility', 'hidden');
	}
	showPoint(pos) {
		let groups = this.state.groups;
		groups.point.setAttribute('visibility', 'visible');
		if(pos) {
			this.updatePoint(pos);
		}
	}
	hidePoint() {
		let groups = this.state.groups;
		groups.point.setAttribute('visibility', 'hidden');
	}
	createPoint(pos) { // change to show/hide mechanism
		let root = document.getElementById('container');
		let rect = root.getBoundingClientRect();
		let groups = this.state.groups;
		console.log('[ CREATE ]: point { ' + rect.width + ':' + rect.height + ' }');
		this.state.currentPoint = {
			x: pos.x,
			y: pos.y
		};
		groups.point.appendChild(this.createShape('line', {
			"id"		: 'vline',
			"x1"		: pos.x,
			"y1"		: 0,
			"x2"		: pos.x,
			"y2"		: rect.height,
			"class"		: 'gridline'
		}));
		groups.point.appendChild(this.createShape('line', {
			"id"		: 'hline',
			"x1"		: 0,
			"y1"		: pos.y,
			"x2"		: rect.width,
			"y2"		: pos.y,
			"class"		: 'gridline'
		}));
		groups.point.appendChild(this.createShape('rect', {
			"id"		: 'box',
			"x"		: pos.x - 50,
			"y"		: pos.y - 50,
			"width"		: 100,
			"height"	: 100,
			"class"		: 'box'
		}));
	}
	updatePoint(pos) {
		let layout = this.state.layout;
		let nearestPos = layout.getNearestPoint(pos);
		let currentPos = this.state.currentPoint;
		if(!layout.isSamePos(currentPos, nearestPos)) {
			//console.log('[ UPDATE POINT ]: ' + nearestPos);
			let box = document.getElementById('box');
			this.assignAttr(box, {
				x: pos.x - (box.getAttribute("width") / 2),
				y: pos.y - (box.getAttribute("height") / 2)
			});
			let vline = document.getElementById('vline');
			this.assignAttr(vline, {
				x1: pos.x,
				x2: pos.x
			});
			let hline = document.getElementById('hline');
			this.assignAttr(hline, {
				y1: pos.y,
				y2: pos.y
			});
			this.state.currentPoint.x = nearestPos.x;
			this.state.currentPoint.y = nearestPos.y;
		}
	}
	createGroupPoint(pos) {
		let layout = this.state.layout;
		let groups = this.state.groups;
		console.log('[ CREATE ]: GroupPoint');
		this.state.currentGroupPoint = {
			x: pos.x,
			y: pos.y
		};
		groups.grid.appendChild(this.createShape('circle', {
			"id"	: 'groupPoint',
			"r"	: 10,
			"cx"	: layout.getGroupCoord(pos).x,
			"cy"	: layout.getGroupCoord(pos).y,
			"class"	: 'box'
		}));
	}
	updateGroupPoint(pos) {
		let layout = this.state.layout;
		let nearestPos = layout.getNearestGroupPoint(pos);
		//let currentPos = this.state.currentPoint;
		//if(!layout.isSamePos(currentPos, nearestPos)) {
			//console.log('[ UPDATE POINT ]: ' + nearestPos);
		let point = document.getElementById('groupPoint');
		this.assignAttr(point, {
			cx: nearestPos.x,
			cy: nearestPos.y
		});
		this.state.currentGroupPoint.x = nearestPos.x;
		this.state.currentGroupPoint.y = nearestPos.y;
		//}
	}
	createShape(type, attributes) {
		let shape = document.createElementNS('http://www.w3.org/2000/svg', type);
		for(let key in attributes) {
			shape.setAttribute(key, attributes[key]);
		}
		return shape;
	}
	createUse(type, attributes) {
		let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		use.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#' + type);
		for(let key in attributes) {
			use.setAttribute(key, attributes[key]);
		}
		return use;
	}
	assignAttr(o, a) {
		for(let i in a) {
			o.setAttributeNS(null, i, a[i])
		}
	}
}

// create instance
const createInstance = function(model, layout) {
	const instance = new Draw(model, layout);
	instance.model = instance.state.model;
	instance.layout = instance.state.layout;
	instance.groups = instance.state.groups;
	return instance;
};

// export
//const draw = createInstance();
//export default draw;
export default createInstance;

/*
Engineer provides a visual platform and API for rendering nodes, links and zones
Contains logic to combine structure (Model), layout (Layout) and classes (Style) for rendering
Does not directly handle DOM objects, interactivity or listener events - painter.js + context.js do this
Import/Export is handled as an extension via loader.js
*/

// main class
import contextFactory from './context.js';
import loader from './loader.js';
import painterFactory from './painter.js';
const painter = painterFactory('canvas');

class Engineer {
	constructor(model, layout, iconset) {
		console.log('INIT new { ENGINEER }');
		this.state = {
			model: model,
			layout: layout,
			iconset: iconset,
			groups: {
				nodes: document.getElementById('nodes'),
				zones: document.getElementById('zones'),
				links: document.getElementById('links'),
				grid: document.getElementById('grid'),
				point: document.getElementById('point')
			}
		};

		// context testing
		this.context = contextFactory(document, model);

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
				// painter.createCircle(id, spec); // move to painter
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
	importDiagram(spec) {
		loader.importDiagram(this, spec);
	}
	exportDiagram(fileName = 'diagram-save.js') {
		loader.exportDiagram(this.state.model.state, fileName);
	}
	addLink(src, dst) {
		let model = this.state.model;
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
			return painter.createLine(id, {
				"class"		: 'link',
				"x1"		: srcPos.x,
				"y1"		: srcPos.y,
				"x2"		: dstPos.x,
				"y2"		: dstPos.y
			}, 'links');
		}
	}
	createLink(pos) {
		let id = Math.random() * 10;
		console.log('[ DRAW ]: createLink: SRC++ ' + pos.x + ':' + pos.y);
		return painter.createLine(id, {
			"class"		: 'link',
			"x1"		: pos.x,
			"y1"		: pos.y,
			"x2"		: pos.x,
			"y2"		: pos.y
		}, 'links');
	}
	updateLink(id, pos) {
		let line = document.getElementById(id);
		this.assignAttr(line, {
			x2: pos.x,
			y2: pos.y
		});
	}
	deleteLink(id) {
		let groups = this.state.groups;
		groups.links.removeChild(document.getElementById(id));
	}
	drawZone(spec) {
		console.log('[ DRAW ]: drawZone: ID[' + spec.id + '] POS1[ ' + spec.pos1.x + ':' + spec.pos1.y + ' ] POS2[ ' + spec.pos2.x + ':' + spec.pos2.y + ' ]');
		let box = this.resolveBox(spec.pos1, spec.pos2);
		// normalise box points - move to painter?
		// update resolveBox to return 3 points and 2 values - topLeft, center, bottomRight, height, width
		return painter.createRect(spec.id, {
			"class"		: spec.class,
			"x"		: box.x,
			"y"		: box.y,
			"width"		: box.width,
			"height"	: box.height
		}, 'zones');
	}
	addZone(spec) { // create and draw zone
		let model = this.state.model;

		// instance within model
		let id = model.createZone(spec.pos1, spec.pos2, spec.type, spec.tags);

		// render to canvas
		this.drawZone({
			id,
			class	: spec.class,
			pos1	: spec.pos1,
			pos2	: spec.pos2
		});
		return id;
	}
	resolveBox(pos1, pos2) { // move to painter?
		// work out size + shift
		let height = Math.abs(pos2.y - pos1.y);
		let width = Math.abs(pos2.x - pos1.x);
		let xshift = (pos1.x > pos2.x) ? width : 0;
		let yshift = (pos1.y > pos2.y) ? height : 0;
		return {
			"x"	: pos1.x - xshift,
			"y"	: pos1.y - yshift,
			width, height
		};
	}
	updateZone(id, pos1, pos2) {
		let zone = document.getElementById(id);
		this.assignAttr(zone, this.resolveBox(pos1, pos2));
		return zone;
	}
	commitZone(id, pos1, pos2) { // rework - move to model.validZone() ?
		this.deleteZone(id); // remove temp liveZone
		let model = this.state.model;
		let zoneSize = this.resolveBox(pos1, pos2); // mode to ManagedObject(zone)
		if(!(zoneSize.width == 0 || zoneSize.height == 0)) { // check if valid, then add to model+page
			console.log('[ DRAW ]: commitZone - [' + pos1.x + ':' + pos1.y + ']-[' + pos2.x + ':' + pos2.y + ']');
			this.addZone({
				type	: 'zone',
				class	: 'zone',
				pos1	: pos1,
				pos2	: pos2,
				tags	: {
					enable: true
				}
			});
		}
	}
	deleteZone(id) {
		let model = this.state.model;
		let groups = this.state.groups;
		let zone = document.getElementById(id);
		if(zone) { // validate zone exists before delete
			groups.zones.removeChild(zone);
			return model.deleteZone(id);
		}
	}
	createNode(type, pos, tag) {
		// creates new node in model and renders to canvas
		let model = this.state.model;
		let iconset = this.state.iconset;
		let id = model.createNode(type, pos, tag);
		return painter.createIcon(id, {
			"type"	: type,
			"class"	: iconset.icons[type].class.mouseout,
			"x"	: pos.x,
			"y"	: pos.y
		}, 'nodes');
	}
	updateNode(id, pos) {
		let nodes = this.state.model.nodes;
		let links = this.state.model.links;
		if(nodes[id]) {
			// render updated node
			let node = document.getElementById(id);
			this.assignAttr(node, {
				x: pos.x,
				y: pos.y
			});
			// render update links on node
			for(let linkId in nodes[id].links) {
				let link = document.getElementById(linkId);
				if(links[linkId].src == id) {
					this.assignAttr(link, {
						x1: pos.x,
						y1: pos.y
					});
				} else {
					this.assignAttr(link, {
						x2: pos.x,
						y2: pos.y
					});
				}
			}
		}
	}
	commitNode(id, pos) {
		// commits node to model
		let model = this.state.model;
		/* Node Validation before commit? Check if 2 nodes collide perhaps - update 'layout' to include a 'stack' for multiple nodes on a 'cell'
		if(box.getAttribute("height") == 0 || box.getAttribute("width") == 0) { // invalid so delete
			this.deleteBox(id);
		}
		*/
		this.updateNode(id, pos);
		model.updateNode(id, pos);
	}
	deleteNode(id) {
		let model = this.state.model;
		let groups = this.state.groups;
		let nodes = model.nodes;
		Object.keys(nodes[id].links).forEach((link) => {
			groups.links.removeChild(document.getElementById(link));
		});
		groups.nodes.removeChild(document.getElementById(id));
		model.deleteNode(id);
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
	createPoint(pos) { // change to show/hide mechanism - turn into a managed widget with self.functions()
		let root = document.getElementById('container');
		let rect = root.getBoundingClientRect();
		let groups = this.state.groups;
		let layout = this.state.layout;
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
			"x"		: pos.x - layout.offset.x,
			"y"		: pos.y - layout.offset.y,
			"width"		: layout.gap.x,
			"height"	: layout.gap.y,
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
const createInstance = function(model, layout, iconset) {
	const instance = new Engineer(model, layout, iconset);
	instance.model = instance.state.model;
	instance.layout = instance.state.layout;
	instance.groups = instance.state.groups;
	instance.iconset = instance.state.iconset;
	return instance;
};

// export
export default createInstance;

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
		console.log('[ ENGINEER ]: build grid { ' + rect.width + ':' + rect.height + ' }');

		let gridSize = {
			x: Math.floor(rect.width / (layout.gap.x / 2)),
			y: Math.floor(rect.height / (layout.gap.y / 2))
		};
		console.log('[ ENGINEER ]: grid.size: ' + gridSize.x + ':' + gridSize.y);

		// create and hide grid points
		// move to layer object
		this.hideGrid();
		let groups = this.state.groups;
		for(let y = 0; y < gridSize.y; y++) {
			for(let x = 0; x < gridSize.x; x++) {
				painter.createCircle(null, {
					"class"	: 'gridPoints',
					"r"	: 6,
					"cx"	: layout.getGroupCoord({x, y}).x,
					"cy"	: layout.getGroupCoord({x, y}).y
				}, 'grid');
			}
		}

		// create and hide node point
		// move to layer object
		this.hidePoint();
		this.createPoint({x: 0, y: 0});

		// create and hide group point
		// move to layer object
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
			/*
			let srcPos = {
				x: document.getElementById(src).getAttribute("x"),
				y: document.getElementById(src).getAttribute("y")
			};
			console.log('[ ENGINEER ]: addLink: SRC ' + srcPos.x + ':' + srcPos.y);
			let dstPos = {
				x: document.getElementById(dst).getAttribute("x"),
				y: document.getElementById(dst).getAttribute("y")
			};
			console.log('[ ENGINEER ]: addLink: DST ' + dstPos.x + ':' + dstPos.y);
			*/
			let srcPos = {
				x: painter.getElement(src).getAttribute("x"),
				y: painter.getElement(src).getAttribute("y")
			};
			console.log('[ ENGINEER ]: addLink: SRC ' + srcPos.x + ':' + srcPos.y);
			let dstPos = {
				x: painter.getElement(dst).getAttribute("x"),
				y: painter.getElement(dst).getAttribute("y")
			};
			console.log('[ ENGINEER ]: addLink: DST ' + dstPos.x + ':' + dstPos.y);
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
		console.log('[ ENGINEER ]: createLink: SRC++ ' + pos.x + ':' + pos.y);
		return painter.createLine(id, {
			"class"		: 'link',
			"x1"		: pos.x,
			"y1"		: pos.y,
			"x2"		: pos.x,
			"y2"		: pos.y
		}, 'links');
	}
	updateLink(id, pos) {
		return painter.updateLine(id, {
			"x2"	: pos.x,
			"y2"	: pos.y
		});
	}
	deleteLink(id) {
		return painter.deleteLine(id);
	}
	drawZone(spec) {
		console.log('[ ENGINEER ]: drawZone: ID[' + spec.id + '] POS1[ ' + spec.pos1.x + ':' + spec.pos1.y + ' ] POS2[ ' + spec.pos2.x + ':' + spec.pos2.y + ' ]');
		let box = this.resolveBox(spec.pos1, spec.pos2);
		// normalise box points - move to painter?
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
		let id = model.createZone(spec.pos1, spec.pos2, spec.type, spec.tags);
		this.drawZone({
			id,
			class	: spec.class,
			pos1	: spec.pos1,
			pos2	: spec.pos2
		});
		return id;
	}
	resolveBox(pos1, pos2) { // move to painter?
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
		let box = this.resolveBox(pos1, pos2);
		return painter.updateRect(id, {
			"x"		: box.x,
			"y"		: box.y,
			"width"		: box.width,
			"height"	: box.height
		});
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
		if(painter.deleteRect(id)) {
			return model.deleteZone(id);
		}
	}
	createNode(type, pos, tag) {
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
			// render update icon
			painter.updateIcon(id, {
				"x"	: pos.x,
				"y"	: pos.y
			});
			// render update links on icon
			for(let linkId in nodes[id].links) {
				let link = links[linkId];
				if(link.src == id) {
					painter.updateLine(link.id, {
						"x1"	: pos.x,
						"y1"	: pos.y
					});
				} else {
					painter.updateLine(link.id, {
						"x2"	: pos.x,
						"y2"	: pos.y
					});
				}
			};
			return id;
		}
	}
	commitNode(id, pos) { // validate cell location?
		let model = this.state.model;
		if(this.updateNode(id, pos)) {
			return model.updateNode(id, pos);
		}
	}
	deleteNode(id) {
		let model = this.state.model;
		let nodes = model.nodes;
		if(painter.deleteIcon(id)) {
			Object.keys(nodes[id].links).forEach((linkId) => {
				painter.deleteLine(linkId);
			});
			return model.deleteNode(id);
		}
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
		let layout = this.state.layout;
		console.log('[ ENGINEER ]: point.create { ' + rect.width + ':' + rect.height + ' }');
		this.state.currentPoint = {
			x: pos.x,
			y: pos.y
		};
		painter.createLine('vline', {
			"class"	: 'gridline',
			"x1"	: pos.x,
			"y1"	: 0,
			"x2"	: pos.x,
			"y2"	: rect.height
		}, 'point');
		painter.createLine('hline', {
			"class"	: 'gridline',
			"x1"	: 0,
			"y1"	: pos.y,
			"x2"	: rect.width,
			"y2"	: pos.y
		}, 'point');
		painter.createRect('box', {
			"class"		: 'box',
			"x"		: pos.x - layout.offset.x,
			"y"		: pos.y - layout.offset.y,
			"width"		: layout.gap.x,
			"height"	: layout.gap.y
		}, 'point');
	}
	updatePoint(pos) {
		let layout = this.state.layout;
		let nPos = layout.getNearestPoint(pos);
		let cPos = this.state.currentPoint;
		if(!layout.isSamePos(cPos, nPos)) {
			painter.updateLine('vline', {
				"x1"	: nPos.x,
				"x2"	: nPos.x
			});
			painter.updateLine('hline', {
				"y1"	: nPos.y,
				"y2"	: nPos.y
			});
			painter.rect.center('box', nPos);
			this.state.currentPoint.x = nPos.x;
			this.state.currentPoint.y = nPos.y;
		}
	}
	createGroupPoint(pos) {
		let layout = this.state.layout;
		let groups = this.state.groups;
		console.log('[ ENGINEER ]: createGroupPoint');
		this.state.currentGroupPoint = {
			x: pos.x,
			y: pos.y
		};
		painter.createCircle('groupPoint', {
			"class"	: 'box',
			"r"	: 10,
			"cx"	: layout.getGroupCoord(pos).x,
			"cy"	: layout.getGroupCoord(pos).y
		}, 'grid');
	}
	updateGroupPoint(pos) {
		let layout = this.state.layout;
		let nPos = layout.getNearestGroupPoint(pos);
		let point = document.getElementById('groupPoint');
		painter.assignAttr(point, {
			cx: nPos.x,
			cy: nPos.y
		});
		this.state.currentGroupPoint.x = nPos.x;
		this.state.currentGroupPoint.y = nPos.y;
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

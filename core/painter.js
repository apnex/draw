/*
Painter provides a low-level API for rendering raw SVG elements to the DOM
Does not maintain separate state, it instead directly queries and translates to/from the DOM
Has no knowledge of Model or Grid
Uses raw pixel coordinate space
Supports <use>, <rect>, <line>, <path>
*/

// main class
class Painter {
	constructor(container) {
		console.log('INIT new { PAINTER }');
		let root = document.getElementById(container);
		let screen = root.getBoundingClientRect();
		console.log('[ PAINTER ]: container [ ' + container + ' ] screen { ' + screen.width + ':' + screen.height + ' }');
	}
	get(id) {
		// returns the normalised JSON definition of element
	}
	getElement(id) {
		let element = document.getElementById(id);
		return element;
	}
	createLine(id, spec, groupId) {
		console.log('[ PAINTER ]: line.create[ ' + id + ' ]: SRC[ ' + spec.x1 + ':' + spec.y1 + ' ] DST[ ' + spec.x2 + ':' + spec.y2 + ' ]');
		let group = document.getElementById(groupId);
		group.appendChild(this.renderShape('line', {
			"id"		: id,
			"class"		: spec.class,
			"x1"		: spec.x1,
			"y1"		: spec.y1,
			"x2"		: spec.x2,
			"y2"		: spec.y2
		}));
		return id;
	}
	updateLine(id, spec) {
		return this.update(id, spec);
	}
	deleteLine(id) {
		console.log('[ PAINTER ]: line.delete[ ' + id + ' ]');
		return this.delete(id);
	}
	createRect(id, spec, groupId) {
		console.log('[ PAINTER ]: rect.create[ ' + id + ' ] POS[ ' + spec.x + ':' + spec.y + ' ] WIDTH[ ' + spec.width + ' ] HEIGHT[ ' + spec.height + ' ]');
		let group = document.getElementById(groupId);
		group.appendChild(this.renderShape('rect', {
			"id"		: id,
			"class"		: spec.class,
			"x"		: spec.x,
			"y"		: spec.y,
			"width"		: spec.width,
			"height"	: spec.height
		}));
		return id;
	}
	updateRect(id, spec) {
		return this.update(id, spec);
	}
	deleteRect(id) {
		console.log('[ PAINTER ]: rect.delete[ ' + id + ' ]');
		return this.delete(id);
	}
	update(id, spec) {
		let element = document.getElementById(id);
		if(element) {
			this.assignAttr(element, spec);
			return id;
		}
	}
	delete(id) {
		let element = document.getElementById(id);
		if(element) {
			let parent = element.parentNode;
			if(parent) {
				parent.removeChild(element);
				return id;
			}
		}
	}
	createIcon(id, spec, groupId) {
		console.log('[ PAINTER ]: icon.create[ ' + id + ' ] POS[ ' + spec.x + ':' + spec.y + ' ]');
		let group = document.getElementById(groupId);
		group.appendChild(this.renderUse(spec.type, {
			"id"	: id,
			"class"	: spec.class,
			"x"	: spec.x,
			"y"	: spec.y
		}));
		return id;
	}
	updateIcon(id, spec) {
		return this.update(id, spec);
	}
	deleteIcon(id) {
		console.log('[ PAINTER ]: icon.delete[ ' + id + ' ]');
		return this.delete(id);
	}
	createCircle(id, spec, groupId) {
		//console.log('[ PAINTER ]: circle.create[ ' + id + ' ] POS[ ' + spec.cx + ':' + spec.cy + ' ] RADIUS[ ' + spec.r + ' ]');
		let group = document.getElementById(groupId);
		if(!id) {
			id = 'missing';
		}
		group.appendChild(this.renderShape('circle', {
			"id"	: id,
			"class"	: spec.class,
			"r"	: spec.r,
			"cx"	: spec.cx,
			"cy"	: spec.cy
		}));
		return id;
	}
	renderShape(type, a) {
		let element = document.createElementNS('http://www.w3.org/2000/svg', type);
		return this.assignAttr(element, a);
	}
	renderUse(type, a) {
		let element = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		element.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + type);
		return this.assignAttr(element, a);
	}
	assignAttr(o, a, ns = null) {
		for(let key in a) {
			o.setAttributeNS(ns, key, a[key])
		}
		return o;
	}
}

// create instance
const createInstance = function(container) {
	const instance = new Painter(container);
	instance.rect = {
		center: (id, pos) => {
			let element = document.getElementById(id);
			if(element) {
				instance.assignAttr(element, {
					"x": pos.x - (element.getAttribute("width") / 2),
					"y": pos.y - (element.getAttribute("height") / 2)
				})
				return id;
			}
		}
	};
	return instance;
};

// export
export default createInstance;

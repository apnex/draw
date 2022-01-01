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
	getElement(id) {
		let element = document.getElementById(id);
		return element;
	}
	createLine(id, spec, groupId) {
		console.log('[ PAINTER ]: createLine[ ' + id + ' ]: SRC[ ' + spec.x1 + ':' + spec.y1 + ' ] DST[ ' + spec.x2 + ':' + spec.y2 + ' ]');
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
		let element = document.getElementById(id);
		this.assignAttr(element, spec);
		return id;
	}
	deleteLine(id) {
		let element = document.getElementById(id);
		let parent = element.parentNode;
		if(element && parent) {
			parent.removeChild(element);
			return id;
		}
	}
	createRect(id, spec, groupId) {
		console.log('[ PAINTER ]: createRect[' + id + ' ] POS[ ' + spec.x + ':' + spec.y + ' ] WIDTH[ ' + spec.width + ' ] HEIGHT[ ' + spec.height + ' ]');
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
		let element = document.getElementById(id);
		this.assignAttr(element, spec);
		return id;
	}
	deleteRect(id) {
		let element = document.getElementById(id);
		let parent = element.parentNode;
		if(element && parent) {
			parent.removeChild(element);
			return id;
		}
	}
	createIcon(id, spec, groupId) {
		console.log('[ PAINTER ]: createIcon[' + id + ' ] POS[ ' + spec.x + ':' + spec.y + ' ]');
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
		let element = document.getElementById(id);
		this.assignAttr(element, spec);
		return id;
	}
	deleteIcon(id) {
		let element = document.getElementById(id);
		let parent = element.parentNode;
		if(element && parent) {
			parent.removeChild(element);
			return id;
		}
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
	assignAttr(o, a) {
		for(let key in a) {
			o.setAttributeNS(null, key, a[key])
		}
		return o;
	}
}

// create instance
const createInstance = function(container) {
	const instance = new Painter(container);
	return instance;
};

// export
export default createInstance;

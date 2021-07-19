/* MOCK Model
-- Model deals in structure of nodes and links
-- Model does not handle layout or visual coordinate space
-- Should it be aware of Layout ?
nodes = {
	id	= abcdef,
	type	= "router",
	x	= 100,
	y	= 100,
	links	= {
		id	= fedbca,
		peer	= node.id
	}
}
links = {
	id	= fedbca
	src	= node.id
	dst	= node.id
}
*/

// main class
class Model {
	constructor(input, options = {}) {
		console.log('INIT new { MODEL }');
		this.state = {
			nodes: {},
			links: {}
		};
	}
	createNode(kind, pos, tag) {
		let id = Math.random() * 10;
		this.state.nodes[id] = {
			"id"	: id,
			"type"	: kind,
			"tag"	: tag,
			"x"	: pos.x,
			"y"	: pos.y,
			"tags"	: {},
			"links"	: {}
		};
		return id;
	}
	updateNode(id, pos) {
		let nodes = this.state.nodes;
		if(nodes[id]) {
			nodes[id].x = pos.x;
			nodes[id].y = pos.y;
		}
	}
	deleteNode(id) {
		let nodes = this.state.nodes;
		Object.keys(nodes[id].links).forEach((link) => {
			this.deleteLink(link);
		});
		delete(nodes[id]);
		return id;
	}
	createLink(src, dst) {
		if(src != dst) {
			console.log('[ MODEL ]: createLink - ' + src + ' <-> ' + dst);
			let links = this.state.links;
			let nodes = this.state.nodes;
			let id = Math.random() * 10;
			links[id] = {
				"id"	: id,
				"type"	: 'active',
				"src"	: src,
				"dst"	: dst
			};
			if(!nodes[src].links[id]) {
				nodes[src].links[id] = {
					"id"	: id,
					"peer"	: dst
				}
			}
			if(!nodes[dst].links[id]) {
				nodes[dst].links[id] = {
					"id"	: id,
					"peer"	: src
				}
			}
			return id;
		} else {
			return null;
		}
	}
	deleteLink(id) {
		console.log('[ MODEL ]: deleteLink - ' + id);
		let nodes = this.state.nodes;
		let links = this.state.links;
		delete(nodes[links[id].src].links[id]);
		delete(nodes[links[id].dst].links[id]);
		delete(links[id]);
	}
}

// create instance
const createInstance = function() {
	const instance = new Model();
	instance.nodes = instance.state.nodes;
	instance.links = instance.state.links;
	return instance;
};

// export
const model = createInstance();
export default model;

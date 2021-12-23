/* MOCK Model
-- Model deals in structure of nodes and links
-- Model does not handle layout or visual coordinate space
-- Should it be aware of Layout ?
zones = {
	id	= bcdeab,
	type	= "zone"
}
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
			zones: {},
			nodes: {},
			links: {}
		};
	}
	createZone(pos1, pos2, tag) {
		let id = Math.random() * 10;
		console.log('[ MODEL ]: createZone - ' + id);
		this.state.zones[id] = {
			"id"	: id,
			"type"	: 'zone',
			"tag"	: tag,
			"pos1"	: pos1,
			"pos2"	: pos2
		};
		console.log(JSON.stringify(this.state, null, "\t"));
		return id;
	}
	updateZone(id, pos1, pos2) {
		let zones = this.state.zones;
		if(zones[id]) {
			zones[id].pos1 = pos1;
			zones[id].pos2 = pos2;
		}
	}
	deleteZone(id) {
		console.log('[ MODEL ]: deleteZone - ' + id);
		let zones = this.state.zones;
		if(zones[id]) {
			delete(zones[id]);
			return id;
		}
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
	instance.zones = instance.state.zones;
	instance.nodes = instance.state.nodes;
	instance.links = instance.state.links;
	return instance;
};

// export
export default createInstance();

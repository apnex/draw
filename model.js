/* MOCK Model
-- Model deals in structure of nodes and links
-- Model does not handle layout or visual coordinate space
-- Should it be aware of Layout ? No
-- Generates and owns IDs for all managed object kinds [node, link, zone]
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
	createZone(pos1, pos2, type = 'zone', tags) {
		let id = Math.random() * 10;
		console.log('[ MODEL ]: createZone - POS1[ ' + pos1.x + ':' + pos1.y + ' ] + POS2[ ' + pos2.x + ':' + pos2.y + ' ]');
		this.state.zones[id] = {
			id,
			type,
			"pos1"	: pos1,
			"pos2"	: pos2,
			"tags"	: Object.assign({
				enable: true
			}, tags)
		};
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
	createNode(type, pos, tags) {
		let id = Math.random() * 10;
		console.log('[ MODEL ]: createNode - POS[ ' + pos.x + ':' + pos.y + ' ] + TYPE[ ' + type + ' ]');
		this.state.nodes[id] = {
			"id"	: id,
			"type"	: type,
			"x"	: pos.x,
			"y"	: pos.y,
			"tags"	: Object.assign({
				enable: true
			}, tags),
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
	createLink(src, dst, tags) {
		if(src != dst) {
			console.log('[ MODEL ]: createLink - ' + src + ' <-> ' + dst);
			let links = this.state.links;
			let nodes = this.state.nodes;
			let id = Math.random() * 10;
			links[id] = {
				"id"	: id,
				"type"	: 'active',
				"src"	: src,
				"dst"	: dst,
				"tags"	: Object.assign({
					enable: true
				}, tags)
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

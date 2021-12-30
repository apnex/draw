import ky from './lib/ky.min.js';

// main class
class Loader {
	constructor() {
		console.log('INIT new { LOADER }');
		this.state = {};
	}
	importDiagram(draw, spec) {
		// build node index
		let nodes = spec.nodes.reduce((nodes, node) => {
			nodes[node.id] = node;
			return nodes;
		}, {});

		// loop through links and build new nodes/links
		let nodeCache = {};
		spec.links.forEach((link) => {
			let srcNode = nodes[link.src];
			let dstNode = nodes[link.dst];
			if(!nodeCache[srcNode.id]) {
				nodeCache[srcNode.id] = draw.createNode(srcNode.type, { x: srcNode.x, y: srcNode.y }, srcNode.tag);
			}
			if(!nodeCache[dstNode.id]) {
				nodeCache[dstNode.id] = draw.createNode(dstNode.type, { x: dstNode.x, y: dstNode.y }, dstNode.tag);
			}
			draw.addLink(nodeCache[srcNode.id], nodeCache[dstNode.id]);
		});

		// create remaining nodes
		spec.nodes.forEach((node) => {
			if(!nodeCache[node.id]) {
				nodeCache[node.id] = draw.createNode(node.type, { x: node.x, y: node.y }, node.tag);
			}
		});

		// create zones
		spec.zones.forEach((zone) => {
			draw.addZone({
				type	: zone.type,
				class	: 'zone',
				pos1	: zone.pos1,
				pos2	: zone.pos2
			});
		});
	}
	exportDiagram(modelState, fileName = 'diagram-save.json') {
		// generate new model string blob
		let newModel = this.exportModel(modelState);
		let myString = JSON.stringify(newModel, null, "\t");
		let string_blob = new Blob([myString], {'type': "application/json"});
		let blobUrl = URL.createObjectURL(string_blob);

		// download json
		let dLink = document.createElement("a");
		dLink.href = blobUrl;
		dLink.download = "diagram-save.json";
		document.body.appendChild(dLink);
		dLink.click();
		document.body.removeChild(dLink);
	}
	exportModel(modelState) {
		let newModel = {
			nodes: [],
			zones: [],
			links: []
		};
		newModel.nodes = Object.values(modelState.nodes).reduce((result, node) => {
			if(!node.tags.button) {
				result.push({
					id	: node.id,
					type	: node.type,
					x	: node.x,
					y	: node.y
				});
			}
			return result;
		}, []);
		newModel.zones = Object.values(modelState.zones).reduce((result, zone) => {
			if(zone.tags.enable) {
				result.push({
					id	: zone.id,
					type	: zone.type,
					pos1	: zone.pos1,
					pos2	: zone.pos2
				});
			}
			return result;
		}, []);
		newModel.links = Object.values(modelState.links).reduce((result, link) => {
			result.push({
				id	: link.id,
				type	: link.type,
				src	: link.src,
				dst	: link.dst
			});
			return result;
		}, []);
		return newModel;
	}
}

// create instance
const createInstance = function() {
	const instance = new Loader();
	return instance;
};

// export
export default createInstance();

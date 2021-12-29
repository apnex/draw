import ky from './lib/ky.min.js';

// main class
class Loader {
	constructor() {
		console.log('INIT new { LOADER }');
		this.state = {};
	}
	importDiagram(draw, spec) {
		// raw spec
		spec.nodes.forEach((node) => {
			draw.createNode(node.type, { x: node.x, y: node.y }, node.tag);
		});
		/*
		spec.links.forEach((link) => {
			this.addLink(link.src, link.dst);
		});
		*/
		//this.createZone(zonePos1, 'liveZone');
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
			if(node.tag != 'dock') {
				result.push({
					id	: node.id,
					type	: node.type,
					tag	: node.tag,
					x	: node.x,
					y	: node.y
				});
			}
			return result;
		}, []);
		newModel.zones = Object.values(modelState.zones).reduce((result, zone) => {
			result.push({
				id	: zone.id,
				type	: zone.type,
				tag	: zone.tag,
				pos1	: zone.pos1,
				pos2	: zone.pos2
			});
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

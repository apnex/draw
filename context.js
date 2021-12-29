// main class
class Context {
	constructor(document, model) {
		console.log('INIT new { CONTEXT }');
		this.model = model;
		//this.document = document;
		/*
		node = {
			id: 5.159345,
			active: true,
			recent: true
			update: true
		}
		*/
		this.state = {
			nodes: {},
			zones: {},
			links: {}
		};
	}
	activeNodes(active = true, recent = true, update = true, kind = 'nodes') {
		return this.getEntities(active, recent, update, kind);
	}
	activeZones(active = true, recent = true, update = true, kind = 'zones') {
		return this.getEntities(active, recent, update, kind);
	}
	updateNodes(active = false, recent = true, update = true, kind = 'nodes') {
		return this.getEntities(active, recent, update, kind);
	}
	updateZones(active = false, recent = true, update = true, kind = 'zones') {
		return this.getEntities(active, recent, update, kind);
	}
	getEntities(active = true, recent = true, update = true, kind = 'nodes') {
		let lEntities = this.state[kind];
		let mEntities = this.model[kind];
		return Object.values(lEntities).filter((entity) => {
			if(entity.active == active && entity.recent == recent && entity.update == update) {
				return true;
			}
		}).reduce((result, entity) => {
			if(mEntities[entity.id]) { // handles null values
				let managedEntity = mEntities[entity.id];
				managedEntity.setClass = function(style) { // managedEntity to be controlled by draw?
					//console.log('setClass[ ' + style + ' ] on Entity: ' + this.id);
					let currentEntity = document.getElementById(entity.id); // move into node.setClass();
					currentEntity.setAttributeNS(null, "class", style);
				}
				managedEntity.setTag = function(key, value) {
					//console.log('setTag[ ' + key + ':' + value + ' ] on Entity: ' + this.id);
					//this.tags.update = false; // should this sit inside model?
					lEntities[this.id].update = false;
				}
				result.push(mEntities[entity.id]);
			} else {
				delete(lEntities[entity.id]); // clean stale node from local state
			}
			return result;
		}, []);
	}
	mouseover(event) {
		let target = event.target
		/*
		// nodes - update state
		if(this.model.nodes[target.id]) {
			Object.values(this.model.nodes).forEach((entity) => {
				entity.tags.recent = false;
				if(typeof(entity.tags.active) == 'undefined') {
					entity.tags.active = false
				}
				if(typeof(entity.tags.update) == 'undefined') {
					entity.tags.update = false
				}
			});
			this.model.nodes[target.id].tags.active = true;
			this.model.nodes[target.id].tags.recent = true;
			this.model.nodes[target.id].tags.update = true;
		}

		// zones - update state
		if(this.model.zones[target.id]) {
			Object.values(this.model.zones).forEach((entity) => {
				entity.tags.recent = false;
				if(typeof(entity.tags.active) == 'undefined') {
					entity.tags.active = false
				}
				if(typeof(entity.tags.update) == 'undefined') {
					entity.tags.update = false
				}
			});
			this.model.zones[target.id].tags.active = true;
			this.model.zones[target.id].tags.recent = true;
			this.model.zones[target.id].tags.update = true;
		}
		*/

		// nodes - update local state
		if(this.model.nodes[target.id]) {
			Object.keys(this.model.nodes).forEach((id) => {
				if(!this.state.nodes[id]) {
					this.state.nodes[id] = {
						id,
						active: false,
						recent: false,
						update: false
					};
				} else {
					this.state.nodes[id].recent = false;
				}
			});
			this.state.nodes[target.id].active = true;
			this.state.nodes[target.id].recent = true;
			this.state.nodes[target.id].update = true;
		}

		// zones - update local state
		if(this.model.zones[target.id]) {
			Object.keys(this.model.zones).forEach((id) => {
				if(!this.state.zones[id]) {
					this.state.zones[id] = {
						id,
						active: false,
						recent: false,
						update: false
					};
				} else {
					this.state.zones[id].recent = false;
				}
			});
			this.state.zones[target.id].active = true;
			this.state.zones[target.id].recent = true;
			this.state.zones[target.id].update = true;
		}

		//console.log('CONTEXT test - mouseover triggered - NAME: ' + target.nodeName + ' ID: ' + target.id);
		return this;
	}
	mouseout(event) {
		let target = event.target
		// context.js is to have no knowledge of document canvas, purely state - up to main.js to handle it

		// check if target exists in local state and update active + recent
		if(this.state.nodes[target.id]) {
			this.state.nodes[target.id].active = false;
			this.state.nodes[target.id].recent = true;
			this.state.nodes[target.id].update = true;
		}

		if(this.state.zones[target.id]) {
			this.state.zones[target.id].active = false;
			this.state.zones[target.id].recent = true;
			this.state.zones[target.id].update = true;
		}
		//console.log('CONTEXT test - mouseout triggered - NAME: ' + target.nodeName + ' ID: ' + target.id);
		return this;
	}
}

// create instance
const createInstance = function(document, model) {
	const instance = new Context(document, model);
	return instance;
};

// export
export default createInstance;

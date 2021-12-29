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
		}
		*/
		// have active/recent tags get updated in model
		this.state = {
			nodes: {},
			zones: {},
			links: {}
		};
	}
	activeNodes(active = true, recent = true, kind = 'nodes') {
		return this.getEntities(active, recent, kind);
	}
	inactiveNodes(active = false, recent = true, kind = 'nodes') {
		return this.getEntities(active, recent, kind);
	}
	activeZones(active = true, recent = true, kind = 'zones') {
		return this.getEntities(active, recent, kind);
	}
	inactiveZones(active = false, recent = true, kind = 'zones') {
		return this.getEntities(active, recent, kind);
	}
	getEntities(active = true, recent = true, kind = 'nodes') {
		let lEntities = this.state[kind];
		let mEntities = this.model[kind];
		return Object.values(lEntities).filter((entity) => {
			if(entity.active == active && entity.recent == recent) {
				return true;
			}
		}).reduce((result, entity) => {
			if(mEntities[entity.id]) { // handles null values
				let managedEntity = mEntities[entity.id];
				managedEntity.setClass = function(style) {
					//console.log('setClass[ ' + style + ' ] on Entity: ' + this.id);
					let currentEntity = document.getElementById(entity.id); // move into node.setClass();
					currentEntity.setAttributeNS(null, "class", style);
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

		// nodes - update local state
		if(this.model.nodes[target.id]) {
			Object.keys(this.model.nodes).forEach((id) => {
				if(!this.state.nodes[id]) {
					this.state.nodes[id] = {
						id,
						active: false,
						recent: false
					};
				} else {
					this.state.nodes[id].recent = false;
				}
			});
			this.state.nodes[target.id].active = true;
			this.state.nodes[target.id].recent = true;
		}

		// zones - update local state
		if(this.model.zones[target.id]) {
			Object.keys(this.model.zones).forEach((id) => {
				if(!this.state.zones[id]) {
					this.state.zones[id] = {
						id,
						active: false,
						recent: false
					};
				} else {
					this.state.zones[id].recent = false;
				}
			});
			this.state.zones[target.id].active = true;
			this.state.zones[target.id].recent = true;
		}

		//console.log('CONTEXT test - mouseover triggered - NAME: ' + target.nodeName + ' ID: ' + target.id);
		return this;
	}
	mouseout(event) {
		let target = event.target

		// check if target exists in local state and update active + recent
		if(this.state.nodes[target.id]) {
			this.state.nodes[target.id].active = false;
			this.state.nodes[target.id].recent = true;
		}

		if(this.state.zones[target.id]) {
			this.state.zones[target.id].active = false;
			this.state.zones[target.id].recent = true;
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

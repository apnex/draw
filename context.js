// main class
class Context {
	constructor(document, model) {
		console.log('INIT new { CONTEXT }');
		this.model = model;
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
	activeNodes(active = true, recent = true) {
		return this.getNodes(true, true);
	}
	inactiveNodes(active = false, recent = true) {
		return this.getNodes(false, true);
	}
	getNodes(active = true, recent = true) {
		return Object.values(this.state.nodes).filter((node) => {
			if(node.active == active && node.recent == recent) {
				return true;
			}
		}).reduce((nodes, node) => {
			if(this.model.nodes[node.id]) { // handles null values
				nodes.push(this.model.nodes[node.id]);
			} else {
				delete(this.state.nodes[node.id]); // clean stale node from local state
			}
			return nodes;
		}, []);
	}
	mouseover(event) {
		let target = event.target

		// update local state
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
		}

		// check if target exists in local state and update active + recent
		if(this.state.nodes[target.id]) {
			this.state.nodes[target.id].active = true;
			this.state.nodes[target.id].recent = true;
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

// main class
class IconSet {
	constructor(input, options = {}) {
		console.log('INIT new { ICONSET }');
		this.state = {
			icons: {}
		};
	}
	createIcon(kind, styles = {}) {
		this.state.icons[kind] = {
			"kind"		: kind,
			"class"		: styles
		};
		return kind;
	}
	deleteIcon(kind) {
		delete(this.state.icons[kind]);
		return kind;
	}
}

// create instance
const createInstance = function() {
	const instance = new IconSet();
	instance.icons = instance.state.icons;
	return instance;
};

// export
export default createInstance();

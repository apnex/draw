// main class
class Grid {
	constructor(input, options = {}) {
		console.log('INIT new { GRID }');
		this.state = {
			gap: {
				x: 100,
				y: 100
			},
			offset: {
				x: 50,
				y: 50
			}
		};
	}
	getCoord(point) {
		return {
			"x" : (point.x * this.state.gap.x) + this.state.offset.x,
			"y" : (point.y * this.state.gap.y) + this.state.offset.y
		};
	}
	isSamePos(point1, point2) {
	        if(point1.x == point2.x && point1.y == point2.y) {
	                return true;
	        } else {
	                return false;
	        }
	}
	getNearestPoint(pos) {
		return {
			x: (Math.round((pos.x - this.state.offset.x) / this.state.gap.x) * this.state.gap.x) + this.state.offset.x,
			y: (Math.round((pos.y - this.state.offset.y) / this.state.gap.y) * this.state.gap.y) + this.state.offset.y
		};
	}
}

// create instance
const createInstance = function() {
	const instance = new Grid();
	instance.gap = instance.state.gap;
	instance.offset = instance.state.offset;
	return instance;
};

// export
const grid = createInstance();
export default grid;

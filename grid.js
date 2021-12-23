// main class
class Grid {
	constructor(input, options = {}) {
		console.log('INIT new { GRID }');
		this.state = {
			gap: {
				x: 60,
				y: 60
			},
			offset: {
				x: 30,
				y: 30
			}
		};
	}
	getCoord(point) {
		return {
			"x" : (point.x * this.state.gap.x) + this.state.offset.x,
			"y" : (point.y * this.state.gap.y) + this.state.offset.y
		};
	}
	getGroupCoord(point) {
		let gap = {
			x: this.state.gap.x,
			y: this.state.gap.y
		};
		let offset = {
			x: this.state.offset.x - (gap.x / 2),
			y: this.state.offset.y - (gap.y / 2)
		};
		return {
			"x" : (point.x * gap.x) + offset.x,
			"y" : (point.y * gap.y) + offset.y
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
	getNearestGroupPoint(pos) {
		let gap = {
			x: this.state.gap.x,
			y: this.state.gap.y
		};
		let offset = {
			x: this.state.offset.x - (gap.x / 2),
			y: this.state.offset.y - (gap.y / 2)
		};
		return {
			x: (Math.round((pos.x - offset.x) / gap.x) * gap.x) + offset.x,
			y: (Math.round((pos.y - offset.y) / gap.y) * gap.y) + offset.y
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
export default createInstance();

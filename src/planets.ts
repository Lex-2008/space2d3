import { Food, Iron, Radioactives, ResourceCargo, Water } from "./cargo";
import { shuffle, seq } from "./utils";

export type PlanetType = [name: string, buys: typeof ResourceCargo | null, sells: typeof ResourceCargo, color_in: string, color_out: string];

//export const resources = ['water', 'iron', 'food', 'radioactives'];
const planetTypes = (function () {
	const resources = [Water, Iron, Food, Radioactives];
	//var colors = ['blue', 'yellow', 'green', 'red'];
	var planetNamesTable = [ // table: rows: what planet buys; columns: what planet sells; value: planet name
		[null, 'water-mining', 'farming', 'burning'],
		['ice', null, 'hunting', 'fire'],
		['fishy', 'bio-mining', null, 'nuclear'],
		['frozen', 'hot mining', 'ice-farming', null]];

	var ret: PlanetType[] = [
		['ocean', null, Water, 'navy', 'blue'],
		//['dry', Water, null, 'blue', 'white'],
		['mining', null, Iron, 'olive', 'yellow'],
		//['populated', Food, null, 'green', 'lime'],
	];

	for (var buy = 0; buy < 4; buy++) {
		for (var sell = 0; sell < 4; sell++) {
			if (buy == sell) continue;
			ret.push([planetNamesTable[buy][sell] as string, resources[buy], resources[sell], resources[buy].color, resources[sell].color])
		}
	}
	return ret;
})();

export class Planet {
	x: number; y: number;
	type: number;
	name: string;
	buys: typeof ResourceCargo | null;
	sells: typeof ResourceCargo | null;
	color_in: string;
	color_out: string;
	constructor(x: number, y: number, type_n: number) {
		var type = planetTypes[type_n];
		this.x = x;
		this.y = y;
		this.type = type_n;
		this.name = type[0];
		this.buys = type[1];
		this.sells = type[2];
		this.color_in = type[3];
		this.color_out = type[4];
	}
	save(): [number, number, number] {
		return [this.x, this.y, this.type];
	}
}

function isBad(x: number, y: number, size: number) {
	var center = size / 2;
	return x < center + 0.6 && x > center - 0.6 && y < center + 0.6 && y > center - 0.6;
}

export function makePlanets(size: number) {
	var thisPlanetTypes = shuffle(seq(planetTypes.length));
	for (var _n = 0; _n < 100; _n++) {
		var bad = false;
		var ret: [number, number, number][] = [];
		var xx = shuffle(seq(size));
		var yy = shuffle(seq(size));
		// console.log(_n,xx,yy);
		var center = size / 2;
		for (var i = 0; i < size; i++) {
			if (isBad(xx[i] + 0.5, yy[i] + 0.5, size)) {
				bad = true;
			}
			ret.push([xx[i] + 0.5, yy[i] + 0.5, thisPlanetTypes[i]]);
		}
		if (!bad) return ret;
	}
	console.error('should not be here');
	return [];
}

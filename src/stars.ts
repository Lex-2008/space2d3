import { ResourceCargo, isCargoType, isResourceType } from "./cargo.js";
import { planet_size, shipBaseSpeed } from "./const.js";
import { lineCrossesObj } from "./geometry.js";
import { makePlanets, Planet, PlanetData, PlanetType } from "./planets.js";
import { PlayerShip } from "./playerShip.js";
import { types } from "./saveableType.js";
import { Ship, ShipData } from "./ship.js";
import { seq, randomFrom, randomInt, shuffle } from "./utils.js";

// 1. copypaste table from https://www.cssportal.com/css3-color-names/ to vim
// 2. :%s/^\t\([^\t]*\)\t#[^\t]*\t/['\1', /
// 3. :%s/$/],/
// 4. copypaste from vim to JS console, assign to var data=[...]
// 5. use RGBToHSL function from https://css-tricks.com/converting-color-spaces-in-javascript/, modified to return only 'l' as number
// 6. out=data.map(x=>[x[0],RGBToHSL(x[1],x[2],x[3])])
// 7. prompt('',JSON.stringify(out.filter(x=>x[1]>40).map(x=>x[0])))
var starColors = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkGray", "DarkGrey", "DarkKhaki", "DarkOrange", "DarkOrchid", "DarkSalmon", "DarkSeaGreen", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DodgerBlue", "FireBrick", "FloralWhite", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "Goldenrod", "Gray", "GreenYellow", "Grey", "Honeydew", "HotPink", "IndianRed", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenrodYellow", "LightGray", "LightGreen", "LightGrey", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "MediumAquamarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "OldLace", "Orange", "OrangeRed", "Orchid", "PaleGoldenrod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Red", "RosyBrown", "RoyalBlue", "Salmon", "SandyBrown", "Seashell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"];

function mkgrid(star: Star, size: number) {
	var grid: (Star | undefined)[][] = seq(size).map(x => []);
	var center = (size - 1) / 2;
	for (var x = Math.floor(center); x <= Math.ceil(center); x++) {
		for (var y = Math.floor(center); y <= Math.ceil(center); y++) {
			grid[x + 1][y + 1] = star;
		}
	}
	return grid;
}

// function countJobs(planets: Planet[]) {
// 	var data = { 'null': { buys: 0, sells: 0 } };
// 	resources.forEach(x => { data[x] = { buys: 0, sells: 0 } });
// 	planets.forEach((planet: Planet) => { data[String(planet.buys)].buys++; data[String(planet.sells)].sells++ });
// 	var jobs = 0;
// 	resources.forEach(x => { jobs += Math.min(data[x].buys, data[x].sells) });
// 	return jobs;
// }

export interface StarData {
	c: string,
	sz: number,
	// n: number[] | false,
	p: PlanetData[] | false,
	sh: ShipData[] | false,
	// v: boolean,
}

export class Star {
	color: string;
	size: number;
	// visited: boolean;
	// x: number; y: number;
	bright: boolean;
	name: string;
	// neighbours: Directions;
	grid: (Star | Planet | undefined)[][];
	planets: Planet[];
	ships: Ship[];

	constructor(load?: StarData) {
		if (!load) {
			load = {
				c: randomFrom(starColors),
				sz: randomInt(5, 9),
				// n: false,
				p: false,
				sh: false,
				// v: false,
			}

		}
		// TODO: make sure colors don't repeat
		this.color = load.c;
		this.size = load.sz;
		// this.visited = load.v;
		// this.x = this.y = this.size / 2;
		this.bright = false;
		this.name = this.color;
		if (this.size % 2 == 0) {
			this.bright = true;
			this.name = 'bright ' + this.name;
		}
		// this.neighbours = new Directions(this);
		// if (load.n) {
		// 	for (var value of load.n) {
		// 		this.neighbours.add(new Direction(value, this));
		// 	}
		// }
		this.grid = mkgrid(this, this.size);
		if (!load.p) load.p = makePlanets(this.size); //from planets.js
		this.planets = load.p.map(x => Planet.fromJSON(x));
		for (let i = 0; i < this.planets.length; i++) {
			let planet = this.planets[i];
			planet.i = i;
			// add neighbours
			planet.neighbours = shuffle(this.planets.filter(p => p != planet && !this.pathCollides(p, planet)));
			// add planet to grid
			this.grid[Math.floor(planet.x)][Math.floor(planet.y)] = planet;
		}
		if (load.sh) {
			this.ships = load.sh.map(s => {
				if (s.p) return PlayerShip.fromJSON(s, this);
				return Ship.fromJSON(s, this);
			});
			for (let i = 0; i < this.ships.length; i++) {
				this.ships[i].i = i;
				if (this.ships[i].isIntercepting) {
					this.ships[i].interceptingShip = this.ships[load.sh[i].is];
				}
			}
		}
		// this.jobs = countJobs(this.planets);
		this.setRatios();
	}

	// link(other: Star, direction: number | Direction) {
	// 	if (direction instanceof Direction) {
	// 		direction.target = other;
	// 		other.neighbours.link(direction.value + 180, this);
	// 	} else {
	// 		this.neighbours.link(direction, other);
	// 		other.neighbours.link(direction + 180, this);
	// 	}
	// }

	pathCollides(a: Planet, b: Planet): boolean {
		if (lineCrossesObj(a, b, { 'x': this.size / 2, 'y': this.size / 2 }, 0.5)) return true;
		for (var planet of this.planets) {
			if (planet != a && planet != b &&
				lineCrossesObj(a, b, planet, planet_size)) return true;
		}
		return false;
	};

	computeRareResources(planets?: Planet[]) {
		if (planets === undefined) planets = this.planets;
		const producedResources = planets.map(planet => planet.sells);
		const rareResources = Object.values(types).filter(isCargoType).filter(resource => !producedResources.includes(resource));
		const abundantResources = planets.filter(planet => planet.buys === null).map(planet => planet.sells);
		return {
			'exotic': rareResources,
			'abundant': abundantResources
		}
	}

	setRatios() {
		const ar = this.computeRareResources();
		for (let planet of this.planets) {
			if (planet.buys === null) planet.ratio = 2; //gives for free
			else if (ar.abundant.includes(planet.buys)) planet.ratio = 1;
			else if (ar.exotic.includes(planet.buys)) planet.ratio = 2;
			else planet.ratio = 1.4;
		}
	}

	addRandomShips(now: number) {
		this.ships = [];
		for (let i = 0; i < this.planets.length; i++) {
			for (let j = 0; j < i; j++) {
				if (this.planets[i].neighbours.indexOf(this.planets[j]) < 0) continue;
				let s = Ship.randomShip(15);
				const dist = Math.hypot(this.planets[i].x - this.planets[j].x, this.planets[i].y - this.planets[j].y);
				const flyTime = dist / shipBaseSpeed;
				this.planets[i].dispatch(s, now - flyTime);
				this.ships.push(s);
				this.ships.at(-1)!.i = this.ships.length - 1;
			}
		}
	}

	toJSON(): StarData {
		return {
			c: this.color,
			sz: this.size,
			// n: Array.from(this.neighbours).map(x => x.value),
			p: this.planets.map(x => x.toJSON()),
			// v: this.visited,
			sh: this.ships.map(x => x.toJSON()),
		};
	}
}


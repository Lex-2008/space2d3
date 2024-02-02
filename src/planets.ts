import { Cargo, Food, Fuel, Iron, MissionBox, Radioactives, ResourceCargo, Rocket, Water, isCargoType, isMissionBox } from "./cargo";
import { NormalComponent, isCargoBay, isNormalComponentType } from "./components";
import { shipBaseSpeed } from "./const";
import { gs } from "./gameState";
import { Point } from "./geometry";
import { fromJSON, types } from "./saveableType";
import { Ship, ShipData } from "./ship";
import { shuffle, seq, randomFrom, randomInt, assert } from "./utils";

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
		//['mining', null, Iron, 'olive', 'yellow'],
		//['populated', Food, null, 'green', 'lime'],
		['desert', Water, Fuel, 'blue', 'purple'],
		['factory', Iron, Rocket, 'yellow', 'orange'],
		// ['power', Radioactives, Battery, 'red', 'lightblue'],
		['war', Rocket, Fuel, 'orange', 'purple'],
	];

	for (var buy = 0; buy < 4; buy++) {
		for (var sell = 0; sell < 4; sell++) {
			if (buy == sell) continue;
			ret.push([planetNamesTable[buy][sell] as string, resources[buy], resources[sell], resources[buy].color, resources[sell].color])
		}
	}
	return ret;
})();

export type planetInfo = { 'color_in': string, 'color_out': string };

export const planetInfos = (function () {
	let ret: Record<string, planetInfo> = {};
	for (let planet of planetTypes) {
		ret[planet[0]] = { 'color_in': planet[3], 'color_out': planet[4] };
	}
	return ret;
})();

export interface PlanetData {
	'x': number,
	'y': number,
	'tp': number,
	'b'?: ShipData,
	'dd'?: string,
	'dc'?: string,
	'dr'?: number,
	'df'?: number,
	'cc'?: string,
}

export class Planet {
	x: number; y: number;
	i: number; //index in star's list of planets
	type: number;
	name: string;
	buys: typeof ResourceCargo | null;
	sells: typeof ResourceCargo;
	ratio: number; //how many 'sells' resource planet gives for 1 of 'buys' resource
	color_in: string;
	color_out: string;
	neighbours: Planet[];
	base: Ship;
	deliveryMissionDest: string;
	deliveryMissionComponent: typeof NormalComponent;
	deliveryMissionRockets: number;
	deliveryMissionFuel: number;
	cargoMissionComponent: typeof NormalComponent;
	constructor(type_n: number) {
		var type = planetTypes[type_n];
		this.type = type_n;
		this.name = type[0];
		this.buys = type[1];
		this.sells = type[2];
		this.color_in = type[3];
		this.color_out = type[4];
	}
	toJSON(): PlanetData {
		return {
			'x': this.x,
			'y': this.y,
			'tp': this.type,
			'b': this.base.toJSON(),
			'dd': this.deliveryMissionDest,
			'dc': this.deliveryMissionComponent?.id,
			'dr': this.deliveryMissionRockets,
			'df': this.deliveryMissionFuel,
			'cc': this.cargoMissionComponent?.id,
		};
	}

	static fromJSON(data: PlanetData) {
		const planet = new Planet(data.tp);
		planet.x = data.x;
		planet.y = data.y;
		if (data.b) planet.base = Ship.fromJSON(data.b);
		else planet.base = Ship.newBase();
		if (data.dd) planet.deliveryMissionDest = data.dd;
		if (data.dc) planet.deliveryMissionComponent = types[data.dc] as any as typeof NormalComponent;
		if (data.dr) planet.deliveryMissionRockets = data.dr;
		if (data.df) planet.deliveryMissionFuel = data.df;
		if (data.cc) planet.cargoMissionComponent = types[data.cc] as any as typeof NormalComponent;
		return planet;
	}

	toHTML(sayPlanet: boolean, showTimeFrom?: Ship, showBuySell?: boolean) {
		let time = '';
		if (showTimeFrom) {
			let dist = showTimeFrom.distanceTo(this);
			if (dist < 0.01) dist = 0;
			time = ` (${Math.ceil(dist / shipBaseSpeed)} d)`;
		}
		let ret = `${Planet.toHTML(this.name)}${sayPlanet ? ' planet' : ''}${time}`;
		if (showBuySell) ret += `<div class="info">${this.buys ? `wants: ${this.buys.id}` : ''} ${this.sells ? `gives: ${this.sells.id}` : ''}</div>`;
		return ret;
	}

	static toHTML(name: string) {
		const planet = planetInfos[name];
		assert(planet);
		const square = `<span class="colorCircle" style="background: radial-gradient(closest-side, ${planet.color_in}, ${planet.color_out});"></span>`;
		return `${square} <b>${name}</b>`;
	}

	dispatch(ship: Ship, departTime: number) {
		//send the ship in a random direction
		const dest = this.neighbours.shift() as Planet;
		this.neighbours.push(dest);
		ship.planTrip(dest, departTime);
	}
	onEnter() {
		this.deliveryMissionDest = randomFrom(this.neighbours).name;
		const noramalComponentTypes = Object.values(types).filter(isNormalComponentType);
		this.cargoMissionComponent = randomFrom(noramalComponentTypes);
		this.deliveryMissionComponent = randomFrom(noramalComponentTypes);
		const allCargoBays = gs.playerShip.rows.flat().filter(isCargoBay);
		let missionBoxes: MissionBox[] = [];
		for (let cargoBay of allCargoBays) {
			missionBoxes = missionBoxes.concat(cargoBay.cargo.filter(isMissionBox));
		}
		const missionBoxesToHere = missionBoxes.filter(box => box.to === this.name);
		if (missionBoxesToHere.length) {
			const rewardCargos = Math.max(1, Math.floor(missionBoxesToHere.length / 2));
			this.deliveryMissionRockets = randomInt(0, rewardCargos);
			this.deliveryMissionFuel = rewardCargos - this.deliveryMissionRockets;
		}
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
		var ret: PlanetData[] = [];
		var xx = shuffle(seq(size));
		var yy = shuffle(seq(size));
		// console.log(_n,xx,yy);
		var center = size / 2;
		for (var i = 0; i < size; i++) {
			if (isBad(xx[i] + 0.5, yy[i] + 0.5, size)) {
				bad = true;
			}
			ret.push({ 'x': xx[i] + 0.5, 'y': yy[i] + 0.5, 'tp': thisPlanetTypes[i] });
		}
		// Find if three planets next to each other (ordered by x-coord) form a diagonal.
		// i.e. their y-coord differs by +1 or -1
		let dx = ret.sort((a, b) => a.x - b.x);
		for (let i = 1; i < dx.length - 1; i++) {
			let sign = dx[i + 1].y > dx[i - 1].y ? 1 : -1;
			if (dx[i - 1].y + sign == dx[i].y && dx[i].y + sign == dx[i + 1].y)
				bad = true;
		}
		if (!bad) return ret;
	}
	console.error('should not be here');
	return [];
}

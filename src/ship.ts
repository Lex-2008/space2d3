import { Radar } from "./components"
import { cargoPerCargoBay, minDaysAfterIntercept, shipBaseSpeed, shipColors, shipNames } from "./const"
import { GS, gs } from "./gameState"
import { Point } from "./geometry"
import { calcInterceptionTime } from "./interceptionCalc"
import { Interior, InteriorData } from "./interior"
import { Planet } from "./planets"
import { PlayerShip } from "./playerShip"
import { Star } from "./stars"
import { assert, calcColor2, gebi, randomFrom, randomInt, setStatus, shuffle, toPoint } from "./utils"

export let nextShip = 0;
function nextShipData() {
    nextShip++;
    if (nextShip >= shipColors.length) nextShip = 0;
    return { 'color': shipColors[nextShip], 'name': shipNames[nextShip] };
}

export function setNextShip(n: number) { nextShip = n };

export interface ShipData {
    'n': string,
    'c': string,
    'i': InteriorData,
    'frX': number,
    'frY': number,
    'frT': number,
    'toP': number,
    'toT': number,
    'p'?: boolean,
    'on'?: number,
    'ii': boolean,
    'is': number,
    'iX': number,
    'iY': number,
    'iT': number,
}

export class Ship {
    name: string;
    color: string;
    color2: string;
    color3: string;
    i: number;
    interior: Interior;
    // position in space
    x: number
    y: number
    fromPoint: Point
    toPlanet: Planet
    fromTime: number
    toTime: number
    // interception
    isIntercepting: boolean = false
    private _isBeingIntercepted: boolean = false
    interceptingShip: Ship
    interceptionX: number
    interceptionY: number
    interceptionTime: number

    get isBeingIntercepted() { return this._isBeingIntercepted }

    setIsBeingIntercepted(ships?: Ship[]) {
        if (!ships) ships = gs.star.ships;
        this._isBeingIntercepted = !!ships.find(ship => ship.isIntercepting && ship.interceptingShip == this);
    }

    updateSpaceXY(now: number, allowDispatch = true) {
        if (this.isIntercepting) {
            // NOTE: player ship might start interceptiong someone while being intercepted.
            // Then we log a warning that they "got away" (likely they did), and move on.
            assert(this.interceptingShip instanceof PlayerShip || !this.interceptingShip.isIntercepting);
            if (now >= this.interceptionTime) {
                //intercepted!
                // console.log(`${this.name} intercepted ${this.interceptingShip.name} at dist=${this.distanceTo(this.interceptingShip)}`, this, this.interceptingShip);
                assert(this.interceptingShip.toTime > now);
                // Note: next line might move the target ship "back in time" a bit
                this.interceptingShip.updateSpaceXY(this.interceptionTime);
                if (this.interceptingShip.distanceTo({ 'x': this.interceptionX, 'y': this.interceptionY }) > 0.05) {
                    console.warn(`${this.interceptingShip.name} ship got away from ${this.name}, dist `, this.interceptingShip.distanceTo({ 'x': this.interceptionX, 'y': this.interceptionY }));
                    assert(this.interceptingShip instanceof PlayerShip);
                    this.isIntercepting = false;
                    this.interceptingShip.setIsBeingIntercepted();
                    this.fromTime = now;
                    this.fromPoint.x = this.x;
                    this.fromPoint.y = this.y;
                    return;
                }
                // console.log('intercepted1', Math.hypot(this.x - this.interceptingShip.x, this.y - this.interceptingShip.y));
                // console.log('intercepted2', Math.hypot(this.interceptionX - this.interceptingShip.x, this.interceptionY - this.interceptingShip.y));
                this.isIntercepting = false;
                this.interceptingShip.setIsBeingIntercepted();
                this.fromTime = now;
                this.fromPoint.x = this.x = this.interceptingShip.x;
                this.fromPoint.y = this.y = this.interceptingShip.y;
                // TODO: do something
                if (this instanceof PlayerShip) {
                    gs.joinShip(this.interceptingShip);
                    setStatus('ship', 'you_intercepted', this.interceptingShip);
                    gebi('status_ship_you_intercepted_continue').onclick = () => { gs.leaveShip(); };
                }
                else if (this.interceptingShip instanceof PlayerShip) {
                    gs.joinShip(this);
                    setStatus('ship', 'intercepted_uninterested', this);
                    gebi('status_ship_intercepted_uninterested_continue').onclick = () => { gs.leaveShip(); };
                }
            } else {
                const flightProgress = (now - this.fromTime) / (this.interceptionTime - this.fromTime);
                this.x = this.fromPoint.x + (this.interceptionX - this.fromPoint.x) * flightProgress;
                this.y = this.fromPoint.y + (this.interceptionY - this.fromPoint.y) * flightProgress;
            }
        } else {
            while (now >= this.toTime && allowDispatch) {
                assert(!this.isIntercepting);
                assert(!this.isBeingIntercepted);
                this.toPlanet.dispatch(this, this.toTime);
            }
            const flightProgress = (now - this.fromTime) / (this.toTime - this.fromTime);
            this.x = this.fromPoint.x + (this.toPlanet.x - this.fromPoint.x) * flightProgress;
            this.y = this.fromPoint.y + (this.toPlanet.y - this.fromPoint.y) * flightProgress;
        }
    }

    considerIntercept(ships: Ship[], now: number) {
        if (this.isIntercepting || this.isBeingIntercepted) return;
        // consider intercepting someone
        const interceptableShips = shuffle(ships.filter(s => s != this && !s.isIntercepting && !s.isBeingIntercepted && Math.hypot(this.x - s.x, this.y - s.y) > 1 && s.seenBy({ 'x': this.x, 'y': this.y }, this.interior.componentTypes[Radar.id])));
        for (let ship of interceptableShips) {
            // TODO: store vx,vy in ship
            let vx = (ship.toPlanet.x - ship.fromPoint.x) / (ship.toTime - ship.fromTime);
            let vy = (ship.toPlanet.y - ship.fromPoint.y) / (ship.toTime - ship.fromTime);
            let time = calcInterceptionTime(this, ship, { 'x': vx, 'y': vy }, 2 * shipBaseSpeed, now);
            if (time > ship.toTime - minDaysAfterIntercept) continue;
            this.performIntercept(ship, vx, vy, time, now);
            break;
        }
    }

    performIntercept(ship: Ship, vx: number, vy: number, time: number, now: number) {
        // TODO: store vx,vy in ship
        this.isIntercepting = true;
        this.interceptingShip = ship;
        this.toPlanet = ship.toPlanet;
        this.toTime = ship.toTime;
        this.fromTime = now;
        this.fromPoint = { 'x': this.x, 'y': this.y };
        this.interceptionX = ship.x + vx * (time - now);
        this.interceptionY = ship.y + vy * (time - now);
        this.interceptionTime = time;
        ship.setIsBeingIntercepted();
    }

    distanceTo(p: Point) {
        return Math.hypot(this.x - p.x, this.y - p.y);
    }

    planTrip(toPlanet: Planet, fromTime: number) {
        this.fromPoint = toPoint(this);
        this.toPlanet = toPlanet;
        this.fromTime = fromTime;
        const dist = this.distanceTo(toPlanet);
        const flyTime = dist / shipBaseSpeed;
        this.toTime = fromTime + flyTime;
        this.updateSpaceXY(this.fromTime);
        // console.log('planTrip', fromTime, flyTime, dist, fromPlanet.name, toPlanet.name);
    }

    seenBy(pos: Point, myRadars: number) {
        const dist = this.distanceTo(pos);
        return true;// myRadars >= dist + this.componentTypes[Cloak.id];
    }

    toJSON(): ShipData {
        return {
            'n': this.name,
            'c': this.color,
            'i': this.interior.toJSON(),
            'frX': this.fromPoint?.x,
            'frY': this.fromPoint?.y,
            'frT': this.fromTime,
            'toP': this.toPlanet?.i,
            'toT': this.toTime,
            'ii': this.isIntercepting,
            'is': this.interceptingShip?.i,
            'iX': this.interceptionX,
            'iY': this.interceptionY,
            'iT': this.interceptionTime,
        }
    }

    static fromJSON(data: ShipData, star?: Star, ship?: Ship) {
        if (!ship) ship = new Ship();
        ship.name = data.n;
        ship.color = data.c;
        [ship.color2, ship.color3] = calcColor2(data.c.substr(1));
        ship.interior = Interior.fromJSON(data.i, ship);
        ship.fromPoint = { 'x': data.frX, 'y': data.frY };
        ship.fromTime = data.frT;
        ship.toTime = data.toT;
        if (star) ship.toPlanet = star.planets[data.toP];
        if (data.ii) {
            ship.isIntercepting = data.ii;
            ship.interceptionX = data.iX;
            ship.interceptionY = data.iY;
            ship.interceptionTime = data.iT;
        }
        // ship.balanceBallast();
        return ship;
    }

    toHTML(sayShip: boolean, showTimeFrom?: Ship) {
        let time = '';
        if (showTimeFrom) {
            let dist = showTimeFrom.distanceTo(this);
            if (dist < 0.01) dist = 0;
            time = ` (${Math.ceil(dist / shipBaseSpeed)} d)`;
        }
        const square = `<span class="colorBox" style="background:${this.color};border-color:${this.color2}"></span>`;
        // if (sayShip) {
        const type = this.interior.isAlien ? '<i>Alien</i>' : this.interior.isOdd ? '<i>Odd</i>' : '';
        return `${square} ${type}${sayShip ? 'ship ' : ''}<b>${this.name}</b>${time}`;
        // } else {
        //     const type = this.isAlien ? ' (<i>Alien</i>)' : this.rows.length % 2 ? ' (<i>Odd</i>)' : '';
        //     return `${square} <b>${this.name}</b>${type}${time}`;
        // }
    }

    static randomShip(size: number, ship?: Ship) {
        if (ship === undefined) ship = new Ship();
        const data = nextShipData();
        const color = data.color;
        ship.name = data.name;
        ship.color = '#' + color;
        [ship.color2, ship.color3] = calcColor2(color);
        ship.interior = Interior.randomShip(size, ship);
        return ship
    }

    static newBase() {
        const ship = new Ship();
        const color = randomFrom(shipColors);
        ship.color = '#' + color;
        [ship.color2, ship.color3] = calcColor2(color);
        ship.interior = Interior.newBase(ship);
        return ship
    }

}
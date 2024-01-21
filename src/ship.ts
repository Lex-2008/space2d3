import { Cargo, MissionBox, UsefulCargo, isCargoType } from "./cargo"
import { Ballast, CargoBay, Cloak, Component, MissionComputer, NavigationComputer, NormalComponent, Radar, TradingComputer, isCargoBay, isComponentType, isComputerComponentType, isNormalComponentType } from "./components"
import { cargoPerCargoBay, minDaysAfterIntercept, shipBaseSpeed, shipColors, shipNames } from "./const"
import { GS, gs } from "./gameState"
import { Point } from "./geometry"
import { calcInterceptionTime } from "./interceptionCalc"
import { Planet } from "./planets"
import { PlayerShip } from "./playerShip"
import { fromJSON, types } from "./saveableType"
import { Star } from "./stars"
import { assert, calcColor2, gebi, randomFrom, randomInt, setStatus, shuffle, toPoint } from "./utils"

export let nextShip = 0;
function nextShipData() {
    nextShip++;
    if (nextShip >= shipColors.length) nextShip = 0;
    return { 'color': shipColors[nextShip], 'name': shipNames[nextShip] };
}

export function setNextShip(n: number) { nextShip = n };

export interface xywh {
    'x': number,
    'y': number,
    'w': number,
    'h': number
}

export interface ShipData {
    'a': boolean,
    'n': string,
    'c': string,
    'o': number[],
    'r': { 't': string }[][],
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
    isAlien: boolean = false
    rows: Array<Array<Component>> = []
    offsets: Array<number> = []
    componentTypes: { [typeName: string]: number }
    cargoTypes: { [typeName: string]: number }
    freeCargo: number
    i: number
    // next 4 are yet unused, to be used by detach/attach logic
    isPlayerShip: boolean = false
    playerOnShip: boolean = false
    playerX: number
    playerY: number
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
        const interceptableShips = shuffle(ships.filter(s => s != this && !s.isIntercepting && !s.isBeingIntercepted && Math.hypot(this.x - s.x, this.y - s.y) > 1 && s.seenBy({ 'x': this.x, 'y': this.y }, this.componentTypes[Radar.id])));
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

    countComponents() {
        this.componentTypes = {};
        const x = Object.values(types).filter(isComponentType).forEach(
            type => this.componentTypes[type.id] = 0);
        const components = this.rows.flat();
        for (let component of components) {
            this.componentTypes[component.typename]++;
        }
    }

    countCargo() {
        const allCargoBays = this.rows.flat().filter(isCargoBay);
        this.freeCargo = 0;
        this.cargoTypes = {};
        Object.values(types).filter(isCargoType).forEach(
            type => this.cargoTypes[type.id] = 0);
        for (let cargoBay of allCargoBays) {
            this.freeCargo += cargoPerCargoBay - cargoBay.cargo.length;
            for (let cargo of cargoBay.cargo) {
                this.cargoTypes[cargo.typename]++;
                // console.log(`countCargo found ${cargo.typename}, ${this.cargoTypes[cargo.typename]} at ${cargoBay.cellName}`)
            }
        }
    }

    addComponent(component: Component, row: number) {
        component.ship = this;
        // TODO: is isAlien
        if (row < 0) {
            this.rows.unshift([]);
            this.rows.push([]);
            this.offsets.unshift(0);
            this.offsets.push(0);
            row = 0;
        }
        if (row >= this.rows.length) {
            this.rows.unshift([]);
            this.rows.push([]);
            this.offsets.unshift(0);
            this.offsets.push(0);
            row = this.rows.length - 1;
        }
        this.rows[row].push(component);
    }

    getCargo(kind: typeof Cargo, amount: number) {
        // NOTE: can't take more than we have
        if (amount > this.cargoTypes[kind.id]) return false;
        this.cargoTypes[kind.id] -= amount;
        this.freeCargo += amount;
        const allCargoBays = this.rows.flat().filter(isCargoBay).filter(cargoBay => cargoBay.cargo.length);
        // TODO: sort
        for (let cargoBay of allCargoBays) {
            // filter out up to _amount_ items from cargo bays
            // x=2;console.log([1,2,1,3,1,4,1,5].filter(v=>!(v==1&&x-->0)));
            cargoBay.cargo = cargoBay.cargo.filter(cargo => !(cargo instanceof kind && amount-- > 0));
            if (amount <= 0) return true;
        }
    }

    getMissionBox(to: string, amount: number) {
        // NOTE: can't take more than we have
        if (amount > this.cargoTypes[MissionBox.id]) return false;
        this.cargoTypes[MissionBox.id] -= amount;
        this.freeCargo += amount;
        const allCargoBays = this.rows.flat().filter(isCargoBay).filter(cargoBay => cargoBay.cargo.length);
        // TODO: sort
        for (let cargoBay of allCargoBays) {
            // filter out up to _amount_ items from cargo bays
            // x=2;console.log([1,2,1,3,1,4,1,5].filter(v=>!(v==1&&x-->0)));
            cargoBay.cargo = cargoBay.cargo.filter(cargo => !(cargo instanceof MissionBox && cargo.to == to && amount-- > 0));
            if (amount <= 0) return true;
        }
    }

    putCargo(kind: typeof Cargo, amount: number) {
        if (amount > this.freeCargo) return false;
        this.cargoTypes[kind.id] += amount;
        this.freeCargo -= amount;
        const allCargoBays = this.rows.flat().filter(isCargoBay).filter(cargoBay => cargoBay.cargo.length < cargoPerCargoBay);
        // TODO: sort
        for (let cargoBay of allCargoBays) {
            while (amount > 0 && cargoBay.cargo.length < cargoPerCargoBay) {
                cargoBay.cargo.push(new (kind as unknown as new () => Cargo)());
                amount--;
            }
            if (amount <= 0) return true;
        }
    }

    putMissionBox(from: string, to: string, total: number) {
        if (total > this.freeCargo) return false;
        this.cargoTypes[MissionBox.id] += total;
        this.freeCargo -= total;
        const allCargoBays = this.rows.flat().filter(isCargoBay).filter(cargoBay => cargoBay.cargo.length < cargoPerCargoBay);
        // TODO: sort
        let amount = total;
        for (let cargoBay of allCargoBays) {
            while (amount > 0 && cargoBay.cargo.length < cargoPerCargoBay) {
                let box = new MissionBox();
                box.from = from;
                box.to = to;
                box.total = total;
                cargoBay.cargo.push(box);
                amount--;
            }
            if (amount <= 0) return true;
        }
    }

    seenBy(pos: Point, myRadars: number) {
        const dist = this.distanceTo(pos);
        return true;// myRadars >= dist + this.componentTypes[Cloak.id];
    }

    toJSON(): ShipData {
        return {
            'a': this.isAlien,
            'n': this.name,
            'c': this.color,
            'o': this.offsets,
            'r': this.rows.map(row => row.map(component => component.toJSON())),
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
        ship.isAlien = data.a;
        ship.name = data.n;
        ship.color = data.c;
        ship.color2 = '#' + calcColor2(data.c.substr(1));
        ship.offsets = data.o;
        ship.rows = [];
        for (let row = 0; row < data.r.length; row++) {
            ship.rows[row] = [];
            for (let c = 0; c < data.r[row].length; c++) {
                ship.addComponent(fromJSON(data.r[row][c]) as Component, row);
            }
        }
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
        ship.fillBallastOpposite();
        ship.countComponents();
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
        const type = this.isAlien ? '<i>Alien</i>' : this.rows.length % 2 ? '<i>Odd</i>' : '';
        return `${square} ${type}${sayShip ? 'ship ' : ''}<b>${this.name}</b>${time}`;
        // } else {
        //     const type = this.isAlien ? ' (<i>Alien</i>)' : this.rows.length % 2 ? ' (<i>Odd</i>)' : '';
        //     return `${square} <b>${this.name}</b>${type}${time}`;
        // }
    }

    // functions used in drawing
    get gridSize() {
        if (this.isAlien) {
            // TODO
            return {
                'x0': 0,
                'x1': 0,
                'y0': 0,
                'y1': 0,
                'w': 0,
                'h': 0
            }
        } else {
            let max_pos = 0
            let max_neg = 0
            for (let i = 0; i < this.rows.length; i++) {
                max_pos = Math.max(max_pos, this.rows[i].length - this.offsets[i])
                max_neg = Math.max(max_neg, this.offsets[i])
            }
            return {
                'x0': 0,
                'x1': this.rows.length - 1,
                'y0': max_pos,
                'y1': max_neg,
                'w': this.rows.length,
                'h': max_pos + max_neg + 1
            }
        }
    }
    rowToXY(row: number, i: number) {
        if (this.isAlien) {
            // TODO
            return {
                'x': 0,
                'y': 0
            }
        } else {
            if (i >= this.offsets[row]) {
                return {
                    'x': row,
                    'y': 1 + (i - this.offsets[row])
                }
            } else {
                return {
                    'x': row,
                    'y': (i - this.offsets[row])
                }
            }
        }
    }
    get passage(): xywh {
        if (this.isAlien) {
            // TODO
            return {
                'x': 0,
                'y': 0,
                'w': 0,
                'h': 0
            }
        } else {
            return {
                'x': 0,
                'y': 0,
                'w': this.rows.length,
                'h': 1
            }
        }
    }
    oppositeComponent(a: Component) {
        for (let row = 0; row <= this.rows.length; row++) {
            let i = this.rows[row].indexOf(a)
            if (i >= 0) {
                return this.rows[this.rows.length - 1 - row][i]
            }
        }
    }

    static randomShip(size: number, ship?: Ship) {
        const rowCount = 4
        const noramalComponentTypes = Object.values(types).filter(isNormalComponentType);
        const computerTypes = Object.values(types).filter(isComputerComponentType);
        const componentTypes = noramalComponentTypes.concat(computerTypes);
        const cargoTypes = Object.values(types).filter(isCargoType);
        if (ship === undefined) ship = new Ship();
        const data = nextShipData();
        const color = data.color;
        ship.name = data.name;
        ship.color = '#' + color;
        ship.color2 = '#' + calcColor2(color);
        ship.rows = [[], [], [], []]
        ship.offsets = [0, 0, 0, 0]
        for (let i = 0; i < size; i++) {
            let componentType = randomFrom(componentTypes) as unknown as new () => Component
            let component = new componentType()
            if (component instanceof CargoBay) {
                let cargos = randomInt(0, cargoPerCargoBay);
                for (let j = 0; j < cargos; j++) {
                    let cargoType = randomFrom(cargoTypes) as unknown as new () => Cargo
                    component.cargo.push(new cargoType())
                }
            }
            ship.addComponent(component, randomInt(0, rowCount - 1));
        }
        for (let i = 0; i < ship.rows.length; i++) {
            ship.offsets[i] = randomInt(0, ship.rows[i].length)
        }
        ship.balanceBallast()
        ship.countComponents()
        return ship
    }

    static newBase() {
        const ship = new Ship();
        const color = randomFrom(shipColors);
        ship.color = '#' + color;
        ship.color2 = '#' + calcColor2(color);
        ship.rows = [[], [], []];
        const components = shuffle([new NavigationComputer(), new Radar(), new TradingComputer(), new MissionComputer()])
        for (let component of components)
            ship.addComponent(component, randomInt(0, 2));
        ship.offsets = [
            randomInt(0, ship.rows[0].length),
            randomInt(0, ship.rows[1].length),
            randomInt(0, ship.rows[2].length),
        ];
        ship.balanceBallast()
        ship.countComponents()
        return ship
    }

    deBallastTail() {
        // remove extra ballast from tail (top of the ship)
        // Leaves the ship unbalanced, remember to run balanceBallast after
        if (this.isAlien) {
            //...
        } else {
            const max = this.rows.length - 1;
            for (var i = 0; i <= max; i++) {
                while (this.rows[i].at(-1) instanceof Ballast) {
                    this.rows[i].pop();
                }
            }
        }
    }
    balanceBallast() {
        if (this.isAlien) {
            //...
        } else {
            const max = this.rows.length - 1
            // balance offsets
            for (var i = 0; i <= max; i++) {
                while (this.offsets[i] < this.offsets[max - i]) {
                    this.rows[i].unshift(new Ballast())
                    this.offsets[i]++
                }
            }
            // add ballast to balance 
            for (var i = 0; i <= max; i++) {
                while (this.rows[i].length < this.rows[max - i].length) {
                    this.rows[i].push(new Ballast())
                }
            }
            // remove extra ballast from head
            for (var i = 0; i <= max; i++) {
                while (this.rows[i][0] instanceof Ballast
                    && this.rows[max - i][0] instanceof Ballast) {
                    this.rows[i].shift()
                    this.rows[max - i].shift()
                    this.offsets[i]--
                    this.offsets[max - i]++
                }
            }
            // remove extra ballast from tail
            for (var i = 0; i <= max; i++) {
                while (this.rows[i].at(-1) instanceof Ballast
                    && this.rows[max - i].at(-1) instanceof Ballast) {
                    this.rows[i].pop()
                    this.rows[max - i].pop()
                }
            }
            // TODO: remove empty rows?
        }
        this.fillBallastOpposite()
    }

    fillBallastOpposite() {
        // record what's opposite to ballast
        if (this.isAlien) {
            //...
        } else {
            const max = this.rows.length - 1;
            for (var i = 0; i <= max; i++) {
                for (var j = 0; j <= this.rows[i].length; j++) {
                    if (this.rows[i][j] instanceof Ballast) {
                        (this.rows[i][j] as Ballast).opposite = this.rows[max - i][j].typename
                    }
                }
            }
        }
    }
    get topAirlock() {
        // returns x-coordinate 
        // NOTE: putTwoShips assumes that airlock location is always counted from left side,
        // i.e. return value=0 means "leftmost column"
        if (this.isAlien) {
            // TODO
            return 0;
        } else {
            let maxLen = 0
            for (let i = 0; i < this.rows.length; i++) {
                maxLen = Math.max(maxLen, this.rows[i].length - this.offsets[i])
            }
            for (let i = 0; i < this.rows.length; i++) {
                if (this.rows[i].length - this.offsets[i] == maxLen)
                    return i
            }
            return 0 // should never happen
        }
    }
    get bottomAirlock() {
        if (this.isAlien) {
            // TODO
            return 0;
        } else {
            const maxOffset = Math.max(...this.offsets);
            return this.offsets.lastIndexOf(maxOffset);
        }
    }
}
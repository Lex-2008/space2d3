import { Cargo, UsefulCargo, isCargoType } from "./cargo"
import { Ballast, CargoBay, Cloak, Component, NavigationComputer, NormalComponent, Radar, TradingComputer, isCargoBay, isComponentType } from "./components"
import { cargoPerCargoBay, shipBaseSpeed, shipColors } from "./const"
import { Point } from "./geometry"
import { Planet } from "./planets"
import { fromJSON, types } from "./saveableType"
import { Star } from "./stars"
import { randomFrom, randomInt } from "./utils"

export interface xywh {
    'x': number,
    'y': number,
    'w': number,
    'h': number
}

export interface ShipData {
    'a': boolean,
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
}

export class Ship {
    color: string;
    isAlien: boolean = false
    rows: Array<Array<Component>> = []
    offsets: Array<number> = []
    componentTypes: { [typeName: string]: number }
    cargoTypes: { [typeName: string]: number }
    freeCargo: number
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

    updateSpaceXY(now: number, allowDispatch = true) {
        while (now >= this.toTime && allowDispatch) {
            this.toPlanet.dispatch(this, this.toTime);
        }
        const flightProgress = (now - this.fromTime) / (this.toTime - this.fromTime);
        this.x = this.fromPoint.x + (this.toPlanet.x - this.fromPoint.x) * flightProgress;
        this.y = this.fromPoint.y + (this.toPlanet.y - this.fromPoint.y) * flightProgress;
    }

    planTrip(fromPoint: Point, toPlanet: Planet, fromTime: number) {
        this.fromPoint = fromPoint;
        this.toPlanet = toPlanet;
        this.fromTime = fromTime;
        const dist = toPlanet.distanceTo(fromPoint);
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

    seenBy(pos: Point, myRadars: number) {
        const dist = Math.hypot(pos.x - this.x, pos.y - this.y);
        return myRadars >= dist + this.componentTypes[Cloak.id];
    }

    toJSON(): ShipData {
        return {
            'a': this.isAlien,
            'c': this.color,
            'o': this.offsets,
            'r': this.rows.map(row => row.map(component => component.toJSON())),
            'frX': this.fromPoint.x,
            'frY': this.fromPoint.y,
            'frT': this.fromTime,
            'toP': this.toPlanet.i,
            'toT': this.toTime,
        }
    }

    static fromJSON(data: ShipData, star: Star, ship?: Ship) {
        if (!ship) ship = new Ship();
        ship.isAlien = data.a;
        ship.color = data.c;
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
        ship.toPlanet = star.planets[data.toP];
        // ship.balanceBallast();
        ship.countComponents();
        return ship;
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
        const componentTypes = Object.values(types).filter(x => (x.prototype instanceof NormalComponent)) as Array<typeof Component>
        const cargoTypes = Object.values(types).filter(x => (x.prototype instanceof Cargo)) as Array<typeof Cargo>
        if (ship === undefined) ship = new Ship();
        ship.color = randomFrom(shipColors);
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

    static newBase(planet: Planet) {
        const ship = new Ship();
        ship.color = 'black';
        ship.rows = [[], []];
        ship.addComponent(new NavigationComputer(), randomInt(0, 1));
        ship.addComponent(new Radar(), randomInt(0, 1));
        ship.addComponent(new TradingComputer(), randomInt(0, 1));
        ship.offsets = [
            randomInt(0, ship.rows[0].length),
            randomInt(0, ship.rows[1].length)];
        ship.balanceBallast()
        ship.countComponents()
        return ship
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
            // record what's opposite to ballast
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
import { isCargoType, Cargo, MissionBox, isMissionBox } from "./cargo"
import { Ballast, CargoBay, Component, MissionComputer, NavigationComputer, Radar, TradingComputer, isCargoBay, isComponentType, isComputerComponentType, isNormalComponentType } from "./components"
import { cargoPerCargoBay } from "./const"
import { Planet } from "./planets"
import { fromJSON, types } from "./saveableType"
import { Ship } from "./ship"
import { assert, randomFrom, randomInt, shuffle } from "./utils"

export interface xywh {
    'x': number
    'y': number
    'w': number
    'h': number
}

export interface InteriorData {
    'a': boolean,
    'o': number[],
    'r': { 't': string }[][],
}

export class Interior {
    ship: Ship
    isAlien: boolean = false
    private rows: Array<Array<Component>> = []
    offsets: Array<number> = []
    componentTypes: { [typeName: string]: number }
    cargoTypes: { [typeName: string]: number }
    freeCargo: number

    get isOdd() { return this.rows.length % 2 }
    get rowsCount() { return this.rows.length }

    constructor(ship: Ship) {
        this.ship = ship;
    }

    toJSON(): InteriorData {
        return {
            'a': this.isAlien,
            'o': this.offsets,
            'r': this.rows.map(row => row.map(component => component.toJSON())),
        }
    }

    static fromJSON(data: InteriorData, ship: Ship) {
        const interior = new Interior(ship);
        interior.isAlien = data.a;
        interior.offsets = data.o;
        interior.rows = [];
        for (let row = 0; row < data.r.length; row++) {
            interior.rows[row] = [];
            for (let c = 0; c < data.r[row].length; c++) {
                interior.addComponent(fromJSON(data.r[row][c]) as Component, row);
            }
        }
        interior.fillBallastOpposite();
        interior.countComponents();
        return interior;
    }

    static randomShip(size: number, ship: Ship) {
        const interior = new Interior(ship);
        const rowCount = 4;
        const noramalComponentTypes = Object.values(types).filter(isNormalComponentType);
        const computerTypes = Object.values(types).filter(isComputerComponentType);
        const componentTypes = noramalComponentTypes.concat(computerTypes);
        const cargoTypes = Object.values(types).filter(x => isCargoType(x) && !(x instanceof MissionBox));
        interior.rows = [[], [], [], []]
        interior.offsets = [0, 0, 0, 0]
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
            interior.addComponent(component, randomInt(0, rowCount - 1));
        }
        for (let i = 0; i < interior.rows.length; i++) {
            interior.offsets[i] = randomInt(0, interior.rows[i].length)
        }
        interior.balanceBallast()
        interior.countComponents()
        return interior
    }

    static newBase(ship: Ship) {
        const interior = new Interior(ship);
        interior.rows = [[], [], []];
        const components = shuffle([new NavigationComputer(), new Radar(), new TradingComputer(), new MissionComputer()])
        for (let component of components)
            interior.addComponent(component, randomInt(0, 2));
        interior.offsets = [
            randomInt(0, interior.rows[0].length),
            randomInt(0, interior.rows[1].length),
            randomInt(0, interior.rows[2].length),
        ];
        interior.balanceBallast()
        interior.balanceBase()
        interior.countComponents()
        return interior
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

    forEachComponent(cb: (xy: { x: number; y: number }, component: Component) => void) {
        for (let row = 0; row < this.rows.length; row++) {
            for (let i = 0; i < this.rows[row].length; i++) {
                let component = this.rows[row][i];
                let xy = this.rowToXY(row, i);
                component.cellName = String.fromCharCode(65 + row) + xy.y;
                cb(xy, component);
            }
        }
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
        component.ship = this.ship;
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

    addComponentEx(component: Component, row: number) {
        this.deBallastTail();
        this.addComponent(component, row);
        this.balanceBallast();
        this.countComponents();
        this.countCargo();// we might've added a cargo box
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

    missionBoxesToFrom(planet: Planet) {
        const allCargoBays = this.rows.flat().filter(isCargoBay);
        let missionBoxes: MissionBox[] = [];
        for (let cargoBay of allCargoBays) {
            missionBoxes = missionBoxes.concat(cargoBay.cargo.filter(isMissionBox));
        }
        const missionBoxesToHere = missionBoxes.filter(box => box.to === planet.name);
        const missionBoxesFromHere = missionBoxes.filter(box => box.from === planet.name);
        return [missionBoxesToHere, missionBoxesFromHere];
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

    oppositeComponent(a: Component) {
        for (let row = 0; row <= this.rows.length; row++) {
            let i = this.rows[row].indexOf(a)
            if (i >= 0) {
                return this.rows[this.rows.length - 1 - row][i]
            }
        }
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

    balanceBase() {
        const max = this.rows.length - 1;
        for (var i = 0; i <= max; i++) {
            // add balance at head
            while (this.offsets[i] < this.rows[i].length / 2) {
                this.rows[i].unshift(new Ballast());
                this.offsets[i]++;
            }
            // add balance at tail
            while (this.offsets[i] > this.rows[i].length / 2) {
                this.rows[i].push(new Ballast())
            }
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
                        if (!(this.rows[max - i][j] instanceof Ballast))
                            (this.rows[i][j] as Ballast).opposite = this.rows[max - i][j].typename;
                        else {
                            let opposite = 2 * this.offsets[i] - j - 1;
                            if (!(this.rows[i][opposite] instanceof Ballast))
                                (this.rows[i][j] as Ballast).opposite = this.rows[i][opposite].typename;
                            else {
                                assert(!(this.rows[max - i][opposite] instanceof Ballast));
                                (this.rows[i][j] as Ballast).opposite = this.rows[max - i][opposite].typename;
                            }
                        }
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

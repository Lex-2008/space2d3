import { Cargo, UsefulCargo } from "./cargo"
import { Ballast, CargoBay, Component, NormalComponent } from "./components"
import { fromJSON, types } from "./saveableType"
import { randomFrom, randomInt } from "./utils"

export interface xywh {
    'x': number,
    'y': number,
    'w': number,
    'h': number
}

export class Ship {
    isAlien: boolean = false
    rows: Array<Array<Component>> = []
    offsets: Array<number> = []

    toJSON() {
        return {
            'isAlien': this.isAlien,
            'offsets': this.offsets,
            'rows': this.rows.map(row => row.map(component => component.toJSON()))
        }
    }

    static fromJSON(data: { isAlien: boolean; offsets: number[]; rows: { type: string }[][] }) {
        const ship = new Ship()
        ship.isAlien = data.isAlien
        ship.offsets = data.offsets
        ship.rows = data.rows.map(row => row.map((x: { type: string }) => fromJSON(x) as Component))
        return ship;
    }

    // functions used in drawing
    get gridSize() {
        if (this.isAlien) {
            return {
                'x0': 0,
                'x1': 0,
                'y0': 0,
                'y1': 0
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
                'x1': this.rows.length,
                'y0': max_pos,
                'y1': max_neg
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

    static randomShip(size: number) {
        const rowCount = 4
        const componentTypes = Object.values(types).filter(x => (x.prototype instanceof NormalComponent)) as Array<typeof Component>
        const cargoTypes = Object.values(types).filter(x => (x.prototype instanceof UsefulCargo)) as Array<typeof Cargo>
        const ship = new Ship()
        ship.rows = [[], [], [], []]
        ship.offsets = [0, 0, 0, 0]
        for (let i = 0; i < size; i++) {
            let row = randomInt(0, rowCount - 1)
            let componentType = randomFrom(componentTypes) as unknown as new () => Component
            let component = new componentType()
            if (component instanceof CargoBay) {
                let cargos = randomInt(0, 4)
                for (let j = 0; j < cargos; j++) {
                    let cargoType = randomFrom(cargoTypes) as unknown as new () => Cargo
                    component.cargo.push(new cargoType())
                }
            }
            ship.rows[row].push(component)
        }
        for (let i = 0; i < ship.rows.length; i++) {
            ship.offsets[i] = randomInt(0, ship.rows[i].length)
        }
        ship.balanceBallast()
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
}
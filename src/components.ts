import { Cargo } from "./cargo"
import { SaveableObject, addType, fromJSON } from "./saveableType"

export abstract class Component extends SaveableObject { }

export abstract class UselessComponent extends Component { }

export class Ballast extends UselessComponent { }
addType(Ballast, 'Ballast')

export class Debris extends UselessComponent {
    original: string = ''
    toJSON() {
        return {
            'type': this.typename,
            'original': this.original
        }
    }
    static fromJSON(type: typeof SaveableObject, data: { original: string }) {
        let a = new Debris()
        a.original = data.original
        return a
    }
}
addType(Debris, 'Debris')



export abstract class NormalComponent extends Component { }

export class CargoBay extends NormalComponent {
    cargo: Array<Cargo> = []
    toJSON() {
        return {
            'type': this.typename,
            'cargo': this.cargo.map(x => x.toJSON())
        }
    }
    static fromJSON(type: typeof SaveableObject, data: { cargo: Array<{ 'type': string }> }) {
        let a = new CargoBay()
        a.cargo = data.cargo.map((x: { type: string }) => fromJSON(x))
        return a
    }
}
addType(CargoBay, 'CargoBay')


export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }

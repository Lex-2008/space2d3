import { Cargo } from "./cargo"
import { SaveableObject, addType, fromJSON } from "./saveableType"
import { Ship } from "./ship"

export abstract class Component extends SaveableObject {
    cellName? = ''
    // ship: Ship
    onEnter(div: HTMLDivElement) { }
}

export abstract class UselessComponent extends Component { }

export class Airlock extends UselessComponent { }
addType(Airlock, 'Airlock')

export class Passage extends UselessComponent { }
addType(Passage, 'Passage')

export class Ballast extends UselessComponent {
    opposite? = ''
    onEnter(div: HTMLDivElement) {
        div.getElementsByTagName('b')[0].innerText = this.opposite || ''
    }
}
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
        };
    }
    static fromJSON(type: typeof SaveableObject, data: { cargo: Array<{ 'type': string }> }) {
        let a = new CargoBay();
        a.cargo = data.cargo.map((x: { type: string }) => fromJSON(x));
        return a;
    }
    onEnter(div: HTMLDivElement) {
        div.getElementsByTagName('ul')[0].innerHTML = this.cargo.map(x => `<li>${x.typename}</li>`).join('');
        (div.getElementsByClassName('CargoBay_Empty')[0] as HTMLDivElement).style.display = (this.cargo.length == 0) ? '' : 'none';
        (div.getElementsByClassName('CargoBay_NonEmpty')[0] as HTMLDivElement).style.display = (this.cargo.length == 0) ? 'none' : '';
    }
}
addType(CargoBay, 'CargoBay');


export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }

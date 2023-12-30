import { Cargo } from "./cargo"
import { draw_star, showTime } from "./draw"
import { SaveableObject, addType, fromJSON } from "./saveableType"
import { Ship } from "./ship"

export abstract class Component extends SaveableObject {
    cellName? = ''
    // ship: Ship
    // TODO: pass "gameState" / "gameManager" argument,
    // so the component could use info about global state
    onEnter(gs) { }
}

export abstract class UselessComponent extends Component { }

export class Airlock extends UselessComponent { }
addType(Airlock, 'Airlock')

export class Passage extends UselessComponent { }
addType(Passage, 'Passage')

export class Ballast extends UselessComponent {
    opposite? = ''
    onEnter(gs) {
        (document.querySelector('#Ballast b') as HTMLElement).innerText = this.opposite || ''
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
    onEnter(gs) {
        (document.querySelector('#CargoBay ul') as HTMLUListElement).innerHTML = this.cargo.map(x => `<li>${x.typename}</li>`).join('');
        (document.getElementById('CargoBay_Empty') as HTMLDivElement).style.display = (this.cargo.length == 0) ? '' : 'none';
        (document.getElementById('CargoBay_NonEmpty') as HTMLDivElement).style.display = (this.cargo.length == 0) ? 'none' : '';
    }
}
addType(CargoBay, 'CargoBay');

export class Radar extends NormalComponent {
    onEnter(gs) {
        const c = document.querySelector('#Radar canvas') as HTMLCanvasElement
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        gs.realTimestamp = performance.now();
        window.requestAnimationFrame(drawRadar);
    }
}
addType(Radar, 'Radar');

function drawRadar(ts) {
    const c = document.querySelector('#Radar canvas') as HTMLCanvasElement
    if (c.offsetParent === null) return;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const gs = window.gs;
    gs.now += Math.max(0, Math.min(ts - gs.realTimestamp, 1000)) / 1000;
    // console.log(Math.round(gs.now));
    gs.realTimestamp = ts;
    // TODO: draw planets only once, and redraw only ships
    // (maybe on another canvas)
    draw_star(ctx, gs.star, gs.now);
    window.requestAnimationFrame(drawRadar);
    // showTime(gs.now);
}

export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }

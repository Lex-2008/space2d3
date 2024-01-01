import { Cargo } from "./cargo"
import { planet_size } from "./const"
import { draw_ships, draw_star, showDate } from "./draw"
import { GameState, gs } from "./gameState"
import { gebi } from "./index"
import { Planet } from "./planets"
import { PlayerShip } from "./playerShip"
import { SaveableObject, addType, fromJSON } from "./saveableType"
import { Ship } from "./ship"

export abstract class Component extends SaveableObject {
    cellName? = ''
    ship: Ship
    onEnter(gs: GameState) { }
}

export abstract class UselessComponent extends Component { }

export class Airlock extends UselessComponent {
    onEnter(gs: GameState) {
        gebi('Airlock_Locked').style.display = (gs.playerShip.toPlanet == gs.playerShip.onPlanet) ? '' : 'none';
        gebi('Airlock_UnLocked').style.display = (gs.playerShip.toPlanet == gs.playerShip.onPlanet) ? 'none' : '';
        gebi('Airlock_Detach').onclick = () => { gs.depart() };
    }
}
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
    onEnter(gs: GameState) {
        const c = document.querySelector('#Radar canvas') as HTMLCanvasElement
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        drawRadar();
    }
}
addType(Radar, 'Radar');

function drawRadar(ts?: number) {
    const c = document.querySelector('#Radar canvas') as HTMLCanvasElement
    if (c.offsetParent === null) return;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    if (gs.tick(ts)) window.requestAnimationFrame(drawRadar);
    // TODO: draw planets only once, and redraw only ships
    // (maybe on another canvas)
    draw_star(ctx, gs.star);
    draw_ships(ctx, gs.star.ships, gs.playerShip.componentTypes['Radar']);
}

export class Cloak extends NormalComponent { }
addType(Cloak, 'Cloak');

export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }

export class NavigationComputer extends ComputerComponent {
    planetLI(planet: Planet, i: number) {
        if (planet == gs.playerShip.onPlanet) return '';
        const dist = Math.round(Math.hypot(gs.playerShip.x - planet.x, gs.playerShip.y - planet.y) * 100) / 100;
        const selected = (planet == gs.playerShip.toPlanet) ? 'checked' : '';
        return `<li><label>
        <input type="radio" name="NavigationComputer_to" value="${i}" ${selected}>
        ${planet.name} (dist: ${dist})
        </label></li>`
    }
    showDiv(id: string) {
        gebi('NavigationComputer_css').innerHTML = `#NavigationComputer_${id}{display:block !important}`;
    }
    onEnter(gs: GameState) {
        if (gs.timeFlies) {
            this.showDiv('Flying');
            return;
        }
        this.showDiv('Select');
        (document.querySelector('#NavigationComputer ul') as HTMLUListElement).innerHTML =
            gs.star.planets.map(this.planetLI).join('');
        gebi('NavigationComputer_Plot').style.display = (this.ship instanceof PlayerShip) ? 'none' : '';
        gebi('NavigationComputer_Fly').style.display = (this.ship instanceof PlayerShip) ? '' : 'none';
        gebi('NavigationComputer_Plot').onclick = () => {
            const el = document.querySelector('input[name="NavigationComputer_to"]:checked') as HTMLInputElement;
            if (!el) return false;
            if (!gs.playerShip.onPlanet) return false;
            gs.playerShip.planTrip(gs.playerShip.onPlanet, gs.star.planets[parseInt(el.value)], gs.now);
            this.showDiv('Detach');
            // console.log('NavigationComputer_Plot', gs.playerShip.toPlanet, gs.star.planets, parseInt(el.value));
            return true;
        }
        gebi('NavigationComputer_Fly').onclick = () => {
            if (!gebi('NavigationComputer_Plot').onclick()) return false;
            this.showDiv('Departed');
            gs.depart();
        }
    }
}
addType(NavigationComputer, 'NavigationComputer');

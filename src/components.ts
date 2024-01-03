import { Cargo, ResourceCargo } from "./cargo"
import { planet_size } from "./const"
import { draw_planet, draw_ships, draw_star, showDate } from "./draw"
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
export function isComponentType(type: typeof SaveableObject): type is typeof Component { return type.prototype instanceof Component };

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
    onEnter(gs: GameState) {
        (document.querySelector('#CargoBay ul') as HTMLUListElement).innerHTML = this.cargo.map(x => `<li>${x.typename}</li>`).join('');
        (document.getElementById('CargoBay_Empty') as HTMLDivElement).style.display = (this.cargo.length == 0) ? '' : 'none';
        (document.getElementById('CargoBay_NonEmpty') as HTMLDivElement).style.display = (this.cargo.length == 0) ? 'none' : '';
    }
}
addType(CargoBay, 'CargoBay');
export function isCargoBay(component: Component): component is CargoBay { return component instanceof CargoBay };



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
    draw_ships(ctx, gs.star.ships, gs.playerShip.componentTypes[Radar.id]);
}

export class Cloak extends NormalComponent { }
addType(Cloak, 'Cloak');

export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }

export class NavigationComputer extends ComputerComponent {
    planetTr(value: { planet: Planet; i: number }) {
        const planet = value.planet;
        const i = value.i;
        if (planet == gs.playerShip.onPlanet) return '';
        const dist = Math.round(Math.hypot(gs.playerShip.x - planet.x, gs.playerShip.y - planet.y) * 100) / 100;
        const selected = (planet == gs.playerShip.toPlanet) ? 'checked' : '';
        return `<tr><td>
            <label for="NavigationComputer_to_${i}"><canvas id="NavigationComputer_canvas_${i}" width=30 height=30></canvas></label>
        </td><td>
            <label><input type="radio" name="NavigationComputer_to" value="${i}" id="NavigationComputer_to_${i}" ${selected}>
            <b>${planet.name}</b> (dist: ${dist})<br>
            ${planet.buys ? `wants: ${planet.buys.id}` : ''} ${planet.sells ? `gives: ${planet.sells.id}` : ''}
        </label></td></tr>`
    }
    showDiv(id: string) {
        gebi('currentComponentPage').innerHTML = `#NavigationComputer_${id}{display:block !important}`;
    }
    onEnter(gs: GameState) {
        if (gs.timeFlies) {
            this.showDiv('Flying');
            return;
        }
        this.showDiv('Select');
        (document.querySelector('#NavigationComputer table') as HTMLTableElement).innerHTML =
            gs.star.planets.map((p, i) => { return { 'planet': p, 'i': i, 'dist': p.distanceTo(gs.playerShip) } }).sort((a, b) => a.dist - b.dist).map(this.planetTr).join('');
        gs.star.planets.forEach((planet, i) => {
            const c = document.getElementById(`NavigationComputer_canvas_${i}`) as HTMLCanvasElement;
            if (!c) return;
            const ctx = c.getContext("2d") as CanvasRenderingContext2D;
            draw_planet(ctx, planet, c.width / planet_size / 2, c.width / 2, c.height / 2);
        })
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



export class TradingComputer extends ComputerComponent {
    showDiv(id: string) {
        gebi('currentComponentPage').innerHTML = `#TradingComputer_${id}{display:block !important}`;
    }
    onEnter(gs: GameState): void {
        const planet = gs.playerShip.onPlanet as Planet;
        if (planet === null) {
            this.showDiv('None');
            return;
        }
        gs.playerShip.countCargo();
        if (planet.buys === null) {
            // FREE GIFT
            const giftAmount = Math.min(gs.playerShip.freeCargo, planet.ratio);
            if (giftAmount == 0) {
                this.showDiv('NoGift');
                return;
            }
            this.showDiv('Gift');
            gebi('TradingComputer_gift_number').innerText = giftAmount.toString();
            gebi('TradingComputer_gift_type').innerText = planet.sells.id;
            gebi('TradingComputer_gift_take').onclick = () => {
                gs.playerShip.putCargo((planet).sells, giftAmount);
                this.showDiv('Done');
            };
            return;
        }
        // rest is for normal trade
        if (gs.playerShip.cargoTypes[planet.buys.id] < 1) {
            this.showDiv('NothingToTradde');
            return;
        }
        this.showDiv('Trade');
        const slider = gebi('TradingComputer_give_slider') as HTMLInputElement;
        gebi('TradingComputer_give_type').innerText = planet.buys.id;
        gebi('TradingComputer_get_type').innerText = planet.sells.id;
        slider.max = slider.value = gs.playerShip.cargoTypes[planet.buys.id].toString();
        slider.style.display = gs.playerShip.cargoTypes[planet.buys.id] == 1 ? 'none' : '';
        slider.onchange = () => {
            const giveAmount = parseInt(slider.value);
            let getAmount = Math.round(giveAmount * planet.ratio);
            gebi('TradingComputer_max_cargo_warning').style.display = (getAmount - giveAmount > gs.playerShip.freeCargo) ? '' : 'none';
            getAmount = Math.min(getAmount, gs.playerShip.freeCargo + giveAmount);
            gebi('TradingComputer_give_number').innerText = giveAmount.toString();
            gebi('TradingComputer_get_number').innerText = getAmount.toString();
        };
        slider.onchange();
        gebi('TradingComputer_deal').onclick = () => {
            const giveAmount = parseInt(slider.value);
            let getAmount = Math.round(giveAmount * planet.ratio);
            getAmount = Math.min(getAmount, gs.playerShip.freeCargo + giveAmount);
            // console.log('before', gs.playerShip.cargoTypes, gs.playerShip.freeCargo);
            // console.log(giveAmount, planet.buys, getAmount, planet.sells);
            gs.playerShip.getCargo(planet.buys as typeof ResourceCargo, giveAmount);
            gs.playerShip.putCargo(planet.sells as typeof ResourceCargo, getAmount);
            // console.log('after', gs.playerShip.cargoTypes, gs.playerShip.freeCargo);
            this.showDiv('Done');
        };
    }

}
addType(TradingComputer, 'TradingComputer');
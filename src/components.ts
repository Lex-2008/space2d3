import { Cargo, Fuel, MissionBox, ResourceCargo, Rocket, isMissionBox } from "./cargo"
import { cargoPerCargoBay, cargoPerCargoMission, cargoPerDeliveryMission, maxFreeCargoBays, planet_size, shipBaseSpeed } from "./const"
import { draw_planet, draw_ships, draw_star, showDate } from "./draw"
import { GameState, gs } from "./gameState"
import { gebi } from "./index"
import { Planet } from "./planets"
import { PlayerShip } from "./playerShip"
import { SaveableObject, addType, fromJSON, types } from "./saveableType"
import { Ship } from "./ship"
import { randomFrom, randomInt, seq } from "./utils"

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
    onEnter(gs: GameState) {
        (document.querySelector('#Ballast b') as HTMLElement).innerText = this.opposite || ''
    }
}
addType(Ballast, 'Ballast')

export class Debris extends UselessComponent {
    original: string = ''
    toJSON() {
        return {
            't': this.typename,
            'o': this.original,
        }
    }
    static fromJSON(type: typeof SaveableObject, data: { o: string }) {
        let a = new Debris();
        a.original = data.o;
        return a;
    }
}
addType(Debris, 'Debris')



export abstract class NormalComponent extends Component { }
export function isNormalComponentType(type: typeof SaveableObject): type is typeof NormalComponent { return type.prototype instanceof NormalComponent && !(type.prototype instanceof ComputerComponent) };

export class CargoBay extends NormalComponent {
    cargo: Array<Cargo> = []
    toJSON() {
        return {
            't': this.typename,
            'c': this.cargo.map(x => x.toJSON())
        };
    }
    static fromJSON(type: typeof SaveableObject, data: { c: Array<{ 't': string }> }) {
        let a = new CargoBay();
        a.cargo = data.c.map((x: { t: string }) => fromJSON(x) as Cargo);
        return a;
    }
    onEnter(gs: GameState) {
        (document.querySelector('#CargoBay ul') as HTMLUListElement).innerHTML = this.cargo.map(x => `<li>${x.toText()}</li>`).join('');
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
    const ship = gs.walker.map[gs.walker.x][gs.walker.y].ship;
    if (ship === undefined) return;
    draw_ships(ctx, gs.star.ships, ship.componentTypes[Radar.id]);
}

export class Cloak extends NormalComponent { }
addType(Cloak, 'Cloak');

export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }
export function isComputerComponentType(type: typeof SaveableObject): type is typeof ComputerComponent { return type.prototype instanceof ComputerComponent && !(type.prototype instanceof BaseOnlyComputerComponent) };

export class NavigationComputer extends ComputerComponent {
    planetTr(value: { planet: Planet; i: number }) {
        const planet = value.planet;
        const i = value.i;
        const time = Math.ceil(planet.distanceTo(gs.playerShip) / shipBaseSpeed);
        const selected = (planet == gs.playerShip.toPlanet) ? 'checked' : '';
        const disabled = (planet == gs.playerShip.onPlanet) ? 'disabled' : '';
        return `<tr><td>
            <label for="NavigationComputer_to_${i}"><canvas id="NavigationComputer_canvas_${i}" width=30 height=30></canvas></label>
        </td><td>
            <label><input type="radio" name="NavigationComputer_to" value="${i}" id="NavigationComputer_to_${i}" ${disabled} ${selected}>
            <b>${planet.name}</b> (${time}d)<br>
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
            if (!gebi('NavigationComputer_Plot')?.onclick?.()) return false;
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
        slider.value = slider.max = gs.playerShip.cargoTypes[planet.buys.id].toString();
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

export abstract class BaseOnlyComputerComponent extends ComputerComponent { }

export class MissionComputer extends BaseOnlyComputerComponent {
    missionBoxesToHere: MissionBox[];
    deliveryMissionGivesBoxes: number;
    deliveryMissionGivesFreeCargoBay: boolean;
    rewardRockets: number;
    rewardFuel: number;
    divsShown = ['', ''];
    showDiv(n: number, id: string) {
        this.divsShown[n] = id;
        gebi('currentComponentPage').innerHTML = this.divsShown.map((id, i) => `#MissionComputer_${i}_${id}{display:block !important}`).join('');
    }
    fillRowSelectButtons(id: string, callback) {
        const rows = seq(gs.playerShip.rows.length + 1);
        rows.unshift(-1);
        gebi(id).innerHTML = rows.map(i => `<button id="${id}_${i + 1}">row ${String.fromCharCode(65 + i)}</button>`).join(' ');
        rows.forEach(i => gebi(`${id}_${i + 1}`).onclick = () => { callback(i, this) });
    }
    onEnter(gs: GameState): void {
        const planet = gs.playerShip.onPlanet;
        if (!planet) return;
        gs.playerShip.countCargo();
        //Delivery
        const allCargoBays = gs.playerShip.rows.flat().filter(isCargoBay);
        let missionBoxes: MissionBox[] = [];
        for (let cargoBay of allCargoBays) {
            missionBoxes = missionBoxes.concat(cargoBay.cargo.filter(isMissionBox));
        }
        const missionBoxesFromHere = missionBoxes.filter(box => box.from === planet.name);
        this.missionBoxesToHere = missionBoxes.filter(box => box.to === planet.name);
        if (this.missionBoxesToHere.length) {
            this.showDiv(0, 'Complete');
            const rewardCargos = Math.max(1, Math.floor(this.missionBoxesToHere.length / 2));
            this.rewardRockets = randomInt(0, rewardCargos);
            this.rewardFuel = rewardCargos - this.rewardRockets;
            gebi('MissionComputer_Complete_resource').innerText = `${rewardCargos} ${planet.sells.id}`;
            gebi('MissionComputer_Complete_cargo').innerText =
                [this.rewardRockets ? `${this.rewardRockets} Rockets` : '',
                this.rewardFuel ? `${this.rewardFuel} Fuel` : ''].filter(x => !!x).join(' and ');
            gebi('MissionComputer_Complete_resource').onclick = () => {
                gs.playerShip.getMissionBox(planet.name, this.missionBoxesToHere.length);
                gs.playerShip.putCargo(planet.sells, rewardCargos);
                this.showDiv(0, 'Completed');
            }
            gebi('MissionComputer_Complete_cargo').onclick = () => {
                gs.playerShip.getMissionBox(planet.name, this.missionBoxesToHere.length);
                gs.playerShip.putCargo(Rocket, this.rewardRockets);
                gs.playerShip.putCargo(Fuel, this.rewardFuel);
                this.showDiv(0, 'Completed');
            }
            // TODO: if player has 5 boxes with "total"==5 and 10 boxes with "total"==10
            const completely = this.missionBoxesToHere.every(box => box.total == this.missionBoxesToHere[0].total && box.from == this.missionBoxesToHere[0].from) && this.missionBoxesToHere[0].total == this.missionBoxesToHere.length;
            gebi('MissionComputer_Complete_component_wrap').style.display = completely ? '' : 'none';
            gebi('MissionComputer_Complete_component_name').innerText = planet.deliveryMissionComponent.id;
            this.fillRowSelectButtons('MissionComputer_Complete_component_select', this.deliveryMissionCompleteSelect);
        } else if (missionBoxesFromHere.length) {
            this.showDiv(0, 'InProgress');
            const allDests = missionBoxesFromHere.map(box => box.to);
            const uniqDests = [...new Set(allDests)];
            gebi('MissionComputer_InProgress_to').innerText = uniqDests.join(', ');
        } else if (gs.playerShip.freeCargo < cargoPerDeliveryMission && gs.playerShip.componentTypes[CargoBay.id] >= maxFreeCargoBays) {
            this.showDiv(0, 'NoSpace');
        } else {
            this.showDiv(0, 'Offer');
            this.deliveryMissionGivesFreeCargoBay = gs.playerShip.freeCargo < cargoPerDeliveryMission;
            if (this.deliveryMissionGivesFreeCargoBay) {
                this.deliveryMissionGivesBoxes = cargoPerDeliveryMission;
            } else {
                // Note that here we use cargoPerCargoBay. This is not a mistake. If you have 3 empty cargo bays,
                // we don't want to occupy them completely with mission cargo.
                this.deliveryMissionGivesBoxes = Math.max(1, Math.floor(gs.playerShip.freeCargo / cargoPerCargoBay)) * cargoPerDeliveryMission;
            }
            gebi('MissionComputer_Offer_n').innerText = this.deliveryMissionGivesBoxes.toString();
            gebi('MissionComputer_Offer_to').innerText = planet.deliveryMissionDest;
            gebi('MissionComputer_Offer_CargoBay').style.display = this.deliveryMissionGivesFreeCargoBay ? '' : 'none';
            gebi('MissionComputer_Offer_NoCargoBay').style.display = this.deliveryMissionGivesFreeCargoBay ? 'none' : '';
            gebi('MissionComputer_Offer_accept').onclick = () => {
                gs.playerShip.putMissionBox(planet.name, planet.deliveryMissionDest, this.deliveryMissionGivesBoxes);
                this.showDiv(0, 'Started');
            };
            this.fillRowSelectButtons('MissionComputer_Offer_CargoBay_select', this.deliveryMissionFreeCargoBaySelect);
        }
        //Cargo
        if (!planet.buys) {
            this.showDiv(1, 'None');
        } else {
            this.showDiv(1, 'Cargo');
            gebi('MissionComputer_Cargo_n').innerText = cargoPerCargoMission.toString();
            gebi('MissionComputer_Cargo_name').innerText = planet.buys.id;
            gebi('MissionComputer_Cargo_deliver').style.display = (gs.playerShip.cargoTypes[planet.buys.id] >= cargoPerCargoMission) ? '' : 'none';
            gebi('MissionComputer_Cargo_component_name').innerText = planet.cargoMissionComponent.id;
            this.fillRowSelectButtons('MissionComputer_Cargo_component_select', this.cargoMissionSelect);
        }
    }
    deliveryMissionFreeCargoBaySelect(n: number, t) {
        const planet = gs.playerShip.onPlanet;
        if (!planet) return;
        gs.playerShip.deBallastTail();
        gs.playerShip.addComponent(new CargoBay(), n);
        gs.playerShip.balanceBallast();
        gs.playerShip.countComponents();
        gs.playerShip.countCargo();// we've added a cargo box
        gs.playerShip.putMissionBox(planet.name, planet.deliveryMissionDest, t.deliveryMissionGivesBoxes);
        gs.walker.reattach();
        t.showDiv(0, 'Started');
    }
    deliveryMissionCompleteSelect(n: number, t) {
        const planet = gs.playerShip.onPlanet;
        if (!planet) return;
        gs.playerShip.deBallastTail();
        gs.playerShip.addComponent(new (planet.deliveryMissionComponent as unknown as new () => NormalComponent)(), n);
        gs.playerShip.balanceBallast();
        gs.playerShip.countComponents();
        gs.playerShip.countCargo();// we might've added a cargo box
        gs.playerShip.getMissionBox(planet.name, t.missionBoxesToHere.length);
        gs.walker.reattach();
        t.showDiv(0, 'Completed');
        const noramalComponentTypes = Object.values(types).filter(isNormalComponentType);
        planet.cargoMissionComponent = randomFrom(noramalComponentTypes);
    }
    cargoMissionSelect(n: number, t) {
        const planet = gs.playerShip.onPlanet;
        if (!planet?.buys) return;
        gs.playerShip.deBallastTail();
        gs.playerShip.addComponent(new (planet.cargoMissionComponent as unknown as new () => NormalComponent)(), n)
        gs.playerShip.balanceBallast();
        gs.playerShip.countComponents();
        gs.playerShip.countCargo();// we might've added a cargo box
        gs.playerShip.getCargo(planet.buys, cargoPerCargoMission);
        gs.walker.reattach();
        t.showDiv(1, 'Completed');
        const noramalComponentTypes = Object.values(types).filter(isNormalComponentType);
        planet.cargoMissionComponent = randomFrom(noramalComponentTypes);
    }
}
addType(MissionComputer, 'MissionComputer');
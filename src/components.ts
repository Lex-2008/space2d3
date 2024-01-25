import { Cargo, Fuel, MissionBox, ResourceCargo, Rocket, isMissionBox } from "./cargo"
import { cargoPerCargoBay, cargoPerCargoMission, cargoPerDeliveryMission, maxFreeCargoBays, minDaysAfterIntercept, planet_size, shipBaseSpeed } from "./const"
import { draw_planet, draw_ship, draw_ships, draw_star } from "./draw"
import { GS, GameState, gs } from "./gameState"
import { calcInterceptionTime } from "./interceptionCalc"
import { Planet } from "./planets"
import { PlayerShip } from "./playerShip"
import { SaveableObject, addType, fromJSON, types } from "./saveableType"
import { Ship } from "./ship"
import { randomFrom, randomInt, seq, gebi } from "./utils"

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
    lastHTMLUpdate = 0;
    oldHTML = '';
    onEnter(gs: GameState) {
        const c = document.querySelector('#Radar canvas') as HTMLCanvasElement
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        this.drawRadar();
        gebi('Radar_target').onclick = (ev) => {
            if (!(ev.target as HTMLInputElement)?.value) return;
            gs.playerShip.targetShip = gs.star.ships[(ev.target as HTMLInputElement).value];
        }
    }

    shipDiv(value: { ship: Ship, dist: number }) {
        const ship = value.ship;
        const dist = value.dist;
        const time = Math.ceil(dist / shipBaseSpeed);
        const selected = (ship === gs.playerShip.targetShip) ? 'checked' : '';
        const disabled = (ship === gs.playerShip) ? 'disabled' : '';
        return `
            <label><input type="radio" name="Radar_target" value="${ship.i}" id="Radar_target_${ship.i}" ${disabled} ${selected}>
            ${ship.toHTML(false, gs.playerShip)}<br>
        </label>`;
    }

    drawRadar(ts?: number) {
        const c = gebi('shipsCanvas') as HTMLCanvasElement;
        if (c.offsetParent === null) return;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        if (gs.tick(ts)) window.requestAnimationFrame((ts) => { this.drawRadar(ts); });
        // const ship = gs.walker.map[gs.walker.x][gs.walker.y].ship;
        const ship = this.ship;
        if (ship === undefined) return;
        const myRadars = ship.componentTypes[Radar.id];
        draw_ships(ctx, gs.star.ships, myRadars);
        const newHTML = gs.star.ships.filter(ship => ship.seenBy(gs.playerShip, myRadars)).map(s => { return { 'ship': s, 'dist': gs.playerShip.distanceTo(s) } }).sort((a, b) => a.dist - b.dist).map(this.shipDiv).join('');
        if (newHTML != this.oldHTML && (!ts || (this.lastHTMLUpdate + 500 <= ts))) {
            gebi('Radar_target').innerHTML = newHTML;
            this.oldHTML = newHTML;
            if (ts) this.lastHTMLUpdate = ts;
        }
    }

}
addType(Radar, 'Radar');

export class Cloak extends NormalComponent { }
addType(Cloak, 'Cloak');

export abstract class EngineComponent extends NormalComponent { }

export abstract class ComputerComponent extends NormalComponent { }
export function isComputerComponentType(type: typeof SaveableObject): type is typeof ComputerComponent { return type.prototype instanceof ComputerComponent && !(type.prototype instanceof BaseOnlyComputerComponent) };

export class NavigationComputer extends ComputerComponent {
    lastHTMLUpdate = 0;
    oldHTML = '';
    target: Planet;
    planetTr(value: { planet: Planet; i: number }) {
        const planet = value.planet;
        const i = value.i;
        const time = Math.ceil(gs.playerShip.distanceTo(planet) / shipBaseSpeed);
        const selected = (planet == this.target) ? 'checked' : '';
        const disabled = (planet == gs.playerShip.onPlanet) ? 'disabled' : '';
        return `<tr><td>
            <input type="radio" name="NavigationComputer_to" value="${i}" id="NavigationComputer_to_${i}" ${disabled} ${selected}>
        </td><td>
            <label for="NavigationComputer_to_${i}">
            ${planet.toHTML(false, gs.playerShip, true)}
        </label></td></tr>`
    }

    showDiv(id1: string, id2?: string) {
        gebi('currentComponentPage').innerHTML = `#NavigationComputer_${id1}{display:block !important}`;
        if (id2)
            gebi('currentComponentPage').innerHTML += `#NavigationComputer_Intercept_${id2}{display:block !important}`;
    }

    onEnter(gs: GameState) {
        this.target = gs.playerShip.toPlanet;
        // TODO: if (gs.state == GS.withShip) ...
        this.showDiv('Select');
        this.drawNC();
        (document.querySelector('#NavigationComputer table') as HTMLTableElement).onclick = (ev) => {
            if (!(ev.target as HTMLInputElement)?.value) return;
            // console.log((ev.target as HTMLInputElement)?.value);
            this.target = gs.star.planets[(ev.target as HTMLInputElement).value];
        }
        gebi('NavigationComputer_Plot').style.display = (this.ship instanceof PlayerShip) ? 'none' : '';
        gebi('NavigationComputer_Fly').style.display = (this.ship instanceof PlayerShip) ? '' : 'none';
        gebi('NavigationComputer_Plot').onclick = () => {
            gs.playerShip.planTrip(this.target, gs.now);
            this.showDiv('Detach');
            // console.log('NavigationComputer_Plot', gs.playerShip.toPlanet, gs.star.planets, parseInt(el.value));
            return true;
        }
        gebi('NavigationComputer_Fly').onclick = () => {
            if (!gebi('NavigationComputer_Plot')?.onclick?.()) return false;
            this.showDiv('Departed');
            if (gs.state == GS.onPlanet) gs.depart();
            if (gs.state == GS.withShip) gs.leaveShip();
        }
    }
    drawNC(ts?: number) {
        if (gebi('NavigationComputer').offsetParent === null) return;
        if (gs.tick(ts)) window.requestAnimationFrame((ts) => { this.drawNC(ts); });

        const newHTML = gs.star.planets.map((p, i) => { return { 'planet': p, 'i': i, 'dist': gs.playerShip.distanceTo(p) } }).sort((a, b) => a.dist - b.dist).map(v => this.planetTr(v)).join('');

        if (newHTML != this.oldHTML && (!ts || (this.lastHTMLUpdate + 500 <= ts))) {
            (document.querySelector('#NavigationComputer table') as HTMLTableElement).innerHTML = newHTML;
            this.oldHTML = newHTML;
            if (ts) this.lastHTMLUpdate = ts;
        }

        const ship = gs.playerShip.targetShip;
        if (!ship) this.showDiv('Select', 'notarget');
        else if (!ship.seenBy(this.ship, this.ship.componentTypes[Radar.id])) this.showDiv('Select', 'nosee');
        else if (ship.isIntercepting) this.showDiv('Select', 'interceptor');
        else {
            // TODO: store vx,vy in ship
            let vx = (ship.toPlanet.x - ship.fromPoint.x) / (ship.toTime - ship.fromTime);
            let vy = (ship.toPlanet.y - ship.fromPoint.y) / (ship.toTime - ship.fromTime);
            let time = calcInterceptionTime(this.ship, ship, { 'x': vx, 'y': vy }, 2 * shipBaseSpeed, gs.now);
            if (time > ship.toTime - minDaysAfterIntercept) this.showDiv('Select', 'notime');
            else {
                this.showDiv('Select', 'div');
                gebi('NavigationComputer_Intercept_ship').innerHTML = ship.toHTML(false, gs.playerShip);
                gebi('NavigationComputer_Intercept_Plot').style.display = (this.ship instanceof PlayerShip) ? 'none' : '';
                gebi('NavigationComputer_Intercept_Fly').style.display = (this.ship instanceof PlayerShip) ? '' : 'none';
                gebi('NavigationComputer_Intercept_Plot').onclick = () => {
                    this.ship.performIntercept(ship, vx, vy, time, gs.now);
                    this.showDiv('Detach');
                    return true;
                }
                gebi('NavigationComputer_Intercept_Fly').onclick = () => {
                    if (!gebi('NavigationComputer_Intercept_Plot')?.onclick?.()) return false;
                    this.showDiv('Departed');
                    if (gs.state == GS.onPlanet) gs.depart();
                    if (gs.state == GS.withShip) gs.leaveShip();
                }
            }
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
            if (gs.playerShip.freeCargo == 0) {
                this.showDiv('NoGift');
                return;
            }
            this.showDiv('Gift');

            const slider = gebi('TradingComputer_gift_slider') as HTMLInputElement;
            gebi('TradingComputer_gift_type').innerText = planet.sells.id;
            slider.value = slider.max = gs.playerShip.freeCargo.toString();
            slider.style.display = gs.playerShip.freeCargo == 1 ? 'none' : '';
            slider.onchange = () => {
                gebi('TradingComputer_gift_number').innerText = slider.value;
            };
            slider.onchange();
            gebi('TradingComputer_gift_take').onclick = () => {
                const giftAmount = parseInt(slider.value);
                gs.playerShip.putCargo(planet.sells, giftAmount);
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
            gebi('MissionComputer_Complete_resource').innerText = `${rewardCargos} ${planet.sells.id}`;
            gebi('MissionComputer_Complete_cargo').innerText =
                [planet.deliveryMissionRockets ? `${planet.deliveryMissionRockets} Rockets` : '',
                planet.deliveryMissionFuel ? `${planet.deliveryMissionFuel} Fuel` : ''].filter(x => !!x).join(' and ');
            gebi('MissionComputer_Complete_resource').onclick = () => {
                gs.playerShip.getMissionBox(planet.name, this.missionBoxesToHere.length);
                gs.playerShip.putCargo(planet.sells, rewardCargos);
                this.showDiv(0, 'Completed');
            }
            gebi('MissionComputer_Complete_cargo').onclick = () => {
                gs.playerShip.getMissionBox(planet.name, this.missionBoxesToHere.length);
                gs.playerShip.putCargo(Rocket, planet.deliveryMissionRockets);
                gs.playerShip.putCargo(Fuel, planet.deliveryMissionFuel);
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
            const uniqDests = [...new Set(allDests)].map(x => Planet.toHTML(x));
            gebi('MissionComputer_InProgress_to').innerHTML = uniqDests.join(', ');
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
            gebi('MissionComputer_Offer_to').innerHTML = Planet.toHTML(planet.deliveryMissionDest);
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
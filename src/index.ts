//import { } from "./draw.js";
import { PlayerShip } from "./playerShip.js";
import { Ship } from "./ship.js";
import { CargoBay, Component } from "./components.js";
import { fromJSON, types } from "./saveableType.js";
import { Rocket } from "./cargo.js";
import { componentSize, drawShip, showDate } from "./draw.js";
import { walkManager } from "./walkManager.js";
import { WalkMap, Walker } from "./walker.js";
import { Star } from "./stars.js";
import { GameState, gs, loadGS } from "./gameState.js";

export function gebi(id: string) {
    const element = document.getElementById(id);
    if (!element) throw ReferenceError(`element ${id} not found`);
    return element;
}
export function gibi(id: string) {
    const element = gebi(id);
    if (!(element instanceof HTMLInputElement)) throw ReferenceError(`element ${id} is not input`);
    return element;
}

if (location.hostname == 'localhost' || location.hostname == '127.0.0.1') {
    new EventSource('/esbuild').addEventListener('change', () => location.reload());
}



//var s = Ship.randomShip(1);
//var m = new WalkMap(0, 0)
var w = new Walker()
var wm = new walkManager()
wm.walker = w;

var c = gebi("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d") as CanvasRenderingContext2D;

w.box = gebi('canvasBox')
w.human = gebi('human')
w.canvas = c
w.onEnter = onEnter

function x_rand() {
    gs.star = new Star();
    gs.star.addRandomShips(0);
    gs.playerShip = PlayerShip.randomShip(15);
    gs.star.ships.push(gs.playerShip);

    wm.myShip = gs.playerShip;
    wm.drawMyShip(ctx);
    w.jumpTo(wm.oneShipData.x0 + 1, wm.oneShipData.y0 + 1);
    gs.playerShip.planTrip({ 'x': gs.star.planets[0].x - 0.1, y: gs.star.planets[0].y }, gs.star.planets[0], -1);
    gs.now = 0;
    gs.walkManager = wm;
    gs.walkCTX = ctx;
    gs.arrive();
    showDate(gs.now);
    window.gs = gs;

}

function x_load() {
    loadGS(JSON.parse(localStorage.space2d3_2));
    wm.myShip = gs.playerShip;
    wm.drawMyShip(ctx);
    w.jumpTo(wm.oneShipData.x0 + 1, wm.oneShipData.y0 + 1);
    gs.walkManager = wm;
    gs.walkCTX = ctx;
    gs.arrive();
    showDate(Math.floor(gs.now));
    window.gs = gs;

}

if (localStorage.space2d3_2) x_load();
else x_rand();
// gebi('save').onclick = x_save;
// gebi('load').onclick = x_load;
// gebi('random').onclick = x_rand;

window.onkeypress = (e) => {
    switch (e.key) {
        case 'w': w.goUp(); break;
        case 'a': w.goLt(); break;
        case 's': w.goDn(); break;
        case 'd': w.goRt(); break;
    }
}

function onEnter(c?: Component) {
    if (!c) return;
    gebi('currentComponent').innerHTML = `#${c.typename} {display:block}`
    if (c.cellName)
        gebi('componentLegend').innerText = `${c.cellName}: ${c.typename}`
    else
        gebi('componentLegend').innerText = `${c.typename}`
    c.onEnter(gs)
}

export function setStatus(s: string) {
    gebi('status').innerText = s;
}

//import { } from "./draw.js";
import { Ship } from "./ship.js";
import { CargoBay, Component } from "./components.js";
import { fromJSON, types } from "./saveableType.js";
import { Rocket } from "./cargo.js";
import { componentSize, drawShip } from "./draw.js";
import { walkManager } from "./walkManager.js";
import { WalkMap, Walker } from "./walker.js";

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



let my_ship = Ship.randomShip(15);
let other_ship = Ship.randomShip(35);

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

// function x_draw(s: Ship) {
//     const gs = s.gridSize
//     m = new WalkMap(gs.w + 1, gs.h + 1)
//     c.width = componentSize * (gs.w + 2)
//     c.height = componentSize * (gs.h + 2)
//     drawShip(ctx, gs.x0 + 1, gs.y0 + 1, s, m)
//     w.map = m
//     w.x = gs.x0 + 1
//     w.y = gs.y0 + 1
//     w.reposition()
//     w.onEnter(w.map.map[w.x][w.y].component)
//     console.log(m)
// }

function x_rand1() {
    let s = Ship.randomShip(35);
    wm.drawMyShip(ctx);
    const gs = s.gridSize
    w.jumpTo(gs.x0 + 1, gs.y0 + 1)
}

function x_rand() {
    wm.myShip = my_ship;
    wm.drawMyShip(ctx);
    w.jumpTo(wm.oneShipData.x0 + 1, wm.oneShipData.y0 + 1);
    x_attach();
    // wm.attach(ctx, Ship.randomShip(25));
    // wm.drawTwoShips(ctx, other_ship, my_ship);
    // w.jumpTo(wm.twoShipsData.bx0, wm.twoShipsData.by0);
}

function x_attach() {
    wm.attach(ctx, Ship.randomShip(25));
    setStatus('Docked to another ship');
}

// function x_save() {
//     localStorage.space2d3_1_ship = JSON.stringify(s.toJSON())
// }

// function x_load() {
//     s = Ship.fromJSON(JSON.parse(localStorage.space2d3_1_ship))
//     x_draw(s)
// }

x_rand();
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
    let myDiv = gebi(c.typename) as HTMLDivElement
    if (c.cellName)
        gebi('componentLegend').innerText = `${c.cellName}: ${c.typename}`
    else
        gebi('componentLegend').innerText = `${c.typename}`
    c.onEnter(myDiv)
}

function setStatus(s: string) {
    gebi('status').innerText = s;
}

gebi('Airlock_Detach').onclick = () => {
    wm.detach(ctx);
    setStatus('Docking to next ship in 5...');
    setTimeout(() => setStatus('Docking to next ship in 4...'), 1000);
    setTimeout(() => setStatus('Docking to next ship in 3...'), 2000);
    setTimeout(() => setStatus('Docking to next ship in 2...'), 3000);
    setTimeout(() => setStatus('Docking to next ship in 1...'), 4000);
    setTimeout(() => x_attach(), 5000);
}
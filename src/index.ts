//import { } from "./draw.js";
import { Ship } from "./ship.js";
import { CargoBay, Component } from "./components.js";
import { fromJSON, types } from "./saveableType.js";
import { Rocket } from "./cargo.js";
import { componentSize, drawShip } from "./draw.js";
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



var s = Ship.randomShip(1);
var m = new WalkMap(0, 0)
var w = new Walker()
w.box = gebi('canvasBox')

var c = gebi("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d") as CanvasRenderingContext2D;

w.canvas = c
w.onEnter = onEnter

function x_draw(s: Ship) {
    const gs = s.gridSize
    const x_sz = (gs.x0 + gs.x1 + 1)
    const y_sz = (gs.y0 + gs.y1 + 2)
    m = new WalkMap(x_sz, y_sz)
    c.width = componentSize * (x_sz + 1)
    c.height = componentSize * (y_sz + 1)
    drawShip(ctx, gs.x0 + 1, gs.y0 + 1, s, m)
    w.map = m
    w.x = gs.x0 + 1
    w.y = gs.y0 + 1
    w.reposition()
    w.onEnter(w.map.map[w.x][w.y].component)
    //console.log(m)
}

function x_rand() {
    s = Ship.randomShip(35);
    x_draw(s);
}

function x_save() {
    localStorage.space2d3_1_ship = JSON.stringify(s.toJSON())
}

function x_load() {
    s = Ship.fromJSON(JSON.parse(localStorage.space2d3_1_ship))
    x_draw(s)
}

x_rand();
gebi('save').onclick = x_save;
gebi('load').onclick = x_load;
gebi('random').onclick = x_rand;

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


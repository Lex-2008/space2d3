//import { } from "./draw.js";
import { Ship } from "./ship.js";
import { CargoBay } from "./components.js";
import { fromJSON, types } from "./saveableType.js";
import { Rocket } from "./cargo.js";
import { componentSize, drawShip } from "./draw.js";

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



var s = Ship.randomShip(15);

var c = gebi("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d") as CanvasRenderingContext2D;

function x_draw(s: Ship) {
    const gs = s.gridSize
    c.width = componentSize * (gs?.x0 + gs?.x1 + 2)
    c.height = componentSize * (gs?.y0 + gs?.y1 + 3)
    drawShip(ctx, gs?.x0 + 1, gs?.y0 + 1, s)
}

function x_rand() {
    s = Ship.randomShip(15);
    x_draw(s);
}

function x_save() {
    localStorage.space2d3_1_ship = JSON.stringify(s.toJSON())
}

function x_load() {
    s = Ship.fromJSON(JSON.parse(localStorage.space2d3_1_ship))
    x_draw(s)
}

x_draw(s);
gebi('save').onclick = x_save;
gebi('load').onclick = x_load;
gebi('random').onclick = x_rand;
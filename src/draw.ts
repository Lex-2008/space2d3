import { Airlock, Cloak, Component, ComputerComponent, Passage, UselessComponent } from "./components"
import { WalkMap } from "./walker";
import { Ship } from "./ship";
import { xywh } from "./interior";
import { Planet } from "./planets";
import { Star } from "./stars";
import { planet_size } from "./const";
import { gs } from "./gameState";
import { PlayerShip } from "./playerShip";
import { assert, gebi } from "./utils";

export const componentSize = 50
export const componentOffset = 5

function drawComponent(ctx: CanvasRenderingContext2D, x: number, y: number, ship: Ship, component: Component, map: WalkMap) {
    const textOffset = 5;
    ctx.beginPath();
    if (ship.interior.isAlien) {
        ctx.rect(x * componentSize, y * componentSize + componentOffset, componentSize, componentSize - 2 * componentOffset);
    } else {
        ctx.rect(x * componentSize + componentOffset, y * componentSize, componentSize - 2 * componentOffset, componentSize);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle = ship.color;
    if (component instanceof UselessComponent) ctx.fillStyle = ship.color3;
    else ctx.fillStyle = ship.color2;
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.fillStyle = ship.color;
    ctx.fillText(component.cellName || '', x * componentSize + componentOffset + textOffset, y * componentSize + textOffset)
    let componentTitle = component.typename[0];
    if (component instanceof ComputerComponent) componentTitle += 'C';
    if (component instanceof Cloak) componentTitle += 'l';
    ctx.fillText(componentTitle, x * componentSize + componentOffset + textOffset, y * componentSize + textOffset + 16);
    map[x][y] = {
        canBeHere: true,
        canGoX: ship.interior.isAlien,
        canGoY: !ship.interior.isAlien,
        ship: ship,
        component: component,
    }
}

function drawPassage(ctx: CanvasRenderingContext2D, x0: number, y0: number, ship: Ship, map: WalkMap) {
    const p = ship.interior.passage;
    ctx.beginPath();
    ctx.rect((x0 + p.x) * componentSize, (y0 + p.y) * componentSize, p.w * componentSize, p.h * componentSize);
    ctx.strokeStyle = ship.color;
    ctx.fillStyle = ship.color2;
    ctx.fill();
    ctx.stroke();
    let component = new Passage();
    for (let x = 0; x < p.w; x++)
        for (let y = 0; y < p.h; y++)
            map[x + x0][y + y0] = {
                canBeHere: true,
                canGoX: true,
                canGoY: true,
                ship: ship,
                component: component,
            }
}

interface ComponentAndShip {
    component?: Component,
    ship?: Ship,
}
export function drawAirlock(ctx: CanvasRenderingContext2D, x: number, y: number, top: ComponentAndShip, bottom: ComponentAndShip, map: WalkMap) {
    assert(top.component && top.ship && bottom.component && bottom.ship);
    // NOTE: YOUR ship is always the lower one
    // TODO: this is for normal-to-normal ship. How it will look with alien ships - TBD
    const gradient = ctx.createLinearGradient(x * componentSize + componentOffset, y * componentSize, x * componentSize + componentOffset, (y + 1) * componentSize);
    const gradient2 = ctx.createLinearGradient(x * componentSize + componentOffset, y * componentSize, x * componentSize + componentOffset, (y + 1) * componentSize);
    gradient.addColorStop(0, top.ship.color);
    gradient.addColorStop(1, bottom.ship.color);
    if (top.component instanceof UselessComponent) gradient2.addColorStop(0, top.ship.color3);
    else gradient2.addColorStop(0, top.ship.color2);
    if (bottom.component instanceof UselessComponent) gradient2.addColorStop(0, bottom.ship.color3);
    else gradient2.addColorStop(1, bottom.ship.color2);
    ctx.strokeStyle = gradient;
    ctx.fillStyle = gradient2;
    ctx.beginPath();
    ctx.moveTo(x * componentSize + componentOffset, y * componentSize);
    ctx.lineTo(x * componentSize + componentOffset * 2, (y + 0.5) * componentSize);
    ctx.lineTo(x * componentSize + componentOffset, (y + 1) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset, (y + 1) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset * 2, (y + 0.5) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset, y * componentSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    map[x][y] = {
        canBeHere: true,
        canGoY: true,
        component: new Airlock(),
    }
}

export function drawShip(ctx: CanvasRenderingContext2D, x0, y0, ship: Ship, map: WalkMap) {
    // draw ship INTERIOR
    ship.interior.forEachComponent((xy, component) => {
        drawComponent(ctx, x0 + xy.x, y0 - xy.y, ship, component, map);
    })
    drawPassage(ctx, x0, y0, ship, map);
}

export function draw_ship(ctx: CanvasRenderingContext2D, ship: Ship, cell_size: number, myRadars?: number) {
    // draw ship ON STAR MAP
    const x = (ship.x) * cell_size;
    const y = (ship.y) * cell_size;
    // console.log('draw', ship.color, x, y);
    ctx.fillStyle = ship.color;
    ctx.fillRect(x - 1, y - 1, 3, 3);
    if (myRadars !== undefined && ship instanceof PlayerShip) {
        for (let r = 1; r <= myRadars; r++) {
            ctx.beginPath();
            ctx.arc(x, y, cell_size * r, 0, 7);
            ctx.strokeStyle = 'red';
            ctx.stroke();
        }
    }
}

let x0 = 0;
let y0 = 0;
let c1 = '';
let c2 = '';

// function drawBackground(ts) {
//     window.requestAnimationFrame(drawBackground);
//     const c = gebi('systemCanvas') as HTMLCanvasElement;
//     const ctx = c.getContext("2d") as CanvasRenderingContext2D;
//     const max_size = ctx.canvas.width;
//     const cell_size = max_size / (gs.star.size);
//     gs.tick(ts);
//     const x = Math.round((gs.playerShip.x) * cell_size);
//     const y = Math.round((gs.playerShip.y) * cell_size);
//     if (x === x0 && y === y0) return;
//     x0 = x; y0 = y;
//     // console.log(Math.round(x), Math.round(y));
//     const p = ctx.getImageData(x, y, 1, 1).data;
//     const c0 = rgbToHex(p, 0);
//     if (c0 === c1 && c1 === c2) return;
//     // gebi('canvasBox').style.background = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
//     // gebi('canvasTopBG').style.background = `linear-gradient(to right,#${rgbToHex(p, 0)},#${rgbToHex(p, 4)})`;
//     // gebi('canvasBox').style.background = `linear-gradient(to right,#${rgbToHex(p, 8)},#${rgbToHex(p, 12)})`;
//     // if (c0 === c1)
//     gebi('canvasBox').style.background = `#${c0}`;
//     // else gebi('canvasBox').style.background = `linear-gradient(#${c0},#${c1})`;
//     // console.log(x, y, c0, c1, c2);
//     c2 = c1;
//     c1 = c0;
// }

// window.requestAnimationFrame(drawBackground);

export function draw_planet(ctx: CanvasRenderingContext2D, planet: Planet, cell_size: number, x?: number, y?: number) {
    if (x === undefined) x = (planet.x) * cell_size;
    if (y === undefined) y = (planet.y) * cell_size;
    var grd = ctx.createRadialGradient(x - 1, y - 1, 2, x, y, planet_size * cell_size);
    grd.addColorStop(0, planet.color_in);
    grd.addColorStop(1, planet.color_out);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, planet_size * cell_size, 0, 7);
    ctx.fill();
}


export function draw_star(ctx: CanvasRenderingContext2D, star: Star) {
    //calc_sizes(ctx, star);
    const max_size = ctx.canvas.width;
    const cell_size = max_size / (star.size);
    const center = max_size / 2;
    ctx.clearRect(0, 0, max_size, max_size);
    if (star.bright) {
        let grd = ctx.createRadialGradient(center, center, 0, center, center, cell_size / 2);
        grd.addColorStop(0, "white");
        grd.addColorStop(0.5, star.color);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, max_size, max_size);
    } else {
        let grd = ctx.createRadialGradient(center, center, 10, center, center, cell_size / 2);
        grd.addColorStop(0, star.color);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, max_size, max_size);
    }
    for (let planet of star.planets) {
        draw_planet(ctx, planet, cell_size);
    }
}

export function draw_ships(ctx: CanvasRenderingContext2D, ships: Ship[], myRadars: number) {
    const max_size = ctx.canvas.width;
    const cell_size = max_size / gs.star.size;
    ctx.clearRect(0, 0, max_size, max_size);
    for (let ship of ships) {
        if (ship instanceof PlayerShip || ship.seenBy(gs.playerShip, myRadars))
            draw_ship(ctx, ship, cell_size, myRadars);
    }
}

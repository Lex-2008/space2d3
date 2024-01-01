import { Airlock, Component, ComputerComponent, Passage } from "./components"
import { WalkMap } from "./walker";
import { Ship, xywh } from "./ship";
import { Planet } from "./planets";
import { Star } from "./stars";
import { planet_size } from "./const";
import { gebi } from "./index";
import { gs } from "./gameState";

export const componentSize = 50
export const componentOffset = 5

function drawComponent(ctx: CanvasRenderingContext2D, x: number, y: number, ship: Ship, component: Component, map?: WalkMap) {
    if (ship.isAlien) {
        ctx.rect(x * componentSize, y * componentSize + componentOffset, componentSize, componentSize - 2 * componentOffset);
    } else {
        ctx.rect(x * componentSize + componentOffset, y * componentSize, componentSize - 2 * componentOffset, componentSize);
    }
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.fillText(component.cellName || '', x * componentSize + componentOffset, y * componentSize)
    if (component instanceof ComputerComponent) {
        ctx.fillText(component.typename[0] + 'C', x * componentSize + componentOffset, y * componentSize + 16)
    } else {
        ctx.fillText(component.typename[0], x * componentSize + componentOffset, y * componentSize + 16)
    }
    if (map) {
        map.map[x][y].canBeHere = true
        map.map[x][y].canGoX = ship.isAlien
        map.map[x][y].canGoY = !ship.isAlien
        map.map[x][y].ship = ship
        map.map[x][y].component = component
    }
}

function drawPassage(ctx: CanvasRenderingContext2D, x0: number, y0: number, ship: Ship, map?: WalkMap) {
    const p = ship.passage
    ctx.rect((x0 + p.x) * componentSize, (y0 + p.y) * componentSize, p.w * componentSize, p.h * componentSize);
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.textBaseline = 'top';
    if (map) {
        let component = new Passage();
        for (let x = 0; x < p.w; x++)
            for (let y = 0; y < p.h; y++) {
                map.map[x + x0][y + y0].canBeHere = true
                map.map[x + x0][y + y0].canGoX = true
                map.map[x + x0][y + y0].canGoY = true
                map.map[x + x0][y + y0].ship = ship
                map.map[x + x0][y + y0].component = component
            }
    }
}

export function drawAirlock(ctx: CanvasRenderingContext2D, x: number, y: number, map?: WalkMap) {
    // NOTE: YOUR ship is always the lower one
    // TODO: this is for normal-to-normal ship. How it will look with alien ships - TBD
    ctx.strokeStyle = "white";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x * componentSize + componentOffset, y * componentSize);
    ctx.lineTo(x * componentSize + componentOffset * 2, (y + 0.5) * componentSize);
    ctx.lineTo(x * componentSize + componentOffset, (y + 1) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset, (y + 1) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset * 2, (y + 0.5) * componentSize);
    ctx.lineTo((x + 1) * componentSize - componentOffset, y * componentSize);
    ctx.closePath();
    ctx.stroke();

    if (map) {
        map.map[x][y].canBeHere = true
        map.map[x][y].canGoY = true
        map.map[x][y].component = new Airlock()
    }
}

export function drawShip(ctx: CanvasRenderingContext2D, x0, y0, ship: Ship, map?: WalkMap) {
    // draw ship INTERIOR
    for (let row = 0; row < ship.rows.length; row++) {
        for (let i = 0; i < ship.rows[row].length; i++) {
            let component = ship.rows[row][i];
            let xy = ship.rowToXY(row, i);
            component.cellName = String.fromCharCode(65 + row) + xy.y;
            drawComponent(ctx, x0 + xy.x, y0 - xy.y, ship, component, map);
        }
    }
    drawPassage(ctx, x0, y0, ship, map);
}

export function draw_ship(ctx: CanvasRenderingContext2D, ship: Ship, cell_size: number, ship_size: number, now: number) {
    // draw ship ON STAR MAP
    const x = (ship.spaceX) * cell_size;
    const y = (ship.spaceY) * cell_size;
    // console.log('draw', ship.color, x, y);
    ctx.fillStyle = ship.color;
    ctx.fillRect(x, y, 2, 2);
    // ctx.beginPath();
    // ctx.arc(x, y, cell_size, 0, 7);
    // ctx.strokeStyle = 'red';
    // ctx.stroke();
}

function draw_planet(ctx: CanvasRenderingContext2D, planet: Planet, cell_size: number) {
    const x = (planet.x) * cell_size;
    const y = (planet.y) * cell_size;
    var grd = ctx.createRadialGradient(x - 1, y - 1, 2, x, y, planet_size * cell_size);
    grd.addColorStop(0, planet.color_in);
    grd.addColorStop(1, planet.color_out);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, planet_size * cell_size, 0, 7);
    ctx.fill();
}


export function draw_star(ctx: CanvasRenderingContext2D, star: Star, now?: number) {
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

    if (now !== undefined)
        for (let ship of star.ships) {
            draw_ship(ctx, ship, cell_size, 0, now);
        }
}

export function showDate(today: number) {
    // console.log('showTime', now);
    gebi('now-day').innerText = (today + 1).toString();
    // const date = Math.floor(now);
    const year = Math.floor(today / 300) + 3000;
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][Math.floor((today % 300) / 30)];
    const day = Math.floor(today % 30) + 1;
    gebi('now-date').innerText = `${day} ${month} ${year}`;
    // const time = now % 1;
    // gebi('now-hr').innerText = Math.floor(time * 25);
    // gebi('now-min').innerText = Math.round((time * 25 * 50) % 25);
}

// setInterval(showTime, 1000);
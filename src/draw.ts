import { Airlock, Component, Passage } from "./components"
import { WalkMap } from "./walker";
import { Ship, xywh } from "./ship";

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
    ctx.fillText(component.typename[0], x * componentSize + componentOffset, y * componentSize + 16)
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


import { Component } from "./components"
import { Ship, xywh } from "./ship";

export const componentSize = 50
export const componentOffset = 5

function drawComponent(ctx: CanvasRenderingContext2D, x: number, y: number, ship: Ship, component: Component, cellName: string, zeroth: boolean) {
    if (ship.isAlien) {
        ctx.rect(x * componentSize, y * componentSize + componentOffset, componentSize, componentSize - 2 * componentOffset);
    } else {
        ctx.rect(x * componentSize + componentOffset, y * componentSize, componentSize - 2 * componentOffset, componentSize);
    }
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.fillText(cellName, x * componentSize + componentOffset, y * componentSize)
    ctx.fillText(component.typename[0], x * componentSize + componentOffset, y * componentSize + 16)
}

function drawPassage(ctx: CanvasRenderingContext2D, x0: number, y0: number, ship: Ship) {
    const p = ship.passage
    ctx.rect((x0 + p.x) * componentSize, (y0 + p.y) * componentSize, p.w * componentSize, p.h * componentSize);
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.stroke();
    ctx.textBaseline = 'top';
    //ctx.fillText(cellName, x * componentSize + componentOffset, y * componentSize)
}

export function drawShip(ctx: CanvasRenderingContext2D, x0, y0, ship: Ship) {
    for (let row = 0; row < ship.rows.length; row++) {
        for (let i = 0; i < ship.rows[row].length; i++) {
            let component = ship.rows[row][i]
            let xy = ship.rowToXY(row, i)
            let cellName = String.fromCharCode(65 + row) + xy.y
            drawComponent(ctx, x0 + xy.x, y0 - xy.y, ship, component, cellName, i == ship.offsets[row])
        }
    }
    drawPassage(ctx, x0, y0, ship)
}
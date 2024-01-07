import { Component } from "./components"
import { componentSize, drawAirlock, drawShip } from "./draw"
import { Ship } from "./ship"

interface WalkPoint {
    canBeHere?: boolean,
    canGoX?: boolean,
    canGoY?: boolean,
    ship?: Ship,
    component?: Component,
}

export type WalkMap = WalkPoint[][];

// export class WalkMap {
//     map: Array<Array<WalkPoint>> = []
//     constructor(maxX: number, maxY: number) {
//         for (let x = 0; x <= maxX; x++) {
//             this.map[x] = []
//             for (let y = 0; y <= maxY; y++) {
//                 this.map[x][y] = {}
//             }
//         }
//     }
// }

export class Walker {
    x: number
    y: number
    map: WalkMap
    box: HTMLElement
    human: HTMLElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    onEnter: (arg0?: Component) => void

    oneShipData: { x0: number; x1: number; y0: number; y1: number; w: number; h: number; };
    twoShipsData: { ax0: number; ay0: number; airlock_x: number; airlock_y: number; bx0: number; by0: number; max_x: number; max_y: number; }
    hasSecondShip = false;
    myShip: Ship;
    secondShip: Ship;

    newMap(maxX: number, maxY: number) {
        this.map = [];
        for (let x = 0; x <= maxX; x++) {
            this.map[x] = [];
            for (let y = 0; y <= maxY; y++) {
                this.map[x][y] = {};
            }
        }
    }

    goX(sign: number) {
        if (!this.map[this.x][this.y].canGoX) return false;
        if (!this.map[this.x + sign][this.y].canBeHere) return false;
        this.x += sign
        this.reposition()
        this.onEnter(this.map[this.x][this.y].component)
        return true
    }
    goY(sign: number, sure?: boolean) {
        if (!sure && !this.map[this.x][this.y].canGoY) return false;
        if (!this.map[this.x][this.y + sign].canBeHere) return false;
        this.y += sign
        this.reposition()
        this.onEnter(this.map[this.x][this.y].component)
        return true
    }

    goUp() { this.goY(-1); this.human.style.transform = 'rotate(0deg)' }
    goDn(sure?: boolean) { this.goY(1, sure); this.human.style.transform = 'rotate(180deg)' }
    goLt() { this.goX(-1); this.human.style.transform = 'rotate(-90deg)' }
    goRt() { this.goX(1); this.human.style.transform = 'rotate(90deg)' }

    jumpTo(x: number, y: number, callOnEnter = true) {
        this.x = x;
        this.y = y;
        this.reposition(true);
        if (callOnEnter) this.onEnter(this.map[x][y].component);
    }

    reposition(fast?: boolean) {
        if (fast) {
            this.canvas.classList.add('notransition');
        }
        let walkerOnCanvas_x = (this.x + 0.5) * componentSize
        let walkerOnDiv_x = this.box.offsetWidth / 2
        let canvasOffset_x = walkerOnDiv_x - walkerOnCanvas_x
        this.canvas.style.left = canvasOffset_x + 'px'

        let walkerOnCanvas_y = (this.y + 0.5) * componentSize
        let walkerOnDiv_y = this.box.offsetHeight / 2
        let canvasOffset_y = walkerOnDiv_y - walkerOnCanvas_y
        this.canvas.style.top = canvasOffset_y + 'px'
        if (fast) {
            this.canvas.offsetHeight; // Trigger a reflow, flushing the CSS changes
            this.canvas.classList.remove('notransition');
        }
    }

    putTwoShips(a: Ship, b: Ship) {
        const a_sz = a.gridSize;
        const b_sz = b.gridSize;
        const a_lock = a.bottomAirlock;
        const b_lock = b.topAirlock;
        const airlock_x = Math.max(a_lock, b_lock) + 1;
        const airlock_y = a_sz.h + 1;
        const max_x = airlock_x + Math.max(a_sz.w - a_lock, b_sz.w - b_lock);
        const max_y = airlock_y + b_sz.h + 1;
        this.myShip = b;
        this.secondShip = a;
        this.hasSecondShip = true;
        this.twoShipsData = {
            'ax0': airlock_x - a_lock + a_sz.x0,
            'ay0': a_sz.y0 + 1,
            'airlock_x': airlock_x,
            'airlock_y': airlock_y,
            'bx0': airlock_x - b_lock + b_sz.x0,
            'by0': airlock_y + b_sz.y0 + 1,
            'max_x': max_x,
            'max_y': max_y,
        };
    }

    drawTwoShips(a: Ship, b: Ship) {
        this.putTwoShips(a, b);
        const c = this.twoShipsData;
        //console.log('putTwoShips says', a.gridSize, b.gridSize, a.bottomAirlock, b.topAirlock, c)
        this.newMap(c.max_x, c.max_y);
        this.ctx.canvas.width = componentSize * (c.max_x + 1);
        this.ctx.canvas.height = componentSize * (c.max_y + 1);

        drawShip(this.ctx, c.ax0, c.ay0, a, this.map);
        drawShip(this.ctx, c.bx0, c.by0, b, this.map);
        drawAirlock(this.ctx, c.airlock_x, c.airlock_y, this.map);
    }

    drawMyShip() {
        this.hasSecondShip = false;
        const gs = this.oneShipData = this.myShip.gridSize;
        this.newMap(gs.w + 1, gs.h + 1);
        this.ctx.canvas.width = componentSize * (gs.w + 2);
        this.ctx.canvas.height = componentSize * (gs.h + 2);
        drawShip(this.ctx, gs.x0 + 1, gs.y0 + 1, this.myShip, this.map);
    }

    detach() {
        if (!this.hasSecondShip) return false;
        let moveDnFromAirlock = false;
        if (this.y == this.twoShipsData.airlock_y) {
            //player stands in airlock
            // assume my ship is lower ship
            this.y++;
            moveDnFromAirlock = true;
        }
        this.secondShip.playerOnShip = (this.y < this.twoShipsData.airlock_y);
        this.myShip.playerOnShip = (this.y > this.twoShipsData.airlock_y);
        if (this.y < this.twoShipsData.airlock_y) {
            // player on top ("a") ship
            // TODO
        } else {
            // player on bottom ("b") ship, which is also my ship
            const player_x = this.myShip.playerX = this.x - this.twoShipsData.bx0;
            const player_y = this.myShip.playerY = this.y - this.twoShipsData.by0;
            this.drawMyShip();
            if (moveDnFromAirlock) {
                this.jumpTo(this.oneShipData.x0 + 1 + player_x, this.oneShipData.y0 + player_y, false);
                this.goDn(true);
            } else {
                this.jumpTo(this.oneShipData.x0 + 1 + player_x, this.oneShipData.y0 + 1 + player_y, false);
            }
        }
    }

    attach(otherShip: Ship) {
        if (this.hasSecondShip) return false;
        // player coordinates relative to ship
        const player_x = this.x - 1 - this.oneShipData.x0;
        const player_y = this.y - 1 - this.oneShipData.y0;
        this.drawTwoShips(otherShip, this.myShip);
        this.jumpTo(this.twoShipsData.bx0 + player_x, this.twoShipsData.by0 + player_y);
    }

    reattach() {
        if (!this.hasSecondShip) return false;
        if (this.y >= this.twoShipsData.airlock_y) {
            // assuming player is on the top ship
            return
        }
        const player_x = this.secondShip.playerX = this.x - this.twoShipsData.ax0;
        const player_y = this.secondShip.playerY = this.y - this.twoShipsData.ay0;
        this.drawTwoShips(this.secondShip, this.myShip);
        this.jumpTo(this.twoShipsData.ax0 + player_x, this.twoShipsData.ay0 + player_y);
    }
}
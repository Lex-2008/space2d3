import { WalkMap, Walker } from "./walker";
import { Ship } from "./ship";
import { componentSize, drawShip, drawAirlock } from "./draw";

export class walkManager {
    walker: Walker;
    oneShipData: { x0: number; x1: number; y0: number; y1: number; w: number; h: number; };
    twoShipsData: { ax0: number; ay0: number; airlock_x: number; airlock_y: number; bx0: number; by0: number; max_x: number; max_y: number; }
    myShip: Ship;

    putTwoShips(a: Ship, b: Ship) {
        const a_sz = a.gridSize;
        const b_sz = b.gridSize;
        const a_lock = a.bottomAirlock;
        const b_lock = b.topAirlock;
        const airlock_x = Math.max(a_lock, b_lock) + 1;
        const airlock_y = a_sz.h + 1;
        const max_x = airlock_x + Math.max(a_sz.w - a_lock, b_sz.w - b_lock);
        const max_y = airlock_y + b_sz.h + 1;
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

    drawTwoShips(ctx: CanvasRenderingContext2D, a: Ship, b: Ship) {
        this.putTwoShips(a, b);
        const c = this.twoShipsData;
        //console.log('putTwoShips says', a.gridSize, b.gridSize, a.bottomAirlock, b.topAirlock, c)
        const m = new WalkMap(c.max_x, c.max_y);
        this.walker.map = m;
        ctx.canvas.width = componentSize * (c.max_x + 1);
        ctx.canvas.height = componentSize * (c.max_y + 1);

        drawShip(ctx, c.ax0, c.ay0, a, m);
        drawShip(ctx, c.bx0, c.by0, b, m);
        drawAirlock(ctx, c.airlock_x, c.airlock_y, m);
    }

    drawMyShip(ctx: CanvasRenderingContext2D) {
        const gs = this.oneShipData = this.myShip.gridSize;
        const m = this.walker.map = new WalkMap(gs.w + 1, gs.h + 1);
        ctx.canvas.width = componentSize * (gs.w + 2);
        ctx.canvas.height = componentSize * (gs.h + 2);
        drawShip(ctx, gs.x0 + 1, gs.y0 + 1, this.myShip, m);
    }

    detach(ctx: CanvasRenderingContext2D) {
        // assuming my ship is lower ship and player stands in airlock
        // player coordinates relative to ship
        const player_x = this.walker.x - this.twoShipsData.bx0;
        const player_y = this.walker.y - this.twoShipsData.by0 + 1;
        this.drawMyShip(ctx);
        //this.walker.jumpTo(this.oneShipData.x0 + 1 + player_x, this.oneShipData.y0 + 1 + player_y),
        this.walker.jumpTo(this.oneShipData.x0 + 1 + player_x, this.oneShipData.y0 + player_y);
        this.walker.goDn(true);
    }

    attach(ctx: CanvasRenderingContext2D, otherShip: Ship) {
        // player coordinates relative to ship
        const player_x = this.walker.x - 1 - this.oneShipData.x0;
        const player_y = this.walker.y - 1 - this.oneShipData.y0;
        this.drawTwoShips(ctx, otherShip, this.myShip);
        this.walker.jumpTo(this.twoShipsData.bx0 + player_x, this.twoShipsData.by0 + player_y);
    }
}

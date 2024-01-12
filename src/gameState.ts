import { gebi, setStatus, showDate } from "./utils";
import { PlayerShip, isPlayerShip } from "./playerShip";
import { Star } from "./stars";
import { Walker } from "./walker";
import { planet_size } from "./const";
import { draw_planet } from "./draw";

export class GameState {
    star: Star;
    playerShip: PlayerShip;
    walker: Walker;
    now = 0;
    lastTickTimestamp: number;
    lastDate: number;
    _timeFlies = false;
    tickInterval = 0;

    get timeFlies() { return this._timeFlies };
    set timeFlies(value: boolean) {
        // console.trace(value);
        if (this._timeFlies == value) return;
        this._timeFlies = value;
        if (value) {
            const t = this;
            this.lastTickTimestamp = performance.now();
            this.tickInterval = setInterval(function () { t.tick() }, 1000);
        } else {
            clearInterval(this.tickInterval);
        }

    };

    tick(ts?: number): boolean {
        if (!this._timeFlies) return false;
        if (!ts) ts = performance.now();
        if (ts <= this.lastTickTimestamp) return true;
        this.now += Math.max(0, Math.min(ts - this.lastTickTimestamp, 1000)) / 1000;
        this.lastTickTimestamp = ts;
        const newDate = Math.floor(this.now);
        if (this.lastDate != newDate) {
            showDate(newDate);
            this.lastDate = newDate;
            const tripRemain = Math.ceil(this.playerShip.toTime - this.now);
            setStatus(`Approaching ${this.playerShip.toPlanet.name} planet in ${tripRemain} days`);
        }
        for (let ship of this.star.ships) {
            ship.updateSpaceXY(this.now);
        }
        return true;
    };

    depart() {
        // console.log(this.playerShip);
        // ship.fromPlanet = this;
        // ship.toPlanet = dest;
        // ship.fromTime = departTime;

        // if (this.playerShip.onPlanet !== null) {
        //     this.playerShip.fromPlanet = this.playerShip.onPlanet;
        // }
        this.timeFlies = true;
        // this.playerShip.flying = true;

        const c = gebi('bgCanvas') as HTMLCanvasElement;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, c.width, c.height);
        this.playerShip.onPlanet = null;
        this.walker.detach();
        this.lastDate = -1;
        this.tick();
    };

    arrive(noOnEnter?: boolean, noSave?: boolean, noAnimate?: boolean) {
        const planet = this.playerShip.toPlanet;
        this.playerShip.onPlanet = planet;
        this.playerShip.x = planet.x;
        this.playerShip.y = planet.y;
        // this.playerShip.flying = false;
        this.timeFlies = false;
        if (!noOnEnter) planet.onEnter();
        setStatus(`Docking to base at ${planet.name} planet`);
        if (!noSave) localStorage.space2d3_2 = JSON.stringify(this.toJSON());

        const c = gebi('bgCanvas') as HTMLCanvasElement;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        const box = gebi('canvasBox') as HTMLDivElement;
        if (noAnimate) {
            c.classList.add('notransition');
        }
        c.width = box.offsetWidth;
        c.height = box.offsetHeight;
        draw_planet(ctx, planet, c.width / planet_size / 2, c.width / 2, c.height / 2);
        this.walker.attach(planet.base);
        setStatus(`Docked to base at ${planet.name} planet`);
    };

    toJSON() {
        return {
            'v': 2,
            's': this.star.toJSON(),
            'n': this.now,
        }
    }

    static fromJSON(a): GameState | false {
        if (a?.v != 2) return false;
        const gs = new GameState();
        gs.star = new Star(a.s);
        const playerShips = gs.star.ships.filter(isPlayerShip);
        if (playerShips.length != 1) return false;
        gs.playerShip = playerShips[0];
        gs.now = a.n;
        return gs;
    }
}

export function loadGS(data) {
    const ret = GameState.fromJSON(data);
    if (ret) {
        gs = ret;
        return true;
    }
    return false;
}

export function newGS() {
    gs = new GameState();
}

export let gs: GameState;
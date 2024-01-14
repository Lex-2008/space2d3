import { setStatus, showDate } from "./utils";
import { PlayerShip, isPlayerShip } from "./playerShip";
import { Star } from "./stars";
import { Walker } from "./walker";

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
        this.playerShip.onPlanet = null;
        this.walker.detach();
        this.lastDate = -1;
        this.tick();
    };

    arrive(noOnEnter?: boolean, noSave?: boolean) {
        this.playerShip.onPlanet = this.playerShip.toPlanet;
        this.playerShip.x = this.playerShip.onPlanet.x;
        this.playerShip.y = this.playerShip.onPlanet.y;
        // this.playerShip.flying = false;
        this.timeFlies = false;
        if (!noOnEnter) this.playerShip.onPlanet.onEnter();
        this.walker.attach(this.playerShip.onPlanet.base);
        setStatus(`Docked to base at ${this.playerShip.onPlanet.name} planet`);
        if (!noSave) localStorage.space2d3_2 = JSON.stringify(this.toJSON());
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
    if (gs) gs._timeFlies = false;
    gs = new GameState();
}

export let gs: GameState;
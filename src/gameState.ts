import { showDate } from "./draw";
import { setStatus } from "./index";
import { PlayerShip } from "./playerShip";
import { Ship } from "./ship";
import { Star } from "./stars";
import { walkManager } from "./walkManager";

export class GameState {
    star: Star;
    playerShip: PlayerShip;
    walkManager: walkManager;
    walkCTX: CanvasRenderingContext2D;
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
        this.playerShip.flying = true;
        this.playerShip.onPlanet = null;
        this.walkManager.detach(this.walkCTX);
        this.tick();
    }
    arrive() {
        this.playerShip.onPlanet = this.playerShip.toPlanet;
        this.playerShip.x = this.playerShip.onPlanet.x;
        this.playerShip.y = this.playerShip.onPlanet.y;
        this.playerShip.flying = false;
        this.timeFlies = false;
        this.walkManager.attach(this.walkCTX, this.playerShip.onPlanet.base);
        setStatus(`Docked to base at ${this.playerShip.onPlanet.name} planet`);

    }
}

export const gs = new GameState();
showDate(0);
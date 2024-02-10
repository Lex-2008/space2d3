import { assert, setStatus, showDate } from "./utils";
import { PlayerShip, isPlayerShip } from "./playerShip";
import { Star } from "./stars";
import { Walker } from "./walker";
import { Ship, nextShip, setNextShip } from "./ship";

export enum GS { flying, onPlanet, withShip };
export enum WSS { peace, preFight, fight, robbing };

export class GameState {
    private _state: GS;
    star: Star;
    playerShip: PlayerShip;
    withShip: Ship;
    withShipState: WSS;
    walker: Walker;
    now = 0;
    lastTickTimestamp: number;
    lastDate: number;
    private _timeFlies = false;
    tickInterval = 0;

    get state() { return this._state };
    set state(value: GS) {
        if (this._state == value) return;
        this._state = value;
        this.timeFlies = value == GS.flying;
    };

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
        if (!this.timeFlies) return false;
        if (!ts) ts = performance.now();
        if (ts <= this.lastTickTimestamp) return true;
        this.now += Math.max(0, Math.min(ts - this.lastTickTimestamp, 1000)) / 1000;
        this.lastTickTimestamp = ts;
        const newDate = Math.floor(this.now);
        for (let ship of this.star.ships) {
            ship.updateSpaceXY(this.now);
        }
        if (this.lastDate != newDate) {
            showDate(newDate);
            this.lastDate = newDate;
            if (this.timeFlies) {
                let tripRemain = Math.ceil(this.playerShip.toTime - this.now);
                setStatus('planet', 'travelling', this.playerShip.toPlanet, tripRemain);
                if (this.playerShip.isIntercepting) {
                    let tripRemain = Math.ceil(this.playerShip.interceptionTime - this.now);
                    setStatus('ship', 'intercepting', this.playerShip.interceptingShip, tripRemain);
                }
            }
            for (let ship of this.star.ships) {
                ship.considerIntercept(this.star.ships, this.now);
            }
        }
        return true;
    };

    depart() {
        assert(this.state == GS.onPlanet);
        // console.log(this.playerShip);
        // ship.fromPlanet = this;
        // ship.toPlanet = dest;
        // ship.fromTime = departTime;

        // if (this.playerShip.onPlanet !== null) {
        //     this.playerShip.fromPlanet = this.playerShip.onPlanet;
        // }
        this.state = GS.flying;
        this.timeFlies = true;
        // this.playerShip.flying = true;
        this.playerShip.onPlanet = null;
        this.walker.detach();
        this.lastDate = -1;
        this.tick();
    };

    arrive(noOnEnter?: boolean, noSave?: boolean) {
        assert(this.state == GS.flying);
        this.playerShip.onPlanet = this.playerShip.toPlanet;
        this.playerShip.x = this.playerShip.onPlanet.x;
        this.playerShip.y = this.playerShip.onPlanet.y;
        // this.playerShip.flying = false;
        this.state = GS.onPlanet;
        this.timeFlies = false;
        if (!noOnEnter) this.playerShip.onPlanet.onEnter();
        this.walker.attach(this.playerShip.onPlanet.base);
        setStatus('planet', 'docked', this.playerShip.onPlanet);
        if (!noSave) localStorage.space2d3_3 = JSON.stringify(this.toJSON());
    };

    joinShip(ship: Ship) {
        assert(this.state == GS.flying);
        this.state = GS.withShip;
        this.withShip = ship;
        this.timeFlies = false;
    }

    leaveShip() {
        assert(this.state == GS.withShip);
        gs.state = GS.flying;
        this.timeFlies = true;
        setStatus('ship', 'none');
        //re+enter currect component - for example, if you left the ship while standing in Radar component
        this.walker.triggerOnEnter();
    }

    toJSON() {
        return {
            'v': 2,
            's': this.star.toJSON(),
            'n': this.now,
            'ns': nextShip,
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
        setNextShip(a.ns || 0);
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
    if (gs) gs.timeFlies = false; //in case a game is already in progress
    gs = new GameState();
}

export let gs: GameState;
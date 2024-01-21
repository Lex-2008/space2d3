import { GS, gs } from "./gameState";
import { assert, setStatus } from "./utils";
import { Planet } from "./planets";
import { Ship, ShipData } from "./ship";
import { Star } from "./stars";


export class PlayerShip extends Ship {
    // flying = false;
    onPlanet: Planet | null;
    targetShip: Ship | null;

    updateSpaceXY(now: number, allowArrive: boolean = true) {
        // console.log('updateSpaceXY', now, this.toTime);
        switch (gs.state) {
            case GS.flying:
                if (now >= this.toTime && allowArrive) {
                    gs.arrive();
                }
                else super.updateSpaceXY(now, false);
                break;
            case GS.onPlanet:
                assert(this.onPlanet);
                this.x = this.onPlanet.x;
                this.y = this.onPlanet.y;
                break;
            case GS.withShip:
                assert(!gs.timeFlies);
                super.updateSpaceXY(now, false);
                break;
        }
    }

    considerIntercept() { }

    static randomShip(size: number): PlayerShip {
        let ship = new PlayerShip();
        Ship.randomShip(size, ship); //also fills in properties of the `ship` argument
        ship.name = 'Your Ship';
        return ship;
    }

    toJSON(): ShipData {
        const data = super.toJSON();
        data.p = true;
        if (this.onPlanet != null) data.on = this.onPlanet.i;
        return data;
    }

    static fromJSON(data: ShipData, star: Star) {
        let ship = new PlayerShip();
        Ship.fromJSON(data, star, ship);
        return ship;
    }
}

export function isPlayerShip(ship: Ship): ship is PlayerShip { return ship instanceof PlayerShip };

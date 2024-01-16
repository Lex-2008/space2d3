import { gs } from "./gameState";
import { setStatus } from "./utils";
import { Planet } from "./planets";
import { Ship, ShipData } from "./ship";
import { Star } from "./stars";


export class PlayerShip extends Ship {
    // flying = false;
    onPlanet: Planet | null;

    updateSpaceXY(now: number, allowArrive: boolean = true) {
        // console.log('updateSpaceXY', now, this.toTime);
        super.updateSpaceXY(now, false);
        if (now >= this.toTime && allowArrive) gs.arrive();
    }

    considerIntercept() { }

    static randomShip(size: number): PlayerShip {
        let ship = new PlayerShip();
        Ship.randomShip(size, ship); //also fills in properties of the `ship` argument
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

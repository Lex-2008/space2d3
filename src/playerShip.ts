import { gs } from "./gameState";
import { setStatus } from "./index";
import { Planet } from "./planets";
import { Ship } from "./ship";


export class PlayerShip extends Ship {
    flying = false;
    onPlanet: Planet | null;

    updateSpaceXY(now: number) {
        // console.log('updateSpaceXY', now, this.toTime);
        super.updateSpaceXY(now, false);
        if (now >= this.toTime) gs.arrive();
    }

    static randomShip(size: number): PlayerShip {
        let ship = new PlayerShip();
        Ship.randomShip(size, ship); //also fills in properties of the `ship` argument
        ship.color = 'white';
        return ship;
    }
}

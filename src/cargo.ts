import { SaveableObject, addType } from './saveableType'

export abstract class Cargo extends SaveableObject { }
export function isCargoType(type: typeof SaveableObject): type is typeof Cargo { return type.prototype instanceof Cargo };

export abstract class UsefulCargo extends Cargo { }

export class Rocket extends UsefulCargo { }
addType(Rocket, 'Rocket')

export class Fuel extends UsefulCargo { }
addType(Fuel, 'Fuel')

export abstract class ResourceCargo extends Cargo { }

export class Water extends ResourceCargo {
    static readonly color = 'blue';
}
addType(Water, 'Water')

export class Iron extends ResourceCargo {
    static readonly color = 'yellow';
}
addType(Iron, 'Iron')

export class Food extends ResourceCargo {
    static readonly color = 'green';
}
addType(Food, 'Food')

export class Radioactives extends ResourceCargo {
    static readonly color = 'red';
}
addType(Radioactives, 'Radioactives')

export interface MissionBoxData {
    t: string;
    f: string;
    to: string;
    tot: number;
}
export class MissionBox extends Cargo {
    from: string;
    to: string;
    total: number;
    toJSON(): MissionBoxData {
        return {
            't': this.typename,
            'f': this.from,
            'to': this.to,
            'tot': this.total,
        }
    }

    static fromJSON(type: typeof MissionBox, data: MissionBoxData): MissionBox {
        const ret = new type();
        ret.from = data.f;
        ret.to = data.to;
        ret.total = data.tot;
        return ret;
    }
}
addType(MissionBox, 'MissionBox')
export function isMissionBox(item: Cargo): item is MissionBox { return item instanceof MissionBox };
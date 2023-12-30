import { SaveableObject, addType } from './saveableType'

export abstract class Cargo extends SaveableObject { }

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
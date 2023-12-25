import { SaveableObject, addType } from './saveableType'

export abstract class Cargo extends SaveableObject { }

export abstract class UsefulCargo extends Cargo { }

export class Rocket extends UsefulCargo { }
addType(Rocket, 'Rocket')

export class Fuel extends UsefulCargo { }
addType(Fuel, 'Fuel')

abstract class ResourceCargo extends Cargo { }


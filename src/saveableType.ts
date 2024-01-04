export abstract class SaveableObject {
    static id: string

    get mytype() { return this.constructor as typeof SaveableObject }
    get typename(): string { return this.mytype.id }

    toJSON() {
        return { 't': this.typename }
    }
    static fromJSON(type: typeof SaveableObject, data: object) {
        // same as `return new type()`
        return new (type as unknown as new () => SaveableObject)()
    }
}

export function fromJSON(data: { 't': string }) {
    const type = types[data.t];
    return type.fromJSON(type, data);
}


export var types: { [key: string]: typeof SaveableObject } = {}

export function addType(type: typeof SaveableObject, id: string) {
    types[id] = type
    type.id = id
}

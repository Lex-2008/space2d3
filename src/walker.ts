import { Component } from "./components"
import { componentSize } from "./draw"
import { Ship } from "./ship"

class WalkPoint {
    canBeHere = false
    canGoX = false
    canGoY = false
    ship?: Ship
    component?: Component
}

export class WalkMap {
    map: Array<Array<WalkPoint>> = []
    constructor(maxX: number, maxY: number) {
        for (let x = 0; x <= maxX; x++) {
            this.map[x] = []
            for (let y = 0; y <= maxY; y++) {
                this.map[x][y] = new WalkPoint()
            }
        }
    }
}

export class Walker {
    x: number
    y: number
    map: WalkMap
    box: HTMLElement
    canvas: HTMLCanvasElement
    onEnter: (arg0?: Component) => void

    goX(sign: number) {
        if (!this.map.map[this.x][this.y].canGoX) return false;
        if (!this.map.map[this.x + sign][this.y].canBeHere) return false;
        this.x += sign
        this.reposition()
        this.onEnter(this.map.map[this.x][this.y].component)
        return true
    }
    goY(sign: number) {
        if (!this.map.map[this.x][this.y].canGoY) return false;
        if (!this.map.map[this.x][this.y + sign].canBeHere) return false;
        this.y += sign
        this.reposition()
        this.onEnter(this.map.map[this.x][this.y].component)
        return true
    }

    goUp() { return this.goY(-1) }
    goDn() { return this.goY(1) }
    goLt() { return this.goX(-1) }
    goRt() { return this.goX(1) }

    reposition() {
        let walkerOnCanvas_x = (this.x + 0.5) * componentSize
        let walkerOnDiv_x = this.box.offsetWidth / 2
        let canvasOffset_x = walkerOnDiv_x - walkerOnCanvas_x
        this.canvas.style.left = canvasOffset_x + 'px'

        let walkerOnCanvas_y = (this.y + 0.5) * componentSize
        let walkerOnDiv_y = this.box.offsetHeight / 2
        let canvasOffset_y = walkerOnDiv_y - walkerOnCanvas_y
        this.canvas.style.top = canvasOffset_y + 'px'
    }
}
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
    human: HTMLElement
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
    goY(sign: number, sure?: boolean) {
        if (!sure && !this.map.map[this.x][this.y].canGoY) return false;
        if (!this.map.map[this.x][this.y + sign].canBeHere) return false;
        this.y += sign
        this.reposition()
        this.onEnter(this.map.map[this.x][this.y].component)
        return true
    }

    goUp() { this.goY(-1); this.human.style.transform = 'rotate(0deg)' }
    goDn(sure?: boolean) { this.goY(1, sure); this.human.style.transform = 'rotate(180deg)' }
    goLt() { this.goX(-1); this.human.style.transform = 'rotate(-90deg)' }
    goRt() { this.goX(1); this.human.style.transform = 'rotate(90deg)' }

    jumpTo(x: number, y: number, x0?: number, y0?: number) {
        if (x0 !== undefined && y0 !== undefined) {
            // this.x = x0;
            // this.y = y0;
            // this.reposition(true);
            // this.x = x;
            // this.y = y;
            // this.reposition();
            // this.onEnter(this.map.map[x][y].component);
        } else {
            this.x = x;
            this.y = y;
            this.reposition(true);
            this.onEnter(this.map.map[x][y].component);
        }
    }

    reposition(fast?: boolean) {
        if (fast) {
            this.canvas.classList.add('notransition');
        }
        let walkerOnCanvas_x = (this.x + 0.5) * componentSize
        let walkerOnDiv_x = this.box.offsetWidth / 2
        let canvasOffset_x = walkerOnDiv_x - walkerOnCanvas_x
        this.canvas.style.left = canvasOffset_x + 'px'

        let walkerOnCanvas_y = (this.y + 0.5) * componentSize
        let walkerOnDiv_y = this.box.offsetHeight / 2
        let canvasOffset_y = walkerOnDiv_y - walkerOnCanvas_y
        this.canvas.style.top = canvasOffset_y + 'px'
        if (fast) {
            this.canvas.offsetHeight; // Trigger a reflow, flushing the CSS changes
            this.canvas.classList.remove('notransition');
        }
    }
}
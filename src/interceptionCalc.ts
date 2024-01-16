import { Point } from "./geometry";

function _calcInterceptionTime(x0: number, y0: number, vx: number, vy: number, w: number) {
    const D1 = w ** 2 * x0 ** 2 + w ** 2 * y0 ** 2 - (vx * y0 - vy * x0) ** 2;
    const t1 = (-x0 * vx - y0 * vy + Math.sqrt(D1)) / (vx ** 2 + vy ** 2 - w ** 2);
    const t2 = (-x0 * vx - y0 * vy - Math.sqrt(D1)) / (vx ** 2 + vy ** 2 - w ** 2);
    if (Math.min(t1, t2) > 0) return Math.min(t1, t2);
    else return Math.max(t1, t2);
}

export function calcInterceptionTime(a: Point, b: Point, v: Point, w: number, now: number) {
    return now + _calcInterceptionTime(b.x - a.x, b.y - a.y, v.x, v.y, w);
}
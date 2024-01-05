//import { } from "./draw.js";
import { PlayerShip } from "./playerShip.js";
import { Ship, ShipData } from "./ship.js";
import { CargoBay, Component } from "./components.js";
import { fromJSON, types } from "./saveableType.js";
import { Food, Iron, Radioactives, Rocket, Water } from "./cargo.js";
import { componentSize, drawShip, showDate } from "./draw.js";
import { walkManager } from "./walkManager.js";
import { WalkMap, Walker } from "./walker.js";
import { Star } from "./stars.js";
import { GameState, gs, loadGS } from "./gameState.js";
import { shipBaseSpeed } from "./const.js";

export function gebi(id: string) {
    const element = document.getElementById(id);
    if (!element) throw ReferenceError(`element ${id} not found`);
    return element;
}
export function gibi(id: string) {
    const element = gebi(id);
    if (!(element instanceof HTMLInputElement)) throw ReferenceError(`element ${id} is not input`);
    return element;
}

if (location.hostname == 'localhost' || location.hostname == '127.0.0.1') {
    new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

// const newEasyShip = new PlayerShip();
// newEasyShip.name = 'Your Ship';
// newEasyShip.color = 'white';
// newEasyShip.rows = [[], []];
// const cb = new CargoBay();
// cb.cargo.push(new Water());
// cb.cargo.push(new Food());
// cb.cargo.push(new Iron());
// cb.cargo.push(new Radioactives());
// newEasyShip.addComponent(cb, 0);
// newEasyShip.offsets = [0, 0];
// newEasyShip.balanceBallast();
// newEasyShip.countComponents();
// newEasyShip.fromPoint = { 'x': 0, 'y': 0 };
// newEasyShip.fromTime = -1;
// newEasyShip.toPlanet = { 'i': 0 };
// newEasyShip.toTime = 0;
// console.log(JSON.stringify(newEasyShip.toJSON()));

const newEasyShip = { "a": false, "n": "Your Ship", "c": "white", "o": [0, 0], "r": [[{ "t": "CargoBay", "c": [{ "t": "Water" }, { "t": "Food" }, { "t": "Iron" }, { "t": "Radioactives" }] }], [{ "t": "Ballast" }]], "frX": 0, "frY": 0, "frT": -1, "toP": 0, "toT": 0, "p": true }

//var s = Ship.randomShip(1);
//var m = new WalkMap(0, 0)
var w = new Walker()
var wm = new walkManager()
wm.walker = w;

var c = gebi("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d") as CanvasRenderingContext2D;

w.box = gebi('canvasBox')
w.human = gebi('human')
w.canvas = c
w.onEnter = onEnter
window.onresize = () => { gs.walkManager.walker.reposition(true) }

function newGame(shipData?: ShipData) {
    gs.star = new Star();
    gs.star.addRandomShips(0);
    if (shipData) gs.playerShip = PlayerShip.fromJSON(shipData, gs.star);
    else gs.playerShip = PlayerShip.randomShip(15);
    gs.star.ships.push(gs.playerShip);
    gs.playerShip.planTrip({ x: gs.star.planets[0].x - shipBaseSpeed, y: gs.star.planets[0].y }, gs.star.planets[0], -1);
    gs.now = 0;
    startGame();
}

function loadGame() {
    loadGS(JSON.parse(localStorage.space2d3_2));
    startGame();
}

function startGame() {
    wm.myShip = gs.playerShip;
    wm.drawMyShip(ctx);
    w.jumpTo(wm.oneShipData.x0 + 1, wm.oneShipData.y0 + 1);
    gs.walkManager = wm;
    gs.walkCTX = ctx;
    gebi('main').style.display = 'flex';
    gs.arrive();
    showDate(Math.floor(gs.now));
    window.gs = gs;
}

if (localStorage.space2d3_2) {
    gebi('loadGame').style.display = '';
    gebi('loadGame').onclick = loadGame;
}

gebi('newGameEasy').onclick = () => { newGame(newEasyShip) };
gebi('newGameHard').onclick = () => { newGame() };

(gebi('mainMenu') as HTMLDialogElement).showModal();

window.onkeypress = (e) => {
    switch (e.key) {
        case 'w': w.goUp(); break;
        case 'a': w.goLt(); break;
        case 's': w.goDn(); break;
        case 'd': w.goRt(); break;
    }
}

function onEnter(c?: Component) {
    if (!c) return;
    gebi('currentComponent').innerHTML = `#${c.typename} {display:block}`
    if (c.cellName)
        gebi('componentLegend').innerText = `${c.cellName}: ${c.typename}`
    else
        gebi('componentLegend').innerText = `${c.typename}`
    c.onEnter(gs)
}

export function setStatus(s: string) {
    gebi('status').innerText = s;
}

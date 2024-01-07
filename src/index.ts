//import { } from "./draw.js";
import { PlayerShip } from "./playerShip.js";
import { ShipData } from "./ship.js";
import { Component } from "./components.js";
import { showDate } from "./draw.js";
import { Walker } from "./walker.js";
import { Star } from "./stars.js";
import { gs, loadGS, newGS } from "./gameState.js";
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

var c = gebi("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d") as CanvasRenderingContext2D;

w.box = gebi('canvasBox')
w.human = gebi('human')
w.canvas = c
w.ctx = ctx
w.onEnter = onEnter
window.onresize = () => { gs.walker.reposition(true) }

function newGame(shipData?: ShipData) {
    newGS();
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
    if (!loadGS(JSON.parse(localStorage.space2d3_2))) return false;
    startGame();
    return true;
}

function startGame() {
    w.myShip = gs.playerShip;
    w.drawMyShip();
    w.jumpTo(w.oneShipData.x0 + 1, w.oneShipData.y0 + 1);
    gs.walker = w;
    gebi('main').style.display = 'flex';
    gs.arrive();
    showDate(Math.floor(gs.now));
    window.gs = gs;
}

gebi('newGameEasy').onclick = () => { newGame(newEasyShip) };
gebi('newGameHard').onclick = () => { newGame() };

if (localStorage.space2d3_2) {
    if (!loadGame()) {
        localStorage.space2d3_2 = prompt('Error loading game. Fix savegame data below or press Cancel to delete savegame and start anew', localStorage.space2d3_2);
        location.reload();
    }
} else (gebi('newGameDialog') as HTMLDialogElement).showModal();

gebi('newGameButton').onclick = () => {
    gebi('newGameCancelBox').style.display = '';
    (gebi('newGameDialog') as HTMLDialogElement).showModal();
};

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

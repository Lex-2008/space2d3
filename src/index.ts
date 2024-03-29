//import { } from "./draw.js";
import { PlayerShip } from "./playerShip.js";
import { ShipData } from "./ship.js";
import { Component } from "./components.js";
import { gebi, setStatus, showDate, toPoint } from "./utils.js";
import { Walker } from "./walker.js";
import { Star } from "./stars.js";
import { GS, gs, loadGS, newGS } from "./gameState.js";
import { shipBaseSpeed } from "./const.js";
import { draw_star } from "./draw.js";

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

const newEasyShip = {
    "n": "Your Ship", "c": "#5E5E5E", 'i': {
        "a": false, "o": [0, 0],
        "r": [[{ "t": "CargoBay", "c": [] }], [{ "t": "Ballast" }]]
    }, "frX": 0, "frY": 0,
    "frT": -1, "toP": 0, "toT": 0, "p": true
}
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    newEasyShip.c = '#919191';
}

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

    gs.playerShip.fromPoint = toPoint(gs.star.planets[1]);
    gs.playerShip.toPlanet = gs.star.planets[1];
    // gs.playerShip.planTrip({ x: gs.star.planets[0].x - shipBaseSpeed, y: gs.star.planets[0].y }, gs.star.planets[0], -1);
    gs.now = 0;
    startGame(true);
}

function loadGame() {
    if (!loadGS(JSON.parse(localStorage.space2d3_3))) return false;
    startGame();
    return true;
}

function startGame(newGame = false) {
    w.myShip = gs.playerShip;
    w.drawMyShip();
    w.jumpTo(w.oneShipData.x0 + 1, w.oneShipData.y0 + 1);
    gs.walker = w;
    gebi('main').style.display = 'flex';
    gs.state = GS.flying;
    gs.arrive(!newGame, newGame); //do not trigger onEnter on loadGame (you're supposed to reused saved data instead of regenerating new one); do not save on new game
    showDate(Math.floor(gs.now));
    const c = gebi('systemCanvas') as HTMLCanvasElement;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    draw_star(ctx, gs.star);
    for (let ship of gs.star.ships) {
        ship.updateSpaceXY(gs.now, false);
    }
    setStatus('ship', 'none'); //in case a game is already in progress
    window.gs = gs;
}

gebi('newGameEasy').onclick = () => { newGame(newEasyShip) };
gebi('newGameHard').onclick = () => { newGame() };

if (localStorage.space2d3_3) {
    if (!loadGame()) {
        localStorage.space2d3_3 = prompt('Error loading game. Fix savegame data below or press Cancel to delete savegame and start anew', localStorage.space2d3_3) || '';
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

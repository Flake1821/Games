import { Game } from './game.js';

const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const waveEl = document.getElementById('wave');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start');

const game = new Game({
  hud,
  scoreEl,
  healthEl,
  waveEl,
  overlayEl: overlay,
});

startButton.addEventListener('click', () => {
  overlay.querySelector('h2').textContent = 'Click to Start';
  overlay.querySelector('p').textContent = 'Defend the arena by blasting the incoming drones. Good luck, pilot!';
  game.start();
});

document.addEventListener('pointerlockerror', () => {
  overlay.querySelector('h2').textContent = 'Pointer Lock Error';
  overlay.querySelector('p').textContent = 'Your browser blocked pointer lock. Please enable it and try again.';
  overlay.classList.add('visible');
});

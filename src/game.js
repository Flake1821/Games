import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.7;
const WALK_SPEED = 9;
const SPRINT_MULTIPLIER = 1.6;
const BULLET_SPEED = 70;
const BULLET_LIFETIME = 1.4;
const ENEMY_SPEED = 2.8;
const ENEMY_SPAWN_RADIUS = 28;
const ENEMY_DAMAGE = 18;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class Game {
  constructor({ hud, scoreEl, healthEl, waveEl, overlayEl }) {
    this.hud = hud;
    this.scoreEl = scoreEl;
    this.healthEl = healthEl;
    this.waveEl = waveEl;
    this.overlayEl = overlayEl;

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0b1220, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(0, PLAYER_HEIGHT, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    document.body.appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, document.body);
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };

    this.score = 0;
    this.health = 100;
    this.wave = 1;
    this.active = false;

    this.enemies = [];
    this.bullets = [];
    this.spawnBudget = 0;
    this.timeSinceLastSpawn = 0;
    this.timeSinceLastShot = 0;

    this._setupScene();
    this._setupEvents();
  }

  _setupScene() {
    this.scene.background = new THREE.Color(0x060918);

    const ambient = new THREE.AmbientLight(0x6b7280, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(12, 18, 10);
    dir.castShadow = true;
    dir.shadow.camera.top = 20;
    dir.shadow.camera.bottom = -20;
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.mapSize.set(1024, 1024);
    this.scene.add(dir);

    const floorGeo = new THREE.CircleGeometry(60, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x111827,
      metalness: 0.2,
      roughness: 0.75,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(60, 60, 0x38bdf8, 0x1f2937);
    grid.position.y = 0.02;
    this.scene.add(grid);

    const rimGeo = new THREE.TorusGeometry(60, 0.3, 16, 100);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.1;
    this.scene.add(rim);
  }

  _setupEvents() {
    window.addEventListener('resize', () => this._onResize());

    document.addEventListener('keydown', (event) => this._onKey(event, true));
    document.addEventListener('keyup', (event) => this._onKey(event, false));

    document.addEventListener('mousedown', (event) => {
      if (!this.active) {
        return;
      }
      if (event.button === 0) {
        this._shoot();
      }
    });

    this.controls.addEventListener('lock', () => {
      this.overlayEl.classList.remove('visible');
      this.active = true;
      this.clock.getDelta();
    });

    this.controls.addEventListener('unlock', () => {
      this.overlayEl.classList.add('visible');
      this.active = false;
    });
  }

  start() {
    this._reset();
    this.controls.lock();
    this.renderer.setAnimationLoop((time) => this._update(time));
  }

  _reset() {
    this.score = 0;
    this.health = 100;
    this.wave = 1;
    this.spawnBudget = 0;
    this.timeSinceLastSpawn = 0;
    this.enemies.forEach((enemy) => this.scene.remove(enemy.mesh));
    this.bullets.forEach((bullet) => this.scene.remove(bullet.mesh));
    this.enemies = [];
    this.bullets = [];
    this._startWave();
    this._updateHUD();
  }

  _startWave() {
    const baseEnemies = 4;
    this.spawnBudget = baseEnemies + (this.wave - 1) * 3;
    this.timeSinceLastSpawn = 0;
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _onKey(event, down) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = down;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = down;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = down;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = down;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = down;
        break;
      default:
        break;
    }
  }

  _shoot() {
    const now = performance.now();
    if (now - this.timeSinceLastShot < 180) {
      return;
    }
    this.timeSinceLastShot = now;

    const geometry = new THREE.SphereGeometry(0.12, 12, 12);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xf472b6,
      emissiveIntensity: 1.8,
      metalness: 0.1,
      roughness: 0.3,
    });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.castShadow = true;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    bullet.position.copy(this.camera.position);
    bullet.position.y -= 0.2;

    const velocity = direction.multiplyScalar(BULLET_SPEED);

    this.scene.add(bullet);
    this.bullets.push({
      mesh: bullet,
      velocity,
      createdAt: performance.now(),
    });
  }

  _spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = ENEMY_SPAWN_RADIUS * (0.6 + Math.random() * 0.4);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const geometry = new THREE.DodecahedronGeometry(1.2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x1d4ed8,
      metalness: 0.5,
      roughness: 0.35,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, PLAYER_HEIGHT, z);
    mesh.castShadow = true;

    this.scene.add(mesh);

    this.enemies.push({
      mesh,
      velocity: new THREE.Vector3(),
      radius: 1.1,
      alive: true,
    });
  }

  _update(time) {
    const delta = this.clock.getDelta();
    this._updatePlayer(delta);
    this._updateBullets(delta);
    this._updateEnemies(delta);

    this.renderer.render(this.scene, this.camera);
  }

  _updatePlayer(delta) {
    if (!this.active) {
      return;
    }

    const moveSpeed = WALK_SPEED * (this.keys.sprint ? SPRINT_MULTIPLIER : 1);
    const distance = moveSpeed * delta;

    if (this.keys.forward) this.controls.moveForward(distance);
    if (this.keys.backward) this.controls.moveForward(-distance);
    if (this.keys.left) this.controls.moveRight(-distance);
    if (this.keys.right) this.controls.moveRight(distance);

    const position = this.controls.getObject().position;
    const maxRadius = 55;
    const horizontal = Math.sqrt(position.x ** 2 + position.z ** 2);
    if (horizontal > maxRadius) {
      const correction = position.clone().setY(0).normalize().multiplyScalar(maxRadius);
      position.x = correction.x;
      position.z = correction.z;
    }

    position.y = PLAYER_HEIGHT;
  }

  _updateBullets(delta) {
    const now = performance.now();

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.mesh.position.addScaledVector(bullet.velocity, delta);

      if (now - bullet.createdAt > BULLET_LIFETIME * 1000) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (!enemy.alive) continue;
        const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
        if (distance < enemy.radius + 0.4) {
          enemy.alive = false;
          this.scene.remove(enemy.mesh);
          this.enemies.splice(j, 1);

          this.scene.remove(bullet.mesh);
          this.bullets.splice(i, 1);

          this.score += 15;
          this._updateHUD();
          break;
        }
      }
    }
  }

  _updateEnemies(delta) {
    if (!this.active) {
      return;
    }

    this.timeSinceLastSpawn += delta;

    const spawnInterval = Math.max(0.9 - this.wave * 0.05, 0.35);

    if (this.spawnBudget > 0 && this.timeSinceLastSpawn >= spawnInterval) {
      this.timeSinceLastSpawn = 0;
      this.spawnBudget -= 1;
      this._spawnEnemy();
    }

    const playerPos = this.controls.getObject().position.clone();

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const direction = playerPos.clone().sub(enemy.mesh.position);
      direction.y = 0;
      const distance = direction.length();
      direction.normalize();

      enemy.mesh.position.addScaledVector(direction, ENEMY_SPEED * delta);
      enemy.mesh.position.y = PLAYER_HEIGHT;
      enemy.mesh.rotation.y += delta * 2;

      if (distance < enemy.radius + 0.6) {
        this.scene.remove(enemy.mesh);
        this.enemies.splice(i, 1);
        this.health -= ENEMY_DAMAGE;
        this._updateHUD();
        if (this.health <= 0) {
          this._gameOver();
          return;
        }
      }
    }

    if (this.spawnBudget <= 0 && this.enemies.length === 0) {
      this.wave += 1;
      this._updateHUD();
      this._startWave();
    }
  }

  _gameOver() {
    this.active = false;
    this.overlayEl.classList.add('visible');
    this.overlayEl.querySelector('h2').textContent = 'Game Over';
    this.overlayEl.querySelector('p').textContent = `Final score: ${this.score}. Click to try again.`;
    this.controls.unlock();
  }

  _updateHUD() {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.healthEl.textContent = `Health: ${clamp(Math.round(this.health), 0, 100)}`;
    this.waveEl.textContent = `Wave: ${this.wave}`;
  }
}

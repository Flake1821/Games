# Neon Arena

A lightweight browser-based 3D survival shooter built with Three.js. Strafe around a neon arena, blast drones, and see how long you can survive.

## Features

- Fast-paced pointer-lock controls with WASD movement and sprinting
- Neon-themed arena with emissive lighting and volumetric fog
- Procedurally spawning dodecahedron drones that close in on the player
- Projectile-based shooting with collision detection and score tracking
- Wave system that escalates difficulty and tracks your progress

## Getting Started

No build step is required. You can run the game with any static web server.

```bash
# from the repository root
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser and click **Enter the Arena**.

## Testing the Game Locally

1. Start a static server (for example with `python3 -m http.server 8000` as shown above).
2. Visit <http://localhost:8000> in a modern desktop browser such as Chrome, Edge, or Firefox.
3. Click the **Enter the Arena** button and grant the pointer-lock permission when prompted.
4. Use the controls below to move and shoot. The heads-up display (HUD) will show your score, health, and the current wave.
5. Refresh the page to restart the session.

> **Tip:** The game relies on the Pointer Lock API. Your browser will ask for permission the first time you click the play button.

## Controls

| Action | Key |
| --- | --- |
| Move | WASD / Arrow Keys |
| Sprint | Hold Shift |
| Aim | Mouse |
| Shoot | Left Mouse Button |

Enjoy the fight!

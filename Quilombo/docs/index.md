# Quilombo — Game Wiki

**Quilombo** is a Zelda-inspired top-down 2D action-adventure game built with Phaser 3 and TypeScript. Players explore dungeon rooms, fight enemies, solve light puzzles, collect keys and items, and face a boss.

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Phaser 3 | 3.87.0 | Game engine (WebGL, physics, input, scenes) |
| TypeScript | 5.7.3 | Language |
| Vite | 6.0.7 | Build tool / dev server |
| Tiled | — | Level/map editor (exported as JSON) |

**Resolution:** 256×224 pixels (native pixel art), scales responsively to any screen size via FIT mode.

**Platform:** Web browser (desktop and mobile). Touch controls are optional and togglable.

---

## Feature Summary

- Room-based dungeon exploration with camera transitions
- 4-directional movement, sword combat, and object interaction
- 3 enemy types: Spider (wanderer), Wisp (floater), Drow (boss)
- Component-based entity architecture with a state machine per character
- Heart-based health system with invulnerability frames
- Keys, chests, and locked doors with item progression
- Virtual joystick and touch buttons for mobile play
- Parallel scene architecture (HUD and touch controls in separate scenes)
- Event-driven cross-scene communication via a global EventBus
- Responsive pixel art scaling — works on any device size

---

## Wiki Contents

| Page | Description |
|---|---|
| [Architecture](architecture.md) | High-level system design, patterns, and how all systems connect |
| [Scenes](scenes.md) | All 7 Phaser scenes, their roles, and lifecycle |
| [Player](player.md) | Player stats, controls, states, animations, and components |
| [Enemies](enemies.md) | Spider, Wisp, and Drow Boss — AI behavior and stats |
| [Combat](combat.md) | Damage flow, weapons, invulnerability, and hit resolution |
| [Levels](levels.md) | World/dungeon structure, Tiled maps, rooms, and transitions |
| [UI & HUD](ui.md) | Heart display, dialog box, menus, and touch control overlay |
| [Input](input.md) | Keyboard, touch, and combined input abstraction |
| [Progression](progression.md) | Keys, chests, items, inventory, and boss progression |
| [Events](events.md) | EventBus system and all custom game events |
| [NPCs](npcs.md) | NPC types, architecture, interaction flow, and Tiled integration (designed) |
| [Dialogue](dialogue.md) | Paged dialogue box UI and data model (designed) |

---

## Project Structure

```
Quilombo/
├── src/
│   ├── main.ts                  Game configuration and entry point
│   ├── scenes/                  All Phaser scenes
│   ├── game-objects/            Player, enemies, weapons, interactive objects
│   │   ├── player/
│   │   ├── enemies/
│   │   │   └── boss/
│   │   ├── weapons/
│   │   ├── interactive/
│   │   └── npc/                 (planned — see docs/npcs.md)
│   ├── components/              ECS-style components + state machine
│   │   ├── game-object/         Animation, Life, Speed, etc.
│   │   ├── input/               Keyboard, touch, combined input
│   │   └── state-machine/       State machine + all character states
│   ├── ui/                      Virtual joystick and touch buttons
│   └── common/                  Config, types, event bus, utilities
│       └── npc-configs.ts       NPC dialogue registry (planned)
├── public/assets/
│   ├── images/                  Spritesheets, tilemaps, UI images
│   ├── data/assets.json         Asset pack manifest
│   └── fonts/                   Press Start 2P (pixel font)
├── index.html
├── vite.config.js
└── docs/                        This wiki
```

---

## Glossary

| Term | Meaning |
|---|---|
| Room | A bounded area within a level, separated by doors |
| State Machine | A system that controls character behavior via discrete named states |
| Component | A reusable behavior/data module attached to a game object |
| EventBus | A global publish/subscribe system for cross-scene communication |
| Tiled | The map editor used to define levels, rooms, doors, enemies, and objects |
| HUD | Heads-Up Display — the in-game UI overlay (hearts, dialog) |
| Invulnerability | A brief window after being hit where no further damage can be taken |

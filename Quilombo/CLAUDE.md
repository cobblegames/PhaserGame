# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install --frozen-lockfile  # Install dependencies
pnpm start                      # Dev server at http://localhost:8080 (hot reload)
pnpm build                      # TypeScript check + production bundle to dist/
pnpm lint                       # ESLint (config at config/eslint.config.mjs)
```

No test suite exists in this project.

## Architecture

### Scene Graph
The game uses **parallel scenes** running simultaneously during gameplay:
- `PreloadScene` → `StartScene` → `GameScene` + `UiScene` + `TouchControlsScene` (launched together)
- `GameOverScene` stops the parallel scenes before starting

Scene keys are in `src/scenes/scene-keys.ts`. When transitioning between major states, always check `scene.isActive()` before stopping/launching to avoid double-start bugs.

### Component System (ECS-inspired)
Components extend `BaseGameObjectComponent` and self-attach to sprites via `gameObject['_ComponentName']`. Retrieve them with the static `getComponent<T>()` method:

```ts
const weapon = WeaponComponent.getComponent<WeaponComponent>(sprite);
```

All character components live in `src/components/game-object/`. Every character (`CharacterGameObject`) composes: `ControlsComponent`, `SpeedComponent`, `DirectionComponent`, `AnimationComponent`, `InvulnerableComponent`, `LifeComponent`, and a `StateMachine`.

### State Machine
`StateMachine` (`src/components/state-machine/state-machine.ts`) queues transitions to avoid mid-frame corruption. States implement the `State` interface with optional `onEnter(args)` and `onUpdate()`. Character states are in `src/components/state-machine/states/character/`.

### Input Abstraction
`InputComponent` (abstract base) is implemented by:
- `KeyboardComponent` — WASD/arrow + Z/X
- `TouchComponent` — virtual joystick + buttons
- `CombinedInputComponent` — OR-logic over both

The player and all character states read from `InputComponent` only, never directly from Phaser input.

### Singletons
| Singleton | Location | Role |
|-----------|----------|------|
| `DataManager` | `src/common/data-manager.ts` | Session state: health, chest/door state, current area |
| `EVENT_BUS` | `src/common/event-bus.ts` | Global `Phaser.Events.EventEmitter` |
| `InventoryManager` | `src/components/inventory/inventory-manager.ts` | Keys, boss key, items |

`DataManager.instance.updatePlayerCurrentHealth(n)` automatically fires `CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED` — never emit it manually.

### Room System
Levels are Tiled JSON tilemaps in `public/assets/images/levels/`. `GameScene` parses objects by `roomId` property and enables/disables game objects as the player moves between rooms. Door transitions use camera tweens. `LevelData` (`{ level, roomId, doorId }`) is passed as scene data when starting `GameScene`.

### Key Constants
All tuneable values (speeds, HP, timings, touch layout) are in `src/common/config.ts`. Prefer adding constants there over inline magic numbers.

## Conventions

- **Private fields:** ES2022 `#field` syntax (not `private`)
- **Constants:** `UPPER_SNAKE_CASE`; string enum-like objects use `as const`
- **Files:** `kebab-case.ts`; **Classes:** `PascalCase`
- **Adding an enemy:** extend `CharacterGameObject`, wire states via `StateMachine`, register the Tiled object type in `GameScene`
- **Scene cleanup:** register cleanup in `this.events.once(Phaser.Scenes.Events.SHUTDOWN, ...)` — clear Maps, null references, and reset flags so `create()` is safe to call again on restart

## Asset Pipeline

Static assets go in `public/assets/`. Sprites use Aseprite-exported JSON atlas format. Levels are Tiled JSON. New assets must be registered in the preload asset pack (loaded in `PreloadScene`).

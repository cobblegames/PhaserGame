# Architecture

Quilombo is built around several interacting systems. This page describes the high-level design, key patterns, and how each system relates to the others.

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         Phaser Game                             │
│                                                                 │
│  ┌──────────────┐   launches   ┌──────────┐  ┌──────────────┐   │
│  │  GameScene   │─────────────▶│ UIScene  │  │TouchControls │   │
│  │  (gameplay)  │              │  (HUD)   │  │   Scene      │   │
│  └──────┬───────┘              └──────────┘  └──────────────┘   │
│         │                           ▲                ▲          │
│         │ contains                  │                │          │
│         ▼                           └────────────────┘          │
│  ┌────────────────────────────────────────┐                     │
│  │           Game Objects                 │  EventBus           │
│  │  Player ── CharacterGameObject         │  (global pub/sub)   │
│  │  Spider ─┘     │                       │                     │
│  │  Wisp   ─┐     │ has                   │                     │
│  │  Drow    ┘  Components                 │                     │
│  │             │                          │                     │
│  │             ├─ AnimationComponent      │                     │
│  │             ├─ LifeComponent           │                     │
│  │             ├─ SpeedComponent          │                     │
│  │             ├─ DirectionComponent      │                     │
│  │             ├─ ControlsComponent       │                     │
│  │             ├─ InvulnerableComponent   │                     │
│  │             ├─ WeaponComponent         │                     │
│  │             └─ StateMachine            │                     │
│  │                                        │                     │
│  │  NpcGameObject (planned)               │                     │
│  │  Villager ─┐    │                      │                     │
│  │  Guide    ─┤    ├─ AnimationComponent  │                     │
│  │  Shopkeep ─┤    ├─ DirectionComponent  │                     │
│  │  QuestGvr ┘    └─ InteractiveObject   │                     │
│  └────────────────────────────────────────┘                     │
│                                                                 │
│  Singletons: DataManager · InventoryManager · EventBus          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Design Patterns

### 1. Component-Based Entities (ECS-Inspired)

Game objects (Player, Spider, Wisp, Drow) are not monolithic classes. Instead, each one is composed of small, focused **components** that handle a single responsibility:

- **LifeComponent** — tracks current and maximum health
- **SpeedComponent** — stores movement speed
- **DirectionComponent** — tracks facing direction, fires callbacks on change
- **AnimationComponent** — drives sprite animation playback
- **ControlsComponent** — wraps an input source (keyboard or touch)
- **InvulnerableComponent** — manages the post-hit immunity window
- **WeaponComponent** — attaches a weapon physics body to the entity
- **CollidingObjectsComponent** — tracks which objects are touching this frame
- **HeldGameObjectComponent** — manages the currently carried object (pots)
- **InteractiveObjectComponent** — defines interaction type and callback

All characters share a common base class (`CharacterGameObject`) that composes these components and exposes shared methods like `hit()`, `disableObject()`, and `enableObject()`.

### 2. State Machine

Every character has a **StateMachine** that controls its behavior. At any moment, exactly one state is active. States implement two methods:

- `onEnter(args)` — called once when the state becomes active
- `onUpdate()` — called every frame while the state is active

State transitions are **queued** — if a transition is requested while the machine is mid-transition, it is added to a queue and processed after the current transition completes. This prevents states from being interrupted in broken ways.

Player states include: Idle, Move, Attack, Hurt, Death, Lift, IdleHolding, MoveHolding, Throw, OpenChest.

Enemy states include: Idle, Move, BounceMove, Hurt, Death, and boss-specific states (Hidden, Teleport, PrepareAttack).

### 3. Input Abstraction

Input handling is abstracted behind a common interface (`InputComponent`) so that player control source can be swapped without changing gameplay logic:

```
InputComponent (abstract interface)
    ├── KeyboardComponent     — reads Phaser keyboard cursors
    ├── TouchComponent        — reads virtual joystick + buttons
    └── CombinedInputComponent — OR-merges keyboard + touch
```

The player holds a `ControlsComponent` that wraps whichever `InputComponent` is active. Enemies use the same interface but drive it programmatically from their AI logic.

### 4. Event-Driven Communication

Scenes and systems communicate via a global **EventBus** (publish/subscribe singleton). This keeps scenes decoupled — `GameScene` does not hold a reference to `UIScene`, it simply emits events and the UI listens.

Example: when the player takes damage, `DataManager` emits `PLAYER_HEALTH_UPDATED` → `UIScene` listens and updates the heart display. Neither system needs to know about the other.

See [Events](events.md) for the full event list.

### 5. Singleton State

Three singletons hold shared state across the lifetime of a game session:

| Singleton | Responsibility |
|---|---|
| **DataManager** | Player health, current area, room/door/chest states, touch preference |
| **InventoryManager** | Keys, boss key, map, compass, sword |
| **EventBus** | Global publish/subscribe message bus |

These are not Phaser-specific — they are plain TypeScript singletons accessible from any scene or game object.

### 6. Parallel Scene Architecture

Phaser allows multiple scenes to run simultaneously. Quilombo uses this to keep concerns separated while sharing the same game clock:

```
┌─────────────────────────────────────────────────┐
│  GameScene          (gameplay — runs always)    │
│  UIScene            (HUD — launched by Game)    │
│  TouchControlsScene (overlay — optional)        │
└─────────────────────────────────────────────────┘
```

When the player dies, `GameScene` explicitly stops both sibling scenes before transitioning to `GameOverScene`. When touch controls are disabled in options, `TouchControlsScene` is stopped.

### 7. Factory Pattern (Enemy & NPC Spawning)

Enemies are not hard-coded into scenes. Instead, the `GameScene` reads Tiled map object data and uses a factory approach: the numeric `type` field on each Tiled enemy object maps to a specific enemy class (`1=Spider`, `2=Wisp`, `3=Drow`). This makes adding new enemy types a matter of adding a new class and registering the type number.

The same pattern is planned for NPCs: each Tiled NPC object carries an `npcId` string that maps to an `NpcData` record in `npc-configs.ts` and an `NpcGameObject` subclass. See [NPCs](npcs.md).

### 8. Data-Driven Level Design

Levels are authored in **Tiled** and exported as JSON. The game reads these files at runtime to place doors, enemies, chests, pots, and switches. Room bounds, transition targets, item contents, and trigger relationships are all stored as Tiled object properties — not hard-coded in TypeScript.

See [Levels](levels.md) for details.

---

## File Organization

| Directory | Contents |
|---|---|
| `src/scenes/` | All Phaser scene classes |
| `src/game-objects/` | Player, enemies, weapons, interactive objects |
| `src/game-objects/npc/` | NPC classes (planned — see [NPCs](npcs.md)) |
| `src/components/game-object/` | Reusable entity components |
| `src/components/input/` | Input abstraction layer |
| `src/components/state-machine/` | State machine + all state implementations |
| `src/ui/` | VirtualJoystick, TouchButton classes |
| `src/common/` | Config constants, types, EventBus, DataManager, utilities |
| `src/common/npc-configs.ts` | NPC dialogue data registry (planned) |
| `public/assets/` | Images, tilemaps, fonts, asset manifest |

---

## Planned Systems

| System | Status | Doc |
|---|---|---|
| NPC characters | Designed, not yet implemented | [npcs.md](npcs.md) |
| Paged dialogue box | Designed, not yet implemented | [dialogue.md](dialogue.md) |
| Shop UI | Stub only (Phase 6) | [npcs.md](npcs.md) |
| Quest system | Stub only (Phase 6) | [npcs.md](npcs.md) |
| Audio | Not started | — |
| Town / hub area | Not started | — |

---

## Key Constraints & Notes

- **No audio system** — sound effects and music are not yet implemented.
- **No localStorage** — all game state is session-only; progress resets on page refresh.
- **No score system** — the game tracks progression (keys, boss defeated) but not a numeric score.
- **Health increase not implemented** — max health is fixed at 6 HP (3 hearts).

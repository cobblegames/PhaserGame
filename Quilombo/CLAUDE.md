Quilombo - Phaser Zelda-like Game
Project Overview
Quilombo is a top-down action-adventure game inspired by classic Zelda titles, built with Phaser 3 and TypeScript. The game features room-based dungeons, combat, puzzles, and a boss fight, with a modular component-based architecture.

Genre: 2D Action-Adventure
Engine: Phaser 3 (WebGL)
Language: TypeScript
Resolution: 256x224 (pixel art)
Physics: Arcade Physics (zero gravity)

Tech Stack
Phaser 3 – Game framework

TypeScript – Strongly typed language

Tiled – Level editor (JSON tilemaps)

Aseprite – Sprite animations

HTML5/CSS – Minimal for container

Project Structure
text
src/
├── main.ts                     # Phaser game config & entry point
├── config.ts                   # Constants (debug, speeds, etc.)
├── scenes/
│   ├── preload-scene.ts        # Asset loading
│   ├── start-scene.ts          # Main menu
│   ├── game-scene.ts           # Core gameplay
│   ├── ui-scene.ts             # HUD (hearts, dialog)
│   └── game-over-scene.ts      # Death screen
├── objects/                    # Game objects (player, enemies, items)
│   ├── player/
│   ├── enemies/
│   └── interactive/
├── components/                 # ECS-like components
├── state-machine/              # Custom state machine
├── data-manager.ts             # Singleton for game state
├── event-bus.ts                # Global event system
└── utils/                      # Helpers
Key Architectural Patterns
Component-Based (ECS-inspired)
Entities composed of reusable components (e.g., AnimationComponent, DirectionComponent, SpeedComponent).

Promotes flexibility and code reuse.

State Machine
Custom StateMachine class manages character states (Idle, Move, Attack, Hurt, etc.).

States can queue transitions and have enter/update/exit methods.

Used for player, enemies, and boss.

Event Bus
Global EVENT_BUS (singleton) decouples scenes and objects.

Common events: OPENED_CHEST, ENEMY_DESTROYED, PLAYER_DEFEATED, PLAYER_HEALTH_UPDATED.

Singleton Managers
DataManager: Persists game state (chests, doors, boss defeats, health) across scenes.

EventBus: Central event handling.

Factory Pattern
Enemy creation based on Tiled object types (spider, wisp, drow boss).

Core Game Mechanics
Player
Movement: WASD/arrow keys, 80 px/s.

Combat: Sword attack (directional) dealing 1 damage.

Interaction: Lift and throw pots (damages enemies).

Health: 6 HP (3 hearts), 1-second invulnerability after hit.

States: Idle, Move, Attack, Lift, Throw, Hurt, Death.

Enemies
Spider: Random movement, 2 HP.

Wisp: Follows player when close, 1 HP, passes through objects.

Drow Boss: Multi-state (Hidden, Idle, Teleport, PrepareAttack, Attack), throws daggers, 6 HP.

Rooms & Transitions
Tiled tilemap parsed by room ID.

Only objects in current room are enabled (performance optimization).

Door triggers cause camera tween and load adjacent room.

Interactive Objects
Chests: Contain keys, maps, compass, boss key; open with action button.

Doors: Normal, locked (needs small key), boss (needs boss key), trap.

Switches: Floor switches that reveal chests or open doors (configurable in Tiled).

Pots: Can be lifted and thrown; break on collision.

UI
Hearts: Display player health (up to 20 hearts, two rows).

Dialog Box: Shows messages (auto-closes after 3 seconds).

Progression
Keys, boss key, and map status persist via DataManager.

Note: No localStorage; progress lost on page refresh.

Code Conventions
Naming
Constants: UPPER_SNAKE_CASE

Private members: Prefix with # (ES2022 private fields)

Files: kebab-case (e.g., game-scene.ts)

Classes: PascalCase

File Organization
Each scene in its own file.

Components grouped by function.

Enemy types in enemies/ subfolder.

Comments
Sparse but used for complex logic.

TODO comments indicate unfinished features.

Important Classes & Modules
Class/Module	Responsibility
GameScene	Main gameplay loop, room management, collisions.
Player	Player entity with state machine and components.
Enemy (base)	Abstract enemy with common behavior.
DataManager	Singleton storing chests, doors, keys, health.
EventBus	Global event emitter/listener.
StateMachine	Generic state machine for characters.
KeyboardComponent	Wraps Phaser keyboard input.
WeaponComponent	Handles weapon logic (currently sword).
HeldGameObjectComponent	Tracks objects held by player.
Development Guidelines
Adding a New Enemy
Create a new class extending Enemy in objects/enemies/.

Define states using StateMachine (or extend base enemy states).

Register creation in the factory (based on Tiled object type).

Add sprite to asset pack and preload.

Adding a New Interactive Object
Create component(s) if needed.

In GameScene, parse Tiled objects and instantiate with custom properties.

Add to appropriate physics group (e.g., #switchGroup for overlaps).

Implement interaction logic (often via event bus).

Creating a New Room
Design in Tiled, ensuring unique room IDs and door connections.

Place objects with correct types and custom properties.

Add tilemap JSON to assets.json.

Modifying UI
UiScene handles HUD elements.

Update health via EVENT_BUS.emit(CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED, health).

Show dialog via EVENT_BUS.emit(CUSTOM_EVENTS.SHOW_DIALOG, text).

Known Issues & TODOs
Data persistence: No localStorage; progress lost on refresh.

Magic numbers: UI positions and timings scattered; should be moved to constants.

Incomplete features: "Options" menu does nothing; health increase logic not implemented.

Large methods: GameScene#create() and #registerColliders() need refactoring.

Error handling: Missing checks for missing assets.

Asset key safety: Dynamic asset key strings may fail silently.

Event cleanup: Some listeners not removed on scene shutdown (potential memory leaks).

Commented code: Leftover code should be removed or implemented.

Performance Considerations
Room-based rendering: Objects outside current room are disabled.

Physics groups: Separate groups for walls, doors, switches, enemies.

No asset unloading: All assets remain in memory; consider on-demand loading for larger projects.

Object reuse: Pots and enemies are disabled/recycled instead of destroyed.

Build & Run
Development: npm start (likely uses webpack/vite)

Production build: npm run build

Assets: Located in public/assets/; referenced via assets.json.
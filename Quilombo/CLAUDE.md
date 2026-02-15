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

Touch Controls – Virtual joystick and buttons for mobile support

Project Structure
text
src/
├── main.ts                     # Phaser game config & entry point
├── config.ts                   # Constants (debug, speeds, etc.)
├── scenes/
│   ├── preload-scene.ts        # Asset loading
│   ├── start-scene.ts          # Main menu
│   ├── options-scene.ts        # Options menu (touch controls toggle)
│   ├── game-scene.ts           # Core gameplay
│   ├── ui-scene.ts             # HUD (hearts, dialog)
│   ├── touch-controls-scene.ts # Touch controls overlay
│   └── game-over-scene.ts      # Death screen
├── objects/                    # Game objects (player, enemies, items)
│   ├── player/
│   ├── enemies/
│   └── interactive/
├── components/                 # ECS-like components
│   └── input/                  # Input components (keyboard, touch, combined)
├── ui/                         # UI components (joystick, buttons)
├── state-machine/              # Custom state machine
├── data-manager.ts             # Singleton for game state
├── event-bus.ts                # Global event system
└── utils/                      # Helpers
Key Architectural Patterns
Component-Based (ECS-inspired)
Entities composed of reusable components (e.g., AnimationComponent, DirectionComponent, SpeedComponent).

Promotes flexibility and code reuse.

Input Abstraction
Abstract InputComponent base class allows multiple input sources (keyboard, touch, or combined).

Player states read from InputComponent interface, completely decoupled from input method.

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
Movement: WASD/arrow keys OR virtual joystick (touch), 80 px/s.

Combat: Sword attack via Z key or touch button (directional) dealing 1 damage.

Interaction: Lift and throw pots (damages enemies) via X key or touch button.

Health: 6 HP (3 hearts), 1-second invulnerability after hit.

States: Idle, Move, Attack, Lift, Throw, Hurt, Death.

Input: Supports keyboard, touch, or both simultaneously via CombinedInputComponent.

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

Menu Controls (Start Scene & Options Scene):
- Menu items are fully interactive via touch/mouse click
- Hover effects: Items dim to 80% alpha when hovered
- Press effects: Items dim to 60% alpha when pressed
- Cursor auto-follows hovered items
- Works seamlessly alongside keyboard navigation

Touch Controls (optional, enabled by default):
- Virtual Joystick: Left side of screen (0-103px), dynamic (appears on touch), 8-directional
- Attack Button: Bottom-right (224, 194), semi-transparent with "Z" label
- Action Button: Bottom-right (186, 194), semi-transparent with "X" label
- Toggle: Available in Options menu

Progression
Keys, boss key, map status, and touch controls preference persist via DataManager.

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
DataManager	Singleton storing chests, doors, keys, health, touch preference.
EventBus	Global event emitter/listener.
StateMachine	Generic state machine for characters.
InputComponent	Abstract base for all input types.
KeyboardComponent	Wraps Phaser keyboard input.
TouchComponent	Wraps touch input (joystick + buttons).
CombinedInputComponent	Combines keyboard + touch input (OR logic).
VirtualJoystick	Dynamic joystick with 8-directional input.
TouchButton	Touch button with pressed state.
TouchControlsScene	Manages touch UI and pointer events.
StartScene	Main menu with keyboard and touch/mouse interactive menu items.
OptionsScene	Settings menu for toggling touch controls with interactive menu items.
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
UiScene handles HUD elements (hearts, dialog).

TouchControlsScene handles touch controls overlay.

Update health via EVENT_BUS.emit(CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED, health).

Show dialog via EVENT_BUS.emit(CUSTOM_EVENTS.SHOW_DIALOG, text).

Toggle touch controls via EVENT_BUS.emit(CUSTOM_EVENTS.TOUCH_CONTROLS_TOGGLED, enabled).

Adding Touch Controls to Menu Scenes
Store menu text items as class properties for interaction.

Make items interactive via setInteractive({ useHandCursor: true }).

Add pointerover/pointerout handlers for hover effects (e.g., setAlpha(0.8)).

Add pointerdown/pointerup handlers for press feedback and action triggers.

Extract menu actions into separate methods for reusability.

Ensure cursor updates on hover to sync with keyboard navigation.

Known Issues & TODOs
Data persistence: No localStorage; progress lost on refresh.

Magic numbers: UI positions and timings scattered; should be moved to constants (partially addressed with TOUCH_* constants).

Incomplete features: Health increase logic not implemented.

Large methods: GameScene#create() and #registerColliders() need refactoring.

Error handling: Missing checks for missing assets.

Asset key safety: Dynamic asset key strings may fail silently.

Event cleanup: Some listeners not removed on scene shutdown (potential memory leaks).

Commented code: Leftover code should be removed or implemented.

Touch controls: Warning appears on startup about manual initialization (harmless but could be cleaned up).

Performance Considerations
Room-based rendering: Objects outside current room are disabled.

Physics groups: Separate groups for walls, doors, switches, enemies.

No asset unloading: All assets remain in memory; consider on-demand loading for larger projects.

Object reuse: Pots and enemies are disabled/recycled instead of destroyed.

Build & Run
Development: npm start (likely uses webpack/vite)

Production build: npm run build

Assets: Located in public/assets/; referenced via assets.json.

Touch Controls
Default: Enabled (can be toggled in Options menu)

Desktop: Keyboard + mouse/touch work simultaneously

Mobile: Touch controls provide full gameplay capability

Menu Navigation:
- Both Start Scene and Options Scene support direct touch/click on menu items
- Visual feedback on hover and press
- Keyboard navigation (arrow keys + action keys) still fully functional
- All menu interactions work on both desktop and mobile

Testing: Use Chrome DevTools mobile emulation or real mobile device
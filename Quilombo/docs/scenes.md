# Scenes

Quilombo uses 7 Phaser scenes. Three of them run simultaneously during gameplay; the rest are sequential menus and loading states.

---

## Scene Summary

| Scene | Key | When Active |
|---|---|---|
| PreloadScene | `PRELOAD_SCENE` | Game startup — loads all assets |
| StartScene | `START_SCENE` | Main menu |
| OptionsScene | `OPTIONS_SCENE` | Settings menu |
| GameScene | `GAME_SCENE` | Core gameplay |
| UIScene | `UI_SCENE` | HUD overlay (runs alongside GameScene) |
| TouchControlsScene | `TOUCH_CONTROLS_SCENE` | Touch input overlay (optional, alongside GameScene) |
| GameOverScene | `GAME_OVER_SCENE` | Death screen |

---

## Parallel Scene Architecture

During gameplay, three scenes run at the same time. Each has a dedicated camera layer and update loop:

```
┌──────────────────────────────────────────────────┐
│  Layer 3 (top): TouchControlsScene               │
│    Virtual joystick, attack/action buttons       │
├──────────────────────────────────────────────────┤
│  Layer 2: UIScene                                │
│    Heart display, dialog box                     │
├──────────────────────────────────────────────────┤
│  Layer 1 (bottom): GameScene                     │
│    World, player, enemies, objects               │
└──────────────────────────────────────────────────┘
```

`GameScene` launches `UIScene` and `TouchControlsScene` (if enabled) in its `create()` method. When transitioning away from gameplay (death, quit), `GameScene` explicitly stops the sibling scenes first.

---

## PreloadScene

**File:** `src/scenes/preload-scene.ts`

**Purpose:** Loads all game assets and registers animations before the first frame is rendered.

**What it does:**
- Loads the packed asset manifest (`assets/data/assets.json`) which contains all spritesheets, tilemaps, fonts, and images
- Creates all sprite animations using Phaser's `anims.createFromAseprite()` — reads Aseprite atlas metadata to generate frame-by-frame animations for:
  - Player (idle, walk, attack, hurt, die, lift, hold — in all 4 directions)
  - Enemies (spider, wisp, drow — walk, idle, hit, death)
  - Effects (enemy death particle, pot break, dagger flight)
  - UI (HUD number sprites)
- After loading, transitions to `StartScene` passing the initial level data

**Data passed forward:** `{ levelName, roomId, doorId }` — the starting point for a new game

---

## StartScene

**File:** `src/scenes/start-scene.ts`

**Purpose:** Main menu — the player's entry point before gameplay begins.

**What it does:**
- Displays the game logo and two menu items: **Start New Game** and **Options**
- Menu items respond to hover (80% alpha) and press (60% alpha)
- A cursor sprite follows the selected item
- Supports keyboard navigation (arrow keys to move, Z/Enter to confirm) and mouse/touch click
- Resets player health to maximum (6 HP) when a new game starts
- Transitions to `GameScene` (new game) or `OptionsScene` (settings)

**Navigation:**
```
Start New Game → GameScene (DUNGEON_1, room 0, door 0)
Options        → OptionsScene
```

---

## OptionsScene

**File:** `src/scenes/options-scene.ts`

**Purpose:** Settings menu with a single option: toggle touch controls.

**What it does:**
- Shows the current state of touch controls (enabled/disabled)
- Toggling updates `DataManager.touchControlsEnabled`
- Emits `TOUCH_CONTROLS_TOGGLED` event so the overlay scene reacts immediately
- Back button returns to `StartScene`

---

## GameScene

**File:** `src/scenes/game-scene.ts`

**Purpose:** The core gameplay loop. Manages everything that happens during play.

**Initialization (create):**
1. Receives `LevelData` (level name, starting room ID, starting door ID)
2. Builds the Tiled tilemap — background, foreground, and collision layers
3. Creates all game objects from Tiled data: doors, enemies, chests, pots, switches
4. Spawns the player at the position of the specified starting door
5. Configures all physics colliders and overlap callbacks
6. Launches `UIScene` and optionally `TouchControlsScene` in parallel
7. Sets up EventBus listeners

**Room Management:**
- All room objects are created upfront at load time but are disabled (invisible, no physics)
- Only the current room's objects are enabled at any given time
- `#showObjectsInRoomById(roomId)` — activates a room's objects
- `#hideObjectsInRoomById(roomId)` — deactivates a room's objects
- Room bounds come from Tiled metadata; the camera is constrained to the active room

**Object Creation:**
All objects are parsed from Tiled object layers. Each category has a dedicated private method:

| Method | Creates |
|---|---|
| `#createDoors` | Door instances by type and room |
| `#createEnemies` | Spider, Wisp, or Drow by type number |
| `#createChests` | Chest instances with revealed/opened state from DataManager |
| `#createPots` | Throwable pot objects |
| `#createButtons` | Floor switches linked to targets via Tiled properties |

**Collision Setup (`#registerColliders`):**
- Player ↔ collision tiles (walls)
- Player ↔ doors (triggers room transition)
- Player ↔ blocking objects (enemies, pots, chests, locked doors)
- Player sword ↔ enemies (damage)
- Enemy weapons (daggers) ↔ player (damage)
- Thrown pots ↔ enemies and walls (break on impact)
- Player ↔ floor switches (on overlap — triggers switch press)

**Enemy Defeat Check:**
After each enemy death event, `#checkForAllEnemiesAreDefeated()` runs. If all non-Wisp enemies in the room are defeated, `#handleAllEnemiesDefeated()` executes any linked triggers (revealing chests, opening trap doors).

**Room Transition Flow:**
```
Player overlaps door zone
→ #handleRoomTransition() called
→ Input locked (isMovementLocked = true)
→ Player animated into hallway
→ Camera tweened to new room position
→ Old room objects hidden, new room objects shown
→ Camera bounds updated to new room
→ Input unlocked
```

**Scene Pause/Resume (during dialog):**
`GameScene` pauses (physics and update loop stop) in two situations:
- A chest is opened — resumes when `DIALOG_CLOSED` fires (auto after 3 seconds)
- An NPC is talked to *(planned)* — resumes when `NPC_DIALOGUE_CLOSED` fires (player-advanced)

**Cleanup:**
On scene `SHUTDOWN` event, all EventBus listeners are removed to prevent memory leaks.

---

## UIScene

**File:** `src/scenes/ui-scene.ts`

**Purpose:** The HUD layer — always visible on top of gameplay.

**What it does:**
- **Heart Display:** Renders up to 20 heart sprites (2 rows of 10) in the top-right area
  - Each heart has 4 states: FULL, HALF, EMPTY, NONE (hidden)
  - Listens to `PLAYER_HEALTH_UPDATED` and animates hearts lost (plays hit animation per heart)
- **Dialog Box:** A text container that appears below the play field
  - Triggered by `SHOW_DIALOG` event with a text string
  - Auto-closes after 3 seconds
  - On close, emits `DIALOG_CLOSED` so `GameScene` can resume

**Initialization:**
- Reads current player health from `DataManager` to set initial heart state
- Uses fixed camera (not scrolling) so the HUD stays fixed on screen

---

## TouchControlsScene

**File:** `src/scenes/touch-controls-scene.ts`

**Purpose:** Optional overlay providing mobile touch controls.

**Components:**
- **Virtual Joystick** — left side of the screen, covers the full height from x=0 to x≈103
  - 8-directional input with a small dead zone (8px)
  - Drawn dynamically with Phaser Graphics (appears on touch, disappears on release)
  - Base radius: 16px, stick radius: 8px, max travel: 16px
- **Attack Button** — right side, position (224, 194)
  - Maps to the Z/attack action
- **Action Button** — right side, position (186, 194)
  - Maps to the X/action key (lift, throw, interact)

**Multi-Touch:**
- Each pointer (finger) is tracked independently via an `activePointers` Map
- Up to 4 simultaneous touches supported (joystick + attack button + action button + 1 spare)
- Pointer down/move/up events are routed to the correct control based on which area was touched

**Lifecycle:**
- Launched by `GameScene` if `DataManager.touchControlsEnabled` is true
- Listens for `TOUCH_CONTROLS_TOGGLED` — starts or stops itself on setting change
- Properly cleans up all Phaser listeners on scene shutdown

---

## GameOverScene

**File:** `src/scenes/game-over-scene.ts`

**Purpose:** Death screen shown when the player's health reaches zero.

**What it does:**
- Displays "Game Over" text and two options: **Continue** and **Quit to Menu**
- Same menu interaction as StartScene (keyboard arrows + Z/Enter, or mouse/touch click)
- **Continue** — restores player health, returns to `GameScene` at the dungeon start room
- **Quit** — returns to `StartScene`

**Scene cleanup:**
Before transitioning, `GameOverScene` explicitly stops `UIScene` and `TouchControlsScene` (they were paused, not stopped, when the player died). This prevents ghost listeners from accumulating.

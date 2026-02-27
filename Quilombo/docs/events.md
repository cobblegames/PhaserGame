# Events

Quilombo uses a global publish/subscribe event system to allow scenes and game objects to communicate without direct references to each other. This is what allows `GameScene`, `UIScene`, and `TouchControlsScene` to coordinate while remaining independent.

---

## EventBus

**Source:** `src/common/event-bus.ts`

`EventBus` is a singleton that wraps Phaser's `EventEmitter`. It is a single shared instance accessible from anywhere in the codebase.

**Usage pattern:**
- `EVENT_BUS.emit(eventName, payload)` — publish an event
- `EVENT_BUS.on(eventName, callback, context)` — subscribe
- `EVENT_BUS.off(eventName, callback, context)` — unsubscribe

All scenes subscribe to events in `create()` and unsubscribe in the scene's `SHUTDOWN` event to prevent ghost listeners from accumulating across scene restarts.

---

## Custom Events

### OPENED_CHEST

| Field | Value |
|---|---|
| Emitted by | `Chest` (on open) |
| Listened by | `GameScene` |
| Payload | The `Chest` instance |

Fired when the player successfully opens a chest. `GameScene` reads the chest's `contents` property to determine what item to award, plays the reward animation, updates the inventory, and triggers the dialog flow.

---

### ENEMY_DESTROYED

| Field | Value |
|---|---|
| Emitted by | Enemy game objects (on death animation complete) |
| Listened by | `GameScene` |
| Payload | None |

Fired when an enemy finishes its death animation and is removed from the scene. `GameScene` receives this and calls `#checkForAllEnemiesAreDefeated()` to determine if room-completion triggers should fire.

---

### PLAYER_DEFEATED

| Field | Value |
|---|---|
| Emitted by | Player (in DEATH_STATE) |
| Listened by | `GameScene` |
| Payload | None |

Fired when the player's death animation completes. `GameScene` stops the sibling scenes (`UIScene`, `TouchControlsScene`) and transitions to `GameOverScene`.

---

### PLAYER_HEALTH_UPDATED

| Field | Value |
|---|---|
| Emitted by | `DataManager` (when player health changes) |
| Listened by | `UIScene` |
| Payload | `{ previousHealth: number, currentHealth: number }` |

Fired whenever the player's current health changes. `UIScene` uses the previous and current values to determine exactly which hearts changed and animates them accordingly. This event fires both on damage taken and on health restoration (e.g., after "Continue" from game over).

---

### SHOW_DIALOG

| Field | Value |
|---|---|
| Emitted by | `GameScene` (after chest open or story trigger) |
| Listened by | `UIScene` |
| Payload | `string` — the text to display |

Tells `UIScene` to show the dialog box with the given text. `GameScene` pauses itself immediately after emitting this to freeze gameplay during the message.

---

### DIALOG_CLOSED

| Field | Value |
|---|---|
| Emitted by | `UIScene` (after 3-second auto-close timer) |
| Listened by | `GameScene` |
| Payload | None |

Fired when the dialog box finishes displaying and closes. `GameScene` listens for this to resume itself (physics and update loop unpause).

---

### BOSS_DEFEATED

| Field | Value |
|---|---|
| Emitted by | Drow Boss (in DEATH_STATE) |
| Listened by | `GameScene` |
| Payload | None |

Fired when the Drow boss is killed. `GameScene` responds by opening any trap doors linked to the boss fight. `DataManager.bossDefeated` is also set to `true` before this event fires.

---

### TOUCH_CONTROLS_TOGGLED

| Field | Value |
|---|---|
| Emitted by | `OptionsScene` (when player toggles the setting) |
| Listened by | `TouchControlsScene`, `GameScene` |
| Payload | None (current state read from DataManager) |

Fired when the player enables or disables touch controls in the options menu. `TouchControlsScene` listens to start or stop itself. `GameScene` may listen to rebuild the player's input component (`CombinedInputComponent` vs `KeyboardComponent`).

---

## Event Flow Examples

### Chest Opening Flow

```
Player presses X near chest
        │
        ▼
Chest.open() called
        │
        ▼
EVENT_BUS.emit(OPENED_CHEST, chest)
        │
        ▼
GameScene receives → adds item to inventory → plays reward sprite
        │
        ▼
EVENT_BUS.emit(SHOW_DIALOG, "You got Small Key!")
        │
        ▼
GameScene.pause()
UIScene receives → shows dialog box
        │   (3 second timer)
        ▼
EVENT_BUS.emit(DIALOG_CLOSED)
        │
        ▼
GameScene receives → resumes
```

### Player Death Flow

```
Player health reaches 0
        │
        ▼
Player transitions to DEATH_STATE
Death animation plays
        │
        ▼
EVENT_BUS.emit(PLAYER_DEFEATED)
        │
        ▼
GameScene receives
→ scene.stop(UI_SCENE)
→ scene.stop(TOUCH_CONTROLS_SCENE)
→ scene.start(GAME_OVER_SCENE)
```

### Enemy Room-Clear Flow

```
Enemy health reaches 0
        │
        ▼
Enemy transitions to DEATH_STATE
Death animation plays
        │
        ▼
EVENT_BUS.emit(ENEMY_DESTROYED)
        │
        ▼
GameScene → #checkForAllEnemiesAreDefeated()
        │
        (all non-Wisp enemies dead?)
        │  YES
        ▼
#handleAllEnemiesDefeated()
→ reveal hidden chests
→ open trap doors
```

---

---

### SHOW_NPC_DIALOGUE *(planned)*

| Field | Value |
|---|---|
| Emitted by | `NpcGameObject` via `InteractiveObjectComponent` callback |
| Listened by | `UIScene` (shows paged dialogue box), `GameScene` (pauses) |
| Payload | `{ pages: DialoguePage[], speakerName: string }` |

Fired when the player presses the action key while adjacent to an NPC. `GameScene` pauses immediately (freezing enemies and the player). `UIScene` receives the payload and renders the first page of dialogue. See [Dialogue](dialogue.md) for the full UI specification.

---

### NPC_DIALOGUE_CLOSED *(planned)*

| Field | Value |
|---|---|
| Emitted by | `UIScene` (when the last page is advanced past) |
| Listened by | `GameScene` |
| Payload | None |

Fired when the player advances past the final page of NPC dialogue. `GameScene` resumes, returning control to the player. Parallels the existing `DIALOG_CLOSED` event but is kept separate so both systems can coexist independently.

---

## Listener Cleanup

Every scene that subscribes to EventBus events must unsubscribe on shutdown. This is done by listening to Phaser's built-in `SHUTDOWN` scene event:

```
this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
    EVENT_BUS.off(EVENT_NAME, callback, this);
    // ... for each subscription
});
```

Failing to clean up listeners causes ghost subscriptions: old callbacks from destroyed scenes still firing, which can cause errors or duplicate behavior when a scene is restarted.

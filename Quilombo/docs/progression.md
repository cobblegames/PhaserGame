# Progression

Quilombo's progression is built around finding keys, opening chests, unlocking doors, and defeating a boss. State is managed per-session (no save file — progress is lost on page refresh).

---

## Items

| Item | How Obtained | Effect |
|---|---|---|
| Small Key | Found in chests | Unlocks one LOCK-type door |
| Boss Key | Found in a specific chest | Required to open the Boss Door |
| Map | Found in a chest | Obtained item (currently no map display feature) |
| Compass | Found in a chest | Obtained item (currently no active effect) |
| Sword | Starting equipment | Required for attacking enemies |

---

## Inventory

**Source:** `src/common/inventory-manager.ts`

`InventoryManager` is a singleton that tracks what the player currently holds. It has two sections:

**General inventory** (persists across all areas):
- `sword`: boolean — always true (player starts with sword)

**Area inventory** (tracked per level area):
- `map`: boolean
- `compass`: boolean
- `bossKey`: boolean
- `keys`: number — count of small keys held

When the player enters a new area, the area inventory resets for that area.

---

## Chests

Chests are the primary source of items. Each chest is placed in the Tiled map with a `contents` property.

### Chest States

| State | Description |
|---|---|
| HIDDEN | Invisible — not yet revealed |
| REVEALED | Visible and interactive |
| OPENED | Already opened; contents removed |

State is persisted in `DataManager` per chest ID so it survives room transitions within the session.

### Chest Contents

| Contents Value | Item Given | Dialog Shown |
|---|---|---|
| `SMALL_KEY` | +1 key in inventory | "You got a Small Key!" |
| `BOSS_KEY` | bossKey = true | "You got the Boss Key!" |
| `MAP` | map = true | "You got the Dungeon Map!" |
| `COMPASS` | compass = true | "You got the Compass!" |
| `NOTHING` | — | No dialog |

### Opening a Chest

1. Player presses X in front of a revealed chest
2. `InteractiveObjectComponent` callback fires on the chest
3. `Chest.open()` runs — changes sprite frame, removes the interaction zone
4. `OPENED_CHEST` event fires with the chest reference
5. `GameScene` reads the chest contents, adds to inventory
6. If contents is not NOTHING: a reward item sprite briefly appears above the chest
7. `SHOW_DIALOG` fires with the item name text
8. `GameScene` pauses; dialog auto-closes after 3 seconds
9. `DIALOG_CLOSED` fires; `GameScene` resumes

### Big Chests (Boss Key Required)

Some chests require the Boss Key before they can be opened. These chests check `InventoryManager.bossKey` when the player interacts. If the key is not held, nothing happens.

---

## Doors

### Unlocking Doors

| Door Type | Requirement | Key Consumed? |
|---|---|---|
| OPEN | None | — |
| LOCK (Locked) | 1 Small Key | Yes — key deducted from inventory |
| BOSS | Boss Key | No — key is kept |
| TRAP | No combat requirement | Unlocks on enemy defeat or boss defeat |

When the player steps into a LOCK door without a key, the door blocks them (no passage). With a key, the door opens permanently for the session (state saved in DataManager).

### Trap Doors

Trap doors lock shut when the player enters a room. They unlock when all non-Wisp enemies in the room are defeated. A trap door can also be linked to a boss fight — it unlocks when `BOSS_DEFEATED` fires.

---

## Boss Progression

The Drow boss fight is the dungeon's culminating challenge.

**Required to reach boss:**
1. Collect the Boss Key (from a chest)
2. Unlock the Boss Door
3. Enter the boss room

**Boss fight flow:**
1. Entering boss room triggers a TRAP door (room locks)
2. Drow boss emerges from HIDDEN state
3. Player must reduce Drow from 6 HP to 0
4. Boss death: flash effect + wipe animation
5. `DataManager.bossDefeated = true`
6. `BOSS_DEFEATED` event fires
7. Trap door opens — player can exit
8. Boss does not respawn (DataManager persists for the session)

---

## Enemy Defeat Triggers

Defeating all non-Wisp enemies in a room can trigger additional events. These are configured in the Tiled map via switch/trigger properties.

**Possible triggers on full-room clear:**
- Reveal a hidden chest (`REVEAL_CHEST`)
- Open a trap door (`OPEN_DOOR`)

This creates rooms where combat is mandatory to progress or access rewards.

---

## State Persistence (DataManager)

**Source:** `src/common/data-manager.ts`

`DataManager` is a singleton that persists game state across scene transitions within a session. It is **not** saved to localStorage — all data resets on page refresh.

### Stored Data

**Player:**
- `currentHealth` — current HP
- `maxHealth` — maximum HP (fixed at 6)
- `touchControlsEnabled` — user preference

**Current Area:**
- `name` — level name
- `startRoomId` — room to spawn in on game restart
- `startDoorId` — door to spawn at on game restart

**Per-Room (keyed by room ID):**
- `chests` — map of chest ID → `{ revealed, opened }`
- `doors` — map of door ID → `{ unlocked }`

**Level-Wide:**
- `bossDefeated` — whether the boss has been killed this session

### When Data Updates

| Event | DataManager Update |
|---|---|
| Player takes damage | `currentHealth` decremented |
| Chest opened | Chest marked opened |
| Door unlocked | Door marked unlocked |
| Chest revealed | Chest marked revealed |
| Boss defeated | `bossDefeated = true` |
| Continue after game over | `currentHealth` restored to max |

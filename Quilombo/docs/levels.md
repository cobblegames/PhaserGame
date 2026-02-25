# Levels

Quilombo's world is split into rooms connected by doors. Levels are authored in **Tiled** and loaded as JSON at runtime. The game currently has two areas: a world overworld and a dungeon.

---

## Areas

| Area | Level Name | Description |
|---|---|---|
| WORLD | `WORLD` | Outdoor overworld area |
| Dungeon 1 | `DUNGEON_1` | Indoor dungeon with enemies, puzzles, and boss |

Each area is a single Tiled map file containing all of its rooms and their contents.

---

## Tiled Map Structure

Each level map is structured with the following layer types:

### Tile Layers
| Layer | Purpose |
|---|---|
| Background | Decorative floor tiles (no collision) |
| Foreground | Decorative tiles drawn on top of objects |
| COLLISION | Wall and solid tiles — the player collides with this layer |
| ENEMY_COLLISION | Separate collision layer used only by enemies |

### Object Layers

All interactive content is defined in object layers nested under each room:

```
ROOMS/
├── ROOM_0/
│   ├── (room bounds rectangle)
│   ├── DOORS
│   ├── ENEMIES
│   ├── CHESTS
│   ├── POTS
│   └── SWITCHES
├── ROOM_1/
│   └── ...
└── ...
```

Each room layer contains a rectangle that defines the room bounds (position and size). The game uses these bounds to constrain the camera and know which objects belong to which room.

---

## Object Types

### Doors

Doors are the connections between rooms (or between levels). Each door Tiled object has the following properties:

| Property | Values | Description |
|---|---|---|
| `id` | string | Unique identifier for this door |
| `type` | `OPEN`, `LOCK`, `BOSS`, `TRAP` | Door variant |
| `direction` | `UP`, `DOWN`, `LEFT`, `RIGHT` | Which wall the door is on |
| `targetLevel` | level name | The area the door leads to |
| `targetRoomId` | room ID | Which room to enter in the target level |
| `targetDoorId` | door ID | Which door in the target room to arrive at |
| `trapTrigger` | door ID (optional) | A TRAP door that this door controls |

**Door Types:**

| Type | Appearance | Behavior |
|---|---|---|
| OPEN | Always passable | No requirement to use |
| LOCK | Locked | Requires 1 Small Key to open; deducts key from inventory |
| BOSS | Boss door | Requires the Boss Key to open |
| TRAP | Trap door | Locks shut when the player enters the room; unlocks on enemy defeat or boss defeat |

### Enemies

Enemy objects define spawn positions. The `type` number determines which enemy class is created:

| type | Enemy |
|---|---|
| 1 | Spider |
| 2 | Wisp |
| 3 | Drow Boss |

The Drow boss only spawns if `DataManager.bossDefeated` is `false`.

### Chests

| Property | Values | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `contents` | `NOTHING`, `MAP`, `COMPASS`, `BOSS_KEY`, `SMALL_KEY` | Item inside |
| `requiresBossKey` | boolean | Whether the player needs the Boss Key to open |
| `revealTrigger` | ID (optional) | Links this chest to a switch or enemy defeat trigger |

Chests can start in three states:
- **HIDDEN** — invisible until revealed by a trigger
- **REVEALED** — visible and interactive
- **OPENED** — already opened (state persisted in DataManager)

### Pots

Pots are placed at fixed positions. They are throwable objects — the player can lift them (X key) and throw them to damage enemies.

### Switches (Buttons)

Floor switches are trigger objects. When the player steps on one (overlap), it activates. Each switch object has:

| Property | Values | Description |
|---|---|---|
| `action` | `OPEN_DOOR`, `REVEAL_CHEST`, `REVEAL_KEY` | What happens when pressed |
| `targetIds` | list of IDs | Which doors or chests are triggered |

---

## Room Management

All objects for all rooms in a level are created at scene load time. However, only the **current room's** objects are active. This is managed via two methods in `GameScene`:

- `#showObjectsInRoomById(roomId)` — enables physics and visibility for a room's objects
- `#hideObjectsInRoomById(roomId)` — disables physics and hides a room's objects

This approach avoids the overhead of creating/destroying objects on every room transition while keeping inactive rooms completely inert.

Each room's objects are tracked in a `Map` keyed by room ID, containing:
- Doors list
- Enemy group
- Chests list
- Pots list
- Switches list

---

## Room Transition

When the player touches a door zone:

```
Player overlaps door trigger area
         │
         ▼
   Input locked (isMovementLocked = true)
         │
         ▼
   Player animated into hallway
   (short tween toward door direction)
         │
         ▼
   Camera tweened from old room to new room
   (smooth pan animation)
         │
         ▼
   Old room objects hidden
   New room objects shown
         │
         ▼
   Camera bounds updated to new room
         │
         ▼
   Player repositioned at target door
         │
         ▼
   Input unlocked
```

If the target door is in a **different level**, a full scene restart is triggered: `GameScene` is stopped and restarted with the new `LevelData` (level name + room + door).

---

## Camera System

- The camera is locked to the current room's bounds using `camera.setBounds()`
- During room transitions, the camera tweens smoothly between the old and new room rectangles
- The camera does not scroll freely — it is always clamped to one room at a time
- `UIScene` and `TouchControlsScene` use a fixed (non-scrolling) camera so the HUD stays stationary

---

## Asset Files

| File | Purpose |
|---|---|
| `public/assets/images/levels/dungeon_1/dungeon_1.json` | Tiled map for Dungeon 1 |
| `public/assets/images/levels/dungeon_1/dungeon_1.png` | Tileset image for Dungeon 1 |
| `public/assets/images/levels/dungeon_1/dungeon_1_background.png` | Background layer image |
| `public/assets/images/levels/dungeon_1/dungeon_1_foreground.png` | Foreground layer image |
| `public/assets/images/levels/world/world.json` | Tiled map for World area |
| `public/assets/images/levels/common/collision.png` | Shared collision tileset |
| `public/assets/images/levels/common/dungeon_objects.png` | Shared interactive object sprites |

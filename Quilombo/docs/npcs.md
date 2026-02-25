# NPC System

Non-player characters (NPCs) are static, non-hostile characters the player can talk to. They deliver story, guidance, and hooks for future systems (shops, quests). This page covers the overall design; see [Dialogue](dialogue.md) for the conversation UI.

---

## NPC Types

| Type | Role | Status |
|---|---|---|
| **Villager** | Story exposition, lore, world hints | Planned Phase 5 |
| **Guide** | Tutorial tips, mechanic explanations | Planned Phase 5 |
| **Shopkeeper** | Item purchases (buy/sell UI) | Stub — Phase 5; full UI Phase 6 |
| **Quest Giver** | Assigns objectives, tracks progress | Stub — Phase 5; full system Phase 6 |

All four types share the same interaction model: the player walks into the NPC, presses the action key, and a paged dialogue box opens. The difference is in what happens *after* dialogue (shops open a UI, quests update state).

---

## Architecture

### Class Hierarchy

```
Phaser.Physics.Arcade.Sprite
└── NpcGameObject   (new — src/game-objects/npc/)
    ├── VillagerNpc
    ├── GuideNpc
    ├── ShopkeeperNpc  (stub)
    └── QuestGiverNpc  (stub)
```

NPCs do **not** extend `CharacterGameObject`. They are lighter — no health, no state machine, no weapons. They share only what they need:

| Component | Purpose |
|---|---|
| `AnimationComponent` | Plays idle animations |
| `DirectionComponent` | Tracks which direction the NPC faces |
| `InteractiveObjectComponent` | Registers `TALK` interaction, fires dialogue event |

### NpcGameObject Responsibilities

- Starts **disabled** (invisible, physics off). `GameScene` enables it when the player enters the room.
- Physics body is **immovable** — the player cannot walk through it.
- On construction, registers an `InteractiveObjectComponent` with type `TALK` and a callback that emits `SHOW_NPC_DIALOGUE` on the EventBus.
- Has `enableObject()` / `disableObject()` to satisfy the `CustomGameObject` interface, matching the pattern used by enemies, chests, and doors.

### NPC Configuration Data

All NPC dialogue and metadata lives in a central registry (`src/common/npc-configs.ts`) keyed by a string ID:

```typescript
type DialoguePage = { text: string };

type NpcData = {
  npcType: 'VILLAGER' | 'SHOPKEEPER' | 'QUEST_GIVER' | 'GUIDE';
  speakerName: string;
  dialogue: DialoguePage[];
};

const NPC_CONFIGS: Record<string, NpcData> = {
  ELDER_VILLAGER: {
    npcType: 'VILLAGER',
    speakerName: 'Elder',
    dialogue: [
      { text: 'Beware the dungeon below. Many have entered, few have returned.' },
      { text: 'They say the Drow guards something precious in the deepest chamber.' },
    ],
  },
  GUIDE_FAIRY: {
    npcType: 'GUIDE',
    speakerName: 'Fairy',
    dialogue: [
      { text: 'Press X to attack. Find small keys to open locked doors.' },
      { text: 'Defeat all enemies in a room to unlock the exit doors!' },
    ],
  },
  SHOPKEEPER_OLD_WOMAN: {
    npcType: 'SHOPKEEPER',
    speakerName: 'Merchant',
    dialogue: [{ text: 'The shop is being restocked. Come back later.' }],
  },
  QUEST_GIVER_WARRIOR: {
    npcType: 'QUEST_GIVER',
    speakerName: 'Warrior',
    dialogue: [{ text: 'I need your help! The dungeon must be cleared...' }],
  },
};
```

The ID (`ELDER_VILLAGER`, etc.) is what gets stored in the Tiled map. At runtime the factory reads this key to look up dialogue and NPC type.

---

## Interaction Flow

```
Player walks into NPC physics body
         │
         ▼
CollidingObjectsComponent tracks the NPC
         │
Player presses action key (X)
         │
         ▼
MoveState.#checkIfObjectWasInteractedWith()
  reads InteractiveObjectComponent.objectType === TALK
         │
         ▼
InteractiveObjectComponent.interact()
  → emits SHOW_NPC_DIALOGUE { pages, speakerName }
         │
         ▼
MoveState transitions player to IDLE_STATE
         │
         ▼
GameScene receives SHOW_NPC_DIALOGUE
  → pauses GameScene (enemies freeze, player cannot move)
         │
         ▼
UIScene receives SHOW_NPC_DIALOGUE
  → shows paged dialogue box (see Dialogue)
         │
Player advances through pages (press X)
         │
On last page, UIScene emits NPC_DIALOGUE_CLOSED
         │
         ▼
GameScene receives NPC_DIALOGUE_CLOSED
  → resumes GameScene
         │
Player is back in control
```

This pattern reuses the same pause/resume mechanism used by chest reward popups. UIScene continues running during the pause and owns the dialogue input.

---

## Tiled Integration

NPCs are placed in Tiled maps on a dedicated object layer named `npcs`. This layer sits alongside the existing `enemies`, `chests`, `doors`, etc. layers for each room.

### Object Properties

| Property | Tiled Type | Example | Notes |
|---|---|---|---|
| `npcId` | string | `ELDER_VILLAGER` | Must match a key in `NPC_CONFIGS` |
| `facing` | string | `DOWN` | One of `UP`, `DOWN`, `LEFT`, `RIGHT` |

The Tiled object's **x/y position** sets where the NPC is placed. Object size should be 16×16 to match a standard tile cell (adjust if the sprite is larger).

### Parsed Type

```typescript
type TiledNpcObject = {
  npcId: string;
  direction: Direction;  // mapped from 'facing' property
  x: number;
  y: number;
  width: number;
  height: number;
};
```

The parser (`getTiledNpcObjectsFromMap`) follows the same pattern as `getTiledEnemyObjectsFromMap`.

---

## GameScene Integration

NPCs slot into the existing room management structure:

```typescript
#objectsByRoomId = {
  [roomId]: {
    // ... existing: doors, chests, switches, pots, enemyGroup
    npcGroup?: Phaser.GameObjects.Group,   // NEW
  }
}
```

- NPCs are added to both `npcGroup` (for room enable/disable) and `blockingGroup` (for physics + interaction detection).
- `#showObjectsInRoomById` calls `enableObject()` on each NPC in the room.
- `#hideObjectsInRoomById` calls `disableObject()`.
- Two new event handlers: `SHOW_NPC_DIALOGUE` → `scene.pause()`, `NPC_DIALOGUE_CLOSED` → `scene.resume()`.

---

## Assets

NPC sprites live in `public/assets/images/npc/People1.png`.

The spritesheet contains idle frames for all NPC types. Exact frame layout needs to be inspected and mapped to animation keys in `PreloadScene.#createAnimations()`.

Animation keys follow the pattern used by all characters: `IDLE_DOWN`, `IDLE_UP`, `IDLE_LEFT`, `IDLE_RIGHT`. Each NPC type may use a different row or frame range in the sheet.

---

## EventBus Events

Two new events are added:

| Event | Emitted By | Payload | Consumed By |
|---|---|---|---|
| `SHOW_NPC_DIALOGUE` | `NpcGameObject` (via InteractiveObjectComponent callback) | `{ pages: DialoguePage[], speakerName: string }` | `UIScene` (shows box), `GameScene` (pauses) |
| `NPC_DIALOGUE_CLOSED` | `UIScene` (last page advanced) | — | `GameScene` (resumes) |

See [Events](events.md) for the full event list.

---

## Implementation Phases

### Phase 1 — Foundation
*Core types and base class. No visual result yet.*

- Add `TALK` to `INTERACTIVE_OBJECT_TYPE` in `src/common/common.ts`
- Add `SHOW_NPC_DIALOGUE` + `NPC_DIALOGUE_CLOSED` events and payload types to `src/common/event-bus.ts`
- Add `NPCS` to `TILED_LAYER_NAMES` and `TILED_NPC_OBJECT_PROPERTY` to `src/common/tiled/common.ts`
- Add `TiledNpcObject` to `src/common/tiled/types.ts`
- Add `getTiledNpcObjectsFromMap` to `src/common/tiled/tiled-utils.ts`
- Create `src/common/npc-configs.ts` with sample data
- Create `src/game-objects/npc/npc-game-object.ts` base class

### Phase 2 — GameScene Integration
*NPCs appear in rooms but cannot be interacted with yet.*

- Add `npcGroup` to `#objectsByRoomId` type
- Add `#createNpcs(map, layerName, roomId)` method in `GameScene`
- Add NPCs to `blockingGroup` + `npcGroup`
- Update `#showObjectsInRoomById` / `#hideObjectsInRoomById`
- Register `SHOW_NPC_DIALOGUE` / `NPC_DIALOGUE_CLOSED` event handlers in `GameScene`

### Phase 3 — Player Interaction
*Player can "push" into NPC and trigger event. No dialogue UI yet.*

- Add `TALK` case to `MoveState.#checkIfObjectWasInteractedWith` (transition to `IDLE_STATE`, return `true`)
- Load `People1.png` as a spritesheet in `PreloadScene`
- Register NPC idle animations in `PreloadScene.#createAnimations()`
- Add `NPC_PEOPLE1` to `ASSET_KEYS` in `src/common/assets.ts`

### Phase 4 — Dialogue UI
*Full paged dialogue experience.*

- Add paged dialogue container to `UIScene` (background panel, speaker name, body text, continue indicator)
- Add `UIScene.update()` to detect `JustDown(actionKey)` when dialogue is visible
- Handle `SHOW_NPC_DIALOGUE` event in `UIScene` → render first page
- Implement `#advanceNpcDialogue()` → next page or emit `NPC_DIALOGUE_CLOSED`
- Touch: add pointer-down listener on dialogue container

### Phase 5 — NPC Subclasses + Content
*All four NPC types working. NPCs placed in maps.*

- Create `VillagerNpc`, `GuideNpc`, `ShopkeeperNpc` (stub), `QuestGiverNpc` (stub) in `src/game-objects/npc/`
- Create `npc-factory.ts` — maps `npcType` to class constructor
- Place sample NPCs in dungeon and world Tiled maps
- Wire factory into `#createNpcs()` in `GameScene`

### Phase 6 — Future Systems
*Not in current scope.*

- Full shopkeeper buy/sell UI (requires currency system)
- Quest objective tracking in `DataManager` (requires objective types: kill N, collect item, reach location)
- Town/hub area map
- NPC name plate in dialogue box
- NPC wander movement (optional, not planned)

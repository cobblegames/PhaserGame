# Dialogue System

Quilombo has two distinct dialogue mechanisms with different purposes and behaviors:

| System | Purpose | Trigger | Advance |
|---|---|---|---|
| **Reward Popup** | Chest reward messages | Auto after chest open | Auto-dismisses after 3 seconds |
| **NPC Dialogue** | NPC conversations | Player presses action key | Player presses action key per page |

This page covers the **NPC Dialogue** system. The reward popup is documented in [UI](ui.md).

---

## Data Model

### DialoguePage

A single screen of text shown in the dialogue box:

```typescript
type DialoguePage = {
  text: string;
};
```

Future expansion could add:
- `portrait?: string` — sprite key for a character portrait
- `sound?: string` — audio cue key (when audio is implemented)

### NpcData

The complete dataset for one NPC, stored in `src/common/npc-configs.ts`:

```typescript
type NpcData = {
  npcType: 'VILLAGER' | 'SHOPKEEPER' | 'QUEST_GIVER' | 'GUIDE';
  speakerName: string;    // displayed in name plate
  dialogue: DialoguePage[];
};
```

### NPC_CONFIGS Registry

All NPC content lives in a single record keyed by NPC ID string:

```typescript
const NPC_CONFIGS: Record<string, NpcData> = { ... };
```

The ID is stored in the Tiled map (`npcId` property) and used at runtime to look up the NPC's dialogue and type. This separation means dialogue content can be changed without touching Tiled files.

---

## Dialogue Box UI

The NPC dialogue container sits at the **bottom of the screen**, overlaying gameplay. It is managed entirely by `UIScene`, which continues running even when `GameScene` is paused.

### Layout (256×224 screen)

```
┌──────────────────────────────────────────────────────────┐  y=0
│                                                          │
│                    [ gameplay area ]                     │
│                                                          │
│                                                          │  y=148
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Speaker Name                                         │ │
│ │                                                      │ │
│ │ Dialogue text that can wrap across multiple          │ │
│ │ lines up to a fixed maximum width.                   │ │
│ │                                                      │ │
│ │                                           ▶ Press X  │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘  y=224
```

Approximate coordinates in game pixels:
- Container: `x=8, y=152, width=240, height=66`
- Speaker name: `x=12, y=156`, color `#FFD700`, font size 7
- Body text: `x=12, y=168`, color `#FFFFFF`, font size 7, `wordWrap: 210`
- Continue indicator: `x=228, y=208`, color `#AAAAAA`

The "Press X" indicator changes to "Close" on the last page.

### Visual Style

Matches the existing reward popup:
- Font: `Press Start 2P` (pixel font, 7–8px)
- Background: semi-transparent dark panel using the existing `UI_DIALOG` asset (or a 9-slice panel)
- No animation on appearance — snaps visible instantly

---

## Interaction Flow

```
NpcGameObject.interact() called by MoveState
      │
      ▼
EVENT_BUS.emit(SHOW_NPC_DIALOGUE, { pages, speakerName })
      │
      ├──▶ GameScene: scene.pause()
      │
      └──▶ UIScene: #showNpcDialogue(payload)
               stores pages[], sets pageIndex = 0
               renders page 0 text + speaker name
               sets continue indicator to "Press X"
               makes container visible

Player presses X (UIScene.update() detects JustDown)
      │
      ▼
UIScene.#advanceNpcDialogue()
      │
      ├── if pageIndex < pages.length - 1:
      │       pageIndex++
      │       render new page text
      │       if last page: change indicator to "Close"
      │
      └── if pageIndex === pages.length - 1:
              hide container
              EVENT_BUS.emit(NPC_DIALOGUE_CLOSED)
                    │
                    └──▶ GameScene: scene.resume()
                               player regains control
```

### Touch

For touch devices, a pointer-down listener on the dialogue container acts as an advance trigger. No dedicated button needed — tapping anywhere on the dialogue box advances or closes it.

---

## UIScene Implementation

### New Fields

```typescript
#npcDialogContainer: Phaser.GameObjects.Container;
#npcDialogText: Phaser.GameObjects.Text;
#npcSpeakerText: Phaser.GameObjects.Text;
#npcContinueText: Phaser.GameObjects.Text;
#npcActionKey: Phaser.Input.Keyboard.Key;
#npcDialoguePages: DialoguePage[] = [];
#npcDialoguePageIndex = 0;
```

### Key Methods

**`#showNpcDialogue(payload: ShowNpcDialoguePayload)`**
- Stores `payload.pages` and `payload.speakerName`
- Resets `#npcDialoguePageIndex` to 0
- Calls `#renderCurrentPage()`
- Makes `#npcDialogContainer` visible

**`#renderCurrentPage()`**
- Sets `#npcSpeakerText.text`
- Sets `#npcDialogText.text` from current page
- Updates `#npcContinueText` to "Press X" or "Close" depending on whether it is the last page

**`#advanceNpcDialogue()`**
- If not last page: increment index, call `#renderCurrentPage()`
- If last page: hide container, emit `NPC_DIALOGUE_CLOSED`

### `update()` Method

`UIScene` currently has no `update()`. One will be added:

```typescript
update(): void {
  if (!this.#npcDialogContainer.visible) return;
  if (Phaser.Input.Keyboard.JustDown(this.#npcActionKey)) {
    this.#advanceNpcDialogue();
  }
}
```

`JustDown` is used instead of raw key state to prevent holding X from firing multiple advances per second.

---

## EventBus Events

| Event | Direction | Payload Type |
|---|---|---|
| `SHOW_NPC_DIALOGUE` | `NpcGameObject` → `UIScene` + `GameScene` | `{ pages: DialoguePage[], speakerName: string }` |
| `NPC_DIALOGUE_CLOSED` | `UIScene` → `GameScene` | — |

These are separate from the existing `SHOW_DIALOG` / `DIALOG_CLOSED` events (used for chest rewards). Both systems coexist without interference.

---

## Implementation Notes

- **UIScene is never paused.** Even after `GameScene.scene.pause()`, UIScene continues ticking. This is what makes player-advance dialogue possible without a third scene.
- **JustDown vs isDown.** `Phaser.Input.Keyboard.JustDown` returns true only on the first frame the key is pressed. This prevents a single key press from skipping multiple pages.
- **Existing `SHOW_DIALOG` system is unchanged.** It auto-dismisses after 3 seconds and is used only for chest rewards. NPC dialogue uses an entirely separate container and event pair.
- **GameScene pause timing.** `GameScene` pauses in response to `SHOW_NPC_DIALOGUE`. The event fires inside `InteractiveObjectComponent.interact()`, which is called by `MoveState` before the player transitions to `IDLE_STATE`. The transition and pause both happen in the same frame — the ordering is safe because Phaser defers physics updates until the next frame.

---

## Future Considerations

- **Name plates with portraits** — add an optional `portrait` field to `DialoguePage` and render a character icon left of the text.
- **Typewriter effect** — reveal characters one at a time with a timer; pressing X skips to full reveal before advancing.
- **Branching dialogue** — replace the `DialoguePage[]` array with a dialogue graph (node/choice model). Would require a more complex `NpcData` structure.
- **Localization** — the `NPC_CONFIGS` registry is already isolated; swapping it for a language-keyed version would be straightforward.

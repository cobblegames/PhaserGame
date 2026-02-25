# UI & HUD

Quilombo's user interface consists of three parts: the in-game HUD (rendered by `UIScene`), the menu systems (rendered directly in scene), and the touch control overlay (rendered by `TouchControlsScene`).

---

## UIScene — HUD

**Source:** `src/scenes/ui-scene.ts`

`UIScene` runs in parallel with `GameScene` using a fixed (non-scrolling) camera, so the HUD always appears anchored to the screen regardless of camera movement.

### Heart Display

The player's health is shown as a row of hearts in the top-right area of the screen.

**Layout:**
- Up to 20 heart slots total (supports up to 40 HP — currently only 6 HP max is used)
- 2 rows of 10 hearts
- Row 1: hearts 1–10, x positions from 157 to 229 (8px spacing), y = 25
- Row 2: hearts 11–20, x positions from 157 to 229, y = 33
- Hearts not in use are hidden (NONE state)

**Heart States:**

| Frame | Meaning |
|---|---|
| FULL | Full heart (2 HP) |
| HALF | Half heart (1 HP) |
| EMPTY | Empty heart slot |
| NONE | Hidden — slot not used |

**Health Update Animation:**

When `PLAYER_HEALTH_UPDATED` fires, `UIScene` compares the previous and current health values and animates each lost heart individually:
- Losing the first half of a heart: plays `LOSE_FIRST_HALF` animation on that heart sprite
- Losing the last half (full → empty): plays `LOSE_LAST_HALF` animation
- Animations are awaited sequentially so hearts drain one at a time for visual clarity

The initial heart state is read from `DataManager` when `UIScene` starts (so it's correct after a room transition).

### Dialog Box

The dialog box displays short text messages to the player, typically triggered when a chest is opened.

**Behavior:**
- Appears as a framed box in the lower portion of the screen (anchored at x=32, y=142)
- Displays the text passed with the `SHOW_DIALOG` event
- Auto-closes after **3 seconds**
- On close, emits `DIALOG_CLOSED` → `GameScene` resumes (it was paused during dialog)

**Trigger flow:**
```
Chest opened
→ GameScene emits SHOW_DIALOG("You got Small Key!")
→ UIScene shows dialog box
→ GameScene pauses
→ 3 seconds pass
→ UIScene emits DIALOG_CLOSED
→ GameScene resumes
```

---

## Menu Systems

The game has three scenes with interactive menus: `StartScene`, `OptionsScene`, and `GameOverScene`. All use the same interaction pattern.

### Navigation

**Keyboard:**
- Up/Down arrow keys move between items
- Z or Enter confirms the selection

**Mouse / Touch:**
- Moving the pointer over a menu item selects it (cursor follows)
- Clicking or tapping confirms

### Cursor

A small sprite cursor appears to the left of the currently selected menu item. It moves vertically to track the selection.

### Item Hover States

| State | Alpha |
|---|---|
| Normal | 100% |
| Hovered | 80% |
| Pressed | 60% |

---

## Touch Controls Overlay

**Source:** `src/scenes/touch-controls-scene.ts`
**Source:** `src/ui/virtual-joystick.ts`, `src/ui/touch-button.ts`

The touch overlay is an optional scene launched by `GameScene`. It provides virtual controls for mobile players.

### Virtual Joystick

The joystick handles all directional movement input.

**Positioning:**
- Active area: left half of the screen (x: 0 to ~103, full height)
- The joystick graphic appears where the player first touches, within this area
- Re-centers at the touch-down position each time (dynamic joystick)

**Specs:**
| Property | Value |
|---|---|
| Base radius | 16px |
| Stick (knob) radius | 8px |
| Max travel distance | 16px |
| Dead zone radius | 8px |

**Directions:**
- Stick position within the dead zone = no movement input
- Beyond the dead zone: outputs one of 8 directions (UP, UP-RIGHT, RIGHT, DOWN-RIGHT, DOWN, DOWN-LEFT, LEFT, UP-LEFT)
- The 8-direction output is mapped to 4-directional movement by the input abstraction layer

**Appearance:**
- Drawn dynamically with Phaser Graphics API (circles)
- Base: larger outer circle (semi-transparent)
- Knob: smaller inner circle that moves with the finger
- Disappears when the finger is lifted

### Touch Buttons

Two round buttons on the right side of the screen:

| Button | Position | Maps To |
|---|---|---|
| Attack | (224, 194) | Z key — sword attack |
| Action | (186, 194) | X key — lift/throw/interact |

**Appearance:**
- Semi-transparent circular background (30% alpha normal, 60% alpha when pressed)
- Text label inside (Z / X)
- Visual feedback: alpha increases when pressed

### Multi-Touch

Up to 4 simultaneous touch pointers are supported (configured in Phaser game config). Each pointer is tracked independently:

- Pointer down in joystick area → assigns that pointer to the joystick
- Pointer down on Attack button → assigns that pointer to Attack
- Pointer down on Action button → assigns that pointer to Action
- Multiple fingers can be held simultaneously (e.g., moving with joystick while attacking)

An internal `activePointers` Map tracks which control each active pointer ID is assigned to.

### Toggle

Touch controls can be toggled on or off in `OptionsScene`. The setting is stored in `DataManager.touchControlsEnabled`. When toggled:
- `TOUCH_CONTROLS_TOGGLED` event fires
- If enabled: `TouchControlsScene` starts
- If disabled: `TouchControlsScene` stops

---

## Font

All UI text uses the **Press Start 2P** pixel font, loaded from `public/assets/fonts/Press_Start_2P/PressStart2P-Regular.ttf`. This is a monospace 8-bit style font that fits the pixel art aesthetic.

---

## Screen Layout Reference

```
┌────────────────────────────────────────────────┐
│                                  ♥♥♥           │  ← Hearts (UIScene)
│                                                │
│                                                │
│          [  Game World  ]                      │
│                                                │
│                                                │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │  Dialog Box (appears when triggered)     │   │  ← Dialog (UIScene)
│ └──────────────────────────────────────────┘   │
│                                                │
│  [Joystick area]              [A] [B]          │  ← Touch overlay
└────────────────────────────────────────────────┘
                                256×224 px native
```

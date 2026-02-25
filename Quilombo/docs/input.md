# Input

Quilombo uses an abstracted input system that allows gameplay logic to be completely independent of the input source. The player can be controlled by keyboard, touch, or both simultaneously.

---

## Input Abstraction

All input is represented through a common interface (`InputComponent`). Any class that implements this interface can drive a character's controls — whether it reads from a keyboard, a virtual joystick, or AI logic.

```
InputComponent  (abstract interface)
       │
       ├── KeyboardComponent      reads Phaser CursorKeys + WASD
       │
       ├── TouchComponent         reads VirtualJoystick + TouchButtons
       │
       └── CombinedInputComponent merges keyboard OR touch (either active)
```

**Source:** `src/components/input/`

---

## InputComponent Interface

Every input source exposes the same set of boolean properties:

| Property | Description |
|---|---|
| `isUpDown` | Movement up is held |
| `isDownDown` | Movement down is held |
| `isLeftDown` | Movement left is held |
| `isRightDown` | Movement right is held |
| `isUpJustDown` | Movement up just pressed this frame |
| `isDownJustDown` | Movement down just pressed this frame |
| `isLeftJustDown` | Movement left just pressed this frame |
| `isRightJustDown` | Movement right just pressed this frame |
| `isAttackKeyDown` | Attack (Z) is held |
| `isAttackKeyJustDown` | Attack (Z) just pressed this frame |
| `isActionKeyDown` | Action (X) is held |
| `isActionKeyJustDown` | Action (X) just pressed this frame |
| `isEnterKeyJustDown` | Enter/confirm just pressed this frame |
| `isMovementLocked` | When true, all movement input is suppressed |

The `isMovementLocked` flag is set externally by `GameScene` during room transitions or dialog pauses to prevent the player from moving.

---

## Keyboard Input

**Source:** `src/components/input/keyboard-component.ts`

Reads standard Phaser keyboard state each frame.

### Key Bindings

| Key(s) | Action |
|---|---|
| Arrow keys or W / A / S / D | Movement |
| Z | Attack (sword swing) |
| X | Action (lift pot, throw pot, interact with chest) |
| Enter | Menu confirm |

The `JustDown` variants are used for actions that should trigger once per press (attack, interact), while `Down` variants are used for continuous state (movement).

---

## Touch Input

**Source:** `src/components/input/touch-component.ts`

Reads from the `VirtualJoystick` and two `TouchButton` instances managed by `TouchControlsScene`.

### Mapping

| Touch Control | Maps To |
|---|---|
| Joystick UP | `isUpDown` / `isUpJustDown` |
| Joystick DOWN | `isDownDown` / `isDownJustDown` |
| Joystick LEFT | `isLeftDown` / `isLeftJustDown` |
| Joystick RIGHT | `isRightDown` / `isRightJustDown` |
| Attack button | `isAttackKeyDown` / `isAttackKeyJustDown` |
| Action button | `isActionKeyDown` / `isActionKeyJustDown` |

The joystick outputs 8 directions but the input component maps diagonal inputs to their nearest cardinal axis pair (e.g., UP-RIGHT → isUpDown + isRightDown both true).

---

## Combined Input

**Source:** `src/components/input/combined-input-component.ts`

When touch controls are enabled, `CombinedInputComponent` is used. It wraps both a `KeyboardComponent` and a `TouchComponent` and merges their outputs using OR logic:

```
isUpDown = keyboard.isUpDown OR touch.isUpDown
isAttackKeyDown = keyboard.isAttackKeyDown OR touch.isAttackKeyDown
... (same for all properties)
```

This means both sources are active simultaneously. A player can move with the joystick and press a keyboard key at the same time without either source overriding the other.

---

## ControlsComponent

**Source:** `src/components/game-object/controls-component.ts`

Each character has a `ControlsComponent` that holds a reference to its active `InputComponent`. State machine states read input through this component, never directly from Phaser. This means:

- The player's input source can be swapped at runtime without changing any state logic
- Enemy AI can implement the same interface to produce programmatic movement

---

## Movement Lock

During certain events, player movement is suppressed by setting `isMovementLocked = true` on the active input component:

| Event | Lock | Unlock |
|---|---|---|
| Room transition starts | YES | After transition completes |
| Dialog box shows | YES (GameScene pauses) | Dialog closes → GameScene resumes |
| Player death | YES | N/A (game over) |

While locked, all movement and action inputs return `false`, effectively freezing the player in place.

---

## Multi-Touch Support

Phaser is configured with `input.activePointers: 4` to support up to 4 simultaneous touch points. This allows:

- Joystick held with one finger
- Attack button held with another finger
- Action button pressed with a third finger

Each pointer is tracked by its Phaser pointer ID in `TouchControlsScene`. Pointer events (down, move, up) are routed to the correct control based on the area touched and which pointer owns which control.

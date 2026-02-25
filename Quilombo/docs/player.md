# Player

The player is a 4-directional character controlled by keyboard or touch input. All behavior is driven by a state machine composed of reusable components.

**Source:** `src/game-objects/player/player.ts`
**Base class:** `CharacterGameObject` (`src/game-objects/common/character-game-object.ts`)

---

## Stats

| Stat | Value |
|---|---|
| Max Health | 6 HP (3 hearts) |
| Movement Speed | 80 px/s |
| Attack Damage | 1 (sword) |
| Invulnerability Window | 1 second after being hit |
| Knockback Speed | 50 px/s |

---

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys or WASD | Virtual joystick |
| Attack | Z | Attack button (right side) |
| Lift / Throw / Interact | X | Action button (right side) |
| Menu select | Enter | Tap menu item |

See [Input](input.md) for the full input abstraction.

---

## State Machine

The player's behavior is managed by a state machine. Only one state is active at any time; states can queue up if a transition is requested mid-state.

```
                    ┌─────────────────────────────────┐
                    │          IDLE                   │
                    └─────┬──────────┬────────────────┘
          movement input  │          │ Z (attack)      X (near pot)
                          ▼          ▼                 ▼
                       MOVE       ATTACK              LIFT
                          │                            │
                          │                            ▼
                          │                     IDLE_HOLDING
                          │                     ┌─────┴──────┐
                          │          movement   │            │ X (throw)
                          │                     ▼            ▼
                          │              MOVE_HOLDING     THROW
                          │
              (near interactable chest)
                          │
                          ▼
                     OPEN_CHEST

   ──────────────────────────────────────────────
   From ANY state (if not invulnerable):
      on hit   →  HURT  →  IDLE  (after knockback)
      health=0 →  DEATH
```

### State Descriptions

| State | Description |
|---|---|
| **IDLE** | Standing still. Listens for movement, attack, or action input |
| **MOVE** | Walking in the current direction. Returns to IDLE when no movement input |
| **ATTACK** | Plays the sword swing animation. Weapon hitbox is active during this state |
| **LIFT** | Plays the lift animation while picking up a pot. Transitions to IDLE_HOLDING |
| **IDLE_HOLDING** | Standing still while carrying a pot. Can move or throw |
| **MOVE_HOLDING** | Walking while carrying a pot |
| **THROW** | Releases the held pot with velocity in the facing direction |
| **OPEN_CHEST** | Plays the chest-opening animation sequence |
| **HURT** | Receives knockback after being hit. Invulnerability begins. Returns to IDLE |
| **DEATH** | Plays the death animation. Triggers game-over flow |

---

## Animations

All animations have 4 directional variants (UP, DOWN, LEFT, RIGHT):

| Animation | States |
|---|---|
| `IDLE_*` | Standing still, facing a direction |
| `WALK_*` | Moving |
| `ATTACK_*` | Sword swing |
| `HURT_*` | Hit reaction |
| `DIE_*` | Death sequence |
| `LIFT_*` | Picking up a pot |
| `IDLE_HOLD_*` | Standing still, holding a pot |
| `WALK_HOLD_*` | Walking while holding a pot |

Animations are registered in `PreloadScene` from Aseprite atlas data. Direction suffixes correspond to sprite atlas frame names.

---

## Components

The player is composed of the following components (all defined in `src/components/game-object/`):

| Component | Purpose |
|---|---|
| **AnimationComponent** | Maps game states/directions to animation keys and drives playback |
| **DirectionComponent** | Tracks current facing direction; fires callbacks on direction change |
| **SpeedComponent** | Stores movement speed (80 px/s) |
| **ControlsComponent** | Wraps the active `InputComponent` (keyboard, touch, or combined) |
| **LifeComponent** | Tracks current and max HP; `takeDamage()` reduces health |
| **InvulnerableComponent** | Sets and checks the post-hit immunity flag with a 1-second timer |
| **CollidingObjectsComponent** | Tracks objects currently overlapping this frame |
| **HeldGameObjectComponent** | Manages the currently carried object (pots) |
| **WeaponComponent** | Attaches the sword; updates weapon position and collision each frame |

---

## Object Interaction

The X key (or action button) triggers different behaviors depending on context:

- **Near a pot** → lift it (LIFT state)
- **Holding a pot** → throw it (THROW state)
- **In front of a chest** → open it (OPEN_CHEST state, triggers chest callback)

The `InteractiveObjectComponent` on pots and chests defines the interaction type and callback. `CollidingObjectsComponent` tracks which objects the player is currently touching, allowing the player state machine to find the nearest interactable.

---

## Health & Damage

When the player takes a hit:
1. Invulnerability is checked — if already invulnerable, nothing happens
2. `LifeComponent.takeDamage(1)` reduces health
3. `DataManager` updates the stored current health value
4. `PLAYER_HEALTH_UPDATED` event is emitted → `UIScene` animates the heart display
5. If health reaches 0: transition to DEATH_STATE → emit `PLAYER_DEFEATED`
6. If health > 0: transition to HURT_STATE with knockback direction

See [Combat](combat.md) for the full hit resolution flow.

---

## Death & Game Over

When health reaches 0:
1. Player transitions to DEATH_STATE
2. Death animation plays
3. `PLAYER_DEFEATED` event fires
4. `GameScene` stops sibling scenes (`UIScene`, `TouchControlsScene`)
5. Transitions to `GameOverScene`

On "Continue" from the game over screen, player health is restored and the game restarts from the dungeon start room.

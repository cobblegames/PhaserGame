# Enemies

Quilombo has three enemy types: two common enemies and one boss. Each uses the same `CharacterGameObject` base class and state machine system as the player, but with AI-driven control instead of player input.

---

## Overview

| Enemy | HP | Speed | Damage | Special |
|---|---|---|---|---|
| Spider | 2 | 40 px/s | 1 | Random walk AI |
| Wisp | 1 | 60 px/s | 1 | Invulnerable to projectiles; floating animation |
| Drow (Boss) | 6 | 50 px/s | 1 (dagger) | Teleport, multi-phase AI |

All enemies deal 1 point of damage on contact or projectile hit.

---

## Spawning

Enemies are placed in levels via Tiled object layers. Each enemy object has a numeric `type` field that maps to a class:

| Type Number | Enemy |
|---|---|
| 1 | Spider |
| 2 | Wisp |
| 3 | Drow (Boss) |

All enemies for all rooms are created at level load time but start disabled. They are activated when their room becomes the current room. The Drow boss only spawns if `DataManager.bossDefeated` is `false`.

---

## Enemy Defeat Tracking

When an enemy dies, it emits `ENEMY_DESTROYED`. `GameScene` listens and checks whether all non-Wisp enemies in the current room have been defeated. If so, it triggers any linked rewards (revealing hidden chests, opening trap doors). Wisps are excluded from this check — they are ambient obstacles and do not count toward room completion.

See [Progression](progression.md) for how defeat triggers work.

---

## Spider

**Source:** `src/game-objects/enemies/spider.ts`

The Spider is the most common enemy. It wanders randomly around the room with no awareness of the player.

**Behavior:**
- Moves in a random direction at regular intervals (every 2–8 seconds, randomized per spider)
- When a direction change fires, a new random direction is chosen from the 4 cardinal directions
- Collides with walls and changes direction on collision
- No player-tracking or attack behavior — damage is dealt on contact

**Rotation:**
The spider sprite rotates to face its movement direction, calculated from the velocity angle:
- Facing down: 0°
- Facing left: 90°
- Facing up: 180°
- Facing right: 270°

**State Machine:**
```
IDLE ↔ MOVE   (direction change timer)
ANY → HURT    (on damage)
ANY → DEATH   (0 HP)
```

**Death:** On death, plays the standard enemy death particle animation and emits `ENEMY_DESTROYED`.

---

## Wisp

**Source:** `src/game-objects/enemies/wisp.ts`

The Wisp is a ghostly floating enemy that moves in smooth, bouncing arcs. It cannot be harmed by thrown pots or dagger projectiles.

**Behavior:**
- Uses `BounceMoveState` for movement — a smooth, sinusoidal floating pattern
- Moves toward the player's position
- No idle state — always moving
- Invulnerable to thrown pots (CollidingObjectsComponent tracks this; pots pass through)

**Float Animation:**
A continuous Phaser tween oscillates the Wisp's Y scale and X scale slightly, creating a pulsing "alive" look independent of the movement direction.

**State Machine:**
```
BOUNCE_MOVE   (always)
ANY → HURT    (on sword hit)
ANY → DEATH   (0 HP)
```

Note: Despite having a HURT state registered, the Wisp's invulnerability flag means only the player's sword can damage it.

**Death:** Same enemy death animation as Spider.

---

## Drow (Boss)

**Source:** `src/game-objects/enemies/boss/drow.ts`

The Drow is the dungeon boss. It uses a multi-phase state machine with teleportation, a wind-up phase, and ranged dagger attacks. It is larger than regular enemies (1.25× scale).

**Stats:**
- HP: 6
- Speed: 50 px/s
- Scale: 1.25× (larger sprite)
- Weapon: Dagger projectile

**Weapon — Dagger:**
The Drow throws dagger projectiles in the direction it is facing. Daggers travel at 160 px/s and disappear on player contact or room boundary. Each dagger deals 1 damage.

**Boss State Machine:**
```
HIDDEN
   │  (after ~1 second delay)
   ▼
 IDLE
   │  (after 3 seconds idle)
   ▼
TELEPORT ──────────────────────────────────▶ PREPARE_ATTACK
   ▲                                               │
   │                                               │ (wind-up complete)
   │                                               ▼
   │                                            ATTACK
   │                                               │
   └───────────────────────────────────────────────┘
         (loop: teleport → prepare → attack → teleport)

   On any hit:
   HURT → TELEPORT  (flees to a new position after damage)

   When HP = 0:
   DEATH  (flash effect + wipe animation, emits BOSS_DEFEATED)
```

**State Details:**

| State | Duration | Description |
|---|---|---|
| HIDDEN | ~1 second | Invisible at spawn. Initial dramatic pause |
| IDLE | ~3 seconds | Visible, stationary. Watches the player |
| TELEPORT | Instant | Moves to one of 3 predefined positions |
| PREPARE_ATTACK | ~1 second | Wind-up animation before throwing |
| ATTACK | Brief | Throws a dagger in the player's direction |
| HURT | Brief | Hit reaction, then immediately teleports |
| DEATH | Animation length | Flash + Wipe filter effect |

**Teleport Positions:**

The Drow teleports to one of three fixed spots in the boss room:

| Position | Coordinates |
|---|---|
| Center top | (128, 80) |
| Bottom left | (64, 180) |
| Bottom right | (192, 180) |

A random position is chosen, excluding the current one.

**Boss Defeat:**

When HP reaches 0:
1. A flash effect plays (rapid alpha oscillation)
2. A Phaser Wipe filter animation clears the boss sprite
3. `DataManager.bossDefeated` is set to `true`
4. `BOSS_DEFEATED` event is emitted
5. Any trap doors linked to the boss fight are opened

The boss does not respawn once defeated (the spawn check in `GameScene` uses `DataManager.bossDefeated`).

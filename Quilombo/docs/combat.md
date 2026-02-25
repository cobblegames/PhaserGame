# Combat

Combat in Quilombo is melee and projectile-based. The player attacks with a sword; the Drow boss throws daggers. Thrown pots also deal damage. All damage is resolved through the same hit pipeline.

---

## Weapons

| Weapon | User | Type | Damage | Notes |
|---|---|---|---|---|
| Sword | Player | Melee (area) | 1 | Active only during ATTACK state |
| Dagger | Drow Boss | Projectile | 1 | Travels at 160 px/s, disappears on hit |
| Thrown Pot | Player | Projectile | 1 | Breaks on enemy or wall contact |

### Sword

The sword is a melee weapon attached to the player. It has a physics body that is only active during the ATTACK state — the hitbox is enabled when the animation starts and disabled when it ends. The hitbox is positioned in front of the player based on facing direction.

The sword deals 1 point of damage to any enemy it overlaps with during the active swing window.

### Dagger

The Drow boss spawns a dagger projectile during its ATTACK state. The dagger:
- Travels in the direction the Drow is facing at the moment of throw
- Has a visible sprite that moves during flight
- Disappears immediately on contact with the player (dealing 1 damage)
- Does not linger in the room

### Thrown Pot

When the player throws a held pot:
- The pot is launched with velocity in the player's current facing direction
- On collision with an enemy: deals 1 damage and plays the break animation
- On collision with a wall: plays the break animation (no damage)
- Wisps are immune — pots pass through them

---

## Hit Resolution

All entities that can take damage inherit from `CharacterGameObject`. The `hit(direction, damage)` method is the central point of all damage processing.

```
A weapon overlaps a character
         │
         ▼
   hit(direction, damage) called
         │
         ├─ Already defeated?  ──YES──▶  abort (no effect)
         │
         ├─ Currently invulnerable?  ──YES──▶  abort (no effect)
         │
         ▼
   LifeComponent.takeDamage(damage)
         │
         ├─ If player: DataManager.updatePlayerCurrentHealth(newHealth)
         │             emit PLAYER_HEALTH_UPDATED
         │
         ├─ Health = 0?
         │       YES ──▶  isDefeated = true
         │                transition DEATH_STATE
         │                (emit PLAYER_DEFEATED or ENEMY_DESTROYED on death anim)
         │
         └─ Health > 0?
                 YES ──▶  transition HURT_STATE(direction, damage)
```

---

## Invulnerability Frames

After taking damage, the player becomes temporarily invulnerable for **1 second**. During this window:
- No further damage can be applied
- The player sprite flashes (rapid alpha oscillation as visual feedback)
- The flash effect is implemented in `juice-utils.ts` and is driven by the `InvulnerableComponent`

Enemies have **no invulnerability window** — they can be hit again immediately after a hit.

---

## Hurt State & Knockback

When a character's health is above 0 after taking damage, they enter the HURT state:
- The character is pushed back in the direction of the hit (knockback)
- Player knockback speed: 50 px/s
- The hurt animation plays briefly
- After the knockback resolves, the character returns to IDLE

---

## Enemy Collision Damage

Enemies deal contact damage — if an enemy's physics body overlaps with the player's body, the player takes 1 damage. This is handled through Phaser's arcade physics overlap callbacks registered in `GameScene.#registerColliders()`.

---

## All-Enemies-Defeated Trigger

When an enemy dies:
1. `ENEMY_DESTROYED` event fires
2. `GameScene` counts remaining active enemies in the current room (excluding Wisps)
3. If count reaches 0 → `#handleAllEnemiesDefeated()` runs
4. Linked events execute: hidden chests are revealed, trap doors are unlocked

This creates puzzle-combat scenarios where defeating enemies is required to progress.

import * as Phaser from 'phaser';
import { GameObject, Position } from "../../common/types";
import { InputComponent } from '../../common/components/input/input-component';
import { IdleState } from '../../common/components/state-machine/states/character/idle-state';
import { CHARACTER_STATES } from '../../common/components/state-machine/states/character/character-states';
import { MoveState } from '../../common/components/state-machine/states/character/move-state';

import { PLAYER_HURT_PUSHBACK_SPEED, PLAYER_INVULNERABLE_AFTER_HIT_ANIMATION_DURATION, PLAYER_SPEED } from '../../common/config';

import { AnimationConfig } from '../../common/components/game-object/animation-component';
import { ASSET_KEYS, PLAYER_ANIMATION_KEYS } from '../../common/assets';
import { CharacterGameObject } from '../../common/components/game-object/common/character-game-object';
import { HurtState } from '../../common/components/state-machine/states/character/hurt-state';
import { flash } from '../../common/juice-utils';
import { DeathState } from '../../common/components/state-machine/states/character/death-state';
import { CollidingObjectsComponent } from '../../common/components/game-object/colliding-objects-component';
import { LiftState } from '../../common/components/state-machine/states/character/lift-state';
import { OpenChestState } from '../../common/components/state-machine/states/character/open-chest-state';
import { IdleHoldingState } from '../../common/components/state-machine/states/character/idle-holding-state';
import { MoveHoldingState } from '../../common/components/state-machine/states/character/move-holding-state';

export type PlayerConfig = 
{
    scene: Phaser.Scene;
    position: Position;
    controls: InputComponent;
    maxLife: number;
    currentLife: number;

}

export class Player extends CharacterGameObject
{
    #collidingObjecsComponent: CollidingObjectsComponent;
    constructor(config: PlayerConfig) 
    {

        const animationConfig: AnimationConfig = 
        {
            WALK_DOWN: {key: PLAYER_ANIMATION_KEYS.WALK_DOWN, repeat: -1, ignoreIfPlaying: true},
            WALK_UP: {key: PLAYER_ANIMATION_KEYS.WALK_UP, repeat: -1, ignoreIfPlaying: true},
            WALK_LEFT: {key: PLAYER_ANIMATION_KEYS.WALK_SIDE, repeat: -1, ignoreIfPlaying: true},
            WALK_RIGHT: {key: PLAYER_ANIMATION_KEYS.WALK_SIDE, repeat: -1, ignoreIfPlaying: true},

            IDLE_DOWN: {key: PLAYER_ANIMATION_KEYS.IDLE_DOWN, repeat: -1, ignoreIfPlaying: true},
            IDLE_UP: {key: PLAYER_ANIMATION_KEYS.IDLE_UP, repeat: -1, ignoreIfPlaying: true},
            IDLE_LEFT: {key: PLAYER_ANIMATION_KEYS.IDLE_SIDE, repeat: -1, ignoreIfPlaying: true},
            IDLE_RIGHT: {key: PLAYER_ANIMATION_KEYS.IDLE_SIDE, repeat: -1, ignoreIfPlaying: true},

            HURT_DOWN: {key: PLAYER_ANIMATION_KEYS.HURT_DOWN, repeat: 0, ignoreIfPlaying: true},
            HURT_UP: {key: PLAYER_ANIMATION_KEYS.HURT_UP, repeat: 0, ignoreIfPlaying: true},
            HURT_LEFT: {key: PLAYER_ANIMATION_KEYS.HURT_SIDE, repeat: 0, ignoreIfPlaying: true},
            HURT_RIGHT: {key: PLAYER_ANIMATION_KEYS.HURT_SIDE, repeat: 0, ignoreIfPlaying: true},

            DIE_DOWN: {key: PLAYER_ANIMATION_KEYS.DIE_DOWN, repeat: 0, ignoreIfPlaying: true},
            DIE_UP: {key: PLAYER_ANIMATION_KEYS.DIE_UP, repeat: 0, ignoreIfPlaying: true},
            DIE_LEFT: {key: PLAYER_ANIMATION_KEYS.DIE_SIDE, repeat: 0, ignoreIfPlaying: true},
            DIE_RIGHT: {key: PLAYER_ANIMATION_KEYS.DIE_SIDE, repeat: 0, ignoreIfPlaying: true},

            IDLE_HOLD_DOWN: {key: PLAYER_ANIMATION_KEYS.IDLE_HOLD_DOWN, repeat: -1, ignoreIfPlaying: true},
            IDLE_HOLD_UP: {key: PLAYER_ANIMATION_KEYS.IDLE_HOLD_UP, repeat: -1, ignoreIfPlaying: true},
            IDLE_HOLD_LEFT: {key: PLAYER_ANIMATION_KEYS.IDLE_HOLD_SIDE, repeat: -1, ignoreIfPlaying: true},
            IDLE_HOLD_RIGHT: {key: PLAYER_ANIMATION_KEYS.IDLE_HOLD_SIDE, repeat: -1, ignoreIfPlaying: true},

            WALK_HOLD_DOWN: {key: PLAYER_ANIMATION_KEYS.WALK_DOWN, repeat: -1, ignoreIfPlaying: true},
            WALK_HOLD_UP: {key: PLAYER_ANIMATION_KEYS.WALK_UP, repeat: -1, ignoreIfPlaying: true},
            WALK_HOLD_LEFT: {key: PLAYER_ANIMATION_KEYS.WALK_SIDE, repeat: -1, ignoreIfPlaying: true},
            WALK_HOLD_RIGHT: {key: PLAYER_ANIMATION_KEYS.WALK_SIDE, repeat: -1, ignoreIfPlaying: true},




        };

        super(
        {
            scene: config.scene,
            position: config.position,
            assetKey: ASSET_KEYS.PLAYER,
            frame: 0,
            id: 'player',
            isPlayer: true,
            animationConfig,
            speed: PLAYER_SPEED,
            inputComponent: config.controls,
            isInvulnerable: false,
            invulnerableAfterHitAnimationDuration: PLAYER_INVULNERABLE_AFTER_HIT_ANIMATION_DURATION,
            maxLife: config.maxLife,
            currentLife: config.currentLife,
        });

        this.#collidingObjecsComponent = new CollidingObjectsComponent(this);

        this._stateMachine.addState(new IdleState(this));
        this._stateMachine.addState(new MoveState(this));
        this._stateMachine.addState(
            new HurtState(this,PLAYER_HURT_PUSHBACK_SPEED, () => {
                        flash(this);
            }),
        );
        this._stateMachine.addState(new DeathState(this));
        this._stateMachine.addState(new LiftState(this));
        this._stateMachine.addState(new OpenChestState(this));
        this._stateMachine.addState(new IdleHoldingState(this));
        this._stateMachine.addState(new MoveHoldingState(this));

        this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);

        config.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
        config.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, 
            () => config.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this));

            this.physicsBody.setSize(12, 16, true).setOffset(this.width/2 - 5, this.height/2);
    }

 get physicsBody(): Phaser.Physics.Arcade.Body
 {
    return this.body as Phaser.Physics.Arcade.Body;
 }
 
 public collidedWithGameObject(gameObject : GameObject) : void
 {
    this.#collidingObjecsComponent.add(gameObject);

 }

 public update() : void
 {
    super.update();
    
    this.#collidingObjecsComponent.reset();
 }
    
}
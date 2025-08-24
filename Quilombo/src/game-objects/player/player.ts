import * as Phaser from 'phaser';
import { Position } from "../../common/types";
import { InputComponent } from '../../common/components/input/input-component';
import { IdleState } from '../../common/components/state-machine/states/character/idle-state';
import { CHARACTER_STATES } from '../../common/components/state-machine/states/character/character-states';
import { MoveState } from '../../common/components/state-machine/states/character/move-state';

import { PLAYER_INVULNERABLE_AFTER_HIT_ANIMATION_DURATION, PLAYER_SPEED } from '../../common/config';

import { AnimationConfig } from '../../common/components/game-object/animation-component';
import { ASSET_KEYS, PLAYER_ANIMATION_KEYS } from '../../common/assets';
import { CharacterGameObject } from '../../common/components/game-object/common/character-game-object';

export type PlayerConfig = 
{
    scene: Phaser.Scene;
    position: Position;
    controls: InputComponent;

}

export class Player extends CharacterGameObject
{
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
        });



        this._stateMachine.addState(new IdleState(this));
        this._stateMachine.addState(new MoveState(this));
        this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);

        config.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
        config.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, 
            () => config.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this));
    }

    
    
}
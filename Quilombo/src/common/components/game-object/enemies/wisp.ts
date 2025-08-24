import * as Phaser from 'phaser';
import { CharacterGameObject } from '../common/character-game-object';
import {  Position } from '../../../types';
import { InputComponent } from '../../input/input-component';
import { AnimationConfig } from '../animation-component';
import { ASSET_KEYS, WISP_ANIMATION_KEYS } from '../../../assets';
import { ENEMY_WISP_PULSE_ANIMATION_DURATION, ENEMY_WISP_PULSE_ANIMATION_SCALE_X, ENEMY_WISP_PULSE_ANIMATION_SCALE_Y, ENEMY_WISP_SPEED} from '../../../config';
import { IdleState } from '../../state-machine/states/character/idle-state';
import { MoveState } from '../../state-machine/states/character/move-state';
import { CHARACTER_STATES } from '../../state-machine/states/character/character-states';
import { BounceMoveState } from '../../state-machine/states/character/bounce-move-state';
export type WispConfig = 
{
    scene: Phaser.Scene;
    position: Position;
}

export class Wisp extends CharacterGameObject
{
    constructor(config: WispConfig) 
    {

        const animConfig = {key: WISP_ANIMATION_KEYS.IDLE, repeat: -1, ignoreIfPlaying: true};
        const animationConfig: AnimationConfig = 
        {
            IDLE_DOWN: animConfig,
            IDLE_UP: animConfig,
            IDLE_LEFT: animConfig,
            IDLE_RIGHT: animConfig,

        };

        super(
        {
            scene: config.scene,
            position: config.position,
            assetKey: ASSET_KEYS.WISP,
            frame: 0,
            id: `wisp-${Phaser.Math.RND.uuid()}`,
            isPlayer: false,
            animationConfig,
            speed: ENEMY_WISP_SPEED,
            inputComponent: new InputComponent(), 
            isInvulnerable: true,
        });

 
        this._stateMachine.addState(new BounceMoveState(this));   
        this._stateMachine.setState(CHARACTER_STATES.BOUNCE_MOVE_STATE);

        this.scene.tweens.add
        (
            {
                targets: this,
                scaleX: ENEMY_WISP_PULSE_ANIMATION_SCALE_X,
                scaleY: ENEMY_WISP_PULSE_ANIMATION_SCALE_Y,
                yoyo: true,
                ease: 'Sine.easeInOut',
                repeat: -1,
                duration: ENEMY_WISP_PULSE_ANIMATION_DURATION,                
            }
        );

 
    }

    
}
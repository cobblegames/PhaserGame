import * as Phaser from 'phaser';
import { CharacterGameObject } from '../common/character-game-object';
import { Position } from '../../../types';
import { InputComponent } from '../../input/input-component';
import { AnimationConfig } from '../animation-component';
import { ASSET_KEYS, SPIDER_ANIMATION_KEYS } from '../../../assets';
import { ENEMY_SPIDER_SPEED} from '../../../config';
import { IdleState } from '../../state-machine/states/character/idle-state';
import { MoveState } from '../../state-machine/states/character/move-state';
import { CHARACTER_STATES } from '../../state-machine/states/character/character-states';
export type SpiderConfig = 
{
    scene: Phaser.Scene;
    position: Position;
}

export class Spider extends CharacterGameObject
{
    constructor(config: SpiderConfig) 
    {

        const animConfig = {key: SPIDER_ANIMATION_KEYS.WALK, repeat: -1, ignoreIfPlaying: true};


        const animationConfig: AnimationConfig = 
        {
            WALK_DOWN: animConfig,
            WALK_UP: animConfig,
            WALK_LEFT: animConfig,
            WALK_RIGHT: animConfig,

            IDLE_DOWN: animConfig,
            IDLE_UP: animConfig,
            IDLE_LEFT: animConfig,
            IDLE_RIGHT: animConfig,

        };

        super(
        {
            scene: config.scene,
            position: config.position,
            assetKey: ASSET_KEYS.SPIDER,
            frame: 0,
            id: `spider-${Phaser.Math.RND.uuid()}`,
            isPlayer: false,
            animationConfig,
            speed: ENEMY_SPIDER_SPEED,
            inputComponent: new InputComponent(), // Spiders don't use player controls
        });



        this._stateMachine.addState(new IdleState(this));
        this._stateMachine.addState(new MoveState(this));
        this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);

    }

    
    
}
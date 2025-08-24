import * as Phaser from 'phaser';
import { CharacterGameObject } from '../common/character-game-object';
import { Direction, Position } from '../../../types';
import { InputComponent } from '../../input/input-component';
import { AnimationConfig } from '../animation-component';
import { ASSET_KEYS, SPIDER_ANIMATION_KEYS } from '../../../assets';
import { ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MAX, ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MIN, ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_WAIT, ENEMY_SPIDER_SPEED} from '../../../config';
import { IdleState } from '../../state-machine/states/character/idle-state';
import { MoveState } from '../../state-machine/states/character/move-state';
import { CHARACTER_STATES } from '../../state-machine/states/character/character-states';
import { DIRECTION } from '../../../common';
import { exhaustiveGuard } from '../../../utils';
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

        this._directionComponent.callback = (direction: Direction) => this.#handleDirectionChange(direction);

        this._stateMachine.addState(new IdleState(this));
        this._stateMachine.addState(new MoveState(this));
        this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);

        this.scene.time.addEvent
        (
            {
                delay: Phaser.Math.Between(ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MIN, ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MAX),
                callback: this.#changeDirection,
                callbackScope: this,
                loop: false,
            }
        );

    }

    #changeDirection() : void
    {
        this.controls.reset();


        this.scene.time.delayedCall(ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_WAIT, () => 
        {
            const randomDirection = Phaser.Math.Between(0, 3);
            if(randomDirection === 0)
            {
                this.controls.isUpDown = true;
            }else if(randomDirection === 1)
            {
                this.controls.isRightDown = true;
            }else if(randomDirection === 2)
            {
                this.controls.isDownDown = true;
            }else
            {
                this.controls.isLeftDown = true;
            }


            this.scene.time.addEvent
            (
                {
                    delay: Phaser.Math.Between(ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MIN, ENEMY_SPIDER_CHANGE_DIRECTION_DELAY_MAX),
                    callback: this.#changeDirection,
                    callbackScope: this,
                    loop: false,
                }
            );

        });

    }
    
    #handleDirectionChange(direction: Direction) : void
    {
      switch(direction)
        {
            case DIRECTION.DOWN:
                this.setAngle(0);
                break;
            case DIRECTION.UP:
                this.setAngle(180);
                break;
            case DIRECTION.LEFT:
                this.setAngle(90);
                break;
            case DIRECTION.RIGHT:
                this.setAngle(270);
                break;
            default:
                exhaustiveGuard(direction);
                break;

        }   
    }
    
}
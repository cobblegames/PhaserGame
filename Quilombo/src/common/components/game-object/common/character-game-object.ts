import * as Phaser from 'phaser';
import { ControlsComponent } from '../controls-component';
import { SpeedComponent } from '../speed-component';
import { DirectionComponent } from '../direction-component';
import { AnimationComponent, AnimationConfig } from '../animation-component';
import { StateMachine } from '../../state-machine/state-machine';
import { InputComponent } from '../../input/input-component';
import { Direction, Position } from '../../../types';
import { IdleState } from '../../state-machine/states/character/idle-state';
import { MoveState } from '../../state-machine/states/character/move-state';
import { CHARACTER_STATES } from '../../state-machine/states/character/character-states';

export type CharacterConfig = 
{
    scene: Phaser.Scene;
    position: Position;
    assetKey: string;
    frame?: number;
    inputComponent: InputComponent;
    animationConfig: AnimationConfig;
    speed: number;
    id?: string;
    isPlayer: boolean;


}

export abstract class CharacterGameObject extends Phaser.Physics.Arcade.Sprite
{
    protected _controlsComponent: ControlsComponent;
    protected _speedComponent: SpeedComponent;
    protected _directionComponent: DirectionComponent;
    protected _animationComponent: AnimationComponent;
    protected _stateMachine: StateMachine;
    protected _isPlayer: boolean;
    constructor(config: CharacterConfig) 
    {
        const{scene, position, assetKey, frame, speed, animationConfig, inputComponent, id} = config;
        const{x,y} = position
        super(scene,x,y,assetKey,frame || 0)

        scene.add.existing(this);
        scene.physics.add.existing(this);

        

        this._controlsComponent = new ControlsComponent(this, inputComponent);
        this._speedComponent = new SpeedComponent(this, config.speed);
        this._directionComponent = new DirectionComponent(this);
        this._animationComponent = new AnimationComponent(this, config.animationConfig);
 

        this._stateMachine = new StateMachine(id);
 
        this._isPlayer = config.isPlayer;
    }
    
    get isEnemy(): boolean
    {
        return !this._isPlayer;
    }

    get controls(): InputComponent
    {
        return this._controlsComponent.controls;
    }

    get speed(): number
    {
        return this._speedComponent.speed;
    }

    get direction(): Direction
    {
        return this._directionComponent.direction;
    }

    get animationComponent(): AnimationComponent
    {
        return this._animationComponent;
    }

    set direction(direction: Direction)
    {
        this._directionComponent.direction = direction;
    }

    public update(): void
    {    
        this._stateMachine.update();
    }

    
}
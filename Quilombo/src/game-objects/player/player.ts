import * as Phaser from 'phaser';
import { Position } from "../../common/types";
import { InputComponent } from '../../common/components/input/input-component';
import { ControlsComponent } from '../../common/components/game-object/controls-component';
import { StateMachine } from '../../common/components/state-machine/state-machine';
import { IdleState } from '../../common/components/state-machine/states/character/idle-state';
import { CHARACTER_STATES } from '../../common/components/state-machine/states/character/character-states';
import { MoveState } from '../../common/components/state-machine/states/character/move-state';

export type PlayerConfig = 
{
    scene: Phaser.Scene;
    position: Position;
    assetKey: string;
    frame?: number;
    controls: InputComponent;

}

export class Player extends Phaser.Physics.Arcade.Sprite
{
    #controlsComponent: ControlsComponent;
    #stateMachine: StateMachine;
    constructor(config: PlayerConfig) 
    {
        const{scene, position, assetKey, frame} = config;
        const{x,y} = position
        super(scene,x,y,assetKey,frame || 0)

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.#controlsComponent = new ControlsComponent(this, config.controls);
 
        this.#stateMachine = new StateMachine('player');
        this.#stateMachine.addState(new IdleState(this));
        this.#stateMachine.addState(new MoveState(this));
        this.#stateMachine.setState(CHARACTER_STATES.IDLE_STATE);

        config.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
        config.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, 
            () => config.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this));
    }

    get controls(): InputComponent
    {
        return this.#controlsComponent.controls;
    }

    update(): void
    {    
        this.#stateMachine.update();
    }

    
}
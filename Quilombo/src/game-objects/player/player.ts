import * as Phaser from 'phaser';
import { Position } from "../../common/types";
import { PLAYER_ANIMATION_KEYS } from '../../common/assets';
import { InputComponent } from '../../common/components/input/input-component
import { ControlsComponent } from '../../common/components/game-object/controls-component';

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

    constructor(config: PlayerConfig) 
    {
        const{scene, position, assetKey, frame} = config;
        const{x,y} = position
        super(scene,x,y,assetKey,frame || 0)

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.#controlsComponent = new ControlsComponent(this, config.controls);
        this.play({key: PLAYER_ANIMATION_KEYS.IDLE_DOWN, repeat: -1});

        config.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
        config.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, 
            () => config.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this));
    }

    update(): void
    {
        const controls = this.#controlsComponent.controls
        if(controls.isUpDown)
        {  
             this.play({key: PLAYER_ANIMATION_KEYS.IDLE_UP, repeat: -1}, true);
        } else if(controls.isDownDown)
        {
             this.play({key: PLAYER_ANIMATION_KEYS.IDLE_DOWN, repeat: -1}, true);
        }

        if(controls.isLeftDown)
        {
            this.setFlipX(true);
             this.play({key: PLAYER_ANIMATION_KEYS.IDLE_SIDE, repeat: -1}, true);
        } else if(controls.isRightDown)
        {
            this.setFlipX(false);
             this.play({key: PLAYER_ANIMATION_KEYS.IDLE_SIDE, repeat: -1}, true);
        }
    }

}
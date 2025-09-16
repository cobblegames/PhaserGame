import * as Phaser from 'phaser';
import { Position } from '../../../types';
import { ASSET_KEYS } from '../../../assets';
import { InteractiveObjectComponent } from '../interactive-object-component';
import { INTERACTIVE_OBJECT_TYPE } from '../../../common';

type PotConfig =
{
    scene: Phaser.Scene;
    position: Position;
}

export class Pot extends Phaser.Physics.Arcade.Sprite
{
    #position: Position;

    constructor(config: PotConfig)
    {
        const {scene, position} = config;
        super(scene,position.x, position.y, ASSET_KEYS.POT,0);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0,1).setImmovable(true);
        this.#position = {x: position.x, y: position.y };

        new InteractiveObjectComponent(this, INTERACTIVE_OBJECT_TYPE.PICKUP);



    }

} 
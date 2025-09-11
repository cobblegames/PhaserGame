import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { Player } from '../game-objects/player/player';
import { KeyboardComponent } from '../common/components/input/keyboard-component';
import { Spider } from '../common/components/game-object/enemies/spider';
import { Wisp } from '../common/components/game-object/enemies/wisp';
import { CharacterGameObject } from '../common/components/game-object/common/character-game-object';
import { CHEST_STATE, DIRECTION } from '../common/common';
import { Direction } from '../common/types';
import { PLAYER_START_MAX_HEALTH } from '../common/config';
import { Pot } from '../common/components/game-object/objects/pot';
import { Chest } from '../common/components/game-object/objects/chest';

export class GameScene extends Phaser.Scene 
{
  #controls!: KeyboardComponent;
  #player!: Player;
  #enemyGroup!: Phaser.GameObjects.Group;
  #blockingGroup!: Phaser.GameObjects.Group;

constructor() {
    super({
      key: SCENE_KEYS.GAME_SCENE,
    });
  }

  public create(): void
   {
    if(!this.input.keyboard)
    {
      console.warn('Phaser keyboard plugin is not configured properly');
      return;
    }

    this.#controls = new KeyboardComponent(this.input.keyboard);  
    
    this.add
    .text(this.scale.width / 2, this.scale.height / 2, 'Game Scene 2', { fontFamily: ASSET_KEYS.FONT_PRESS_START_2P })
    .setOrigin(0.5);

    
    this.#player = new Player
    (
      {
        scene: this,
        position: {x: this.scale.width/2, y: this.scale.height/2},
        controls: this.#controls,
        maxLife: PLAYER_START_MAX_HEALTH,
        currentLife: PLAYER_START_MAX_HEALTH,
      }
    );

    this.#enemyGroup = this.add.group
    (
      [
        new Spider
          (
            {
                scene: this,
                position: {x: this.scale.width/2, y: this.scale.height/2+50},    
            }
          )
          ,
        new Wisp
            (
              {
                  scene: this,
                  position: {x: this.scale.width/2, y: this.scale.height/2-50},    
              }
            )
      ],
        {
          runChildUpdate: true,
        }      
    );
  
    this.#blockingGroup = this.add.group
    (
      [
        new Pot
            (
              {
                scene: this,
                position: {x: this.scale.width/2+90, y: this.scale.height/2},
              }
            ),
        new Chest
        (
          {
            scene: this,
            position: {x: this.scale.width/2-90, y: this.scale.height/2},
            requiresBossKey: false,
          
          }
        ),
        new Chest
            (
              {
                scene: this,
                position: {x: this.scale.width/2-90, y: this.scale.height/2 -80},
                requiresBossKey: true,
              
              }
            ),
      ]
    );

    
    this.#registerColliders();
  }

  #registerColliders(): void
  {
     this.#enemyGroup.getChildren().forEach((enemy) =>
      {
        const enemyGameObject = enemy as CharacterGameObject;
        enemyGameObject.setCollideWorldBounds(true);
      });

      this.physics.add.overlap(this.#player, this.#enemyGroup, (player, enemy) =>
        {
          this.#player.hit(DIRECTION.DOWN, 1);
          const enemyGameObject = enemy as CharacterGameObject;
       
          enemyGameObject.hit(this.#player.direction,1);
        });
        
        this.physics.add.collider(this.#player, this.#blockingGroup, (player, gameObject) => {})
        this.physics.add.collider(this.#enemyGroup,this.#blockingGroup,(enemy, gameObject) => {});
  }

  
}

import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";
import * as Phaser from "phaser";

export class BounceMoveState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.BOUNCE_MOVE_STATE, gameObject);
    }
 
    public onEnter(): void
    {

      this._gameObject.animationComponent.playAnimation(`IDLE_${this._gameObject.direction}`);
      const speed = this._gameObject.speed;

        const randomDirection = Phaser.Math.Between(0, 3);
        if(randomDirection === 0)
        {
            this._gameObject.setVelocity(speed, speed * -1);
        }else if(randomDirection === 1)
        {
            this._gameObject.setVelocity(speed, speed);
        }else if(randomDirection === 2)
        {
            this._gameObject.setVelocity(speed * -1, speed);
        }else
        {
            this._gameObject.setVelocity(speed * -1, speed *-1);
        }

        this._gameObject.setBounce(1);
    }


}
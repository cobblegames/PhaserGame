import { BaseCharacterState } from "./base-character-state";

import { CHARACTER_STATES } from "./character-states";

import { isArcadePhysicsBody } from "../../../../utils";
import { Direction } from "../../../../types";
import { DIRECTION } from "../../../../common";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";


export class MoveState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.MOVE_STATE, gameObject);
    }
 
    

    public onUpdate(): void
    {
        const controls = this._gameObject.controls;

        if(!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown)
        {
            this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);            
        }

        if(controls.isUpDown)
        {  
            this.#updateDirection(DIRECTION.UP);
            this.#updateVelocity(false, -1);
             
        } else if(controls.isDownDown)
        {
            this.#updateDirection(DIRECTION.DOWN);
            this.#updateVelocity(false, 1);
             
        }else
        {
            this.#updateVelocity(false,0);
        }

        const isMovingVertically = controls.isDownDown || controls.isUpDown;
        if(controls.isLeftDown)
        {
            this._gameObject.setFlipX(true);
            
            if(!isMovingVertically)
            {
                this.#updateDirection(DIRECTION.LEFT);                
            }
            this.#updateVelocity(true, -1);
            
             
             
        } else if(controls.isRightDown)
        {
            this._gameObject.setFlipX(false);
            
            if(!isMovingVertically)
            {
                this.#updateDirection(DIRECTION.RIGHT);
            }             
            this.#updateVelocity(true, 1);
            
        }else
        {
            this.#updateVelocity(true,0);
        }

        

        this.#normalizeVelocity();
    }

    #updateVelocity(isX: boolean, value: number) : void
    {
        if(!isArcadePhysicsBody(this._gameObject.body))
        {
            return;
        }

        if(isX)
        {
            this._gameObject.body.velocity.x = value;
            return;
        }
        this._gameObject.body.velocity.y = value; 
    }

    #normalizeVelocity() : void 
    {
        if(!isArcadePhysicsBody(this._gameObject.body))
        {
            return;
        }

        this._gameObject.body.velocity.normalize().scale(this._gameObject.speed);

    }

    #updateDirection(direction: Direction) : void
    {
      this._gameObject.direction = direction;
      this._gameObject.animationComponent.playAnimation(`WALK_${this._gameObject.direction}`);     
    } 

}
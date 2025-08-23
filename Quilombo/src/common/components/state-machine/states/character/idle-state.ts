import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { isArcadePhysicsBody } from "../../../../utils";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";


export class IdleState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.IDLE_STATE, gameObject);
    }
 
    public onEnter(): void
    {

      this._gameObject.animationComponent.playAnimation(`IDLE_${this._gameObject.direction}`);
      if(isArcadePhysicsBody(this._gameObject.body))
       {
            this._gameObject.body.velocity.x = 0;
            this._gameObject.body.velocity.y = 0;
       }
    }

    public onUpdate(): void
    {
        const controls = this._gameObject.controls;
        
      if(!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown)
        {
          return;
        }

        this._stateMachine.setState(CHARACTER_STATES.MOVE_STATE);
    }
}
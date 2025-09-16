import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { isArcadePhysicsBody } from "../../../../utils";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";


export class LiftState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.LIFT_STATE, gameObject);
    }
 
    public onEnter(): void
    {

     
      if(isArcadePhysicsBody(this._gameObject.body))
       {
            this._gameObject.body.velocity.x = 0;
            this._gameObject.body.velocity.y = 0;
       }

        this._gameObject.animationComponent.playAnimation(`LIFT_${this._gameObject.direction}`);
    }

    public onUpdate(): void
    {
        if(this._gameObject.animationComponent.isAnimationPlaying())
        {
            return;
        }

        this._stateMachine.setState(CHARACTER_STATES.IDLE_HOLDING_STATE);
    }
}
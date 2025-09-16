import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { isArcadePhysicsBody } from "../../../../utils";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";
import { Chest } from "../../../game-object/objects/chest";


export class OpenChestState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.OPEN_CHEST_STATE, gameObject);
    }
 
    public onEnter(args: unknown[]): void
    {
        const chest = args[0] as Chest;
        console.log(chest);
      
      if(isArcadePhysicsBody(this._gameObject.body))
       {
            this._gameObject.body.velocity.x = 0;
            this._gameObject.body.velocity.y = 0;
       }

       this._gameObject.animationComponent.playAnimation(`LIFT_${this._gameObject.direction}`,()=>
        {
            this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);            
        });
    }

    
}
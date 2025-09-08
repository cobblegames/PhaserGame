import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { isArcadePhysicsBody } from "../../../../utils";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";


export class DeathState extends BaseCharacterState
{
    constructor(gameObject: CharacterGameObject) 
    {
        super(CHARACTER_STATES.DEATH_STATE, gameObject);
    }
 
    public onEnter(): void
    {
        if(isArcadePhysicsBody(this._gameObject.body))
            {
                    this._gameObject.body.velocity.x = 0;
                    this._gameObject.body.velocity.y = 0;
            }
    }

   
}
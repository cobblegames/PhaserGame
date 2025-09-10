import { BaseCharacterState } from "./base-character-state";
import { CHARACTER_STATES } from "./character-states";
import { exhaustiveGuard, isArcadePhysicsBody } from "../../../../utils";
import { CharacterGameObject } from "../../../game-object/common/character-game-object";
import { DIRECTION } from "../../../../common";
import { Direction } from "../../../../types";
import { PLAYER_HURT_PUSHBACK_DELAY } from "../../../../config";
import { CHARACTER_ANIMATIONS } from "../../../../assets";


export class HurtState extends BaseCharacterState
{

    #hurtPushBackSpeed: number;
    #onHurtCallback: () => void;
    #nextState: string;
    constructor
    (
        gameObject: CharacterGameObject,
        hurtPushBackSpeed: number,
        onHurtCallback: () => void = () => undefined,
        nextState: string = CHARACTER_STATES.IDLE_STATE,
    ) 
    {
        super(CHARACTER_STATES.HURT_STATE, gameObject);
        this.#hurtPushBackSpeed = hurtPushBackSpeed;
        this.#onHurtCallback = onHurtCallback;
        this.#nextState = nextState;
    }
 
    public onEnter(args: unknown[]): void 
    {
        const attackDirection = args[0] as Direction;
        if(isArcadePhysicsBody(this._gameObject.body))
       {

            const body = this._gameObject.body;
            body.velocity.x = 0;
            body.velocity.y = 0;

            switch(attackDirection)
            {
                case DIRECTION.DOWN:
                    body.velocity.y = this.#hurtPushBackSpeed;
                    break;
                case DIRECTION.UP:
                    body.velocity.y = -this.#hurtPushBackSpeed;
                    break;
                case DIRECTION.LEFT:
                    body.velocity.x = -this.#hurtPushBackSpeed;
                    break;
                case DIRECTION.RIGHT:
                    body.velocity.x = this.#hurtPushBackSpeed;
                    break;
                default:
                        exhaustiveGuard(attackDirection);
                         
            }

            this._gameObject.scene.time.delayedCall
            (
                PLAYER_HURT_PUSHBACK_DELAY, () => 
                {
                    body.velocity.x = 0;
                    body.velocity.y = 0;
                }
            );
       }

       this._gameObject.invulnerableComponent.invulnerable = true;
       this.#onHurtCallback();

       this._gameObject.animationComponent.playAnimation
       (
        CHARACTER_ANIMATIONS.HURT_DOWN, 
        () => 
            {
                this.#transition();
            }  
        );
    }

    #transition() : void
    {
        this._gameObject.scene.time.delayedCall
            (
                this._gameObject.invulnerableComponent.invulnerableAfterHitAnimationDuration, 
                () => 
                    {
                        this._gameObject.invulnerableComponent.invulnerable = false;
                    
                    },
            );
            
        this._stateMachine.setState(this.#nextState);
    }

}
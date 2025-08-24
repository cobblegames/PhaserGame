
import { GameObject } from "../../types";
import { BaseGameObjectComponent } from "./base-game-object-component";

export class InvulnerableComponent extends BaseGameObjectComponent
{
    #invulnerable: boolean;
    #invulnerableAfterHitAnimationDuration: number; // milliseconds

    constructor(gameObject: GameObject, invulnerable = false, invulnerableAfterHitAnimationDuration = 0)
    {
        super(gameObject);
        this.#invulnerable = invulnerable;
        this.#invulnerableAfterHitAnimationDuration = invulnerableAfterHitAnimationDuration;
    }

    get invulnerable(): boolean
    {
        return this.#invulnerable;
    }
     
    get invulnerableAfterHitAnimationDuration(): number
    {
        return this.#invulnerableAfterHitAnimationDuration;
    }

    set invulnerable(value: boolean)
    {
        this.#invulnerable = value;
    }
}
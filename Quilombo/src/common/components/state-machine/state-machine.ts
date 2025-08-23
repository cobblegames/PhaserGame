import { ENABLE_LOGGING } from "../../config";
import * as Phaser from "phaser";

export interface State
{
    stateMachine: StateMachine;
    name: string;
    onEnter?: (...args: unknown[]) => void;
    onUpdate?: () => void;
}

export class StateMachine
{
    #id : string;
    #states: Map<string, State>;
    #currentState: State | undefined;
    #isChangingState: boolean;
    #changeStateQueue: {state: string, args: unknown[]}[];

    constructor(id?: string)
    {
        if(id == undefined)
        {
            this.#id = Phaser.Math.RND.uuid();
        }else
        {
            this.#id = id;
        }

        this.#isChangingState = false;
        this.#changeStateQueue = [];
        this.#currentState = undefined;
        this.#states = new Map();
    }

public setState(name: string, ...args: unknown[]): void
    {
        const methodName = 'setState';
        if(!this.#states.has(name))
        {
            console.warn(`StateMachine[${this.#id}]::${methodName} - State ${name} does not exist`);
            return;
        }

        if(this.#isCurrentState(name))
        {
            return;
        }

        if(this.#isChangingState)
        {
            this.#changeStateQueue.push({state: name, args});
            return;
        }

        this.#isChangingState = true;
        this.#log(methodName, `change from ${this.#currentState?.name ?? 'none'} to ${name}`);
        this.#currentState = this.#states.get(name);

        if(this.#currentState?.onEnter)
        {
            this.#currentState.onEnter(args);
        }

        this.#isChangingState = false;
    }

    public update(): void
    {

        const queuedState = this.#changeStateQueue.shift();
        if(queuedState!==undefined)
        {
            this.setState(queuedState.state, queuedState.args);
            return;
        }

        if(this.#currentState && this.#currentState?.onUpdate)
        {
            this.#currentState.onUpdate();
        }

        
    }

    public addState(state: State): void
    {
        state.stateMachine = this;
        this.#states.set(state.name, state);
    }
    #isCurrentState(name: string): boolean
    {
        if(!this.#currentState)
        {
            return false;
        }

        return this.#currentState.name === name;
    } 

    #log(methodName: string, message: string): void
    {
        if(!ENABLE_LOGGING)
        {
            return;
        }
        console.log(`StateMachine[${this.#id}]::${methodName} - ${message}`);
    }
}
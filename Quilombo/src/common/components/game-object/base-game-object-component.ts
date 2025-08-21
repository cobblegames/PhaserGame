import * as Phaser from 'phaser';
import { GameObject } from "../../types";

export class  BaseGameObjectComponent
{
    protected scene: Phaser.Scene;
    protected gameObject: GameObject;

    constructor(gameObject: GameObject)
    {
        this.scene = gameObject.scene;
        this.gameObject = gameObject;
        this.assignComponentToObject(gameObject);
    }

    static getComponent<T>(gameObject: GameObject)
    {
        return gameObject[`_${this.name}`] as T;
    }

    static removeComponent(gameObject: GameObject) : void
    {
        delete gameObject[`_${this.name}`];
    }


    protected assignComponentToObject(object: GameObject) : void 
    {
        object[`_${this.constructor.name}`] = this;
    }
}
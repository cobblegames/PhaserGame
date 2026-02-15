import * as Phaser from 'phaser';
import * as CONFIG from '../common/config';
import { ASSET_KEYS } from '../common/assets';

export class TouchButton {
  #scene: Phaser.Scene;
  #graphics: Phaser.GameObjects.Graphics;
  #label: Phaser.GameObjects.Text;
  #x: number;
  #y: number;
  #radius: number;
  #isPressed: boolean = false;
  #pointerId: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, radius: number) {
    this.#scene = scene;
    this.#x = x;
    this.#y = y;
    this.#radius = radius;

    // Create graphics for button circle
    this.#graphics = this.#scene.add.graphics();
    this.#graphics.setDepth(1000);

    // Create text label
    this.#label = this.#scene.add.text(x, y, label, {
      fontFamily: ASSET_KEYS.FONT_PRESS_START_2P,
      fontSize: '8px',
      color: '#FFFFFF',
    });
    this.#label.setOrigin(0.5, 0.5);
    this.#label.setDepth(1001);

    // Draw initial state (not pressed)
    this.#draw(false);
  }

  public setPressed(isPressed: boolean, pointerId: number | null = null): void {
    this.#isPressed = isPressed;
    this.#pointerId = pointerId;
    this.#draw(isPressed);
  }

  public isPressed(): boolean {
    return this.#isPressed;
  }

  public containsPoint(x: number, y: number): boolean {
    const dx = x - this.#x;
    const dy = y - this.#y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.#radius * this.#radius;
  }

  public get pointerId(): number | null {
    return this.#pointerId;
  }

  public setVisible(visible: boolean): void {
    this.#graphics.setVisible(visible);
    this.#label.setVisible(visible);
  }

  public destroy(): void {
    this.#graphics.destroy();
    this.#label.destroy();
  }

  #draw(pressed: boolean): void {
    this.#graphics.clear();
    const alpha = pressed ? CONFIG.TOUCH_BUTTON_ALPHA_PRESSED : CONFIG.TOUCH_BUTTON_ALPHA_NORMAL;
    this.#graphics.fillStyle(0xffffff, alpha);
    this.#graphics.fillCircle(this.#x, this.#y, this.#radius);
  }
}

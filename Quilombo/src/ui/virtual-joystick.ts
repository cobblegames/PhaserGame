import * as Phaser from 'phaser';
import * as CONFIG from '../common/config';

export class VirtualJoystick {
  #scene: Phaser.Scene;
  #base: Phaser.GameObjects.Graphics;
  #stick: Phaser.GameObjects.Graphics;
  #isActive: boolean = false;
  #pointerId: number | null = null;
  #centerX: number = 0;
  #centerY: number = 0;
  #currentAngle: number = 0;
  #currentDistance: number = 0;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;

    // Create graphics objects for joystick
    this.#base = this.#scene.add.graphics();
    this.#stick = this.#scene.add.graphics();

    // Set depth to render on top of game elements
    this.#base.setDepth(1000);
    this.#stick.setDepth(1001);

    // Initially hidden
    this.#base.setVisible(false);
    this.#stick.setVisible(false);
  }

  public show(x: number, y: number, pointerId: number): void {
    this.#isActive = true;
    this.#pointerId = pointerId;
    this.#centerX = x;
    this.#centerY = y;

    // Draw base circle
    this.#base.clear();
    this.#base.fillStyle(0x000000, CONFIG.TOUCH_BUTTON_ALPHA_NORMAL);
    this.#base.fillCircle(x, y, CONFIG.TOUCH_JOYSTICK_BASE_RADIUS);
    this.#base.setVisible(true);

    // Draw stick at center initially
    this.#stick.clear();
    this.#stick.fillStyle(0xffffff, CONFIG.TOUCH_BUTTON_ALPHA_PRESSED);
    this.#stick.fillCircle(x, y, CONFIG.TOUCH_JOYSTICK_STICK_RADIUS);
    this.#stick.setVisible(true);

    this.#currentDistance = 0;
    this.#currentAngle = 0;
  }

  public update(x: number, y: number): void {
    if (!this.#isActive) {
      return;
    }

    // Calculate offset from center
    const offsetX = x - this.#centerX;
    const offsetY = y - this.#centerY;

    // Calculate distance and angle
    this.#currentDistance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    this.#currentAngle = Math.atan2(offsetY, offsetX);

    // Clamp distance to max
    const clampedDistance = Math.min(this.#currentDistance, CONFIG.TOUCH_JOYSTICK_MAX_DISTANCE);

    // Calculate stick position
    const stickX = this.#centerX + Math.cos(this.#currentAngle) * clampedDistance;
    const stickY = this.#centerY + Math.sin(this.#currentAngle) * clampedDistance;

    // Redraw stick at new position
    this.#stick.clear();
    this.#stick.fillStyle(0xffffff, CONFIG.TOUCH_BUTTON_ALPHA_PRESSED);
    this.#stick.fillCircle(stickX, stickY, CONFIG.TOUCH_JOYSTICK_STICK_RADIUS);
  }

  public hide(): void {
    this.#isActive = false;
    this.#pointerId = null;
    this.#base.setVisible(false);
    this.#stick.setVisible(false);
    this.#currentDistance = 0;
    this.#currentAngle = 0;
  }

  public getInput(): { up: boolean; down: boolean; left: boolean; right: boolean } {
    if (!this.#isActive || this.#currentDistance < CONFIG.TOUCH_JOYSTICK_DEAD_ZONE) {
      return { up: false, down: false, left: false, right: false };
    }

    // Convert angle to degrees for easier calculation
    const degrees = (this.#currentAngle * 180) / Math.PI;
    const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;

    // 8-directional input based on angle sectors
    const up = normalizedDegrees >= 45 && normalizedDegrees <= 135;
    const down = normalizedDegrees >= 225 && normalizedDegrees <= 315;
    const right = normalizedDegrees <= 45 || normalizedDegrees >= 315;
    const left = normalizedDegrees >= 135 && normalizedDegrees <= 225;

    return { up, down, left, right };
  }

  public get pointerId(): number | null {
    return this.#pointerId;
  }

  public destroy(): void {
    this.#base.destroy();
    this.#stick.destroy();
  }
}

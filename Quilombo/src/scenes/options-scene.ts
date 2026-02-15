import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { KeyboardComponent } from '../components/input/keyboard-component';
import { DataManager } from '../common/data-manager';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { CUSTOM_EVENTS, EVENT_BUS } from '../common/event-bus';

export class OptionsScene extends Phaser.Scene {
  #menuContainer!: Phaser.GameObjects.Container;
  #cursorGameObject!: Phaser.GameObjects.Image;
  #controls!: KeyboardComponent;
  #selectedMenuOptionIndex!: number;
  #touchControlsText!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: SCENE_KEYS.OPTIONS_SCENE,
    });
  }

  public create(): void {
    if (!this.input.keyboard) {
      return;
    }

    // Title
    this.add.text(this.scale.width / 2, 100, 'OPTIONS', DEFAULT_UI_TEXT_STYLE).setOrigin(0.5);

    // Create touch controls toggle text
    const touchEnabled = DataManager.instance.touchControlsEnabled;
    const touchControlsLabel = `Touch Controls: ${touchEnabled ? 'ON' : 'OFF'}`;

    // Menu container
    this.#menuContainer = this.add.container(32, 142, [
      this.add.image(0, 0, ASSET_KEYS.UI_DIALOG, 0).setOrigin(0),
    ]);

    // Touch controls option text
    this.#touchControlsText = this.add.text(32, 16, touchControlsLabel, DEFAULT_UI_TEXT_STYLE).setOrigin(0);
    this.#menuContainer.add(this.#touchControlsText);

    // Back button
    this.#menuContainer.add(this.add.text(32, 32, 'Back', DEFAULT_UI_TEXT_STYLE).setOrigin(0));

    // Cursor
    this.#cursorGameObject = this.add.image(20, 14, ASSET_KEYS.UI_CURSOR, 0).setOrigin(0);
    this.#menuContainer.add(this.#cursorGameObject);

    this.#controls = new KeyboardComponent(this.input.keyboard);
    this.#selectedMenuOptionIndex = 0;
  }

  public update(): void {
    // Handle selection
    if (
      this.#controls.isActionKeyJustDown ||
      this.#controls.isAttackKeyJustDown ||
      this.#controls.isEnterKeyJustDown
    ) {
      switch (this.#selectedMenuOptionIndex) {
        case 0:
          // Toggle touch controls
          this.#toggleTouchControls();
          return;

        case 1:
          // Back to start menu
          this.scene.start(SCENE_KEYS.START_SCENE);
          return;
      }
    }

    // Handle navigation
    if (this.#controls.isUpJustDown) {
      this.#selectedMenuOptionIndex -= 1;
      if (this.#selectedMenuOptionIndex < 0) {
        this.#selectedMenuOptionIndex = 0;
      }
    } else if (this.#controls.isDownJustDown) {
      this.#selectedMenuOptionIndex += 1;
      if (this.#selectedMenuOptionIndex > 1) {
        this.#selectedMenuOptionIndex = 1;
      }
    } else {
      return;
    }

    // Update cursor position
    this.#cursorGameObject.setY(14 + this.#selectedMenuOptionIndex * 16);
  }

  #toggleTouchControls(): void {
    // Toggle the setting
    const newValue = !DataManager.instance.touchControlsEnabled;
    DataManager.instance.touchControlsEnabled = newValue;

    // Update the text
    this.#touchControlsText.setText(`Touch Controls: ${newValue ? 'ON' : 'OFF'}`);

    // Emit event so active game scenes can respond
    EVENT_BUS.emit(CUSTOM_EVENTS.TOUCH_CONTROLS_TOGGLED, newValue);
  }
}

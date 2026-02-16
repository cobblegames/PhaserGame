import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { KeyboardComponent } from '../components/input/keyboard-component';
import { DataManager } from '../common/data-manager';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { LevelData } from '../common/types';

export class GameOverScene extends Phaser.Scene {
  #menuContainer!: Phaser.GameObjects.Container;
  #cursorGameObject!: Phaser.GameObjects.Image;
  #controls!: KeyboardComponent;
  #selectedMenuOptionIndex!: number;
  #continueText!: Phaser.GameObjects.Text;
  #quitText!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_OVER_SCENE,
    });
  }

  public create(): void {
    if (!this.input.keyboard) {
      return;
    }

    this.add.text(this.scale.width / 2, 100, 'Game Over', DEFAULT_UI_TEXT_STYLE).setOrigin(0.5);

    // Create menu items as separate properties for touch interaction
    this.#continueText = this.add.text(32, 16, 'Continue', DEFAULT_UI_TEXT_STYLE).setOrigin(0);
    this.#quitText = this.add.text(32, 32, 'Quit', DEFAULT_UI_TEXT_STYLE).setOrigin(0);

    this.#menuContainer = this.add.container(32, 142, [
      this.add.image(0, 0, ASSET_KEYS.UI_DIALOG, 0).setOrigin(0),
      this.#continueText,
      this.#quitText,
    ]);
    this.#cursorGameObject = this.add.image(20, 14, ASSET_KEYS.UI_CURSOR, 0).setOrigin(0);
    this.#menuContainer.add(this.#cursorGameObject);

    // Make menu items interactive for touch/mouse
    this.#setupTouchControls();

    this.#controls = new KeyboardComponent(this.input.keyboard);
    this.#selectedMenuOptionIndex = 0;
    DataManager.instance.resetPlayerHealthToMin();
  }

  #setupTouchControls(): void {
    // Make text items interactive
    this.#continueText.setInteractive({ useHandCursor: true });
    this.#quitText.setInteractive({ useHandCursor: true });

    // Add hover effects
    this.#continueText.on('pointerover', () => {
      this.#selectedMenuOptionIndex = 0;
      this.#cursorGameObject.setY(14);
      this.#continueText.setAlpha(0.8);
    });
    this.#continueText.on('pointerout', () => {
      this.#continueText.setAlpha(1);
    });

    this.#quitText.on('pointerover', () => {
      this.#selectedMenuOptionIndex = 1;
      this.#cursorGameObject.setY(30);
      this.#quitText.setAlpha(0.8);
    });
    this.#quitText.on('pointerout', () => {
      this.#quitText.setAlpha(1);
    });

    // Add click/tap handlers
    this.#continueText.on('pointerdown', () => {
      this.#continueText.setAlpha(0.6);
    });
    this.#continueText.on('pointerup', () => {
      this.#continueText.setAlpha(1);
      this.#continueGame();
    });

    this.#quitText.on('pointerdown', () => {
      this.#quitText.setAlpha(0.6);
    });
    this.#quitText.on('pointerup', () => {
      this.#quitText.setAlpha(1);
      this.#quitToMenu();
    });
  }

  #continueGame(): void {
    // Pass scene data so GameScene can properly initialize
    const sceneData: LevelData = {
      level: DataManager.instance.data.currentArea.name,
      roomId: DataManager.instance.data.currentArea.startRoomId,
      doorId: DataManager.instance.data.currentArea.startDoorId,
    };
    this.scene.start(SCENE_KEYS.GAME_SCENE, sceneData);
  }

  #quitToMenu(): void {
    // Take the player back to the title screen
    this.scene.start(SCENE_KEYS.START_SCENE);
  }

  public update(): void {
    if (this.#controls.isActionKeyJustDown || this.#controls.isAttackKeyJustDown || this.#controls.isEnterKeyJustDown) {
      if (this.#selectedMenuOptionIndex === 1) {
        this.#quitToMenu();
        return;
      }

      this.#continueGame();
      return;
    }

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

    this.#cursorGameObject.setY(14 + this.#selectedMenuOptionIndex * 16);
  }
}

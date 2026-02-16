import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { KeyboardComponent } from '../components/input/keyboard-component';
import { DataManager } from '../common/data-manager';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { LevelData } from '../common/types';

export class StartScene extends Phaser.Scene {
  #menuContainer!: Phaser.GameObjects.Container;
  #cursorGameObject!: Phaser.GameObjects.Image;
  #controls!: KeyboardComponent;
  #selectedMenuOptionIndex!: number;
  #startGameText!: Phaser.GameObjects.Text;
  #optionsText!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: SCENE_KEYS.START_SCENE,
    });
  }

   #sceneData: LevelData = {
          level: DataManager.instance.data.currentArea.name,
          roomId: DataManager.instance.data.currentArea.startRoomId,
          doorId: DataManager.instance.data.currentArea.startDoorId,
        };

  public create(): void {
    if (!this.input.keyboard) {
      return;



    }

    this.add.image(this.scale.width / 2, 50, ASSET_KEYS.LOGO_GAME).setOrigin(0.5).setScale(0.1);

    // Create menu items as separate properties for touch interaction
    this.#startGameText = this.add.text(32, 16, 'Start New Game', DEFAULT_UI_TEXT_STYLE).setOrigin(0);
    this.#optionsText = this.add.text(32, 32, 'Options', DEFAULT_UI_TEXT_STYLE).setOrigin(0);

    this.#menuContainer = this.add.container(32, 142, [
      this.add.image(0, 0, ASSET_KEYS.UI_DIALOG, 0).setOrigin(0),
      this.#startGameText,
      this.#optionsText,
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
    this.#startGameText.setInteractive({ useHandCursor: true });
    this.#optionsText.setInteractive({ useHandCursor: true });

    // Add hover effects
    this.#startGameText.on('pointerover', () => {
      this.#selectedMenuOptionIndex = 0;
      this.#cursorGameObject.setY(14);
      this.#startGameText.setAlpha(0.8);
    });
    this.#startGameText.on('pointerout', () => {
      this.#startGameText.setAlpha(1);
    });

    this.#optionsText.on('pointerover', () => {
      this.#selectedMenuOptionIndex = 1;
      this.#cursorGameObject.setY(30);
      this.#optionsText.setAlpha(0.8);
    });
    this.#optionsText.on('pointerout', () => {
      this.#optionsText.setAlpha(1);
    });

    // Add click/tap handlers
    this.#startGameText.on('pointerdown', () => {
      this.#startGameText.setAlpha(0.6);
    });
    this.#startGameText.on('pointerup', () => {
      this.#startGameText.setAlpha(1);
      this.#startGame();
    });

    this.#optionsText.on('pointerdown', () => {
      this.#optionsText.setAlpha(0.6);
    });
    this.#optionsText.on('pointerup', () => {
      this.#optionsText.setAlpha(1);
      this.#openOptions();
    });
  }

  #startGame(): void {
    console.log('Starting new game');
    this.scene.start(SCENE_KEYS.GAME_SCENE, this.#sceneData);
  }

  #openOptions(): void {
    this.scene.start(SCENE_KEYS.OPTIONS_SCENE);
  }

  public update(): void {
    if (this.#controls.isActionKeyJustDown || this.#controls.isAttackKeyJustDown || this.#controls.isEnterKeyJustDown)
      {

        switch (this.#selectedMenuOptionIndex)
        {

          case 0:
            this.#startGame();
            return;


          case 1:
            this.#openOptions();
            return;

        }
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

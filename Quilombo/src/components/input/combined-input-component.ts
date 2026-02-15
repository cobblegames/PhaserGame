import { InputComponent } from './input-component';
import { KeyboardComponent } from './keyboard-component';
import { TouchComponent } from './touch-component';

export class CombinedInputComponent extends InputComponent {
  #keyboardComponent: KeyboardComponent | undefined;
  #touchComponent: TouchComponent | undefined;

  constructor(keyboardComponent: KeyboardComponent, touchComponent: TouchComponent | undefined) {
    super();
    this.#keyboardComponent = keyboardComponent;
    this.#touchComponent = touchComponent;
  }

  get isUpDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    const keyboard = this.#keyboardComponent?.isUpDown || false;
    const touch = this.#touchComponent?.isUpDown || false;
    return keyboard || touch;
  }

  get isDownDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    const keyboard = this.#keyboardComponent?.isDownDown || false;
    const touch = this.#touchComponent?.isDownDown || false;
    return keyboard || touch;
  }

  get isLeftDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    const keyboard = this.#keyboardComponent?.isLeftDown || false;
    const touch = this.#touchComponent?.isLeftDown || false;
    return keyboard || touch;
  }

  get isRightDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    const keyboard = this.#keyboardComponent?.isRightDown || false;
    const touch = this.#touchComponent?.isRightDown || false;
    return keyboard || touch;
  }

  get isAttackKeyJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isAttackKeyJustDown || false;
    const touch = this.#touchComponent?.isAttackKeyJustDown || false;
    return keyboard || touch;
  }

  get isActionKeyJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isActionKeyJustDown || false;
    const touch = this.#touchComponent?.isActionKeyJustDown || false;
    return keyboard || touch;
  }

  get isSelectKeyJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isSelectKeyJustDown || false;
    const touch = this.#touchComponent?.isSelectKeyJustDown || false;
    return keyboard || touch;
  }

  get isEnterKeyJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isEnterKeyJustDown || false;
    const touch = this.#touchComponent?.isEnterKeyJustDown || false;
    return keyboard || touch;
  }

  get isUpJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isUpJustDown || false;
    const touch = this.#touchComponent?.isUpJustDown || false;
    return keyboard || touch;
  }

  get isDownJustDown(): boolean {
    const keyboard = this.#keyboardComponent?.isDownJustDown || false;
    const touch = this.#touchComponent?.isDownJustDown || false;
    return keyboard || touch;
  }

  public reset(): void {
    this.#keyboardComponent?.reset();
    this.#touchComponent?.reset();
  }
}

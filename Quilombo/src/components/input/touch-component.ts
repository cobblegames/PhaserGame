import { InputComponent } from './input-component';
import { VirtualJoystick } from '../../ui/virtual-joystick';
import { TouchButton } from '../../ui/touch-button';

export class TouchComponent extends InputComponent {
  #joystick: VirtualJoystick;
  #attackButton: TouchButton;
  #actionButton: TouchButton;
  #previousAttackState: boolean = false;
  #previousActionState: boolean = false;

  constructor(joystick: VirtualJoystick, attackButton: TouchButton, actionButton: TouchButton) {
    super();
    this.#joystick = joystick;
    this.#attackButton = attackButton;
    this.#actionButton = actionButton;
  }

  get isUpDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    return this.#joystick.getInput().up;
  }

  get isDownDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    return this.#joystick.getInput().down;
  }

  get isLeftDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    return this.#joystick.getInput().left;
  }

  get isRightDown(): boolean {
    if (this.isMovementLocked) {
      return false;
    }
    return this.#joystick.getInput().right;
  }

  get isAttackKeyJustDown(): boolean {
    const current = this.#attackButton.isPressed();
    const justPressed = current && !this.#previousAttackState;
    this.#previousAttackState = current;
    return justPressed;
  }

  get isActionKeyJustDown(): boolean {
    const current = this.#actionButton.isPressed();
    const justPressed = current && !this.#previousActionState;
    this.#previousActionState = current;
    return justPressed;
  }

  // Select and Enter keys are not used for touch controls
  get isSelectKeyJustDown(): boolean {
    return false;
  }

  get isEnterKeyJustDown(): boolean {
    return false;
  }

  public reset(): void {
    super.reset();
    this.#previousAttackState = false;
    this.#previousActionState = false;
  }
}

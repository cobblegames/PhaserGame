import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { VirtualJoystick } from '../ui/virtual-joystick';
import { TouchButton } from '../ui/touch-button';
import { TouchComponent } from '../components/input/touch-component';
import * as CONFIG from '../common/config';
import { CUSTOM_EVENTS, EVENT_BUS } from '../common/event-bus';

type PointerZone = 'joystick' | 'attack' | 'action';

export class TouchControlsScene extends Phaser.Scene {
  #joystick!: VirtualJoystick;
  #attackButton!: TouchButton;
  #actionButton!: TouchButton;
  #touchComponent!: TouchComponent;
  #activePointers: Map<number, PointerZone> = new Map();
  #pointersSetup: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.TOUCH_CONTROLS_SCENE });
  }

  create(): void {
    // Create joystick (only if not already created by lazy init)
    if (!this.#joystick) {
      this.#joystick = new VirtualJoystick(this);
    }

    // Create attack button (only if not already created)
    if (!this.#attackButton) {
      this.#attackButton = new TouchButton(
        this,
        CONFIG.TOUCH_BUTTON_ATTACK_X,
        CONFIG.TOUCH_BUTTON_ATTACK_Y,
        'Z',
        CONFIG.TOUCH_BUTTON_RADIUS,
      );
    }

    // Create action button (only if not already created)
    if (!this.#actionButton) {
      this.#actionButton = new TouchButton(
        this,
        CONFIG.TOUCH_BUTTON_ACTION_X,
        CONFIG.TOUCH_BUTTON_ACTION_Y,
        'X',
        CONFIG.TOUCH_BUTTON_RADIUS,
      );
    }

    // Create touch component (only if not already created)
    if (!this.#touchComponent) {
      this.#touchComponent = new TouchComponent(this.#joystick, this.#attackButton, this.#actionButton);
    }

    // Setup pointer handlers
    this.#setupPointerHandlers();

    // Listen for touch controls toggle event
    EVENT_BUS.on(CUSTOM_EVENTS.TOUCH_CONTROLS_TOGGLED, this.#onTouchControlsToggled, this);

    // Cleanup on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EVENT_BUS.off(CUSTOM_EVENTS.TOUCH_CONTROLS_TOGGLED, this.#onTouchControlsToggled, this);
      this.#joystick?.destroy();
      this.#attackButton?.destroy();
      this.#actionButton?.destroy();
      // Clear references so they can be recreated on restart
      this.#joystick = null as any;
      this.#attackButton = null as any;
      this.#actionButton = null as any;
      this.#touchComponent = null as any;
      this.#activePointers.clear();
      this.#pointersSetup = false;
    });
  }

  public getTouchComponent(): TouchComponent {
    if (!this.#touchComponent) {
      console.warn('TouchComponent not yet initialized - calling create() manually');
      // If create() hasn't been called yet, call it now
      // This ensures all components and handlers are properly set up
      this.create();
    }
    return this.#touchComponent;
  }

  #setupPointerHandlers(): void {
    // Only set up once to avoid duplicate handlers
    if (this.#pointersSetup) {
      return;
    }

    // Make sure input system is available
    if (!this.input) {
      console.warn('Input system not ready, cannot setup pointer handlers');
      return;
    }

    this.input.on('pointerdown', this.#onPointerDown, this);
    this.input.on('pointermove', this.#onPointerMove, this);
    this.input.on('pointerup', this.#onPointerUp, this);
    this.#pointersSetup = true;
  }

  #onPointerDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;

    // Determine which zone was touched
    if (x < CONFIG.TOUCH_JOYSTICK_ZONE_WIDTH) {
      // Left zone - joystick
      this.#activePointers.set(pointer.id, 'joystick');
      this.#joystick.show(x, y, pointer.id);
    } else if (this.#attackButton.containsPoint(x, y)) {
      // Attack button
      this.#activePointers.set(pointer.id, 'attack');
      this.#attackButton.setPressed(true, pointer.id);
    } else if (this.#actionButton.containsPoint(x, y)) {
      // Action button
      this.#activePointers.set(pointer.id, 'action');
      this.#actionButton.setPressed(true, pointer.id);
    }
  }

  #onPointerMove(pointer: Phaser.Input.Pointer): void {
    const zone = this.#activePointers.get(pointer.id);
    if (!zone) {
      return;
    }

    const x = pointer.x;
    const y = pointer.y;

    if (zone === 'joystick' && this.#joystick.pointerId === pointer.id) {
      this.#joystick.update(x, y);
    }
  }

  #onPointerUp(pointer: Phaser.Input.Pointer): void {
    const zone = this.#activePointers.get(pointer.id);
    if (!zone) {
      return;
    }

    // Clear the control for this pointer
    if (zone === 'joystick' && this.#joystick.pointerId === pointer.id) {
      this.#joystick.hide();
    } else if (zone === 'attack' && this.#attackButton.pointerId === pointer.id) {
      this.#attackButton.setPressed(false);
    } else if (zone === 'action' && this.#actionButton.pointerId === pointer.id) {
      this.#actionButton.setPressed(false);
    }

    this.#activePointers.delete(pointer.id);
  }

  #onTouchControlsToggled(enabled: boolean): void {
    // Show or hide all touch controls
    this.#attackButton.setVisible(enabled);
    this.#actionButton.setVisible(enabled);

    // If disabling, hide joystick and clear all active pointers
    if (!enabled) {
      this.#joystick.hide();
      this.#activePointers.clear();
      this.#attackButton.setPressed(false);
      this.#actionButton.setPressed(false);
    }
  }
}

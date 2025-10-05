import { INTERACTIVE_OBJECT_TYPE } from '../../../../common/common';
import { CHARACTER_STATES } from './character-states';
import { exhaustiveGuard } from '../../../../common/utils';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { CollidingObjectsComponent } from '../../../game-object/colliding-objects-component';
import { InteractiveObjectComponent } from '../../../game-object/interactive-object-component';
import { InputComponent } from '../../../input/input-component';
import { BaseMoveState } from './base-move-state';
import { WallDetectionComponent } from '../../../game-object/wall-detection-component';

export class MoveState extends BaseMoveState {
  #clingTimer: number = 0;
  #clingThreshold: number = 500; // 0.5 seconds in milliseconds
  #lastWallDirection: string | undefined;

  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.MOVE_STATE, gameObject, 'WALK');
  }

  public onUpdate(): void {
    const controls = this._gameObject.controls;

    // if attack key was pressed, attack with weapon
    if (controls.isAttackKeyJustDown) {
      this._stateMachine.setState(CHARACTER_STATES.ATTACK_STATE);
      return;
    }

    // if no input is provided transition back to idle state
    if (this.isNoInputMovement(controls)) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    // if we interacted with an object and switched states, stop processing
    if (this.#checkIfObjectWasInteractedWith(controls)) {
      return;
    }

    // Check if running into a wall - enter cling mode after threshold
    if (this.#checkForCling()) {
      return;
    }

    // handle character movement
    this.handleCharacterMovement();
  }

  public onExit(): void {
    // Reset cling timer when leaving move state
    this.#clingTimer = 0;
    this.#lastWallDirection = undefined;
  }

  #checkForCling(): boolean {
    const wallDetectionComponent = WallDetectionComponent.getComponent<WallDetectionComponent>(this._gameObject);
    if (!wallDetectionComponent) {
      return false;
    }

    const wallDirection = wallDetectionComponent.getWallDirection();

    if (wallDirection) {
      // Player is pressing against a wall
      if (this.#lastWallDirection === wallDirection) {
        // Same wall direction - increment timer
        this.#clingTimer += this._gameObject.scene.game.loop.delta;

        if (this.#clingTimer >= this.#clingThreshold) {
          // Timer threshold reached - enter cling state
          this._stateMachine.setState(CHARACTER_STATES.CLING_STATE, wallDirection);
          this.#clingTimer = 0;
          this.#lastWallDirection = undefined;
          return true;
        }
      } else {
        // Different wall direction - reset timer
        this.#clingTimer = 0;
        this.#lastWallDirection = wallDirection;
      }
    } else {
      // Not pressing against a wall - reset timer
      this.#clingTimer = 0;
      this.#lastWallDirection = undefined;
    }

    return false;
  }

  #checkIfObjectWasInteractedWith(controls: InputComponent): boolean {
    const collideComponent = CollidingObjectsComponent.getComponent<CollidingObjectsComponent>(this._gameObject);
    if (collideComponent === undefined || collideComponent.objects.length === 0) {
      return false;
    }

    const collisionObject = collideComponent.objects[0];
    const interactiveObjectComponent =
      InteractiveObjectComponent.getComponent<InteractiveObjectComponent>(collisionObject);
    if (interactiveObjectComponent === undefined) {
      return false;
    }

    if (!controls.isActionKeyJustDown) {
      return false;
    }

    // check if game object can be interacted with
    if (!interactiveObjectComponent.canInteractWith()) {
      return false;
    }
    interactiveObjectComponent.interact();

    // we can carry this item
    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.PICKUP) {
      this._stateMachine.setState(CHARACTER_STATES.LIFT_STATE, collisionObject);
      return true;
    }

    // we can open this item
    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.OPEN) {
      this._stateMachine.setState(CHARACTER_STATES.OPEN_CHEST_STATE, collisionObject);
      return true;
    }

    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.AUTO) {
      return false;
    }

    // we should never hit this code block
    exhaustiveGuard(interactiveObjectComponent.objectType);
  }
}

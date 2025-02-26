import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { isArcadePhysicsBody } from '../../../../common/utils';
import { Direction } from '../../../../common/types';
import { DIRECTION } from '../../../../common/common';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';

export class MoveState extends BaseCharacterState {
  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.MOVE_STATE, gameObject);
  }

  public onUpdate(): void {
    const controls = this._gameObject.controls;

    // if no input is provided transition back to idle state
    if (!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    // vertical movement
    if (controls.isUpDown) {
      this.#updateVelocity(false, -1);
      this.#updateDirection(DIRECTION.UP);
    } else if (controls.isDownDown) {
      this.#updateVelocity(false, 1);
      this.#updateDirection(DIRECTION.DOWN);
    } else {
      this.#updateVelocity(false, 0);
    }

    const isMovingVertically = controls.isDownDown || controls.isUpDown;
    // horizontal movement
    if (controls.isLeftDown) {
      this.#flip(true);
      this.#updateVelocity(true, -1);
      if (!isMovingVertically) {
        this.#updateDirection(DIRECTION.LEFT);
      }
    } else if (controls.isRightDown) {
      this.#flip(false);
      this.#updateVelocity(true, 1);
      if (!isMovingVertically) {
        this.#updateDirection(DIRECTION.RIGHT);
      }
    } else {
      this.#updateVelocity(true, 0);
    }

    this.#normalizeVelocity();
  }

  #flip(value: boolean): void {
    this._gameObject.setFlipX(value);
  }

  #updateVelocity(isX: boolean, value: number): void {
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }
    if (isX) {
      this._gameObject.body.velocity.x = value;
      return;
    }
    this._gameObject.body.velocity.y = value;
  }

  #normalizeVelocity(): void {
    // if the player is moving diagonally, the resultant vector will have a magnitude greater than the defined speed.
    // if we normalize the vector, this will make sure the magnitude matches defined speed
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }
    this._gameObject.body.velocity.normalize().scale(this._gameObject.speed);
  }

  #updateDirection(direction: Direction): void {
    this._gameObject.direction = direction;
    this._gameObject.animationComponent.playAnimation(`WALK_${this._gameObject.direction}`);
  }
}

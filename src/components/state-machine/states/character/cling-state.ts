import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { Direction } from '../../../../common/types';
import { isArcadePhysicsBody } from '../../../../common/utils';

export class ClingState extends BaseCharacterState {
  #wallDirection: Direction | undefined;

  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.CLING_STATE, gameObject);
  }

  public onEnter(...args: unknown[]): void {
    const wallDirection = args[0] as Direction | undefined;
    this.#wallDirection = wallDirection || this._gameObject.direction;

    // Face away from the wall (opposite direction)
    const oppositeDirection = this.#getOppositeDirection(this.#wallDirection);
    this._gameObject.direction = oppositeDirection;

    // Stop movement while keeping collision detection active
    if (isArcadePhysicsBody(this._gameObject.body)) {
      // Stop all velocity and acceleration
      this._gameObject.body.setVelocity(0, 0);
      this._gameObject.body.setAcceleration(0, 0);

      // Prevent physics system from updating position
      this._gameObject.body.moves = false;

      // Disable gravity effect
      this._gameObject.body.setAllowGravity(false);
    }

    // Stop animation and show idle frame facing away from wall
    this._gameObject.anims.stop();
    this._gameObject.animationComponent.playAnimation(`IDLE_${oppositeDirection}`);
  }

  #getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case 'UP':
        return 'DOWN';
      case 'DOWN':
        return 'UP';
      case 'LEFT':
        return 'RIGHT';
      case 'RIGHT':
        return 'LEFT';
    }
  }

  public onUpdate(): void {
    const controls = this._gameObject.controls;

    if (controls.isMovementLocked) {
      return;
    }

    // Exit cling if no movement input
    if (!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    // Exit cling if not pressing toward the wall anymore
    if (this.#wallDirection === 'LEFT' && !controls.isLeftDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
    if (this.#wallDirection === 'RIGHT' && !controls.isRightDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
    if (this.#wallDirection === 'UP' && !controls.isUpDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
    if (this.#wallDirection === 'DOWN' && !controls.isDownDown) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
  }

  public onExit(): void {
    this.#wallDirection = undefined;

    // Re-enable physics updates when leaving cling state
    if (isArcadePhysicsBody(this._gameObject.body)) {
      this._gameObject.body.moves = true;
      this._gameObject.body.setAllowGravity(true);
    }
  }
}

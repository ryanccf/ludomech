import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { Direction } from '../../../../common/types';
import { isArcadePhysicsBody } from '../../../../common/utils';
import { ASSET_KEYS } from '../../../../common/assets';

export class ClingState extends BaseCharacterState {
  #wallDirection: Direction | undefined;

  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.CLING_STATE, gameObject);
  }

  public onEnter(...args: unknown[]): void {
    console.log('[ClingState] Raw args:', args, 'args.length:', args.length, 'args[0]:', args[0]);
    // args[0] is an array, so we need to get the first element from that array
    const argsArray = args[0] as unknown[];
    const wallDirection = argsArray?.[0] as Direction | undefined;
    console.log('[ClingState] Extracted wallDirection:', wallDirection, 'type:', typeof wallDirection);
    this.#wallDirection = wallDirection || this._gameObject.direction;

    console.log('[ClingState] Entering cling state, wall direction:', this.#wallDirection);

    // Enable vertical sliding while keeping collision detection active
    if (isArcadePhysicsBody(this._gameObject.body)) {
      // Stop all velocity and acceleration initially
      this._gameObject.body.setVelocity(0, 0);
      this._gameObject.body.setAcceleration(0, 0);

      // Keep moves enabled so we can slide vertically along walls
      this._gameObject.body.moves = true;

      // Disable gravity effect so we don't fall off the wall
      this._gameObject.body.setAllowGravity(false);
    }

    // Stop any playing animation first
    this._gameObject.anims.stop();
    console.log('[ClingState] Stopped animations');

    // Debug: Check exact wall direction value and type
    console.log('[ClingState] wallDirection type:', typeof this.#wallDirection, 'value:', JSON.stringify(this.#wallDirection));
    console.log('[ClingState] Comparing to LEFT:', this.#wallDirection === 'LEFT', 'RIGHT:', this.#wallDirection === 'RIGHT');

    // Use wall-hug static frame for left/right walls
    if (this.#wallDirection === 'LEFT') {
      // Face RIGHT (away from left wall) - frame 114 naturally faces right, no flip needed
      console.log('[ClingState] LEFT wall - setting PLAYER texture, frame 114, flipX=false (face right)');
      this._gameObject.setTexture(ASSET_KEYS.PLAYER, 114);
      this._gameObject.setFlipX(false);
    } else if (this.#wallDirection === 'RIGHT') {
      // Face LEFT (away from right wall) - flip frame 114 to face left
      console.log('[ClingState] RIGHT wall - setting PLAYER texture, frame 114, flipX=true (face left)');
      this._gameObject.setTexture(ASSET_KEYS.PLAYER, 114);
      this._gameObject.setFlipX(true);
    } else {
      // For up/down walls, use regular idle
      console.log('[ClingState] UP/DOWN wall (or fallback) - using regular idle animation');
      console.log('[ClingState] wallDirection was:', this.#wallDirection);
      const oppositeDirection = this.#getOppositeDirection(this.#wallDirection);
      this._gameObject.direction = oppositeDirection;
      this._gameObject.setTexture(ASSET_KEYS.PLAYER);
      this._gameObject.animationComponent.playAnimation(`IDLE_${oppositeDirection}`);
    }

    console.log('[ClingState] Current texture:', this._gameObject.texture.key, 'frame:', this._gameObject.frame.name, 'flipX:', this._gameObject.flipX);
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

    // Exit if no movement input at all
    if (!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown) {
      console.log('[ClingState] No movement input, exiting to IDLE');
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    // Check if still pressing toward the wall
    const pressingTowardWall =
      (this.#wallDirection === 'LEFT' && controls.isLeftDown) ||
      (this.#wallDirection === 'RIGHT' && controls.isRightDown) ||
      (this.#wallDirection === 'UP' && controls.isUpDown) ||
      (this.#wallDirection === 'DOWN' && controls.isDownDown);

    if (!pressingTowardWall) {
      console.log('[ClingState] Not pressing toward wall anymore, exiting to IDLE');
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    // For LEFT/RIGHT walls, allow vertical sliding
    if (this.#wallDirection === 'LEFT' || this.#wallDirection === 'RIGHT') {
      if (isArcadePhysicsBody(this._gameObject.body)) {
        // Always lock horizontal movement to prevent sliding off wall
        this._gameObject.body.velocity.x = 0;

        // Allow vertical movement based on input
        if (controls.isUpDown) {
          this._gameObject.body.velocity.y = -this._gameObject.speed;
          console.log('[ClingState] Sliding up wall');
        } else if (controls.isDownDown) {
          this._gameObject.body.velocity.y = this._gameObject.speed;
          console.log('[ClingState] Sliding down wall');
        } else {
          this._gameObject.body.velocity.y = 0;
        }
      }
    }
    // For UP/DOWN walls, allow horizontal sliding
    else if (this.#wallDirection === 'UP' || this.#wallDirection === 'DOWN') {
      if (isArcadePhysicsBody(this._gameObject.body)) {
        // Always lock vertical movement to prevent sliding off wall
        this._gameObject.body.velocity.y = 0;

        // Allow horizontal movement based on input
        if (controls.isLeftDown) {
          this._gameObject.body.velocity.x = -this._gameObject.speed;
          console.log('[ClingState] Sliding left along ceiling/floor');
        } else if (controls.isRightDown) {
          this._gameObject.body.velocity.x = this._gameObject.speed;
          console.log('[ClingState] Sliding right along ceiling/floor');
        } else {
          this._gameObject.body.velocity.x = 0;
        }
      }
    }
  }

  public onExit(): void {
    console.log('[ClingState] Exiting cling state');
    this.#wallDirection = undefined;

    // Restore normal texture
    this._gameObject.setTexture(ASSET_KEYS.PLAYER);
    console.log('[ClingState] Restored PLAYER texture');

    // Re-enable physics updates and reset velocity when leaving cling state
    if (isArcadePhysicsBody(this._gameObject.body)) {
      // Stop all movement when exiting
      this._gameObject.body.setVelocity(0, 0);
      // Re-enable normal physics
      this._gameObject.body.moves = true;
      this._gameObject.body.setAllowGravity(true);
    }
  }
}

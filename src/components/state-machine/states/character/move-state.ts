import { INTERACTIVE_OBJECT_TYPE } from '../../../../common/common';
import { CHARACTER_STATES } from './character-states';
import { exhaustiveGuard, isArcadePhysicsBody } from '../../../../common/utils';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { CollidingObjectsComponent } from '../../../game-object/colliding-objects-component';
import { InteractiveObjectComponent } from '../../../game-object/interactive-object-component';
import { InputComponent } from '../../../input/input-component';
import { BaseMoveState } from './base-move-state';
import { WallDetectionComponent } from '../../../game-object/wall-detection-component';
import { Player } from '../../../../game-objects/player/player';
import { ASSET_KEYS } from '../../../../common/assets';

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

    // handle character movement (crawl or walk)
    if (this._gameObject instanceof Player && this._gameObject.isCrawling) {
      this.#handleCrawlMovement();
    } else {
      this.handleCharacterMovement();
    }
  }

  public onExit(): void {
    // Reset cling timer when leaving move state
    this.#clingTimer = 0;
    this.#lastWallDirection = undefined;
  }

  #checkForCling(): boolean {
    // Don't allow wall-hugging while crawling
    if (this._gameObject instanceof Player && this._gameObject.isCrawling) {
      return false;
    }

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
          console.log('[MoveState] Triggering cling state with wallDirection:', wallDirection, 'type:', typeof wallDirection);
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

    // we can carry this item - but NOT while crawling
    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.PICKUP) {
      if (this._gameObject instanceof Player && this._gameObject.isCrawling) {
        // Can't pick up pots while crawling
        return false;
      }
      interactiveObjectComponent.interact();
      this._stateMachine.setState(CHARACTER_STATES.LIFT_STATE, collisionObject);
      return true;
    }

    // we can open this item - even while crawling
    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.OPEN) {
      interactiveObjectComponent.interact();
      this._stateMachine.setState(CHARACTER_STATES.OPEN_CHEST_STATE, collisionObject);
      return true;
    }

    if (interactiveObjectComponent.objectType === INTERACTIVE_OBJECT_TYPE.AUTO) {
      return false;
    }

    // we should never hit this code block
    exhaustiveGuard(interactiveObjectComponent.objectType);
  }

  #handleCrawlMovement(): void {
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }

    // Stop any playing animation to use static crawl textures
    this._gameObject.anims.stop();

    const controls = this._gameObject.controls;
    const crawlSpeed = this._gameObject.speed * 0.5; // 50% of normal speed

    // Determine 8-directional movement
    let velocityX = 0;
    let velocityY = 0;

    if (controls.isUpDown) {
      velocityY = -1;
    } else if (controls.isDownDown) {
      velocityY = 1;
    }

    if (controls.isLeftDown) {
      velocityX = -1;
    } else if (controls.isRightDown) {
      velocityX = 1;
    }

    // Set velocity
    this._gameObject.body.velocity.x = velocityX;
    this._gameObject.body.velocity.y = velocityY;

    // Normalize and scale for crawl speed
    this._gameObject.body.velocity.normalize().scale(crawlSpeed);

    // Determine which crawl texture to use based on 8 directions
    let textureKey: string;

    if (velocityY < 0 && velocityX === 0) {
      // North
      textureKey = ASSET_KEYS.CRAWL_N;
      this._gameObject.direction = 'UP';
    } else if (velocityY < 0 && velocityX > 0) {
      // Northeast
      textureKey = ASSET_KEYS.CRAWL_NE;
      this._gameObject.direction = 'UP';
    } else if (velocityY === 0 && velocityX > 0) {
      // East
      textureKey = ASSET_KEYS.CRAWL_E;
      this._gameObject.direction = 'RIGHT';
    } else if (velocityY > 0 && velocityX > 0) {
      // Southeast
      textureKey = ASSET_KEYS.CRAWL_SE;
      this._gameObject.direction = 'DOWN';
    } else if (velocityY > 0 && velocityX === 0) {
      // South
      textureKey = ASSET_KEYS.CRAWL_S;
      this._gameObject.direction = 'DOWN';
    } else if (velocityY > 0 && velocityX < 0) {
      // Southwest
      textureKey = ASSET_KEYS.CRAWL_SW;
      this._gameObject.direction = 'DOWN';
    } else if (velocityY === 0 && velocityX < 0) {
      // West
      textureKey = ASSET_KEYS.CRAWL_W;
      this._gameObject.direction = 'LEFT';
    } else if (velocityY < 0 && velocityX < 0) {
      // Northwest
      textureKey = ASSET_KEYS.CRAWL_NW;
      this._gameObject.direction = 'UP';
    } else {
      // Default to south
      textureKey = ASSET_KEYS.CRAWL_S;
    }

    this._gameObject.setTexture(textureKey);
  }
}

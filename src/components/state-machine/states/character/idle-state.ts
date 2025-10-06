import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { HeldGameObjectComponent } from '../../../game-object/held-game-object-component';
import { ThrowableObjectComponent } from '../../../game-object/throwable-object-component';
import { Player } from '../../../../game-objects/player/player';
import { ASSET_KEYS } from '../../../../common/assets';
import { CUSTOM_EVENTS, EVENT_BUS } from '../../../../common/event-bus';
import { CollidingObjectsComponent } from '../../../game-object/colliding-objects-component';
import { InteractiveObjectComponent } from '../../../game-object/interactive-object-component';
import { INTERACTIVE_OBJECT_TYPE } from '../../../../common/common';

export class IdleState extends BaseCharacterState {
  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.IDLE_STATE, gameObject);
  }

  public onEnter(): void {
    // Check if player is crawling and display appropriate visual
    if (this._gameObject instanceof Player && this._gameObject.isCrawling) {
      this.#displayCrawlTexture();
    } else {
      // play idle animation based on game object direction
      this._gameObject.animationComponent.playAnimation(`IDLE_${this._gameObject.direction}`);
    }

    // reset game object velocity
    this._resetObjectVelocity();

    const heldComponent = HeldGameObjectComponent.getComponent<HeldGameObjectComponent>(this._gameObject);
    if (heldComponent !== undefined && heldComponent.object !== undefined) {
      const throwObjectComponent = ThrowableObjectComponent.getComponent<ThrowableObjectComponent>(
        heldComponent.object,
      );
      if (throwObjectComponent !== undefined) {
        throwObjectComponent.drop();
      }
      heldComponent.drop();
    }
  }

  public onUpdate(): void {
    const controls = this._gameObject.controls;

    if (controls.isMovementLocked) {
      return;
    }

    // if attack key was pressed, attack with weapon
    if (controls.isAttackKeyJustDown) {
      this._stateMachine.setState(CHARACTER_STATES.ATTACK_STATE);
      return;
    }

    // Check if action key was pressed
    if (controls.isActionKeyJustDown) {
      // First check for interactive objects (pots/chests)
      if (this.#checkIfObjectWasInteractedWith()) {
        return;
      }

      // If no interactive object, toggle crawl (only for player)
      if (this._gameObject instanceof Player) {
        this._gameObject.isCrawling = !this._gameObject.isCrawling;
        if (this._gameObject.isCrawling) {
          this.#displayCrawlTexture();
        } else {
          // Restore PLAYER texture and play idle animation
          this._gameObject.setTexture(ASSET_KEYS.PLAYER);
          this._gameObject.animationComponent.playAnimation(`IDLE_${this._gameObject.direction}`);
        }
        // Action text will be updated by Player.update() via PLAYER_ACTION_CHANGED event
        return;
      }
    }

    // if no other input is provided, do nothing
    if (!controls.isDownDown && !controls.isUpDown && !controls.isLeftDown && !controls.isRightDown) {
      return;
    }

    this._stateMachine.setState(CHARACTER_STATES.MOVE_STATE);
  }

  #displayCrawlTexture(): void {
    // Stop any playing animation first to prevent texture conflicts
    this._gameObject.anims.stop();

    // Set static crawl texture based on current direction
    const direction = this._gameObject.direction;
    let textureKey: string;

    switch (direction) {
      case 'UP':
        textureKey = ASSET_KEYS.CRAWL_N;
        break;
      case 'DOWN':
        textureKey = ASSET_KEYS.CRAWL_S;
        break;
      case 'LEFT':
        textureKey = ASSET_KEYS.CRAWL_W;
        break;
      case 'RIGHT':
        textureKey = ASSET_KEYS.CRAWL_E;
        break;
      default:
        textureKey = ASSET_KEYS.CRAWL_S;
    }

    this._gameObject.setTexture(textureKey);
  }

  #checkIfObjectWasInteractedWith(): boolean {
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

    return false;
  }
}

import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { CHARACTER_ANIMATIONS } from '../../../../common/assets';
import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { isArcadePhysicsBody } from '../../../../common/utils';

export class DeathState extends BaseCharacterState {
  #onDieCallback: () => void;

  constructor(gameObject: CharacterGameObject, onDieCallback: () => void = () => undefined) {
    super(CHARACTER_STATES.DEATH_STATE, gameObject);
    this.#onDieCallback = onDieCallback;
  }

  public onEnter(): void {
    // reset game object velocity
    if (isArcadePhysicsBody(this._gameObject.body)) {
      this._gameObject.body.velocity.x = 0;
      this._gameObject.body.velocity.y = 0;
    }

    // make character invulnerable after taking a hit
    this._gameObject.invulnerableComponent.invulnerable = true;

    // disable body on game object so we stop triggering the collision
    (this._gameObject.body as Phaser.Physics.Arcade.Body).enable = false;

    // play animation for character dying
    this._gameObject.animationComponent.playAnimation(CHARACTER_ANIMATIONS.DIE_DOWN, () => {
      this.#triggerDefeatedEvent();
    });
  }

  #triggerDefeatedEvent(): void {
    this._gameObject.disableObject();
    this.#onDieCallback();
  }
}

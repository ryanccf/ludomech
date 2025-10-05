import { Direction, GameObject } from '../../common/types';
import { BaseGameObjectComponent } from './base-game-object-component';
import { CharacterGameObject } from '../../game-objects/common/character-game-object';

/**
 * Component that detects when a character is against a wall
 */
export class WallDetectionComponent extends BaseGameObjectComponent {
  #gameObject: CharacterGameObject;
  #collisionLayer: Phaser.Tilemaps.TilemapLayer | undefined;

  constructor(gameObject: GameObject) {
    super(gameObject);
    this.#gameObject = gameObject as CharacterGameObject;

    // Find collision layer in the scene's display list
    const scene = this.#gameObject.scene;
    this.#collisionLayer = scene.children.list.find(
      (child) => child instanceof Phaser.Tilemaps.TilemapLayer && (child as Phaser.Tilemaps.TilemapLayer).layer.name === 'collision'
    ) as Phaser.Tilemaps.TilemapLayer;
  }

  /**
   * Detects if there's a wall in the direction the character is facing
   * @returns The direction of the wall, or undefined if no wall detected
   */
  public getWallDirection(): Direction | undefined {
    const direction = this.#gameObject.direction;

    if (this.detectWall(direction)) {
      return direction;
    }

    return undefined;
  }

  /**
   * Raycasts in a direction to detect a wall tile
   */
  private detectWall(direction: Direction): boolean {
    if (!this.#collisionLayer) {
      return false;
    }

    const body = this.#gameObject.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return false;
    }

    const rayLength = 5; // pixels - short distance to detect immediate wall contact
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    // Start raycast from edge of physics body
    switch (direction) {
      case 'LEFT':
        startX = body.left;
        startY = body.center.y;
        endX = startX - rayLength;
        endY = startY;
        break;
      case 'RIGHT':
        startX = body.right;
        startY = body.center.y;
        endX = startX + rayLength;
        endY = startY;
        break;
      case 'UP':
        startX = body.center.x;
        startY = body.top;
        endX = startX;
        endY = startY - rayLength;
        break;
      case 'DOWN':
        startX = body.center.x;
        startY = body.bottom;
        endX = startX;
        endY = startY + rayLength;
        break;
    }

    // Check if there's a collision tile at the endpoint
    const tile = this.#collisionLayer.getTileAtWorldXY(endX, endY);
    return tile !== null && tile.collides;
  }
}

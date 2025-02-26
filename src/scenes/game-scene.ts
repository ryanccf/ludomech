import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { Player } from '../game-objects/player/player';
import { KeyboardComponent } from '../components/input/keyboard-component';
import { Spider } from '../game-objects/enemies/spider';
import { Wisp } from '../game-objects/enemies/wisp';

export class GameScene extends Phaser.Scene {
  #controls!: KeyboardComponent;
  #player!: Player;
  #spider!: Spider;
  #wisp!: Wisp;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_SCENE,
    });
  }

  public create(): void {
    if (!this.input.keyboard) {
      console.warn('Phaser keyboard plugin is not setup properly.');
      return;
    }
    this.#controls = new KeyboardComponent(this.input.keyboard);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Game Scene', { fontFamily: ASSET_KEYS.FONT_PRESS_START_2P })
      .setOrigin(0.5);

    this.#player = new Player({
      scene: this,
      position: { x: this.scale.width / 2, y: this.scale.height / 2 },
      controls: this.#controls,
    });

    this.#spider = new Spider({
      scene: this,
      position: { x: this.scale.width / 2, y: this.scale.height / 2 + 50 },
    });
    this.#spider.setCollideWorldBounds(true);

    this.#wisp = new Wisp({
      scene: this,
      position: { x: this.scale.width / 2, y: this.scale.height / 2 - 50 },
    });
    this.#wisp.setCollideWorldBounds(true);
  }

  public update(): void {
    this.#spider.update();
    this.#wisp.update();
  }
}

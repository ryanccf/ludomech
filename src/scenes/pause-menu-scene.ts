import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { DebugManager } from '../common/debug-manager';

export class PauseMenuScene extends Phaser.Scene {
  #menuItems: Array<{ text: Phaser.GameObjects.Text; setting: keyof typeof DebugManager.instance.settings | null }>;
  #selectedIndex: number = 0;
  #cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  #enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({
      key: SCENE_KEYS.PAUSE_MENU_SCENE,
    });
    this.#menuItems = [];
  }

  public create(): void {
    if (!this.input.keyboard) {
      console.warn('Phaser keyboard plugin is not setup properly.');
      return;
    }

    this.#cursorKeys = this.input.keyboard.createCursorKeys();
    this.#enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Semi-transparent background
    this.add.rectangle(128, 112, 256, 224, 0x000000, 0.7);

    // Title
    this.add.text(128, 20, 'PAUSED', {
      ...DEFAULT_UI_TEXT_STYLE,
      fontSize: 12,
    }).setOrigin(0.5);

    // Debug menu items
    const startY = 50;
    const spacing = 16;

    this.#menuItems = [
      { text: this.add.text(30, startY, '', DEFAULT_UI_TEXT_STYLE), setting: 'showPlayerCollision' },
      { text: this.add.text(30, startY + spacing, '', DEFAULT_UI_TEXT_STYLE), setting: 'showPlayerInteraction' },
      { text: this.add.text(30, startY + spacing * 2, '', DEFAULT_UI_TEXT_STYLE), setting: 'showInteractableCollision' },
      { text: this.add.text(30, startY + spacing * 3, '', DEFAULT_UI_TEXT_STYLE), setting: 'showEnemyCollision' },
      { text: this.add.text(30, startY + spacing * 4, '', DEFAULT_UI_TEXT_STYLE), setting: 'showWalls' },
      { text: this.add.text(30, startY + spacing * 6, 'Resume (Enter)', DEFAULT_UI_TEXT_STYLE), setting: null },
    ];

    this.#updateMenuText();
  }

  public update(): void {
    // Navigate menu
    if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
      this.#selectedIndex = Math.max(0, this.#selectedIndex - 1);
      this.#updateMenuText();
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
      this.#selectedIndex = Math.min(this.#menuItems.length - 1, this.#selectedIndex + 1);
      this.#updateMenuText();
    }

    // Toggle setting or resume
    if (Phaser.Input.Keyboard.JustDown(this.#enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X))) {
      const selectedItem = this.#menuItems[this.#selectedIndex];

      if (selectedItem.setting) {
        // Toggle debug setting
        DebugManager.instance.toggle(selectedItem.setting);
        this.#updateMenuText();
      } else {
        // Resume game
        this.#resumeGame();
      }
    }
  }

  #updateMenuText(): void {
    const debugSettings = DebugManager.instance.settings;
    const settingLabels: Record<string, string> = {
      showPlayerCollision: 'Player Collision',
      showPlayerInteraction: 'Player Interaction',
      showInteractableCollision: 'Object Collision',
      showEnemyCollision: 'Enemy Collision',
      showWalls: 'Walls',
    };

    this.#menuItems.forEach((item, index) => {
      if (item.setting) {
        const isOn = debugSettings[item.setting];
        const label = settingLabels[item.setting];
        const prefix = index === this.#selectedIndex ? '> ' : '  ';
        item.text.setText(`${prefix}${label}: ${isOn ? 'ON' : 'OFF'}`);
      } else {
        const prefix = index === this.#selectedIndex ? '> ' : '  ';
        item.text.setText(`${prefix}Resume (Enter)`);
      }
    });
  }

  #resumeGame(): void {
    // Resume game scene
    this.scene.resume(SCENE_KEYS.GAME_SCENE);
    this.scene.resume(SCENE_KEYS.UI_SCENE);
    this.scene.stop();
  }
}

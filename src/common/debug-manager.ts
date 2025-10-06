export type DebugSettings = {
  showPlayerCollision: boolean;
  showPlayerInteraction: boolean;
  showInteractableCollision: boolean;
  showEnemyCollision: boolean;
  showWalls: boolean;
};

export class DebugManager {
  private static _instance: DebugManager;
  #settings: DebugSettings;

  private constructor() {
    this.#settings = {
      showPlayerCollision: false,
      showPlayerInteraction: false,
      showInteractableCollision: false,
      showEnemyCollision: false,
      showWalls: false,
    };
  }

  static get instance(): DebugManager {
    if (!DebugManager._instance) {
      DebugManager._instance = new DebugManager();
    }
    return DebugManager._instance;
  }

  get settings(): DebugSettings {
    return this.#settings;
  }

  toggle(setting: keyof DebugSettings): void {
    this.#settings[setting] = !this.#settings[setting];
    console.log(`[DebugManager] Toggled ${setting} to ${this.#settings[setting]}`);
  }
}

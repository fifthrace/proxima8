// scripts/test_import_export.js

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

// 1. Mock global APIs
global.localStorage = new LocalStorageMock();

// Check if EventTarget is available (Node 16+ has it)
// But GameState extends EventTarget.
// If it's undefined, we need to polyfill before importing GameState.

if (typeof EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    constructor() { this.listeners = {}; }
    addEventListener(type, callback) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(callback);
    }
    removeEventListener(type, callback) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
    dispatchEvent(event) {
      if (!this.listeners[event.type]) return true;
      this.listeners[event.type].forEach(cb => cb(event));
      return !event.defaultPrevented;
    }
  };
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
} else {
  // If native EventTarget exists, ensure CustomEvent also exists
  if (typeof CustomEvent === 'undefined') {
    global.CustomEvent = class CustomEvent extends Event {
      constructor(type, options = {}) {
        super(type, options);
        this.detail = options.detail;
      }
    };
  }
}

// 2. Import GameState (using dynamic import to ensure mocks are ready)
(async () => {
  try {
    const { GameState } = await import('../src/state/GameState.js');
    const game = new GameState();

    console.log("Starting Import/Export Verification...");

    // 3. Setup initial state
    console.log("Setting up initial state...");
    game.completed = ['level-001'];
    game.states = { 'level-001': [[1, 0], [0, 1]] };
    game.stats = { 'level-001': { time: 10, accuracy: 100 } };
    game.galaxyUnlocked = true;
    localStorage.setItem('p8_daily_history', JSON.stringify([{ date: '2023-01-01', puzzleId: 'daily-1' }]));

    // 4. Export
    console.log("Exporting state...");
    const jsonExport = game.exportState();
    console.log("Exported JSON:", jsonExport);

    // 5. Clear state (simulate new session)
    console.log("Clearing state...");
    game.completed = [];
    game.states = {};
    game.stats = {};
    game.galaxyUnlocked = false;
    localStorage.clear();

    // 6. Import
    console.log("Importing state...");
    const success = game.importState(jsonExport);
    
    if (!success) {
      console.error("FAILED: Import returned false.");
      process.exit(1);
    }

    // 7. Verify
    console.log("Verifying restored state...");
    
    const assert = (condition, msg) => {
      if (!condition) {
        console.error(`FAIL: ${msg}`);
        process.exit(1);
      } else {
        console.log(`PASS: ${msg}`);
      }
    };

    assert(game.completed.includes('level-001'), "Completed levels restored");
    assert(game.states['level-001'][0][0] === 1, "Game state restored");
    assert(game.stats['level-001'].time === 10, "Stats restored");
    assert(game.galaxyUnlocked === true, "Galaxy unlocked restored");
    
    const history = JSON.parse(localStorage.getItem('p8_daily_history'));
    assert(history && history[0].puzzleId === 'daily-1', "Daily history restored to localStorage");

    console.log("ALL TESTS PASSED: Import/Export logic is valid.");
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
})();
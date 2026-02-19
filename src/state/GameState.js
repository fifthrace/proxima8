/**
 * GameState.js
 * Central state management for Proxima 8.
 * Handles localStorage persistence and provides an event system for UI updates.
 */

export class GameState extends EventTarget {
  constructor() {
    super();
    this.currentLevel = null;
    this.state = [];
    this.history = [];
    this.overridePending = [];
    this.completed = this._loadCompleted();
    this.states = this._loadStates();
    this.stats = this._loadStats(); // Persistent stats for daily/accuracy/time
    this.galaxyUnlocked = this._loadGalaxyUnlocked();
    
    // Performance tracking
    this.startTime = 0;
    this.moveCount = 0;
    this.incorrectClicks = 0;
  }

  // --- Persistence Helpers ---

  _loadCompleted() {
    return JSON.parse(localStorage.getItem('zen_completed') || '[]');
  }

  _saveCompleted() {
    localStorage.setItem('zen_completed', JSON.stringify(this.completed));
  }

  _loadStates() {
    return JSON.parse(localStorage.getItem('proxima_states') || '{}');
  }

  _saveStates() {
    localStorage.setItem('proxima_states', JSON.stringify(this.states));
  }

  _loadStats() {
    return JSON.parse(localStorage.getItem('proxima_stats') || '{}');
  }

  _saveStats() {
    localStorage.setItem('proxima_stats', JSON.stringify(this.stats));
  }

  _loadGalaxyUnlocked() {
    return localStorage.getItem('proxima_galaxy_unlocked') === 'true';
  }

  _saveGalaxyUnlocked() {
    localStorage.setItem('proxima_galaxy_unlocked', this.galaxyUnlocked.toString());
  }

  // --- Public API ---

  /**
   * Initializes state for a specific level.
   * @param {Object} levelData - The level object (width, height, clues, solution, etc).
   */
  loadLevel(levelData) {
    this.currentLevel = levelData;
    this.history = [];
    this.overridePending = [];
    
    // Reset performance tracking for new load
    this.startTime = Date.now();
    this.moveCount = 0;
    this.incorrectClicks = 0;

    if (this.completed.includes(levelData.id)) {
      // If completed, show the solution
      this.state = JSON.parse(JSON.stringify(levelData.solution));
    } else {
      // Otherwise load saved state or create fresh grid
      this.state = this.states[levelData.id] || 
                   Array(levelData.height).fill().map(() => Array(levelData.width).fill(0));
    }

    this.emit('level-loaded', { level: levelData, state: this.state });
  }

  /**
   * Toggles a cell state (0 -> 1 -> 0) and handles persistence.
   */
  toggleCell(x, y) {
    if (!this.currentLevel || this.state[y][x] === 2) return;

    this.history.push(JSON.stringify(this.state));
    
    const targetValue = this.currentLevel.solution[y][x];
    const newValue = this.state[y][x] === 0 ? 1 : 0;
    
    this.state[y][x] = newValue;
    this.moveCount++;

    // Accuracy tracking: if the new value doesn't match the solution, it's an incorrect move
    if (newValue !== targetValue) {
        this.incorrectClicks++;
    }
    
    // Clear override if the cell is manually toggled
    this.overridePending = this.overridePending.filter(p => p.x !== x || p.y !== y);
    
    this._persistCurrentState();
    this.emit('state-updated', { x, y, value: this.state[y][x], state: this.state });
  }

  /**
   * Marks a cell (0 -> 2 -> 0) for user notation.
   */
  markCell(x, y) {
    if (!this.currentLevel || this.state[y][x] === 1) return;

    this.history.push(JSON.stringify(this.state));
    this.state[y][x] = this.state[y][x] === 2 ? 0 : 2;
    
    this._persistCurrentState();
    this.emit('state-updated', { x, y, value: this.state[y][x], state: this.state });
  }

  /**
   * Returns progress/completion status for a level.
   */
  getProgress(id) {
    return {
      completed: this.completed.includes(id),
      savedState: this.states[id] || null,
      hasStarted: !!this.states[id] && this.states[id].flat().some(cell => cell === 1)
    };
  }

  /**
   * Marks a level as completed.
   */
  markCompleted(id) {
    if (!this.completed.includes(id)) {
      this.completed.push(id);
      
      // Calculate final stats upon first completion
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - this.startTime) / 1000);
      const accuracy = this.moveCount > 0 
        ? Math.max(0, Math.floor(((this.moveCount - this.incorrectClicks) / this.moveCount) * 100))
        : 100;

      this.stats[id] = {
        time: durationSeconds,
        accuracy: accuracy,
        completedAt: new Date().toISOString()
      };

      this._saveStats();
      this._saveCompleted();
      this.emit('level-completed', { id, stats: this.stats[id] });
    }
  }

  getPerformanceStats(id) {
      return this.stats[id] || null;
  }

  /**
   * Resets the current level state.
   */
  resetLevel() {
    if (!this.currentLevel) return;
    
    this.state = Array(this.currentLevel.height).fill().map(() => Array(this.currentLevel.width).fill(0));
    this.history = [];
    this.overridePending = [];
    this.startTime = Date.now();
    this.moveCount = 0;
    this.incorrectClicks = 0;
    
    // Remove from completed if it was there
    this.completed = this.completed.filter(id => id !== this.currentLevel.id);
    this._saveCompleted();
    
    this._persistCurrentState();
    this.emit('level-reset', { id: this.currentLevel.id, state: this.state });
  }

  /**
   * Undoes the last move.
   */
  undo() {
    if (this.history.length === 0) return;
    
    this.state = JSON.parse(this.history.pop());
    this._persistCurrentState();
    this.emit('state-updated', { state: this.state, isUndo: true });
  }

  /**
   * Sets the galaxy unlocked status.
   */
  setGalaxyUnlocked(unlocked) {
    this.galaxyUnlocked = unlocked;
    this._saveGalaxyUnlocked();
    this.emit('galaxy-unlocked', { unlocked });
  }

  /**
   * Adds hints (overrides) to the current grid.
   */
  addOverride(cells) {
    this.overridePending.push(...cells);
    this.incorrectClicks += cells.length; // Hints count against accuracy
    this.emit('state-updated', { state: this.state, overrides: this.overridePending });
  }

  // --- Internal ---

  _persistCurrentState() {
    if (this.currentLevel) {
      this.states[this.currentLevel.id] = this.state;
      this._saveStates();
    }
  }

  /**
   * Wrapper for CustomEvent emission.
   */
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

// Export a singleton instance
export const gameState = new GameState();

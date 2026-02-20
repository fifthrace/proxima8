import { gameState } from '../state/GameState.js';
import { GridLogic } from '../engine/GridLogic.js';
import { LevelLoader } from '../engine/LevelLoader.js';

export class PuzzleView {
  constructor(container, props = {}) {
    this.container = container;
    this.props = props; // levelId
    this.levelLoader = new LevelLoader();
    this.currentLevel = null;

    // Bind events
    this.onLevelLoaded = this.onLevelLoaded.bind(this);
    this.onStateUpdated = this.onStateUpdated.bind(this);
    this.onLevelCompleted = this.onLevelCompleted.bind(this);
    this.onLevelReset = this.onLevelReset.bind(this);
  }

  async render() {
    if (this.props.levelId && (!this.currentLevel || this.currentLevel.id !== this.props.levelId)) {
      const levelData = await this.levelLoader.fetchLevel(this.props.levelId);
      this.currentLevel = levelData;
      gameState.loadLevel(levelData);
    }

    // Check if level is already completed to decide button visibility
    const isCompleted = gameState.completed.includes(this.props.levelId);
    const isDaily = this.currentLevel && this.currentLevel.sector === 'Daily Static';

    this.container.innerHTML = `
      <div id="game-overlay" style="display: flex;" onclick="window.closeAllPanels()">
        <div id="help-toggle-game" style="position: absolute; top: 30px; right: 70px; cursor: pointer; font-size: 20px; opacity: 0.4; z-index: 100;" onclick="event.stopPropagation(); window.toggleHelp()">?</div>
        <div id="settings-toggle-game" style="position: absolute; top: 30px; right: 30px; cursor: pointer; font-size: 20px; opacity: 0.4; z-index: 100;" onclick="event.stopPropagation(); window.toggleSettings()">⚙</div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px; margin-top: 20px;" onclick="event.stopPropagation()">
            <span id="exit-btn" class="text-btn">← <span class="btn-text">Exit</span></span>
            <span id="undo-btn" class="text-btn">↩ <span class="btn-text">Undo</span></span>
            <span id="reset-btn" class="text-btn" style="display:${isDaily ? 'none' : 'inline-block'};">↺ <span class="btn-text">Clear</span></span>
            <span id="next-btn" class="text-btn ${isCompleted ? 'glow' : ''}" style="display:${isDaily ? 'none' : 'inline-block'}; cursor: pointer;"><span class="btn-text">Next</span> →</span>
        </div>
        <div style="text-align: center;" onclick="event.stopPropagation()">
            <h1 id="game-header" style="font-weight: 200; letter-spacing: 2px; text-transform: uppercase; margin-bottom: ${isDaily ? '5px' : '10px'};">
                ${isDaily ? 'Daily Static Breach' : (this.currentLevel ? this.currentLevel.name : 'Sector Node')}
            </h1>
            ${isDaily ? `<div id="game-subheader" style="font-size: 12px; opacity: 0.6; letter-spacing: 1px; margin-bottom: 15px;">${this.currentLevel.id}</div>` : ''}
        </div>
        <div id="grid" onclick="event.stopPropagation()"></div>
        <div id="status" style="margin-top: 20px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; font-size: 14px;" onclick="event.stopPropagation()">
            ${isCompleted ? 'Trajectory Locked' : 'Map the Sector'}
        </div>
        
        <div id="action-row" style="margin-top: 25px; display: flex; gap: 15px;" onclick="event.stopPropagation()">
            <button id="share-btn" style="display:${(isCompleted && isDaily) ? 'block' : 'none'}; padding: 10px 20px; border-radius: 20px; border: 1px solid var(--accent-blue); background: transparent; color: var(--accent-blue); cursor: pointer; font-weight: 600;">Share Mapping</button>
            <button id="override-btn" style="display:${(isCompleted || isDaily) ? 'none' : 'block'}; padding: 10px 20px; border-radius: 20px; border: none; background: var(--accent-blue); color: white; cursor: pointer; font-weight: 600;">Ion Scan (∞)</button>
        </div>
      </div>
    `;

    this.initEvents();
    if (this.currentLevel) {
      this.createGrid();
      this.updateUI();
      this.checkWin(true);
    }
  }

  initEvents() {
    this.container.querySelector('#exit-btn').onclick = () => {
      window.dispatchEvent(new CustomEvent('exit-game'));
    };

    this.container.querySelector('#undo-btn').onclick = () => {
      gameState.undo();
    };

    const resetBtn = this.container.querySelector('#reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        window.dispatchEvent(new CustomEvent('show-modal', {
          detail: {
            title: "Reset Trajectory",
            body: "Purge all coordinates?",
            confirmText: "Purge",
            onConfirm: () => gameState.resetLevel()
          }
        }));
      };
    }

    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        this.goToNext();
      };
    }

    const shareBtn = this.container.querySelector('#share-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        this.shareResult();
      };
    }

    const overrideBtn = this.container.querySelector('#override-btn');
    if (overrideBtn) {
      overrideBtn.onclick = () => {
        this.requestOverride();
      };
    }

    // GameState listeners
    gameState.addEventListener('level-loaded', this.onLevelLoaded);
    gameState.addEventListener('state-updated', this.onStateUpdated);
    gameState.addEventListener('level-completed', this.onLevelCompleted);
    gameState.addEventListener('level-reset', this.onLevelReset);
  }

  onLevelLoaded(e) {
    this.currentLevel = e.detail.level;
    this.render();
  }

  onStateUpdated(e) {
    this.updateUI();
    this.checkWin(e.detail.isUndo);
  }

  onLevelCompleted(e) {
    const statusEl = this.container.querySelector('#status');
    if (statusEl) statusEl.innerText = "Trajectory Locked";
    
    const isDaily = this.currentLevel && this.currentLevel.sector === 'Daily Static';
    
    const shareBtn = this.container.querySelector('#share-btn');
    if (shareBtn && isDaily) shareBtn.style.display = 'block';
    
    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn && !isDaily) {
      nextBtn.classList.add('glow');
    }
    
    const overrideBtn = this.container.querySelector('#override-btn');
    if (overrideBtn) overrideBtn.style.display = 'none';
  }

  onLevelReset(e) {
    this.updateUI();
    this.checkWin(true);
    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.classList.remove('glow');
    }
    
    const isDaily = this.currentLevel && this.currentLevel.sector === 'Daily Static';
    const overrideBtn = this.container.querySelector('#override-btn');
    if (overrideBtn && !isDaily) overrideBtn.style.display = 'block';
  }

  createGrid() {
    const g = this.container.querySelector('#grid');
    if (!g) return;
    const { width, height, clues } = this.currentLevel;

    g.style.setProperty('--grid-width', width);
    g.style.gridTemplateColumns = `repeat(${width}, auto)`;
    g.innerHTML = '';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = document.createElement('div');
        c.className = 'cell';
        c.id = `cell-${x}-${y}`;
        c.innerText = clues[y][x];

        c.onclick = (e) => {
          if (e.pointerType === 'touch') return;
          gameState.toggleCell(x, y);
        };

        c.oncontextmenu = (e) => {
          e.preventDefault();
          if (e.pointerType === 'touch') return;
          gameState.markCell(x, y);
        };

        // Touch handling
        let pressTimer;
        let isLongPress = false;

        c.onpointerdown = (e) => {
          isLongPress = false;
          if (e.pointerType === 'touch') {
            pressTimer = setTimeout(() => {
              isLongPress = true;
              if (gameState.state[y][x] !== 1) {
                gameState.markCell(x, y);
                if (window.navigator.vibrate) window.navigator.vibrate([30, 30, 30]);
              }
            }, 500);
          }
        };

        c.onpointerup = (e) => {
          clearTimeout(pressTimer);
          if (e.pointerType === 'touch' && !isLongPress) {
            if (window.navigator.vibrate) window.navigator.vibrate(10);
            gameState.toggleCell(x, y);
          }
        };

        c.onpointercancel = () => clearTimeout(pressTimer);

        g.appendChild(c);
      }
    }
  }

  updateUI() {
    const { width, height } = this.currentLevel;
    const { state, overridePending } = gameState;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = this.container.querySelector(`#cell-${x}-${y}`);
        if (!c) continue;
        c.classList.toggle('active', state[y][x] === 1);
        c.classList.toggle('marked', state[y][x] === 2);
        const ov = overridePending.some(p => p.x === x && p.y === y);
        c.classList.toggle('override', ov);
      }
    }
  }

  checkWin(silent = false) {
    if (!this.currentLevel) return;
    const { width, height, clues } = this.currentLevel;
    const { state } = gameState;

    const { solved, gridMetadata } = GridLogic.checkWinCondition(state, clues, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = this.container.querySelector(`#cell-${x}-${y}`);
        if (!c) continue;
        const meta = gridMetadata[y][x];
        c.classList.toggle('correct', meta.isCorrect);
        c.classList.toggle('too-many', meta.isTooMany);
      }
    }

    if (solved) {
      if (!silent) {
        gameState.markCompleted(this.currentLevel.id);
      } else {
        this.onLevelCompleted();
      }
    } else {
      const statusEl = this.container.querySelector('#status');
      if (statusEl) statusEl.innerText = "Map the Sector";
    }
  }

  async goToNext() {
    const manifest = await this.levelLoader.fetchManifest();
    
    const currentId = this.props.levelId;
    
    // Ensure we have the sector data
    if (!this.currentLevel.sector) {
      const entry = manifest.find(l => l.id === currentId);
      if (entry) this.currentLevel.sector = entry.sector;
    }

    const sectorLevels = manifest.filter(l => l.sector === this.currentLevel.sector);
    const localIdx = sectorLevels.findIndex(l => l.id === currentId);
    
    if (localIdx !== -1) {
      // Just go to the next puzzle in sequence (clockwise order)
      const nextIdx = (localIdx + 1) % sectorLevels.length;
      const nextId = sectorLevels[nextIdx].id;
      window.dispatchEvent(new CustomEvent('load-level', { detail: { id: nextId } }));
    }
  }

  requestOverride() {
    const { width, height, solution } = this.currentLevel;
    const { state } = gameState;
    const cells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (state[y][x] !== solution[y][x]) cells.push({ x, y });
      }
    }
    if (!cells.length) return;
    const chosen = [];
    for (let i = 0; i < Math.min(3, cells.length); i++) {
      chosen.push(cells.splice(Math.floor(Math.random() * cells.length), 1)[0]);
    }
    gameState.addOverride(chosen);
  }

  shareResult() {
    const stats = gameState.getPerformanceStats(this.currentLevel.id);
    const isDaily = this.currentLevel.sector === 'Daily Static';
    
    let text = "";
    if (isDaily && stats) {
        const timeStr = new Date(stats.time * 1000).toISOString().substr(14, 5);
        text = `Proxima 8\n⚡ Daily Static Breach ⚡\n📅 ${this.currentLevel.id}\n\n🎯 ${stats.accuracy}%\n🕒 ${timeStr}`;
    } else {
        text = `Proxima 8: ${this.currentLevel.name}\nTrajectory Locked\n\n${window.location.href}`;
    }

    if (navigator.share) navigator.share({ title: 'Proxima 8', text }).catch(() => { });
    else {
      this.fallbackCopyTextToClipboard(text);
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      window.dispatchEvent(new CustomEvent('show-modal', {
        detail: { title: "Copied", body: `Result copied to clipboard:\n\n${text}`, confirmText: "OK", hideCancel: true }
      }));
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  destroy() {
    gameState.removeEventListener('level-loaded', this.onLevelLoaded);
    gameState.removeEventListener('state-updated', this.onStateUpdated);
    gameState.removeEventListener('level-completed', this.onLevelCompleted);
    gameState.removeEventListener('level-reset', this.onLevelReset);
  }
}

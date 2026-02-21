import { gameState } from '../state/GameState.js';
import { LevelLoader } from '../engine/LevelLoader.js';

export class GalaxyMap {
  constructor(container, props = {}) {
    this.container = container;
    this.props = props;
    this.levelLoader = new LevelLoader();
    this.sectorNames = ['Alpha Sector', 'Crimson Void', 'Azure Reach', 'Obsidian Gate', 'Emerald Nebula', 'Amber Vault', 'Indigo Drift'];
    this.pTypes = ['type-rocky', 'type-water', 'type-gas', 'type-ice'];
    this.sectorConfigs = {
      'Alpha Sector': { x: 0, y: 0, color: '#fab005' },
      'Crimson Void': { x: -13, y: 18, color: '#fa5252' },
      'Azure Reach': { x: 8, y: 28, color: '#1c7ed6' },
      'Obsidian Gate': { x: 28, y: 15, color: '#212529' },
      'Emerald Nebula': { x: 25, y: -12, color: '#40c057' },
      'Amber Vault': { x: -2, y: -33, color: '#fd7e14' },
      'Indigo Drift': { x: -33, y: -20, color: '#7048e8' }
    };
  }

  async render() {
    this.container.innerHTML = `
        <div id="viewport" onclick="window.closeAllPanels()">
            <div id="help-toggle" style="position: absolute; top: 30px; right: 70px; cursor: pointer; font-size: 20px; opacity: 0.4; color: var(--text-color); z-index: 100;" onclick="event.stopPropagation(); window.toggleHelp()">?</div>
            <div id="settings-toggle" style="position: absolute; top: 30px; right: 30px; cursor: pointer; font-size: 20px; opacity: 0.4; color: var(--text-color); z-index: 100;" onclick="event.stopPropagation(); window.toggleSettings()">⚙</div>

            <div id="universe">
                ${this.sectorNames.map(name => {
                  const idSafe = name.replace(/ /g, '-');
                  const firstWord = idSafe.split('-')[0].toLowerCase();
                  const config = this.sectorConfigs[name];
                  return `
                        <div id="sector-${firstWord}" class="cluster" data-sector="${name}">
                            <div class="cluster-core" style="background: ${config.color};"></div>
                            <div class="cluster-label">
                                <span class="cluster-name">${name}</span>
                                <span id="status-${idSafe}" class="cluster-status"></span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div id="daily-breach-container" style="position: absolute; top: 30px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; z-index: 100; pointer-events: none;">
                <button id="back-to-galaxy" style="display:none; pointer-events: all; position: static;">← Galactic Chart</button>
                <button id="daily-breach-btn" style="padding: 12px 24px; border-radius: 30px; border: 1px solid var(--accent-yellow); background: rgba(0,0,0,0.6); color: var(--accent-yellow); cursor: pointer; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; backdrop-filter: blur(4px); pointer-events: all;">Daily Static Breach</button>
            </div>

            <div id="system-view">
                <div class="sun-halo" id="system-halo"></div>
                <div class="central-sun" id="system-sun"></div>
                <div id="planet-container"></div>
            </div>
        </div>
    `;
    this.initEvents();
    await this.updateSectorStatus();

    // Check if we initialized with a sector/system in props
    if (this.props.sector) {
        const config = this.sectorConfigs[this.props.sector];
        if (config) {
            this.performZoomIn(config.x, config.y, this.props.sector, config.color, true);
        }
    }
  }

  initEvents() {
    this.container.querySelectorAll('.cluster').forEach(el => {
      el.onclick = () => {
        const name = el.getAttribute('data-sector');
        window.dispatchEvent(new CustomEvent('navigate-to-sector', { detail: { sector: name } }));
      };
    });

    const dailyBtn = this.container.querySelector('#daily-breach-btn');
    if (dailyBtn) {
      dailyBtn.onclick = (e) => {
        e.stopPropagation();
        const now = new Date();
        const dateId = now.toISOString().split('T')[0];
        window.dispatchEvent(new CustomEvent('load-level', { detail: { id: dateId } }));
      };
    }

    this.container.querySelector('#system-view').onclick = () => this.zoomOut();
    this.container.querySelector('#back-to-galaxy').onclick = (e) => {
      e.stopPropagation();
      this.zoomOut();
    };
  }

  async updateSectorStatus() {
    const manifest = await this.levelLoader.fetchManifest();

    this.sectorNames.forEach(name => {
      const idSafe = name.replace(/ /g, '-');
      const el = this.container.querySelector(`#status-${idSafe}`);
      const firstWord = idSafe.split('-')[0].toLowerCase();
      const clusterId = `sector-${firstWord}`;
      const cluster = this.container.querySelector(`#${clusterId}`);

      if (!el || !cluster) return;

      const sectorLevels = manifest.filter(l => l.sector === name);
      const progress = sectorLevels.map(l => gameState.getProgress(l.id));
      const doneCount = progress.filter(p => p.completed).length;
      const startedCount = progress.filter(p => p.hasStarted).length;

      const alphaLevels = manifest.filter(l => l.sector === 'Alpha Sector');
      const alphaCompleted = alphaLevels.length > 0 && alphaLevels.every(l => gameState.getProgress(l.id).completed);

      cluster.style.opacity = "1";
      cluster.style.filter = "none";
      cluster.style.pointerEvents = "all";

      if (name !== 'Alpha Sector' && !gameState.galaxyUnlocked && !alphaCompleted) {
        cluster.style.opacity = "0.4";
        cluster.style.filter = "grayscale(1)";
        el.innerText = "[Locked]";
        el.className = "cluster-status";
      } else {
        if (doneCount === sectorLevels.length && sectorLevels.length > 0) {
          el.innerText = "[Stable]";
          el.className = "cluster-status status-stable";
        } else if (doneCount > 0 || startedCount > 0) {
          el.innerText = "[Scanning...]";
          el.className = "cluster-status status-scanning";
        } else {
          el.innerText = "";
        }
      }
    });
  }

  performZoomIn(x, y, name, color, silent = false) {
    const isLandscape = window.innerWidth > window.innerHeight;
    document.body.style.setProperty('--zoom-x', (isLandscape ? x * 0.8 : x) + '%');
    document.body.style.setProperty('--zoom-y', (isLandscape ? y * 0.5 : y) + '%');
    document.body.classList.add('zoomed');

    const sun = this.container.querySelector('#system-sun');
    if (sun) {
        sun.style.background = color;
        sun.style.boxShadow = `0 0 80px ${color}aa, inset 0 0 20px rgba(255,255,255,0.5)`;
    }
    const halo = this.container.querySelector('#system-halo');
    if (halo) halo.style.background = color;

    this.renderSystem(name);
    
    // UI Cleanup: Show back button, hide daily button in system view
    this.container.querySelector('#back-to-galaxy').style.display = 'block';
    const dailyBtn = this.container.querySelector('#daily-breach-btn');
    if (dailyBtn) dailyBtn.style.display = 'none';

    if (!silent) {
        window.dispatchEvent(new CustomEvent('view-changed', { detail: { view: 'system', sector: name, x, y, color } }));
    }
  }

  async renderSystem(sectorName) {
    const container = this.container.querySelector('#planet-container');
    if (!container) return;
    container.innerHTML = '';

    const sectorLevels = this.levelLoader.getLevelsInSector(sectorName);
    const baseR = 160;

    sectorLevels.forEach((l, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'planet-wrapper';
      wrapper.setAttribute('data-id', l.id);

      const progress = gameState.getProgress(l.id);

      if (progress.completed) wrapper.classList.add('completed');
      else if (progress.hasStarted) wrapper.classList.add('in-progress');

      const physSize = 12 + (l.width * 2.2);
      const type = this.pTypes[i % this.pTypes.length];
      const angle = (i * (360 / sectorLevels.length) - 90) * (Math.PI / 180);

      wrapper.style.transform = `translate(${Math.cos(angle) * baseR}px, ${Math.sin(angle) * baseR}px)`;
      wrapper.innerHTML = `
            <div class="planet-sphere ${type}" style="width: ${physSize}px; height: ${physSize}px;"></div>
            <div class="planet-label">${l.title}</div>
        `;
      wrapper.onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('load-level', { detail: { id: l.id } }));
      };
      container.appendChild(wrapper);
    });
  }

  zoomOut() {
    // Restore Daily button visibility when returning to galaxy chart
    const dailyBtn = this.container.querySelector('#daily-breach-btn');
    if (dailyBtn) dailyBtn.style.display = 'block';
    
    window.dispatchEvent(new CustomEvent('exit-sector'));
  }
}

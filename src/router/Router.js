import { GalaxyMap } from '../components/GalaxyMap.js';
import { PuzzleView } from '../components/PuzzleView.js';

export class Router {
  constructor(appContainer) {
    this.container = appContainer;
    this.currentView = null;

    // Bind event listeners
    window.addEventListener('popstate', (e) => this.handleRoute(e.state));
    window.addEventListener('view-changed', (e) => this.updateURL(e.detail));
    window.addEventListener('load-level', (e) => {
        // Replace state when moving between puzzles to keep history flat
        const shouldReplace = window.history.state?.view === 'game';
        this.navigate('game', { node: e.detail.id, replace: shouldReplace });
    });
    window.addEventListener('exit-game', () => this.handleExit());
  }

  init() {
    const params = new URLSearchParams(window.location.search);
    const node = params.get('node');
    const sector = params.get('sector');

    if (node) {
      this.renderView('game', { levelId: node });
    } else if (sector) {
      this.renderView('galaxy', { sector: sector.replace(/_/g, ' ') });
    } else {
      this.renderView('galaxy');
    }
  }

  handleRoute(state) {
    if (!state) {
      this.renderView('galaxy');
      return;
    }

    if (state.view === 'game') {
      this.renderView('game', { levelId: state.id });
    } else if (state.view === 'system') {
      this.renderView('galaxy', { sector: state.sector, x: state.x, y: state.y, color: state.color });
    } else {
      this.renderView('galaxy');
    }
  }

  handleExit() {
    const state = window.history.state;
    // Always return to the specific system view if we have the metadata
    if (state && state.sector) {
        this.navigate('system', { sector: state.sector });
    } else {
        this.navigate('galaxy');
    }
  }

  navigate(view, params = {}) {
    const url = new URL(window.location);
    const historyMethod = params.replace ? 'replaceState' : 'pushState';

    if (view === 'game') {
      url.searchParams.set('node', params.node);
      url.searchParams.delete('sector');
      
      const currentSector = window.history.state?.sector || null;
      const currentX = window.history.state?.x || 0;
      const currentY = window.history.state?.y || 0;
      const currentColor = window.history.state?.color || null;

      window.history[historyMethod]({ 
        view: 'game', 
        id: params.node,
        sector: currentSector,
        x: currentX,
        y: currentY,
        color: currentColor
      }, '', url);
      
      this.renderView('game', { levelId: params.node });
    } else if (view === 'system') {
        url.searchParams.delete('node');
        url.searchParams.set('sector', params.sector.replace(/ /g, '_'));
        
        const galaxy = new GalaxyMap(null);
        const config = galaxy.sectorConfigs[params.sector];

        // Replace if coming from a game to keep the back button pointing to galaxy
        const method = (window.history.state?.view === 'game') ? 'replaceState' : 'pushState';

        window.history[method]({ 
            view: 'system', 
            sector: params.sector,
            x: config?.x || 0,
            y: config?.y || 0,
            color: config?.color || null
        }, '', url);
        
        this.renderView('galaxy', { sector: params.sector });
    } else {
      url.searchParams.delete('node');
      url.searchParams.delete('sector');
      window.history[historyMethod]({ view: 'galaxy' }, '', url);
      this.renderView('galaxy');
    }
  }

  renderView(viewName, props = {}) {
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }

    // CRITICAL: Always reset the 'zoomed' state on the body before switching views.
    // This prevents the blurry background bug when transitioning.
    document.body.classList.remove('zoomed');

    this.container.innerHTML = '';
    
    if (viewName === 'game') {
      this.currentView = new PuzzleView(this.container, props);
    } else {
      this.currentView = new GalaxyMap(this.container, props);
    }

    this.currentView.render();
  }
}

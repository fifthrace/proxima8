import { GalaxyMap } from '../components/GalaxyMap.js';
import { PuzzleView } from '../components/PuzzleView.js';

export class Router {
  constructor(appContainer) {
    this.container = appContainer;
    this.currentView = null;

    // Bind event listeners
    window.addEventListener('popstate', (e) => this.handleRoute(e.state));
    window.addEventListener('view-changed', (e) => this.updateURL(e.detail));
    window.addEventListener('load-level', (e) => this.navigate('game', { node: e.detail.id }));
    window.addEventListener('exit-game', () => this.handleExit());
  }

  init() {
    // Initial route based on URL params
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
    // If we're coming from a level, we want to go back to the sector we were in.
    // We check the history state to see if we have sector info.
    if (window.history.state && window.history.state.sector) {
        window.history.back();
    } else {
        this.navigate('galaxy');
    }
  }

  navigate(view, params = {}) {
    const url = new URL(window.location);
    if (view === 'game') {
      url.searchParams.set('node', params.node);
      url.searchParams.delete('sector');
      
      // Inherit sector info for the back button to work correctly
      const currentSector = window.history.state?.sector || null;
      const currentX = window.history.state?.x || 0;
      const currentY = window.history.state?.y || 0;
      const currentColor = window.history.state?.color || null;

      window.history.pushState({ 
        view: 'game', 
        id: params.node,
        sector: currentSector,
        x: currentX,
        y: currentY,
        color: currentColor
      }, '', url);
      
      this.renderView('game', { levelId: params.node });
    } else {
      url.searchParams.delete('node');
      if (params.sector) {
        url.searchParams.set('sector', params.sector.replace(/ /g, '_'));
      } else {
        url.searchParams.delete('sector');
      }
      window.history.pushState({ view: 'galaxy' }, '', url);
      this.renderView('galaxy');
    }
  }

  updateURL(detail) {
    const url = new URL(window.location);
    if (detail.view === 'system') {
      url.searchParams.set('sector', detail.sector.replace(/ /g, '_'));
      url.searchParams.delete('node');
      window.history.replaceState(detail, '', url);
    } else if (detail.view === 'galaxy') {
      url.searchParams.delete('sector');
      url.searchParams.delete('node');
      window.history.replaceState(detail, '', url);
    }
  }

  renderView(viewName, props = {}) {
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }

    this.container.innerHTML = '';
    
    if (viewName === 'game') {
      this.currentView = new PuzzleView(this.container, props);
    } else {
      this.currentView = new GalaxyMap(this.container, props);
    }

    this.currentView.render();
  }
}

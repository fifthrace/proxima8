/**
 * LevelLoader.js
 * Handles fetching level JSONs and the level manifest.
 */

export class LevelLoader {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.manifest = null;
    this.levelsCache = new Map();
  }

  /**
   * Fetches the level manifest.
   * @returns {Promise<Array>} The manifest array.
   */
  async fetchManifest() {
    if (this.manifest) return this.manifest;
    const response = await fetch(`${this.baseUrl}level_manifest.json`);
    if (!response.ok) throw new Error('Failed to load level manifest');
    this.manifest = await response.json();
    return this.manifest;
  }

  /**
   * Fetches a specific level by ID.
   * @param {string} id - Level ID.
   * @returns {Promise<Object>} The level data.
   */
  async fetchLevel(id) {
    if (this.levelsCache.has(id)) return this.levelsCache.get(id);
    
    // Check if it's a daily level ID (Format: YYYY-MM-DD)
    const isDailyId = /^\d{4}-\d{2}-\d{2}$/.test(id);
    const path = isDailyId ? `levels/daily/${id}.json` : `levels/${id}.json`;

    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) throw new Error(`Failed to load level: ${id}`);
    
    const data = await response.json();
    data.id = id;
    
    // Set sector manually for daily puzzles, or from manifest for standard ones
    if (isDailyId) {
      data.sector = 'Daily Static';
    } else {
      // Ensure the manifest is loaded before injecting sector
      if (!this.manifest) {
        await this.fetchManifest();
      }
      
      const manifestEntry = this.manifest.find(l => l.id === id);
      if (manifestEntry) {
        data.sector = manifestEntry.sector;
      }
    }

    this.levelsCache.set(id, data);
    return data;
  }

  /**
   * Helper to find all levels in a specific sector from the manifest.
   * @param {string} sectorName 
   * @returns {Array}
   */
  getLevelsInSector(sectorName) {
    if (!this.manifest) return [];
    return this.manifest.filter(l => l.sector === sectorName);
  }
}

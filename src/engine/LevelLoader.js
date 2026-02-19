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
    
    const response = await fetch(`${this.baseUrl}levels/${id}.json`);
    if (!response.ok) throw new Error(`Failed to load level: ${id}`);
    
    const data = await response.json();
    data.id = id;
    
    // Inject sector from manifest if available
    if (this.manifest) {
      const manifestEntry = this.manifest.find(l => l.id === id);
      if (manifestEntry) data.sector = manifestEntry.sector;
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

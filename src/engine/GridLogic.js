/**
 * GridLogic.js
 * Core engine logic for Proxima 8 grid verification.
 */

export class GridLogic {
  /**
   * Counts active neighbors for a given cell.
   * @param {number} x - Cell x coordinate.
   * @param {number} y - Cell y coordinate.
   * @param {Array<Array<number>>} state - 2D array representing grid state (1 for active).
   * @param {number} width - Grid width.
   * @param {number} height - Grid height.
   * @returns {number} Count of active neighbors.
   */
  static countActiveNeighbors(x, y, state, width, height) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        let nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (state[ny][nx] === 1) n++;
        }
      }
    }
    return n;
  }

  /**
   * Checks if the current grid state satisfies all clues and win conditions.
   * @param {Array<Array<number>>} state - 2D grid state.
   * @param {Array<Array<number>>} clues - 2D grid clues.
   * @param {number} width - Grid width.
   * @param {number} height - Grid height.
   * @returns {Object} { solved: boolean, gridMetadata: Array<Array<Object>> }
   */
  static checkWinCondition(state, clues, width, height) {
    let solved = true;
    let activeTotal = 0;
    const gridMetadata = Array(height).fill().map(() => Array(width).fill());

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (state[y][x] === 1) activeTotal++;
        
        const activeNeighbors = this.countActiveNeighbors(x, y, state, width, height);
        const target = clues[y][x];
        
        const isCorrect = (activeNeighbors === target);
        const isTooMany = (activeNeighbors > target);
        
        gridMetadata[y][x] = {
          activeNeighbors,
          target,
          isCorrect,
          isTooMany
        };

        if (!isCorrect) solved = false;
      }
    }

    return {
      solved: solved && activeTotal > 0,
      gridMetadata
    };
  }
}

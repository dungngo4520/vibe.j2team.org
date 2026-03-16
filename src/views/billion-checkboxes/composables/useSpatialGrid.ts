import { COLS, GRID_SIZE, GRID_COLS } from '../constants/gridConfig'

/**
 * Spatial grid composable for fast empty region detection
 * Divides the canvas into 256x256 blocks and tracks which blocks contain pixels
 */
export function useSpatialGrid() {
  const spatialGrid = new Set<number>() // Set of grid indices with pixels

  /**
   * Initialize spatial grid from an existing set of checked indices
   */
  function rebuildSpatialGrid(checkedSet: Set<number>) {
    spatialGrid.clear()
    for (const index of checkedSet) {
      const row = Math.floor(index / COLS)
      const col = index % COLS
      const gridRow = Math.floor(row / GRID_SIZE)
      const gridCol = Math.floor(col / GRID_SIZE)
      const gridIndex = gridRow * GRID_COLS + gridCol
      spatialGrid.add(gridIndex)
    }
  }

  /**
   * Update spatial grid when a pixel is added or removed
   */
  function updateSpatialGrid(index: number, isAdding: boolean) {
    const row = Math.floor(index / COLS)
    const col = index % COLS
    const gridRow = Math.floor(row / GRID_SIZE)
    const gridCol = Math.floor(col / GRID_SIZE)
    const gridIndex = gridRow * GRID_COLS + gridCol

    if (isAdding) {
      spatialGrid.add(gridIndex)
    } else {
      // Only remove from spatial grid if the entire grid cell is empty
      // (expensive check, so we skip it and accept false positives)
      // spatialGrid will be rebuilt on page reload
    }
  }

  return {
    spatialGrid,
    rebuildSpatialGrid,
    updateSpatialGrid,
  }
}

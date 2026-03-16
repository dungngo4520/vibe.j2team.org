import { shallowRef } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import { STORAGE_KEY, SAVE_DEBOUNCE_MS } from '../constants/gridConfig'

/**
 * Pixel state management with localStorage persistence
 */
export function usePixelState() {
  const checkedIndices = useLocalStorage<number[]>(STORAGE_KEY, [])
  // Use shallowRef + Set for 125MB bitmap (1B bits = 125MB)
  const checkedSet = shallowRef(new Set(checkedIndices.value))

  // Track pending changes for incremental save
  const pendingSaveIndices = new Set<number>()

  /**
   * Schedule a debounced save to localStorage
   */
  const scheduleSave = useDebounceFn(() => {
    // Only update localStorage with changed indices, not full array
    if (pendingSaveIndices.size > 0) {
      checkedIndices.value = Array.from(checkedSet.value)
      pendingSaveIndices.clear()
    }
  }, SAVE_DEBOUNCE_MS)

  /**
   * Toggle a pixel at the given index
   */
  function togglePixel(index: number): boolean {
    const newSet = new Set(checkedSet.value)
    const wasChecked = newSet.has(index)

    if (wasChecked) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }

    checkedSet.value = newSet
    pendingSaveIndices.add(index)
    scheduleSave()

    return !wasChecked // Return new state
  }

  /**
   * Set a pixel to a specific state (checked or unchecked)
   */
  function setPixel(index: number, checked: boolean) {
    const newSet = new Set(checkedSet.value)
    const wasChecked = newSet.has(index)

    if (checked && !wasChecked) {
      newSet.add(index)
      checkedSet.value = newSet
      pendingSaveIndices.add(index)
      scheduleSave()
    } else if (!checked && wasChecked) {
      newSet.delete(index)
      checkedSet.value = newSet
      pendingSaveIndices.add(index)
      scheduleSave()
    }
  }

  /**
   * Clear all pixels
   */
  function clearAll() {
    checkedSet.value = new Set()
    checkedIndices.value = []
    pendingSaveIndices.clear()
  }

  /**
   * Import state from an array of indices
   */
  function importState(indices: number[]) {
    checkedSet.value = new Set(indices)
    checkedIndices.value = indices
    pendingSaveIndices.clear()
  }

  /**
   * Export current state as an array of indices
   */
  function exportState(): number[] {
    return Array.from(checkedSet.value)
  }

  return {
    checkedSet,
    checkedIndices,
    togglePixel,
    setPixel,
    clearAll,
    importState,
    exportState,
  }
}

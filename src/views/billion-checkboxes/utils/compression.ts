/**
 * Run-Length Encoding for compression (supports 32-bit indices)
 * Converts a Set or array of indices into a compressed base64 string
 */
export function encodeRLE(indices: Set<number> | number[]): string {
  if (indices instanceof Set) {
    if (indices.size === 0) return ''
  } else if (indices.length === 0) return ''

  const sorted = Array.from(indices).sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  const encoded: number[] = []

  let start = sorted[0]!
  let end = sorted[0]!

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]!
    } else {
      encoded.push(start, end - start + 1)
      start = sorted[i]!
      end = sorted[i]!
    }
  }
  encoded.push(start, end - start + 1)

  // Encode as base64 string of 32-bit integers (limit to 2500 pairs = 5000 ints)
  const limit = Math.min(encoded.length, 5000)
  const bytes = new Uint8Array(limit * 4)
  for (let i = 0; i < limit; i++) {
    const val = encoded[i]!
    bytes[i * 4] = val & 0xff
    bytes[i * 4 + 1] = (val >> 8) & 0xff
    bytes[i * 4 + 2] = (val >> 16) & 0xff
    bytes[i * 4 + 3] = (val >> 24) & 0xff
  }

  // Convert Uint8Array to base64
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

/**
 * Decodes an RLE-compressed base64 string back into an array of indices
 */
export function decodeRLE(encoded: string): number[] {
  if (!encoded) return []
  try {
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const indices: number[] = []
    for (let i = 0; i < bytes.length; i += 8) {
      if (i + 7 >= bytes.length) break
      const start = bytes[i]! | (bytes[i + 1]! << 8) | (bytes[i + 2]! << 16) | (bytes[i + 3]! << 24)
      const len = bytes[i + 4]! | (bytes[i + 5]! << 8) | (bytes[i + 6]! << 16) | (bytes[i + 7]! << 24)
      for (let j = 0; j < len; j++) {
        indices.push(start + j)
      }
    }
    return indices
  } catch {
    return []
  }
}

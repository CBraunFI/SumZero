/**
 * Transform Algorithm Tests
 * Test geometric transformations as specified in the SumZero spec
 */

import { applyTransform, calculateAbsCells, getBounds, validateTransform } from '../../../src/core/geometry/Transform.js'

describe('Transform Algorithm', () => {
  const T4_PIECE = [[0,0],[1,0],[2,0],[1,1]] // T-tetromino

  test('transform normalization is idempotent', () => {
    const piece = [[1,1],[2,1],[1,2],[2,2]] // O4 offset
    const normalized = applyTransform(piece, { rot: 0, flipX: false })
    const renormalized = applyTransform(normalized, { rot: 0, flipX: false })

    expect(normalized).toEqual(renormalized)
    expect(normalized[0]).toEqual([0,0]) // Should start at origin
  })

  test('rotation round-trip returns to original', () => {
    let result = T4_PIECE

    // Apply 90° rotation 4 times
    for (let i = 0; i < 4; i++) {
      result = applyTransform(result, { rot: 90, flipX: false })
    }

    expect(result).toEqual(T4_PIECE)
  })

  test('flip twice returns to original', () => {
    let result = applyTransform(T4_PIECE, { rot: 0, flipX: true })
    result = applyTransform(result, { rot: 0, flipX: true })

    expect(result).toEqual(T4_PIECE)
  })

  test('90-degree rotation works correctly', () => {
    // T4: [[0,0],[1,0],[2,0],[1,1]] rotated 90° becomes [[1,0],[1,1],[1,2],[0,1]] then normalized to [[1,0],[1,1],[1,2],[0,1]]
    const rotated = applyTransform(T4_PIECE, { rot: 90, flipX: false })
    expect(rotated).toEqual([[1,0],[1,1],[1,2],[0,1]])
  })

  test('180-degree rotation works correctly', () => {
    const rotated = applyTransform(T4_PIECE, { rot: 180, flipX: false })
    expect(rotated).toEqual([[2,1],[1,1],[0,1],[1,0]])
  })

  test('horizontal flip works correctly', () => {
    const flipped = applyTransform(T4_PIECE, { rot: 0, flipX: true })
    expect(flipped).toEqual([[2,0],[1,0],[0,0],[1,1]])
  })

  test('calculateAbsCells works correctly', () => {
    const transformedCells = [[0,0],[1,0],[0,1]]
    const anchor = [3, 4]
    const absCells = calculateAbsCells(transformedCells, anchor)

    expect(absCells).toEqual([[3,4],[4,4],[3,5]])
  })

  test('getBounds calculates correct dimensions', () => {
    const cells = [[0,0],[1,0],[2,0],[1,1]]
    const bounds = getBounds(cells)

    expect(bounds).toEqual({ width: 3, height: 2 })
  })

  test('validateTransform accepts valid transforms', () => {
    expect(validateTransform({ rot: 0, flipX: false })).toBe(true)
    expect(validateTransform({ rot: 90, flipX: true })).toBe(true)
    expect(validateTransform({ rot: 270, flipX: false })).toBe(true)
  })

  test('validateTransform rejects invalid transforms', () => {
    expect(validateTransform({ rot: 45, flipX: false })).toBe(false)
    expect(validateTransform({ rot: 0, flipX: 'true' })).toBe(false)
    expect(validateTransform({ rot: 0 })).toBe(false)
    expect(validateTransform(null)).toBe(false)
  })
})
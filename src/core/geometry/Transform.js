/**
 * Geometric transformation algorithms for polyomino pieces
 * Implements the exact algorithm specified in the SumZero specification
 */

/**
 * Apply transformation to piece coordinates
 * @param {Array<Array<number>>} relCells - Array of relative coordinates [[dx,dy], ...]
 * @param {Object} transform - Transformation object {rot: 0|90|180|270, flipX: boolean}
 * @returns {Array<Array<number>>} Normalized transformed coordinates
 */
export function applyTransform(relCells, transform) {
  let result = [...relCells.map(cell => [...cell])]

  // 1. Apply horizontal flip (around Y-axis) if enabled
  if (transform.flipX) {
    result = result.map(([dx, dy]) => [-dx, dy])
  }

  // 2. Apply rotation (k * 90° counter-clockwise)
  const rotations = transform.rot / 90
  for (let i = 0; i < rotations; i++) {
    result = result.map(([dx, dy]) => [-dy, dx])
  }

  // 3. Normalization - translate to ensure min dx = 0 and min dy = 0
  const minDx = Math.min(...result.map(([dx, dy]) => dx))
  const minDy = Math.min(...result.map(([dx, dy]) => dy))
  result = result.map(([dx, dy]) => [dx - minDx, dy - minDy])

  return result
}

/**
 * Calculate absolute cell positions for a piece placement
 * @param {Array<Array<number>>} transformedCells - Transformed relative coordinates
 * @param {Array<number>} anchor - Anchor position [x, y]
 * @returns {Array<Array<number>>} Absolute cell positions
 */
export function calculateAbsCells(transformedCells, anchor) {
  const [anchorX, anchorY] = anchor
  return transformedCells.map(([dx, dy]) => [anchorX + dx, anchorY + dy])
}

/**
 * Get bounding box dimensions for transformed cells
 * @param {Array<Array<number>>} transformedCells - Transformed relative coordinates
 * @returns {Object} Bounding box {width, height}
 */
export function getBounds(transformedCells) {
  const maxDx = Math.max(...transformedCells.map(([dx, dy]) => dx))
  const maxDy = Math.max(...transformedCells.map(([dx, dy]) => dy))
  return { width: maxDx + 1, height: maxDy + 1 }
}

/**
 * Validate transform object
 * @param {Object} transform - Transform to validate
 * @returns {boolean} True if valid
 */
export function validateTransform(transform) {
  if (!transform || typeof transform !== 'object') {
    return false
  }

  const validRotations = [0, 90, 180, 270]
  return validRotations.includes(transform.rot) &&
         typeof transform.flipX === 'boolean'
}
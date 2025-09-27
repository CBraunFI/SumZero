/**
 * Board Shape Generator for SumZero
 * Creates interesting non-rectangular board layouts
 */

import { createEmptyBoard } from './Board.js'

/**
 * Generate different board shapes
 */
export class BoardShapes {

  /**
   * Create a board with the specified shape
   * @param {string} shapeType - Type of shape ('rectangular', 'cross', 'diamond', 'hexagonal', 'random')
   * @param {number} baseSize - Base size for the shape
   * @returns {Object} Board object
   */
  static createShapedBoard(shapeType, baseSize = 10) {
    switch (shapeType) {
      case 'cross':
        return this.createCrossBoard(baseSize)
      case 'diamond':
        return this.createDiamondBoard(baseSize)
      case 'hexagonal':
        return this.createHexagonalBoard(baseSize)
      case 'random':
        return this.createRandomBoard(baseSize)
      default:
        return createEmptyBoard(baseSize, baseSize)
    }
  }

  /**
   * Create a cross-shaped board
   */
  static createCrossBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const armWidth = Math.floor(size / 3)

    // Mark cells outside the cross as unusable (-1)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Keep center vertical arm
        if (x >= center - armWidth && x <= center + armWidth) {
          continue
        }
        // Keep center horizontal arm
        if (y >= center - armWidth && y <= center + armWidth) {
          continue
        }
        // Mark as unusable
        board.grid[y][x] = -1
      }
    }

    return board
  }

  /**
   * Create a diamond-shaped board
   */
  static createDiamondBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Manhattan distance from center
        const distance = Math.abs(x - center) + Math.abs(y - center)

        // If outside diamond, mark as unusable
        if (distance > center) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a hexagonal board
   */
  static createHexagonalBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const radius = Math.floor(size / 2) - 1

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Approximate hexagon using distance
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Also check for more hexagonal shape using different constraints
        const hexDistance = Math.max(
          Math.abs(dx),
          Math.abs(dy),
          Math.abs(dx + dy)
        )

        if (distance > radius || hexDistance > radius) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a random interesting shape
   */
  static createRandomBoard(size) {
    const shapes = ['cross', 'diamond', 'hexagonal']
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]
    return this.createShapedBoard(randomShape, size)
  }

  /**
   * Get a random varied board configuration
   */
  static getRandomVariedConfig() {
    const configs = [
      { shape: 'cross', size: 11 },
      { shape: 'diamond', size: 12 },
      { shape: 'hexagonal', size: 10 },
      { shape: 'cross', size: 9 },
      { shape: 'random', size: 10 }
    ]

    return configs[Math.floor(Math.random() * configs.length)]
  }
}
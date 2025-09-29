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
   * @param {string} shapeType - Type of shape ('rectangular', 'cross', 'diamond', 'hexagonal', 'lshape', 'plus', 'tshape', 'ushape', 'hourglass', 'star', 'triangle', 'arrow', 'bowtie', 'octagon', 'random')
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
      case 'lshape':
        return this.createLShapeBoard(baseSize)
      case 'plus':
        return this.createPlusBoard(baseSize)
      case 'tshape':
        return this.createTShapeBoard(baseSize)
      case 'ushape':
        return this.createUShapeBoard(baseSize)
      case 'hourglass':
        return this.createHourglassBoard(baseSize)
      case 'star':
        return this.createStarBoard(baseSize)
      case 'triangle':
        return this.createTriangleBoard(baseSize)
      case 'arrow':
        return this.createArrowBoard(baseSize)
      case 'bowtie':
        return this.createBowtieBoard(baseSize)
      case 'octagon':
        return this.createOctagonBoard(baseSize)
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
   * Create an L-shaped board
   */
  static createLShapeBoard(size) {
    const board = createEmptyBoard(size, size)
    const cornerSize = Math.floor(size * 0.6)

    // Mark cells outside the L-shape as unusable
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Keep bottom-left L shape
        if (x < cornerSize || y >= size - cornerSize) {
          continue
        }
        // Mark as unusable
        board.grid[y][x] = -1
      }
    }

    return board
  }

  /**
   * Create a plus/cross-shaped board (different from cross - more precise)
   */
  static createPlusBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const armWidth = Math.max(1, Math.floor(size / 5))

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Keep vertical arm
        if (x >= center - armWidth && x <= center + armWidth) {
          continue
        }
        // Keep horizontal arm
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
   * Create a T-shaped board
   */
  static createTShapeBoard(size) {
    const board = createEmptyBoard(size, size)
    const stemWidth = Math.floor(size / 4)
    const stemStart = Math.floor(size / 3)
    const center = Math.floor(size / 2)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Keep top horizontal bar
        if (y < stemStart) {
          continue
        }
        // Keep vertical stem
        if (x >= center - stemWidth && x <= center + stemWidth) {
          continue
        }
        // Mark as unusable
        board.grid[y][x] = -1
      }
    }

    return board
  }

  /**
   * Create a U-shaped board
   */
  static createUShapeBoard(size) {
    const board = createEmptyBoard(size, size)
    const wallWidth = Math.floor(size / 4)
    const openingHeight = Math.floor(size / 3)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Keep left wall
        if (x < wallWidth) {
          continue
        }
        // Keep right wall
        if (x >= size - wallWidth) {
          continue
        }
        // Keep bottom
        if (y >= size - openingHeight) {
          continue
        }
        // Mark center opening as unusable for upper part
        if (y < size - openingHeight) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create an hourglass-shaped board
   */
  static createHourglassBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const neckWidth = Math.max(1, Math.floor(size / 6))

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Calculate how narrow the hourglass should be at this height
        const distanceFromCenter = Math.abs(y - center)
        const widthAtHeight = neckWidth + Math.floor((distanceFromCenter / center) * (size / 2 - neckWidth))

        // Keep cells within the hourglass width
        if (x >= center - widthAtHeight && x <= center + widthAtHeight) {
          continue
        }

        board.grid[y][x] = -1
      }
    }

    return board
  }

  /**
   * Create a star-shaped board
   */
  static createStarBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const innerRadius = Math.floor(size / 4)
    const outerRadius = Math.floor(size / 2) - 1

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // Create 6-pointed star pattern
        const starPoint = Math.cos(6 * angle)
        const effectiveRadius = innerRadius + (outerRadius - innerRadius) * (0.5 + 0.5 * starPoint)

        if (distance > effectiveRadius) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a triangle-shaped board
   */
  static createTriangleBoard(size) {
    const board = createEmptyBoard(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Triangle: keep cells where x is within the triangle bounds for this y
        const triangleWidth = Math.floor((size - y) * size / size)
        const triangleStart = Math.floor((size - triangleWidth) / 2)
        const triangleEnd = triangleStart + triangleWidth

        if (x < triangleStart || x >= triangleEnd) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create an arrow-shaped board
   */
  static createArrowBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const shaftWidth = Math.floor(size / 4)
    const arrowheadStart = Math.floor(size / 3)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Arrow shaft (right side)
        if (y >= center - shaftWidth && y <= center + shaftWidth && x >= arrowheadStart) {
          continue
        }

        // Arrowhead (left side)
        if (x < arrowheadStart) {
          const arrowheadWidth = Math.floor((arrowheadStart - x) * size / arrowheadStart / 2)
          if (y >= center - arrowheadWidth && y <= center + arrowheadWidth) {
            continue
          }
        }

        board.grid[y][x] = -1
      }
    }

    return board
  }

  /**
   * Create a bowtie-shaped board
   */
  static createBowtieBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = Math.abs(x - center)
        const dy = Math.abs(y - center)

        // Bowtie shape: two triangles connected at center
        const triangleEdge = (size / 2) - Math.max(dx, dy)

        if (triangleEdge <= 0) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create an octagon-shaped board
   */
  static createOctagonBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const radius = Math.floor(size / 2) - 1
    const cutoff = Math.floor(radius * 0.7) // Octagon cut-off factor

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = Math.abs(x - center)
        const dy = Math.abs(y - center)

        // Octagon: combine square and diamond constraints
        if (dx > cutoff && dy > cutoff && (dx + dy) > radius) {
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
    const shapes = [
      'cross', 'diamond', 'hexagonal', 'lshape', 'plus', 'tshape',
      'ushape', 'hourglass', 'star', 'triangle', 'arrow', 'bowtie', 'octagon'
    ]
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
      { shape: 'lshape', size: 11 },
      { shape: 'plus', size: 10 },
      { shape: 'tshape', size: 12 },
      { shape: 'ushape', size: 11 },
      { shape: 'hourglass', size: 10 },
      { shape: 'star', size: 11 },
      { shape: 'triangle', size: 12 },
      { shape: 'arrow', size: 11 },
      { shape: 'bowtie', size: 10 },
      { shape: 'octagon', size: 11 },
      { shape: 'random', size: 10 }
    ]

    return configs[Math.floor(Math.random() * configs.length)]
  }
}
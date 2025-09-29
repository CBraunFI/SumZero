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
   * @param {string} shapeType - Type of shape
   * @param {number} baseSize - Base size for the shape
   * @param {boolean} addHoles - Whether to add random holes for difficulty
   * @returns {Object} Board object
   */
  static createShapedBoard(shapeType, baseSize = 10, addHoles = true) {
    let board

    switch (shapeType) {
      case 'cross':
        board = this.createCrossBoard(baseSize)
        break
      case 'diamond':
        board = this.createDiamondBoard(baseSize)
        break
      case 'hexagonal':
        board = this.createHexagonalBoard(baseSize)
        break
      case 'lshape':
        board = this.createLShapeBoard(baseSize)
        break
      case 'plus':
        board = this.createPlusBoard(baseSize)
        break
      case 'tshape':
        board = this.createTShapeBoard(baseSize)
        break
      case 'ushape':
        board = this.createUShapeBoard(baseSize)
        break
      case 'hourglass':
        board = this.createHourglassBoard(baseSize)
        break
      case 'star':
        board = this.createStarBoard(baseSize)
        break
      case 'triangle':
        board = this.createTriangleBoard(baseSize)
        break
      case 'arrow':
        board = this.createArrowBoard(baseSize)
        break
      case 'bowtie':
        board = this.createBowtieBoard(baseSize)
        break
      case 'octagon':
        board = this.createOctagonBoard(baseSize)
        break
      case 'pentagon':
        board = this.createPentagonBoard(baseSize)
        break
      case 'spiral':
        board = this.createSpiralBoard(baseSize)
        break
      case 'zigzag':
        board = this.createZigzagBoard(baseSize)
        break
      case 'ring':
        board = this.createRingBoard(baseSize)
        break
      case 'random':
        board = this.createRandomBoard(baseSize, addHoles)
        break
      default:
        board = createEmptyBoard(baseSize, baseSize)
    }

    // Add random holes for increased difficulty (except for random which handles its own)
    if (addHoles && shapeType !== 'random') {
      board = this.addRandomHoles(board)
    }

    return board
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
   * Create a pentagon-shaped board
   */
  static createPentagonBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const radius = Math.floor(size / 2) - 1

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // Create 5-sided polygon
        const pentagonSide = Math.cos(5 * (angle + Math.PI / 5))
        const effectiveRadius = radius * (0.7 + 0.3 * pentagonSide)

        if (distance > effectiveRadius) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a spiral-shaped board
   */
  static createSpiralBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // Create spiral pattern
        const spiralRadius = (angle + Math.PI) / (2 * Math.PI) * (size / 3)
        const spiralThickness = 2

        if (Math.abs(distance - spiralRadius) > spiralThickness || distance > size / 2 - 1) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a zigzag-shaped board
   */
  static createZigzagBoard(size) {
    const board = createEmptyBoard(size, size)
    const amplitude = Math.floor(size / 4)
    const frequency = 2

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Create zigzag pattern
        const zigzagCenter = Math.floor(size / 2) + amplitude * Math.sin(y * frequency * Math.PI / size)
        const zigzagWidth = Math.floor(size / 4)

        if (Math.abs(x - zigzagCenter) > zigzagWidth) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Create a ring-shaped board
   */
  static createRingBoard(size) {
    const board = createEmptyBoard(size, size)
    const center = Math.floor(size / 2)
    const outerRadius = Math.floor(size / 2) - 1
    const innerRadius = Math.floor(size / 4)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Ring: keep cells between inner and outer radius
        if (distance > outerRadius || distance < innerRadius) {
          board.grid[y][x] = -1
        }
      }
    }

    return board
  }

  /**
   * Add random holes to a board for increased difficulty
   */
  static addRandomHoles(board) {
    const totalCells = board.rows * board.cols
    let playableCells = 0

    // Count current playable cells
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        if (board.grid[y][x] === 0) {
          playableCells++
        }
      }
    }

    // Add holes: 3-8% of playable cells become holes
    const holePercentage = 0.03 + Math.random() * 0.05 // 3-8%
    const numHoles = Math.floor(playableCells * holePercentage)
    const holes = new Set()

    for (let i = 0; i < numHoles; i++) {
      let attempts = 0
      while (attempts < 50) { // Prevent infinite loop
        const x = Math.floor(Math.random() * board.cols)
        const y = Math.floor(Math.random() * board.rows)
        const key = `${x},${y}`

        if (!holes.has(key) && board.grid[y][x] === 0) {
          // Don't create holes that would isolate large areas
          if (!this.wouldIsolateArea(board, x, y)) {
            board.grid[y][x] = -1
            holes.add(key)
            break
          }
        }
        attempts++
      }
    }

    return board
  }

  /**
   * Check if creating a hole at position would isolate a large area
   */
  static wouldIsolateArea(board, holeX, holeY) {
    // Temporarily place hole
    const original = board.grid[holeY][holeX]
    board.grid[holeY][holeX] = -1

    // Check connected areas around the hole
    const visited = new Set()
    let largestArea = 0

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const x = holeX + dx
      const y = holeY + dy
      if (x >= 0 && x < board.cols && y >= 0 && y < board.rows) {
        const key = `${x},${y}`
        if (!visited.has(key) && board.grid[y][x] === 0) {
          const areaSize = this.countConnectedArea(board, x, y, visited)
          largestArea = Math.max(largestArea, areaSize)
        }
      }
    }

    // Restore original value
    board.grid[holeY][holeX] = original

    // Don't allow holes that would create areas smaller than 8 cells
    return largestArea < 8
  }

  /**
   * Count connected empty area (for hole validation)
   */
  static countConnectedArea(board, x, y, visited) {
    const key = `${x},${y}`
    if (visited.has(key)) return 0
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) return 0
    if (board.grid[y][x] !== 0) return 0

    visited.add(key)
    let area = 1

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      area += this.countConnectedArea(board, x + dx, y + dy, visited)
    }

    return area
  }

  /**
   * Create a random interesting shape
   */
  static createRandomBoard(size, addHoles = true) {
    const shapes = [
      'cross', 'diamond', 'hexagonal', 'lshape', 'plus', 'tshape',
      'ushape', 'hourglass', 'star', 'triangle', 'arrow', 'bowtie',
      'octagon', 'pentagon', 'spiral', 'zigzag', 'ring'
    ]
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]
    return this.createShapedBoard(randomShape, size, addHoles)
  }

  /**
   * Get a random varied board configuration with equal probability for all shapes
   */
  static getRandomVariedConfig() {
    // All unique board shapes (17 total) - equal probability for each
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
      { shape: 'pentagon', size: 10 },
      { shape: 'spiral', size: 12 },
      { shape: 'zigzag', size: 11 },
      { shape: 'ring', size: 10 }
    ]

    // Each shape has exactly equal probability (1/17 ≈ 5.88%)
    return configs[Math.floor(Math.random() * configs.length)]
  }

  /**
   * Get all available board shape names
   */
  static getAllShapeNames() {
    return [
      'cross', 'diamond', 'hexagonal', 'lshape', 'plus', 'tshape',
      'ushape', 'hourglass', 'star', 'triangle', 'arrow', 'bowtie',
      'octagon', 'pentagon', 'spiral', 'zigzag', 'ring'
    ]
  }

  /**
   * Get statistics about board shape distribution
   */
  static getShapeStatistics() {
    const shapes = this.getAllShapeNames()
    return {
      totalShapes: shapes.length,
      probabilityPerShape: `${(100 / shapes.length).toFixed(2)}%`,
      shapes: shapes
    }
  }
}
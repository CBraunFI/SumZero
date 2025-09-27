/**
 * Pattern Recognition Engine for SumZero Scoring System
 * Identifies geometric patterns and calculates points for strategic play
 */

/**
 * Pattern definitions with point values
 */
export const PATTERN_DEFINITIONS = {
  // Simple Linear Patterns (5-15 points)
  SHORT_LINE_4: { points: 5, type: 'line', length: 4 },
  SHORT_LINE_5: { points: 6, type: 'line', length: 5 },
  MEDIUM_LINE_6: { points: 8, type: 'line', length: 6 },
  MEDIUM_LINE_7: { points: 9, type: 'line', length: 7 },
  DIAGONAL_CHAIN_4: { points: 6, type: 'diagonal', length: 4 },
  DIAGONAL_CHAIN_5: { points: 7, type: 'diagonal', length: 5 },

  // Simple Shapes (7-15 points)
  SMALL_RECTANGLE_2x3: { points: 7, type: 'rectangle', width: 2, height: 3 },
  SMALL_RECTANGLE_3x2: { points: 7, type: 'rectangle', width: 3, height: 2 },
  MINI_SQUARE_3x3: { points: 10, type: 'square', size: 3 },
  CORNER_CONTROL: { points: 12, type: 'territory', subtype: 'corner' },
  EDGE_CONTROL: { points: 15, type: 'territory', subtype: 'edge' },

  // Medium Linear Patterns (15-25 points)
  LONG_LINE_8: { points: 15, type: 'line', length: 8 },
  LONG_LINE_9: { points: 18, type: 'line', length: 9 },
  LONG_LINE_10: { points: 20, type: 'line', length: 10 },
  FULL_ROW: { points: 25, type: 'complete', subtype: 'row' },
  FULL_COLUMN: { points: 25, type: 'complete', subtype: 'column' },

  // Medium Shapes (18-30 points)
  LARGE_RECTANGLE_3x4: { points: 18, type: 'rectangle', width: 3, height: 4 },
  LARGE_RECTANGLE_4x3: { points: 18, type: 'rectangle', width: 4, height: 3 },
  LARGE_RECTANGLE_2x6: { points: 16, type: 'rectangle', width: 2, height: 6 },
  LARGE_SQUARE_4x4: { points: 22, type: 'square', size: 4 },
  LARGE_SQUARE_5x5: { points: 30, type: 'square', size: 5 },

  // Strategic Territory (20-28 points)
  CENTER_DOMINANCE_4x4: { points: 20, type: 'territory', subtype: 'center', size: 4 },
  CENTER_DOMINANCE_5x5: { points: 25, type: 'territory', subtype: 'center', size: 5 },
  ENCLOSURE: { points: 20, type: 'territory', subtype: 'enclosure' }
}

/**
 * Main Pattern Recognition Engine
 */
export class PatternRecognizer {
  constructor(board) {
    this.board = board
    this.recognizedPatterns = new Map()
  }

  /**
   * Calculate new points earned from a move
   * @param {number} playerId - Player who made the move
   * @param {Array} newCells - Cells added by the new piece
   * @returns {Object} Scoring result with total points and pattern details
   */
  calculateNewPoints(playerId, newCells) {
    const allPlayerCells = this.getAllPlayerCells(playerId)
    const allPatterns = this.recognizePatterns(allPlayerCells)
    const resolvedPatterns = this.resolveOverlappingPatterns(allPatterns)

    // Calculate points only for patterns that include at least one new cell
    const newPatterns = resolvedPatterns.filter(pattern =>
      this.patternIncludesNewCells(pattern, newCells)
    )

    const totalPoints = newPatterns.reduce((sum, pattern) => sum + pattern.points, 0)

    return {
      totalPoints,
      patterns: newPatterns,
      allPatterns: resolvedPatterns
    }
  }

  /**
   * Get all cells belonging to a player
   * @param {number} playerId - Player ID
   * @returns {Array} Array of [x, y] coordinates
   */
  getAllPlayerCells(playerId) {
    const cells = []
    for (let y = 0; y < this.board.rows; y++) {
      for (let x = 0; x < this.board.cols; x++) {
        if (this.board.grid[y][x] === playerId) {
          cells.push([x, y])
        }
      }
    }
    return cells
  }

  /**
   * Main pattern recognition function
   * @param {Array} playerCells - All cells belonging to the player
   * @returns {Array} Array of recognized patterns
   */
  recognizePatterns(playerCells) {
    const patterns = []

    // Find all pattern types
    patterns.push(...this.findLinearPatterns(playerCells))
    patterns.push(...this.findRectangularPatterns(playerCells))
    patterns.push(...this.findTerritoryPatterns(playerCells))

    return patterns
  }

  /**
   * Find horizontal, vertical, and diagonal line patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of line patterns
   */
  findLinearPatterns(cells) {
    const patterns = []
    const cellSet = new Set(cells.map(([x, y]) => `${x},${y}`))
    const processed = new Set()

    // Find horizontal lines
    for (const [startX, y] of cells) {
      const key = `h:${startX},${y}`
      if (processed.has(key)) continue

      let length = 0
      let x = startX
      const lineCells = []

      while (cellSet.has(`${x},${y}`)) {
        lineCells.push([x, y])
        processed.add(`h:${x},${y}`)
        length++
        x++
      }

      if (length >= 4) {
        patterns.push(this.createLinePattern(lineCells, length, 'horizontal'))
      }
    }

    // Find vertical lines
    for (const [x, startY] of cells) {
      const key = `v:${x},${startY}`
      if (processed.has(key)) continue

      let length = 0
      let y = startY
      const lineCells = []

      while (cellSet.has(`${x},${y}`)) {
        lineCells.push([x, y])
        processed.add(`v:${x},${y}`)
        length++
        y++
      }

      if (length >= 4) {
        patterns.push(this.createLinePattern(lineCells, length, 'vertical'))
      }
    }

    // Find diagonal lines (both directions)
    patterns.push(...this.findDiagonalLines(cells, cellSet))

    return patterns
  }

  /**
   * Find diagonal line patterns
   * @param {Array} cells - Player cells
   * @param {Set} cellSet - Set of cell coordinates as strings
   * @returns {Array} Array of diagonal patterns
   */
  findDiagonalLines(cells, cellSet) {
    const patterns = []
    const processed = new Set()

    // Main diagonal (top-left to bottom-right)
    for (const [startX, startY] of cells) {
      const key = `d1:${startX},${startY}`
      if (processed.has(key)) continue

      let length = 0
      let x = startX, y = startY
      const lineCells = []

      while (cellSet.has(`${x},${y}`)) {
        lineCells.push([x, y])
        processed.add(`d1:${x},${y}`)
        length++
        x++
        y++
      }

      if (length >= 4) {
        patterns.push(this.createLinePattern(lineCells, length, 'diagonal'))
      }
    }

    // Anti-diagonal (top-right to bottom-left)
    for (const [startX, startY] of cells) {
      const key = `d2:${startX},${startY}`
      if (processed.has(key)) continue

      let length = 0
      let x = startX, y = startY
      const lineCells = []

      while (cellSet.has(`${x},${y}`)) {
        lineCells.push([x, y])
        processed.add(`d2:${x},${y}`)
        length++
        x--
        y++
      }

      if (length >= 4) {
        patterns.push(this.createLinePattern(lineCells, length, 'diagonal'))
      }
    }

    return patterns
  }

  /**
   * Create a line pattern object
   * @param {Array} cells - Cells in the line
   * @param {number} length - Length of the line
   * @param {string} direction - Direction of the line
   * @returns {Object} Pattern object
   */
  createLinePattern(cells, length, direction) {
    let patternId
    let points

    if (direction === 'diagonal') {
      if (length === 4) patternId = 'DIAGONAL_CHAIN_4'
      else if (length === 5) patternId = 'DIAGONAL_CHAIN_5'
      else patternId = 'DIAGONAL_CHAIN_LONG'
      points = PATTERN_DEFINITIONS[patternId]?.points || (length * 2)
    } else {
      // Horizontal or vertical
      if (length === 4) patternId = 'SHORT_LINE_4'
      else if (length === 5) patternId = 'SHORT_LINE_5'
      else if (length === 6) patternId = 'MEDIUM_LINE_6'
      else if (length === 7) patternId = 'MEDIUM_LINE_7'
      else if (length === 8) patternId = 'LONG_LINE_8'
      else if (length === 9) patternId = 'LONG_LINE_9'
      else if (length === 10) patternId = 'LONG_LINE_10'
      else patternId = 'EXTRA_LONG_LINE'

      // Check for complete row/column
      if (direction === 'horizontal' && length === this.board.cols) {
        patternId = 'FULL_ROW'
      } else if (direction === 'vertical' && length === this.board.rows) {
        patternId = 'FULL_COLUMN'
      }

      points = PATTERN_DEFINITIONS[patternId]?.points || Math.min(30, length * 3)
    }

    return {
      id: patternId,
      type: 'line',
      direction,
      length,
      points,
      cells,
      priority: length
    }
  }

  /**
   * Find rectangular and square patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of rectangular patterns
   */
  findRectangularPatterns(cells) {
    const patterns = []
    const cellSet = new Set(cells.map(([x, y]) => `${x},${y}`))

    // Try different rectangle sizes
    for (let width = 2; width <= Math.min(6, this.board.cols); width++) {
      for (let height = 2; height <= Math.min(6, this.board.rows); height++) {
        patterns.push(...this.findRectanglesOfSize(cellSet, width, height))
      }
    }

    return patterns
  }

  /**
   * Find all rectangles of a specific size
   * @param {Set} cellSet - Set of player cells
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {Array} Array of rectangle patterns
   */
  findRectanglesOfSize(cellSet, width, height) {
    const patterns = []
    const processed = new Set()

    for (let startY = 0; startY <= this.board.rows - height; startY++) {
      for (let startX = 0; startX <= this.board.cols - width; startX++) {
        const rectKey = `rect:${startX},${startY},${width},${height}`
        if (processed.has(rectKey)) continue

        if (this.isCompleteRectangle(cellSet, startX, startY, width, height)) {
          const rectCells = this.getRectangleCells(startX, startY, width, height)

          // Mark all positions this rectangle covers as processed
          for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
              processed.add(`rect:${startX + dx},${startY + dy},${width},${height}`)
            }
          }

          patterns.push(this.createRectanglePattern(rectCells, width, height))
        }
      }
    }

    return patterns
  }

  /**
   * Check if a rectangle is completely filled
   * @param {Set} cellSet - Set of player cells
   * @param {number} startX - Rectangle start X
   * @param {number} startY - Rectangle start Y
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {boolean} True if rectangle is complete
   */
  isCompleteRectangle(cellSet, startX, startY, width, height) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (!cellSet.has(`${startX + dx},${startY + dy}`)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Get all cells in a rectangle
   * @param {number} startX - Rectangle start X
   * @param {number} startY - Rectangle start Y
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {Array} Array of cell coordinates
   */
  getRectangleCells(startX, startY, width, height) {
    const cells = []
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        cells.push([startX + dx, startY + dy])
      }
    }
    return cells
  }

  /**
   * Create a rectangle pattern object
   * @param {Array} cells - Cells in the rectangle
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {Object} Pattern object
   */
  createRectanglePattern(cells, width, height) {
    let patternId
    let points

    if (width === height) {
      // Square
      if (width === 3) patternId = 'MINI_SQUARE_3x3'
      else if (width === 4) patternId = 'LARGE_SQUARE_4x4'
      else if (width === 5) patternId = 'LARGE_SQUARE_5x5'
      else patternId = 'EXTRA_LARGE_SQUARE'
      points = PATTERN_DEFINITIONS[patternId]?.points || (width * height * 2)
    } else {
      // Rectangle
      const key = `${Math.min(width, height)}x${Math.max(width, height)}`
      if (key === '2x3') patternId = 'SMALL_RECTANGLE_2x3'
      else if (key === '3x4') patternId = 'LARGE_RECTANGLE_3x4'
      else if (key === '2x6') patternId = 'LARGE_RECTANGLE_2x6'
      else patternId = 'CUSTOM_RECTANGLE'
      points = PATTERN_DEFINITIONS[patternId]?.points || (width * height * 1.5)
    }

    return {
      id: patternId,
      type: width === height ? 'square' : 'rectangle',
      width,
      height,
      points,
      cells,
      priority: width * height
    }
  }

  /**
   * Find territory control patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of territory patterns
   */
  findTerritoryPatterns(cells) {
    const patterns = []

    patterns.push(...this.findCornerControl(cells))
    patterns.push(...this.findEdgeControl(cells))
    patterns.push(...this.findCenterDominance(cells))
    patterns.push(...this.findEnclosures(cells))

    return patterns
  }

  /**
   * Find corner control patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of corner control patterns
   */
  findCornerControl(cells) {
    const patterns = []
    const cellSet = new Set(cells.map(([x, y]) => `${x},${y}`))

    const corners = [
      [0, 0], // Top-left
      [this.board.cols - 3, 0], // Top-right
      [0, this.board.rows - 3], // Bottom-left
      [this.board.cols - 3, this.board.rows - 3] // Bottom-right
    ]

    for (const [cornerX, cornerY] of corners) {
      if (cornerX < 0 || cornerY < 0) continue

      let controlledCells = 0
      const cornerCells = []

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const x = cornerX + dx
          const y = cornerY + dy
          if (x < this.board.cols && y < this.board.rows) {
            cornerCells.push([x, y])
            if (cellSet.has(`${x},${y}`)) {
              controlledCells++
            }
          }
        }
      }

      // Require at least 75% control (7 out of 9 cells)
      if (controlledCells >= 7) {
        patterns.push({
          id: 'CORNER_CONTROL',
          type: 'territory',
          subtype: 'corner',
          points: PATTERN_DEFINITIONS.CORNER_CONTROL.points,
          cells: cornerCells.filter(([x, y]) => cellSet.has(`${x},${y}`)),
          priority: controlledCells
        })
      }
    }

    return patterns
  }

  /**
   * Find edge control patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of edge control patterns
   */
  findEdgeControl(cells) {
    const patterns = []
    const cellSet = new Set(cells.map(([x, y]) => `${x},${y}`))

    // Check each edge
    const edges = [
      { type: 'top', cells: Array.from({length: this.board.cols}, (_, x) => [x, 0]) },
      { type: 'bottom', cells: Array.from({length: this.board.cols}, (_, x) => [x, this.board.rows - 1]) },
      { type: 'left', cells: Array.from({length: this.board.rows}, (_, y) => [0, y]) },
      { type: 'right', cells: Array.from({length: this.board.rows}, (_, y) => [this.board.cols - 1, y]) }
    ]

    for (const edge of edges) {
      let controlledCells = 0
      const edgeCells = []

      for (const [x, y] of edge.cells) {
        if (cellSet.has(`${x},${y}`)) {
          controlledCells++
          edgeCells.push([x, y])
        }
      }

      // Require at least 80% control
      const requiredControl = Math.ceil(edge.cells.length * 0.8)
      if (controlledCells >= requiredControl) {
        patterns.push({
          id: 'EDGE_CONTROL',
          type: 'territory',
          subtype: 'edge',
          edge: edge.type,
          points: PATTERN_DEFINITIONS.EDGE_CONTROL.points,
          cells: edgeCells,
          priority: controlledCells
        })
      }
    }

    return patterns
  }

  /**
   * Find center dominance patterns
   * @param {Array} cells - Player cells
   * @returns {Array} Array of center dominance patterns
   */
  findCenterDominance(cells) {
    const patterns = []
    const cellSet = new Set(cells.map(([x, y]) => `${x},${y}`))

    const centerX = Math.floor(this.board.cols / 2)
    const centerY = Math.floor(this.board.rows / 2)

    // Check 4x4 and 5x5 center areas
    for (const size of [4, 5]) {
      const startX = centerX - Math.floor(size / 2)
      const startY = centerY - Math.floor(size / 2)

      if (startX < 0 || startY < 0 ||
          startX + size > this.board.cols ||
          startY + size > this.board.rows) {
        continue
      }

      let controlledCells = 0
      const centerCells = []

      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = startX + dx
          const y = startY + dy
          centerCells.push([x, y])
          if (cellSet.has(`${x},${y}`)) {
            controlledCells++
          }
        }
      }

      // Require 75% control
      const requiredControl = Math.ceil(size * size * 0.75)
      if (controlledCells >= requiredControl) {
        const patternId = size === 4 ? 'CENTER_DOMINANCE_4x4' : 'CENTER_DOMINANCE_5x5'
        patterns.push({
          id: patternId,
          type: 'territory',
          subtype: 'center',
          size,
          points: PATTERN_DEFINITIONS[patternId].points,
          cells: centerCells.filter(([x, y]) => cellSet.has(`${x},${y}`)),
          priority: controlledCells
        })
      }
    }

    return patterns
  }

  /**
   * Find enclosure patterns (surrounding opponent pieces)
   * @param {Array} cells - Player cells
   * @returns {Array} Array of enclosure patterns
   */
  findEnclosures(cells) {
    // This is a simplified version - a full implementation would need
    // to identify opponent pieces that are completely surrounded
    // For now, return empty array
    return []
  }

  /**
   * Resolve overlapping patterns (each cell can only contribute to highest-value pattern)
   * @param {Array} patterns - All recognized patterns
   * @returns {Array} Non-overlapping patterns
   */
  resolveOverlappingPatterns(patterns) {
    if (patterns.length === 0) return []

    // Sort patterns by points (descending) then by priority
    patterns.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return (b.priority || 0) - (a.priority || 0)
    })

    const usedCells = new Set()
    const resolvedPatterns = []

    for (const pattern of patterns) {
      // Check if any cells in this pattern are already used
      const hasOverlap = pattern.cells.some(([x, y]) => usedCells.has(`${x},${y}`))

      if (!hasOverlap) {
        // No overlap, add this pattern
        resolvedPatterns.push(pattern)
        pattern.cells.forEach(([x, y]) => usedCells.add(`${x},${y}`))
      }
    }

    return resolvedPatterns
  }

  /**
   * Check if a pattern includes any of the newly placed cells
   * @param {Object} pattern - Pattern to check
   * @param {Array} newCells - Newly placed cells
   * @returns {boolean} True if pattern includes new cells
   */
  patternIncludesNewCells(pattern, newCells) {
    const newCellSet = new Set(newCells.map(([x, y]) => `${x},${y}`))
    return pattern.cells.some(([x, y]) => newCellSet.has(`${x},${y}`))
  }
}
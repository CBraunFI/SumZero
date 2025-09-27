/**
 * Unit tests for Pattern Recognition System
 * Tests pattern detection, scoring calculation, and overlap resolution
 */

import { PatternRecognizer, PATTERN_DEFINITIONS } from '../../../src/core/scoring/PatternRecognizer.js'
import { createEmptyBoard } from '../../../src/core/board/Board.js'

describe('PatternRecognizer', () => {
  let board
  let recognizer

  beforeEach(() => {
    board = createEmptyBoard(10, 10)
    recognizer = new PatternRecognizer(board)
  })

  describe('Linear Pattern Detection', () => {
    test('should detect horizontal line patterns', () => {
      // Create a horizontal line of 4 cells
      const playerCells = [[0, 0], [1, 0], [2, 0], [3, 0]]

      // Set up board state
      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findLinearPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].type).toBe('line')
      expect(patterns[0].direction).toBe('horizontal')
      expect(patterns[0].length).toBe(4)
      expect(patterns[0].points).toBe(PATTERN_DEFINITIONS.SHORT_LINE_4.points)
    })

    test('should detect vertical line patterns', () => {
      // Create a vertical line of 5 cells
      const playerCells = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findLinearPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].type).toBe('line')
      expect(patterns[0].direction).toBe('vertical')
      expect(patterns[0].length).toBe(5)
      expect(patterns[0].points).toBe(PATTERN_DEFINITIONS.SHORT_LINE_5.points)
    })

    test('should detect diagonal line patterns', () => {
      // Create a diagonal line
      const playerCells = [[0, 0], [1, 1], [2, 2], [3, 3]]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findLinearPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].type).toBe('line')
      expect(patterns[0].direction).toBe('diagonal')
      expect(patterns[0].length).toBe(4)
    })

    test('should detect complete row pattern', () => {
      // Fill entire row
      const playerCells = []
      for (let x = 0; x < board.cols; x++) {
        playerCells.push([x, 5])
        board.grid[5][x] = 1
      }

      const patterns = recognizer.findLinearPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].id).toBe('FULL_ROW')
      expect(patterns[0].points).toBe(PATTERN_DEFINITIONS.FULL_ROW.points)
    })

    test('should not detect lines shorter than 4 cells', () => {
      const playerCells = [[0, 0], [1, 0], [2, 0]] // Only 3 cells

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findLinearPatterns(playerCells)
      expect(patterns.length).toBe(0)
    })
  })

  describe('Rectangular Pattern Detection', () => {
    test('should detect small rectangles', () => {
      // Create a 2x3 rectangle
      const playerCells = [
        [0, 0], [1, 0],
        [0, 1], [1, 1],
        [0, 2], [1, 2]
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findRectangularPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].type).toBe('rectangle')
      expect(patterns[0].width).toBe(2)
      expect(patterns[0].height).toBe(3)
    })

    test('should detect squares', () => {
      // Create a 3x3 square
      const playerCells = [
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1],
        [0, 2], [1, 2], [2, 2]
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findRectangularPatterns(playerCells)

      expect(patterns.length).toBe(1)
      expect(patterns[0].type).toBe('square')
      expect(patterns[0].width).toBe(3)
      expect(patterns[0].height).toBe(3)
      expect(patterns[0].id).toBe('MINI_SQUARE_3x3')
    })

    test('should not detect incomplete rectangles', () => {
      // Incomplete 2x3 rectangle (missing one cell)
      const playerCells = [
        [0, 0], [1, 0],
        [0, 1], [1, 1],
        [0, 2] // Missing [1, 2]
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findRectangularPatterns(playerCells)
      expect(patterns.length).toBe(0)
    })
  })

  describe('Territory Pattern Detection', () => {
    test('should detect corner control', () => {
      // Fill most of top-left 3x3 corner
      const playerCells = [
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1],
        [0, 2], [1, 2], [2, 2]
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const patterns = recognizer.findTerritoryPatterns(playerCells)

      const cornerPatterns = patterns.filter(p => p.subtype === 'corner')
      expect(cornerPatterns.length).toBeGreaterThan(0)
      expect(cornerPatterns[0].points).toBe(PATTERN_DEFINITIONS.CORNER_CONTROL.points)
    })

    test('should detect center dominance', () => {
      // Fill center 4x4 area (75% control)
      const centerStart = Math.floor(board.cols / 2) - 2
      const playerCells = []

      // Fill 12 out of 16 cells (75%)
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 3; dx++) { // Only 3 out of 4 columns
          if (centerStart + dx < board.cols && centerStart + dy < board.rows) {
            playerCells.push([centerStart + dx, centerStart + dy])
            board.grid[centerStart + dy][centerStart + dx] = 1
          }
        }
      }

      const patterns = recognizer.findTerritoryPatterns(playerCells)

      const centerPatterns = patterns.filter(p => p.subtype === 'center')
      expect(centerPatterns.length).toBeGreaterThan(0)
    })
  })

  describe('Pattern Overlap Resolution', () => {
    test('should prioritize higher-value patterns', () => {
      // Create cells that could form both a line and a rectangle
      const playerCells = [
        [0, 0], [1, 0], [2, 0], [3, 0], // 4-cell line
        [0, 1], [1, 1] // Additional cells that could form rectangles
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const allPatterns = recognizer.recognizePatterns(playerCells)
      const resolvedPatterns = recognizer.resolveOverlappingPatterns(allPatterns)

      // Should resolve to non-overlapping patterns
      const usedCells = new Set()
      for (const pattern of resolvedPatterns) {
        for (const [x, y] of pattern.cells) {
          const key = `${x},${y}`
          expect(usedCells.has(key)).toBe(false) // No cell used twice
          usedCells.add(key)
        }
      }
    })

    test('should preserve all non-overlapping patterns', () => {
      // Create two separate 4-cell lines that don't overlap
      const playerCells = [
        [0, 0], [1, 0], [2, 0], [3, 0], // First line
        [5, 5], [6, 5], [7, 5], [8, 5]  // Second line
      ]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const allPatterns = recognizer.recognizePatterns(playerCells)
      const resolvedPatterns = recognizer.resolveOverlappingPatterns(allPatterns)

      // Should keep both patterns since they don't overlap
      expect(resolvedPatterns.length).toBe(2)
    })
  })

  describe('Point Calculation', () => {
    test('should calculate points correctly for single pattern', () => {
      const playerCells = [[0, 0], [1, 0], [2, 0], [3, 0]] // 4-cell line
      const newCells = [[3, 0]] // Last cell placed

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const result = recognizer.calculateNewPoints(1, newCells)

      expect(result.totalPoints).toBe(PATTERN_DEFINITIONS.SHORT_LINE_4.points)
      expect(result.patterns.length).toBe(1)
      expect(result.patterns[0].id).toBe('SHORT_LINE_4')
    })

    test('should only award points for patterns involving new cells', () => {
      // Place existing pattern
      const existingCells = [[0, 0], [1, 0], [2, 0], [3, 0]]
      for (const [x, y] of existingCells) {
        board.grid[y][x] = 1
      }

      // Place new cells that don't complete any new patterns
      const newCells = [[5, 5]]
      board.grid[5][5] = 1

      const allPlayerCells = [...existingCells, ...newCells]
      const result = recognizer.calculateNewPoints(1, newCells)

      expect(result.totalPoints).toBe(0) // No new patterns involving new cells
    })

    test('should award points for multiple patterns in one move', () => {
      // Set up a scenario where placing one piece creates multiple patterns
      const existingCells = [
        [0, 0], [1, 0], [2, 0], // Part of horizontal line
        [3, 1], [3, 2], [3, 3]  // Part of vertical line
      ]

      for (const [x, y] of existingCells) {
        board.grid[y][x] = 1
      }

      // Place piece that completes both patterns
      const newCells = [[3, 0]]
      board.grid[3][0] = 1

      const allPlayerCells = [...existingCells, ...newCells]
      const result = recognizer.calculateNewPoints(1, newCells)

      // Should award points for both patterns
      expect(result.totalPoints).toBeGreaterThan(PATTERN_DEFINITIONS.SHORT_LINE_4.points)
      expect(result.patterns.length).toBeGreaterThan(1)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty cell lists', () => {
      const result = recognizer.calculateNewPoints(1, [])
      expect(result.totalPoints).toBe(0)
      expect(result.patterns.length).toBe(0)
    })

    test('should handle cells outside board bounds', () => {
      const playerCells = [[0, 0], [1, 0], [2, 0], [15, 15]] // Last cell out of bounds

      // Only place valid cells
      for (const [x, y] of playerCells) {
        if (x < board.cols && y < board.rows) {
          board.grid[y][x] = 1
        }
      }

      const patterns = recognizer.findLinearPatterns(playerCells.filter(([x, y]) =>
        x < board.cols && y < board.rows
      ))

      // Should still detect valid patterns
      expect(patterns.length).toBe(0) // Only 3 valid cells, need 4 for line
    })

    test('should handle single cell', () => {
      const playerCells = [[5, 5]]

      for (const [x, y] of playerCells) {
        board.grid[y][x] = 1
      }

      const result = recognizer.calculateNewPoints(1, playerCells)
      expect(result.totalPoints).toBe(0) // Single cell forms no patterns
    })
  })
})
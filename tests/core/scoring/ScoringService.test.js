/**
 * Unit tests for Scoring Service
 * Tests point awarding, game end conditions, and winner determination
 */

import { ScoringService } from '../../../src/core/scoring/ScoringService.js'
import { createInitialGameState } from '../../../src/core/game/GameState.js'

describe('ScoringService', () => {
  let gameState

  beforeEach(() => {
    gameState = createInitialGameState(10, 10)

    // Ensure scoring system is initialized
    if (!gameState.scoring) {
      gameState.scoring = {
        player1Score: 0,
        player2Score: 0,
        scoringHistory: [],
        lastScoringMove: null,
        highlightedPattern: null
      }
    }
  })

  describe('Point Awarding', () => {
    test('should award points for valid patterns', () => {
      // Set up a board state with a line pattern
      const playerCells = [[0, 0], [1, 0], [2, 0], [3, 0]]
      for (const [x, y] of playerCells) {
        gameState.board.grid[y][x] = 1
      }

      const newCells = [[3, 0]] // Last cell placed
      const moveId = 'test_move_1'

      const result = ScoringService.awardPoints(gameState, 1, newCells, moveId)

      expect(result.pointsEarned).toBeGreaterThan(0)
      expect(result.gameState.scoring.player1Score).toBeGreaterThan(0)
      expect(result.gameState.scoring.scoringHistory.length).toBeGreaterThan(0)
    })

    test('should update scoring history correctly', () => {
      const playerCells = [[0, 0], [1, 0], [2, 0], [3, 0]]
      for (const [x, y] of playerCells) {
        gameState.board.grid[y][x] = 1
      }

      const newCells = [[3, 0]]
      const moveId = 'test_move_1'

      const result = ScoringService.awardPoints(gameState, 1, newCells, moveId)

      const history = result.gameState.scoring.scoringHistory
      expect(history.length).toBeGreaterThan(0)

      const lastEntry = history[history.length - 1]
      expect(lastEntry.player).toBe(1)
      expect(lastEntry.moveId).toBe(moveId)
      expect(lastEntry.points).toBeGreaterThan(0)
      expect(lastEntry.cells).toBeDefined()
    })

    test('should set highlighted pattern for UI', () => {
      const playerCells = [[0, 0], [1, 0], [2, 0], [3, 0]]
      for (const [x, y] of playerCells) {
        gameState.board.grid[y][x] = 1
      }

      const newCells = [[3, 0]]
      const moveId = 'test_move_1'

      const result = ScoringService.awardPoints(gameState, 1, newCells, moveId)

      if (result.patterns.length > 0) {
        expect(result.gameState.scoring.highlightedPattern).toBeDefined()
        expect(result.gameState.scoring.highlightedPattern.playerId).toBe(1)
        expect(result.gameState.scoring.highlightedPattern.expiresAt).toBeDefined()
      }
    })

    test('should not award points for moves that create no patterns', () => {
      // Place a single isolated cell
      gameState.board.grid[5][5] = 1
      const newCells = [[5, 5]]
      const moveId = 'test_move_1'

      const result = ScoringService.awardPoints(gameState, 1, newCells, moveId)

      expect(result.pointsEarned).toBe(0)
      expect(result.patterns.length).toBe(0)
      expect(result.gameState.scoring.player1Score).toBe(0)
    })
  })

  describe('Game End Detection', () => {
    test('should end game when both players blocked', () => {
      // Mock hasLegalMove function that returns false for both players
      let callCount = 0
      const hasLegalMove = () => {
        callCount++
        return false // Both players blocked
      }

      const result = ScoringService.checkGameEnd(gameState, hasLegalMove)

      expect(result.gameEnded).toBe(true)
      expect(result.winner).toBeDefined()
      expect(result.reason).toBeDefined()
    })

    test('should continue game when at least one player can move', () => {
      let callCount = 0
      const hasLegalMove = () => {
        callCount++
        return callCount === 1 ? false : true // Player 1 blocked, Player 2 can move
      }

      const result = ScoringService.checkGameEnd(gameState, hasLegalMove)

      expect(result.gameEnded).toBe(false)
      expect(result.winner).toBeNull()
    })

    test('should determine winner by highest score', () => {
      gameState.scoring.player1Score = 25
      gameState.scoring.player2Score = 15

      const hasLegalMove = () => false
      const result = ScoringService.checkGameEnd(gameState, hasLegalMove)

      expect(result.gameEnded).toBe(true)
      expect(result.winner).toBe(1)
      expect(result.reason).toContain('Player 1 wins with 25 points')
    })

    test('should break ties by remaining pieces', () => {
      gameState.scoring.player1Score = 20
      gameState.scoring.player2Score = 20
      gameState.players[1].arsenal = { 'I4': 1, 'O4': 1 } // 2 pieces
      gameState.players[2].arsenal = { 'T4': 1 } // 1 piece

      const hasLegalMove = () => false
      const result = ScoringService.checkGameEnd(gameState, hasLegalMove)

      expect(result.winner).toBe(2) // Player 2 has fewer remaining pieces
      expect(result.reason).toContain('fewer pieces remaining')
    })

    test('should default to Player 1 on perfect tie', () => {
      gameState.scoring.player1Score = 20
      gameState.scoring.player2Score = 20
      gameState.players[1].arsenal = { 'I4': 1 }
      gameState.players[2].arsenal = { 'O4': 1 }

      const hasLegalMove = () => false
      const result = ScoringService.checkGameEnd(gameState, hasLegalMove)

      expect(result.winner).toBe(1)
      expect(result.reason).toContain('Player 1 wins by default')
    })
  })

  describe('Score Tracking', () => {
    test('should get current scores correctly', () => {
      gameState.scoring.player1Score = 15
      gameState.scoring.player2Score = 22

      const scores = ScoringService.getCurrentScores(gameState)

      expect(scores.player1).toBe(15)
      expect(scores.player2).toBe(22)
    })

    test('should count remaining pieces correctly', () => {
      const arsenal = { 'I4': 2, 'O4': 1, 'T4': 0, 'L4': 3 }
      const count = ScoringService.countRemainingPieces(arsenal)

      expect(count).toBe(6) // 2 + 1 + 0 + 3
    })

    test('should filter scoring history by player', () => {
      gameState.scoring.scoringHistory = [
        { player: 1, points: 5, pattern: 'TEST1' },
        { player: 2, points: 8, pattern: 'TEST2' },
        { player: 1, points: 12, pattern: 'TEST3' },
        { player: 2, points: 6, pattern: 'TEST4' }
      ]

      const player1History = ScoringService.getScoringHistory(gameState, 1)
      const player2History = ScoringService.getScoringHistory(gameState, 2)

      expect(player1History.length).toBe(2)
      expect(player2History.length).toBe(2)
      expect(player1History.every(entry => entry.player === 1)).toBe(true)
      expect(player2History.every(entry => entry.player === 2)).toBe(true)
    })
  })

  describe('Pattern Analysis', () => {
    test('should calculate points by pattern type', () => {
      gameState.scoring.scoringHistory = [
        { player: 1, points: 5, patternType: 'line' },
        { player: 1, points: 8, patternType: 'rectangle' },
        { player: 1, points: 12, patternType: 'line' },
        { player: 2, points: 15, patternType: 'territory' }
      ]

      const player1Points = ScoringService.getPointsByPatternType(gameState, 1)
      const player2Points = ScoringService.getPointsByPatternType(gameState, 2)

      expect(player1Points.line).toBe(17) // 5 + 12
      expect(player1Points.rectangle).toBe(8)
      expect(player2Points.territory).toBe(15)
    })

    test('should get last scoring event', () => {
      gameState.scoring.scoringHistory = [
        { player: 1, points: 5, timestamp: 1000 },
        { player: 2, points: 8, timestamp: 2000 }
      ]

      const lastEvent = ScoringService.getLastScoringEvent(gameState)

      expect(lastEvent.player).toBe(2)
      expect(lastEvent.points).toBe(8)
      expect(lastEvent.timestamp).toBe(2000)
    })

    test('should return null for empty scoring history', () => {
      gameState.scoring.scoringHistory = []

      const lastEvent = ScoringService.getLastScoringEvent(gameState)

      expect(lastEvent).toBeNull()
    })
  })

  describe('Game Statistics', () => {
    test('should calculate comprehensive game statistics', () => {
      // Set up game state with scoring history
      gameState.scoring.scoringHistory = [
        { player: 1, points: 5, timestamp: 1000, patternType: 'line' },
        { player: 2, points: 8, timestamp: 2000, patternType: 'rectangle' },
        { player: 1, points: 12, timestamp: 3000, patternType: 'line' }
      ]
      gameState.scoring.player1Score = 17
      gameState.scoring.player2Score = 8
      gameState.history = [{}, {}, {}] // 3 moves

      const stats = ScoringService.getGameStatistics(gameState)

      expect(stats.player1.totalScore).toBe(17)
      expect(stats.player2.totalScore).toBe(8)
      expect(stats.player1.patternsCreated).toBe(2)
      expect(stats.player2.patternsCreated).toBe(1)
      expect(stats.totalMoves).toBe(3)
      expect(stats.gameLength.timeElapsed).toBe(2000) // 3000 - 1000
    })

    test('should calculate favorite pattern type', () => {
      const pointsByType = {
        line: 15,
        rectangle: 8,
        territory: 20
      }

      const favorite = ScoringService.getFavoritePatternType(pointsByType)

      expect(favorite).toBe('territory') // Highest points
    })

    test('should handle empty pattern types', () => {
      const favorite = ScoringService.getFavoritePatternType({})

      expect(favorite).toBeNull()
    })
  })

  describe('Highlight Management', () => {
    test('should clear expired highlights', () => {
      const pastTime = Date.now() - 5000 // 5 seconds ago
      gameState.scoring.highlightedPattern = {
        pattern: { id: 'TEST' },
        expiresAt: pastTime
      }

      const result = ScoringService.clearExpiredHighlights(gameState)

      expect(result.scoring.highlightedPattern).toBeNull()
    })

    test('should preserve active highlights', () => {
      const futureTime = Date.now() + 5000 // 5 seconds from now
      const highlight = {
        pattern: { id: 'TEST' },
        expiresAt: futureTime
      }
      gameState.scoring.highlightedPattern = highlight

      const result = ScoringService.clearExpiredHighlights(gameState)

      expect(result.scoring.highlightedPattern).toEqual(highlight)
    })

    test('should handle missing highlight gracefully', () => {
      gameState.scoring.highlightedPattern = null

      const result = ScoringService.clearExpiredHighlights(gameState)

      expect(result).toBe(gameState) // Should return original state
    })
  })
})
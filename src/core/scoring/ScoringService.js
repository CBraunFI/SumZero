/**
 * Scoring Service for SumZero
 * Manages point calculation, scoring history, and winner determination
 */

import { PatternRecognizer } from './PatternRecognizer.js'
import { cloneGameState } from '../game/GameState.js'

/**
 * Scoring service for managing game points and patterns
 */
export class ScoringService {
  /**
   * Calculate and award points for a newly placed piece
   * @param {Object} gameState - Current game state
   * @param {number} playerId - Player who placed the piece
   * @param {Array} newCells - Cells of the newly placed piece
   * @param {string} moveId - Unique identifier for the move
   * @returns {Object} Updated game state with new scores
   */
  static awardPoints(gameState, playerId, newCells, moveId) {
    const newGameState = cloneGameState(gameState)

    // Create pattern recognizer for current board
    const recognizer = new PatternRecognizer(newGameState.board)

    // Calculate new points from this move
    const scoringResult = recognizer.calculateNewPoints(playerId, newCells)

    // Update player's score
    const scoreKey = `player${playerId}Score`
    newGameState.scoring[scoreKey] += scoringResult.totalPoints

    // Add to scoring history
    const historyEntries = scoringResult.patterns.map(pattern => ({
      turn: newGameState.history.length + 1,
      player: playerId,
      moveId,
      pattern: pattern.id,
      points: pattern.points,
      cells: pattern.cells,
      patternType: pattern.type,
      timestamp: Date.now()
    }))

    newGameState.scoring.scoringHistory.push(...historyEntries)
    newGameState.scoring.lastScoringMove = moveId

    // Set highlighted pattern for UI (show the highest-value pattern)
    if (scoringResult.patterns.length > 0) {
      const highestPattern = scoringResult.patterns.reduce((max, pattern) =>
        pattern.points > max.points ? pattern : max
      )
      newGameState.scoring.highlightedPattern = {
        pattern: highestPattern,
        playerId,
        expiresAt: Date.now() + 3000 // Highlight for 3 seconds
      }
    }

    return {
      gameState: newGameState,
      pointsEarned: scoringResult.totalPoints,
      patterns: scoringResult.patterns
    }
  }

  /**
   * Check if both players are blocked and determine winner
   * @param {Object} gameState - Current game state
   * @param {Function} hasLegalMove - Function to check if player has legal moves
   * @returns {Object} Result with winner info
   */
  static checkGameEnd(gameState, hasLegalMove) {
    const player1Blocked = !hasLegalMove(gameState, 1)
    const player2Blocked = !hasLegalMove(gameState, 2)

    // Game continues if at least one player can move
    if (!player1Blocked || !player2Blocked) {
      return {
        gameEnded: false,
        winner: null,
        reason: null
      }
    }

    // Both players blocked - determine winner by score
    const score1 = gameState.scoring.player1Score
    const score2 = gameState.scoring.player2Score

    let winner
    let reason

    if (score1 > score2) {
      winner = 1
      reason = `Player 1 wins with ${score1} points vs ${score2} points`
    } else if (score2 > score1) {
      winner = 2
      reason = `Player 2 wins with ${score2} points vs ${score1} points`
    } else {
      // Tiebreaker: fewer pieces remaining
      const remaining1 = this.countRemainingPieces(gameState.players[1].arsenal)
      const remaining2 = this.countRemainingPieces(gameState.players[2].arsenal)

      if (remaining1 < remaining2) {
        winner = 1
        reason = `Tie at ${score1} points - Player 1 wins with fewer pieces remaining (${remaining1} vs ${remaining2})`
      } else if (remaining2 < remaining1) {
        winner = 2
        reason = `Tie at ${score1} points - Player 2 wins with fewer pieces remaining (${remaining2} vs ${remaining1})`
      } else {
        // Final tiebreaker: Player 1 wins
        winner = 1
        reason = `Perfect tie at ${score1} points with ${remaining1} pieces - Player 1 wins by default`
      }
    }

    return {
      gameEnded: true,
      winner,
      reason,
      finalScores: { player1: score1, player2: score2 },
      remainingPieces: {
        player1: this.countRemainingPieces(gameState.players[1].arsenal),
        player2: this.countRemainingPieces(gameState.players[2].arsenal)
      }
    }
  }

  /**
   * Count remaining pieces in a player's arsenal
   * @param {Object} arsenal - Player's arsenal
   * @returns {number} Total pieces remaining
   */
  static countRemainingPieces(arsenal) {
    return Object.values(arsenal).reduce((total, count) => total + count, 0)
  }

  /**
   * Get current scores for both players
   * @param {Object} gameState - Game state
   * @returns {Object} Current scores
   */
  static getCurrentScores(gameState) {
    return {
      player1: gameState.scoring.player1Score,
      player2: gameState.scoring.player2Score
    }
  }

  /**
   * Get scoring history for a specific player
   * @param {Object} gameState - Game state
   * @param {number} playerId - Player ID (optional, gets all if not specified)
   * @returns {Array} Scoring history entries
   */
  static getScoringHistory(gameState, playerId = null) {
    const history = gameState.scoring.scoringHistory

    if (playerId === null) {
      return history
    }

    return history.filter(entry => entry.player === playerId)
  }

  /**
   * Get total points earned by pattern type for analysis
   * @param {Object} gameState - Game state
   * @param {number} playerId - Player ID
   * @returns {Object} Points by pattern type
   */
  static getPointsByPatternType(gameState, playerId) {
    const history = this.getScoringHistory(gameState, playerId)
    const pointsByType = {}

    for (const entry of history) {
      if (!pointsByType[entry.patternType]) {
        pointsByType[entry.patternType] = 0
      }
      pointsByType[entry.patternType] += entry.points
    }

    return pointsByType
  }

  /**
   * Get the most recent scoring event
   * @param {Object} gameState - Game state
   * @returns {Object|null} Most recent scoring event
   */
  static getLastScoringEvent(gameState) {
    const history = gameState.scoring.scoringHistory
    return history.length > 0 ? history[history.length - 1] : null
  }

  /**
   * Clear expired pattern highlights
   * @param {Object} gameState - Game state
   * @returns {Object} Updated game state
   */
  static clearExpiredHighlights(gameState) {
    if (!gameState.scoring.highlightedPattern) {
      return gameState
    }

    const now = Date.now()
    if (now >= gameState.scoring.highlightedPattern.expiresAt) {
      const newGameState = cloneGameState(gameState)
      newGameState.scoring.highlightedPattern = null
      return newGameState
    }

    return gameState
  }

  /**
   * Get game statistics for end-game summary
   * @param {Object} gameState - Final game state
   * @returns {Object} Game statistics
   */
  static getGameStatistics(gameState) {
    const scores = this.getCurrentScores(gameState)
    const history = gameState.scoring.scoringHistory

    // Calculate statistics for each player
    const stats = {
      player1: this.calculatePlayerStats(gameState, 1),
      player2: this.calculatePlayerStats(gameState, 2),
      totalMoves: gameState.history.length,
      totalPatterns: history.length,
      gameLength: this.calculateGameLength(gameState)
    }

    return stats
  }

  /**
   * Calculate statistics for a specific player
   * @param {Object} gameState - Game state
   * @param {number} playerId - Player ID
   * @returns {Object} Player statistics
   */
  static calculatePlayerStats(gameState, playerId) {
    const history = this.getScoringHistory(gameState, playerId)
    const pointsByType = this.getPointsByPatternType(gameState, playerId)

    return {
      totalScore: gameState.scoring[`player${playerId}Score`],
      patternsCreated: history.length,
      averagePointsPerPattern: history.length > 0 ?
        gameState.scoring[`player${playerId}Score`] / history.length : 0,
      pointsByPatternType: pointsByType,
      remainingPieces: this.countRemainingPieces(gameState.players[playerId].arsenal),
      favoritePatternType: this.getFavoritePatternType(pointsByType)
    }
  }

  /**
   * Get the pattern type that earned the most points for a player
   * @param {Object} pointsByType - Points earned by pattern type
   * @returns {string|null} Most valuable pattern type
   */
  static getFavoritePatternType(pointsByType) {
    const types = Object.keys(pointsByType)
    if (types.length === 0) return null

    return types.reduce((max, type) =>
      pointsByType[type] > pointsByType[max] ? type : max
    )
  }

  /**
   * Calculate total game length in various metrics
   * @param {Object} gameState - Game state
   * @returns {Object} Game length metrics
   */
  static calculateGameLength(gameState) {
    const history = gameState.scoring.scoringHistory

    if (history.length === 0) {
      return { turns: 0, timeElapsed: 0 }
    }

    const firstMove = history[0]
    const lastMove = history[history.length - 1]

    return {
      turns: gameState.history.length,
      patternsCreated: history.length,
      timeElapsed: lastMove.timestamp - firstMove.timestamp
    }
  }
}
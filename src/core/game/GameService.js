/**
 * Main Game Service
 * Coordinates all game systems and manages game state transitions
 */

import {
  createInitialGameState,
  validateGameState,
  switchPlayer,
  getOpponent,
  cloneGameState,
  migrateGameState
} from './GameState.js'
import { buyPiece, passDraft, isDraftOver } from '../draft/DraftService.js'
import { hasLegalMove, commitMove } from '../placement/PlacementService.js'
import { ScoringService } from '../scoring/ScoringService.js'
import { GAME_PHASES } from '../../utils/constants.js'

/**
 * GameService class that manages the complete game lifecycle
 */
export class GameService {
  /**
   * Create a new game
   * @param {number} rows - Board rows
   * @param {number} cols - Board columns
   * @param {Object} config - Game configuration
   * @returns {Object} Initial game state
   */
  static createNew(rows = 14, cols = 14, config = {}) {
    const gameState = createInitialGameState(rows, cols, config)
    validateGameState(gameState)
    return gameState
  }

  /**
   * Process draft purchase
   * @param {Object} gameState - Current game state
   * @param {number} playerId - Player making purchase
   * @param {string} pieceId - Piece to purchase
   * @returns {Object} Updated game state
   */
  static draftBuy(gameState, playerId, pieceId) {
    if (gameState.phase !== GAME_PHASES.DRAFT) {
      throw new Error('Not in draft phase')
    }

    if (gameState.currentPlayer !== playerId) {
      throw new Error('Not current player\'s turn')
    }

    let newGameState = buyPiece(gameState, playerId, pieceId)
    newGameState = switchPlayer(newGameState)

    // Check if draft is over
    if (isDraftOver(newGameState)) {
      newGameState = GameService.transitionToPlacement(newGameState)
    }

    return newGameState
  }

  /**
   * Process draft pass
   * @param {Object} gameState - Current game state
   * @param {number} playerId - Player passing
   * @returns {Object} Updated game state
   */
  static draftPass(gameState, playerId) {
    if (gameState.phase !== GAME_PHASES.DRAFT) {
      throw new Error('Not in draft phase')
    }

    if (gameState.currentPlayer !== playerId) {
      throw new Error('Not current player\'s turn')
    }

    let newGameState = passDraft(gameState, playerId)
    newGameState = switchPlayer(newGameState)

    // Check if draft is over
    if (isDraftOver(newGameState)) {
      newGameState = GameService.transitionToPlacement(newGameState)
    }

    return newGameState
  }

  /**
   * Transition from draft to placement phase
   * @param {Object} gameState - Current game state
   * @returns {Object} Updated game state
   */
  static transitionToPlacement(gameState) {
    const newGameState = cloneGameState(gameState)
    newGameState.phase = GAME_PHASES.PLACEMENT
    newGameState.currentPlayer = 1 // Player 1 goes first in placement

    // Check if starting player has legal moves
    return GameService.startTurn(newGameState)
  }

  /**
   * Start a player's turn (check for end condition with new scoring system)
   * @param {Object} gameState - Current game state
   * @returns {Object} Updated game state
   */
  static startTurn(gameState) {
    if (gameState.phase !== GAME_PHASES.PLACEMENT) {
      return gameState
    }

    // Clear any expired pattern highlights
    let newGameState = ScoringService.clearExpiredHighlights(gameState)

    // Check if current player has legal moves
    const currentPlayerCanMove = hasLegalMove(newGameState, newGameState.currentPlayer)

    if (!currentPlayerCanMove) {
      // Check if the other player can move
      const otherPlayer = getOpponent(newGameState.currentPlayer)
      const otherPlayerCanMove = hasLegalMove(newGameState, otherPlayer)

      if (otherPlayerCanMove) {
        // Current player is blocked but other player can move - skip turn
        newGameState = switchPlayer(newGameState)
        return newGameState
      } else {
        // Both players are blocked - end game and determine winner by score
        return GameService.endGameWithScoring(newGameState)
      }
    }

    return newGameState
  }

  /**
   * Process piece placement move (with scoring system integration)
   * @param {Object} gameState - Current game state
   * @param {Object} move - Move to execute
   * @returns {Object} Updated game state
   */
  static placePiece(gameState, move) {
    if (gameState.phase !== GAME_PHASES.PLACEMENT) {
      throw new Error('Not in placement phase')
    }

    if (gameState.currentPlayer !== move.player) {
      throw new Error('Not current player\'s turn')
    }

    // Commit the move (places piece on board, updates arsenal)
    let newGameState = commitMove(gameState, move)

    // Generate unique move ID for scoring history
    const moveId = `move_${newGameState.history.length}_${Date.now()}`

    // Calculate and award points for patterns created by this move
    const scoringResult = ScoringService.awardPoints(
      newGameState,
      move.player,
      move.absCells,
      moveId
    )

    newGameState = scoringResult.gameState

    // Add move to history with scoring info
    newGameState.history.push({
      ...move,
      id: moveId,
      pointsEarned: scoringResult.pointsEarned,
      patternsCreated: scoringResult.patterns.length
    })

    // Switch to next player
    newGameState = switchPlayer(newGameState)

    // Check game end conditions and next player's turn
    newGameState = GameService.startTurn(newGameState)

    return newGameState
  }

  /**
   * Save game state to JSON
   * @param {Object} gameState - Game state to save
   * @returns {string} JSON string
   */
  static save(gameState) {
    validateGameState(gameState)
    return JSON.stringify(gameState)
  }

  /**
   * Load game state from JSON
   * @param {string} jsonString - JSON string to load
   * @returns {Object} Game state
   */
  static load(jsonString) {
    try {
      let gameState = JSON.parse(jsonString)

      // Handle version migration if needed
      if (gameState.version === '1.1') {
        gameState = GameService.migrateFromV11(gameState)
      }
      if (gameState.version === '1.2') {
        gameState = migrateGameState(gameState)
      }

      validateGameState(gameState)
      return gameState
    } catch (error) {
      throw new Error(`Failed to load game: ${error.message}`)
    }
  }

  /**
   * Migrate game state from version 1.1 to 1.2
   * @param {Object} oldState - Old game state
   * @returns {Object} Migrated game state
   */
  static migrateFromV11(oldState) {
    const newState = cloneGameState(oldState)
    newState.version = '1.2'

    // Convert arsenal from array to object format
    for (const playerId of [1, 2]) {
      const player = newState.players[playerId]
      if (Array.isArray(player.arsenal)) {
        const newArsenal = {}
        for (const pieceId of player.arsenal) {
          newArsenal[pieceId] = (newArsenal[pieceId] || 0) + 1
        }
        player.arsenal = newArsenal
      }
    }

    // Add draft state if missing
    if (!newState.draftState) {
      newState.draftState = {
        player1Passed: false,
        player2Passed: false,
        consecutivePasses: 0
      }
    }

    return newState
  }

  /**
   * End game with scoring system (both players blocked)
   * @param {Object} gameState - Current game state
   * @returns {Object} Updated game state with winner determined by score
   */
  static endGameWithScoring(gameState) {
    const newGameState = cloneGameState(gameState)

    // Use scoring service to determine winner
    const endResult = ScoringService.checkGameEnd(newGameState, hasLegalMove)

    newGameState.phase = GAME_PHASES.GAME_OVER
    newGameState.winner = endResult.winner
    newGameState.endReason = endResult.reason
    newGameState.finalScores = endResult.finalScores
    newGameState.gameStatistics = ScoringService.getGameStatistics(newGameState)

    return newGameState
  }

  /**
   * Get current game status (enhanced with scoring info)
   * @param {Object} gameState - Game state
   * @returns {Object} Status information
   */
  static getStatus(gameState) {
    const baseStatus = {
      phase: gameState.phase,
      currentPlayer: gameState.currentPlayer,
      winner: gameState.winner,
      turn: gameState.history.length + 1,
      isGameOver: gameState.phase === GAME_PHASES.GAME_OVER
    }

    // Add scoring information if available (v1.3+)
    if (gameState.scoring) {
      baseStatus.scores = ScoringService.getCurrentScores(gameState)
      baseStatus.lastPattern = ScoringService.getLastScoringEvent(gameState)
      baseStatus.highlightedPattern = gameState.scoring.highlightedPattern

      if (gameState.phase === GAME_PHASES.GAME_OVER) {
        baseStatus.endReason = gameState.endReason
        baseStatus.finalScores = gameState.finalScores
        baseStatus.gameStatistics = gameState.gameStatistics
      }
    }

    return baseStatus
  }

  /**
   * Restart game with same configuration
   * @param {Object} gameState - Current game state
   * @returns {Object} New game state
   */
  static restart(gameState) {
    return GameService.createNew(
      gameState.board.rows,
      gameState.board.cols,
      gameState.config
    )
  }
}
/**
 * Simple AI Implementation for SumZero
 * Provides basic strategic decisions for computer player
 */

import { getAvailablePieces } from '../core/draft/DraftService.js'
import { enumerateLegalMoves } from '../core/placement/PlacementService.js'
import { pieceLibrary } from '../core/pieces/PieceLibrary.js'

/**
 * Simple AI that makes strategic decisions for Player 2
 */
export class SimpleAI {

  /**
   * Make a draft decision for the AI player
   * @param {Object} gameState - Current game state
   * @param {number} playerId - AI player ID
   * @returns {string|null} - Piece ID to buy or null to pass
   */
  static makeDraftDecision(gameState, playerId) {
    const player = gameState.players[playerId]
    const availablePieces = getAvailablePieces(gameState, playerId)
    const difficulty = gameState.config?.aiDifficulty || 'normal'

    if (availablePieces.length === 0) {
      return null // Pass if no pieces available
    }

    // Filter pieces we can afford
    const affordablePieces = availablePieces.filter(pieceId => {
      const piece = pieceLibrary.get(pieceId)
      return piece.cost <= player.budget
    })

    if (affordablePieces.length === 0) {
      return null // Pass if can't afford anything
    }

    // Apply difficulty-based decision making
    if (difficulty === 'easy') {
      return this.makeEasyDraftDecision(affordablePieces)
    } else if (difficulty === 'hard') {
      return this.makeHardDraftDecision(affordablePieces, gameState, playerId)
    } else {
      return this.makeNormalDraftDecision(affordablePieces)
    }
  }

  /**
   * Easy AI: Sometimes makes suboptimal choices
   */
  static makeEasyDraftDecision(affordablePieces) {
    // 30% chance to pick randomly, 70% chance to pick optimally
    if (Math.random() < 0.3) {
      return affordablePieces[Math.floor(Math.random() * affordablePieces.length)]
    }
    return this.makeNormalDraftDecision(affordablePieces)
  }

  /**
   * Normal AI: Balanced value-based strategy
   */
  static makeNormalDraftDecision(affordablePieces) {
    let bestPiece = null
    let bestValue = 0

    for (const pieceId of affordablePieces) {
      const piece = pieceLibrary.get(pieceId)
      const value = piece.relCells.length / piece.cost // cells per cost

      if (value > bestValue) {
        bestValue = value
        bestPiece = pieceId
      }
    }

    return bestPiece
  }

  /**
   * Hard AI: Advanced strategy considering future placement opportunities
   */
  static makeHardDraftDecision(affordablePieces, gameState, playerId) {
    let bestPiece = null
    let bestScore = 0

    for (const pieceId of affordablePieces) {
      const piece = pieceLibrary.get(pieceId)
      let score = piece.relCells.length / piece.cost // Base value

      // Bonus for larger pieces (more strategic impact)
      if (piece.relCells.length >= 5) {
        score += 2
      }

      // Bonus for pieces with interesting shapes (more versatile)
      const shapeFactor = this.calculateShapeComplexity(piece.relCells)
      score += shapeFactor * 0.5

      if (score > bestScore) {
        bestScore = score
        bestPiece = pieceId
      }
    }

    return bestPiece
  }

  /**
   * Calculate shape complexity (higher = more interesting shape)
   */
  static calculateShapeComplexity(relCells) {
    if (relCells.length <= 2) return 0

    let complexity = 0
    const centerX = relCells.reduce((sum, [x]) => sum + x, 0) / relCells.length
    const centerY = relCells.reduce((sum, [, y]) => sum + y, 0) / relCells.length

    // Count cells that are not on the edges (more complex internal structure)
    for (const [x, y] of relCells) {
      const neighbors = relCells.filter(([nx, ny]) =>
        Math.abs(nx - x) + Math.abs(ny - y) === 1
      ).length

      if (neighbors >= 2) complexity += 1
    }

    return complexity
  }

  /**
   * Make a placement decision for the AI player
   * @param {Object} gameState - Current game state
   * @param {number} playerId - AI player ID
   * @returns {Object|null} - Move object or null if no moves available
   */
  static makePlacementDecision(gameState, playerId) {
    const legalMoves = enumerateLegalMoves(gameState, playerId)
    const difficulty = gameState.config?.aiDifficulty || 'normal'

    if (legalMoves.length === 0) {
      return null // No legal moves available
    }

    // Apply difficulty-based placement strategy
    if (difficulty === 'easy') {
      return this.makeEasyPlacementDecision(legalMoves, gameState)
    } else if (difficulty === 'hard') {
      return this.makeHardPlacementDecision(legalMoves, gameState)
    } else {
      return this.makeNormalPlacementDecision(legalMoves, gameState)
    }
  }

  /**
   * Easy AI: 40% chance of suboptimal moves
   */
  static makeEasyPlacementDecision(legalMoves, gameState) {
    if (Math.random() < 0.4) {
      // Make a random move
      return legalMoves[Math.floor(Math.random() * legalMoves.length)]
    }
    return this.makeNormalPlacementDecision(legalMoves, gameState)
  }

  /**
   * Normal AI: Standard evaluation
   */
  static makeNormalPlacementDecision(legalMoves, gameState) {
    let bestMove = null
    let bestScore = -1

    for (const move of legalMoves) {
      const piece = pieceLibrary.get(move.pieceId)
      const score = this.evaluateMove(gameState, move, piece)

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  /**
   * Hard AI: Advanced evaluation with look-ahead
   */
  static makeHardPlacementDecision(legalMoves, gameState) {
    let bestMove = null
    let bestScore = -1

    for (const move of legalMoves) {
      const piece = pieceLibrary.get(move.pieceId)
      let score = this.evaluateMove(gameState, move, piece)

      // Advanced scoring for hard difficulty
      score += this.evaluateStrategicPosition(gameState, move, piece)
      score += this.evaluateOpponentBlocking(gameState, move, piece)

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  /**
   * Evaluate the quality of a potential move
   * @param {Object} gameState - Current game state
   * @param {Object} move - Move to evaluate
   * @param {Object} piece - Piece being placed
   * @returns {number} - Score for the move (higher is better)
   */
  static evaluateMove(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor

    // Base score: number of cells in the piece
    let score = piece.relCells.length * 10

    // Bonus for being closer to center
    const centerX = Math.floor(board.cols / 2)
    const centerY = Math.floor(board.rows / 2)
    const distanceFromCenter = Math.abs(anchorX - centerX) + Math.abs(anchorY - centerY)
    score += Math.max(0, 10 - distanceFromCenter)

    // Bonus for placing near edges (defensive strategy)
    const edgeBonus = Math.min(anchorX, anchorY, board.cols - 1 - anchorX, board.rows - 1 - anchorY)
    if (edgeBonus <= 1) {
      score += 5
    }

    // Small random factor to avoid predictability
    score += Math.random() * 2

    return score
  }

  /**
   * Evaluate strategic positioning (for hard AI)
   */
  static evaluateStrategicPosition(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor
    let strategicScore = 0

    // Prefer moves that create multiple future placement opportunities
    const futureSpots = this.countNearbyEmptySpaces(board, move, piece)
    strategicScore += futureSpots * 2

    // Prefer moves that connect to existing pieces (if any)
    const connectsToExisting = this.connectsToExistingPieces(board, move, piece, 2)
    if (connectsToExisting) {
      strategicScore += 10
    }

    return strategicScore
  }

  /**
   * Evaluate opponent blocking potential (for hard AI)
   */
  static evaluateOpponentBlocking(gameState, move, piece) {
    // Simple heuristic: prefer moves that reduce opponent's available spaces
    const board = gameState.board
    let blockingScore = 0

    // Count how many empty spaces this move makes unavailable to opponent
    // (This is a simplified version - a full implementation would simulate opponent moves)
    const [anchorX, anchorY] = move.anchor
    const nearbySpaces = this.countNearbyEmptySpaces(board, move, piece)

    // If we're taking up space near the center or edges, it might limit opponent
    if (anchorX <= 2 || anchorX >= board.cols - 3 || anchorY <= 2 || anchorY >= board.rows - 3) {
      blockingScore += 3
    }

    return blockingScore
  }

  /**
   * Count empty spaces near a potential move
   */
  static countNearbyEmptySpaces(board, move, piece) {
    const [anchorX, anchorY] = move.anchor
    let emptyCount = 0

    // Check a 3x3 area around each cell of the piece
    for (const [dx, dy] of piece.relCells) {
      const pieceX = anchorX + dx
      const pieceY = anchorY + dy

      for (let ny = pieceY - 1; ny <= pieceY + 1; ny++) {
        for (let nx = pieceX - 1; nx <= pieceX + 1; nx++) {
          if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
            if (board.grid[ny][nx] === 0) {
              emptyCount++
            }
          }
        }
      }
    }

    return emptyCount
  }

  /**
   * Check if move connects to existing pieces
   */
  static connectsToExistingPieces(board, move, piece, playerId) {
    const [anchorX, anchorY] = move.anchor

    for (const [dx, dy] of piece.relCells) {
      const pieceX = anchorX + dx
      const pieceY = anchorY + dy

      // Check adjacent cells for same player's pieces
      for (const [checkDx, checkDy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const checkX = pieceX + checkDx
        const checkY = pieceY + checkDy

        if (checkX >= 0 && checkX < board.cols && checkY >= 0 && checkY < board.rows) {
          if (board.grid[checkY][checkX] === playerId) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Get a delay time for AI actions to make them feel more natural
   * @returns {number} - Delay in milliseconds
   */
  static getActionDelay() {
    return 800 + Math.random() * 400 // 800-1200ms delay
  }
}
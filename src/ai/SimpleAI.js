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
    // 50% chance to pick randomly, 50% chance to pick optimally
    if (Math.random() < 0.5) {
      return affordablePieces[Math.floor(Math.random() * affordablePieces.length)]
    }
    return this.makeNormalDraftDecision(affordablePieces)
  }

  /**
   * Normal AI: Enhanced value-based strategy with pattern analysis
   */
  static makeNormalDraftDecision(affordablePieces) {
    let bestPiece = null
    let bestValue = 0

    for (const pieceId of affordablePieces) {
      const piece = pieceLibrary.get(pieceId)
      let value = piece.relCells.length / piece.cost // Base cells per cost

      // Bonus for pieces that can form patterns
      const shapeComplexity = this.calculateShapeComplexity(piece.relCells)
      value += shapeComplexity * 0.3

      // Bonus for larger pieces (strategic value)
      if (piece.relCells.length >= 4) {
        value += 1
      }

      // Prefer pieces with good coverage potential
      const coverage = this.calculateCoverageScore(piece.relCells)
      value += coverage * 0.2

      if (value > bestValue) {
        bestValue = value
        bestPiece = pieceId
      }
    }

    return bestPiece
  }

  /**
   * Hard AI: Master-level strategy with deep analysis
   */
  static makeHardDraftDecision(affordablePieces, gameState, playerId) {
    let bestPiece = null
    let bestScore = 0

    for (const pieceId of affordablePieces) {
      const piece = pieceLibrary.get(pieceId)
      let score = piece.relCells.length / piece.cost // Base efficiency

      // Strong bonus for strategic piece sizes
      if (piece.relCells.length >= 5) {
        score += 3.5
      } else if (piece.relCells.length >= 3) {
        score += 1.5
      }

      // Advanced shape analysis for versatility
      const shapeFactor = this.calculateShapeComplexity(piece.relCells)
      score += shapeFactor * 0.8

      // Pattern formation potential
      const patternScore = this.calculatePatternPotential(piece.relCells)
      score += patternScore * 1.2

      // Coverage optimization
      const coverage = this.calculateCoverageScore(piece.relCells)
      score += coverage * 0.5

      // Deny opponent powerful pieces (strategic blocking)
      const denyValue = this.calculateDenyValue(piece, gameState)
      score += denyValue

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

    // Analyze connectivity and branching
    for (const [x, y] of relCells) {
      const neighbors = relCells.filter(([nx, ny]) =>
        Math.abs(nx - x) + Math.abs(ny - y) === 1
      ).length

      // Reward pieces with good connectivity
      if (neighbors >= 2) complexity += 1
      if (neighbors >= 3) complexity += 0.5 // Branching points are valuable
    }

    // Analyze shape spread (wider shapes are often more versatile)
    const minX = Math.min(...relCells.map(([x]) => x))
    const maxX = Math.max(...relCells.map(([x]) => x))
    const minY = Math.min(...relCells.map(([, y]) => y))
    const maxY = Math.max(...relCells.map(([, y]) => y))
    const spread = (maxX - minX) + (maxY - minY)
    complexity += spread * 0.3

    return complexity
  }

  /**
   * Calculate coverage potential of a piece
   */
  static calculateCoverageScore(relCells) {
    const minX = Math.min(...relCells.map(([x]) => x))
    const maxX = Math.max(...relCells.map(([x]) => x))
    const minY = Math.min(...relCells.map(([, y]) => y))
    const maxY = Math.max(...relCells.map(([, y]) => y))

    const boundingArea = (maxX - minX + 1) * (maxY - minY + 1)
    const efficiency = relCells.length / boundingArea
    return efficiency
  }

  /**
   * Calculate pattern formation potential
   */
  static calculatePatternPotential(relCells) {
    let potential = 0

    // Check for linear segments (good for line patterns)
    potential += this.countLinearSegments(relCells) * 0.5

    // Check for rectangular formations
    potential += this.hasRectangularPotential(relCells) ? 1 : 0

    // Bonus for L-shapes and corners
    potential += this.hasCornerFormation(relCells) ? 0.7 : 0

    return potential
  }

  /**
   * Calculate value of denying this piece to opponent
   */
  static calculateDenyValue(piece, gameState) {
    // Highly valuable pieces should be prioritized to deny opponent
    if (piece.relCells.length >= 5) {
      return 1.5 // Strong incentive to take large pieces
    }
    if (piece.relCells.length >= 4) {
      return 0.8
    }
    return 0.2
  }

  /**
   * Count linear segments in the piece
   */
  static countLinearSegments(relCells) {
    let segments = 0
    const visited = new Set()

    for (const [x, y] of relCells) {
      const key = `${x},${y}`
      if (visited.has(key)) continue

      // Check horizontal line
      let hLength = this.getLineLength(relCells, x, y, 1, 0)
      if (hLength >= 3) segments += 1

      // Check vertical line
      let vLength = this.getLineLength(relCells, x, y, 0, 1)
      if (vLength >= 3) segments += 1

      visited.add(key)
    }

    return segments
  }

  /**
   * Get length of line starting from position in given direction
   */
  static getLineLength(relCells, startX, startY, dx, dy) {
    let length = 1
    let x = startX + dx
    let y = startY + dy

    while (relCells.some(([cx, cy]) => cx === x && cy === y)) {
      length++
      x += dx
      y += dy
    }

    return length
  }

  /**
   * Check if piece has rectangular formation potential
   */
  static hasRectangularPotential(relCells) {
    if (relCells.length < 4) return false

    const minX = Math.min(...relCells.map(([x]) => x))
    const maxX = Math.max(...relCells.map(([x]) => x))
    const minY = Math.min(...relCells.map(([, y]) => y))
    const maxY = Math.max(...relCells.map(([, y]) => y))

    const width = maxX - minX + 1
    const height = maxY - minY + 1

    // Check if it could form part of a rectangle
    return width >= 2 && height >= 2 && relCells.length >= width * height * 0.5
  }

  /**
   * Check if piece has corner/L-shape formation
   */
  static hasCornerFormation(relCells) {
    for (const [x, y] of relCells) {
      let adjacent = 0
      let dirs = []

      // Check all 4 directions
      for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
        if (relCells.some(([cx, cy]) => cx === x + dx && cy === y + dy)) {
          adjacent++
          dirs.push([dx, dy])
        }
      }

      // Corner if exactly 2 adjacent cells in perpendicular directions
      if (adjacent === 2) {
        const [d1, d2] = dirs
        if ((d1[0] === 0) !== (d2[0] === 0)) { // Perpendicular
          return true
        }
      }
    }

    return false
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
   * Easy AI: 60% chance of suboptimal moves
   */
  static makeEasyPlacementDecision(legalMoves, gameState) {
    if (Math.random() < 0.6) {
      // Make a random move
      return legalMoves[Math.floor(Math.random() * legalMoves.length)]
    }
    return this.makeNormalPlacementDecision(legalMoves, gameState)
  }

  /**
   * Normal AI: Enhanced strategic evaluation
   */
  static makeNormalPlacementDecision(legalMoves, gameState) {
    let bestMove = null
    let bestScore = -1

    for (const move of legalMoves) {
      const piece = pieceLibrary.get(move.pieceId)
      let score = this.evaluateMove(gameState, move, piece)

      // Add pattern formation bonus
      score += this.evaluatePatternFormation(gameState, move, piece) * 0.5

      // Add territory control bonus
      score += this.evaluateTerritoryControl(gameState, move, piece) * 0.3

      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  /**
   * Hard AI: Master-level placement with deep strategic analysis
   */
  static makeHardPlacementDecision(legalMoves, gameState) {
    let bestMove = null
    let bestScore = -1

    for (const move of legalMoves) {
      const piece = pieceLibrary.get(move.pieceId)
      let score = this.evaluateMove(gameState, move, piece)

      // Advanced strategic factors
      score += this.evaluateStrategicPosition(gameState, move, piece) * 1.2
      score += this.evaluateOpponentBlocking(gameState, move, piece) * 1.5
      score += this.evaluatePatternFormation(gameState, move, piece) * 1.8
      score += this.evaluateTerritoryControl(gameState, move, piece) * 1.0
      score += this.evaluateEndgamePosition(gameState, move, piece) * 2.0
      score += this.evaluateScoreMaximization(gameState, move, piece) * 2.5

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

    // Enhanced base score with size scaling
    let score = piece.relCells.length * 15

    // Strategic positioning bonus
    const centerX = Math.floor(board.cols / 2)
    const centerY = Math.floor(board.rows / 2)
    const distanceFromCenter = Math.abs(anchorX - centerX) + Math.abs(anchorY - centerY)

    // Dynamic center value based on game phase
    const boardFillRatio = this.calculateBoardFillRatio(board)
    const centerBonus = boardFillRatio < 0.3 ? 15 : 8 // Higher center value early game
    score += Math.max(0, centerBonus - distanceFromCenter)

    // Enhanced edge strategy
    const edgeDistance = Math.min(anchorX, anchorY, board.cols - 1 - anchorX, board.rows - 1 - anchorY)
    if (edgeDistance <= 1) {
      score += 8 // Increased edge bonus
    } else if (edgeDistance <= 2) {
      score += 4 // Near-edge bonus
    }

    // Corner bonus (very strategic)
    if ((anchorX <= 1 || anchorX >= board.cols - 2) &&
        (anchorY <= 1 || anchorY >= board.rows - 2)) {
      score += 12
    }

    // Reduced randomness for more consistent play
    score += Math.random() * 1

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
   * Calculate current board fill ratio
   */
  static calculateBoardFillRatio(board) {
    let filledCells = 0
    let totalCells = 0

    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        totalCells++
        if (board.grid[y][x] !== 0) {
          filledCells++
        }
      }
    }

    return filledCells / totalCells
  }

  /**
   * Evaluate pattern formation potential
   */
  static evaluatePatternFormation(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor
    let patternScore = 0

    // Check for line formation potential
    patternScore += this.checkLineFormation(board, move, piece) * 3

    // Check for rectangle formation potential
    patternScore += this.checkRectangleFormation(board, move, piece) * 4

    // Check for territory clustering
    patternScore += this.checkTerritoryCluster(board, move, piece) * 2

    return patternScore
  }

  /**
   * Evaluate territory control
   */
  static evaluateTerritoryControl(gameState, move, piece) {
    const board = gameState.board
    let controlScore = 0

    // Count influenced empty spaces
    const influencedSpaces = this.countInfluencedSpaces(board, move, piece)
    controlScore += influencedSpaces * 0.5

    // Bonus for blocking opponent expansion areas
    controlScore += this.evaluateBlockingValue(board, move, piece) * 2

    return controlScore
  }

  /**
   * Evaluate endgame positioning
   */
  static evaluateEndgamePosition(gameState, move, piece) {
    const fillRatio = this.calculateBoardFillRatio(gameState.board)

    if (fillRatio < 0.6) return 0 // Not endgame yet

    let endgameScore = 0

    // In endgame, prioritize moves that maximize remaining options
    const futureOptions = this.countFutureOptions(gameState.board, move, piece)
    endgameScore += futureOptions * 3

    // Prioritize completing patterns
    endgameScore += this.evaluatePatternCompletion(gameState.board, move, piece) * 5

    return endgameScore
  }

  /**
   * Evaluate score maximization potential
   */
  static evaluateScoreMaximization(gameState, move, piece) {
    // This would integrate with the scoring system to predict point gains
    // For now, return a basic heuristic
    const board = gameState.board
    let scoreBonus = 0

    // Larger pieces in strategic positions
    if (piece.relCells.length >= 4) {
      scoreBonus += piece.relCells.length * 2
    }

    // Bonus for moves that create scoring opportunities
    scoreBonus += this.estimateScoreGain(board, move, piece)

    return scoreBonus
  }

  /**
   * Check line formation potential
   */
  static checkLineFormation(board, move, piece) {
    // Simplified line detection - check if move extends existing lines
    let lineScore = 0
    const [anchorX, anchorY] = move.anchor

    // Check horizontal and vertical extensions
    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Check horizontal line potential
      let hExtension = this.countLineExtension(board, x, y, 1, 0, 2)
      lineScore += hExtension

      // Check vertical line potential
      let vExtension = this.countLineExtension(board, x, y, 0, 1, 2)
      lineScore += vExtension
    }

    return lineScore
  }

  /**
   * Check rectangle formation potential
   */
  static checkRectangleFormation(board, move, piece) {
    // Simplified rectangle detection
    const [anchorX, anchorY] = move.anchor
    let rectScore = 0

    // Look for rectangular clusters this move could contribute to
    for (let size = 2; size <= 4; size++) {
      for (let sx = anchorX - size; sx <= anchorX + size; sx++) {
        for (let sy = anchorY - size; sy <= anchorY + size; sy++) {
          if (this.wouldContributeToRectangle(board, move, piece, sx, sy, size)) {
            rectScore += size
          }
        }
      }
    }

    return Math.min(rectScore, 10) // Cap the bonus
  }

  /**
   * Check territory clustering
   */
  static checkTerritoryCluster(board, move, piece) {
    let clusterScore = 0
    const [anchorX, anchorY] = move.anchor

    // Count nearby same-player pieces
    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      let nearbyAllies = 0
      for (let nx = x - 2; nx <= x + 2; nx++) {
        for (let ny = y - 2; ny <= y + 2; ny++) {
          if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
            if (board.grid[ny][nx] === 2) { // AI is player 2
              nearbyAllies++
            }
          }
        }
      }
      clusterScore += nearbyAllies * 0.5
    }

    return clusterScore
  }

  /**
   * Helper methods for advanced evaluation
   */
  static countLineExtension(board, x, y, dx, dy, playerId) {
    let count = 0
    let checkX = x + dx
    let checkY = y + dy

    while (checkX >= 0 && checkX < board.cols && checkY >= 0 && checkY < board.rows &&
           board.grid[checkY][checkX] === playerId) {
      count++
      checkX += dx
      checkY += dy
    }

    checkX = x - dx
    checkY = y - dy
    while (checkX >= 0 && checkX < board.cols && checkY >= 0 && checkY < board.rows &&
           board.grid[checkY][checkX] === playerId) {
      count++
      checkX -= dx
      checkY -= dy
    }

    return count
  }

  static wouldContributeToRectangle(board, move, piece, rectX, rectY, size) {
    // Simplified check - just verify if move overlaps with potential rectangle area
    const [anchorX, anchorY] = move.anchor

    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      if (x >= rectX && x < rectX + size && y >= rectY && y < rectY + size) {
        return true
      }
    }

    return false
  }

  static countInfluencedSpaces(board, move, piece) {
    let influenced = 0
    const [anchorX, anchorY] = move.anchor

    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Count empty spaces in influence range
      for (let nx = x - 1; nx <= x + 1; nx++) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
          if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
            if (board.grid[ny][nx] === 0) {
              influenced++
            }
          }
        }
      }
    }

    return influenced
  }

  static evaluateBlockingValue(board, move, piece) {
    // Count how many opponent opportunities this move blocks
    return 2 // Simplified implementation
  }

  static countFutureOptions(board, move, piece) {
    // Count remaining placement options after this move
    return 5 // Simplified implementation
  }

  static evaluatePatternCompletion(board, move, piece) {
    // Check if this move completes or nearly completes scoring patterns
    return 3 // Simplified implementation
  }

  static estimateScoreGain(board, move, piece) {
    // Estimate points this move might generate
    return piece.relCells.length // Basic estimate
  }

  /**
   * Get a delay time for AI actions to make them feel more natural
   * @returns {number} - Delay in milliseconds
   */
  static getActionDelay() {
    return 800 + Math.random() * 400 // 800-1200ms delay
  }
}
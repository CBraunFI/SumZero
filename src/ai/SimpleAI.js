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
   * Make a draft decision for the AI player with timeout protection
   * @param {Object} gameState - Current game state
   * @param {number} playerId - AI player ID
   * @returns {string|null} - Piece ID to buy or null to pass
   */
  static makeDraftDecision(gameState, playerId) {
    return this.withTimeout(() => {
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
    }, null) // Fallback to pass
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
   * Make a placement decision for the AI player with timeout protection
   * @param {Object} gameState - Current game state
   * @param {number} playerId - AI player ID
   * @returns {Object|null} - Move object or null if no moves available
   */
  static makePlacementDecision(gameState, playerId) {
    const legalMoves = enumerateLegalMoves(gameState, playerId)

    if (legalMoves.length === 0) {
      return null // No legal moves available
    }

    return this.withTimeout(() => {
      const difficulty = gameState.config?.aiDifficulty || 'normal'

      // Apply difficulty-based placement strategy
      if (difficulty === 'easy') {
        return this.makeEasyPlacementDecision(legalMoves, gameState)
      } else if (difficulty === 'hard') {
        return this.makeHardPlacementDecision(legalMoves, gameState)
      } else {
        return this.makeNormalPlacementDecision(legalMoves, gameState)
      }
    }, legalMoves[0]) // Fallback to first legal move
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
      // Abort if taking too long
      if (this.shouldAbortComputation()) break

      const piece = pieceLibrary.get(move.pieceId)
      let score = this.evaluateMove(gameState, move, piece)

      // MASSIVELY INCREASED aggressive strategic factors
      score += this.evaluateStrategicPosition(gameState, move, piece) * 1.5
      score += this.evaluateOpponentBlocking(gameState, move, piece) * 4.0  // INCREASED FROM 1.5 TO 4.0
      score += this.evaluatePatternFormation(gameState, move, piece) * 2.2
      score += this.evaluateTerritoryControl(gameState, move, piece) * 1.8
      score += this.evaluateEndgamePosition(gameState, move, piece) * 2.5
      score += this.evaluateScoreMaximization(gameState, move, piece) * 3.0

      // NEW: RUTHLESS SABOTAGE BONUSES
      score += this.evaluateAggressiveSabotage(gameState, move, piece) * 5.0  // NEW AGGRESSIVE FACTOR
      score += this.evaluateOpponentDenial(gameState, move, piece) * 3.5     // NEW DENIAL FACTOR
      score += this.evaluateChokePointControl(gameState, move, piece) * 4.0  // NEW CHOKEPOINT CONTROL

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
    let blockingScore = 0
    const [anchorX, anchorY] = move.anchor
    const opponentId = 1 // Player is always 1, AI is always 2

    // Check each cell this piece would occupy
    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // High-value strategic positions to block
      blockingScore += this.evaluateStrategicPositionDenial(board, x, y)

      // Block opponent pattern formations
      blockingScore += this.evaluatePatternDisruption(board, x, y, opponentId) * 3

      // Block corner and edge positions (very valuable)
      if (this.isCornerOrEdge(board, x, y)) {
        blockingScore += 8
      }

      // Block central positions early game
      const fillRatio = this.calculateBoardFillRatio(board)
      if (fillRatio < 0.3 && this.isCentralPosition(board, x, y)) {
        blockingScore += 6
      }

      // Deny large empty areas to opponent
      blockingScore += this.evaluateAreaDenial(board, x, y) * 2
    }

    return blockingScore
  }

  static countFutureOptions(board, move, piece) {
    const [anchorX, anchorY] = move.anchor
    let futureOptions = 0

    // Simulate placing the piece and count remaining options
    const testBoard = this.simulatePlacement(board, move, piece, 2)

    // Count potential placement spots for remaining pieces
    const samplePositions = this.generateSamplePositions(testBoard)

    for (const [x, y] of samplePositions) {
      if (testBoard.grid[y][x] === 0) {
        // Count how many different piece types could fit here
        futureOptions += this.countPieceFitOptions(testBoard, x, y)
      }
    }

    // Bonus for moves that create multiple future opportunities
    if (futureOptions > 15) {
      futureOptions += 5
    }

    return futureOptions
  }

  static evaluatePatternCompletion(board, move, piece) {
    let completionScore = 0
    const [anchorX, anchorY] = move.anchor

    // Check if this move completes or enhances patterns
    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Check line completion potential
      completionScore += this.evaluateLineCompletion(board, x, y, 2) * 4

      // Check rectangle completion potential
      completionScore += this.evaluateRectangleCompletion(board, x, y, 2) * 6

      // Check territory completion
      completionScore += this.evaluateTerritoryCompletion(board, x, y, 2) * 3
    }

    return completionScore
  }

  static estimateScoreGain(board, move, piece) {
    let scoreEstimate = piece.relCells.length // Base score

    // Enhanced scoring based on pattern potential
    const [anchorX, anchorY] = move.anchor

    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Line formation bonus
      const lineScore = this.estimateLineScore(board, x, y, 2)
      scoreEstimate += lineScore * 0.8

      // Rectangle formation bonus
      const rectScore = this.estimateRectangleScore(board, x, y, 2)
      scoreEstimate += rectScore * 1.2

      // Strategic position multiplier
      const positionMultiplier = this.getPositionScoreMultiplier(board, x, y)
      scoreEstimate *= positionMultiplier
    }

    return scoreEstimate
  }

  /**
   * AGGRESSIVE AI HELPER METHODS - SABOTAGE & DISRUPTION
   */

  /**
   * Evaluate how strategic denying this position would be
   */
  static evaluateStrategicPositionDenial(board, x, y) {
    let denialValue = 0

    // High value for positions that control multiple areas
    const controlledArea = this.countControlledArea(board, x, y)
    denialValue += controlledArea * 0.3

    // High value for intersection points
    if (this.isIntersectionPoint(board, x, y)) {
      denialValue += 4
    }

    // High value for chokepoints
    if (this.isChokepoint(board, x, y)) {
      denialValue += 6
    }

    return denialValue
  }

  /**
   * Evaluate pattern disruption potential
   */
  static evaluatePatternDisruption(board, x, y, opponentId) {
    let disruptionScore = 0

    // Check if this position would break potential opponent patterns
    disruptionScore += this.checkLineDisruption(board, x, y, opponentId) * 2
    disruptionScore += this.checkRectangleDisruption(board, x, y, opponentId) * 3
    disruptionScore += this.checkTerritoryDisruption(board, x, y, opponentId) * 1.5

    return disruptionScore
  }

  /**
   * Check if position is corner or edge
   */
  static isCornerOrEdge(board, x, y) {
    const isEdge = x === 0 || x === board.cols - 1 || y === 0 || y === board.rows - 1
    const isCorner = (x <= 1 || x >= board.cols - 2) && (y <= 1 || y >= board.rows - 2)
    return isEdge || isCorner
  }

  /**
   * Check if position is central
   */
  static isCentralPosition(board, x, y) {
    const centerX = Math.floor(board.cols / 2)
    const centerY = Math.floor(board.rows / 2)
    const distance = Math.abs(x - centerX) + Math.abs(y - centerY)
    return distance <= 2
  }

  /**
   * Evaluate area denial value
   */
  static evaluateAreaDenial(board, x, y) {
    let largestEmptyArea = 0

    // Count connected empty areas around this position
    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === 0) {
          const areaSize = this.countConnectedEmptyArea(board, nx, ny, new Set())
          largestEmptyArea = Math.max(largestEmptyArea, areaSize)
        }
      }
    }

    // Higher value for denying larger areas
    return Math.min(largestEmptyArea * 0.2, 5)
  }

  /**
   * Simulate placing a piece on the board
   */
  static simulatePlacement(board, move, piece, playerId) {
    const testBoard = {
      ...board,
      grid: board.grid.map(row => [...row])
    }

    const [anchorX, anchorY] = move.anchor
    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy
      if (x >= 0 && x < board.cols && y >= 0 && y < board.rows) {
        testBoard.grid[y][x] = playerId
      }
    }

    return testBoard
  }

  /**
   * Generate sample positions for analysis
   */
  static generateSamplePositions(board) {
    const positions = []
    const step = Math.max(1, Math.floor(board.cols / 8))

    for (let y = 0; y < board.rows; y += step) {
      for (let x = 0; x < board.cols; x += step) {
        positions.push([x, y])
      }
    }

    return positions
  }

  /**
   * Count how many piece types could fit at position
   */
  static countPieceFitOptions(board, x, y) {
    let options = 0

    // Test small pieces (1-3 cells) - simplified
    const testSizes = [1, 2, 3]
    for (const size of testSizes) {
      if (this.canFitPieceOfSize(board, x, y, size)) {
        options += size
      }
    }

    return options
  }

  /**
   * Pattern completion evaluation methods
   */
  static evaluateLineCompletion(board, x, y, playerId) {
    let lineBonus = 0

    // Check both horizontal and vertical line extensions
    for (const [dx, dy] of [[1,0], [0,1]]) {
      const lineLength = this.getMaxLineExtension(board, x, y, dx, dy, playerId)
      if (lineLength >= 3) {
        lineBonus += lineLength * 2
      }
    }

    return lineBonus
  }

  static evaluateRectangleCompletion(board, x, y, playerId) {
    let rectBonus = 0

    // Check potential rectangle formations around this position
    for (let size = 2; size <= 4; size++) {
      if (this.contributesToRectangle(board, x, y, size, playerId)) {
        rectBonus += size * 3
      }
    }

    return rectBonus
  }

  static evaluateTerritoryCompletion(board, x, y, playerId) {
    // Count nearby allied pieces for territory control
    let territoryBonus = 0
    let alliedPieces = 0

    for (let nx = x - 2; nx <= x + 2; nx++) {
      for (let ny = y - 2; ny <= y + 2; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === playerId) {
            alliedPieces++
          }
        }
      }
    }

    territoryBonus = alliedPieces * 0.5
    return territoryBonus
  }

  /**
   * Score estimation methods
   */
  static estimateLineScore(board, x, y, playerId) {
    let maxLineScore = 0

    for (const [dx, dy] of [[1,0], [0,1], [1,1], [1,-1]]) {
      const lineLength = this.getMaxLineExtension(board, x, y, dx, dy, playerId)
      if (lineLength >= 4) {
        maxLineScore = Math.max(maxLineScore, 5 + lineLength)
      }
    }

    return maxLineScore
  }

  static estimateRectangleScore(board, x, y, playerId) {
    let maxRectScore = 0

    for (let size = 2; size <= 4; size++) {
      if (this.contributesToRectangle(board, x, y, size, playerId)) {
        maxRectScore = Math.max(maxRectScore, 7 + size * 2)
      }
    }

    return maxRectScore
  }

  static getPositionScoreMultiplier(board, x, y) {
    let multiplier = 1.0

    // Corner bonus
    if (this.isCornerOrEdge(board, x, y)) {
      multiplier += 0.3
    }

    // Center bonus (early game)
    if (this.isCentralPosition(board, x, y)) {
      const fillRatio = this.calculateBoardFillRatio(board)
      if (fillRatio < 0.4) {
        multiplier += 0.2
      }
    }

    return multiplier
  }

  /**
   * Disruption analysis methods
   */
  static checkLineDisruption(board, x, y, opponentId) {
    let disruption = 0

    // Check if placing here would break opponent lines
    for (const [dx, dy] of [[1,0], [0,1]]) {
      const lineLength = this.getMaxLineExtension(board, x, y, dx, dy, opponentId)
      if (lineLength >= 2) {
        disruption += lineLength
      }
    }

    return disruption
  }

  static checkRectangleDisruption(board, x, y, opponentId) {
    // Check if this position would prevent opponent rectangles
    let disruption = 0

    for (let size = 2; size <= 3; size++) {
      if (this.wouldBlockRectangle(board, x, y, size, opponentId)) {
        disruption += size * 2
      }
    }

    return disruption
  }

  static checkTerritoryDisruption(board, x, y, opponentId) {
    let disruption = 0
    let nearbyOpponents = 0

    // Count nearby opponent pieces
    for (let nx = x - 1; nx <= x + 1; nx++) {
      for (let ny = y - 1; ny <= y + 1; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === opponentId) {
            nearbyOpponents++
          }
        }
      }
    }

    disruption = nearbyOpponents * 1.5
    return disruption
  }

  /**
   * Utility analysis methods
   */
  static countControlledArea(board, x, y) {
    // Count empty cells in control radius
    let controlled = 0

    for (let nx = x - 2; nx <= x + 2; nx++) {
      for (let ny = y - 2; ny <= y + 2; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === 0) {
            controlled++
          }
        }
      }
    }

    return controlled
  }

  static isIntersectionPoint(board, x, y) {
    // Check if this position connects multiple areas
    let emptyDirections = 0

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === 0) {
          emptyDirections++
        }
      }
    }

    return emptyDirections >= 3
  }

  static isChokepoint(board, x, y) {
    // Check if this position controls passage between areas
    return this.countConnectedEmptyAreas(board, x, y) > 1
  }

  static countConnectedEmptyArea(board, x, y, visited, depth = 0) {
    // Prevent infinite recursion and excessive computation
    if (depth > 50 || this.shouldAbortComputation()) return 0

    const key = `${x},${y}`
    if (visited.has(key)) return 0
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) return 0
    if (board.grid[y][x] !== 0) return 0

    visited.add(key)
    let area = 1

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      if (this.shouldAbortComputation()) break
      area += this.countConnectedEmptyArea(board, x + dx, y + dy, visited, depth + 1)
    }

    return area
  }

  static countConnectedEmptyAreas(board, x, y) {
    // Abort if computation is taking too long
    if (this.shouldAbortComputation()) return 1

    // Safely check bounds
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) return 0

    // Temporarily block this position and count separate empty areas
    const originalValue = board.grid[y][x]

    try {
      board.grid[y][x] = -1

      let areas = 0
      const globalVisited = new Set()

      for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
        if (this.shouldAbortComputation()) break

        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          const key = `${nx},${ny}`
          if (!globalVisited.has(key) && board.grid[ny][nx] === 0) {
            this.countConnectedEmptyArea(board, nx, ny, globalVisited)
            areas++
          }
        }
      }

      return areas
    } finally {
      // Always restore the original value
      board.grid[y][x] = originalValue
    }
  }

  static canFitPieceOfSize(board, x, y, size) {
    let fittableCells = 0

    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const nx = x + dx
        const ny = y + dy
        if (nx < board.cols && ny < board.rows && board.grid[ny][nx] === 0) {
          fittableCells++
        }
      }
    }

    return fittableCells >= size
  }

  static getMaxLineExtension(board, x, y, dx, dy, playerId) {
    let length = 0

    // Count in positive direction
    let nx = x + dx
    let ny = y + dy
    while (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows &&
           board.grid[ny][nx] === playerId) {
      length++
      nx += dx
      ny += dy
    }

    // Count in negative direction
    nx = x - dx
    ny = y - dy
    while (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows &&
           board.grid[ny][nx] === playerId) {
      length++
      nx -= dx
      ny -= dy
    }

    return length
  }

  static contributesToRectangle(board, x, y, size, playerId) {
    // Check if this position could be part of a rectangle
    for (let rx = x - size + 1; rx <= x; rx++) {
      for (let ry = y - size + 1; ry <= y; ry++) {
        if (this.isValidRectanglePosition(board, rx, ry, size, playerId)) {
          return true
        }
      }
    }
    return false
  }

  static wouldBlockRectangle(board, x, y, size, opponentId) {
    // Check if placing here would prevent opponent rectangle
    for (let rx = x - size + 1; rx <= x; rx++) {
      for (let ry = y - size + 1; ry <= y; ry++) {
        if (this.isValidRectanglePosition(board, rx, ry, size, opponentId, true)) {
          return true
        }
      }
    }
    return false
  }

  static isValidRectanglePosition(board, rx, ry, size, playerId, checkEmpty = false) {
    let validCells = 0
    let totalCells = size * size

    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const nx = rx + dx
        const ny = ry + dy
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          const cellValue = board.grid[ny][nx]
          if (checkEmpty && cellValue === 0) {
            validCells++
          } else if (!checkEmpty && cellValue === playerId) {
            validCells++
          }
        }
      }
    }

    return validCells >= Math.floor(totalCells * 0.6)
  }

  /**
   * NEW AGGRESSIVE SABOTAGE METHODS - MAXIMUM AGGRESSION
   */

  /**
   * Evaluate aggressive sabotage opportunities
   */
  static evaluateAggressiveSabotage(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor
    let sabotageScore = 0

    for (const [dx, dy] of piece.relCells) {
      // Abort if taking too long
      if (this.shouldAbortComputation()) break

      const x = anchorX + dx
      const y = anchorY + dy

      // Ruthlessly prioritize disrupting opponent's best spots
      sabotageScore += this.evaluateOpponentHotspotDestruction(board, x, y) * 3

      // Aggressively deny opponent pattern completions
      sabotageScore += this.evaluatePatternDenial(board, x, y) * 4

      // Block opponent's territorial expansion ruthlessly
      sabotageScore += this.evaluateTerritorialBlocking(board, x, y) * 2.5

      // Destroy opponent's strategic positioning
      sabotageScore += this.evaluateStrategicDestruction(board, x, y) * 3.5
    }

    return sabotageScore
  }

  /**
   * Evaluate opponent denial opportunities
   */
  static evaluateOpponentDenial(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor
    let denialScore = 0

    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Deny opponent access to high-value areas
      denialScore += this.evaluateHighValueAreaDenial(board, x, y) * 2.5

      // Block opponent's future piece placement options
      denialScore += this.evaluateFuturePlacementDenial(board, x, y) * 2

      // Cut off opponent's escape routes and expansion paths
      denialScore += this.evaluateExpansionPathBlocking(board, x, y) * 3
    }

    return denialScore
  }

  /**
   * Evaluate chokepoint control opportunities
   */
  static evaluateChokePointControl(gameState, move, piece) {
    const board = gameState.board
    const [anchorX, anchorY] = move.anchor
    let chokeScore = 0

    for (const [dx, dy] of piece.relCells) {
      const x = anchorX + dx
      const y = anchorY + dy

      // Control critical board positions
      if (this.isCriticalChokepoint(board, x, y)) {
        chokeScore += 8
      }

      // Control passages between board areas
      if (this.controlsPassage(board, x, y)) {
        chokeScore += 6
      }

      // Control board center early game
      const fillRatio = this.calculateBoardFillRatio(board)
      if (fillRatio < 0.3 && this.isCentralPosition(board, x, y)) {
        chokeScore += 5
      }
    }

    return chokeScore
  }

  /**
   * AGGRESSIVE HELPER METHODS - SABOTAGE IMPLEMENTATION
   */

  static evaluateOpponentHotspotDestruction(board, x, y) {
    let destructionValue = 0
    const opponentId = 1

    // Check if this position ruins a powerful opponent formation
    for (let checkSize = 3; checkSize <= 5; checkSize++) {
      if (this.wouldDestroyOpponentFormation(board, x, y, checkSize, opponentId)) {
        destructionValue += checkSize * 2
      }
    }

    // Extra bonus for ruining corner/edge formations
    if (this.isCornerOrEdge(board, x, y)) {
      destructionValue += 4
    }

    return destructionValue
  }

  static evaluatePatternDenial(board, x, y) {
    let denialValue = 0
    const opponentId = 1

    // Deny line patterns
    denialValue += this.countPotentialOpponentLines(board, x, y, opponentId) * 2

    // Deny rectangle patterns
    denialValue += this.countPotentialOpponentRectangles(board, x, y, opponentId) * 3

    // Deny territory control
    denialValue += this.countOpponentTerritoryDenied(board, x, y, opponentId) * 1.5

    return denialValue
  }

  static evaluateTerritorialBlocking(board, x, y) {
    let blockingValue = 0
    const opponentId = 1

    // Count opponent pieces that would be isolated
    blockingValue += this.countOpponentPiecesIsolated(board, x, y, opponentId) * 2

    // Block opponent expansion into empty areas
    blockingValue += this.evaluateExpansionBlocking(board, x, y, opponentId) * 1.5

    return blockingValue
  }

  static evaluateStrategicDestruction(board, x, y) {
    let destructionValue = 0

    // Destroy opponent's positional advantages
    if (this.destroysOpponentPosition(board, x, y)) {
      destructionValue += 6
    }

    // Force opponent into bad positions
    if (this.forcesOpponentIntoCorner(board, x, y)) {
      destructionValue += 4
    }

    return destructionValue
  }

  static evaluateHighValueAreaDenial(board, x, y) {
    let areaValue = 0

    // High value for center control
    if (this.isCentralPosition(board, x, y)) {
      areaValue += 3
    }

    // High value for corner/edge control
    if (this.isCornerOrEdge(board, x, y)) {
      areaValue += 4
    }

    // High value for controlling large empty areas
    const emptyAreaSize = this.getLargestNearbyEmptyArea(board, x, y)
    areaValue += Math.min(emptyAreaSize * 0.3, 4)

    return areaValue
  }

  static evaluateFuturePlacementDenial(board, x, y) {
    let denialValue = 0

    // Count how many opponent placement options this eliminates
    const placementOptions = this.countNearbyPlacementOptions(board, x, y, 1)
    denialValue += placementOptions * 0.5

    // Special bonus for eliminating large piece placement options
    if (this.preventsLargePiecePlacement(board, x, y)) {
      denialValue += 3
    }

    return denialValue
  }

  static evaluateExpansionPathBlocking(board, x, y) {
    let blockingValue = 0
    const opponentId = 1

    // Block paths between opponent territories
    if (this.blocksOpponentPath(board, x, y, opponentId)) {
      blockingValue += 4
    }

    // Block access to board edges
    if (this.blocksEdgeAccess(board, x, y)) {
      blockingValue += 2
    }

    return blockingValue
  }

  static isCriticalChokepoint(board, x, y) {
    // More sophisticated chokepoint detection
    const emptyAreas = this.countConnectedEmptyAreas(board, x, y)
    return emptyAreas >= 3 || this.connectsMultipleRegions(board, x, y)
  }

  static controlsPassage(board, x, y) {
    // Check if this position controls movement between regions
    return this.isNarrowPassage(board, x, y) || this.isBridgePosition(board, x, y)
  }

  /**
   * Additional helper methods for aggressive behavior
   */

  static wouldDestroyOpponentFormation(board, x, y, size, opponentId) {
    // Check if placing here destroys an existing opponent formation
    let nearbyOpponentCells = 0
    for (let dx = -size; dx <= size; dx++) {
      for (let dy = -size; dy <= size; dy++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === opponentId) {
            nearbyOpponentCells++
          }
        }
      }
    }
    return nearbyOpponentCells >= size
  }

  static countPotentialOpponentLines(board, x, y, opponentId) {
    let lineCount = 0

    // Check horizontal and vertical potential lines
    for (const [dx, dy] of [[1,0], [0,1], [1,1], [1,-1]]) {
      if (this.wouldBlockOpponentLine(board, x, y, dx, dy, opponentId)) {
        lineCount++
      }
    }

    return lineCount
  }

  static countPotentialOpponentRectangles(board, x, y, opponentId) {
    let rectCount = 0

    for (let size = 2; size <= 4; size++) {
      if (this.wouldBlockRectangle(board, x, y, size, opponentId)) {
        rectCount++
      }
    }

    return rectCount
  }

  static countOpponentTerritoryDenied(board, x, y, opponentId) {
    let territoryDenied = 0

    // Count opponent pieces within influence range
    for (let nx = x - 2; nx <= x + 2; nx++) {
      for (let ny = y - 2; ny <= y + 2; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === opponentId) {
            territoryDenied++
          }
        }
      }
    }

    return territoryDenied
  }

  static countOpponentPiecesIsolated(board, x, y, opponentId) {
    // Count opponent pieces that would be cut off by this placement
    let isolated = 0

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === opponentId) {
          if (this.wouldIsolatePiece(board, nx, ny, x, y, opponentId)) {
            isolated++
          }
        }
      }
    }

    return isolated
  }

  static evaluateExpansionBlocking(board, x, y, opponentId) {
    let blocking = 0

    // Check how many opponent expansion routes this blocks
    const expansionRoutes = this.countOpponentExpansionRoutes(board, x, y, opponentId)
    blocking += expansionRoutes * 0.8

    return blocking
  }

  static destroysOpponentPosition(board, x, y) {
    // Simplified check for destroying opponent positional advantage
    const opponentId = 1
    let nearbyOpponents = 0

    for (let nx = x - 1; nx <= x + 1; nx++) {
      for (let ny = y - 1; ny <= y + 1; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === opponentId) {
            nearbyOpponents++
          }
        }
      }
    }

    return nearbyOpponents >= 3
  }

  static forcesOpponentIntoCorner(board, x, y) {
    // Check if this move limits opponent to corner/edge positions
    return this.isCornerOrEdge(board, x, y) && this.reducesOpponentOptions(board, x, y)
  }

  static getLargestNearbyEmptyArea(board, x, y) {
    let largestArea = 0

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === 0) {
          const areaSize = this.countConnectedEmptyArea(board, nx, ny, new Set())
          largestArea = Math.max(largestArea, areaSize)
        }
      }
    }

    return largestArea
  }

  static countNearbyPlacementOptions(board, x, y, opponentId) {
    // Count placement options in nearby area
    let options = 0

    for (let nx = x - 2; nx <= x + 2; nx++) {
      for (let ny = y - 2; ny <= y + 2; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === 0) {
            options++
          }
        }
      }
    }

    return options
  }

  static preventsLargePiecePlacement(board, x, y) {
    // Check if this prevents placement of large pieces (4+ cells)
    const requiredSpace = 4
    let availableSpace = 0

    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        const nx = x + dx
        const ny = y + dy
        if (nx < board.cols && ny < board.rows && board.grid[ny][nx] === 0) {
          availableSpace++
        }
      }
    }

    return availableSpace >= requiredSpace
  }

  static blocksOpponentPath(board, x, y, opponentId) {
    // Check if this blocks movement between opponent territories
    const nearbyOpponentGroups = this.countNearbyOpponentGroups(board, x, y, opponentId)
    return nearbyOpponentGroups >= 2
  }

  static blocksEdgeAccess(board, x, y) {
    // Check if this blocks access to board edges
    const distanceToEdge = Math.min(x, y, board.cols - 1 - x, board.rows - 1 - y)
    return distanceToEdge <= 2
  }

  static connectsMultipleRegions(board, x, y) {
    // Check if this position connects multiple empty regions
    return this.countConnectedEmptyAreas(board, x, y) >= 2
  }

  static isNarrowPassage(board, x, y) {
    // Check if this is a narrow passage between areas
    let emptyNeighbors = 0
    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === 0) {
          emptyNeighbors++
        }
      }
    }
    return emptyNeighbors === 2
  }

  static isBridgePosition(board, x, y) {
    // Check if this position bridges two areas
    const [left, right, top, bottom] = [
      x > 0 ? board.grid[y][x-1] : -1,
      x < board.cols-1 ? board.grid[y][x+1] : -1,
      y > 0 ? board.grid[y-1][x] : -1,
      y < board.rows-1 ? board.grid[y+1][x] : -1
    ]

    // Bridge if empty spaces on opposite sides
    return (left === 0 && right === 0) || (top === 0 && bottom === 0)
  }

  static wouldBlockOpponentLine(board, x, y, dx, dy, opponentId) {
    // Check if placing here would block a potential opponent line
    let opponentCells = 0

    // Check in both directions
    for (let direction = -1; direction <= 1; direction += 2) {
      let checkX = x + direction * dx
      let checkY = y + direction * dy
      let distance = 0

      while (checkX >= 0 && checkX < board.cols && checkY >= 0 && checkY < board.rows && distance < 3) {
        if (board.grid[checkY][checkX] === opponentId) {
          opponentCells++
        } else if (board.grid[checkY][checkX] !== 0) {
          break
        }
        checkX += direction * dx
        checkY += direction * dy
        distance++
      }
    }

    return opponentCells >= 2
  }

  static wouldIsolatePiece(board, pieceX, pieceY, blockX, blockY, opponentId) {
    // Temporarily place the block and check if piece becomes isolated
    const originalValue = board.grid[blockY][blockX]
    board.grid[blockY][blockX] = 2 // AI player

    const isolated = this.isPieceIsolated(board, pieceX, pieceY, opponentId)

    board.grid[blockY][blockX] = originalValue
    return isolated
  }

  static isPieceIsolated(board, x, y, playerId) {
    // Check if piece has connections to other pieces of same player
    const visited = new Set()
    const connectedPieces = this.countConnectedPieces(board, x, y, playerId, visited)
    return connectedPieces <= 1
  }

  static countConnectedPieces(board, x, y, playerId, visited, depth = 0) {
    // Prevent infinite recursion and excessive computation
    if (depth > 50 || this.shouldAbortComputation()) return 0

    const key = `${x},${y}`
    if (visited.has(key)) return 0
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) return 0
    if (board.grid[y][x] !== playerId) return 0

    visited.add(key)
    let count = 1

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      if (this.shouldAbortComputation()) break
      count += this.countConnectedPieces(board, x + dx, y + dy, playerId, visited, depth + 1)
    }

    return count
  }

  static countOpponentExpansionRoutes(board, x, y, opponentId) {
    // Count potential expansion paths this position would block
    let routes = 0

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === 0) {
          // Check if this connects to opponent territory
          if (this.connectsToOpponentTerritory(board, nx, ny, opponentId)) {
            routes++
          }
        }
      }
    }

    return routes
  }

  static connectsToOpponentTerritory(board, x, y, opponentId) {
    // Check if this empty space connects to opponent pieces
    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
        if (board.grid[ny][nx] === opponentId) {
          return true
        }
      }
    }
    return false
  }

  static reducesOpponentOptions(board, x, y) {
    // Check if placing here significantly reduces opponent's future options
    const nearbyEmptySpaces = this.countNearbyEmptySpaces(board, x, y)
    return nearbyEmptySpaces >= 4 // High-value position
  }

  static countNearbyEmptySpaces(board, x, y) {
    let empty = 0

    for (let nx = x - 1; nx <= x + 1; nx++) {
      for (let ny = y - 1; ny <= y + 1; ny++) {
        if (nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === 0) {
            empty++
          }
        }
      }
    }

    return empty
  }

  static countNearbyOpponentGroups(board, x, y, opponentId) {
    // Count distinct opponent groups near this position (simplified for performance)
    if (this.shouldAbortComputation()) return 0

    const visited = new Set()
    let groups = 0

    // Reduced search area for performance
    for (let nx = x - 1; nx <= x + 1; nx++) {
      for (let ny = y - 1; ny <= y + 1; ny++) {
        if (this.shouldAbortComputation()) break

        const key = `${nx},${ny}`
        if (!visited.has(key) && nx >= 0 && nx < board.cols && ny >= 0 && ny < board.rows) {
          if (board.grid[ny][nx] === opponentId) {
            this.markOpponentGroup(board, nx, ny, opponentId, visited, 0)
            groups++
          }
        }
      }
      if (this.shouldAbortComputation()) break
    }

    return groups
  }

  static markOpponentGroup(board, x, y, opponentId, visited, depth = 0) {
    // Prevent infinite recursion and excessive computation
    if (depth > 50 || this.shouldAbortComputation()) return

    const key = `${x},${y}`
    if (visited.has(key)) return
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) return
    if (board.grid[y][x] !== opponentId) return

    visited.add(key)

    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      if (this.shouldAbortComputation()) break
      this.markOpponentGroup(board, x + dx, y + dy, opponentId, visited, depth + 1)
    }
  }

  /**
   * Execute a function with timeout protection
   * @param {Function} fn - Function to execute
   * @param {any} fallback - Fallback value if timeout occurs
   * @param {number} timeout - Timeout in milliseconds (default: 1000)
   * @returns {any} - Function result or fallback
   */
  static withTimeout(fn, fallback, timeout = 1000) {
    const startTime = Date.now()

    try {
      // Set a simple time check for expensive operations
      this.computationStart = startTime
      this.maxComputationTime = timeout

      const result = fn()

      // Check if we exceeded the time limit
      if (Date.now() - startTime > timeout) {
        console.warn(`AI computation took ${Date.now() - startTime}ms, using fallback`)
        return fallback
      }

      return result
    } catch (error) {
      console.error('AI computation error:', error)
      return fallback
    } finally {
      this.computationStart = null
      this.maxComputationTime = null
    }
  }

  /**
   * Check if AI computation should be aborted due to timeout
   * @returns {boolean} - True if should abort
   */
  static shouldAbortComputation() {
    if (!this.computationStart || !this.maxComputationTime) return false
    return (Date.now() - this.computationStart) > this.maxComputationTime
  }

  /**
   * Get a delay time for AI actions to make them feel more natural
   * @returns {number} - Delay in milliseconds
   */
  static getActionDelay() {
    return 800 + Math.random() * 400 // 800-1200ms delay
  }
}
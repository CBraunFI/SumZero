/**
 * Placement Engine Implementation
 * Handles piece placement legality, move validation, and legal move enumeration
 */

import { isInBounds, areCellsEmpty, placePiece } from '../board/Board.js'
import { pieceLibrary } from '../pieces/PieceLibrary.js'
import { applyTransform, calculateAbsCells, getBounds } from '../geometry/Transform.js'
import { cloneGameState } from '../game/GameState.js'

/**
 * Check if a piece placement is legal
 * @param {Object} board - Board object
 * @param {Array<Array<number>>} transformedCells - Transformed piece coordinates
 * @param {Array<number>} anchor - Anchor position [x, y]
 * @returns {boolean} True if placement is legal
 */
export function isLegalPlacement(board, transformedCells, anchor) {
  const [anchorX, anchorY] = anchor

  for (const [dx, dy] of transformedCells) {
    const x = anchorX + dx
    const y = anchorY + dy

    // Check bounds
    if (!isInBounds(board, x, y)) {
      return false
    }

    // Check overlap
    if (board.grid[y][x] !== 0) {
      return false
    }
  }

  return true
}

/**
 * Check if player has any legal moves available
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID to check
 * @returns {boolean} True if player has legal moves
 */
export function hasLegalMove(gameState, playerId) {
  const arsenal = gameState.players[playerId].arsenal

  for (const [pieceId, quantity] of Object.entries(arsenal)) {
    if (quantity === 0) continue

    const transforms = pieceLibrary.getUniqueTransforms(pieceId)
    for (const { cells: transformedCells } of transforms) {
      const bounds = getBounds(transformedCells)

      // Optimize anchor iteration using bounds
      const maxX = gameState.board.cols - bounds.width
      const maxY = gameState.board.rows - bounds.height

      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
          if (isLegalPlacement(gameState.board, transformedCells, [x, y])) {
            return true // Early exit on first legal move
          }
        }
      }
    }
  }

  return false
}

/**
 * Enumerate all legal moves for a player
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID
 * @param {number} maxMoves - Maximum number of moves to return (for performance)
 * @returns {Array<Object>} Array of legal move objects
 */
export function enumerateLegalMoves(gameState, playerId, maxMoves = 1000) {
  const moves = []
  const arsenal = gameState.players[playerId].arsenal

  for (const [pieceId, quantity] of Object.entries(arsenal)) {
    if (quantity === 0 || moves.length >= maxMoves) continue

    const transforms = pieceLibrary.getUniqueTransforms(pieceId)

    for (const { transform, cells } of transforms) {
      if (moves.length >= maxMoves) break

      const bounds = getBounds(cells)
      const maxX = gameState.board.cols - bounds.width
      const maxY = gameState.board.rows - bounds.height

      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
          if (moves.length >= maxMoves) break

          if (isLegalPlacement(gameState.board, cells, [x, y])) {
            const move = createMove(playerId, pieceId, transform, [x, y])
            moves.push(move)
          }
        }
      }
    }
  }

  return moves
}

/**
 * Validate a move object
 * @param {Object} move - Move to validate
 * @param {Object} gameState - Current game state
 * @returns {boolean} True if move is valid
 */
export function isValidMove(gameState, move) {
  // Check move structure
  if (!move || !move.player || !move.pieceId || !move.anchor || !move.absCells) {
    return false
  }

  // Check player owns the piece
  const arsenal = gameState.players[move.player].arsenal
  if (!arsenal[move.pieceId] || arsenal[move.pieceId] <= 0) {
    return false
  }

  // Check piece exists in library
  if (!pieceLibrary.has(move.pieceId)) {
    return false
  }

  // Verify transformation and absolute cells calculation
  const piece = pieceLibrary.get(move.pieceId)
  const transformedCells = applyTransform(piece.relCells, move.transform)
  const expectedAbsCells = calculateAbsCells(transformedCells, move.anchor)

  // Check if calculated cells match provided cells
  if (move.absCells.length !== expectedAbsCells.length) {
    return false
  }

  for (let i = 0; i < move.absCells.length; i++) {
    const [x1, y1] = move.absCells[i]
    const [x2, y2] = expectedAbsCells[i]
    if (x1 !== x2 || y1 !== y2) {
      return false
    }
  }

  // Check placement legality
  return isLegalPlacement(gameState.board, transformedCells, move.anchor)
}

/**
 * Commit a move to the game state
 * @param {Object} gameState - Current game state
 * @param {Object} move - Move to commit
 * @returns {Object} Updated game state
 * @throws {Error} If move is invalid
 */
export function commitMove(gameState, move) {
  if (!isValidMove(gameState, move)) {
    throw new Error('Invalid move')
  }

  const newGameState = cloneGameState(gameState)

  // Apply to board
  newGameState.board = placePiece(newGameState.board, move.absCells, move.player)

  // Remove from arsenal
  const arsenal = newGameState.players[move.player].arsenal
  arsenal[move.pieceId] -= 1

  // Record in history
  newGameState.history.push(move)

  return newGameState
}

/**
 * Create a move object
 * @param {number} playerId - Player ID
 * @param {string} pieceId - Piece ID
 * @param {Object} transform - Transform object
 * @param {Array<number>} anchor - Anchor position
 * @returns {Object} Move object
 */
export function createMove(playerId, pieceId, transform, anchor) {
  const piece = pieceLibrary.get(pieceId)
  if (!piece) {
    throw new Error(`Unknown piece: ${pieceId}`)
  }

  const transformedCells = applyTransform(piece.relCells, transform)
  const absCells = calculateAbsCells(transformedCells, anchor)

  return {
    player: playerId,
    pieceId,
    transform,
    anchor,
    absCells
  }
}
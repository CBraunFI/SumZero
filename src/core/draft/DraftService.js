/**
 * Draft System Implementation
 * Handles piece purchasing, budget management, and draft end conditions
 */

import { getPieceCost } from '../pieces/PieceDefinitions.js'
import { cloneGameState } from '../game/GameState.js'

/**
 * Check if player can afford a piece
 * @param {Object} player - Player object
 * @param {string} pieceId - Piece ID to check
 * @returns {boolean} True if player can afford the piece
 */
export function canAfford(player, pieceId) {
  const cost = getPieceCost(pieceId)
  return player.budget >= cost
}

/**
 * Check if piece is available in stock
 * @param {Object} stock - Stock object
 * @param {string} pieceId - Piece ID to check
 * @returns {boolean} True if piece is in stock
 */
export function inStock(stock, pieceId) {
  return (stock[pieceId] > 0) || (stock[pieceId] === -1)
}

/**
 * Check if player can buy a specific piece
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID
 * @param {string} pieceId - Piece ID to buy
 * @returns {boolean} True if purchase is valid
 */
export function canBuy(gameState, playerId, pieceId) {
  const player = gameState.players[playerId]
  return canAfford(player, pieceId) && inStock(gameState.stock, pieceId)
}

/**
 * Execute piece purchase
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID
 * @param {string} pieceId - Piece ID to buy
 * @returns {Object} Updated game state
 * @throws {Error} If purchase is invalid
 */
export function buyPiece(gameState, playerId, pieceId) {
  if (!canBuy(gameState, playerId, pieceId)) {
    throw new Error(`Invalid purchase: Player ${playerId} cannot buy ${pieceId}`)
  }

  const newGameState = cloneGameState(gameState)
  const player = newGameState.players[playerId]
  const cost = getPieceCost(pieceId)

  // Deduct cost from budget
  player.budget -= cost

  // Remove from stock (if not unlimited)
  if (newGameState.stock[pieceId] !== -1) {
    newGameState.stock[pieceId] -= 1
  }

  // Add to player's arsenal
  player.arsenal[pieceId] = (player.arsenal[pieceId] || 0) + 1

  // Reset pass flags when a purchase is made
  newGameState.draftState.player1Passed = false
  newGameState.draftState.player2Passed = false
  newGameState.draftState.consecutivePasses = 0

  return newGameState
}

/**
 * Execute draft pass
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID passing
 * @returns {Object} Updated game state
 */
export function passDraft(gameState, playerId) {
  const newGameState = cloneGameState(gameState)

  if (playerId === 1) {
    newGameState.draftState.player1Passed = true
  } else {
    newGameState.draftState.player2Passed = true
  }

  // Update consecutive passes count
  if (newGameState.draftState.player1Passed && newGameState.draftState.player2Passed) {
    newGameState.draftState.consecutivePasses = 2
  } else {
    newGameState.draftState.consecutivePasses = 1
  }

  return newGameState
}

/**
 * Check if draft phase is over
 * @param {Object} gameState - Current game state
 * @returns {boolean} True if draft is over
 */
export function isDraftOver(gameState) {
  const { draftState, players, stock } = gameState

  // Both players have consecutively passed
  if (draftState.consecutivePasses >= 2) {
    return true
  }

  // Check if any player can afford any remaining stock
  const canBuyAny = [1, 2].some(playerId => {
    const player = players[playerId]
    return Object.keys(stock).some(pieceId =>
      stock[pieceId] > 0 && player.budget >= getPieceCost(pieceId)
    )
  })

  return !canBuyAny
}

/**
 * Get available pieces for purchase by a player
 * @param {Object} gameState - Current game state
 * @param {number} playerId - Player ID
 * @returns {Array<string>} Array of available piece IDs
 */
export function getAvailablePieces(gameState, playerId) {
  const player = gameState.players[playerId]
  const availablePieces = []

  for (const [pieceId, count] of Object.entries(gameState.stock)) {
    if (count > 0 && player.budget >= getPieceCost(pieceId)) {
      availablePieces.push(pieceId)
    }
  }

  return availablePieces
}

/**
 * Get total value of pieces in player's arsenal
 * @param {Object} arsenal - Player's arsenal
 * @returns {number} Total value of arsenal
 */
export function getArsenalValue(arsenal) {
  let totalValue = 0
  for (const [pieceId, count] of Object.entries(arsenal)) {
    totalValue += getPieceCost(pieceId) * count
  }
  return totalValue
}

/**
 * Check if player has any pieces in arsenal
 * @param {Object} arsenal - Player's arsenal
 * @returns {boolean} True if arsenal has pieces
 */
export function hasAnyPieces(arsenal) {
  return Object.values(arsenal).some(count => count > 0)
}
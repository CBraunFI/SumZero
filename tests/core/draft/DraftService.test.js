/**
 * Draft System Tests
 * Test draft mechanics including budget management and end conditions
 */

import { buyPiece, passDraft, isDraftOver, canBuy, getAvailablePieces } from '../../../src/core/draft/DraftService.js'
import { GameService } from '../../../src/core/game/GameService.js'

describe('Draft System', () => {
  let gameState

  beforeEach(() => {
    gameState = GameService.createNew(8, 8) // 64 cells, budget = 33
  })

  test('budget calculation is correct', () => {
    expect(gameState.players[1].budget).toBe(33) // (64//2)+1 = 33
    expect(gameState.players[2].budget).toBe(33)
  })

  test('canBuy validates budget and stock correctly', () => {
    expect(canBuy(gameState, 1, 'T4')).toBe(true) // Can afford 4-cost piece
    expect(canBuy(gameState, 1, 'I5')).toBe(true) // Can afford 5-cost piece

    // Reduce budget and test
    gameState.players[1].budget = 3
    expect(canBuy(gameState, 1, 'T4')).toBe(false) // Cannot afford 4-cost piece
  })

  test('buyPiece updates budget and arsenal correctly', () => {
    const newState = buyPiece(gameState, 1, 'T4')

    expect(newState.players[1].budget).toBe(29) // 33-4
    expect(newState.players[1].arsenal['T4']).toBe(1)
    expect(newState.stock['T4']).toBe(0) // Stock depleted in singleton mode
  })

  test('stock depletion prevents further purchases', () => {
    gameState.stock['T4'] = 1
    const state1 = buyPiece(gameState, 1, 'T4')

    expect(state1.stock['T4']).toBe(0)
    expect(canBuy(state1, 2, 'T4')).toBe(false) // Out of stock
  })

  test('draft ends when both players pass', () => {
    let state = passDraft(gameState, 1)
    expect(isDraftOver(state)).toBe(false)

    state = passDraft(state, 2)
    expect(isDraftOver(state)).toBe(true)
  })

  test('draft ends when no affordable pieces remain', () => {
    gameState.players[1].budget = 3
    gameState.players[2].budget = 3
    // All pieces cost 4 or 5, so no one can buy
    expect(isDraftOver(gameState)).toBe(true)
  })

  test('buying resets pass flags', () => {
    let state = passDraft(gameState, 1)
    expect(state.draftState.player1Passed).toBe(true)

    state = buyPiece(state, 2, 'O4') // Player 2 buys
    expect(state.draftState.player1Passed).toBe(false) // Reset
    expect(state.draftState.consecutivePasses).toBe(0)
  })

  test('getAvailablePieces returns only affordable pieces', () => {
    gameState.players[1].budget = 4 // Can only afford tetrominoes

    const available = getAvailablePieces(gameState, 1)

    expect(available).toContain('T4')
    expect(available).toContain('O4')
    expect(available).not.toContain('I5') // Too expensive
  })

  test('multiple pieces can be bought by same player', () => {
    let state = buyPiece(gameState, 1, 'T4')
    state = buyPiece(state, 1, 'L4')

    expect(state.players[1].arsenal['T4']).toBe(1)
    expect(state.players[1].arsenal['L4']).toBe(1)
    expect(state.players[1].budget).toBe(25) // 33-4-4
  })

  test('error thrown when buying unavailable piece', () => {
    gameState.stock['T4'] = 0 // No stock

    expect(() => {
      buyPiece(gameState, 1, 'T4')
    }).toThrow('Invalid purchase')
  })

  test('error thrown when buying unaffordable piece', () => {
    gameState.players[1].budget = 3 // Too low

    expect(() => {
      buyPiece(gameState, 1, 'T4')
    }).toThrow('Invalid purchase')
  })
})
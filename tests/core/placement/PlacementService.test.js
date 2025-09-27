/**
 * Placement Engine Tests
 * Test piece placement legality and move validation
 */

import {
  isLegalPlacement,
  hasLegalMove,
  isValidMove,
  commitMove,
  createMove,
  enumerateLegalMoves
} from '../../../src/core/placement/PlacementService.js'
import { createEmptyBoard } from '../../../src/core/board/Board.js'
import { GameService } from '../../../src/core/game/GameService.js'

describe('Placement Engine', () => {
  let gameState

  beforeEach(() => {
    gameState = GameService.createNew(10, 10)
    // Give players some pieces for testing
    gameState.players[1].arsenal = { 'O4': 1, 'I4': 1 }
    gameState.players[2].arsenal = { 'T4': 1 }
    gameState.phase = 'PLACEMENT'
  })

  test('rejects out-of-bounds placement', () => {
    const board = createEmptyBoard(5, 5)
    const piece = [[0,0],[1,0],[2,0],[3,0]] // I4

    expect(isLegalPlacement(board, piece, [2, 0])).toBe(false) // Extends right
    expect(isLegalPlacement(board, piece, [0, 2])).toBe(true)  // Fits vertically
  })

  test('rejects overlapping placement', () => {
    const board = createEmptyBoard(5, 5)
    board.grid[1][1] = 1 // Player 1 occupies [1,1]

    const piece = [[0,0],[1,0],[0,1],[1,1]] // O4
    expect(isLegalPlacement(board, piece, [0, 0])).toBe(false) // Overlaps at [1,1]
    expect(isLegalPlacement(board, piece, [2, 0])).toBe(true)  // No overlap
  })

  test('accepts valid placement', () => {
    const board = createEmptyBoard(10, 10)
    const piece = [[0,0],[1,0],[2,0],[1,1]] // T4

    expect(isLegalPlacement(board, piece, [3, 3])).toBe(true)
  })

  test('hasLegalMove detects available moves', () => {
    expect(hasLegalMove(gameState, 1)).toBe(true) // Has pieces and empty board
  })

  test('hasLegalMove detects no moves', () => {
    // Fill entire board except for 3 cells - not enough for any 4-cell piece
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (!(x === 9 && y === 9) && !(x === 8 && y === 9) && !(x === 7 && y === 9)) {
          gameState.board.grid[y][x] = 2
        }
      }
    }

    // Player 1 has I4 piece which needs 4 cells but only 3 available
    expect(hasLegalMove(gameState, 1)).toBe(false) // Cannot fit I4 in remaining space
  })

  test('createMove generates valid move object', () => {
    const move = createMove(1, 'O4', { rot: 0, flipX: false }, [3, 3])

    expect(move.player).toBe(1)
    expect(move.pieceId).toBe('O4')
    expect(move.anchor).toEqual([3, 3])
    expect(move.absCells).toEqual([[3,3],[4,3],[3,4],[4,4]])
  })

  test('isValidMove validates move structure and ownership', () => {
    const validMove = createMove(1, 'O4', { rot: 0, flipX: false }, [3, 3])
    expect(isValidMove(gameState, validMove)).toBe(true)

    const invalidMove1 = createMove(1, 'T4', { rot: 0, flipX: false }, [3, 3])
    expect(isValidMove(gameState, invalidMove1)).toBe(false) // Player doesn't own T4

    const invalidMove2 = createMove(2, 'O4', { rot: 0, flipX: false }, [3, 3])
    expect(isValidMove(gameState, invalidMove2)).toBe(false) // Player 2 doesn't own O4
  })

  test('commitMove updates board and arsenal', () => {
    const move = createMove(1, 'O4', { rot: 0, flipX: false }, [3, 3])
    const newState = commitMove(gameState, move)

    // Check board update
    expect(newState.board.grid[3][3]).toBe(1)
    expect(newState.board.grid[4][3]).toBe(1)
    expect(newState.board.grid[3][4]).toBe(1)
    expect(newState.board.grid[4][4]).toBe(1)

    // Check arsenal update
    expect(newState.players[1].arsenal['O4']).toBe(0)

    // Check history
    expect(newState.history).toHaveLength(1)
    expect(newState.history[0]).toEqual(move)
  })

  test('commitMove throws error for invalid move', () => {
    const invalidMove = {
      player: 1,
      pieceId: 'T4', // Player 1 doesn't own this
      transform: { rot: 0, flipX: false },
      anchor: [3, 3],
      absCells: [[3,3],[4,3],[5,3],[4,4]]
    }

    expect(() => {
      commitMove(gameState, invalidMove)
    }).toThrow('Invalid move')
  })

  test('enumerateLegalMoves returns valid moves', () => {
    const moves = enumerateLegalMoves(gameState, 1, 10)

    expect(moves.length).toBeGreaterThan(0)
    expect(moves.length).toBeLessThanOrEqual(10)

    // All moves should be valid
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      if (!isValidMove(gameState, move)) {
        console.log('Invalid move at index', i, ':', move)
        console.log('Player arsenal:', gameState.players[move.player].arsenal)
      }
      expect(isValidMove(gameState, move)).toBe(true)
    }
  })

  test('enumerateLegalMoves respects move limit', () => {
    const moves = enumerateLegalMoves(gameState, 1, 5)
    expect(moves.length).toBeLessThanOrEqual(5)
  })

  test('move validation checks transform consistency', () => {
    const move = createMove(1, 'O4', { rot: 0, flipX: false }, [3, 3])

    // Corrupt the absCells
    move.absCells = [[3,3],[4,3],[3,4],[5,5]] // Wrong last cell

    expect(isValidMove(gameState, move)).toBe(false)
  })
})
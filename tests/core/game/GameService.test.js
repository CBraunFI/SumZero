/**
 * Game Service Integration Tests
 * Test complete game flow and state transitions
 */

import { GameService } from '../../../src/core/game/GameService.js'
import { createMove } from '../../../src/core/placement/PlacementService.js'
import { GAME_PHASES } from '../../../src/utils/constants.js'

describe('Game Service Integration', () => {
  let gameState

  beforeEach(() => {
    gameState = GameService.createNew(8, 8)
  })

  test('creates valid initial game state', () => {
    expect(gameState.version).toBe('1.2')
    expect(gameState.phase).toBe(GAME_PHASES.DRAFT)
    expect(gameState.currentPlayer).toBe(1)
    expect(gameState.players[1].budget).toBe(33) // (64//2)+1
    expect(gameState.board.rows).toBe(8)
    expect(gameState.board.cols).toBe(8)
  })

  test('complete draft to placement transition', () => {
    // Draft some pieces
    gameState = GameService.draftBuy(gameState, 1, 'I4')
    expect(gameState.currentPlayer).toBe(2)

    gameState = GameService.draftBuy(gameState, 2, 'O4')
    expect(gameState.currentPlayer).toBe(1)

    gameState = GameService.draftBuy(gameState, 1, 'T4')
    expect(gameState.currentPlayer).toBe(2)

    gameState = GameService.draftBuy(gameState, 2, 'L4')
    expect(gameState.currentPlayer).toBe(1)

    // Both players pass to end draft
    gameState = GameService.draftPass(gameState, 1)
    gameState = GameService.draftPass(gameState, 2)

    expect(gameState.phase).toBe(GAME_PHASES.PLACEMENT)
    expect(gameState.currentPlayer).toBe(1) // Player 1 starts placement
  })

  test('placement phase with valid moves', () => {
    // Setup: quick draft
    gameState = GameService.draftBuy(gameState, 1, 'I4')
    gameState = GameService.draftBuy(gameState, 2, 'O4')
    gameState = GameService.draftPass(gameState, 1)
    gameState = GameService.draftPass(gameState, 2)

    expect(gameState.phase).toBe(GAME_PHASES.PLACEMENT)

    // Player 1 places I4
    const move1 = createMove(1, 'I4', { rot: 0, flipX: false }, [2, 2])
    gameState = GameService.placePiece(gameState, move1)

    expect(gameState.currentPlayer).toBe(2)
    expect(gameState.history).toHaveLength(1)

    // Player 2 places O4
    const move2 = createMove(2, 'O4', { rot: 0, flipX: false }, [0, 0])
    gameState = GameService.placePiece(gameState, move2)

    expect(gameState.currentPlayer).toBe(1)
    expect(gameState.history).toHaveLength(2)
  })

  test('game over when player has no legal moves', () => {
    // Create scenario where player loses
    const smallGame = GameService.createNew(4, 4)

    // Fill board except for 3 cells
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!(x === 3 && y === 3) && !(x === 2 && y === 3) && !(x === 1 && y === 3)) {
          smallGame.board.grid[y][x] = 1
        }
      }
    }

    // Give Player 2 a piece that needs 4 cells but only 3 available
    smallGame.players[2].arsenal = { 'I4': 1 }
    smallGame.currentPlayer = 2
    smallGame.phase = GAME_PHASES.PLACEMENT

    const resultState = GameService.startTurn(smallGame)

    expect(resultState.phase).toBe(GAME_PHASES.GAME_OVER)
    expect(resultState.winner).toBe(1) // Player 1 wins because Player 2 cannot move
  })

  test('save and load game state', () => {
    // Modify game state
    gameState = GameService.draftBuy(gameState, 1, 'T4')

    const saved = GameService.save(gameState)
    const loaded = GameService.load(saved)

    expect(loaded).toEqual(gameState)
  })

  test('restart creates new game with same config', () => {
    const restarted = GameService.restart(gameState)

    expect(restarted.board.rows).toBe(gameState.board.rows)
    expect(restarted.board.cols).toBe(gameState.board.cols)
    expect(restarted.config).toEqual(gameState.config)
    expect(restarted.phase).toBe(GAME_PHASES.DRAFT)
    expect(restarted.currentPlayer).toBe(1)
    expect(restarted.history).toHaveLength(0)
  })

  test('getStatus returns correct information', () => {
    const status = GameService.getStatus(gameState)

    expect(status.phase).toBe(GAME_PHASES.DRAFT)
    expect(status.currentPlayer).toBe(1)
    expect(status.winner).toBe(null)
    expect(status.turn).toBe(1)
    expect(status.isGameOver).toBe(false)
  })

  test('error handling for invalid operations', () => {
    // Try to place piece during draft
    expect(() => {
      const move = createMove(1, 'T4', { rot: 0, flipX: false }, [0, 0])
      GameService.placePiece(gameState, move)
    }).toThrow('Not in placement phase')

    // Try wrong player's turn
    expect(() => {
      GameService.draftBuy(gameState, 2, 'T4') // Player 1's turn
    }).toThrow('Not current player\'s turn')
  })

  test('version migration from 1.1 to 1.2', () => {
    const oldState = {
      version: '1.1',
      phase: 'DRAFT',
      board: { rows: 8, cols: 8, grid: Array(8).fill().map(() => Array(8).fill(0)) },
      players: {
        1: { id: 1, budget: 33, color: '#33CCFF', arsenal: ['T4', 'T4', 'O4'] },
        2: { id: 2, budget: 29, color: '#FF9933', arsenal: ['I4'] }
      },
      stock: {},
      currentPlayer: 1,
      history: [],
      winner: null,
      config: {}
    }

    const migrated = GameService.load(JSON.stringify(oldState))

    expect(migrated.version).toBe('1.2')
    expect(migrated.players[1].arsenal).toEqual({ 'T4': 2, 'O4': 1 })
    expect(migrated.players[2].arsenal).toEqual({ 'I4': 1 })
    expect(migrated.draftState).toBeDefined()
  })
})
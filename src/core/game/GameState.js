/**
 * GameState data structure and validation
 * Implements the complete game state model as specified
 */

import { createEmptyBoard } from '../board/Board.js'
import { GAME_PHASES, PLAYERS, DEFAULT_CONFIG, PLAYER_COLORS } from '../../utils/constants.js'
import { getAllPieces } from '../pieces/PieceDefinitions.js'

/**
 * Create initial game state
 * @param {number} rows - Board rows
 * @param {number} cols - Board columns
 * @param {Object} config - Game configuration
 * @returns {Object} Initial game state
 */
export function createInitialGameState(rows = 14, cols = 14, config = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Use custom board if provided, otherwise create empty board
  const board = config.customBoard || createEmptyBoard(rows, cols)

  // Calculate budget based on usable cells
  const usableCells = countUsableCells(board)
  const budget = Math.floor(usableCells / 2) + 1

  // Initialize stock based on configuration
  const stock = {}
  const allPieces = getAllPieces()

  for (const [pieceId, piece] of Object.entries(allPieces)) {
    const isTetrominoAllowed = finalConfig.allowTetrominoes && piece.size === 4
    const isPentominoAllowed = finalConfig.allowPentominoes && piece.size === 5

    if (isTetrominoAllowed || isPentominoAllowed) {
      stock[pieceId] = finalConfig.stockMode === 'singleton' ? 1 : -1
    }
  }

  return {
    version: '1.3',
    phase: GAME_PHASES.DRAFT,
    board,
    players: {
      [PLAYERS.PLAYER_1]: {
        id: PLAYERS.PLAYER_1,
        budget,
        color: PLAYER_COLORS[PLAYERS.PLAYER_1],
        arsenal: {}
      },
      [PLAYERS.PLAYER_2]: {
        id: PLAYERS.PLAYER_2,
        budget,
        color: PLAYER_COLORS[PLAYERS.PLAYER_2],
        arsenal: {}
      }
    },
    stock,
    currentPlayer: PLAYERS.PLAYER_1,
    draftState: {
      player1Passed: false,
      player2Passed: false,
      consecutivePasses: 0
    },
    scoring: {
      player1Score: 0,
      player2Score: 0,
      scoringHistory: [],
      lastScoringMove: null,
      highlightedPattern: null
    },
    endCondition: {
      type: 'both_players_blocked',
      scoreToWin: null
    },
    history: [],
    winner: null,
    config: finalConfig
  }
}

/**
 * Migrate game state to current version
 * @param {Object} gameState - Game state to migrate
 * @returns {Object} Migrated game state
 */
export function migrateGameState(gameState) {
  const migrated = cloneGameState(gameState)

  // Migrate from v1.2 to v1.3 (add scoring system)
  if (migrated.version === '1.2') {
    migrated.version = '1.3'
    migrated.scoring = {
      player1Score: 0,
      player2Score: 0,
      scoringHistory: [],
      lastScoringMove: null,
      highlightedPattern: null
    }
    migrated.endCondition = {
      type: 'both_players_blocked',
      scoreToWin: null
    }
  }

  return migrated
}

/**
 * Validate game state structure and data integrity
 * @param {Object} gameState - Game state to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateGameState(gameState) {
  const requiredFields = ['version', 'phase', 'board', 'players', 'stock', 'currentPlayer']

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in gameState)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Check scoring fields for v1.3+
  if (gameState.version === '1.3') {
    if (!gameState.scoring) {
      throw new Error('Missing scoring field in v1.3 game state')
    }
    const scoringFields = ['player1Score', 'player2Score', 'scoringHistory']
    for (const field of scoringFields) {
      if (!(field in gameState.scoring)) {
        throw new Error(`Missing scoring field: ${field}`)
      }
    }
  }

  // Validate phase
  if (!Object.values(GAME_PHASES).includes(gameState.phase)) {
    throw new Error(`Invalid phase: ${gameState.phase}`)
  }

  // Validate current player
  if (![PLAYERS.PLAYER_1, PLAYERS.PLAYER_2].includes(gameState.currentPlayer)) {
    throw new Error(`Invalid current player: ${gameState.currentPlayer}`)
  }

  // Validate board dimensions
  if (gameState.board.rows < 1 || gameState.board.cols < 1) {
    throw new Error('Invalid board dimensions')
  }

  // Validate grid consistency
  if (gameState.board.grid.length !== gameState.board.rows) {
    throw new Error('Grid height mismatch')
  }

  for (const row of gameState.board.grid) {
    if (row.length !== gameState.board.cols) {
      throw new Error('Grid width mismatch')
    }
  }

  // Validate players
  for (const playerId of [PLAYERS.PLAYER_1, PLAYERS.PLAYER_2]) {
    const player = gameState.players[playerId]
    if (!player || player.id !== playerId) {
      throw new Error(`Invalid player data for player ${playerId}`)
    }
    if (typeof player.budget !== 'number' || player.budget < 0) {
      throw new Error(`Invalid budget for player ${playerId}`)
    }
  }

  return true
}

/**
 * Create a deep copy of game state
 * @param {Object} gameState - Game state to clone
 * @returns {Object} Deep copy of game state
 */
export function cloneGameState(gameState) {
  return JSON.parse(JSON.stringify(gameState))
}

/**
 * Get opponent player ID
 * @param {number} playerId - Current player ID
 * @returns {number} Opponent player ID
 */
export function getOpponent(playerId) {
  return playerId === PLAYERS.PLAYER_1 ? PLAYERS.PLAYER_2 : PLAYERS.PLAYER_1
}

/**
 * Switch to next player
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state with switched player
 */
export function switchPlayer(gameState) {
  return {
    ...gameState,
    currentPlayer: getOpponent(gameState.currentPlayer)
  }
}

/**
 * Check if game is over
 * @param {Object} gameState - Game state to check
 * @returns {boolean} True if game is over
 */
export function isGameOver(gameState) {
  return gameState.phase === GAME_PHASES.GAME_OVER
}

/**
 * Get game winner
 * @param {Object} gameState - Game state
 * @returns {number|null} Winner player ID or null if no winner
 */
export function getWinner(gameState) {
  return gameState.winner
}

/**
 * Count usable cells in a board (excluding cells marked as -1)
 * @param {Object} board - Board object
 * @returns {number} Number of usable cells
 */
function countUsableCells(board) {
  let count = 0
  for (let y = 0; y < board.rows; y++) {
    for (let x = 0; x < board.cols; x++) {
      if (board.grid[y][x] !== -1) {
        count++
      }
    }
  }
  return count
}
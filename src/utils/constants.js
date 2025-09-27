/**
 * SumZero Game Constants
 * Centralized constants used throughout the application
 */

// Game phases
export const GAME_PHASES = {
  SETUP: 'SETUP',
  DRAFT: 'DRAFT',
  PLACEMENT: 'PLACEMENT',
  GAME_OVER: 'GAME_OVER'
}

// Player IDs
export const PLAYERS = {
  PLAYER_1: 1,
  PLAYER_2: 2
}

// UI states for interaction
export const UI_STATES = {
  IDLE: 'idle',
  PIECE_SELECTED: 'piece_selected',
  DRAGGING: 'dragging',
  PREVIEW: 'preview'
}

// Stock modes
export const STOCK_MODES = {
  SINGLETON: 'singleton',
  UNLIMITED: 'unlimited'
}

// Default game configuration
export const DEFAULT_CONFIG = {
  boardRows: 10,
  boardCols: 10,
  stockMode: STOCK_MODES.SINGLETON,
  allowPentominoes: true,
  allowTetrominoes: true,
  seed: null,
  ui: {
    showGrid: true,
    showHoverPreview: true,
    chessboardStyle: true
  }
}

// Player colors
export const PLAYER_COLORS = {
  [PLAYERS.PLAYER_1]: '#33CCFF',
  [PLAYERS.PLAYER_2]: '#FF9933'
}

// Transformation constants
export const ROTATIONS = {
  NONE: 0,
  NINETY: 90,
  ONE_EIGHTY: 180,
  TWO_SEVENTY: 270
}

// Cell states
export const CELL_STATES = {
  EMPTY: 0,
  PLAYER_1: 1,
  PLAYER_2: 2
}
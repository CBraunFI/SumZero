/**
 * Board data structure and operations for SumZero game
 * Implements the rectangular grid with coordinate system specified
 */

import { CELL_STATES } from '../../utils/constants.js'

/**
 * Create an empty board with specified dimensions
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Object} Board object
 */
export function createEmptyBoard(rows, cols) {
  return {
    rows,
    cols,
    grid: Array(rows).fill().map(() => Array(cols).fill(CELL_STATES.EMPTY))
  }
}

/**
 * Check if coordinates are within board bounds
 * @param {Object} board - Board object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if coordinates are valid
 */
export function isInBounds(board, x, y) {
  return x >= 0 && x < board.cols && y >= 0 && y < board.rows
}

/**
 * Get cell value at specified coordinates
 * @param {Object} board - Board object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Cell value (0=empty, 1=player1, 2=player2)
 */
export function getCell(board, x, y) {
  if (!isInBounds(board, x, y)) {
    return null
  }
  return board.grid[y][x]
}

/**
 * Set cell value at specified coordinates
 * @param {Object} board - Board object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} value - Cell value to set
 * @returns {Object} New board object (immutable)
 */
export function setCell(board, x, y, value) {
  if (!isInBounds(board, x, y)) {
    throw new Error(`Invalid coordinates: [${x}, ${y}]`)
  }

  const newGrid = board.grid.map((row, rowIndex) =>
    rowIndex === y
      ? row.map((cell, colIndex) => colIndex === x ? value : cell)
      : [...row]
  )

  return {
    ...board,
    grid: newGrid
  }
}

/**
 * Check if all specified cells are empty
 * @param {Object} board - Board object
 * @param {Array<Array<number>>} cells - Array of [x, y] coordinates
 * @returns {boolean} True if all cells are empty
 */
export function areCellsEmpty(board, cells) {
  return cells.every(([x, y]) => {
    if (!isInBounds(board, x, y)) {
      return false
    }
    return board.grid[y][x] === CELL_STATES.EMPTY
  })
}

/**
 * Place piece on board at specified cells
 * @param {Object} board - Board object
 * @param {Array<Array<number>>} cells - Array of [x, y] coordinates
 * @param {number} playerId - Player ID (1 or 2)
 * @returns {Object} New board object (immutable)
 */
export function placePiece(board, cells, playerId) {
  let newBoard = board

  for (const [x, y] of cells) {
    if (!isInBounds(board, x, y)) {
      throw new Error(`Cell [${x}, ${y}] is out of bounds`)
    }
    if (board.grid[y][x] !== CELL_STATES.EMPTY) {
      throw new Error(`Cell [${x}, ${y}] is already occupied`)
    }
    newBoard = setCell(newBoard, x, y, playerId)
  }

  return newBoard
}

/**
 * Get count of occupied cells by player
 * @param {Object} board - Board object
 * @param {number} playerId - Player ID (1 or 2)
 * @returns {number} Number of cells occupied by player
 */
export function getPlayerCellCount(board, playerId) {
  let count = 0
  for (let y = 0; y < board.rows; y++) {
    for (let x = 0; x < board.cols; x++) {
      if (board.grid[y][x] === playerId) {
        count++
      }
    }
  }
  return count
}

/**
 * Get total number of empty cells
 * @param {Object} board - Board object
 * @returns {number} Number of empty cells
 */
export function getEmptyCellCount(board) {
  let count = 0
  for (let y = 0; y < board.rows; y++) {
    for (let x = 0; x < board.cols; x++) {
      if (board.grid[y][x] === CELL_STATES.EMPTY) {
        count++
      }
    }
  }
  return count
}

/**
 * Create a deep copy of the board
 * @param {Object} board - Board object
 * @returns {Object} Deep copy of board
 */
export function cloneBoard(board) {
  return {
    rows: board.rows,
    cols: board.cols,
    grid: board.grid.map(row => [...row])
  }
}
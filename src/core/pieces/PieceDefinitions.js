/**
 * Canonical Piece Definitions for SumZero
 * All pieces are normalized with origin at [0,0] and minimum bounding box
 */

// Tetrominoes (4 cells, cost 4)
export const TETROMINOES = {
  I4: {
    id: 'I4',
    size: 4,
    cost: 4,
    relCells: [[0,0],[1,0],[2,0],[3,0]]
  },
  O4: {
    id: 'O4',
    size: 4,
    cost: 4,
    relCells: [[0,0],[1,0],[0,1],[1,1]]
  },
  T4: {
    id: 'T4',
    size: 4,
    cost: 4,
    relCells: [[0,0],[1,0],[2,0],[1,1]]
  },
  S4: {
    id: 'S4',
    size: 4,
    cost: 4,
    relCells: [[1,0],[2,0],[0,1],[1,1]]
  },
  Z4: {
    id: 'Z4',
    size: 4,
    cost: 4,
    relCells: [[0,0],[1,0],[1,1],[2,1]]
  },
  L4: {
    id: 'L4',
    size: 4,
    cost: 4,
    relCells: [[0,0],[0,1],[0,2],[1,2]]
  },
  J4: {
    id: 'J4',
    size: 4,
    cost: 4,
    relCells: [[1,0],[1,1],[1,2],[0,2]]
  }
}

// Pentominoes (5 cells, cost 5)
export const PENTOMINOES = {
  I5: {
    id: 'I5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[2,0],[3,0],[4,0]]
  },
  L5: {
    id: 'L5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[0,1],[0,2],[0,3],[1,3]]
  },
  P5: {
    id: 'P5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[0,1],[1,1],[0,2]]
  },
  N5: {
    id: 'N5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[1,1],[2,1],[2,2]]
  },
  T5: {
    id: 'T5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[2,0],[1,1],[1,2]]
  },
  U5: {
    id: 'U5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[0,1],[1,1],[2,1],[2,0]]
  },
  V5: {
    id: 'V5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[0,1],[0,2],[1,2],[2,2]]
  },
  W5: {
    id: 'W5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[1,1],[2,1],[2,2]]
  },
  X5: {
    id: 'X5',
    size: 5,
    cost: 5,
    relCells: [[1,0],[0,1],[1,1],[2,1],[1,2]]
  },
  Y5: {
    id: 'Y5',
    size: 5,
    cost: 5,
    relCells: [[0,1],[1,0],[1,1],[1,2],[1,3]]
  },
  Z5: {
    id: 'Z5',
    size: 5,
    cost: 5,
    relCells: [[0,0],[1,0],[1,1],[2,1],[2,2]]
  },
  F5: {
    id: 'F5',
    size: 5,
    cost: 5,
    relCells: [[1,0],[0,1],[1,1],[1,2],[2,2]]
  }
}

/**
 * Get all pieces (tetrominoes and pentominoes combined)
 * @returns {Object} Combined piece definitions
 */
export function getAllPieces() {
  return { ...TETROMINOES, ...PENTOMINOES }
}

/**
 * Get piece definition by ID
 * @param {string} pieceId - The piece ID
 * @returns {Object|null} Piece definition or null if not found
 */
export function getPiece(pieceId) {
  const allPieces = getAllPieces()
  return allPieces[pieceId] || null
}

/**
 * Get piece cost by ID
 * @param {string} pieceId - The piece ID
 * @returns {number} Piece cost
 */
export function getPieceCost(pieceId) {
  const piece = getPiece(pieceId)
  return piece ? piece.cost : 0
}
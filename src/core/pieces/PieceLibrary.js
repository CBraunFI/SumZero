/**
 * Piece Library with precomputed transformations for performance optimization
 * Implements caching of unique piece orientations as specified
 */

import { TETROMINOES, PENTOMINOES, getAllPieces } from './PieceDefinitions.js'
import { applyTransform } from '../geometry/Transform.js'

/**
 * PieceLibrary class that manages piece definitions and precomputed transformations
 */
export class PieceLibrary {
  constructor() {
    this.pieces = new Map()
    this.transformCache = new Map()
    this.initializePieces()
  }

  /**
   * Initialize all pieces and precompute unique transformations
   */
  initializePieces() {
    const allPieces = getAllPieces()

    for (const [id, piece] of Object.entries(allPieces)) {
      this.pieces.set(id, piece)

      // Precompute unique transforms for this piece
      this.transformCache.set(id, this.computeUniqueTransforms(piece.relCells))
    }
  }

  /**
   * Compute all unique transformations for a piece
   * @param {Array<Array<number>>} relCells - Original relative coordinates
   * @returns {Array<Object>} Array of unique transformations
   */
  computeUniqueTransforms(relCells) {
    const transforms = []
    const seen = new Set()

    for (const rot of [0, 90, 180, 270]) {
      for (const flipX of [false, true]) {
        const transform = { rot, flipX }
        const transformed = applyTransform(relCells, transform)

        // Create a canonical string representation for uniqueness check
        const key = JSON.stringify(transformed.sort((a, b) => a[0] - b[0] || a[1] - b[1]))

        if (!seen.has(key)) {
          seen.add(key)
          transforms.push({
            transform,
            cells: transformed
          })
        }
      }
    }

    return transforms
  }

  /**
   * Get piece definition by ID
   * @param {string} pieceId - Piece identifier
   * @returns {Object|null} Piece definition or null
   */
  get(pieceId) {
    return this.pieces.get(pieceId) || null
  }

  /**
   * Get all piece definitions
   * @returns {Array<Object>} Array of all piece definitions
   */
  list() {
    return Array.from(this.pieces.values())
  }

  /**
   * Get precomputed unique transformations for a piece
   * @param {string} pieceId - Piece identifier
   * @returns {Array<Object>} Array of unique transformations
   */
  getUniqueTransforms(pieceId) {
    return this.transformCache.get(pieceId) || []
  }

  /**
   * Check if piece library contains a specific piece
   * @param {string} pieceId - Piece identifier
   * @returns {boolean} True if piece exists
   */
  has(pieceId) {
    return this.pieces.has(pieceId)
  }

  /**
   * Get pieces by type (tetrominoes or pentominoes)
   * @param {string} type - 'tetrominoes' or 'pentominoes'
   * @returns {Array<Object>} Filtered piece definitions
   */
  getByType(type) {
    if (type === 'tetrominoes') {
      return Object.values(TETROMINOES)
    } else if (type === 'pentominoes') {
      return Object.values(PENTOMINOES)
    }
    return []
  }
}

// Create and export singleton instance
export const pieceLibrary = new PieceLibrary()
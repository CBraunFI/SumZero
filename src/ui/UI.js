/**
 * Basic UI Implementation for SumZero
 * Provides a simple interface to test game functionality
 */

import { GameService } from '../core/game/GameService.js'
import { getAvailablePieces } from '../core/draft/DraftService.js'
import { enumerateLegalMoves, createMove, isLegalPlacement } from '../core/placement/PlacementService.js'
import { pieceLibrary } from '../core/pieces/PieceLibrary.js'
import { applyTransform, calculateAbsCells } from '../core/geometry/Transform.js'
import { SimpleAI } from '../ai/SimpleAI.js'
import { GAME_PHASES, PLAYERS } from '../utils/constants.js'

/**
 * Simple UI class for game interaction
 */
export class UI {
  constructor(container, onReturnToMenu = null) {
    this.container = container
    this.onReturnToMenu = onReturnToMenu
    this.gameState = null
    this.selectedPiece = null
    this.previewTransform = { rot: 0, flipX: false }
    this.hoveredCells = []
    this.aiThinking = false
    this.overlayShown = false
    this.overlayTimeout = null
  }

  /**
   * Render the current game state
   * @param {Object} gameState - Game state to render
   */
  render(gameState) {
    this.gameState = gameState

    // Check for game end conditions before rendering
    this.checkAndHandleGameEnd()

    this.container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'game-wrapper'
    wrapper.innerHTML = `
      <style>
        /* Base styles - Mobile first approach */
        * {
          box-sizing: border-box;
        }

        html {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        .game-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 100vw;
          margin: 0 auto;
          padding: 8px;
          min-height: 100vh;
          background: #ecf0f1;
        }

        .game-header {
          text-align: center;
          margin-bottom: 15px;
        }

        .game-status {
          background: #f0f0f0;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .game-status h1 {
          font-size: 1.8em !important;
          margin: 0 0 10px 0 !important;
        }

        .game-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .board-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .board-container h3 {
          margin: 0 0 10px 0;
          font-size: 1.1em;
        }

        .board {
          display: grid;
          gap: 1px;
          border: 2px solid #2c3e50;
          width: min(95vw, 350px);
          height: min(95vw, 350px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          background: #34495e;
          padding: 0;
          margin: 0 auto;
          border-radius: 4px;
          overflow: hidden;
        }

        .cell {
          border: 0.5px solid #2c3e50;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /* Touch-friendly hover effects */
        @media (hover: hover) {
          .cell:hover {
            transform: scale(1.1);
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border-radius: 2px;
          }
        }

        /* Touch feedback for mobile */
        .cell:active {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }
        .cell.light { background: #ffffff; }
        .cell.dark { background: #ffffff; }
        .cell.unusable {
          background: #95a5a6;
          cursor: default;
          opacity: 0.3;
        }
        .cell.unusable:hover {
          transform: none;
          box-shadow: none;
        }
        .cell.player1 { background: #3498db !important; border-color: #2980b9; }
        .cell.player2 { background: #e74c3c !important; border-color: #c0392b; }
        .cell.preview-valid { background: #90ee90 !important; border-color: #32cd32; }
        .cell.preview-invalid { background: #ffcccb !important; border-color: #ff6b6b; }
        .cell.occupied {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }

        .side-panel {
          width: 100%;
          max-width: 100%;
          background: #f8f8f8;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          order: 2;
        }

        .piece-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
          gap: 12px;
          margin: 20px auto;
          padding: 20px;
          width: 100%;
          max-width: 800px;
          justify-content: center;
          align-items: start;
        }

        /* Arsenal container below board */
        .arsenal-container {
          width: 100%;
          margin-top: 15px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .arsenal-container h4 {
          margin: 0 0 10px 0;
          text-align: center;
          color: #2c3e50;
          font-size: 1.1em;
        }

        .arsenal-pieces {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 100%;
        }

        .arsenal-miniature {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: #ffffff;
          border: 2px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-width: 60px;
        }

        @media (hover: hover) {
          .arsenal-miniature:hover {
            border-color: #999;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
        }

        .arsenal-miniature:active {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }

        .arsenal-miniature.selected {
          border-color: #007bff;
          background: #e7f3ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }

        .miniature-piece {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 6px;
        }

        .miniature-grid {
          display: grid;
          gap: 1px;
          justify-content: center;
        }

        .miniature-cell {
          width: 8px;
          height: 8px;
          border-radius: 1px;
        }

        .miniature-cell.filled {
          background: #3498db;
          border: 1px solid #2980b9;
        }

        .miniature-cell.empty {
          background: transparent;
        }

        .miniature-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .piece-name {
          font-size: 0.75em;
          font-weight: 600;
          color: #2c3e50;
          line-height: 1;
        }

        .piece-count {
          font-size: 0.7em;
          color: #7f8c8d;
          margin-top: 2px;
        }
        .piece-tile {
          background: #fafafa;
          border: 2px solid #ccc;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          text-align: center;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          font-size: 0.9em;
        }

        @media (hover: hover) {
          .piece-tile:hover {
            border-color: #999;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
        }

        .piece-tile:active {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }

        .piece-tile.selected {
          border-color: #007bff;
          background: #e7f3ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }

        .piece-tile.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .piece-preview {
          display: grid;
          gap: 0;
          margin: 5px 0;
          justify-self: center;
          border: 1px solid #333;
        }
        .piece-cell {
          width: 12px;
          height: 12px;
          background: #444;
          border: 1px solid #222;
          box-sizing: border-box;
        }
        .controls {
          margin: 12px 0;
        }

        .controls-section {
          margin-bottom: 12px;
          padding: 12px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #ddd;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin: 4px 2px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @media (hover: hover) {
          .btn:hover {
            background: #0056b3;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        }

        .btn:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          pointer-events: none;
          opacity: 0.6;
        }

        .btn-new-game {
          background: #e74c3c;
          width: 100%;
          margin-bottom: 8px;
        }

        @media (hover: hover) {
          .btn-new-game:hover {
            background: #c0392b;
          }
        }

        .btn-menu {
          background: #9b59b6;
          width: 100%;
          margin-bottom: 8px;
        }

        @media (hover: hover) {
          .btn-menu:hover {
            background: #8e44ad;
          }
        }
        .player-info {
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          background: #ffffff;
        }

        .player-info.current {
          background: #e7f3ff;
          border: 2px solid #007bff;
        }

        .arsenal-list {
          margin: 10px 0;
        }

        .arsenal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin: 4px 0;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 0.9em;
        }

        /* Scoring Display Styles */
        .score-display {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 10px 0;
          padding: 10px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .score-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 16px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .score-item.current-player {
          background: #e7f3ff;
          border: 2px solid #007bff;
          transform: scale(1.05);
        }

        .score-label {
          font-size: 0.9em;
          color: #666;
          margin-bottom: 4px;
        }

        .score-value {
          font-size: 1.4em;
          font-weight: bold;
          color: #2c3e50;
        }

        .pattern-alert {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          text-align: center;
          margin: 10px 0;
          animation: patternPulse 2s ease-in-out;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .pattern-text {
          font-weight: 600;
          font-size: 0.9em;
        }

        @keyframes patternPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4); }
        }

        /* Pattern Highlighting on Board */
        .cell.pattern-highlight {
          background: #ffd700 !important;
          border: 2px solid #ff8c00 !important;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.6) !important;
          animation: patternGlow 1.5s ease-in-out infinite alternate;
        }

        @keyframes patternGlow {
          from { box-shadow: 0 0 10px rgba(255, 215, 0, 0.6); }
          to { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        }

        /* Scoring Rules Panel */
        .scoring-rules {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 12px;
          margin: 15px 0;
          font-size: 0.85em;
        }

        .scoring-rules h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 1.1em;
          text-align: center;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
        }

        .rules-category {
          margin-bottom: 12px;
        }

        .rules-category h5 {
          margin: 0 0 6px 0;
          color: #3498db;
          font-size: 0.9em;
          font-weight: bold;
        }

        .rules-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .rules-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          font-size: 0.8em;
        }

        .pattern-name {
          color: #34495e;
        }

        .pattern-points {
          font-weight: bold;
          color: #27ae60;
        }

        .rules-note {
          background: #e8f4fd;
          border-left: 3px solid #3498db;
          padding: 6px 8px;
          margin-top: 8px;
          font-size: 0.75em;
          color: #2c3e50;
        }

        /* Visual Pattern Display */
        .pattern-visual {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 4px 0;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .pattern-shape {
          display: grid;
          gap: 1px;
          background: #dee2e6;
          border-radius: 2px;
          padding: 2px;
          flex-shrink: 0;
        }

        .pattern-cell {
          width: 8px;
          height: 8px;
          border-radius: 1px;
        }

        .pattern-cell.filled {
          background: #007bff;
        }

        .pattern-cell.empty {
          background: #e9ecef;
        }

        .pattern-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8em;
        }

        .pattern-name {
          color: #495057;
          font-weight: 500;
        }

        .pattern-points {
          color: #28a745;
          font-weight: bold;
        }

        /* Draft Phase Specific Styles */
        .draft-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 100%;
          margin: 0 auto;
        }

        .draft-title {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.8em;
        }

        .draft-controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .draft-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin: 15px auto;
          max-width: 600px;
          width: 90%;
        }

        .players-info {
          display: flex;
          justify-content: space-around;
          gap: 20px;
          flex-wrap: wrap;
        }

        .player-info {
          flex: 1;
          min-width: 200px;
          text-align: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 2px solid #dee2e6;
        }

        .player-info.current-player {
          border-color: #007bff;
          background: #e7f3ff;
        }

        /* Different pattern shape grids */
        .pattern-line-4 { grid-template-columns: repeat(4, 1fr); }
        .pattern-line-5 { grid-template-columns: repeat(5, 1fr); }
        .pattern-line-6 { grid-template-columns: repeat(6, 1fr); }
        .pattern-rect-2x3 { grid-template-columns: repeat(2, 1fr); }
        .pattern-rect-3x2 { grid-template-columns: repeat(3, 1fr); }
        .pattern-square-3x3 { grid-template-columns: repeat(3, 1fr); }
        .pattern-square-4x4 {
          grid-template-columns: repeat(4, 1fr);
        }
        .pattern-square-5x5 {
          grid-template-columns: repeat(5, 1fr);
        }
        .pattern-square-5x5 .pattern-cell {
          width: 6px;
          height: 6px;
        }
        .pattern-corner { grid-template-columns: repeat(3, 1fr); }
        .pattern-edge { grid-template-columns: repeat(5, 1fr); }
        .pattern-center { grid-template-columns: repeat(4, 1fr); }

        /* Enhanced Game Ending Announcement */
        .game-ending-announcement {
          background: linear-gradient(135deg, #ff6b6b, #ff8e53);
          border: 3px solid #e74c3c;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
          color: white;
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
          animation: victoryPulse 2s ease-in-out infinite alternate;
        }

        .victory-title {
          font-size: 2.5em;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
        }

        .victory-subtitle {
          font-size: 1.2em;
          margin: 0 0 15px 0;
          opacity: 0.9;
        }

        .final-score-display {
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }

        .final-score-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0;
          font-size: 1.1em;
        }

        .winner-score {
          font-weight: bold;
          color: #fff200;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .game-ending-reason {
          background: rgba(255,255,255,0.15);
          border-radius: 6px;
          padding: 10px;
          margin: 10px 0;
          font-style: italic;
          font-size: 0.95em;
        }

        @keyframes victoryPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
          }
          100% {
            transform: scale(1.02);
            box-shadow: 0 12px 35px rgba(231, 76, 60, 0.5);
          }
        }

        /* Full-Screen Game Ending Overlay */
        .game-ending-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          animation: overlayFadeIn 1s ease-out;
        }

        .overlay-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
        }

        .overlay-content {
          position: relative;
          text-align: center;
          padding: 40px;
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: overlaySlideIn 1s ease-out 0.3s both;
        }

        .you-win-overlay {
          background: linear-gradient(135deg, #28a745, #20c997, #17a2b8);
          color: white;
        }

        .you-lose-overlay {
          background: linear-gradient(135deg, #dc3545, #e74c3c, #c0392b);
          color: white;
        }

        .overlay-title {
          font-size: 4rem;
          font-weight: bold;
          margin: 0 0 20px 0;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
          animation: titleBounce 2s ease-in-out infinite;
        }

        .overlay-subtitle {
          font-size: 1.5rem;
          margin: 0 0 30px 0;
          opacity: 0.95;
          font-weight: 500;
        }

        .overlay-scores {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          backdrop-filter: blur(5px);
        }

        .overlay-score-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px 0;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .overlay-winner-score {
          font-weight: bold;
          color: #fff200;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          font-size: 1.3rem;
        }

        .overlay-reason {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          font-style: italic;
          font-size: 1rem;
        }

        .overlay-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }

        .overlay-button {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .overlay-button-primary {
          background: rgba(255,255,255,0.9);
          color: #2c3e50;
        }

        .overlay-button-primary:hover {
          background: rgba(255,255,255,1);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .overlay-button-secondary {
          background: transparent;
          color: white;
          border: 2px solid rgba(255,255,255,0.5);
        }

        .overlay-button-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.8);
          transform: translateY(-2px);
        }

        @keyframes overlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes overlaySlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes titleBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        /* Mobile adjustments for overlay */
        @media (max-width: 768px) {
          .overlay-content {
            padding: 30px 20px;
            margin: 20px;
          }

          .overlay-title {
            font-size: 3rem;
          }

          .overlay-subtitle {
            font-size: 1.2rem;
          }

          .overlay-buttons {
            flex-direction: column;
            gap: 10px;
          }
        }

        /* Enhanced Mobile-First Responsive Design */
        @media (max-width: 480px) {
          .game-wrapper {
            padding: 5px;
          }

          .game-status h1 {
            font-size: 2em !important;
            margin: 0 0 10px 0;
          }

          .game-content {
            gap: 10px;
          }

          .piece-gallery {
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 10px;
            padding: 15px;
          }

          .draft-title {
            font-size: 1.5em;
            margin-bottom: 15px;
          }

          .players-info {
            flex-direction: column;
            gap: 10px;
          }

          .player-info {
            min-width: auto;
          }

          .scoring-rules {
            font-size: 0.8em;
            padding: 10px;
            margin: 10px 0;
          }

          .scoring-rules h4 {
            font-size: 1em;
          }

          .board {
            width: min(350px, 95vw);
            height: min(350px, 95vw);
          }

          .side-panel {
            width: 100%;
            order: 1;
          }

          .arsenal-pieces {
            gap: 8px;
          }

          .score-display {
            font-size: 0.9em;
          }

          .btn {
            padding: 12px 16px !important;
            font-size: 14px !important;
            min-height: 44px;
            touch-action: manipulation;
          }

          .piece-tile {
            min-height: 80px !important;
            padding: 12px !important;
            font-size: 0.9em;
          }

          .draft-controls {
            margin: 15px 0;
          }

          .pattern-visual {
            padding: 4px;
            margin: 2px 0;
          }

          .pattern-shape {
            padding: 1px;
          }

          .pattern-cell {
            width: 6px;
            height: 6px;
          }
        }

        /* Game Over Statistics */
        .game-over-stats {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }

        .stat-item {
          text-align: center;
          padding: 10px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        /* Score Cards */
        .score-cards-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }

        .score-card {
          background: #ffffff;
          border: 2px solid #dee2e6;
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .score-card-title {
          text-align: center;
          margin: 0 0 15px 0;
          padding: 10px;
          border-radius: 6px;
          font-weight: bold;
        }

        .player1-title {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }

        .player2-title {
          background: linear-gradient(135deg, #dc3545, #b02a37);
          color: white;
        }

        .score-breakdown {
          margin-bottom: 15px;
        }

        .score-breakdown h5 {
          margin: 0 0 8px 0;
          color: #495057;
          font-size: 0.9em;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid #f8f9fa;
          font-size: 0.85em;
        }

        .breakdown-pattern {
          color: #6c757d;
          text-transform: capitalize;
        }

        .breakdown-points {
          font-weight: bold;
          color: #28a745;
        }

        .pattern-history {
          max-height: 200px;
          overflow-y: auto;
        }

        .pattern-history h5 {
          margin: 0 0 8px 0;
          color: #495057;
          font-size: 0.9em;
        }

        .history-item {
          background: #f8f9fa;
          border-left: 3px solid #007bff;
          padding: 6px 8px;
          margin: 4px 0;
          border-radius: 4px;
          font-size: 0.8em;
        }

        .history-turn {
          font-weight: bold;
          color: #495057;
        }

        .history-pattern {
          color: #6c757d;
          margin: 0 5px;
        }

        .history-points {
          color: #28a745;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .score-cards-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.8em;
          color: #666;
          text-transform: uppercase;
        }

        /* Tablet styles */
        @media (min-width: 768px) and (max-width: 1024px) {
          .game-wrapper {
            padding: 16px;
            max-width: 1000px;
          }

          .game-content {
            flex-direction: row;
            gap: 20px;
            align-items: flex-start;
          }

          .board-section {
            flex: 1;
            max-width: 600px;
          }

          .board {
            width: min(500px, 60vw);
            height: min(500px, 60vw);
          }

          .side-panel {
            width: 280px;
            order: 0;
          }

          .arsenal-pieces {
            gap: 12px;
          }

          .arsenal-miniature {
            min-width: 70px;
          }

          .miniature-cell {
            width: 10px;
            height: 10px;
          }

          .miniature-grid {
            gap: 1px;
          }

          .piece-gallery {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 15px;
            padding: 25px;
          }
        }

        /* Desktop styles */
        @media (min-width: 1025px) {
          .game-wrapper {
            padding: 20px;
            max-width: 1200px;
          }

          .game-status h1 {
            font-size: 2.5em !important;
          }

          .game-content {
            flex-direction: row;
            gap: 24px;
            align-items: flex-start;
          }

          .board-section {
            flex: 1;
            max-width: 700px;
          }

          .board {
            width: min(600px, 50vw);
            height: min(600px, 50vw);
            border: 3px solid #2c3e50;
          }

          .side-panel {
            width: 320px;
            order: 0;
          }

          .arsenal-container {
            margin-top: 20px;
            padding: 16px;
          }

          .arsenal-pieces {
            gap: 15px;
            justify-content: flex-start;
          }

          .arsenal-miniature {
            min-width: 80px;
            padding: 10px;
          }

          .miniature-cell {
            width: 12px;
            height: 12px;
          }

          .miniature-grid {
            gap: 1px;
          }

          .piece-name {
            font-size: 0.8em;
          }

          .piece-count {
            font-size: 0.75em;
          }

          .piece-gallery {
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: 20px;
            padding: 30px;
            max-width: 1000px;
          }

          .piece-tile {
            min-height: 80px;
            font-size: 1em;
          }

          .btn {
            padding: 10px 20px;
            font-size: 16px;
          }
        }

        /* Large desktop styles */
        @media (min-width: 1440px) {
          .game-wrapper {
            max-width: 1400px;
          }

          .board-section {
            max-width: 800px;
          }

          .board {
            width: min(700px, 45vw);
            height: min(700px, 45vw);
          }

          .side-panel {
            width: 350px;
          }

          .arsenal-pieces {
            gap: 18px;
          }

          .arsenal-miniature {
            min-width: 90px;
            padding: 12px;
          }

          .miniature-cell {
            width: 14px;
            height: 14px;
          }
        }
      </style>
    `

    this.renderGameStatus(wrapper)
    this.renderGameContent(wrapper)
    this.container.appendChild(wrapper)

    // Check if AI should make a move
    this.checkAITurn()
  }

  renderGameStatus(container) {
    const status = GameService.getStatus(this.gameState)
    const statusDiv = document.createElement('div')
    statusDiv.className = 'game-status'

    let statusText = ''
    if (status.phase === GAME_PHASES.DRAFT) {
      statusText = `Draft Phase - Player ${status.currentPlayer}'s turn`
    } else if (status.phase === GAME_PHASES.PLACEMENT) {
      if (status.currentPlayer === 1) {
        statusText = `Player 1 draws...`
      } else {
        statusText = `Player 2 draws...`
      }
    } else if (status.phase === GAME_PHASES.GAME_OVER) {
      // Enhanced game ending announcement
      statusText = this.formatGameEndingAnnouncement(status)
    }

    // Build score display
    let scoreDisplay = ''
    if (status.scores) {
      scoreDisplay = `
        <div class="score-display">
          <div class="score-item ${status.currentPlayer === 1 ? 'current-player' : ''}">
            <span class="score-label">Player 1:</span>
            <span class="score-value">${status.scores.player1}</span>
          </div>
          <div class="score-item ${status.currentPlayer === 2 ? 'current-player' : ''}">
            <span class="score-label">Player 2:</span>
            <span class="score-value">${status.scores.player2}</span>
          </div>
        </div>
      `
    }

    // Show recent pattern if available
    let patternAlert = ''
    if (status.lastPattern && status.lastPattern.turn === status.turn - 1) {
      patternAlert = `
        <div class="pattern-alert">
          <span class="pattern-text">
            Player ${status.lastPattern.player} scored ${status.lastPattern.points} points
            with ${status.lastPattern.pattern}!
          </span>
        </div>
      `
    }

    // Show game statistics if game is over
    let gameStats = ''
    if (status.isGameOver && status.gameStatistics) {
      gameStats = this.renderGameStatistics(status.gameStatistics, status.finalScores)
    }

    statusDiv.innerHTML = `
      <h1 style="text-align: center; margin: 0 0 15px 0; color: #2c3e50; font-size: 2.5em; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">SumZero</h1>
      <p><strong>${statusText}</strong></p>
      <p>Turn: ${status.turn}</p>
      ${scoreDisplay}
      ${patternAlert}
      ${gameStats}
    `
    container.appendChild(statusDiv)
  }

  renderGameContent(container) {
    const contentDiv = document.createElement('div')
    contentDiv.className = 'game-content'

    if (this.gameState.phase === GAME_PHASES.DRAFT) {
      this.renderDraftScreen(contentDiv)
    } else {
      this.renderGameScreen(contentDiv)
    }

    container.appendChild(contentDiv)
  }

  renderDraftScreen(container) {
    const draftDiv = document.createElement('div')
    draftDiv.className = 'draft-screen'
    draftDiv.innerHTML = `
      <h3 class="draft-title">Choose Your Pieces</h3>
      <div id="available-pieces" class="piece-gallery"></div>
      <div class="draft-controls">
        <button id="pass-btn" class="btn">Pass Turn</button>
      </div>
      <div id="players-info" class="draft-info"></div>
    `

    this.renderAvailablePieces(draftDiv.querySelector('#available-pieces'))
    this.renderPlayersInfo(draftDiv.querySelector('#players-info'))

    draftDiv.querySelector('#pass-btn').onclick = () => {
      this.handleDraftPass()
    }

    container.appendChild(draftDiv)
  }

  renderGameScreen(container) {
    const boardSection = document.createElement('div')
    boardSection.className = 'board-section'
    boardSection.innerHTML = `
      <h3>Game Board</h3>
      <div id="board"></div>
      <div id="arsenal" class="arsenal-container">
        <h4>Your Arsenal</h4>
        <div id="arsenal-pieces" class="arsenal-pieces"></div>
      </div>
    `

    const sidePanel = document.createElement('div')
    sidePanel.className = 'side-panel'
    sidePanel.innerHTML = `
      <div id="current-player-info"></div>
      <div id="scoring-rules" class="scoring-rules"></div>
      <div id="controls" class="controls"></div>
    `

    this.renderBoard(boardSection.querySelector('#board'))
    this.renderArsenal(boardSection.querySelector('#arsenal-pieces'))
    this.renderCurrentPlayerInfo(sidePanel.querySelector('#current-player-info'))
    this.renderScoringRules(sidePanel.querySelector('#scoring-rules'))
    this.renderControls(sidePanel.querySelector('#controls'))

    container.appendChild(boardSection)
    container.appendChild(sidePanel)
  }

  renderBoard(container) {
    const board = this.gameState.board
    container.className = 'board'
    container.style.gridTemplateColumns = `repeat(${board.cols}, 1fr)`
    container.style.gridTemplateRows = `repeat(${board.rows}, 1fr)`
    container.innerHTML = ''


    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        cell.dataset.x = x
        cell.dataset.y = y

        const cellValue = board.grid[y][x]

        // Check if cell is unusable (marked as -1)
        if (cellValue === -1) {
          cell.classList.add('unusable')
        } else {
          // Chess-like alternating pattern
          const isLight = (x + y) % 2 === 0
          cell.classList.add(isLight ? 'light' : 'dark')

          if (cellValue === 1) {
            cell.classList.add('player1', 'occupied')
          } else if (cellValue === 2) {
            cell.classList.add('player2', 'occupied')
          }

          // Add preview highlighting for hovered cells
          if (this.hoveredCells.some(([hx, hy]) => hx === x && hy === y)) {
            if (this.isPreviewValid) {
              cell.classList.add('preview-valid')
            } else {
              cell.classList.add('preview-invalid')
            }
          }
        }

        // Add pattern highlighting if this cell is part of a highlighted pattern
        const status = GameService.getStatus(this.gameState)
        if (status.highlightedPattern && status.highlightedPattern.pattern) {
          const patternCells = status.highlightedPattern.pattern.cells || []
          const isPatternCell = patternCells.some(([px, py]) => px === x && py === y)
          if (isPatternCell) {
            cell.classList.add('pattern-highlight')
          }
        }

        cell.onclick = () => this.handleCellClick(x, y)
        cell.onmouseenter = () => this.handleCellHover(x, y)
        container.appendChild(cell)
      }
    }
  }

  renderAvailablePieces(container) {
    const currentPlayer = this.gameState.currentPlayer
    const availablePieces = getAvailablePieces(this.gameState, currentPlayer)

    container.innerHTML = ''
    for (const pieceId of availablePieces) {
      const piece = pieceLibrary.get(pieceId)
      const tile = document.createElement('div')
      tile.className = 'piece-tile'
      tile.innerHTML = `
        <div>${pieceId}</div>
        <div style="font-size: 12px;">Cost: ${piece.cost}</div>
        ${this.renderPiecePreview(piece.relCells)}
      `
      tile.onclick = () => this.handleDraftBuy(pieceId)
      container.appendChild(tile)
    }
  }

  renderPiecePreview(relCells) {
    const maxX = Math.max(...relCells.map(([x, y]) => x))
    const maxY = Math.max(...relCells.map(([x, y]) => y))

    let html = `<div class="piece-preview" style="grid-template-columns: repeat(${maxX + 1}, 12px); grid-template-rows: repeat(${maxY + 1}, 12px);">`

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        const hasCell = relCells.some(([cx, cy]) => cx === x && cy === y)
        html += `<div class="piece-cell" style="background: ${hasCell ? '#2c3e50' : 'transparent'}; border: ${hasCell ? '1px solid #1a252f' : 'none'};"></div>`
      }
    }

    html += '</div>'
    return html
  }

  renderMiniaturePiece(relCells) {
    const maxX = Math.max(...relCells.map(([x, y]) => x))
    const maxY = Math.max(...relCells.map(([x, y]) => y))

    let html = `<div class="miniature-grid" style="grid-template-columns: repeat(${maxX + 1}, 8px); grid-template-rows: repeat(${maxY + 1}, 8px);">`

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        const hasCell = relCells.some(([cx, cy]) => cx === x && cy === y)
        html += `<div class="miniature-cell ${hasCell ? 'filled' : 'empty'}"></div>`
      }
    }

    html += '</div>'
    return html
  }

  renderPlayersInfo(container) {
    container.innerHTML = `
      <div class="players-info">
        ${[1, 2].map(playerId => {
          const player = this.gameState.players[playerId]
          const isCurrentPlayer = playerId === this.gameState.currentPlayer
          const playerLabel = playerId === 1 ? 'You' : 'Opponent'

          const arsenalItems = Object.entries(player.arsenal)
            .map(([pieceId, count]) => `<span class="arsenal-item">${pieceId} ×${count}</span>`)
            .join(', ')

          return `
            <div class="player-info ${isCurrentPlayer ? 'current-player' : ''}">
              <h4>${playerLabel} ${isCurrentPlayer ? '(Current Turn)' : ''}</h4>
              <p><strong>Budget:</strong> ${player.budget} points</p>
              <div class="arsenal-summary">
                <strong>Pieces:</strong><br>
                ${arsenalItems || 'No pieces yet'}
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  renderArsenal(container) {
    const currentPlayer = this.gameState.currentPlayer
    const arsenal = this.gameState.players[currentPlayer].arsenal

    container.innerHTML = ''

    for (const [pieceId, count] of Object.entries(arsenal)) {
      if (count > 0) {
        const miniature = document.createElement('div')
        miniature.className = `arsenal-miniature ${this.selectedPiece === pieceId ? 'selected' : ''}`
        const piece = pieceLibrary.get(pieceId)

        miniature.innerHTML = `
          <div class="miniature-piece">
            ${this.renderMiniaturePiece(piece.relCells)}
          </div>
          <div class="miniature-label">
            <span class="piece-name">${pieceId}</span>
            <span class="piece-count">×${count}</span>
          </div>
        `
        miniature.onclick = () => this.selectPiece(pieceId)
        container.appendChild(miniature)
      }
    }
  }

  renderCurrentPlayerInfo(container) {
    const player = this.gameState.players[this.gameState.currentPlayer]
    container.innerHTML = `
      <div class="player-info current">
        <h4>Player ${player.id}'s Turn</h4>
        <p>Color: <span style="color: ${player.color};">●</span></p>
      </div>
    `
  }

  renderControls(container) {
    let controlsHTML = `<div class="controls-section">`

    if (this.onReturnToMenu) {
      controlsHTML += `<button class="btn btn-menu" onclick="window.ui.returnToMenu()">Main Menu</button>`
    }

    controlsHTML += `
      <button class="btn btn-new-game" onclick="window.ui.newGame()">New Game</button>
    </div>`

    if (this.selectedPiece) {
      controlsHTML += `
        <div class="controls-section">
          <div>Selected: ${this.selectedPiece}</div>
          <button class="btn" onclick="window.ui.rotatePiece()">Rotate (R)</button>
          <button class="btn" onclick="window.ui.flipPiece()">Flip (F)</button>
          <button class="btn" onclick="window.ui.clearSelection()">Cancel (Esc)</button>
        </div>
      `
    } else {
      controlsHTML += '<div class="controls-section">Select a piece from your arsenal</div>'
    }

    container.innerHTML = controlsHTML
  }

  // Event handlers
  handleDraftBuy(pieceId) {
    try {
      this.gameState = GameService.draftBuy(this.gameState, this.gameState.currentPlayer, pieceId)
      this.render(this.gameState)
    } catch (error) {
      alert(`Cannot buy piece: ${error.message}`)
    }
  }

  handleDraftPass() {
    try {
      this.gameState = GameService.draftPass(this.gameState, this.gameState.currentPlayer)
      this.render(this.gameState)
    } catch (error) {
      alert(`Cannot pass: ${error.message}`)
    }
  }

  selectPiece(pieceId) {
    // Prevent piece selection during Player 2's turn
    if (this.gameState.currentPlayer !== PLAYERS.PLAYER_1) {
      return
    }

    this.selectedPiece = pieceId
    this.previewTransform = { rot: 0, flipX: false }
    this.hoveredCells = []
    this.render(this.gameState)
  }

  clearSelection() {
    this.selectedPiece = null
    this.hoveredCells = []
    this.render(this.gameState)
  }

  rotatePiece() {
    if (this.selectedPiece) {
      this.previewTransform.rot = (this.previewTransform.rot + 90) % 360
      this.render(this.gameState)
    }
  }

  flipPiece() {
    if (this.selectedPiece) {
      this.previewTransform.flipX = !this.previewTransform.flipX
      this.render(this.gameState)
    }
  }

  handleCellClick(x, y) {
    if (this.selectedPiece && this.gameState.phase === GAME_PHASES.PLACEMENT) {
      // Only allow placement if it's the current player's turn and it's Player 1
      if (this.gameState.currentPlayer !== PLAYERS.PLAYER_1) {
        return // Prevent Player 1 from drawing during Player 2's turn
      }

      try {
        const move = createMove(
          this.gameState.currentPlayer,
          this.selectedPiece,
          this.previewTransform,
          [x, y]
        )

        this.gameState = GameService.placePiece(this.gameState, move)
        this.selectedPiece = null
        this.hoveredCells = []
        this.render(this.gameState)
      } catch (error) {
        alert(`Invalid move: ${error.message}`)
      }
    }
  }

  /**
   * Handle cell hover for piece preview
   */
  handleCellHover(x, y) {
    if (!this.selectedPiece || this.gameState.phase !== GAME_PHASES.PLACEMENT) {
      if (this.hoveredCells.length > 0) {
        this.hoveredCells = []
        this.render(this.gameState)
      }
      return
    }

    if (this.gameState.currentPlayer !== PLAYERS.PLAYER_1) {
      // Clear any hover effects during Player 2's turn
      if (this.hoveredCells.length > 0) {
        this.hoveredCells = []
        this.render(this.gameState)
      }
      return // Prevent hover preview during Player 2's turn
    }

    try {
      // Get the piece and calculate its absolute cells
      const piece = pieceLibrary.get(this.selectedPiece)
      const transformedCells = applyTransform(piece.relCells, this.previewTransform)
      const absCells = calculateAbsCells(transformedCells, [x, y])

      // Check if the hover position has actually changed
      const samePosition = this.hoveredCells.length === absCells.length &&
        this.hoveredCells.every(([hx, hy], i) => {
          const [ax, ay] = absCells[i] || []
          return hx === ax && hy === ay
        })

      if (!samePosition) {
        // Check if move is valid
        this.isPreviewValid = isLegalPlacement(this.gameState.board, absCells, [x, y])
        this.hoveredCells = absCells
        this.render(this.gameState)
      }
    } catch (error) {
      // Invalid position, clear preview
      if (this.hoveredCells.length > 0) {
        this.hoveredCells = []
        this.isPreviewValid = false
        this.render(this.gameState)
      }
    }
  }

  /**
   * Check if it's the AI's turn and make a move
   */
  checkAITurn() {
    const isAITurn = this.gameState.currentPlayer === PLAYERS.PLAYER_2
    const notGameOver = this.gameState.phase !== GAME_PHASES.GAME_OVER

    if (isAITurn && notGameOver && !this.aiThinking) {
      this.aiThinking = true

      setTimeout(() => {
        this.makeAIMove()
      }, SimpleAI.getActionDelay())
    }
  }

  /**
   * Make an AI move (draft or placement)
   */
  makeAIMove() {
    try {
      if (this.gameState.phase === GAME_PHASES.DRAFT) {
        this.makeAIDraftMove()
      } else if (this.gameState.phase === GAME_PHASES.PLACEMENT) {
        this.makeAIPlacementMove()
      }
    } catch (error) {
      console.error('AI move error:', error)
    } finally {
      this.aiThinking = false
    }
  }

  /**
   * Make an AI draft move
   */
  makeAIDraftMove() {
    const decision = SimpleAI.makeDraftDecision(this.gameState, PLAYERS.PLAYER_2)

    if (decision) {
      this.gameState = GameService.draftBuy(this.gameState, PLAYERS.PLAYER_2, decision)
    } else {
      this.gameState = GameService.draftPass(this.gameState, PLAYERS.PLAYER_2)
    }

    this.render(this.gameState)
  }

  /**
   * Make an AI placement move
   */
  makeAIPlacementMove() {
    const move = SimpleAI.makePlacementDecision(this.gameState, PLAYERS.PLAYER_2)

    if (move) {
      this.gameState = GameService.placePiece(this.gameState, move)
      this.render(this.gameState)
    } else {
      // AI has no moves - check if this ends the game
      console.log('AI has no legal moves - checking game end')
      this.checkAndHandleGameEnd()
    }
  }

  /**
   * Start a new game
   */
  newGame() {
    if (confirm('Start a new game? Current progress will be lost.')) {
      // Close any existing overlay
      this.closeGameEndingOverlay()

      // Reset game state and UI
      this.gameState = GameService.createNew(10, 10)
      this.selectedPiece = null
      this.hoveredCells = []
      this.aiThinking = false
      this.overlayShown = false
      this.render(this.gameState)
    }
  }

  /**
   * Check and handle game end conditions with robust detection
   */
  checkAndHandleGameEnd() {
    // Skip if already shown overlay or not in placement phase
    if (this.overlayShown || !this.gameState || this.gameState.phase !== GAME_PHASES.PLACEMENT) {
      return
    }

    try {
      // Use the GameService to check and update the game state
      const updatedGameState = GameService.startTurn(this.gameState)

      console.log('Game End Check:', {
        originalPhase: this.gameState.phase,
        updatedPhase: updatedGameState.phase,
        currentPlayer: this.gameState.currentPlayer,
        winner: updatedGameState.winner
      })

      // If the phase changed to GAME_OVER, handle it
      if (updatedGameState.phase === GAME_PHASES.GAME_OVER && this.gameState.phase !== GAME_PHASES.GAME_OVER) {
        console.log('Game ended - showing overlay')

        // Update our game state
        this.gameState = updatedGameState

        // Show the overlay immediately
        this.showGameEndingOverlay(
          this.gameState.winner,
          this.gameState.finalScores || this.gameState.scoring,
          this.gameState.endReason || 'Game Complete'
        )

        console.log('Game ended:', {
          winner: this.gameState.winner,
          finalScores: this.gameState.finalScores,
          reason: this.gameState.endReason
        })
      } else if (updatedGameState !== this.gameState) {
        // Update game state if it changed (e.g., player switched)
        this.gameState = updatedGameState
      }
    } catch (error) {
      console.error('Error in game end detection:', error)
    }
  }

  /**
   * Format enhanced game ending announcement
   */
  formatGameEndingAnnouncement(status) {
    const scores = status.finalScores || status.scores
    const winner = status.winner
    const reason = status.endReason || 'Game Complete'

    // Show the game ending overlay and return simplified announcement
    this.showGameEndingOverlay(winner, scores, reason)

    return `
      <div class="game-ending-announcement">
        <div class="victory-title">🎉 GAME OVER 🎉</div>
        <div class="victory-subtitle">Player ${winner} Wins!</div>

        <div class="final-score-display">
          <div class="final-score-row">
            <span>Player 1:</span>
            <span class="${winner === 1 ? 'winner-score' : ''}">${scores.player1} points</span>
          </div>
          <div class="final-score-row">
            <span>Player 2:</span>
            <span class="${winner === 2 ? 'winner-score' : ''}">${scores.player2} points</span>
          </div>
        </div>

        <div class="game-ending-reason">
          ${reason}
        </div>
      </div>
    `
  }

  /**
   * Show full-screen game ending overlay with You Win/You Lose message
   */
  showGameEndingOverlay(winner, scores, reason) {
    // Prevent showing multiple overlays for the same game
    if (this.overlayShown) {
      return
    }
    this.overlayShown = true

    // Remove any existing overlay
    this.closeGameEndingOverlay()

    // Ensure we have valid scores
    if (!scores || (!scores.player1 && scores.player1 !== 0)) {
      scores = {
        player1: this.gameState.scoring?.player1Score || 0,
        player2: this.gameState.scoring?.player2Score || 0
      }
    }

    console.log('Showing game ending overlay:', { winner, scores, reason })

    // Determine if player won or lost (Player 1 is the human player)
    const playerWon = winner === 1
    const overlayClass = playerWon ? 'you-win-overlay' : 'you-lose-overlay'
    const title = playerWon ? '🎉 YOU WIN! 🎉' : '💔 YOU LOSE 💔'
    const subtitle = playerWon ?
      'Congratulations! You achieved victory!' :
      'Better luck next time!'

    // Create the overlay
    const overlay = document.createElement('div')
    overlay.className = 'game-ending-overlay'
    overlay.id = 'game-ending-overlay'

    overlay.innerHTML = `
      <div class="overlay-background"></div>
      <div class="overlay-content ${overlayClass}">
        <div class="overlay-title">${title}</div>
        <div class="overlay-subtitle">${subtitle}</div>

        <div class="overlay-scores">
          <div class="overlay-score-row">
            <span>Your Score:</span>
            <span class="${winner === 1 ? 'overlay-winner-score' : ''}">${scores.player1} points</span>
          </div>
          <div class="overlay-score-row">
            <span>Opponent Score:</span>
            <span class="${winner === 2 ? 'overlay-winner-score' : ''}">${scores.player2} points</span>
          </div>
        </div>

        <div class="overlay-reason">
          ${reason}
        </div>

        <div class="overlay-buttons">
          <button class="overlay-button overlay-button-primary" onclick="window.ui.newGame()">
            Play Again
          </button>
          <button class="overlay-button overlay-button-secondary" onclick="window.ui.returnToMenu()">
            Main Menu
          </button>
          <button class="overlay-button overlay-button-secondary" onclick="window.ui.closeGameEndingOverlay()">
            Close
          </button>
        </div>
      </div>
    `

    // Add to document body
    document.body.appendChild(overlay)

    // Add click handler to background to close overlay
    const background = overlay.querySelector('.overlay-background')
    background.onclick = () => this.closeGameEndingOverlay()

    // Prevent body scrolling while overlay is shown
    document.body.style.overflow = 'hidden'

    // Auto-close after 10 seconds if user doesn't interact
    this.overlayTimeout = setTimeout(() => {
      this.closeGameEndingOverlay()
    }, 10000)
  }

  /**
   * Close the game ending overlay
   */
  closeGameEndingOverlay() {
    const overlay = document.getElementById('game-ending-overlay')
    if (overlay) {
      overlay.remove()
      document.body.style.overflow = ''
    }

    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout)
      this.overlayTimeout = null
    }
  }

  /**
   * Render scoring rules panel with visual patterns
   */
  renderScoringRules(container) {
    container.innerHTML = `
      <h4>Scoring Rules</h4>

      <div class="rules-category">
        <h5>Simple Patterns (5-15 pts)</h5>
        ${this.createPatternVisual('line-4', 'Line (4 cells)', '5 pts')}
        ${this.createPatternVisual('line-5', 'Line (5 cells)', '6 pts')}
        ${this.createPatternVisual('line-6', 'Line (6 cells)', '8 pts')}
        ${this.createPatternVisual('rect-2x3', 'Rectangle 2×3', '7 pts')}
        ${this.createPatternVisual('square-3x3', 'Square 3×3', '10 pts')}
        ${this.createPatternVisual('corner', 'Corner Control', '12 pts')}
        ${this.createPatternVisual('edge', 'Edge Control', '15 pts')}
      </div>

      <div class="rules-category">
        <h5>Medium Patterns (15-30 pts)</h5>
        ${this.createPatternVisual('line-8', 'Line (8+ cells)', '15+ pts')}
        ${this.createPatternVisual('full-row', 'Full Row/Column', '25 pts')}
        ${this.createPatternVisual('rect-large', 'Large Rectangle', '16-18 pts')}
        ${this.createPatternVisual('square-4x4', 'Square 4×4', '22 pts')}
        ${this.createPatternVisual('square-5x5', 'Square 5×5', '30 pts')}
        ${this.createPatternVisual('center', 'Center Control', '20-25 pts')}
      </div>

      <div class="rules-note">
        <strong>Win Condition:</strong> Game ends when both players are blocked. Winner has the highest score. Ties broken by fewer remaining pieces.
      </div>
    `
  }

  /**
   * Create visual pattern representation
   */
  createPatternVisual(patternType, name, points) {
    const patternShape = this.generatePatternShape(patternType)
    return `
      <div class="pattern-visual">
        ${patternShape}
        <div class="pattern-info">
          <span class="pattern-name">${name}</span>
          <span class="pattern-points">${points}</span>
        </div>
      </div>
    `
  }

  /**
   * Generate visual shape for pattern types
   */
  generatePatternShape(patternType) {
    const patterns = {
      'line-4': {
        class: 'pattern-line-4',
        cells: [1, 1, 1, 1]
      },
      'line-5': {
        class: 'pattern-line-5',
        cells: [1, 1, 1, 1, 1]
      },
      'line-6': {
        class: 'pattern-line-6',
        cells: [1, 1, 1, 1, 1, 1]
      },
      'line-8': {
        class: 'pattern-line-6', // Show 6 for space, represent 8+
        cells: [1, 1, 1, 1, 1, 1]
      },
      'rect-2x3': {
        class: 'pattern-rect-2x3',
        cells: [1, 1, 1, 1, 1, 1]
      },
      'square-3x3': {
        class: 'pattern-square-3x3',
        cells: [1, 1, 1, 1, 1, 1, 1, 1, 1]
      },
      'square-4x4': {
        class: 'pattern-square-4x4',
        cells: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      },
      'square-5x5': {
        class: 'pattern-square-5x5',
        cells: Array(25).fill(1)
      },
      'corner': {
        class: 'pattern-corner',
        cells: [1, 1, 0, 1, 1, 0, 1, 0, 0] // L-shaped corner control
      },
      'edge': {
        class: 'pattern-edge',
        cells: [1, 1, 1, 1, 1] // Edge control representation
      },
      'center': {
        class: 'pattern-center',
        cells: [0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0] // Center dominance
      },
      'rect-large': {
        class: 'pattern-rect-3x2',
        cells: [1, 1, 1, 1, 1, 1] // 3x2 large rectangle
      },
      'full-row': {
        class: 'pattern-line-6',
        cells: [1, 1, 1, 1, 1, 1] // Full row representation
      }
    }

    const pattern = patterns[patternType]
    if (!pattern) return ''

    const cellsHtml = pattern.cells.map(cell =>
      `<div class="pattern-cell ${cell ? 'filled' : 'empty'}"></div>`
    ).join('')

    return `<div class="pattern-shape ${pattern.class}">${cellsHtml}</div>`
  }

  /**
   * Return to main menu
   */
  returnToMenu() {
    if (confirm('Return to main menu? Current progress will be lost.')) {
      // Close any existing overlay
      this.closeGameEndingOverlay()

      if (this.onReturnToMenu) {
        this.onReturnToMenu()
      }
    }
  }

  /**
   * Render game statistics for end-game display
   * @param {Object} stats - Game statistics object
   * @param {Object} finalScores - Final scores object
   * @returns {string} HTML string for game statistics
   */
  renderGameStatistics(stats, finalScores) {
    const player1Stats = stats.player1
    const player2Stats = stats.player2

    // Get detailed scoring history from game state
    const scoringHistory = this.gameState.scoring?.scoringHistory || []
    const player1History = scoringHistory.filter(entry => entry.player === 1)
    const player2History = scoringHistory.filter(entry => entry.player === 2)

    return `
      <div class="game-over-stats">
        <h3 style="text-align: center; margin-bottom: 15px; color: #2c3e50;">Game Statistics & Score Cards</h3>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${player1Stats.patternsCreated}</div>
            <div class="stat-label">P1 Patterns</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${player2Stats.patternsCreated}</div>
            <div class="stat-label">P2 Patterns</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${player1Stats.remainingPieces}</div>
            <div class="stat-label">P1 Remaining</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${player2Stats.remainingPieces}</div>
            <div class="stat-label">P2 Remaining</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.totalMoves}</div>
            <div class="stat-label">Total Moves</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${Math.round(stats.gameLength.timeElapsed / 1000)}s</div>
            <div class="stat-label">Game Duration</div>
          </div>
        </div>

        <div class="score-cards-container">
          <div class="score-card">
            <h4 class="score-card-title player1-title">Player 1 Score Card</h4>
            <div class="score-breakdown">
              ${this.renderPlayerScoreBreakdown(player1Stats.pointsByPatternType)}
            </div>
            <div class="pattern-history">
              <h5>Pattern History:</h5>
              ${this.renderPatternHistory(player1History)}
            </div>
          </div>

          <div class="score-card">
            <h4 class="score-card-title player2-title">Player 2 Score Card</h4>
            <div class="score-breakdown">
              ${this.renderPlayerScoreBreakdown(player2Stats.pointsByPatternType)}
            </div>
            <div class="pattern-history">
              <h5>Pattern History:</h5>
              ${this.renderPatternHistory(player2History)}
            </div>
          </div>
        </div>

        <div style="margin-top: 15px;">
          <h4 style="text-align: center; color: #495057;">Favorite Pattern Types</h4>
          <div style="display: flex; justify-content: space-around; margin-top: 10px;">
            <div style="text-align: center;">
              <strong>Player 1:</strong><br>
              <span style="color: #007bff;">${player1Stats.favoritePatternType || 'None'}</span>
            </div>
            <div style="text-align: center;">
              <strong>Player 2:</strong><br>
              <span style="color: #dc3545;">${player2Stats.favoritePatternType || 'None'}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render score breakdown by pattern type for a player
   */
  renderPlayerScoreBreakdown(pointsByPatternType) {
    if (!pointsByPatternType || Object.keys(pointsByPatternType).length === 0) {
      return '<div style="text-align: center; color: #6c757d; font-style: italic;">No patterns created</div>'
    }

    const breakdown = Object.entries(pointsByPatternType)
      .sort(([,a], [,b]) => b - a) // Sort by points descending
      .map(([pattern, points]) => `
        <div class="breakdown-item">
          <span class="breakdown-pattern">${pattern.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span class="breakdown-points">${points} pts</span>
        </div>
      `).join('')

    return `
      <h5>Score Breakdown:</h5>
      ${breakdown}
    `
  }

  /**
   * Render pattern history for a player
   */
  renderPatternHistory(playerHistory) {
    if (!playerHistory || playerHistory.length === 0) {
      return '<div style="text-align: center; color: #6c757d; font-style: italic;">No patterns created</div>'
    }

    const history = playerHistory
      .slice(-8) // Show last 8 patterns only
      .reverse() // Show most recent first
      .map(entry => `
        <div class="history-item">
          <span class="history-turn">Turn ${entry.turn}:</span>
          <span class="history-pattern">${entry.pattern}</span>
          <span class="history-points">+${entry.points} pts</span>
        </div>
      `).join('')

    return history
  }

  /**
   * Test method to simulate game ending for testing the overlay
   * (Development/Testing purposes only)
   */
  testGameEnding(playerWins = true) {
    const mockScores = {
      player1: playerWins ? 45 : 23,
      player2: playerWins ? 23 : 45
    }
    const winner = playerWins ? 1 : 2
    const reason = playerWins ?
      'Player 1 wins with 45 points vs 23 points' :
      'Player 2 wins with 45 points vs 23 points'

    this.showGameEndingOverlay(winner, mockScores, reason)
  }

  /**
   * Force end current game (for testing)
   */
  forceEndGame() {
    if (this.gameState && this.gameState.phase === GAME_PHASES.PLACEMENT) {
      console.log('Force ending game...')

      // Set game to over
      this.gameState.phase = GAME_PHASES.GAME_OVER

      // Determine winner based on current scores
      const score1 = this.gameState.scoring?.player1Score || 0
      const score2 = this.gameState.scoring?.player2Score || 0

      const winner = score1 >= score2 ? 1 : 2
      const reason = `Game force-ended: Player ${winner} wins with ${winner === 1 ? score1 : score2} points`

      this.gameState.winner = winner
      this.gameState.endReason = reason
      this.gameState.finalScores = { player1: score1, player2: score2 }

      this.showGameEndingOverlay(winner, this.gameState.finalScores, reason)
    }
  }

}

// Make UI globally accessible for button handlers
window.ui = null
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

    // Set up keyboard controls
    this.setupKeyboardControls()

    // Set up A2HS prompt
    this.setupA2HSPrompt()
  }

  /**
   * Set up keyboard event listeners for piece transformation
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.selectedPiece || this.gameState?.phase !== 'placement') return

      switch(e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          this.rotatePiece()
          break
        case 'f':
          e.preventDefault()
          this.flipPiece()
          break
        case 'escape':
          e.preventDefault()
          this.clearSelection()
          break
      }
    })
  }

  /**
   * Set up Add to Home Screen prompt
   */
  setupA2HSPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredA2HSPrompt = e
      this.showA2HSBanner()
    })
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

    this.renderGameStatus(wrapper)
    this.renderGameContent(wrapper)

    // Add copyright footer
    const footer = document.createElement('div')
    footer.style.cssText = `
      text-align: center;
      padding: 10px;
      margin-top: 20px;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
    `
    footer.innerHTML = '(c) <a href="https://www.ctnb.eu" target="_blank" style="color: #666; text-decoration: underline;">ctnb</a> 2025'
    wrapper.appendChild(footer)

    this.container.appendChild(wrapper)

    // Check if AI should make a move
    this.checkAITurn()
  }

  renderGameStatus(container) {
    const status = GameService.getStatus(this.gameState)
    const statusDiv = document.createElement('div')
    statusDiv.className = 'game-status'
    statusDiv.setAttribute('role', 'status')
    statusDiv.setAttribute('aria-live', 'polite')
    statusDiv.setAttribute('aria-atomic', 'true')

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
      <div id="board-controls" class="board-controls"></div>
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
    this.renderBoardControls(boardSection.querySelector('#board-controls'))
    this.renderArsenal(boardSection.querySelector('#arsenal-pieces'))
    this.renderCurrentPlayerInfo(sidePanel.querySelector('#current-player-info'))
    this.renderScoringRules(sidePanel.querySelector('#scoring-rules'))
    this.renderControls(sidePanel.querySelector('#controls'))

    container.appendChild(boardSection)
    container.appendChild(sidePanel)

    // Add floating action buttons for mobile touch control
    this.renderFloatingActionButtons()
  }

  renderBoard(container) {
    const board = this.gameState.board
    container.className = 'board'
    container.setAttribute('role', 'grid')
    container.setAttribute('aria-label', 'Game board')
    container.style.gridTemplateColumns = `repeat(${board.cols}, 1fr)`
    container.style.gridTemplateRows = `repeat(${board.rows}, 1fr)`
    container.innerHTML = ''


    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        cell.setAttribute('role', 'gridcell')
        cell.dataset.x = x
        cell.dataset.y = y

        const cellValue = board.grid[y][x]

        // Accessibility label for cell
        let cellLabel = `Cell ${x}, ${y}`
        if (cellValue === -1) {
          cellLabel += ', unusable'
        } else if (cellValue === 1) {
          cellLabel += ', occupied by Player 1'
        } else if (cellValue === 2) {
          cellLabel += ', occupied by Player 2'
        } else {
          cellLabel += ', empty'
        }
        cell.setAttribute('aria-label', cellLabel)

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
    container.setAttribute('role', 'list')
    container.setAttribute('aria-label', 'Available game pieces')

    for (const [pieceId, count] of Object.entries(arsenal)) {
      if (count > 0) {
        const miniature = document.createElement('div')
        miniature.className = `arsenal-miniature ${this.selectedPiece === pieceId ? 'selected' : ''}`
        miniature.setAttribute('role', 'button')
        miniature.setAttribute('aria-label', `Select ${pieceId} piece, ${count} remaining`)
        miniature.setAttribute('aria-pressed', this.selectedPiece === pieceId ? 'true' : 'false')
        miniature.setAttribute('tabindex', '0')
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

  renderBoardControls(container) {
    if (this.selectedPiece) {
      container.innerHTML = `
        <div class="board-controls-section">
          <div class="selected-piece">Selected: ${this.selectedPiece}</div>
          <div class="transform-buttons">
            <button class="btn btn-transform" onclick="window.ui.rotatePiece()">Rotate (R)</button>
            <button class="btn btn-transform" onclick="window.ui.flipPiece()">Flip (F)</button>
            <button class="btn btn-cancel" onclick="window.ui.clearSelection()">Cancel (Esc)</button>
          </div>
        </div>
      `
    } else {
      container.innerHTML = `
        <div class="board-controls-section">
          <div class="help-text">Select a piece from your arsenal</div>
        </div>
      `
    }
  }

  renderControls(container) {
    let controlsHTML = `<div class="controls-section">`

    if (this.onReturnToMenu) {
      controlsHTML += `<button class="btn btn-menu" onclick="window.ui.returnToMenu()">Main Menu</button>`
    }

    controlsHTML += `
      <button class="btn btn-new-game" onclick="window.ui.newGame()">New Game</button>
    </div>`

    container.innerHTML = controlsHTML
  }

  /**
   * Render floating action buttons for mobile touch control
   * These buttons appear when a piece is selected on mobile devices
   */
  renderFloatingActionButtons() {
    // Remove existing FABs if any
    const existingFabs = document.querySelector('.floating-action-buttons')
    if (existingFabs) {
      existingFabs.remove()
    }

    // Only show FABs on mobile/tablet and when a piece is selected
    if (this.selectedPiece && this.gameState.phase === 'placement') {
      const fabContainer = document.createElement('div')
      fabContainer.className = `floating-action-buttons ${this.selectedPiece ? 'active' : ''}`
      fabContainer.setAttribute('role', 'toolbar')
      fabContainer.setAttribute('aria-label', 'Piece transformation controls')

      fabContainer.innerHTML = `
        <button class="fab rotate" onclick="window.ui.rotatePiece()" aria-label="Rotate piece (R key)">
          ↻
        </button>
        <button class="fab flip" onclick="window.ui.flipPiece()" aria-label="Flip piece (F key)">
          ⇄
        </button>
        <button class="fab cancel" onclick="window.ui.clearSelection()" aria-label="Cancel selection (Esc key)">
          ✕
        </button>
      `

      document.body.appendChild(fabContainer)
    }
  }

  /**
   * Show A2HS (Add to Home Screen) banner
   */
  showA2HSBanner() {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem('a2hs-dismissed') === 'true') return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const banner = document.createElement('div')
    banner.className = 'a2hs-banner'
    banner.setAttribute('role', 'dialog')
    banner.setAttribute('aria-label', 'Install app prompt')
    banner.innerHTML = `
      <div class="a2hs-content">
        <div class="a2hs-title">Install SumZero</div>
        <div class="a2hs-description">Add to your home screen for quick access!</div>
      </div>
      <div class="a2hs-actions">
        <button class="a2hs-button a2hs-install" onclick="window.ui.installA2HS()">Install</button>
        <button class="a2hs-button a2hs-dismiss" onclick="window.ui.dismissA2HS()">Maybe Later</button>
      </div>
    `
    document.body.appendChild(banner)
  }

  /**
   * Install PWA via A2HS prompt
   */
  installA2HS() {
    if (!this.deferredA2HSPrompt) return

    this.deferredA2HSPrompt.prompt()
    this.deferredA2HSPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt')
      }
      this.deferredA2HSPrompt = null
      this.dismissA2HS()
    })
  }

  /**
   * Dismiss A2HS banner
   */
  dismissA2HS() {
    const banner = document.querySelector('.a2hs-banner')
    if (banner) {
      banner.remove()
      localStorage.setItem('a2hs-dismissed', 'true')
    }
  }

  /**
   * Show loading overlay during AI moves
   */
  showLoadingSpinner(message = 'AI is thinking...') {
    // Remove existing spinner if any
    this.hideLoadingSpinner()

    const overlay = document.createElement('div')
    overlay.className = 'loading-overlay'
    overlay.setAttribute('role', 'status')
    overlay.setAttribute('aria-live', 'polite')
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text" aria-label="${message}">${message}</div>
    `
    document.body.appendChild(overlay)
  }

  /**
   * Hide loading overlay
   */
  hideLoadingSpinner() {
    const overlay = document.querySelector('.loading-overlay')
    if (overlay) {
      overlay.remove()
    }
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

      // Show loading spinner
      this.showLoadingSpinner('AI is thinking...')

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
      // Hide loading spinner
      this.hideLoadingSpinner()
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
        <div class="victory-title">GAME OVER</div>
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
    const title = playerWon ? 'YOU WIN' : 'YOU LOSE'
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
        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: rgba(255,255,255,0.7);">
          (c) <a href="https://www.ctnb.eu" target="_blank" style="color: rgba(255,255,255,0.8); text-decoration: underline;">ctnb</a> 2025
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
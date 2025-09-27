/**
 * SumZero Game - Main Entry Point
 * A two-player strategic polyomino game
 */

import { GameService } from './core/game/GameService.js'
import { UI } from './ui/UI.js'
import { MenuUI } from './ui/MenuUI.js'
import { BoardShapes } from './core/board/BoardShapes.js'

/**
 * Application state manager
 */
class App {
  constructor() {
    this.container = document.getElementById('app')
    this.currentScreen = 'menu'
    this.gameConfig = null
    this.ui = null
    this.menuUI = null
  }

  /**
   * Initialize the application
   */
  init() {
    console.log('SumZero v1.3 - Strategic Polyomino Game')
    this.showMenu()
  }

  /**
   * Show the main menu
   */
  showMenu() {
    this.currentScreen = 'menu'
    this.menuUI = new MenuUI(this.container, (config) => this.startGame(config))
    window.menuUI = this.menuUI // Make globally accessible
    this.menuUI.render()
  }

  /**
   * Start a game with the given configuration
   */
  startGame(config) {
    this.currentScreen = 'game'
    this.gameConfig = config

    console.log('Starting game with config:', config)

    // Determine board size and shape based on config
    const { rows, cols, boardConfig } = this.getBoardConfig(config)

    // Create game state with enhanced configuration
    const gameState = GameService.createNew(rows, cols, {
      ...boardConfig,
      difficulty: config.difficulty,
      boardShape: config.boardShape
    })

    // Initialize game UI
    this.ui = new UI(this.container, () => this.showMenu())
    window.ui = this.ui // Make globally accessible for event handlers
    this.ui.render(gameState)
  }

  /**
   * Get board configuration based on game settings
   */
  getBoardConfig(config) {
    let rows = 10, cols = 10
    let boardConfig = {}
    let customBoard = null

    // Adjust board based on shape selection
    if (config.boardShape === 'varied') {
      const variedConfig = BoardShapes.getRandomVariedConfig()
      customBoard = BoardShapes.createShapedBoard(variedConfig.shape, variedConfig.size)
      rows = customBoard.rows
      cols = customBoard.cols
      boardConfig.customBoard = customBoard
    }


    // Add difficulty specific config
    boardConfig.aiDifficulty = config.difficulty

    return { rows, cols, boardConfig }
  }
}

// Global app instance
const app = new App()

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init())
} else {
  app.init()
}
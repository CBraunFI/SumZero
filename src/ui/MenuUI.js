/**
 * Main Menu UI for SumZero
 * Handles game mode selection, difficulty settings, and navigation
 */

export class MenuUI {
  constructor(container, onGameStart) {
    this.container = container
    this.onGameStart = onGameStart
    this.selectedDifficulty = 'normal'
    this.selectedBoardShape = 'rectangular'
  }

  /**
   * Render the main menu
   */
  render() {
    this.container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'menu-wrapper'
    wrapper.innerHTML = `
      <style>
        .menu-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .menu-title {
          text-align: center;
          color: #333333;
          font-size: 4em;
          font-weight: 300;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .menu-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }
        .menu-content {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 30px;
          border: 1px solid #e8e8e8;
          width: 100%;
          max-width: 500px;
        }
        .menu-section {
          margin-bottom: 25px;
        }
        .menu-section h3 {
          color: #333333;
          margin-bottom: 15px;
          font-size: 1.3em;
          border-bottom: 1px solid #e8e8e8;
          padding-bottom: 5px;
        }
        .option-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }
        .option-btn {
          background: #ffffff;
          border: 1px solid #dddddd;
          border-radius: 4px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.15s ease;
          flex: 1;
          min-width: 120px;
          text-align: center;
          font-weight: 400;
        }
        .option-btn:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }
        .option-btn.selected {
          background: #333333;
          color: white;
          border-color: #333333;
        }
        .start-btn {
          background: #333333;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 15px 30px;
          font-size: 1.2em;
          font-weight: 400;
          cursor: pointer;
          width: 100%;
          margin-top: 20px;
          transition: all 0.15s ease;
        }
        .start-btn:hover {
          background: #555555;
        }
        .description {
          color: #666666;
          font-size: 0.9em;
          margin-top: 8px;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .menu-title {
            font-size: 3em;
            margin-bottom: 30px;
          }
          .menu-logo {
            width: 100px;
            height: 100px;
          }
          .menu-content {
            padding: 20px;
            margin: 10px;
          }
          .option-group {
            flex-direction: column;
          }
          .option-btn {
            min-width: auto;
          }
        }
      </style>

      <h1 class="menu-title">
        <img src="/logo.png" alt="SumZero Logo" class="menu-logo">
        SumZero
      </h1>

      <div class="menu-content">

        <div class="menu-section">
          <h3>Difficulty</h3>
          <div class="option-group">
            <div class="option-btn ${this.selectedDifficulty === 'easy' ? 'selected' : ''}"
                 onclick="window.menuUI.selectDifficulty('easy')">
              Easy
            </div>
            <div class="option-btn ${this.selectedDifficulty === 'normal' ? 'selected' : ''}"
                 onclick="window.menuUI.selectDifficulty('normal')">
              Normal
            </div>
            <div class="option-btn ${this.selectedDifficulty === 'medium' ? 'selected' : ''}"
                 onclick="window.menuUI.selectDifficulty('medium')">
              Medium
            </div>
            <div class="option-btn ${this.selectedDifficulty === 'hard' ? 'selected' : ''}"
                 onclick="window.menuUI.selectDifficulty('hard')">
              Hard
            </div>
          </div>
          <div class="description">
            ${this.getDifficultyDescription()}
          </div>
        </div>

        <div class="menu-section">
          <h3>Board Shape</h3>
          <div class="option-group">
            <div class="option-btn ${this.selectedBoardShape === 'rectangular' ? 'selected' : ''}"
                 onclick="window.menuUI.selectBoardShape('rectangular')">
              Rectangular
            </div>
            <div class="option-btn ${this.selectedBoardShape === 'varied' ? 'selected' : ''}"
                 onclick="window.menuUI.selectBoardShape('varied')">
              Varied
            </div>
          </div>
          <div class="description">
            ${this.getBoardShapeDescription()}
          </div>
        </div>

        <button class="start-btn" onclick="window.menuUI.startGame()">
          Start Game
        </button>

        <div style="margin-top: 20px; padding: 15px; background: #ffffff; border-radius: 4px; border: 1px solid #e8e8e8;">
          <button class="start-btn" style="background: #666666; margin: 0; padding: 10px 20px; font-size: 0.9em;" onclick="window.menuUI.showTutorial()">
Quick Tutorial
          </button>
        </div>

        <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #666666;">
          (c) <a href="https://www.ctnb.eu" target="_blank" style="color: #666666; text-decoration: underline;">ctnb</a> 2025
        </div>
      </div>
    `

    this.container.appendChild(wrapper)
  }


  /**
   * Select difficulty
   */
  selectDifficulty(difficulty) {
    this.selectedDifficulty = difficulty
    this.render()
  }

  /**
   * Select board shape
   */
  selectBoardShape(shape) {
    this.selectedBoardShape = shape
    this.render()
  }

  /**
   * Start the game with selected options
   */
  startGame() {
    const gameConfig = {
      difficulty: this.selectedDifficulty,
      boardShape: this.selectedBoardShape
    }

    this.onGameStart(gameConfig)
  }

  /**
   * Get game mode description
   */

  /**
   * Get difficulty description
   */
  getDifficultyDescription() {
    switch (this.selectedDifficulty) {
      case 'easy':
        return 'AI makes many mistakes - good for learning the game.'
      case 'normal':
        return 'Smart AI with enhanced pattern recognition and strategic depth.'
      case 'medium':
        return 'Advanced AI that actively sabotages your strategy and blocks your patterns.'
      case 'hard':
        return 'RUTHLESS AI with MAXIMUM aggression - destroys your plans, denies opportunities, and shows NO MERCY.'
      default:
        return ''
    }
  }

  /**
   * Get board shape description
   */
  getBoardShapeDescription() {
    switch (this.selectedBoardShape) {
      case 'rectangular':
        return 'Standard 10x10 square board.'
      case 'varied':
        return 'Non-rectangular boards with interesting shapes.'
      default:
        return ''
    }
  }

  /**
   * Show tutorial overlay
   */
  showTutorial() {
    const tutorialOverlay = document.createElement('div')
    tutorialOverlay.id = 'tutorial-overlay'
    tutorialOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    tutorialOverlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <h2 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">SumZero Quick Tutorial</h2>

        <div style="line-height: 1.6; color: #444;">
          <h3 style="color: #333333; margin-top: 20px;">Goal</h3>
          <p>Score the most points by creating patterns with your pieces before both players are blocked.</p>

          <h3 style="color: #333333; margin-top: 20px;">How to Play</h3>
          <ol>
            <li><strong>Draft Phase:</strong> Take turns buying pieces with your budget</li>
            <li><strong>Placement Phase:</strong> Place pieces on the board to form scoring patterns</li>
            <li><strong>Game End:</strong> When both players can't move, highest score wins!</li>
          </ol>

          <h3 style="color: #333333; margin-top: 20px;">Scoring Patterns</h3>
          <ul>
            <li><strong>Lines:</strong> 4+ cells in a row = 5-15+ points</li>
            <li><strong>Rectangles:</strong> Solid rectangles = 7-18 points</li>
            <li><strong>Squares:</strong> Perfect squares = 10-30 points</li>
            <li><strong>Control Areas:</strong> Corners/edges = 12-25 points</li>
          </ul>

          <h3 style="color: #333333; margin-top: 20px;">Pro Tips</h3>
          <ul>
            <li>Buy larger pieces early - they're more powerful</li>
            <li>Block your opponent's good spots</li>
            <li>Control corners and edges for bonus points</li>
            <li>Plan patterns ahead of time</li>
          </ul>

          <div style="text-align: center; margin-top: 30px;">
            <button onclick="document.getElementById('tutorial-overlay').remove()" style="
              background: #333333;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 12px 30px;
              font-size: 16px;
              cursor: pointer;
              transition: background 0.15s;
            " onmouseover="this.style.background='#555555'" onmouseout="this.style.background='#333333'">
              Got it! Let's Play
            </button>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #666;">
            (c) <a href="https://www.ctnb.eu" target="_blank" style="color: #666; text-decoration: underline;">ctnb</a> 2025
          </div>
        </div>
      </div>
    `

    // Close on background click
    tutorialOverlay.addEventListener('click', (e) => {
      if (e.target === tutorialOverlay) {
        tutorialOverlay.remove()
      }
    })

    document.body.appendChild(tutorialOverlay)
  }
}
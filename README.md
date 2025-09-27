# SumZero - Strategic Polyomino Game

A two-player strategy game where players draft polyomino pieces (tetrominoes and pentominoes) and take turns placing them on a shared grid. The first player who cannot make a legal move loses.

## Game Overview

SumZero consists of two main phases:

1. **Draft Phase**: Players alternate purchasing polyomino pieces under a budget constraint
2. **Placement Phase**: Players take turns placing their pieces on the board until one player cannot move

### Rules

- Board size: 8×8 (configurable, default budget = (cells÷2)+1 = 33 points)
- Pieces cost their cell count (tetrominoes = 4 points, pentominoes = 5 points)
- Pieces can be rotated (90° increments) and flipped horizontally
- Pieces must fit entirely within the board without overlapping existing pieces
- First player unable to place any piece loses

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
├── core/
│   ├── geometry/       # Coordinate systems and transformations
│   ├── pieces/         # Piece definitions and library
│   ├── board/          # Board representation and operations
│   ├── draft/          # Draft phase logic
│   ├── placement/      # Placement phase logic
│   └── game/           # Game state management
├── ui/                 # User interface components
├── utils/              # Constants and utilities
└── main.js             # Application entry point
```

## Key Features Implemented

✅ **Core Game Engine**
- Complete polyomino piece library (7 tetrominoes + 12 pentominoes)
- Geometric transformation system (rotation + reflection)
- Legal move validation and enumeration
- Game state management with save/load

✅ **Draft System**
- Budget-based piece purchasing
- Stock management (singleton/unlimited modes)
- Draft end conditions

✅ **Placement System**
- Collision detection and bounds checking
- Move validation and commit
- Turn resolution and loss detection

✅ **User Interface**
- Interactive draft screen with piece gallery
- Game board with click-to-place mechanics
- Visual feedback for valid/invalid placements
- Keyboard controls (R=rotate, F=flip, Esc=cancel)

✅ **Testing**
- Comprehensive test suite (42 tests passing)
- Unit tests for all core systems
- Integration tests for complete game flow

## How to Play

### Draft Phase
1. Players take turns buying pieces from the available stock
2. Each piece costs its cell count (4 or 5 points)
3. Click on pieces to purchase them with your budget
4. Click "Pass" to skip your turn
5. Draft ends when both players pass or no one can afford remaining pieces

### Placement Phase
1. Select a piece from your arsenal (bottom panel)
2. Use R key to rotate, F key to flip
3. Click on the board to place the piece
4. Green cells = valid placement, red cells = invalid
5. Game ends when a player cannot place any piece

## Technical Implementation

The game follows the comprehensive SumZero specification v1.2, implementing:

- **Immutable game state** with proper state transitions
- **Precomputed transformations** for performance optimization
- **Modular architecture** with clear separation of concerns
- **ES6 modules** with modern JavaScript features
- **Jest testing framework** with experimental VM modules support

## Browser Compatibility

- Modern browsers supporting ES6 modules
- Tested with Chrome, Firefox, Safari, Edge
- Responsive design for desktop and tablet

## Development

The game is built with:
- **Vite** for fast development and building
- **Jest** for testing with ES module support
- **ESLint** for code quality
- **Vanilla JavaScript** (no frameworks) for simplicity

Run `npm run dev` and open http://localhost:3000 to start playing!

## License

MIT License - see LICENSE file for details.
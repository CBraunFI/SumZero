# SumZero -- Comprehensive Technical Specification (v1.2)

This specification is written to be executable by an AI coding agent or a human developer. It defines behavior, data, algorithms, UI flows, and acceptance tests in sufficient detail to implement SumZero end-to-end without external clarification.

**Version 1.2 Changes:**
- Fixed coordinate system inconsistencies
- Clarified transformation algorithms
- Improved JSON data model consistency
- Enhanced draft logic with proper state management
- Added comprehensive input validation
- Optimized AI heuristics for performance

## 1. Game Concept

SumZero is a two-player, turn-based strategy puzzle. Before play, both players draft a personalized arsenal of polyomino pieces (tetrominoes with 4 cells and pentominoes with 5 cells) under a point budget. During play, players alternate placing one piece per turn on a shared grid. Pieces may be translated, rotated, and flipped, and must lie fully within bounds without overlapping existing cells. If the active player starts their turn with no legal placement using any remaining piece, that player immediately loses.

**Design goals:**
- Simple, deterministic rules
- High strategic depth from geometry and draft constraints
- Fast turns, readable state, crisp loss condition

## 2. Vocabulary and Coordinate System

- **Cell:** a single grid square, addressed by integer coordinates [x, y]
- **Board:** a rectangular grid R rows × C columns. Origin [0, 0] is top-left; x increases to the right; y increases downward
- **Polyomino:** connected set of k cells (4 for tetromino, 5 for pentomino). Connectivity is 4-neighbor (orthogonal)
- **Shape definition:** ordered list of relative coordinates with an origin cell at [0, 0] and all other cells at nonnegative integers, normalized by translating the minimal bounding box to [0, 0]
- **Transformation:** one of eight isometries of the square grid (four rotations × optional horizontal reflection)
- **Arsenal:** collection of unplayed pieces a player has drafted
- **Stock:** available pieces and quantities in the draft pool

## 3. Game Phases and State Machine

**High-level phases:**
1. Setup
2. Draft
3. Placement (Main game loop)
4. Game over

**State machine (top-level):**
- SETUP → DRAFT → PLACEMENT → GAME_OVER

**Transitions:**
- SETUP → DRAFT when board, stock, budgets initialized
- DRAFT → PLACEMENT when no player can or chooses to buy further pieces within budget and stock rules
- PLACEMENT → GAME_OVER when the active player has zero legal placements at the start of their turn

**Turn sub-states in PLACEMENT:**
- AWAIT_PIECE_SELECTION
- DRAG_PREVIEW (transform operations allowed)
- COMMIT_OR_CANCEL
- SWITCH_TURN or END

## 4. Rules and Constraints

### 4.1 Board
- Board dimensions R, C are positive integers (R ≥ 6, C ≥ 6 recommended for default)
- Total cells n = R × C

### 4.2 Budget
- Each player's draft budget is B = (n // 2) + 1 (integer division)
- Budgets are independent; unused budget carries no benefit after the draft

### 4.3 Pieces and Costs
- Allowed sizes: 4 or 5 cells
- Cost function: cost(piece) = number_of_cells (4 or 5). Costs are integers
- A piece is identified by a unique string id

### 4.4 Draft Pool (Stock) Modes
- **Default:** singleton stock (one copy per enumerated piece id) to create scarcity
- **Configurable alternative:** unlimited stock (any number of copies). If enabled, remove stock depletion checks and end draft when both players pass or have zero budget

### 4.5 Draft Procedure
- Players alternate picks starting with Player 1
- On their draft turn a player may:
  - Buy one available piece whose cost ≤ remaining budget
  - Or pass. Passing is reversible while the other player still buys; the draft ends when both players consecutively pass or no legal purchases remain for both players
- On buy: deduct cost, move one unit of that piece id from stock to player's arsenal
- A player may own duplicates only if stock mode permits or multiple ids exist that are geometrically distinct

### 4.6 Placement Legality
A placement is legal if and only if:
1. All transformed absolute cell coordinates lie within 0 ≤ x < C and 0 ≤ y < R
2. Every target cell is empty (no overlap)

No additional adjacency or spacing rules apply.

### 4.7 Transformations
- During preview, a selected piece may be rotated by multiples of 90° and flipped horizontally
- Transformation is applied with the following algorithm:
  1. Apply horizontal flip (if enabled): [dx, dy] → [-dx, dy]
  2. Apply rotation: k times 90° counter-clockwise: [dx, dy] → [-dy, dx]
  3. Normalize to ensure min dx = 0 and min dy = 0

### 4.8 Turn Resolution
On a player's turn:
- If no legal placement exists using any piece in their arsenal with any transformation and any position, that player loses immediately
- Otherwise, the player selects a piece from their arsenal, previews transforms and position, then commits placement. The piece is removed from arsenal and its cells are marked with the player id on the board
- Control passes to the opponent

### 4.9 End Condition
- The first player who cannot legally place on their turn loses. The opponent wins
- No draws exist under these rules

## 5. Data Model and Serialization (JSON)

### 5.1 Identifiers and Types (language-agnostic)
```typescript
type PlayerId = 1 | 2
type Cell = [x: number, y: number]  // Array format for consistency
type RelCell = [dx: number, dy: number]  // dx, dy ≥ 0 in canonical definition
type PieceId = string  // e.g., "I4", "T4", "L4", "P5", "X5", ...
type Transform = { rot: 0|90|180|270, flipX: boolean }
type Move = { 
  player: PlayerId, 
  pieceId: PieceId, 
  transform: Transform,
  anchor: Cell, 
  absCells: Cell[] 
}
```

### 5.2 Piece Definition
```json
{
  "id": "PieceId",
  "size": 4 | 5,
  "cost": 4 | 5,
  "relCells": [[0,0], [1,0], ...]
}
```

### 5.3 Stock and Arsenal
```typescript
type Stock = { [pieceId: string]: number }  // -1 for unlimited; 0..n for finite
type Arsenal = { [pieceId: string]: number }  // count of each piece type owned
```

### 5.4 Board
```json
{
  "rows": 14,
  "cols": 14,
  "grid": [[0,0,0,...], [0,0,0,...], ...]  // R arrays of length C; 0=empty, 1=P1, 2=P2
}
```

### 5.5 GameState
```json
{
  "version": "1.2",
  "phase": "SETUP" | "DRAFT" | "PLACEMENT" | "GAME_OVER",
  "board": "Board",
  "players": {
    "1": { "id": 1, "budget": 99, "color": "#33CCFF", "arsenal": {} },
    "2": { "id": 2, "budget": 99, "color": "#FF9933", "arsenal": {} }
  },
  "stock": {},
  "currentPlayer": 1 | 2,
  "draftState": {
    "player1Passed": false,
    "player2Passed": false,
    "consecutivePasses": 0
  },
  "history": [],
  "winner": null | 1 | 2,
  "config": {
    "stockMode": "singleton" | "unlimited",
    "allowPentominoes": true,
    "allowTetrominoes": true,
    "seed": null,
    "ui": { "showGrid": true, "showHoverPreview": true }
  }
}
```

### 5.6 Save/Load
- Persist the entire GameState as JSON
- Backwards compatibility via version; on load, migrate if version < current

## 6. Canonical Piece Set

The game ships with tetrominoes (7 Tetris forms) and the 12 standard pentominoes. relCells are normalized to top-left (minimum dx = 0 and minimum dy = 0) and include the origin [0, 0].

### 6.1 Tetrominoes (size=4, cost=4)
```javascript
const TETROMINOES = {
  I4: [[0,0],[1,0],[2,0],[3,0]],
  O4: [[0,0],[1,0],[0,1],[1,1]],
  T4: [[0,0],[1,0],[2,0],[1,1]],
  S4: [[1,0],[2,0],[0,1],[1,1]],
  Z4: [[0,0],[1,0],[1,1],[2,1]],
  L4: [[0,0],[0,1],[0,2],[1,2]],
  J4: [[1,0],[1,1],[1,2],[0,2]]
};
```

### 6.2 Pentominoes (size=5, cost=5)
```javascript
const PENTOMINOES = {
  I5: [[0,0],[1,0],[2,0],[3,0],[4,0]],
  L5: [[0,0],[0,1],[0,2],[0,3],[1,3]],
  P5: [[0,0],[1,0],[0,1],[1,1],[0,2]],
  N5: [[0,0],[1,0],[1,1],[2,1],[2,2]],
  T5: [[0,0],[1,0],[2,0],[1,1],[1,2]],
  U5: [[0,0],[0,1],[1,1],[2,1],[2,0]],
  V5: [[0,0],[0,1],[0,2],[1,2],[2,2]],
  W5: [[0,0],[1,0],[1,1],[2,1],[2,2]],
  X5: [[1,0],[0,1],[1,1],[2,1],[1,2]],  // + shape
  Y5: [[0,1],[1,0],[1,1],[1,2],[1,3]],  // stem with arm
  Z5: [[0,0],[1,0],[1,1],[2,1],[2,2]],  // Z shape
  F5: [[1,0],[0,1],[1,1],[1,2],[2,2]]   // F shape
};
```

## 7. Geometry and Transformations

### 7.1 Transformation Algorithm
```javascript
function applyTransform(relCells, transform) {
  let result = [...relCells];
  
  // 1. Flip horizontal (around Y-axis)
  if (transform.flipX) {
    result = result.map(([dx, dy]) => [-dx, dy]);
  }
  
  // 2. Rotation (k * 90° counter-clockwise)
  const rotations = transform.rot / 90;
  for (let i = 0; i < rotations; i++) {
    result = result.map(([dx, dy]) => [-dy, dx]);
  }
  
  // 3. Normalization
  const minDx = Math.min(...result.map(([dx, dy]) => dx));
  const minDy = Math.min(...result.map(([dx, dy]) => dy));
  result = result.map(([dx, dy]) => [dx - minDx, dy - minDy]);
  
  return result;
}
```

### 7.2 Absolute Placement
For anchor A = [x, y] and transformed normalized relCells T = [[dx, dy], ...], compute:
```javascript
absCells = T.map(([dx, dy]) => [x + dx, y + dy])
```

### 7.3 Legality Check
```javascript
function isLegalPlacement(board, transformedCells, anchor) {
  const [anchorX, anchorY] = anchor;
  
  for (const [dx, dy] of transformedCells) {
    const x = anchorX + dx;
    const y = anchorY + dy;
    
    // Check bounds
    if (x < 0 || x >= board.cols || y < 0 || y >= board.rows) {
      return false;
    }
    
    // Check overlap
    if (board.grid[y][x] !== 0) {
      return false;
    }
  }
  
  return true;
}
```

### 7.4 Precomputation
For each piece id, precompute the set of unique transformed shapes (up to 8 but often fewer due to symmetry). Cache as arrays of relCells to accelerate brute-force search.

## 8. Draft Engine

### 8.1 Core Operations
```javascript
function canAfford(player, pieceId) {
  return player.budget >= getPieceCost(pieceId);
}

function inStock(stock, pieceId) {
  return stock[pieceId] > 0 || stock[pieceId] === -1;
}

function buyPiece(gameState, playerId, pieceId) {
  const player = gameState.players[playerId];
  const cost = getPieceCost(pieceId);
  
  // Validate purchase
  if (!canAfford(player, pieceId) || !inStock(gameState.stock, pieceId)) {
    throw new Error("Invalid purchase");
  }
  
  // Execute purchase
  player.budget -= cost;
  if (gameState.stock[pieceId] !== -1) {
    gameState.stock[pieceId] -= 1;
  }
  player.arsenal[pieceId] = (player.arsenal[pieceId] || 0) + 1;
  
  // Reset pass flags
  gameState.draftState.player1Passed = false;
  gameState.draftState.player2Passed = false;
  gameState.draftState.consecutivePasses = 0;
  
  return gameState;
}

function passDraft(gameState, playerId) {
  if (playerId === 1) {
    gameState.draftState.player1Passed = true;
  } else {
    gameState.draftState.player2Passed = true;
  }
  
  if (gameState.draftState.player1Passed && gameState.draftState.player2Passed) {
    gameState.draftState.consecutivePasses = 2;
  } else {
    gameState.draftState.consecutivePasses = 1;
  }
  
  return gameState;
}
```

### 8.2 Draft End Condition
```javascript
function isDraftOver(gameState) {
  const { draftState, players, stock } = gameState;
  
  // Both players have consecutively passed
  if (draftState.consecutivePasses >= 2) {
    return true;
  }
  
  // No player can afford any remaining stock
  const canBuyAny = [1, 2].some(playerId => {
    return Object.keys(stock).some(pieceId => 
      stock[pieceId] > 0 && 
      players[playerId].budget >= getPieceCost(pieceId)
    );
  });
  
  return !canBuyAny;
}
```

## 9. Placement Engine

### 9.1 Legal Move Detection
```javascript
function hasLegalMove(gameState, playerId) {
  const arsenal = gameState.players[playerId].arsenal;
  
  for (const [pieceId, quantity] of Object.entries(arsenal)) {
    if (quantity === 0) continue;
    
    const transforms = getUniqueTransforms(pieceId);
    for (const transform of transforms) {
      const transformedCells = applyTransform(getPiece(pieceId).relCells, transform);
      const bounds = getBounds(transformedCells);
      
      // Optimize anchor iteration using bounds
      const maxX = gameState.board.cols - bounds.width;
      const maxY = gameState.board.rows - bounds.height;
      
      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
          if (isLegalPlacement(gameState.board, transformedCells, [x, y])) {
            return true;  // Early exit on first legal move
          }
        }
      }
    }
  }
  
  return false;
}

function getBounds(transformedCells) {
  const maxDx = Math.max(...transformedCells.map(([dx, dy]) => dx));
  const maxDy = Math.max(...transformedCells.map(([dx, dy]) => dy));
  return { width: maxDx + 1, height: maxDy + 1 };
}
```

### 9.2 Turn Resolution
```javascript
function startTurn(gameState) {
  if (!hasLegalMove(gameState, gameState.currentPlayer)) {
    gameState.winner = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.phase = "GAME_OVER";
  }
  return gameState;
}

function commitMove(gameState, move) {
  // Validate move
  if (!isValidMove(gameState, move)) {
    throw new Error("Invalid move");
  }
  
  // Apply to board
  for (const [x, y] of move.absCells) {
    gameState.board.grid[y][x] = move.player;
  }
  
  // Remove from arsenal
  const arsenal = gameState.players[move.player].arsenal;
  arsenal[move.pieceId] -= 1;
  if (arsenal[move.pieceId] === 0) {
    delete arsenal[move.pieceId];
  }
  
  // Record in history
  gameState.history.push(move);
  
  // Switch turns
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  
  return gameState;
}
```

## 10. User Interface and Interaction

### 10.1 Screens
- **Main Menu**
  - New Local Game
  - Options (board size, stock mode, allow tetrominoes/pentominoes)

- **Draft Screen**
  - Left/right columns: Player 1 and Player 2 budget and arsenal lists
  - Center: stock gallery with piece tiles showing id, size, cost, remaining count
  - Interaction: click a stock tile to buy; pass button to pass. Hover shows larger preview
  - Turn indicator bar at top

- **Game Screen**
  - Center: Board canvas with grid lines
  - Top: Turn banner ("Player 1's turn")
  - Bottom/side panels: Player arsenals as draggable tokens
  - Controls: click a token to enter DRAG_PREVIEW; mouse moves ghost overlay; R = rotate 90°, F = flip; Esc/right-click cancels; left click commits if valid; invalid preview shows red overlay

- **Game Over Screen**
  - Winner announcement, move log, restart button

### 10.2 Visuals
- Grid lines subtle; hover ghost uses semi-transparent color; illegal cells tinted red; legal cells tinted green
- Player 1 color default #33CCFF; Player 2 color default #FF9933

### 10.3 Accessibility
- Keyboard support for selection and placement via arrow keys to move anchor, R/F to rotate/flip, Enter to commit, Esc to cancel
- High-contrast mode: increase line thickness and saturation
- Screen reader labels on buttons; ARIA roles for web frontends
- Color-blind safe palette option

## 11. Configuration Defaults
- Board: R = 14, C = 14 (n = 196)
- Budget: B = (196 // 2) + 1 = 99
- Stock mode: singleton
- Allowed sets: tetrominoes = true, pentominoes = true
- AI: disabled by default (local hotseat); optional simple AI provided

## 12. AI Opponent (Optional Module)

### 12.1 Heuristic Scoring
```javascript
function calculateMobility(gameState, playerId, maxChecks = 50) {
  let count = 0;
  const arsenal = gameState.players[playerId].arsenal;
  
  for (const [pieceId, quantity] of Object.entries(arsenal)) {
    if (quantity === 0) continue;
    
    const transforms = getUniqueTransforms(pieceId);
    for (const transform of transforms) {
      const transformedCells = applyTransform(getPiece(pieceId).relCells, transform);
      const bounds = getBounds(transformedCells);
      
      for (let y = 0; y <= gameState.board.rows - bounds.height; y++) {
        for (let x = 0; x <= gameState.board.cols - bounds.width; x++) {
          if (count >= maxChecks) return count;
          
          if (isLegalPlacement(gameState.board, transformedCells, [x, y])) {
            count++;
          }
        }
      }
    }
  }
  
  return count;
}

function scoreMove(gameState, move) {
  const testState = applyMoveToState(gameState, move);
  const selfMobility = calculateMobility(testState, move.player);
  const opponentMobility = calculateMobility(testState, 3 - move.player);
  
  const centerDistance = getCenterDistance(move.absCells, gameState.board);
  
  return 2 * selfMobility - opponentMobility - centerDistance * 0.1;
}
```

### 12.2 Move Selection
```javascript
function selectAIMove(gameState) {
  const moves = enumerateLegalMoves(gameState, gameState.currentPlayer);
  
  if (moves.length === 0) {
    return null; // No legal moves
  }
  
  // Score all moves
  const scoredMoves = moves.map(move => ({
    move,
    score: scoreMove(gameState, move)
  }));
  
  // Sort by score (descending), then by deterministic tie-breakers
  scoredMoves.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.move.pieceId !== b.move.pieceId) return a.move.pieceId.localeCompare(b.move.pieceId);
    if (a.move.transform.rot !== b.move.transform.rot) return a.move.transform.rot - b.move.transform.rot;
    if (a.move.transform.flipX !== b.move.transform.flipX) return a.move.transform.flipX ? 1 : -1;
    const [ax, ay] = a.move.anchor;
    const [bx, by] = b.move.anchor;
    if (ay !== by) return ay - by;
    return ax - bx;
  });
  
  return scoredMoves[0].move;
}
```

## 13. Input Validation

### 13.1 Validation Service
```javascript
class ValidationService {
  static validateCoordinate(coord, maxX, maxY) {
    const [x, y] = coord;
    return Number.isInteger(x) && Number.isInteger(y) && 
           x >= 0 && x < maxX && y >= 0 && y < maxY;
  }
  
  static validatePieceId(pieceId, pieceLibrary) {
    return typeof pieceId === 'string' && pieceLibrary.has(pieceId);
  }
  
  static validateTransform(transform) {
    return [0, 90, 180, 270].includes(transform.rot) && 
           typeof transform.flipX === 'boolean';
  }
  
  static validateMove(move, gameState) {
    return this.validatePieceId(move.pieceId, getPieceLibrary()) &&
           this.validateTransform(move.transform) &&
           this.validateCoordinate(move.anchor, 
             gameState.board.cols, gameState.board.rows) &&
           gameState.players[move.player].arsenal[move.pieceId] > 0;
  }
  
  static validateGameState(gameState) {
    // Comprehensive state validation
    const requiredFields = ['version', 'phase', 'board', 'players', 'stock', 'currentPlayer'];
    for (const field of requiredFields) {
      if (!(field in gameState)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate board dimensions
    if (gameState.board.rows < 1 || gameState.board.cols < 1) {
      throw new Error("Invalid board dimensions");
    }
    
    // Validate grid consistency
    if (gameState.board.grid.length !== gameState.board.rows) {
      throw new Error("Grid height mismatch");
    }
    
    for (const row of gameState.board.grid) {
      if (row.length !== gameState.board.cols) {
        throw new Error("Grid width mismatch");
      }
    }
    
    return true;
  }
}
```

## 14. Persistence and Undo

### 14.1 Save/Load
```javascript
function saveGame(gameState) {
  ValidationService.validateGameState(gameState);
  return JSON.stringify(gameState);
}

function loadGame(jsonString) {
  try {
    const gameState = JSON.parse(jsonString);
    
    // Version migration if needed
    if (gameState.version === "1.1") {
      gameState = migrateFromV11(gameState);
    }
    
    ValidationService.validateGameState(gameState);
    return gameState;
  } catch (error) {
    throw new Error(`Failed to load game: ${error.message}`);
  }
}

function migrateFromV11(oldState) {
  // Convert arsenal from array to object format
  const newState = { ...oldState };
  newState.version = "1.2";
  
  for (const playerId of [1, 2]) {
    const player = newState.players[playerId];
    if (Array.isArray(player.arsenal)) {
      const newArsenal = {};
      for (const pieceId of player.arsenal) {
        newArsenal[pieceId] = (newArsenal[pieceId] || 0) + 1;
      }
      player.arsenal = newArsenal;
    }
  }
  
  // Add draft state if missing
  if (!newState.draftState) {
    newState.draftState = {
      player1Passed: false,
      player2Passed: false,
      consecutivePasses: 0
    };
  }
  
  return newState;
}
```

## 15. Error Handling

### 15.1 Error Types
```javascript
class SumZeroError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class InvalidMoveError extends SumZeroError {
  constructor(reason) {
    super(`Invalid move: ${reason}`, 'INVALID_MOVE');
  }
}

class InvalidPurchaseError extends SumZeroError {
  constructor(reason) {
    super(`Invalid purchase: ${reason}`, 'INVALID_PURCHASE');
  }
}

class GameStateError extends SumZeroError {
  constructor(reason) {
    super(`Invalid game state: ${reason}`, 'INVALID_STATE');
  }
}
```

### 15.2 Error Messages for UI
```javascript
const ERROR_MESSAGES = {
  'buy.insufficient_budget': 'Not enough budget to purchase this piece',
  'buy.out_of_stock': 'This piece is no longer available',
  'place.out_of_bounds': 'Piece extends outside the board',
  'place.overlap': 'Piece overlaps with existing pieces',
  'place.no_piece_selected': 'Please select a piece from your arsenal',
  'save.corrupted': 'Save file is corrupted or invalid',
  'load.version_unsupported': 'Save file version is not supported'
};
```

## 16. Performance Optimizations

### 16.1 Precomputed Transforms
```javascript
class PieceLibrary {
  constructor() {
    this.pieces = new Map();
    this.transformCache = new Map();
    this.initializePieces();
  }
  
  initializePieces() {
    // Initialize all tetrominoes and pentominoes
    for (const [id, relCells] of Object.entries({...TETROMINOES, ...PENTOMINOES})) {
      this.pieces.set(id, {
        id,
        size: relCells.length,
        cost: relCells.length,
        relCells
      });
      
      // Precompute unique transforms
      this.transformCache.set(id, this.computeUniqueTransforms(relCells));
    }
  }
  
  computeUniqueTransforms(relCells) {
    const transforms = [];
    const seen = new Set();
    
    for (const rot of [0, 90, 180, 270]) {
      for (const flipX of [false, true]) {
        const transformed = applyTransform(relCells, { rot, flipX });
        const key = JSON.stringify(transformed.sort());
        
        if (!seen.has(key)) {
          seen.add(key);
          transforms.push({ transform: { rot, flipX }, cells: transformed });
        }
      }
    }
    
    return transforms;
  }
  
  getUniqueTransforms(pieceId) {
    return this.transformCache.get(pieceId) || [];
  }
}
```

### 16.2 Optimized Move Enumeration
```javascript
function enumerateLegalMoves(gameState, playerId, maxMoves = 1000) {
  const moves = [];
  const arsenal = gameState.players[playerId].arsenal;
  
  for (const [pieceId, quantity] of Object.entries(arsenal)) {
    if (quantity === 0 || moves.length >= maxMoves) continue;
    
    const transforms = pieceLibrary.getUniqueTransforms(pieceId);
    
    for (const { transform, cells } of transforms) {
      if (moves.length >= maxMoves) break;
      
      const bounds = getBounds(cells);
      const maxX = gameState.board.cols - bounds.width;
      const maxY = gameState.board.rows - bounds.height;
      
      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= maxX; x++) {
          if (moves.length >= maxMoves) break;
          
          if (isLegalPlacement(gameState.board, cells, [x, y])) {
            const absCells = cells.map(([dx, dy]) => [x + dx, y + dy]);
            moves.push({
              player: playerId,
              pieceId,
              transform,
              anchor: [x, y],
              absCells
            });
          }
        }
      }
    }
  }
  
  return moves;
}
```

## 17. Testing Strategy

### 17.1 Unit Tests
```javascript
describe('Geometry and Transformations', () => {
  test('transform normalization is idempotent', () => {
    const piece = [[1,1],[2,1],[1,2],[2,2]]; // O4 offset
    const normalized = applyTransform(piece, { rot: 0, flipX: false });
    const renormalized = applyTransform(normalized, { rot: 0, flipX: false });
    expect(normalized).toEqual(renormalized);
    expect(normalized[0]).toEqual([0,0]); // Should start at origin
  });
  
  test('rotation round-trip returns to original', () => {
    const piece = [[0,0],[1,0],[2,0],[1,1]]; // T4
    let result = piece;
    for (let i = 0; i < 4; i++) {
      result = applyTransform(result, { rot: 90, flipX: false });
    }
    expect(result).toEqual(piece);
  });
  
  test('flip twice returns to original', () => {
    const piece = [[0,0],[1,0],[2,0],[1,1]]; // T4
    let result = applyTransform(piece, { rot: 0, flipX: true });
    result = applyTransform(result, { rot: 0, flipX: true });
    expect(result).toEqual(piece);
  });
  
  test('unique transforms count is correct', () => {
    const library = new PieceLibrary();
    expect(library.getUniqueTransforms('O4')).toHaveLength(1); // Square has 1 unique form
    expect(library.getUniqueTransforms('I4')).toHaveLength(2); // Line has 2 unique forms
    expect(library.getUniqueTransforms('T4')).toHaveLength(4); // T has 4 unique forms
  });
});

describe('Placement Legality', () => {
  test('rejects out-of-bounds placement', () => {
    const board = createEmptyBoard(5, 5);
    const piece = [[0,0],[1,0],[2,0],[3,0]]; // I4
    expect(isLegalPlacement(board, piece, [2, 0])).toBe(false); // Extends right
    expect(isLegalPlacement(board, piece, [0, 2])).toBe(true);  // Fits vertically
  });
  
  test('rejects overlapping placement', () => {
    const board = createEmptyBoard(5, 5);
    board.grid[1][1] = 1; // Player 1 occupies [1,1]
    
    const piece = [[0,0],[1,0],[0,1],[1,1]]; // O4
    expect(isLegalPlacement(board, piece, [0, 0])).toBe(false); // Overlaps at [1,1]
    expect(isLegalPlacement(board, piece, [2, 0])).toBe(true);  // No overlap
  });
  
  test('accepts valid placement', () => {
    const board = createEmptyBoard(10, 10);
    const piece = [[0,0],[1,0],[2,0],[1,1]]; // T4
    expect(isLegalPlacement(board, piece, [3, 3])).toBe(true);
  });
});

describe('Draft Engine', () => {
  test('budget arithmetic is correct', () => {
    const gameState = createNewGame(8, 8); // 64 cells
    expect(gameState.players[1].budget).toBe(33); // (64//2)+1 = 33
    expect(gameState.players[2].budget).toBe(33);
  });
  
  test('stock depletion works', () => {
    const gameState = createNewGame(8, 8);
    gameState.stock['T4'] = 1;
    
    buyPiece(gameState, 1, 'T4');
    expect(gameState.stock['T4']).toBe(0);
    expect(gameState.players[1].arsenal['T4']).toBe(1);
    expect(gameState.players[1].budget).toBe(29); // 33-4
  });
  
  test('draft ends when both players pass', () => {
    const gameState = createNewGame(8, 8);
    passDraft(gameState, 1);
    expect(isDraftOver(gameState)).toBe(false);
    
    passDraft(gameState, 2);
    expect(isDraftOver(gameState)).toBe(true);
  });
  
  test('draft ends when no affordable pieces remain', () => {
    const gameState = createNewGame(8, 8);
    gameState.players[1].budget = 3;
    gameState.players[2].budget = 3;
    // All pieces cost 4 or 5, so no one can buy
    expect(isDraftOver(gameState)).toBe(true);
  });
});

describe('Game Logic', () => {
  test('detects loss condition correctly', () => {
    const gameState = createNewGame(3, 3); // Very small board
    // Fill most of the board
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 2; x++) {
        gameState.board.grid[y][x] = 1;
      }
    }
    
    // Give player 2 a piece that cannot fit
    gameState.players[2].arsenal = { 'I4': 1 };
    gameState.currentPlayer = 2;
    
    expect(hasLegalMove(gameState, 2)).toBe(false);
  });
  
  test('move commit updates board and arsenal', () => {
    const gameState = createNewGame(10, 10);
    gameState.players[1].arsenal = { 'O4': 1 };
    
    const move = {
      player: 1,
      pieceId: 'O4',
      transform: { rot: 0, flipX: false },
      anchor: [3, 3],
      absCells: [[3,3],[4,3],[3,4],[4,4]]
    };
    
    commitMove(gameState, move);
    
    expect(gameState.board.grid[3][3]).toBe(1);
    expect(gameState.board.grid[4][3]).toBe(1);
    expect(gameState.board.grid[3][4]).toBe(1);
    expect(gameState.board.grid[4][4]).toBe(1);
    expect(gameState.players[1].arsenal['O4']).toBe(0);
    expect(gameState.history).toHaveLength(1);
  });
});
```

### 17.2 Property-Based Tests
```javascript
describe('Property Tests', () => {
  test('legal placement never accepts invalid moves', () => {
    fc.assert(fc.property(
      fc.integer(5, 20), // board width
      fc.integer(5, 20), // board height
      fc.constantFrom(...Object.keys(TETROMINOES)), // piece
      fc.integer(0, 3).map(x => x * 90), // rotation
      fc.boolean(), // flip
      fc.integer(0, 50), // anchor x
      fc.integer(0, 50), // anchor y
      (width, height, pieceId, rot, flipX, anchorX, anchorY) => {
        const board = createEmptyBoard(width, height);
        const piece = applyTransform(TETROMINOES[pieceId], { rot, flipX });
        
        const isLegal = isLegalPlacement(board, piece, [anchorX, anchorY]);
        
        if (isLegal) {
          // If marked as legal, verify all cells are actually within bounds and empty
          for (const [dx, dy] of piece) {
            const x = anchorX + dx;
            const y = anchorY + dy;
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThan(height);
            expect(board.grid[y][x]).toBe(0);
          }
        }
      }
    ));
  });
  
  test('serialization round-trip preserves state', () => {
    fc.assert(fc.property(
      fc.integer(6, 20), // board size
      fc.array(fc.constantFrom(...Object.keys({...TETROMINOES, ...PENTOMINOES})), 0, 20), // moves
      (boardSize, pieceIds) => {
        let gameState = createNewGame(boardSize, boardSize);
        
        // Simulate some draft purchases
        for (let i = 0; i < Math.min(pieceIds.length, 10); i++) {
          const pieceId = pieceIds[i];
          const player = (i % 2) + 1;
          if (gameState.players[player].budget >= getPieceCost(pieceId) && 
              gameState.stock[pieceId] > 0) {
            buyPiece(gameState, player, pieceId);
          }
        }
        
        const serialized = saveGame(gameState);
        const loaded = loadGame(serialized);
        
        expect(loaded).toEqual(gameState);
      }
    ));
  });
});
```

### 17.3 Integration Tests
```javascript
describe('Full Game Integration', () => {
  test('complete game scenario - Player 1 wins', async () => {
    const gameState = createNewGame(8, 8);
    
    // Draft phase
    buyPiece(gameState, 1, 'I4');
    buyPiece(gameState, 2, 'O4');
    buyPiece(gameState, 1, 'T4');
    buyPiece(gameState, 2, 'L4');
    
    passDraft(gameState, 1);
    passDraft(gameState, 2);
    
    expect(gameState.phase).toBe('DRAFT');
    expect(isDraftOver(gameState)).toBe(true);
    
    // Transition to placement
    gameState.phase = 'PLACEMENT';
    gameState.currentPlayer = 1;
    
    // Player 1 plays I4
    const move1 = {
      player: 1,
      pieceId: 'I4',
      transform: { rot: 0, flipX: false },
      anchor: [2, 2],
      absCells: [[2,2],[3,2],[4,2],[5,2]]
    };
    commitMove(gameState, move1);
    expect(gameState.currentPlayer).toBe(2);
    
    // Player 2 plays O4
    const move2 = {
      player: 2,
      pieceId: 'O4',
      transform: { rot: 0, flipX: false },
      anchor: [0, 0],
      absCells: [[0,0],[1,0],[0,1],[1,1]]
    };
    commitMove(gameState, move2);
    expect(gameState.currentPlayer).toBe(1);
    
    // Continue until one player cannot move
    // ... (more moves as needed)
    
    expect(gameState.history.length).toBeGreaterThan(0);
  });
  
  test('AI vs AI deterministic game', () => {
    const gameState = createNewGame(10, 10);
    gameState.config.seed = 'test-seed-123';
    
    // Run draft with AI
    while (!isDraftOver(gameState)) {
      const move = selectAIDraftMove(gameState);
      if (move) {
        buyPiece(gameState, gameState.currentPlayer, move.pieceId);
      } else {
        passDraft(gameState, gameState.currentPlayer);
      }
      gameState.currentPlayer = (gameState.currentPlayer % 2) + 1;
    }
    
    // Run placement with AI
    gameState.phase = 'PLACEMENT';
    gameState.currentPlayer = 1;
    
    let turnCount = 0;
    while (gameState.phase === 'PLACEMENT' && turnCount < 100) {
      startTurn(gameState);
      if (gameState.phase === 'GAME_OVER') break;
      
      const move = selectAIMove(gameState);
      if (move) {
        commitMove(gameState, move);
      }
      turnCount++;
    }
    
    expect(gameState.phase).toBe('GAME_OVER');
    expect(gameState.winner).toBeOneOf([1, 2]);
    
    // Run same game again with same seed - should be identical
    const gameState2 = createNewGame(10, 10);
    gameState2.config.seed = 'test-seed-123';
    // ... (repeat same AI logic)
    // expect(gameState2.history).toEqual(gameState.history);
  });
});
```

### 17.4 Acceptance Tests
```javascript
describe('Acceptance Tests', () => {
  test('AT-01: Players can draft pieces on default board', () => {
    const gameState = createNewGame(14, 14);
    expect(gameState.players[1].budget).toBe(99);
    expect(gameState.players[2].budget).toBe(99);
    
    // Both players should be able to afford at least one piece
    const canP1Buy = Object.keys(gameState.stock).some(pieceId => 
      gameState.stock[pieceId] > 0 && gameState.players[1].budget >= getPieceCost(pieceId)
    );
    const canP2Buy = Object.keys(gameState.stock).some(pieceId => 
      gameState.stock[pieceId] > 0 && gameState.players[2].budget >= getPieceCost(pieceId)
    );
    
    expect(canP1Buy).toBe(true);
    expect(canP2Buy).toBe(true);
  });
  
  test('AT-02: Legal placement shows green, illegal shows red', () => {
    const gameState = createNewGame(10, 10);
    gameState.players[1].arsenal = { 'T4': 1 };
    
    const piece = applyTransform(TETROMINOES['T4'], { rot: 0, flipX: false });
    
    // Legal placement
    expect(isLegalPlacement(gameState.board, piece, [3, 3])).toBe(true);
    
    // Illegal placement (out of bounds)
    expect(isLegalPlacement(gameState.board, piece, [8, 8])).toBe(false);
    
    // Block one cell and test overlap
    gameState.board.grid[3][4] = 2;
    expect(isLegalPlacement(gameState.board, piece, [3, 3])).toBe(false);
  });
  
  test('AT-03: No legal moves ends game with opponent victory', () => {
    const gameState = createNewGame(4, 4);
    
    // Fill board except for 3 cells
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (!(x === 3 && y === 3) && !(x === 2 && y === 3) && !(x === 1 && y === 3)) {
          gameState.board.grid[y][x] = 1;
        }
      }
    }
    
    // Give Player 2 a piece that needs 4 cells
    gameState.players[2].arsenal = { 'I4': 1 };
    gameState.currentPlayer = 2;
    gameState.phase = 'PLACEMENT';
    
    startTurn(gameState);
    
    expect(gameState.phase).toBe('GAME_OVER');
    expect(gameState.winner).toBe(1); // Player 1 wins because Player 2 cannot move
  });
  
  test('AT-04: Budget calculation is correct for any board size', () => {
    const testCases = [
      { r: 6, c: 6, expected: 19 },   // (36//2)+1 = 19
      { r: 8, c: 8, expected: 33 },   // (64//2)+1 = 33
      { r: 10, c: 12, expected: 61 }, // (120//2)+1 = 61
      { r: 14, c: 14, expected: 99 }  // (196//2)+1 = 99
    ];
    
    for (const { r, c, expected } of testCases) {
      const gameState = createNewGame(r, c);
      expect(gameState.players[1].budget).toBe(expected);
      expect(gameState.players[2].budget).toBe(expected);
    }
  });
  
  test('AT-05: Transform round-trip consistency', () => {
    for (const [pieceId, relCells] of Object.entries({...TETROMINOES, ...PENTOMINOES})) {
      const library = new PieceLibrary();
      const transforms = library.getUniqueTransforms(pieceId);
      
      // Each transform should be stable under re-application
      for (const { transform, cells } of transforms) {
        const reapplied = applyTransform(cells, transform);
        expect(reapplied).toEqual(cells);
      }
      
      // Number of unique transforms should be reasonable (1-8)
      expect(transforms.length).toBeGreaterThanOrEqual(1);
      expect(transforms.length).toBeLessThanOrEqual(8);
    }
  });
  
  test('AT-06: Arsenal management with duplicates', () => {
    const gameState = createNewGame(10, 10);
    gameState.config.stockMode = 'unlimited';
    
    // Buy same piece multiple times
    buyPiece(gameState, 1, 'T4');
    buyPiece(gameState, 1, 'T4');
    
    expect(gameState.players[1].arsenal['T4']).toBe(2);
    expect(gameState.players[1].budget).toBe(91); // 99 - 4 - 4
    
    // Use one copy
    const move = {
      player: 1,
      pieceId: 'T4',
      transform: { rot: 0, flipX: false },
      anchor: [3, 3],
      absCells: [[3,3],[4,3],[5,3],[4,4]]
    };
    commitMove(gameState, move);
    
    expect(gameState.players[1].arsenal['T4']).toBe(1);
  });
  
  test('AT-07: All draft end conditions work', () => {
    // Both players pass
    let gameState = createNewGame(8, 8);
    passDraft(gameState, 1);
    passDraft(gameState, 2);
    expect(isDraftOver(gameState)).toBe(true);
    
    // No budget remaining
    gameState = createNewGame(8, 8);
    gameState.players[1].budget = 0;
    gameState.players[2].budget = 0;
    expect(isDraftOver(gameState)).toBe(true);
    
    // No stock remaining (singleton mode)
    gameState = createNewGame(8, 8);
    for (const pieceId of Object.keys(gameState.stock)) {
      gameState.stock[pieceId] = 0;
    }
    expect(isDraftOver(gameState)).toBe(true);
  });
  
  test('AT-08: AI terminates in reasonable time', () => {
    const gameState = createNewGame(12, 12);
    gameState.players[1].arsenal = { 'I4': 3, 'T4': 2, 'L4': 1 };
    
    const startTime = Date.now();
    const move = selectAIMove(gameState);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(move).toBeTruthy();
    expect(ValidationService.validateMove(move, gameState)).toBe(true);
  });
});
```

## 18. Reference APIs

### 18.1 Core Services
```javascript
class PieceLibrary {
  list() { /* Returns array of all PieceDef */ }
  get(id) { /* Returns specific PieceDef */ }
  getUniqueTransforms(id) { /* Returns array of transformed relCells lists */ }
}

class DraftService {
  static canBuy(gameState, playerId, pieceId) { /* Returns boolean */ }
  static buy(gameState, playerId, pieceId) { /* Returns updated GameState */ }
  static pass(gameState, playerId) { /* Returns updated GameState */ }
  static isDraftOver(gameState) { /* Returns boolean */ }
}

class PlacementService {
  static isLegal(board, transformedCells, anchor) { /* Returns boolean */ }
  static enumerateLegal(gameState, playerId) { /* Returns generator of moves */ }
  static commit(gameState, move) { /* Returns updated GameState */ }
  static hasLegalMove(gameState, playerId) { /* Returns boolean */ }
}

class TurnService {
  static startTurn(gameState) { /* Checks loss condition, returns GameState */ }
  static endTurn(gameState) { /* Switches currentPlayer, returns GameState */ }
}

class GameService {
  static createNew(rows, cols, config) { /* Returns initial GameState */ }
  static save(gameState) { /* Returns JSON string */ }
  static load(jsonString) { /* Returns GameState */ }
}
```

## 19. UI Component Specifications

### 19.1 Draft Screen Components
```typescript
interface DraftScreenProps {
  gameState: GameState;
  onBuy: (playerId: PlayerId, pieceId: PieceId) => void;
  onPass: (playerId: PlayerId) => void;
}

interface StockTileProps {
  piece: PieceDef;
  count: number;
  canAfford: boolean;
  onClick: () => void;
}

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
}
```

### 19.2 Game Screen Components
```typescript
interface GameBoardProps {
  board: Board;
  previewMove?: Move;
  onCellClick: (cell: Cell) => void;
  onCellHover: (cell: Cell | null) => void;
}

interface ArsenalPanelProps {
  arsenal: Arsenal;
  selectedPiece?: PieceId;
  onPieceSelect: (pieceId: PieceId) => void;
}

interface PiecePreviewProps {
  pieceId: PieceId;
  transform: Transform;
  anchor: Cell;
  isValid: boolean;
}
```

### 19.3 Interaction State Machine
```javascript
const UI_STATES = {
  IDLE: 'idle',
  PIECE_SELECTED: 'piece_selected', 
  DRAGGING: 'dragging',
  PREVIEW: 'preview'
};

class GameController {
  constructor(gameState, uiCallbacks) {
    this.gameState = gameState;
    this.ui = uiCallbacks;
    this.uiState = UI_STATES.IDLE;
    this.selectedPiece = null;
    this.previewTransform = { rot: 0, flipX: false };
    this.previewAnchor = null;
  }
  
  handlePieceClick(pieceId) {
    if (this.gameState.phase !== 'PLACEMENT') return;
    
    this.selectedPiece = pieceId;
    this.uiState = UI_STATES.PIECE_SELECTED;
    this.ui.updatePieceSelection(pieceId);
  }
  
  handleBoardHover(cell) {
    if (this.uiState === UI_STATES.PIECE_SELECTED && this.selectedPiece) {
      this.previewAnchor = cell;
      this.uiState = UI_STATES.PREVIEW;
      
      const transformedCells = this.getTransformedCells();
      const isValid = isLegalPlacement(this.gameState.board, transformedCells, cell);
      
      this.ui.showPreview({
        pieceId: this.selectedPiece,
        transform: this.previewTransform,
        anchor: cell,
        isValid
      });
    }
  }
  
  handleBoardClick(cell) {
    if (this.uiState === UI_STATES.PREVIEW && this.selectedPiece) {
      const transformedCells = this.getTransformedCells();
      if (isLegalPlacement(this.gameState.board, transformedCells, cell)) {
        const move = this.createMove(cell);
        this.ui.commitMove(move);
        this.resetSelection();
      } else {
        this.ui.showError('Invalid placement');
      }
    }
  }
  
  handleKeyPress(key) {
    if (this.uiState === UI_STATES.PREVIEW) {
      switch (key) {
        case 'r':
        case 'R':
          this.previewTransform.rot = (this.previewTransform.rot + 90) % 360;
          this.handleBoardHover(this.previewAnchor);
          break;
        case 'f':
        case 'F':
          this.previewTransform.flipX = !this.previewTransform.flipX;
          this.handleBoardHover(this.previewAnchor);
          break;
        case 'Escape':
          this.resetSelection();
          break;
        case 'Enter':
          this.handleBoardClick(this.previewAnchor);
          break;
      }
    }
  }
  
  resetSelection() {
    this.selectedPiece = null;
    this.previewTransform = { rot: 0, flipX: false };
    this.previewAnchor = null;
    this.uiState = UI_STATES.IDLE;
    this.ui.clearPreview();
  }
}
```

## 20. Default Game Configuration

### 20.1 Standard Setup
```javascript
function createNewGame(rows = 14, cols = 14, options = {}) {
  const config = {
    stockMode: 'singleton',
    allowPentominoes: true,
    allowTetrominoes: true,
    seed: null,
    ui: { showGrid: true, showHoverPreview: true },
    ...options
  };
  
  const totalCells = rows * cols;
  const budget = Math.floor(totalCells / 2) + 1;
  
  const stock = {};
  if (config.allowTetrominoes) {
    for (const pieceId of Object.keys(TETROMINOES)) {
      stock[pieceId] = config.stockMode === 'singleton' ? 1 : -1;
    }
  }
  if (config.allowPentominoes) {
    for (const pieceId of Object.keys(PENTOMINOES)) {
      stock[pieceId] = config.stockMode === 'singleton' ? 1 : -1;
    }
  }
  
  return {
    version: "1.2",
    phase: "DRAFT",
    board: {
      rows,
      cols,
      grid: Array(rows).fill().map(() => Array(cols).fill(0))
    },
    players: {
      1: { id: 1, budget, color: "#33CCFF", arsenal: {} },
      2: { id: 2, budget, color: "#FF9933", arsenal: {} }
    },
    stock,
    currentPlayer: 1,
    draftState: {
      player1Passed: false,
      player2Passed: false,
      consecutivePasses: 0
    },
    history: [],
    winner: null,
    config
  };
}
```

## 21. Internationalization

### 21.1 Message Keys
```javascript
const I18N_KEYS = {
  // Game phases
  'phase.draft': 'Draft Phase',
  'phase.placement': 'Placement Phase', 
  'phase.game_over': 'Game Over',
  
  // Player actions
  'action.buy': 'Buy',
  'action.pass': 'Pass',
  'action.rotate': 'Rotate (R)',
  'action.flip': 'Flip (F)',
  'action.cancel': 'Cancel (Esc)',
  'action.confirm': 'Confirm (Enter)',
  
  // Turn indicators
  'turn.player1': "Player 1's Turn",
  'turn.player2': "Player 2's Turn",
  'turn.draft': 'Draft Turn: Player {player}',
  
  // Game results
  'result.winner': 'Player {player} Wins!',
  'result.reason.no_moves': 'Opponent has no legal moves',
  
  // Errors
  'error.buy.insufficient_budget': 'Not enough budget to purchase this piece',
  'error.buy.out_of_stock': 'This piece is no longer available',
  'error.place.out_of_bounds': 'Piece extends outside the board',
  'error.place.overlap': 'Piece overlaps with existing pieces',
  'error.place.no_piece_selected': 'Please select a piece from your arsenal',
  'error.save.corrupted': 'Save file is corrupted or invalid',
  'error.load.version_unsupported': 'Save file version is not supported',
  
  // UI labels
  'ui.budget': 'Budget: {amount}',
  'ui.stock_count': '{count} remaining',
  'ui.piece_cost': 'Cost: {cost}',
  'ui.arsenal_empty': 'No pieces available',
  'ui.game_controls': 'Game Controls',
  'ui.settings': 'Settings',
  'ui.new_game': 'New Game',
  'ui.save_game': 'Save Game',
  'ui.load_game': 'Load Game'
};

// Resource files would be:
// en.json, de.json, fr.json, etc.
const MESSAGES_DE = {
  'phase.draft': 'Draft-Phase',
  'phase.placement': 'Platzierungs-Phase',
  'turn.player1': 'Spieler 1 ist dran',
  'error.buy.insufficient_budget': 'Nicht genügend Budget für dieses Teil',
  // ... etc
};
```

## 22. Development Roadmap

### 22.1 Implementation Milestones

**Milestone 1: Core Geometry (Week 1)**
- [ ] Implement PieceDef and transformation algorithms
- [ ] Create PieceLibrary with precomputed unique transforms  
- [ ] Implement Board and basic legality checks
- [ ] Unit tests for geometry and transformations
- [ ] Acceptance test AT-05 (transform consistency)

**Milestone 2: Draft System (Week 2)**
- [ ] Implement budget calculation and stock management
- [ ] Create DraftService with buy/pass/end logic
- [ ] Build basic draft UI or CLI for testing
- [ ] Unit tests for draft engine
- [ ] Acceptance tests AT-01, AT-04, AT-06, AT-07

**Milestone 3: Placement Engine (Week 3)**
- [ ] Implement PlacementService with legal move detection
- [ ] Create turn management and loss condition checking
- [ ] Build basic placement UI with piece selection and preview
- [ ] Optimize move enumeration with bounding boxes
- [ ] Acceptance tests AT-02, AT-03

**Milestone 4: Game State Management (Week 4)**
- [ ] Implement complete GameState model with validation
- [ ] Create save/load functionality with version migration
- [ ] Build game controller for UI state management
- [ ] Add comprehensive error handling and user feedback
- [ ] Integration tests for full game scenarios

**Milestone 5: User Interface (Week 5-6)**
- [ ] Create responsive draft screen with piece gallery
- [ ] Build interactive game board with drag-and-drop
- [ ] Implement keyboard controls and accessibility features
- [ ] Add visual feedback for legal/illegal placements
- [ ] Create game over screen with replay functionality

**Milestone 6: AI Opponent (Week 7)**
- [ ] Implement mobility-based heuristic with performance limits
- [ ] Create deterministic move selection with tie-breaking
- [ ] Add AI difficulty levels and time controls
- [ ] Acceptance test AT-08 (AI performance)
- [ ] AI vs AI regression testing

**Milestone 7: Polish and Deployment (Week 8)**
- [ ] Add internationalization support
- [ ] Implement high-contrast and accessibility modes
- [ ] Create comprehensive help system and tutorials
- [ ] Performance optimization and memory management
- [ ] Package as web app with PWA features

### 22.2 Critical Path Dependencies
```
Geometry → Draft → Placement → State Management → UI → AI → Deployment
     ↓         ↓         ↓            ↓        ↓    ↓        ↓
   Tests → Tests → Tests → Tests → Tests → Tests → Final QA
```

## 23. Architecture Guidelines

### 23.1 Module Structure
```
src/
├── core/
│   ├── geometry/          # Coordinate systems, transformations
│   ├── pieces/           # Piece definitions and library
│   ├── board/            # Board representation and operations
│   ├── draft/            # Draft phase logic
│   ├── placement/        # Placement phase logic
│   └── game/             # Game state management
├── ai/
│   ├── heuristics/       # Scoring functions
│   ├── search/           # Move enumeration and selection
│   └── difficulty/       # AI difficulty levels
├── ui/
│   ├── components/       # React components
│   ├── controllers/      # UI state management
│   ├── styles/           # CSS modules
│   └── assets/           # Images, icons, sounds
├── services/
│   ├── persistence/      # Save/load functionality
│   ├── validation/       # Input validation
│   ├── i18n/            # Internationalization
│   └── analytics/        # Optional usage tracking
└── utils/
    ├── constants/        # Game constants
    ├── helpers/          # Utility functions
    └── testing/          # Test utilities
```

### 23.2 Design Patterns

**State Management:**
- Use immutable updates for GameState
- Implement Command pattern for moves and undo
- Repository pattern for persistence

**Error Handling:**
- Custom error types with codes
- Graceful degradation for non-critical features
- User-friendly error messages with suggestions

**Performance:**
- Lazy loading for UI components
- Memoization for expensive computations (transforms, legal moves)
- Web Workers for AI computation (optional)

## 24. Quality Assurance

### 24.1 Code Quality Standards
```javascript
// ESLint configuration
module.exports = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: {
    'no-magic-numbers': ['error', { ignore: [0, 1, 2, 90, 180, 270] }],
    'max-complexity': ['error', 10],
    'max-lines-per-function': ['error', 50],
    'prefer-const': 'error',
    'no-var': 'error'
  }
};

// Jest test coverage requirements
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/ui/**/*' // UI components tested separately
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### 24.2 Performance Benchmarks
```javascript
// Performance test suite
describe('Performance Benchmarks', () => {
  test('legal move enumeration completes within time limit', () => {
    const gameState = createWorstCaseScenario(); // Nearly full board
    
    const start = performance.now();
    const moves = enumerateLegalMoves(gameState, 1, 1000);
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(100); // 100ms limit
    expect(moves.length).toBeGreaterThan(0);
  });
  
  test('AI move selection scales linearly', () => {
    const sizes = [8, 10, 12, 14];
    const times = [];
    
    for (const size of sizes) {
      const gameState = createMidGameScenario(size, size);
      
      const start = performance.now();
      selectAIMove(gameState);
      const elapsed = performance.now() - start;
      
      times.push(elapsed);
    }
    
    // Verify roughly linear scaling (not exponential)
    const ratio = times[3] / times[0]; // 14x14 vs 8x8
    expect(ratio).toBeLessThan(5); // Should be less than 5x slower
  });
  
  test('memory usage remains bounded', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate 100 games
    for (let i = 0; i < 100; i++) {
      const gameState = createNewGame(12, 12);
      simulateRandomGame(gameState);
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 25. Security Considerations

### 25.1 Input Sanitization
```javascript
class SecurityService {
  static sanitizeGameState(untrustedState) {
    // Validate all numeric values
    const sanitized = { ...untrustedState };
    
    // Sanitize board dimensions
    sanitized.board.rows = Math.max(1, Math.min(50, parseInt(sanitized.board.rows)));
    sanitized.board.cols = Math.max(1, Math.min(50, parseInt(sanitized.board.cols)));
    
    // Validate grid contents
    for (let y = 0; y < sanitized.board.rows; y++) {
      for (let x = 0; x < sanitized.board.cols; x++) {
        const cell = sanitized.board.grid[y][x];
        if (![0, 1, 2].includes(cell)) {
          sanitized.board.grid[y][x] = 0;
        }
      }
    }
    
    // Sanitize player budgets
    for (const playerId of [1, 2]) {
      const budget = parseInt(sanitized.players[playerId].budget);
      sanitized.players[playerId].budget = Math.max(0, Math.min(1000, budget));
    }
    
    // Validate piece IDs in arsenals
    const validPieceIds = new Set([...Object.keys(TETROMINOES), ...Object.keys(PENTOMINOES)]);
    for (const playerId of [1, 2]) {
      const arsenal = sanitized.players[playerId].arsenal;
      for (const pieceId of Object.keys(arsenal)) {
        if (!validPieceIds.has(pieceId)) {
          delete arsenal[pieceId];
        } else {
          arsenal[pieceId] = Math.max(0, Math.min(10, parseInt(arsenal[pieceId])));
        }
      }
    }
    
    return sanitized;
  }
  
  static validateMoveIntegrity(move, gameState) {
    // Verify move is structurally valid
    if (!move.player || !move.pieceId || !move.anchor || !move.absCells) {
      throw new SecurityError('Invalid move structure');
    }
    
    // Verify player owns the piece
    const arsenal = gameState.players[move.player].arsenal;
    if (!arsenal[move.pieceId] || arsenal[move.pieceId] <= 0) {
      throw new SecurityError('Player does not own this piece');
    }
    
    // Verify absCells match expected transformation
    const expectedCells = calculateAbsCells(move.pieceId, move.transform, move.anchor);
    if (!arraysEqual(move.absCells.sort(), expectedCells.sort())) {
      throw new SecurityError('Move absCells do not match transformation');
    }
    
    return true;
  }
}

class SecurityError extends Error {
  constructor(message) {
    super(`Security violation: ${message}`);
    this.name = 'SecurityError';
  }
}
```

### 25.2 Rate Limiting (for online play)
```javascript
class RateLimiter {
  constructor(maxActions = 60, windowMs = 60000) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
    this.actions = new Map();
  }
  
  checkLimit(playerId) {
    const now = Date.now();
    const playerActions = this.actions.get(playerId) || [];
    
    // Remove actions outside the time window
    const validActions = playerActions.filter(time => now - time < this.windowMs);
    
    if (validActions.length >= this.maxActions) {
      throw new SecurityError(`Rate limit exceeded for player ${playerId}`);
    }
    
    validActions.push(now);
    this.actions.set(playerId, validActions);
    
    return true;
  }
}
```

## 26. Deployment and Distribution

### 26.1 Web App Build Configuration
```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        ai: {
          test: /[\\/]src[\\/]ai[\\/]/,
          name: 'ai',
          priority: 5
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'SumZero - Strategic Polyomino Game'
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [{
        urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
          }
        }
      }]
    })
  ]
};
```

### 26.2 Progressive Web App Manifest
```json
{
  "name": "SumZero - Strategic Polyomino Game",
  "short_name": "SumZero",
  "description": "A two-player strategy game with polyomino pieces",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["games", "strategy"],
  "screenshots": [
    {
      "src": "/screenshots/draft.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Draft phase gameplay"
    },
    {
      "src": "/screenshots/placement.png", 
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Placement phase gameplay"
    }
  ]
}
```

## 27. Documentation Requirements

### 27.1 API Documentation
All public functions must include JSDoc comments:

```javascript
/**
 * Applies a transformation to a piece's relative coordinates
 * @param {RelCell[]} relCells - Array of relative coordinates [[dx,dy], ...]
 * @param {Transform} transform - Transformation to apply {rot: 0|90|180|270, flipX: boolean}
 * @returns {RelCell[]} Normalized transformed coordinates
 * @throws {Error} If transform contains invalid rotation value
 * @example
 * const t4 = [[0,0],[1,0],[2,0],[1,1]];
 * const rotated = applyTransform(t4, {rot: 90, flipX: false});
 * // Returns [[0,0],[0,1],[0,2],[1,1]]
 */
function applyTransform(relCells, transform) {
  // Implementation...
}
```

### 27.2 User Documentation
Required documentation files:
- `README.md` - Project overview and quick start
- `RULES.md` - Complete game rules with examples
- `API.md` - Developer API reference
- `CONTRIBUTING.md` - Development setup and contribution guidelines
- `CHANGELOG.md` - Version history and changes

## 28. Final Implementation Checklist

### 28.1 Core Functionality
- [ ] All tetrominoes and pentominoes defined with correct coordinates
- [ ] Transformation algorithm handles all 8 orientations correctly
- [ ] Board bounds checking prevents out-of-bounds placements
- [ ] Overlap detection prevents pieces from occupying same cells
- [ ] Draft budget calculation: B = (R×C // 2) + 1
- [ ] Stock management supports both singleton and unlimited modes
- [ ] Draft ends correctly when both players pass or no purchases possible
- [ ] Turn loss detection when player has no legal moves
- [ ] Move history tracking for replay and undo
- [ ] Save/load preserves exact game state

### 28.2 User Interface
- [ ] Responsive design works on desktop and mobile
- [ ] Piece selection and placement with mouse/touch
- [ ] Keyboard controls: R (rotate), F (flip), Enter (confirm), Esc (cancel)
- [ ] Visual feedback: green for valid placement, red for invalid
- [ ] Turn indicators clearly show current player
- [ ] Budget and arsenal displays update in real-time
- [ ] Game over screen shows winner and final state
- [ ] Accessibility: screen reader support, high contrast mode

### 28.3 Performance and Quality
- [ ] Legal move enumeration completes within 100ms
- [ ] AI move selection completes within 1000ms
- [ ] Memory usage remains bounded during extended play
- [ ] Input validation prevents crashes from malformed data
- [ ] Error messages are user-friendly and actionable
- [ ] Code coverage >90% for core game logic
- [ ] All acceptance tests (AT-01 through AT-08) pass
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### 28.4 Optional Features
- [ ] AI opponent with multiple difficulty levels
- [ ] Online multiplayer support (future enhancement)
- [ ] Tournament mode with multiple game formats
- [ ] Custom board sizes and piece sets
- [ ] Replay system with move-by-move playback
- [ ] Statistics tracking and player profiles
- [ ] Sound effects and animations
- [ ] Tutorials and interactive help system

---

**End of Specification v1.2**

This comprehensive specification provides all necessary details for implementing SumZero as a complete, polished web application. The specification is designed to be executable by an AI coding agent, with sufficient detail to resolve ambiguities and maintain consistency throughout development.
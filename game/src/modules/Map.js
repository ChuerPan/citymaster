export const ROWS = 11;
export const COLS = 50;

export const CellState = {
    EMPTY: 'empty',
    UNEXPLORED: 'unexplored',
    PLAYER: 'player',
    ENEMY: 'enemy',
    PLAYER_CASTLE: 'player_castle',
    ENEMY_CASTLE: 'enemy_castle'
};

export class GameMap {
    constructor() {
        this.grid = [];
        this.playerCastle = null;
        this.enemyCastle = null;
        this.initGrid();
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < ROWS; y++) {
            const row = [];
            for (let x = 0; x < COLS; x++) {
                let state = CellState.UNEXPLORED;
                let unit = null;
                
                // 设置玩家主城位置（底部中间）
                if (y === ROWS - 1 && x === Math.floor(COLS / 2)) {
                    state = CellState.PLAYER_CASTLE;
                    this.playerCastle = { x, y };
                }
                // 设置敌方主城位置（顶部中间）
                else if (y === 0 && x === Math.floor(COLS / 2)) {
                    state = CellState.ENEMY_CASTLE;
                    this.enemyCastle = { x, y };
                }
                
                row.push({ x, y, state, unit });
            }
            this.grid.push(row);
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
        return this.grid[y][x];
    }

    setCellState(x, y, state) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.state = state;
        }
    }

    setUnit(x, y, unit) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.unit = unit;
            if (unit) {
                unit.x = x;
                unit.y = y;
            }
        }
    }

    moveUnit(fromX, fromY, toX, toY) {
        const fromCell = this.getCell(fromX, fromY);
        const toCell = this.getCell(toX, toY);
        
        if (fromCell && toCell && fromCell.unit && !toCell.unit) {
            const unit = fromCell.unit;
            toCell.unit = unit;
            toCell.state = unit.owner === 'player' ? CellState.PLAYER : CellState.ENEMY;
            fromCell.unit = null;
            fromCell.state = CellState.EMPTY;
            unit.x = toX;
            unit.y = toY;
            return true;
        }
        return false;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    getManhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    getAdjacentCells(x, y) {
        const adjacent = [];
        const directions = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        for (const dir of directions) {
            const cell = this.getCell(x + dir.dx, y + dir.dy);
            if (cell) {
                adjacent.push(cell);
            }
        }
        return adjacent;
    }

    getAllUnits() {
        const units = [];
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.grid[y][x];
                if (cell.unit) {
                    units.push(cell.unit);
                }
            }
        }
        return units;
    }

    getPlayerUnits() {
        return this.getAllUnits().filter(u => u.owner === 'player');
    }

    getEnemyUnits() {
        return this.getAllUnits().filter(u => u.owner === 'enemy');
    }

    reset() {
        this.initGrid();
    }
}

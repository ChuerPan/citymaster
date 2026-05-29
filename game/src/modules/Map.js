// 地图配置：宽15格，长30格
export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 30;
export const PLAYER_ZONE_START = 15; // 玩家区域起始（行15-29）
export const ENEMY_ZONE_END = 15;   // 敌方区域结束（行0-14）

export const CellState = {
    EMPTY: 'empty',
    PLAYER_ZONE: 'player_zone',
    ENEMY_ZONE: 'enemy_zone',
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
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                let state;
                
                if (y < ENEMY_ZONE_END) {
                    state = CellState.ENEMY_ZONE;
                } else if (y >= PLAYER_ZONE_START) {
                    state = CellState.PLAYER_ZONE;
                } else {
                    state = CellState.EMPTY;
                }
                
                const middleX = Math.floor(MAP_WIDTH / 2);
                if (y === PLAYER_ZONE_START && x === middleX) {
                    state = CellState.PLAYER_CASTLE;
                    this.playerCastle = { x, y };
                } else if (y === ENEMY_ZONE_END - 1 && x === middleX) {
                    state = CellState.ENEMY_CASTLE;
                    this.enemyCastle = { x, y };
                }
                
                row.push({
                    x,
                    y,
                    state,
                    unit: null,
                    building: null
                });
            }
            this.grid.push(row);
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
            return null;
        }
        return this.grid[y][x];
    }

    isPlayerZone(y) {
        return y >= PLAYER_ZONE_START;
    }

    isEnemyZone(y) {
        return y < ENEMY_ZONE_END;
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

    setBuilding(x, y, building) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.building = building;
            if (building) {
                building.x = x;
                building.y = y;
            }
        }
    }

    moveUnit(fromX, fromY, toX, toY) {
        const fromCell = this.getCell(fromX, fromY);
        const toCell = this.getCell(toX, toY);
        
        if (!fromCell || !toCell) return false;
        if (!fromCell.unit) return false;
        if (toCell.unit) return false;
        
        const unit = fromCell.unit;
        toCell.unit = unit;
        fromCell.unit = null;
        unit.x = toX;
        unit.y = toY;
        
        return true;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    getManhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    getAllUnits() {
        const units = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
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

    getUnitsInRange(x, y, range) {
        const units = [];
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const dist = this.getDistance(x, y, x + dx, y + dy);
                if (dist <= range && dist > 0) {
                    const cell = this.getCell(x + dx, y + dy);
                    if (cell && cell.unit) {
                        units.push({ unit: cell.unit, distance: dist });
                    }
                }
            }
        }
        return units;
    }

    getEmptyCellsInZone(isPlayer) {
        const cells = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const cell = this.grid[y][x];
                const inCorrectZone = isPlayer ? this.isPlayerZone(y) : this.isEnemyZone(y);
                if (inCorrectZone && !cell.unit && !cell.building && 
                    cell.state !== CellState.PLAYER_CASTLE && 
                    cell.state !== CellState.ENEMY_CASTLE) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    reset() {
        this.initGrid();
    }
}

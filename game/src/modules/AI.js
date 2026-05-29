import { UNITS, Unit, Building, BUILDINGS } from './Units.js';
import { COLS, ROWS, CellState } from './Map.js';

export class GameAI {
    constructor(gameMap) {
        this.gameMap = gameMap;
    }

    findBuildTarget() {
        const targets = [];
        for (let y = 1; y < Math.floor(ROWS / 2); y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.gameMap.getCell(x, y);
                if (cell && cell.state === CellState.UNEXPLORED) {
                    targets.push(cell);
                }
            }
        }
        
        if (targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)];
    }

    buildUnit(cell) {
        if (!cell || cell.state !== CellState.UNEXPLORED) return null;
        
        const unitTypes = Object.keys(UNITS);
        const randomType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const unit = new Unit(randomType, 'enemy', cell.x, cell.y);
        
        this.gameMap.setUnit(cell.x, cell.y, unit);
        cell.state = CellState.ENEMY;
        
        return unit;
    }

    getMoveTargets(unit) {
        const targets = [];
        const startX = Math.max(0, unit.x - unit.moveRange);
        const endX = Math.min(COLS - 1, unit.x + unit.moveRange);
        const startY = Math.max(0, unit.y - unit.moveRange);
        const endY = Math.min(ROWS - 1, unit.y + unit.moveRange);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const dist = this.gameMap.getManhattanDistance(unit.x, unit.y, x, y);
                if (dist <= unit.moveRange && dist > 0) {
                    const cell = this.gameMap.getCell(x, y);
                    if (cell && !cell.unit && cell.state !== CellState.PLAYER_CASTLE && cell.state !== CellState.ENEMY_CASTLE) {
                        targets.push(cell);
                    }
                }
            }
        }
        
        return targets;
    }

    getAttackTargets(unit) {
        const targets = [];
        const startX = Math.max(0, unit.x - unit.attackRange);
        const endX = Math.min(COLS - 1, unit.x + unit.attackRange);
        const startY = Math.max(0, unit.y - unit.attackRange);
        const endY = Math.min(ROWS - 1, unit.y + unit.attackRange);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const dist = this.gameMap.getDistance(unit.x, unit.y, x, y);
                if (dist <= unit.attackRange && dist > 0) {
                    const cell = this.gameMap.getCell(x, y);
                    if (cell) {
                        if (cell.unit && cell.unit.owner !== unit.owner) {
                            targets.push({ cell, distance: dist, target: cell.unit });
                        } else if (cell.state === CellState.PLAYER_CASTLE) {
                            targets.push({ cell, distance: dist, isCastle: true });
                        }
                    }
                }
            }
        }
        
        return targets;
    }

    selectTargetByPriority(unit, targets) {
        if (targets.length === 0) return null;
        
        switch (unit.attackPriority) {
            case 'nearest':
                return targets.sort((a, b) => a.distance - b.distance)[0];
            case 'farthest':
                return targets.sort((a, b) => b.distance - a.distance)[0];
            case 'weakest':
                return targets.sort((a, b) => {
                    if (a.isCastle) return -1;
                    if (b.isCastle) return 1;
                    return a.target.hp - b.target.hp;
                })[0];
            case 'strongest':
                return targets.sort((a, b) => {
                    if (a.isCastle) return -1;
                    if (b.isCastle) return 1;
                    return b.target.hp - a.target.hp;
                })[0];
            default:
                return targets[0];
        }
    }

    selectMoveTarget(unit, moveTargets) {
        if (moveTargets.length === 0) return null;
        
        const playerCastle = this.gameMap.playerCastle;
        
        moveTargets.sort((a, b) => {
            const distA = this.gameMap.getManhattanDistance(a.x, a.y, playerCastle.x, playerCastle.y);
            const distB = this.gameMap.getManhattanDistance(b.x, b.y, playerCastle.x, playerCastle.y);
            return distA - distB;
        });
        
        return moveTargets[0];
    }

    processUnit(unit, currentTime) {
        if (!unit.canAct(currentTime, 600)) return null;
        
        const attackTargets = this.getAttackTargets(unit);
        const target = this.selectTargetByPriority(unit, attackTargets);
        
        if (target) {
            unit.markAction(currentTime);
            if (target.isCastle) {
                return { type: 'attack_castle', unit, target: target.cell };
            } else {
                return { type: 'attack', unit, target: target.target };
            }
        }
        
        const moveTargets = this.getMoveTargets(unit);
        const moveTarget = this.selectMoveTarget(unit, moveTargets);
        
        if (moveTarget) {
            unit.markAction(currentTime);
            return { type: 'move', unit, target: moveTarget };
        }
        
        return null;
    }
}

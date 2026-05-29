import { UNITS, Unit } from './Units.js';
import { COLS, ROWS } from './Map.js';

export class GameAI {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.buildTurns = 0;
    }

    findBuildTarget() {
        // AI在自己一侧找未探索的格子
        const targets = [];
        for (let y = 1; y < Math.floor(ROWS / 2); y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.gameMap.getCell(x, y);
                if (cell && cell.state === 'unexplored') {
                    targets.push(cell);
                }
            }
        }
        
        if (targets.length === 0) return null;
        
        // 随机选择一个
        return targets[Math.floor(Math.random() * targets.length)];
    }

    buildUnit(cell) {
        if (!cell || cell.state !== 'unexplored') return null;
        
        const unitTypes = Object.keys(UNITS);
        const randomType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const unit = new Unit(randomType, 'enemy', cell.x, cell.y);
        
        this.gameMap.setUnit(cell.x, cell.y, unit);
        cell.state = 'enemy';
        
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
                    if (cell && !cell.unit && cell.state !== 'player_castle' && cell.state !== 'enemy_castle') {
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
                            targets.push({ cell, distance: dist });
                        } else if (cell.state === 'player_castle') {
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
                // 优先最近的
                return targets.sort((a, b) => a.distance - b.distance)[0];
            case 'farthest':
                // 优先最远的
                return targets.sort((a, b) => b.distance - a.distance)[0];
            case 'weakest':
                // 优先血量最低的
                return targets.sort((a, b) => {
                    if (a.isCastle) return -1;
                    if (b.isCastle) return 1;
                    return a.cell.unit.hp - b.cell.unit.hp;
                })[0];
            case 'strongest':
                // 优先血量最高的
                return targets.sort((a, b) => {
                    if (a.isCastle) return -1;
                    if (b.isCastle) return 1;
                    return b.cell.unit.hp - a.cell.unit.hp;
                })[0];
            default:
                return targets[0];
        }
    }

    selectMoveTarget(unit, moveTargets) {
        if (moveTargets.length === 0) return null;
        
        const playerCastle = this.gameMap.playerCastle;
        
        // 优先向玩家主城移动
        moveTargets.sort((a, b) => {
            const distA = this.gameMap.getManhattanDistance(a.x, a.y, playerCastle.x, playerCastle.y);
            const distB = this.gameMap.getManhattanDistance(b.x, b.y, playerCastle.x, playerCastle.y);
            return distA - distB;
        });
        
        return moveTargets[0];
    }

    executeTurn() {
        // 1. 先建造
        if (this.buildTurns < 15 && Math.random() > 0.3) {
            const buildTarget = this.findBuildTarget();
            if (buildTarget) {
                this.buildUnit(buildTarget);
                this.buildTurns++;
            }
        }
        
        // 2. 移动和攻击
        const enemyUnits = this.gameMap.getEnemyUnits();
        
        for (const unit of enemyUnits) {
            if (unit.hasMoved && unit.hasAttacked) continue;
            
            // 先尝试攻击
            if (!unit.hasAttacked) {
                const attackTargets = this.getAttackTargets(unit);
                const target = this.selectTargetByPriority(unit, attackTargets);
                
                if (target) {
                    if (target.isCastle) {
                        // 攻击城堡
                        return { type: 'attack_castle', unit, target: target.cell };
                    } else {
                        // 攻击单位
                        return { type: 'attack', unit, target: target.cell.unit };
                    }
                }
            }
            
            // 再尝试移动
            if (!unit.hasMoved) {
                const moveTargets = this.getMoveTargets(unit);
                const moveTarget = this.selectMoveTarget(unit, moveTargets);
                
                if (moveTarget) {
                    return { type: 'move', unit, target: moveTarget };
                }
            }
        }
        
        return null;
    }

    reset() {
        this.buildTurns = 0;
    }
}

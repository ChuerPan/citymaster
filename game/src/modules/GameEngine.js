import { GameMap, CellState, COLS, ROWS } from './Map.js';
import { UNITS, Unit, Building, BUILDINGS } from './Units.js';
import { GameAI } from './AI.js';

export class GameEngine {
    constructor() {
        this.map = null;
        this.ai = null;
        this.playerHp = 100;
        this.enemyHp = 100;
        this.playerGold = 50;
        this.enemyGold = 50;
        this.gameOver = false;
        this.winner = null;
        this.selectedUnit = null;
        this.onStateChange = null;
        this.gameLoop = null;
        this.lastTime = 0;
    }

    initGame() {
        this.map = new GameMap();
        this.ai = new GameAI(this.map);
        this.playerHp = 100;
        this.enemyHp = 100;
        this.playerGold = 50;
        this.enemyGold = 50;
        this.gameOver = false;
        this.winner = null;
        this.selectedUnit = null;
        
        this.initStartingUnits();
        this.startGameLoop();
        
        this.notifyStateChange();
    }

    initStartingUnits() {
        const playerX = Math.floor(COLS / 2);
        const enemyX = Math.floor(COLS / 2);
        
        for (let i = -2; i <= 2; i++) {
            if (this.map.getCell(playerX + i, ROWS - 3)) {
                const types = Object.keys(UNITS);
                const type = types[Math.floor(Math.random() * types.length)];
                const unit = new Unit(type, 'player', playerX + i, ROWS - 3);
                this.map.setUnit(playerX + i, ROWS - 3, unit);
                this.map.getCell(playerX + i, ROWS - 3).state = CellState.PLAYER;
            }
        }
        
        for (let i = -2; i <= 2; i++) {
            if (this.map.getCell(enemyX + i, 2)) {
                const types = Object.keys(UNITS);
                const type = types[Math.floor(Math.random() * types.length)];
                const unit = new Unit(type, 'enemy', enemyX + i, 2);
                this.map.setUnit(enemyX + i, 2, unit);
                this.map.getCell(enemyX + i, 2).state = CellState.ENEMY;
            }
        }
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    update(currentTime) {
        if (this.gameOver) {
            return;
        }

        this.processBuildings(currentTime);
        this.processPlayerUnits(currentTime);
        this.processEnemyUnits(currentTime);
        this.autoProduce(currentTime);
        this.checkGameOver();
        
        this.notifyStateChange();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    processBuildings(currentTime) {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.map.getCell(x, y);
                if (cell && cell.building) {
                    const gold = cell.building.produceGold(currentTime);
                    if (gold > 0) {
                        if (cell.building.owner === 'player') {
                            this.playerGold += gold;
                        } else {
                            this.enemyGold += gold;
                        }
                    }
                }
            }
        }
    }

    processPlayerUnits(currentTime) {
        const playerUnits = this.map.getPlayerUnits();
        playerUnits.forEach(unit => {
            if (!unit.canAct(currentTime, 500)) return;
            
            const target = this.findAttackTarget(unit);
            if (target) {
                this.attack(unit, target);
                unit.markAction(currentTime);
                return;
            }
            
            const moveTarget = this.findMoveTarget(unit, 'enemy');
            if (moveTarget) {
                this.map.moveUnit(unit.x, unit.y, moveTarget.x, moveTarget.y);
                unit.markAction(currentTime);
            }
        });
    }

    processEnemyUnits(currentTime) {
        const enemyUnits = this.map.getEnemyUnits();
        enemyUnits.forEach(unit => {
            const action = this.ai.processUnit(unit, currentTime);
            if (action) {
                if (action.type === 'move') {
                    this.map.moveUnit(action.unit.x, action.unit.y, action.target.x, action.target.y);
                } else if (action.type === 'attack') {
                    this.attack(action.unit, action.target);
                } else if (action.type === 'attack_castle') {
                    this.attackCastle(action.unit, 'player');
                }
            }
        });
    }

    autoProduce(currentTime) {
        if (currentTime % 3000 < 20) {
            const playerBuildTarget = this.findPlayerBuildTarget();
            if (playerBuildTarget && this.playerGold >= 10) {
                this.exploreCell(playerBuildTarget.x, playerBuildTarget.y);
            }
            
            if (this.enemyGold >= 30 && Math.random() > 0.7) {
                const aiBuildTarget = this.ai.findBuildTarget();
                if (aiBuildTarget) {
                    this.ai.buildUnit(aiBuildTarget);
                    this.enemyGold -= 10;
                }
            }
        }
    }

    findPlayerBuildTarget() {
        const targets = [];
        for (let y = Math.floor(ROWS / 2); y < ROWS - 2; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.map.getCell(x, y);
                if (cell && cell.state === CellState.UNEXPLORED) {
                    targets.push(cell);
                }
            }
        }
        if (targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)];
    }

    findAttackTarget(unit) {
        const startX = Math.max(0, unit.x - unit.attackRange);
        const endX = Math.min(COLS - 1, unit.x + unit.attackRange);
        const startY = Math.max(0, unit.y - unit.attackRange);
        const endY = Math.min(ROWS - 1, unit.y + unit.attackRange);
        
        const targets = [];
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const dist = this.map.getDistance(unit.x, unit.y, x, y);
                if (dist <= unit.attackRange && dist > 0) {
                    const cell = this.map.getCell(x, y);
                    if (cell) {
                        if (cell.unit && cell.unit.owner !== unit.owner) {
                            targets.push({ target: cell.unit, distance: dist });
                        } else if (cell.state === CellState.ENEMY_CASTLE) {
                            return { cell, isCastle: true };
                        }
                    }
                }
            }
        }
        
        if (targets.length === 0) return null;
        
        targets.sort((a, b) => a.distance - b.distance);
        return targets[0].target;
    }

    findMoveTarget(unit, towardsOwner) {
        const startX = Math.max(0, unit.x - unit.moveRange);
        const endX = Math.min(COLS - 1, unit.x + unit.moveRange);
        const startY = Math.max(0, unit.y - unit.moveRange);
        const endY = Math.min(ROWS - 1, unit.y + unit.moveRange);
        
        const targets = [];
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const dist = this.map.getManhattanDistance(unit.x, unit.y, x, y);
                if (dist <= unit.moveRange && dist > 0) {
                    const cell = this.map.getCell(x, y);
                    if (cell && !cell.unit && cell.state !== CellState.PLAYER_CASTLE && cell.state !== CellState.ENEMY_CASTLE) {
                        targets.push(cell);
                    }
                }
            }
        }
        
        if (targets.length === 0) return null;
        
        const targetCastle = towardsOwner === 'enemy' ? this.map.enemyCastle : this.map.playerCastle;
        targets.sort((a, b) => {
            const distA = this.map.getManhattanDistance(a.x, a.y, targetCastle.x, targetCastle.y);
            const distB = this.map.getManhattanDistance(b.x, b.y, targetCastle.x, targetCastle.y);
            return distA - distB;
        });
        
        return targets[0];
    }

    clickCell(x, y) {
        if (this.gameOver) return;
        
        const cell = this.map.getCell(x, y);
        if (!cell) return;
        
        if (cell.state === CellState.UNEXPLORED) {
            this.exploreCell(x, y);
            return;
        }
        
        if (cell.unit && cell.unit.owner === 'player') {
            this.selectedUnit = cell.unit;
            this.notifyStateChange();
            return;
        }
        
        if (this.selectedUnit) {
            this.tryMoveOrAttack(this.selectedUnit, x, y);
            this.selectedUnit = null;
            this.notifyStateChange();
        }
    }

    exploreCell(x, y) {
        const cell = this.map.getCell(x, y);
        if (!cell) return;
        
        if (Math.random() > 0.3) {
            const types = Object.keys(UNITS);
            const type = types[Math.floor(Math.random() * types.length)];
            const unit = new Unit(type, 'player', x, y);
            this.map.setUnit(x, y, unit);
            cell.state = CellState.PLAYER;
        } else if (Math.random() > 0.7) {
            const building = new Building('mine', 'player', x, y);
            this.map.setBuilding(x, y, building);
            cell.state = CellState.PLAYER_MINE;
        } else {
            cell.state = CellState.EMPTY;
        }
    }

    tryMoveOrAttack(unit, targetX, targetY) {
        const targetCell = this.map.getCell(targetX, targetY);
        if (!targetCell) return false;
        
        const dist = this.map.getManhattanDistance(unit.x, unit.y, targetX, targetY);
        
        if (dist <= unit.attackRange) {
            if (targetCell.unit && targetCell.unit.owner !== unit.owner) {
                this.attack(unit, targetCell.unit);
                return true;
            }
            if (targetCell.state === CellState.ENEMY_CASTLE) {
                this.attackCastle(unit, 'enemy');
                return true;
            }
        }
        
        if (dist <= unit.moveRange && !targetCell.unit) {
            if (targetCell.state !== CellState.PLAYER_CASTLE && targetCell.state !== CellState.ENEMY_CASTLE) {
                this.map.moveUnit(unit.x, unit.y, targetX, targetY);
                return true;
            }
        }
        
        return false;
    }

    attack(attacker, defender) {
        const damage = attacker.attack;
        defender.takeDamage(damage);
        
        if (!defender.isAlive()) {
            this.removeUnit(defender);
        }
    }

    attackCastle(attacker, targetType) {
        const damage = Math.floor(attacker.attack / 2);
        if (targetType === 'enemy') {
            this.enemyHp = Math.max(0, this.enemyHp - damage);
        } else {
            this.playerHp = Math.max(0, this.playerHp - damage);
        }
    }

    removeUnit(unit) {
        const cell = this.map.getCell(unit.x, unit.y);
        if (cell) {
            cell.unit = null;
            if (!cell.building) {
                cell.state = CellState.EMPTY;
            }
        }
    }

    checkGameOver() {
        if (this.playerHp <= 0) {
            this.gameOver = true;
            this.winner = 'enemy';
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
            }
        } else if (this.enemyHp <= 0) {
            this.gameOver = true;
            this.winner = 'player';
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
            }
        }
    }

    getState() {
        return {
            map: this.map,
            playerHp: this.playerHp,
            enemyHp: this.enemyHp,
            playerGold: this.playerGold,
            enemyGold: this.enemyGold,
            gameOver: this.gameOver,
            winner: this.winner,
            selectedUnit: this.selectedUnit
        };
    }

    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }
}

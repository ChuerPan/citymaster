import { GameMap, CellState, COLS, ROWS } from './Map.js';
import { UNITS, Unit } from './Units.js';
import { GameAI } from './AI.js';

export class GameEngine {
    constructor() {
        this.map = new GameMap();
        this.ai = new GameAI(this.map);
        this.playerHp = 100;
        this.enemyHp = 100;
        this.turn = 0;
        this.currentPlayer = 'player';
        this.gameOver = false;
        this.winner = null;
        this.selectedUnit = null;
        this.onStateChange = null;
    }

    initGame() {
        this.map = new GameMap();
        this.ai = new GameAI(this.map);
        this.playerHp = 100;
        this.enemyHp = 100;
        this.turn = 0;
        this.currentPlayer = 'player';
        this.gameOver = false;
        this.winner = null;
        this.selectedUnit = null;
        
        // 初始化一些玩家和敌方单位
        this.initStartingUnits();
        
        this.notifyStateChange();
    }

    initStartingUnits() {
        // 玩家初始单位
        const playerX = Math.floor(COLS / 2);
        for (let i = -2; i <= 2; i++) {
            if (this.map.getCell(playerX + i, ROWS - 2)) {
                const types = Object.keys(UNITS);
                const type = types[Math.floor(Math.random() * types.length)];
                const unit = new Unit(type, 'player', playerX + i, ROWS - 2);
                this.map.setUnit(playerX + i, ROWS - 2, unit);
                this.map.getCell(playerX + i, ROWS - 2).state = CellState.PLAYER;
            }
        }
        
        // 敌方初始单位
        const enemyX = Math.floor(COLS / 2);
        for (let i = -2; i <= 2; i++) {
            if (this.map.getCell(enemyX + i, 1)) {
                const types = Object.keys(UNITS);
                const type = types[Math.floor(Math.random() * types.length)];
                const unit = new Unit(type, 'enemy', enemyX + i, 1);
                this.map.setUnit(enemyX + i, 1, unit);
                this.map.getCell(enemyX + i, 1).state = CellState.ENEMY;
            }
        }
    }

    clickCell(x, y) {
        if (this.gameOver) return;
        
        const cell = this.map.getCell(x, y);
        if (!cell) return;
        
        // 如果是未探索的格子，尝试翻开
        if (cell.state === CellState.UNEXPLORED) {
            this.exploreCell(x, y);
            return;
        }
        
        // 如果有单位且是当前玩家的
        if (cell.unit && cell.unit.owner === this.currentPlayer) {
            this.selectedUnit = cell.unit;
            this.notifyStateChange();
            return;
        }
        
        // 如果有选中的单位，尝试移动或攻击
        if (this.selectedUnit) {
            if (this.tryMoveOrAttack(this.selectedUnit, x, y)) {
                this.selectedUnit = null;
                this.notifyStateChange();
            }
        }
    }

    exploreCell(x, y) {
        const cell = this.map.getCell(x, y);
        if (!cell) return;
        
        // 随机决定是否出现单位
        if (Math.random() > 0.4) {
            const types = Object.keys(UNITS);
            const type = types[Math.floor(Math.random() * types.length)];
            const unit = new Unit(type, 'player', x, y);
            this.map.setUnit(x, y, unit);
            cell.state = CellState.PLAYER;
        } else {
            cell.state = CellState.EMPTY;
        }
        
        this.notifyStateChange();
    }

    tryMoveOrAttack(unit, targetX, targetY) {
        const targetCell = this.map.getCell(targetX, targetY);
        if (!targetCell) return false;
        
        const dist = this.map.getManhattanDistance(unit.x, unit.y, targetX, targetY);
        
        // 尝试攻击
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
        
        // 尝试移动
        if (dist <= unit.moveRange && !unit.hasMoved) {
            if (!targetCell.unit && targetCell.state !== CellState.PLAYER_CASTLE && targetCell.state !== CellState.ENEMY_CASTLE) {
                this.map.moveUnit(unit.x, unit.y, targetX, targetY);
                unit.hasMoved = true;
                return true;
            }
        }
        
        return false;
    }

    attack(attacker, defender) {
        const damage = attacker.attack;
        defender.takeDamage(damage);
        attacker.hasAttacked = true;
        
        if (!defender.isAlive()) {
            this.removeUnit(defender);
        }
        
        this.checkGameOver();
    }

    attackCastle(attacker, targetType) {
        const damage = Math.floor(attacker.attack / 2);
        if (targetType === 'enemy') {
            this.enemyHp = Math.max(0, this.enemyHp - damage);
        } else {
            this.playerHp = Math.max(0, this.playerHp - damage);
        }
        attacker.hasAttacked = true;
        
        this.checkGameOver();
    }

    removeUnit(unit) {
        const cell = this.map.getCell(unit.x, unit.y);
        if (cell) {
            cell.unit = null;
            cell.state = CellState.EMPTY;
        }
    }

    endPlayerTurn() {
        if (this.gameOver || this.currentPlayer !== 'player') return;
        
        // 重置玩家单位的回合状态
        this.map.getPlayerUnits().forEach(u => u.resetTurn());
        
        this.currentPlayer = 'enemy';
        this.selectedUnit = null;
        this.notifyStateChange();
        
        // AI回合
        setTimeout(() => this.executeAITurn(), 500);
    }

    executeAITurn() {
        if (this.gameOver) return;
        
        // AI行动
        let action = this.ai.executeTurn();
        let actionCount = 0;
        const maxActions = 10;
        
        const executeNextAction = () => {
            if (!action || actionCount >= maxActions || this.gameOver) {
                this.finishAITurn();
                return;
            }
            
            if (action.type === 'move' && !action.unit.hasMoved) {
                this.map.moveUnit(action.unit.x, action.unit.y, action.target.x, action.target.y);
                action.unit.hasMoved = true;
            } else if (action.type === 'attack' && !action.unit.hasAttacked) {
                this.attack(action.unit, action.target);
                action.unit.hasAttacked = true;
            } else if (action.type === 'attack_castle' && !action.unit.hasAttacked) {
                this.attackCastle(action.unit, 'player');
                action.unit.hasAttacked = true;
            }
            
            this.notifyStateChange();
            actionCount++;
            action = this.ai.executeTurn();
            
            setTimeout(executeNextAction, 300);
        };
        
        executeNextAction();
    }

    finishAITurn() {
        if (this.gameOver) return;
        
        // 重置敌方单位
        this.map.getEnemyUnits().forEach(u => u.resetTurn());
        
        this.turn++;
        this.currentPlayer = 'player';
        this.notifyStateChange();
    }

    checkGameOver() {
        if (this.playerHp <= 0) {
            this.gameOver = true;
            this.winner = 'enemy';
        } else if (this.enemyHp <= 0) {
            this.gameOver = true;
            this.winner = 'player';
        }
    }

    getState() {
        return {
            map: this.map,
            playerHp: this.playerHp,
            enemyHp: this.enemyHp,
            turn: this.turn,
            currentPlayer: this.currentPlayer,
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

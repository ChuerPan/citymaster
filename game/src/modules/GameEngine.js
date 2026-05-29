import { GameMap, CellState, MAP_WIDTH, PLAYER_ZONE_START } from './Map.js';
import { createUnit, createBuilding, createSkeleton } from './Units.js';
import { BattleSystem } from './Battle.js';
import { GameAI } from './AI.js';

export class GameEngine {
    constructor() {
        this.map = null;
        this.battle = null;
        this.ai = null;
        this.playerRace = null;
        this.enemyRace = null;
        this.playerCastle = null;
        this.enemyCastle = null;
        this.playerGold = 100;
        this.enemyGold = 100;
        this.gameOver = false;
        this.winner = null;
        this.onStateChange = null;
        this.lastTime = 0;
        this.gameLoop = null;
    }

    initGame(playerRace, enemyRace) {
        this.playerRace = playerRace;
        this.enemyRace = enemyRace;
        
        this.map = new GameMap();
        this.battle = new BattleSystem(this.map);
        this.ai = new GameAI(this.map, enemyRace);
        
        this.playerGold = 100;
        this.enemyGold = 100;
        this.gameOver = false;
        this.winner = null;
        
        // 创建主城
        const middleX = Math.floor(MAP_WIDTH / 2);
        this.playerCastle = createBuilding('castle', 'player', playerRace, middleX, PLAYER_ZONE_START);
        this.map.setBuilding(middleX, PLAYER_ZONE_START, this.playerCastle);
        
        this.enemyCastle = createBuilding('castle', 'enemy', enemyRace, middleX, 24);
        this.map.setBuilding(middleX, 24, this.enemyCastle);
        
        this.startGameLoop();
        this.notifyStateChange();
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

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.processBuildings(currentTime);
        this.processUnits(currentTime);
        this.processAutoBuild(currentTime);
        this.checkGameOver();

        this.notifyStateChange();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    processBuildings(currentTime) {
        // 处理金币产出
        if (this.playerCastle && this.playerCastle.canProduceGold(currentTime)) {
            this.playerGold += this.playerCastle.goldAmount;
            this.playerCastle.markGoldProduction(currentTime);
        }
        
        if (this.enemyCastle && this.enemyCastle.canProduceGold(currentTime)) {
            this.enemyGold += this.enemyCastle.goldAmount;
            this.enemyCastle.markGoldProduction(currentTime);
        }

        // 处理建筑攻击
        this.processBuildingAttacks(this.playerCastle, this.map.getEnemyUnits(), currentTime);
        this.processBuildingAttacks(this.enemyCastle, this.map.getPlayerUnits(), currentTime);
    }

    processBuildingAttacks(building, enemies, currentTime) {
        if (!building || building.attack === 0) return;
        if (!building.canAct(currentTime)) return;
        if (enemies.length === 0) return;

        const target = this.battle.findTarget(building, enemies);
        if (target) {
            const dist = this.map.getDistance(building.x, building.y, target.x, target.y);
            if (dist <= building.attackRange) {
                this.battle.executeAttack(building, target);
                this.removeDeadUnits();
            }
        }
    }

    processUnits(currentTime) {
        const playerUnits = this.map.getPlayerUnits();
        const enemyUnits = this.map.getEnemyUnits();
        const playerCastlePos = { x: this.playerCastle.x, y: this.playerCastle.y };
        const enemyCastlePos = { x: this.enemyCastle.x, y: this.enemyCastle.y };

        // 处理玩家单位
        playerUnits.forEach(unit => {
            this.processUnit(unit, currentTime, enemyUnits, enemyCastlePos);
        });

        // 处理敌方单位
        enemyUnits.forEach(unit => {
            this.processAIUnit(unit, currentTime, playerUnits, playerCastlePos);
        });
    }

    processUnit(unit, currentTime, enemies, targetCastle) {
        if (unit.isBuilding) return;
        if (!unit.canAct(currentTime)) return;

        // 处理召唤
        if (unit.canSummon) {
            this.processSummon(unit, currentTime);
        }

        // 尝试攻击
        if (unit.attack > 0) {
            const target = this.battle.findTarget(unit, enemies);
            
            if (target) {
                const dist = this.map.getDistance(unit.x, unit.y, target.x, target.y);
                if (dist <= unit.attackRange) {
                    if (unit.aoeRange > 0) {
                        this.battle.executeAOEDamage(unit, target.x, target.y, enemies, unit.aoeRange);
                    } else {
                        this.battle.executeAttack(unit, target);
                    }
                    this.removeDeadUnits();
                    return;
                }
            } else {
                const dist = this.map.getDistance(unit.x, unit.y, targetCastle.x, targetCastle.y);
                if (dist <= unit.attackRange) {
                    this.attackCastle(unit, 'enemy');
                    return;
                }
            }
        }

        // 移动
        if (unit.moveSpeed > 0) {
            let moveTarget = targetCastle;
            if (enemies.length > 0) {
                const target = this.battle.findTarget(unit, enemies);
                if (target) {
                    const dist = this.map.getDistance(unit.x, unit.y, target.x, target.y);
                    if (dist > unit.attackRange) {
                        moveTarget = target;
                    }
                }
            }
            
            const newPos = this.battle.findMoveTarget(unit, moveTarget);
            if (newPos) {
                this.map.moveUnit(unit.x, unit.y, newPos.x, newPos.y);
            }
        }
    }

    processAIUnit(unit, currentTime, enemies, targetCastle) {
        if (unit.isBuilding) return;
        if (!unit.canAct(currentTime)) return;

        // 处理召唤
        if (unit.canSummon) {
            this.processSummon(unit, currentTime);
        }

        // 尝试攻击
        if (unit.attack > 0) {
            const target = this.battle.findTarget(unit, enemies);
            
            if (target) {
                const dist = this.map.getDistance(unit.x, unit.y, target.x, target.y);
                if (dist <= unit.attackRange) {
                    if (unit.aoeRange > 0) {
                        this.battle.executeAOEDamage(unit, target.x, target.y, enemies, unit.aoeRange);
                    } else {
                        this.battle.executeAttack(unit, target);
                    }
                    this.removeDeadUnits();
                    return;
                }
            } else {
                const dist = this.map.getDistance(unit.x, unit.y, targetCastle.x, targetCastle.y);
                if (dist <= unit.attackRange) {
                    this.attackCastle(unit, 'player');
                    return;
                }
            }
        }

        // 移动
        if (unit.moveSpeed > 0) {
            let moveTarget = targetCastle;
            if (enemies.length > 0) {
                const target = this.battle.findTarget(unit, enemies);
                if (target) {
                    const dist = this.map.getDistance(unit.x, unit.y, target.x, target.y);
                    if (dist > unit.attackRange) {
                        moveTarget = target;
                    }
                }
            }
            
            const newPos = this.battle.findMoveTarget(unit, moveTarget);
            if (newPos) {
                this.map.moveUnit(unit.x, unit.y, newPos.x, newPos.y);
            }
        }
    }

    processSummon(unit, currentTime) {
        if (!unit.canSummonUnit(currentTime)) return;
        
        const emptyCells = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = unit.x + dx;
                const ny = unit.y + dy;
                const cell = this.map.getCell(nx, ny);
                if (cell && !cell.unit) {
                    emptyCells.push(cell);
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const skeleton = createSkeleton(unit.owner, unit.raceId, targetCell.x, targetCell.y);
            this.map.setUnit(targetCell.x, targetCell.y, skeleton);
            unit.markSummon(currentTime);
        }
    }

    processAutoBuild(currentTime) {
        // AI 自动建造
        if (this.ai.gold >= 20 && Math.random() < 0.02) {
            this.ai.autoBuild();
        }
    }

    attackCastle(unit, castleOwner) {
        const damage = unit.attack;
        if (castleOwner === 'enemy') {
            this.enemyCastle.takeDamage(damage);
        } else {
            this.playerCastle.takeDamage(damage);
        }
        unit.markAction(Date.now());
    }

    removeDeadUnits() {
        const allUnits = this.map.getAllUnits();
        allUnits.forEach(unit => {
            if (!unit.isAlive()) {
                const cell = this.map.getCell(unit.x, unit.y);
                if (cell) {
                    cell.unit = null;
                }
            }
        });

        // 检查城堡死亡
        if (this.playerCastle && !this.playerCastle.isAlive()) {
            this.playerCastle = null;
        }
        if (this.enemyCastle && !this.enemyCastle.isAlive()) {
            this.enemyCastle = null;
        }
    }

    clickCell(x, y) {
        if (this.gameOver) return;
        
        const cell = this.map.getCell(x, y);
        if (!cell) return;

        // 检查是否是玩家区域
        if (!this.map.isPlayerZone(y)) return;

        // 检查是否已有单位或建筑
        if (cell.unit || cell.building) return;

        // 检查是否是城堡位置
        if (cell.state === CellState.PLAYER_CASTLE || cell.state === CellState.ENEMY_CASTLE) return;

        // 建造单位
        if (this.playerGold >= 20) {
            const types = ['warrior', 'tank', 'archer', 'mage', 'summoner'];
            const unitType = types[Math.floor(Math.random() * types.length)];
            const unit = createUnit(unitType, 'player', this.playerRace, x, y);
            
            this.map.setUnit(x, y, unit);
            this.playerGold -= 20;
            
            this.notifyStateChange();
        }
    }

    checkGameOver() {
        if (this.playerCastle && this.playerCastle.hp <= 0) {
            this.gameOver = true;
            this.winner = 'enemy';
            this.stopGame();
        } else if (this.enemyCastle && this.enemyCastle.hp <= 0) {
            this.gameOver = true;
            this.winner = 'player';
            this.stopGame();
        }
    }

    stopGame() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    getState() {
        return {
            map: this.map,
            playerRace: this.playerRace,
            enemyRace: this.enemyRace,
            playerCastle: this.playerCastle,
            enemyCastle: this.enemyCastle,
            playerGold: Math.floor(this.playerGold),
            enemyGold: Math.floor(this.enemyGold),
            gameOver: this.gameOver,
            winner: this.winner
        };
    }

    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }
}

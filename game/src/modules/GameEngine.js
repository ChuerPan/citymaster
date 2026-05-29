import { GameAI } from './AI.js';
import { getRaceData } from './Races.js';
import { createUnit, UNITS } from './Units.js';
import { executeAttack, findTarget, checkVictory } from './Battle.js';

export class GameEngine {
    constructor() {
        this.playerRace = null;
        this.enemyRace = null;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.playerHp = 100;
        this.enemyHp = 100;
        this.playerGold = 100;
        this.turn = 0;
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.winner = null;
        this.ai = null;
        this.onStateChange = null;
    }
    
    initGame(playerRaceId) {
        const raceIds = ['human', 'orc', 'elf', 'night'];
        const availableRaces = raceIds.filter(id => id !== playerRaceId);
        this.enemyRace = availableRaces[Math.floor(Math.random() * availableRaces.length)];
        
        this.playerRace = playerRaceId;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.playerHp = 100;
        this.enemyHp = 100;
        this.playerGold = 100;
        this.turn = 0;
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.winner = null;
        this.ai = new GameAI(this.enemyRace);
        
        this.notifyStateChange();
    }
    
    getPlayerUnits() {
        return this.playerUnits;
    }
    
    getEnemyUnits() {
        return this.enemyUnits;
    }
    
    spawnUnit(unitId) {
        if (!this.isPlayerTurn || this.gameOver) return false;
        
        const unitData = UNITS[unitId];
        if (!unitData || this.playerGold < unitData.cost) return false;
        
        const raceData = getRaceData(this.playerRace);
        if (!raceData.units.includes(unitId)) return false;
        
        const unit = createUnit(unitId, 'player');
        this.playerUnits.push(unit);
        this.playerGold -= unitData.cost;
        
        this.notifyStateChange();
        return true;
    }
    
    endPlayerTurn() {
        if (!this.isPlayerTurn || this.gameOver) return;
        
        this.isPlayerTurn = false;
        this.processBattle();
        
        if (!this.gameOver) {
            this.executeAITurn();
        }
        
        if (!this.gameOver) {
            this.processBattle();
        }
        
        if (!this.gameOver) {
            this.turn++;
            this.playerGold += 10 + this.turn * 2;
            if (this.playerGold > 200) this.playerGold = 200;
            this.isPlayerTurn = true;
        }
        
        this.notifyStateChange();
    }
    
    executeAITurn() {
        if (!this.ai) return;
        
        const actions = this.ai.decideAction(this.playerUnits, this.playerHp, this.enemyHp);
        
        actions.forEach(action => {
            if (action.type === 'spawn' && action.unitId) {
                const unit = this.ai.spawnUnit(action.unitId);
                if (unit) {
                    this.enemyUnits.push(unit);
                }
            }
        });
    }
    
    processBattle() {
        const allUnits = [...this.playerUnits.map(u => ({ ...u, side: 'player' })),
                          ...this.enemyUnits.map(u => ({ ...u, side: 'enemy' }))];
        
        const sortedUnits = allUnits.sort((a, b) => {
            if (a.attackType === 'ranged' && b.attackType !== 'ranged') return -1;
            if (b.attackType === 'ranged' && a.attackType !== 'ranged') return 1;
            if (a.attackType === 'magic' && b.attackType !== 'magic') return -1;
            if (b.attackType === 'magic' && a.attackType !== 'magic') return 1;
            return b.attack - a.attack;
        });
        
        sortedUnits.forEach(attacker => {
            if (this.gameOver) return;
            
            const attackerUnits = attacker.side === 'player' ? this.playerUnits : this.enemyUnits;
            const defenderUnits = attacker.side === 'player' ? this.enemyUnits : this.playerUnits;
            
            if (!attackerUnits.includes(attacker)) return;
            
            const target = findTarget(attacker, attackerUnits, defenderUnits);
            
            if (target) {
                const result = executeAttack(attacker, target);
                
                if (result.killed) {
                    const idx = defenderUnits.indexOf(target);
                    if (idx > -1) {
                        defenderUnits.splice(idx, 1);
                    }
                }
            } else {
                if (attacker.side === 'player') {
                    this.enemyHp -= Math.floor(attacker.attack / 2);
                } else {
                    this.playerHp -= Math.floor(attacker.attack / 2);
                }
            }
            
            this.checkGameOver();
        });
        
        this.checkGameOver();
    }
    
    checkGameOver() {
        const winner = checkVictory(this.playerUnits, this.enemyUnits, this.playerHp, this.enemyHp);
        
        if (winner) {
            this.gameOver = true;
            this.winner = winner;
        }
    }
    
    getState() {
        return {
            playerRace: this.playerRace,
            enemyRace: this.enemyRace,
            playerUnits: this.playerUnits,
            enemyUnits: this.enemyUnits,
            playerHp: this.playerHp,
            enemyHp: this.enemyHp,
            playerGold: this.playerGold,
            turn: this.turn,
            isPlayerTurn: this.isPlayerTurn,
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
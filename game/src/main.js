import { GameEngine } from './modules/GameEngine.js';
import { getRaceData } from './modules/Races.js';
import { UNITS } from './modules/Units.js';

class GameUI {
    constructor() {
        this.game = new GameEngine();
        this.game.onStateChange = this.handleStateChange.bind(this);
        
        this.initUI();
    }
    
    initUI() {
        this.raceSelection = document.getElementById('race-selection');
        this.gameScreen = document.getElementById('game-screen');
        this.playerHpBar = document.getElementById('player-hp');
        this.playerHpText = document.getElementById('player-hp-text');
        this.enemyHpBar = document.getElementById('enemy-hp');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.goldDisplay = document.getElementById('gold');
        this.unitCardsContainer = document.getElementById('unit-cards');
        this.playerUnitsContainer = document.getElementById('player-units');
        this.enemyUnitsContainer = document.getElementById('enemy-units');
        this.gameOverOverlay = document.getElementById('game-over');
        this.resultText = document.getElementById('result-text');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.race-card').forEach(card => {
            card.addEventListener('click', () => {
                const raceId = card.dataset.race;
                this.selectRace(raceId);
            });
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.showRaceSelection();
        });
        
        this.unitCardsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.unit-card');
            if (card && !card.classList.contains('disabled')) {
                const unitId = card.dataset.unitId;
                this.game.spawnUnit(unitId);
            }
        });
        
        this.endTurnBtn.addEventListener('click', () => {
            if (!this.endTurnBtn.classList.contains('disabled')) {
                this.game.endPlayerTurn();
            }
        });
    }
    
    selectRace(raceId) {
        this.game.initGame(raceId);
        this.showGameScreen();
        this.renderUnitCards(raceId);
    }
    
    showRaceSelection() {
        this.raceSelection.classList.add('active');
        this.gameScreen.classList.remove('active');
        this.gameOverOverlay.classList.remove('active');
    }
    
    showGameScreen() {
        this.raceSelection.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.gameOverOverlay.classList.remove('active');
    }
    
    renderUnitCards(raceId) {
        const raceData = getRaceData(raceId);
        this.unitCardsContainer.innerHTML = '';
        
        raceData.units.forEach(unitId => {
            const unitData = UNITS[unitId];
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.dataset.unitId = unitId;
            
            card.innerHTML = `
                <div class="unit-icon">${unitData.icon}</div>
                <div class="unit-name">${unitData.name}</div>
                <div class="cost">💰 ${unitData.cost}</div>
            `;
            
            this.unitCardsContainer.appendChild(card);
        });
        
        this.updateUnitCards();
    }
    
    updateUnitCards() {
        document.querySelectorAll('.unit-card').forEach(card => {
            const unitId = card.dataset.unitId;
            const unitData = UNITS[unitId];
            
            if (this.game.playerGold >= unitData.cost && this.game.isPlayerTurn && !this.game.gameOver) {
                card.classList.remove('disabled');
            } else {
                card.classList.add('disabled');
            }
        });
    }
    
    renderUnits(units, container, isEnemy) {
        container.innerHTML = '';
        
        units.forEach(unit => {
            const unitEl = document.createElement('div');
            unitEl.className = `unit ${isEnemy ? 'enemy' : ''}`;
            unitEl.dataset.instanceId = unit.instanceId;
            
            const hpPercent = (unit.currentHp / unit.hp) * 100;
            
            unitEl.innerHTML = `
                <div class="unit-icon">${unit.icon}</div>
                <div class="unit-name">${unit.name}</div>
                <div class="unit-hp-bar">
                    <div class="unit-hp-fill" style="width: ${hpPercent}%"></div>
                </div>
            `;
            
            container.appendChild(unitEl);
        });
    }
    
    handleStateChange(state) {
        this.playerHpBar.style.width = `${state.playerHp}%`;
        this.playerHpText.textContent = `${state.playerHp}%`;
        this.enemyHpBar.style.width = `${state.enemyHp}%`;
        this.enemyHpText.textContent = `${state.enemyHp}%`;
        this.goldDisplay.textContent = state.playerGold;
        
        this.renderUnits(state.playerUnits, this.playerUnitsContainer, false);
        this.renderUnits(state.enemyUnits, this.enemyUnitsContainer, true);
        
        this.updateUnitCards();
        this.updateEndTurnBtn(state);
        
        if (state.gameOver) {
            this.showGameOver(state.winner);
        }
    }
    
    updateEndTurnBtn(state) {
        if (state.isPlayerTurn && !state.gameOver) {
            this.endTurnBtn.classList.remove('disabled');
        } else {
            this.endTurnBtn.classList.add('disabled');
        }
    }
    
    showGameOver(winner) {
        this.gameOverOverlay.classList.add('active');
        
        if (winner === 'player') {
            this.resultText.textContent = '🎉 胜利！';
            this.resultText.className = 'win';
        } else {
            this.resultText.textContent = '💀 失败...';
            this.resultText.className = 'lose';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});
import { GameEngine } from './modules/GameEngine.js';
import { ROWS, COLS } from './modules/Map.js';

class GameUI {
    constructor() {
        this.game = new GameEngine();
        this.game.onStateChange = this.handleStateChange.bind(this);
        
        this.initElements();
        this.setupEventListeners();
    }

    initElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameOverOverlay = document.getElementById('game-over');
        this.mapGrid = document.getElementById('map-grid');
        this.playerHpBar = document.getElementById('player-hp');
        this.playerHpText = document.getElementById('player-hp-text');
        this.enemyHpBar = document.getElementById('enemy-hp');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.playerGoldText = document.getElementById('player-gold');
        this.enemyGoldText = document.getElementById('enemy-gold');
        this.unitInfo = document.getElementById('unit-info');
        this.resultText = document.getElementById('result-text');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.game.initGame();
        this.showScreen('game');
    }

    showScreen(screen) {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.gameOverOverlay.classList.remove('active');
        
        if (screen === 'start') {
            this.startScreen.classList.add('active');
        } else if (screen === 'game') {
            this.gameScreen.classList.add('active');
        }
    }

    renderMap(map, selectedUnit) {
        this.mapGrid.innerHTML = '';
        this.mapGrid.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
        this.mapGrid.style.gridTemplateRows = `repeat(${ROWS}, 40px)`;
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = map.getCell(x, y);
                const cellEl = document.createElement('div');
                cellEl.className = `cell ${cell.state}`;
                cellEl.dataset.x = x;
                cellEl.dataset.y = y;
                
                if (selectedUnit && selectedUnit.x === x && selectedUnit.y === y) {
                    cellEl.classList.add('selected');
                }
                
                if (cell.unit) {
                    const icon = document.createElement('div');
                    icon.className = 'cell-icon';
                    icon.textContent = cell.unit.icon;
                    cellEl.appendChild(icon);
                    
                    const hpBar = document.createElement('div');
                    hpBar.className = 'unit-hp';
                    const hpFill = document.createElement('div');
                    hpFill.className = 'unit-hp-fill';
                    hpFill.style.width = `${cell.unit.getHpPercent()}%`;
                    hpBar.appendChild(hpFill);
                    cellEl.appendChild(hpBar);
                } else if (cell.building) {
                    const icon = document.createElement('div');
                    icon.className = 'cell-icon';
                    icon.textContent = cell.building.icon;
                    cellEl.appendChild(icon);
                } else if (cell.state === 'player_castle' || cell.state === 'enemy_castle') {
                    const icon = document.createElement('div');
                    icon.className = 'cell-icon';
                    icon.textContent = '🏰';
                    cellEl.appendChild(icon);
                } else if (cell.state === 'unexplored') {
                    const icon = document.createElement('div');
                    icon.className = 'cell-icon';
                    icon.textContent = '?';
                    cellEl.appendChild(icon);
                }
                
                cellEl.addEventListener('click', () => this.game.clickCell(x, y));
                this.mapGrid.appendChild(cellEl);
            }
        }
    }

    updateUI(state) {
        this.playerHpBar.style.width = `${state.playerHp}%`;
        this.playerHpText.textContent = `${state.playerHp}%`;
        this.enemyHpBar.style.width = `${state.enemyHp}%`;
        this.enemyHpText.textContent = `${state.enemyHp}%`;
        this.playerGoldText.textContent = state.playerGold;
        this.enemyGoldText.textContent = state.enemyGold;
        
        if (state.selectedUnit) {
            const unit = state.selectedUnit;
            this.unitInfo.innerHTML = `
                <p><strong>${unit.icon} ${unit.name}</strong> - HP: ${unit.hp}/${unit.maxHp}</p>
                <p>攻击力: ${unit.attack} | 防御: ${unit.defense}</p>
                <p>移动范围: ${unit.moveRange} | 攻击范围: ${unit.attackRange}</p>
            `;
        } else {
            this.unitInfo.innerHTML = '<p>点击格子探索或选择单位</p>';
        }
        
        if (state.gameOver) {
            this.showGameOver(state.winner);
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

    handleStateChange(state) {
        this.renderMap(state.map, state.selectedUnit);
        this.updateUI(state);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});

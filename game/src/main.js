import { GameEngine } from './modules/GameEngine.js';
import { RACES, getAllRaceIds } from './modules/Races.js';
import { MAP_WIDTH, MAP_HEIGHT } from './modules/Map.js';

class GameUI {
    constructor() {
        this.game = new GameEngine();
        this.game.onStateChange = this.handleStateChange.bind(this);
        
        this.initElements();
        this.setupEventListeners();
        this.renderRaceSelection();
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
        this.playerRaceName = document.getElementById('player-race-name');
        this.unitInfo = document.getElementById('unit-info');
        this.resultText = document.getElementById('result-text');
        this.restartBtn = document.getElementById('restart-btn');
    }

    setupEventListeners() {
        this.restartBtn.addEventListener('click', () => {
            this.showScreen('start');
        });
    }

    renderRaceSelection() {
        const raceSelection = document.getElementById('race-selection');
        raceSelection.innerHTML = '';
        
        const raceIds = getAllRaceIds();
        raceIds.forEach(raceId => {
            const race = RACES[raceId];
            const card = document.createElement('div');
            card.className = 'race-card';
            card.dataset.raceId = raceId;
            
            card.innerHTML = `
                <div class="race-icon">${race.icon}</div>
                <div class="race-name">${race.name}</div>
                <div class="race-desc">${race.description}</div>
            `;
            
            card.addEventListener('click', () => this.selectRace(raceId));
            raceSelection.appendChild(card);
        });
    }

    selectRace(playerRace) {
        const raceIds = getAllRaceIds();
        const enemyRaces = raceIds.filter(id => id !== playerRace);
        const enemyRace = enemyRaces[Math.floor(Math.random() * enemyRaces.length)];
        
        this.game.initGame(playerRace, enemyRace);
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

    renderMap(state) {
        this.mapGrid.innerHTML = '';
        this.mapGrid.style.gridTemplateColumns = `repeat(${MAP_WIDTH}, 28px)`;
        this.mapGrid.style.gridTemplateRows = `repeat(${MAP_HEIGHT}, 28px)`;
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const cell = state.map.getCell(x, y);
                const cellEl = document.createElement('div');
                
                if (state.map.isEnemyZone(y)) {
                    cellEl.className = 'cell enemy-zone';
                } else if (state.map.isPlayerZone(y)) {
                    cellEl.className = 'cell player-zone';
                } else {
                    cellEl.className = 'cell';
                }
                
                if (cell.state === 'player_castle') {
                    cellEl.classList.add('player-castle', 'has-building');
                } else if (cell.state === 'enemy_castle') {
                    cellEl.classList.add('enemy-castle', 'has-building');
                }
                
                if (cell.unit) {
                    cellEl.classList.add('has-unit');
                    if (cell.unit.owner === 'enemy') {
                        cellEl.classList.add('enemy-unit');
                    }
                    
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
                }
                
                if (cell.building && !cell.unit) {
                    cellEl.classList.add('has-building');
                    
                    const icon = document.createElement('div');
                    icon.className = 'cell-icon';
                    icon.textContent = cell.building.icon;
                    cellEl.appendChild(icon);
                    
                    const hpBar = document.createElement('div');
                    hpBar.className = 'unit-hp';
                    const hpFill = document.createElement('div');
                    hpFill.className = 'unit-hp-fill';
                    hpFill.style.width = `${cell.building.getHpPercent()}%`;
                    hpBar.appendChild(hpFill);
                    cellEl.appendChild(hpBar);
                }
                
                cellEl.addEventListener('click', () => this.game.clickCell(x, y));
                this.mapGrid.appendChild(cellEl);
            }
        }
    }

    updateUI(state) {
        if (state.playerCastle) {
            const hpPercent = (state.playerCastle.hp / state.playerCastle.maxHp) * 100;
            this.playerHpBar.style.width = `${hpPercent}%`;
            this.playerHpText.textContent = `${Math.max(0, Math.floor(hpPercent))}%`;
        } else {
            this.playerHpBar.style.width = '0%';
            this.playerHpText.textContent = '0%';
        }
        
        if (state.enemyCastle) {
            const hpPercent = (state.enemyCastle.hp / state.enemyCastle.maxHp) * 100;
            this.enemyHpBar.style.width = `${hpPercent}%`;
            this.enemyHpText.textContent = `${Math.max(0, Math.floor(hpPercent))}%`;
        } else {
            this.enemyHpBar.style.width = '0%';
            this.enemyHpText.textContent = '0%';
        }
        
        this.playerGoldText.textContent = state.playerGold;
        this.enemyGoldText.textContent = state.enemyGold;
        
        if (state.playerRace) {
            const race = RACES[state.playerRace];
            this.playerRaceName.textContent = `${race.icon} ${race.name}主城`;
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
        this.renderMap(state);
        this.updateUI(state);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});

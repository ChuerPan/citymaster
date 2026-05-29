import { createUnit, createBuilding, createSkeleton } from './Units.js';
import { BattleSystem } from './Battle.js';
import { MAP_WIDTH, ENEMY_ZONE_END } from './Map.js';

export class GameAI {
    constructor(gameMap, raceId) {
        this.map = gameMap;
        this.raceId = raceId;
        this.battle = new BattleSystem(gameMap);
        this.gold = 100;
        this.buildCooldown = 0;
    }

    update(deltaTime) {
        this.gold += deltaTime * 0.1;
    }

    findBuildTargets() {
        const targets = [];
        for (let y = 0; y < ENEMY_ZONE_END; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const cell = this.map.getCell(x, y);
                if (cell && !cell.unit && !cell.building) {
                    targets.push(cell);
                }
            }
        }
        return targets;
    }

    getRandomUnitType() {
        const types = ['warrior', 'tank', 'archer', 'mage', 'summoner'];
        return types[Math.floor(Math.random() * types.length)];
    }

    spawnUnit(cell) {
        if (!cell || this.gold < 20) return null;
        
        const unitType = this.getRandomUnitType();
        const unit = createUnit(unitType, 'enemy', this.raceId, cell.x, cell.y);
        
        this.map.setUnit(cell.x, cell.y, unit);
        this.gold -= 20;
        
        return unit;
    }

    autoBuild() {
        if (this.gold < 20) return null;
        
        const targets = this.findBuildTargets();
        if (targets.length === 0) return null;
        
        const target = targets[Math.floor(Math.random() * targets.length)];
        return this.spawnUnit(target);
    }

    processUnit(unit, currentTime, playerUnits, enemyCastle) {
        if (unit.isBuilding) return null;
        if (!unit.canAct(currentTime)) return null;

        const enemies = playerUnits;
        
        if (unit.attack > 0 && enemies.length > 0) {
            const target = this.battle.findTarget(unit, enemies);
            
            if (target) {
                const dist = this.map.getDistance(unit.x, unit.y, target.x, target.y);
                
                if (dist <= unit.attackRange) {
                    if (unit.aoeRange > 0) {
                        return { type: 'aoe_attack', unit, target, aoeRange: unit.aoeRange };
                    }
                    return { type: 'attack', unit, target };
                } else {
                    const moveTarget = this.battle.findMoveTarget(unit, target);
                    if (moveTarget) {
                        return { type: 'move', unit, target: moveTarget };
                    }
                }
            } else {
                const dist = this.map.getDistance(unit.x, unit.y, enemyCastle.x, enemyCastle.y);
                if (dist <= unit.attackRange) {
                    return { type: 'attack_castle', unit, target: enemyCastle };
                } else {
                    const moveTarget = this.battle.findMoveTarget(unit, enemyCastle);
                    if (moveTarget) {
                        return { type: 'move', unit, target: moveTarget };
                    }
                }
            }
        }
        
        if (unit.moveSpeed > 0) {
            const moveTarget = this.battle.findMoveTarget(unit, enemyCastle);
            if (moveTarget) {
                return { type: 'move', unit, target: moveTarget };
            }
        }
        
        return null;
    }

    processSummoner(unit, currentTime, allUnits) {
        if (!unit.canSummon) return null;
        if (!unit.canSummonUnit(currentTime)) return null;
        
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
            return { type: 'summon', unit, target: skeleton };
        }
        
        return null;
    }
}

import { MAP_WIDTH, MAP_HEIGHT } from './Map.js';

export class BattleSystem {
    constructor(gameMap) {
        this.map = gameMap;
    }

    findTarget(unit, enemies) {
        if (enemies.length === 0) return null;

        // 优先攻击召唤物
        if (unit.attackPriority === 'summon') {
            const summonTargets = enemies.filter(e => e.isSummoned);
            if (summonTargets.length > 0) {
                return this.selectTargetByPriority(unit, summonTargets);
            }
        }

        return this.selectTargetByPriority(unit, enemies);
    }

    selectTargetByPriority(unit, enemies) {
        switch (unit.attackPriority) {
            case 'nearest':
                return this.findNearestTarget(unit, enemies);
            case 'farthest':
                return this.findFarthestTarget(unit, enemies);
            case 'weakest':
                return this.findWeakestTarget(enemies);
            case 'strongest':
                return this.findStrongestTarget(enemies);
            default:
                return enemies[0];
        }
    }

    findNearestTarget(unit, enemies) {
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = this.map.getManhattanDistance(unit.x, unit.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    findFarthestTarget(unit, enemies) {
        let farthest = null;
        let maxDist = 0;

        for (const enemy of enemies) {
            const dist = this.map.getManhattanDistance(unit.x, unit.y, enemy.x, enemy.y);
            if (dist > maxDist) {
                maxDist = dist;
                farthest = enemy;
            }
        }
        return farthest;
    }

    findWeakestTarget(enemies) {
        return enemies.reduce((weakest, enemy) => 
            enemy.hp < weakest.hp ? enemy : weakest
        );
    }

    findStrongestTarget(enemies) {
        return enemies.reduce((strongest, enemy) => 
            enemy.hp > strongest.hp ? enemy : strongest
        );
    }

    findCastleTarget(owner) {
        if (owner === 'player') {
            return this.map.enemyCastle;
        } else {
            return this.map.playerCastle;
        }
    }

    canAttackTarget(unit, targetX, targetY) {
        const dist = this.map.getDistance(unit.x, unit.y, targetX, targetY);
        return dist <= unit.attackRange && dist > 0;
    }

    executeAttack(attacker, defender) {
        if (!attacker || !defender) return null;

        const damage = attacker.attack;
        const actualDamage = defender.takeDamage(damage);
        
        attacker.markAction(Date.now());

        return {
            attacker,
            defender,
            damage: actualDamage,
            killed: !defender.isAlive()
        };
    }

    executeAOEDamage(attacker, targetX, targetY, enemies, aoeRange) {
        const results = [];
        
        for (const enemy of enemies) {
            const dist = this.map.getDistance(targetX, targetY, enemy.x, enemy.y);
            if (dist <= aoeRange) {
                const result = this.executeAttack(attacker, enemy);
                if (result) {
                    results.push(result);
                }
            }
        }
        
        return results;
    }

    findMoveTarget(unit, targetCastle) {
        const emptyCells = [];
        
        for (let dy = -unit.moveSpeed; dy <= unit.moveSpeed; dy++) {
            for (let dx = -unit.moveSpeed; dx <= unit.moveSpeed; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= unit.moveSpeed && dist > 0) {
                    const nx = unit.x + dx;
                    const ny = unit.y + dy;
                    
                    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                    
                    const cell = this.map.getCell(nx, ny);
                    if (cell && !cell.unit && !cell.building) {
                        emptyCells.push({ x: nx, y: ny, dist });
                    }
                }
            }
        }
        
        if (emptyCells.length === 0) return null;

        emptyCells.sort((a, b) => {
            const distA = this.map.getManhattanDistance(a.x, a.y, targetCastle.x, targetCastle.y);
            const distB = this.map.getManhattanDistance(b.x, b.y, targetCastle.x, targetCastle.y);
            return distA - distB;
        });

        return emptyCells[0];
    }
}

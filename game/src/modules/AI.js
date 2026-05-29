import { createUnit } from './Units.js';
import { RACES } from './Races.js';

export class GameAI {
    constructor(raceId) {
        this.race = RACES[raceId] || RACES.human;
        this.gold = 100;
        this.units = [];
        this.turn = 0;
        this.strategy = this.selectStrategy();
    }
    
    selectStrategy() {
        const strategies = ['balanced', 'aggressive', 'defensive', 'spammer'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }
    
    updateGold() {
        this.gold += 8 + this.turn * 2;
        if (this.gold > 200) this.gold = 200;
    }
    
    decideAction(playerUnits, playerHp, enemyHp) {
        this.turn++;
        this.updateGold();
        
        const actions = [];
        
        const canAfford = this.race.units.filter(unitId => {
            const unitData = { swordsman: { cost: 10 }, archer: { cost: 15 }, knight: { cost: 25 }, mage: { cost: 30 },
                              grunt: { cost: 8 }, troll: { cost: 20 }, orc_warrior: { cost: 12 }, shaman: { cost: 28 },
                              ranger: { cost: 18 }, hunter: { cost: 22 }, druid: { cost: 25 }, phoenix: { cost: 35 },
                              shadow: { cost: 15 }, lich: { cost: 32 }, demon: { cost: 28 }, dragon: { cost: 45 } }[unitId];
            return unitData && this.gold >= unitData.cost;
        });
        
        if (canAfford.length > 0) {
            const choice = this.selectUnitToSpawn(canAfford, playerUnits);
            if (choice) {
                actions.push({ type: 'spawn', unitId: choice });
                const unitData = { swordsman: { cost: 10 }, archer: { cost: 15 }, knight: { cost: 25 }, mage: { cost: 30 },
                                  grunt: { cost: 8 }, troll: { cost: 20 }, orc_warrior: { cost: 12 }, shaman: { cost: 28 },
                                  ranger: { cost: 18 }, hunter: { cost: 22 }, druid: { cost: 25 }, phoenix: { cost: 35 },
                                  shadow: { cost: 15 }, lich: { cost: 32 }, demon: { cost: 28 }, dragon: { cost: 45 } }[choice];
                this.gold -= unitData.cost;
            }
        }
        
        return actions;
    }
    
    selectUnitToSpawn(affordableUnits, playerUnits) {
        let preferredUnit = null;
        
        switch (this.strategy) {
            case 'aggressive':
                preferredUnit = affordableUnits.find(u => ['dragon', 'lich', 'phoenix', 'troll', 'knight', 'orc_warrior', 'demon'].includes(u));
                if (!preferredUnit) preferredUnit = affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
                break;
                
            case 'defensive':
                preferredUnit = affordableUnits.find(u => ['knight', 'troll', 'demon', 'druid'].includes(u));
                if (!preferredUnit) preferredUnit = affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
                break;
                
            case 'spammer':
                preferredUnit = affordableUnits.reduce((prev, curr) => {
                    const costs = { swordsman: 10, archer: 15, knight: 25, mage: 30,
                                    grunt: 8, troll: 20, orc_warrior: 12, shaman: 28,
                                    ranger: 18, hunter: 22, druid: 25, phoenix: 35,
                                    shadow: 15, lich: 32, demon: 28, dragon: 45 };
                    return (costs[prev] || 100) < (costs[curr] || 100) ? prev : curr;
                });
                break;
                
            default:
                const meleeCount = playerUnits.filter(u => ['melee'].includes(u.attackType)).length;
                const rangedCount = playerUnits.filter(u => ['ranged', 'magic'].includes(u.attackType)).length;
                
                if (rangedCount > meleeCount * 1.5) {
                    preferredUnit = affordableUnits.find(u => ['grunt', 'swordsman', 'orc_warrior', 'shadow'].includes(u));
                } else if (meleeCount > rangedCount * 1.5) {
                    preferredUnit = affordableUnits.find(u => ['archer', 'mage', 'shaman', 'ranger', 'lich'].includes(u));
                }
                
                if (!preferredUnit) {
                    preferredUnit = affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
                }
                break;
        }
        
        return preferredUnit;
    }
    
    spawnUnit(unitId) {
        const unit = createUnit(unitId, 'enemy');
        this.units.push(unit);
        return unit;
    }
}
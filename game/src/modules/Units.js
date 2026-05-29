// 角色模板
export const UNIT_TEMPLATES = {
    // 近战兵
    warrior: {
        id: 'warrior',
        name: '近战兵',
        icon: '⚔️',
        hp: 50,
        attack: 2,
        defense: 2,
        attackRange: 1,
        attackSpeed: 1000,      // 1秒1下
        moveSpeed: 8,          // 移动速度8
        attackPriority: 'nearest',
        isBuilding: false,
        canSummon: false
    },
    
    // 近战肉盾兵
    tank: {
        id: 'tank',
        name: '肉盾兵',
        icon: '🛡️',
        hp: 100,
        attack: 1,
        defense: 4,
        attackRange: 1,
        attackSpeed: 2000,      // 2秒1下
        moveSpeed: 5,          // 移动速度5
        attackPriority: 'nearest',
        isBuilding: false,
        canSummon: false
    },
    
    // 远程兵
    archer: {
        id: 'archer',
        name: '远程兵',
        icon: '🏹',
        hp: 30,
        attack: 1,
        defense: 1,
        attackRange: 5,
        attackSpeed: 1000,      // 1秒1下
        moveSpeed: 7,          // 移动速度7
        attackPriority: 'farthest',
        isBuilding: false,
        canSummon: false
    },
    
    // 魔法兵
    mage: {
        id: 'mage',
        name: '魔法兵',
        icon: '🔮',
        hp: 20,
        attack: 1,
        defense: 1,
        attackRange: 4,
        attackSpeed: 2000,      // 2秒1下
        moveSpeed: 5,          // 移动速度5
        attackPriority: 'summon', // 优先召唤物
        aoeRange: 2,           // 2格范围伤害
        isBuilding: false,
        canSummon: false
    },
    
    // 召唤兵
    summoner: {
        id: 'summoner',
        name: '召唤兵',
        icon: '💫',
        hp: 10,
        attack: 1,
        defense: 1,
        attackRange: 1,
        attackSpeed: 3000,      // 3秒1下
        moveSpeed: 5,          // 移动速度5
        attackPriority: 'nearest',
        isBuilding: false,
        canSummon: true,
        summonCooldown: 5000,   // 5秒召唤1只
        summonType: 'skeleton'
    }
};

// 建筑模板
export const BUILDING_TEMPLATES = {
    // 主城
    castle: {
        id: 'castle',
        name: '主城',
        icon: '🏰',
        hp: 500,
        attack: 1,
        defense: 1,
        attackRange: 5,
        attackSpeed: 1000,      // 1秒1下
        attackPriority: 'nearest',
        isBuilding: true,
        goldInterval: 5000,     // 5秒
        goldAmount: 10          // 产出10金币
    },
    
    // 矿场
    mine: {
        id: 'mine',
        name: '矿场',
        icon: '⛏️',
        hp: 40,
        attack: 0,
        defense: 1,
        attackRange: 0,
        attackSpeed: 0,
        isBuilding: true,
        goldInterval: 5000,     // 5秒
        goldAmount: 100        // 产出100金币
    },
    
    // 箭塔
    tower: {
        id: 'tower',
        name: '箭塔',
        icon: '🗼',
        hp: 10,
        attack: 1,
        defense: 1,
        attackRange: 5,
        attackSpeed: 1000,      // 1秒1下
        attackPriority: 'nearest',
        isBuilding: true
    }
};

// 骷髅（召唤物）
export const SKELETON = {
    id: 'skeleton',
    name: '骷髅',
    icon: '💀',
    hp: 5,
    attack: 1,
    defense: 1,
    attackRange: 1,
    attackSpeed: 1000,      // 1秒1下
    moveSpeed: 10,         // 移动速度10
    attackPriority: 'nearest',
    isBuilding: false,
    isSummoned: true
};

export class Unit {
    constructor(template, owner, raceId) {
        this.id = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.templateId = template.id;
        this.name = template.name;
        this.icon = template.icon;
        this.owner = owner;
        this.raceId = raceId;
        
        this.maxHp = template.hp;
        this.hp = template.hp;
        this.attack = template.attack;
        this.defense = template.defense;
        this.attackRange = template.attackRange;
        this.attackSpeed = template.attackSpeed;
        this.moveSpeed = template.moveSpeed || 0;
        this.attackPriority = template.attackPriority;
        this.aoeRange = template.aoeRange || 0;
        this.canSummon = template.canSummon || false;
        this.summonType = template.summonType || null;
        this.summonCooldown = template.summonCooldown || 0;
        this.isBuilding = template.isBuilding || false;
        this.isSummoned = template.isSummoned || false;
        
        this.goldInterval = template.goldInterval || 0;
        this.goldAmount = template.goldAmount || 0;
        
        this.x = 0;
        this.y = 0;
        this.lastActionTime = 0;
        this.lastSummonTime = 0;
        this.lastGoldTime = 0;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp -= actualDamage;
        return actualDamage;
    }

    isAlive() {
        return this.hp > 0;
    }

    getHpPercent() {
        return Math.max(0, (this.hp / this.maxHp) * 100);
    }

    canAct(currentTime) {
        return currentTime - this.lastActionTime >= this.attackSpeed;
    }

    canSummonUnit(currentTime) {
        if (!this.canSummon) return false;
        return currentTime - this.lastSummonTime >= this.summonCooldown;
    }

    canProduceGold(currentTime) {
        if (this.goldInterval === 0) return false;
        return currentTime - this.lastGoldTime >= this.goldInterval;
    }

    markAction(currentTime) {
        this.lastActionTime = currentTime;
    }

    markSummon(currentTime) {
        this.lastSummonTime = currentTime;
    }

    markGoldProduction(currentTime) {
        this.lastGoldTime = currentTime;
    }
}

// 工厂函数创建单位
export function createUnit(templateId, owner, raceId, x, y) {
    const template = UNIT_TEMPLATES[templateId];
    if (!template) return null;
    
    const unit = new Unit(template, owner, raceId);
    unit.x = x;
    unit.y = y;
    return unit;
}

// 工厂函数创建建筑
export function createBuilding(templateId, owner, raceId, x, y) {
    const template = BUILDING_TEMPLATES[templateId];
    if (!template) return null;
    
    const building = new Unit(template, owner, raceId);
    building.x = x;
    building.y = y;
    return building;
}

// 创建骷髅
export function createSkeleton(owner, raceId, x, y) {
    const skeleton = new Unit(SKELETON, owner, raceId);
    skeleton.x = x;
    skeleton.y = y;
    return skeleton;
}

export const UNITS = {
    infantry: {
        id: 'infantry',
        name: '步兵',
        icon: '⚔️',
        hp: 80,
        attack: 20,
        defense: 5,
        attackRange: 1,
        moveRange: 2,
        attackPriority: 'nearest',
        description: '近战步兵，攻击力平衡'
    },
    archer: {
        id: 'archer',
        name: '弓箭手',
        icon: '🏹',
        hp: 50,
        attack: 25,
        defense: 2,
        attackRange: 4,
        moveRange: 2,
        attackPriority: 'farthest',
        description: '远程单位，优先攻击远处敌人'
    },
    cavalry: {
        id: 'cavalry',
        name: '骑兵',
        icon: '🐴',
        hp: 100,
        attack: 25,
        defense: 8,
        attackRange: 1,
        moveRange: 4,
        attackPriority: 'nearest',
        description: '高机动性近战单位'
    },
    mage: {
        id: 'mage',
        name: '法师',
        icon: '🧙',
        hp: 60,
        attack: 35,
        defense: 1,
        attackRange: 3,
        moveRange: 2,
        attackPriority: 'weakest',
        description: '魔法攻击，优先攻击血量低的'
    },
    tank: {
        id: 'tank',
        name: '盾兵',
        icon: '🛡️',
        hp: 150,
        attack: 15,
        defense: 15,
        attackRange: 1,
        moveRange: 1,
        attackPriority: 'nearest',
        description: '高防御单位，保护其他单位'
    },
    assassin: {
        id: 'assassin',
        name: '刺客',
        icon: '🗡️',
        hp: 40,
        attack: 40,
        defense: 2,
        attackRange: 1,
        moveRange: 3,
        attackPriority: 'strongest',
        description: '高爆发，优先攻击高血量'
    }
};

export class Unit {
    constructor(unitType, owner, x, y) {
        const template = UNITS[unitType];
        this.id = `${unitType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = unitType;
        this.name = template.name;
        this.icon = template.icon;
        this.owner = owner;
        this.maxHp = template.hp;
        this.hp = template.hp;
        this.attack = template.attack;
        this.defense = template.defense;
        this.attackRange = template.attackRange;
        this.moveRange = template.moveRange;
        this.attackPriority = template.attackPriority;
        this.x = x;
        this.y = y;
        this.hasMoved = false;
        this.hasAttacked = false;
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

    resetTurn() {
        this.hasMoved = false;
        this.hasAttacked = false;
    }
}

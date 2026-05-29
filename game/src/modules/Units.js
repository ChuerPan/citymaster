export const UNITS = {
    swordsman: {
        id: 'swordsman',
        name: '剑士',
        icon: '⚔️',
        cost: 10,
        hp: 80,
        attack: 15,
        defense: 5,
        attackType: 'melee',
        attackRange: 1,
        description: '普通近战单位，攻防均衡'
    },
    archer: {
        id: 'archer',
        name: '弓箭手',
        icon: '🏹',
        cost: 15,
        hp: 50,
        attack: 20,
        defense: 2,
        attackType: 'ranged',
        attackRange: 3,
        description: '远程攻击单位'
    },
    knight: {
        id: 'knight',
        name: '骑士',
        icon: '🛡️',
        cost: 25,
        hp: 120,
        attack: 25,
        defense: 10,
        attackType: 'melee',
        attackRange: 1,
        description: '重装骑兵，高攻防'
    },
    mage: {
        id: 'mage',
        name: '法师',
        icon: '🧙',
        cost: 30,
        hp: 60,
        attack: 35,
        defense: 1,
        attackType: 'magic',
        attackRange: 2,
        description: '魔法攻击，无视部分防御'
    },
    grunt: {
        id: 'grunt',
        name: '兽人步兵',
        icon: '🪓',
        cost: 8,
        hp: 90,
        attack: 18,
        defense: 3,
        attackType: 'melee',
        attackRange: 1,
        description: '高血量近战单位'
    },
    troll: {
        id: 'troll',
        name: '巨魔',
        icon: '👺',
        cost: 20,
        hp: 150,
        attack: 22,
        defense: 6,
        attackType: 'melee',
        attackRange: 1,
        description: '巨型单位，血量极高'
    },
    orc_warrior: {
        id: 'orc_warrior',
        name: '兽人战士',
        icon: '⚔️',
        cost: 12,
        hp: 70,
        attack: 22,
        defense: 4,
        attackType: 'melee',
        attackRange: 1,
        description: '攻击力较高的近战单位'
    },
    shaman: {
        id: 'shaman',
        name: '萨满',
        icon: '🔮',
        cost: 28,
        hp: 65,
        attack: 30,
        defense: 2,
        attackType: 'magic',
        attackRange: 2,
        description: '萨满法师，群体攻击'
    },
    ranger: {
        id: 'ranger',
        name: '游侠',
        icon: '🎯',
        cost: 18,
        hp: 55,
        attack: 25,
        defense: 3,
        attackType: 'ranged',
        attackRange: 4,
        description: '远程单位，攻击距离远'
    },
    hunter: {
        id: 'hunter',
        name: '猎人',
        icon: '🐺',
        cost: 22,
        hp: 70,
        attack: 28,
        defense: 4,
        attackType: 'ranged',
        attackRange: 3,
        description: '召唤野兽协同作战'
    },
    druid: {
        id: 'druid',
        name: '德鲁伊',
        icon: '🌿',
        cost: 25,
        hp: 80,
        attack: 20,
        defense: 5,
        attackType: 'magic',
        attackRange: 2,
        description: '自然魔法，可以治疗'
    },
    phoenix: {
        id: 'phoenix',
        name: '凤凰',
        icon: '🔥',
        cost: 35,
        hp: 100,
        attack: 32,
        defense: 4,
        attackType: 'ranged',
        attackRange: 3,
        description: '火焰攻击，可复活一次'
    },
    shadow: {
        id: 'shadow',
        name: '暗影刺客',
        icon: '🥷',
        cost: 15,
        hp: 45,
        attack: 30,
        defense: 1,
        attackType: 'melee',
        attackRange: 1,
        description: '高爆发伤害'
    },
    lich: {
        id: 'lich',
        name: '巫妖王',
        icon: '💀',
        cost: 32,
        hp: 75,
        attack: 38,
        defense: 3,
        attackType: 'magic',
        attackRange: 2,
        description: '亡灵魔法，伤害极高'
    },
    demon: {
        id: 'demon',
        name: '恶魔',
        icon: '😈',
        cost: 28,
        hp: 110,
        attack: 26,
        defense: 7,
        attackType: 'melee',
        attackRange: 1,
        description: '强大的恶魔战士'
    },
    dragon: {
        id: 'dragon',
        name: '黑龙',
        icon: '🐉',
        cost: 45,
        hp: 180,
        attack: 40,
        defense: 12,
        attackType: 'magic',
        attackRange: 2,
        description: '终极单位，攻防兼备'
    }
};

export function getUnitData(unitId) {
    return UNITS[unitId] || UNITS.swordsman;
}

export function createUnit(unitId, owner) {
    const template = getUnitData(unitId);
    return {
        ...template,
        instanceId: `${unitId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner,
        currentHp: template.hp,
        position: 0
    };
}
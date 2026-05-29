export const RACES = {
    human: {
        name: '人族',
        description: '均衡发展，攻守兼备',
        icon: '👤',
        units: ['swordsman', 'archer', 'knight', 'mage']
    },
    orc: {
        name: '兽族',
        description: '勇猛善战，攻击力强',
        icon: '👹',
        units: ['grunt', 'troll', 'orc_warrior', 'shaman']
    },
    elf: {
        name: '精灵',
        description: '敏捷灵活，远程攻击',
        icon: '🧝',
        units: ['ranger', 'hunter', 'druid', 'phoenix']
    },
    night: {
        name: '暗夜',
        description: '神秘强大，魔法攻击',
        icon: '🌙',
        units: ['shadow', 'lich', 'demon', 'dragon']
    }
};

export function getRaceData(raceId) {
    return RACES[raceId] || RACES.human;
}
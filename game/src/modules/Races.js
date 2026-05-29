export const RACES = {
    human: {
        id: 'human',
        name: '人族',
        description: '均衡发展，攻守兼备',
        icon: '👤'
    },
    orc: {
        id: 'orc',
        name: '兽族',
        description: '勇猛善战，攻击力强',
        icon: '👹'
    },
    undead: {
        id: 'undead',
        name: '亡灵族',
        description: '召唤骷髅，源源不断',
        icon: '💀'
    },
    elf: {
        id: 'elf',
        name: '精灵族',
        description: '敏捷灵活，远程攻击',
        icon: '🧝'
    }
};

export function getRaceData(raceId) {
    return RACES[raceId] || RACES.human;
}

export function getAllRaceIds() {
    return Object.keys(RACES);
}

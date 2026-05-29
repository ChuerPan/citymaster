export function calculateDamage(attacker, defender) {
    let damage = attacker.attack;
    
    if (attacker.attackType === 'magic') {
        damage = Math.floor(attacker.attack * (1 + (defender.defense * 0.1)));
    } else {
        damage = Math.max(1, attacker.attack - defender.defense);
    }
    
    const variance = 0.2;
    const randomFactor = 1 + (Math.random() * variance * 2 - variance);
    damage = Math.floor(damage * randomFactor);
    
    return damage;
}

export function canAttack(attacker, defender, attackerUnits, defenderUnits) {
    if (attacker.attackType === 'ranged' || attacker.attackType === 'magic') {
        return defenderUnits.length > 0;
    }
    
    return defenderUnits.length > 0;
}

export function findTarget(attacker, attackerUnits, defenderUnits) {
    if (defenderUnits.length === 0) return null;
    
    const attackerIndex = attackerUnits.indexOf(attacker);
    
    if (attacker.attackType === 'ranged' || attacker.attackType === 'magic') {
        return defenderUnits[0];
    }
    
    return defenderUnits[0];
}

export function executeAttack(attacker, defender) {
    const damage = calculateDamage(attacker, defender);
    defender.currentHp -= damage;
    
    return {
        damage,
        killed: defender.currentHp <= 0
    };
}

export function checkVictory(playerUnits, enemyUnits, playerHp, enemyHp) {
    if (enemyHp <= 0) return 'player';
    if (playerHp <= 0) return 'enemy';
    return null;
}
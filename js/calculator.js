function calculateUpgradeFeasibility(currentResources, upgradeCost, selectableChests) {
    const initialDeficit = {
        food: Math.max(0, (upgradeCost.food || 0) - (currentResources.food || 0)),
        wood: Math.max(0, (upgradeCost.wood || 0) - (currentResources.wood || 0)),
        stone: Math.max(0, (upgradeCost.stone || 0) - (currentResources.stone || 0)),
        gold: Math.max(0, (upgradeCost.gold || 0) - (currentResources.gold || 0)),
    };

    let remainingDeficit = { ...initialDeficit };
    let chestsToUse = { ...selectableChests };
    const chestAllocation = {
        level1: { food: 0, wood: 0, stone: 0, gold: 0 },
        level2: { food: 0, wood: 0, stone: 0, gold: 0 },
        level3: { food: 0, wood: 0, stone: 0, gold: 0 },
        level4: { food: 0, wood: 0, stone: 0, gold: 0 },
    };

    const resourcePriority = ['gold', 'stone', 'wood', 'food'];
    const chestLevelPriority = ['level4', 'level3', 'level2', 'level1'];

    resourcePriority.forEach(resource => {
        if (remainingDeficit[resource] > 0) {
            chestLevelPriority.forEach(level => {
                const resourceValuePerChest = CHEST_VALUES[level][resource];
                if (resourceValuePerChest > 0) {
                    while (remainingDeficit[resource] > 0 && chestsToUse[level] > 0) {
                        chestsToUse[level]--;
                        chestAllocation[level][resource]++;
                        remainingDeficit[resource] -= resourceValuePerChest;
                    }
                }
            });
        }
    });
    
    const finalDeficit = {};
    let isSufficient = true;
    for (const resource in remainingDeficit) {
        if (remainingDeficit[resource] > 0) {
            isSufficient = false;
            finalDeficit[resource] = Math.ceil(remainingDeficit[resource]);
        }
    }

    return {
        isSufficient,
        initialDeficit,
        finalDeficit,
        chestAllocation,
        remainingChests: chestsToUse
    };
}

function calculateSpeedupFeasibility(currentSpeedups, upgradeCost, selectableSpeedupChests, buffs) {
    const upgradeType = upgradeCost.type;
    let initialTimeCost = upgradeCost.value;

    if (!upgradeType || initialTimeCost <= 0) {
        return { isSufficient: true, wasNeeded: false };
    }

    // Apply buffs
    const speedBuff = buffs.speedBuffPercent || 0;
    const allianceHelps = buffs.allianceHelps || 0;
    
    let timeAfterBuffs = initialTimeCost;
    if (speedBuff > 0) {
        timeAfterBuffs /= (1 + speedBuff / 100);
    }
    if (allianceHelps > 0) {
        // As per user request: each help reduces current time by dividing by 1.01
        timeAfterBuffs /= Math.pow(1.01, allianceHelps);
    }

    const specificSpeedups = currentSpeedups[upgradeType] || 0;
    const generalSpeedups = currentSpeedups.general || 0;
    const totalApplicableSpeedups = specificSpeedups + generalSpeedups;

    const initialDeficit = Math.max(0, timeAfterBuffs - totalApplicableSpeedups);

    if (initialDeficit === 0) {
        return { isSufficient: true, wasNeeded: true, timeAfterBuffs: Math.floor(timeAfterBuffs), initialDeficit: 0, finalDeficit: {}, chestAllocation: {}, remainingChests: selectableSpeedupChests };
    }

    let remainingDeficit = initialDeficit;
    let chestsToUse = { ...selectableSpeedupChests };
    const chestAllocation = {
        level2: 0,
        level3: 0,
        level4: 0
    };
    
    const chestLevelPriority = ['level4', 'level3', 'level2'];

    chestLevelPriority.forEach(level => {
        const timeValuePerChest = SPEEDUP_CHEST_VALUES[level];
        if (timeValuePerChest > 0) {
            while (remainingDeficit > 0 && chestsToUse[level] > 0) {
                chestsToUse[level]--;
                chestAllocation[level]++;
                remainingDeficit -= timeValuePerChest;
            }
        }
    });

    const finalDeficit = (remainingDeficit > 0) ? Math.ceil(remainingDeficit) : 0;
    const isSufficient = finalDeficit === 0;

    return {
        isSufficient,
        wasNeeded: true,
        timeAfterBuffs: Math.floor(timeAfterBuffs),
        initialDeficit,
        finalDeficit: isSufficient ? {} : { time: finalDeficit },
        chestAllocation,
        remainingChests: chestsToUse
    };
} 
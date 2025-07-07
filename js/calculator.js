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
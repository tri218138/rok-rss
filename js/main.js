document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');

    const getChestCount = (id) => {
        const value = document.getElementById(id).value;
        return parseInt(value, 10) || 0;
    };

    const parseResourceValue = (strValue) => {
        if (!strValue) return 0;
        const value = strValue.trim().toLowerCase();
        const lastChar = value.slice(-1);
        let num = parseFloat(value);

        if (isNaN(num)) return 0;

        if (lastChar === 'k') {
            num *= 1000;
        } else if (lastChar === 'm') {
            num *= 1000000;
        } else if (lastChar === 'b') {
            num *= 1000000000;
        }

        return Math.floor(num);
    };

    const getResourceInputValue = (id) => {
        const value = document.getElementById(id).value;
        return parseResourceValue(value);
    };

    const displayResult = (result) => {
        const resultContainer = document.getElementById('result-container');
        const resultMessage = document.getElementById('result-message');
        const resultDetails = document.getElementById('result-details');

        resultContainer.classList.remove('hidden');
        resultDetails.innerHTML = '';
        resultMessage.classList.remove('success', 'failure');

        if (result.isSufficient) {
            resultMessage.textContent = 'Congratulations! You can afford the upgrade by using your chests as follows:';
            resultMessage.classList.add('success');
            
            const allocationHtml = generateAllocationHtml(result.chestAllocation, result.remainingChests);
            resultDetails.innerHTML = allocationHtml;

        } else {
            resultMessage.textContent = 'You do not have enough resources. Final deficit listed below:';
            resultMessage.classList.add('failure');

            for (const resource in result.finalDeficit) {
                const item = document.createElement('div');
                item.className = 'deficit-item';
                item.textContent = `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${result.finalDeficit[resource].toLocaleString()}`;
                resultDetails.appendChild(item);
            }
        }
    };

    const generateAllocationHtml = (allocation, remaining) => {
        let html = '<h3>Chest Allocation Plan:</h3>';
        let usedAtLeastOne = false;

        for (const level in allocation) {
            for (const resource in allocation[level]) {
                const count = allocation[level][resource];
                if (count > 0) {
                    usedAtLeastOne = true;
                    html += `<div class="allocation-item">Use <strong>${count.toLocaleString()}</strong> x ${level.replace('l', 'L')} chest(s) for <strong>${resource.charAt(0).toUpperCase() + resource.slice(1)}</strong></div>`;
                }
            }
        }

        if (!usedAtLeastOne) {
            html += '<p>No selectable chests were needed for this upgrade.</p>';
        }

        html += '<h3>Remaining Chests:</h3>';
        let remainingAtLeastOne = false;
        for (const level in remaining) {
             const count = remaining[level];
             if (count > 0) {
                 remainingAtLeastOne = true;
                 html += `<div class="remaining-item">${level.replace('l', 'L')}: <strong>${count.toLocaleString()}</strong> left</div>`;
             }
        }
        if (!remainingAtLeastOne) {
            html += '<p>All selectable chests were used.</p>';
        }


        return html;
    };

    calculateBtn.addEventListener('click', () => {
        const currentResources = {
            food: getResourceInputValue('current-food'),
            wood: getResourceInputValue('current-wood'),
            stone: getResourceInputValue('current-stone'),
            gold: getResourceInputValue('current-gold'),
        };

        const selectableChests = {
            level1: getChestCount('level1-chests'),
            level2: getChestCount('level2-chests'),
            level3: getChestCount('level3-chests'),
            level4: getChestCount('level4-chests'),
        };

        const upgradeCost = {
            food: getResourceInputValue('cost-food'),
            wood: getResourceInputValue('cost-wood'),
            stone: getResourceInputValue('cost-stone'),
            gold: getResourceInputValue('cost-gold'),
        };

        const result = calculateUpgradeFeasibility(currentResources, upgradeCost, selectableChests);

        displayResult(result);
    });
}); 
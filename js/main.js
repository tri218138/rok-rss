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

    const parseTimeValue = (strValue) => {
        if (!strValue) return 0;
        const parts = strValue.trim().toLowerCase().split(/\s+/);
        let totalMinutes = 0;

        parts.forEach(part => {
            const lastChar = part.slice(-1);
            const num = parseFloat(part);
            if (isNaN(num)) return;

            if (lastChar === 'd') {
                totalMinutes += num * 24 * 60;
            } else if (lastChar === 'h') {
                totalMinutes += num * 60;
            } else if (lastChar === 'm') {
                totalMinutes += num;
            } else if (!isNaN(parseFloat(lastChar))) {
                totalMinutes += num;
            }
        });

        return Math.floor(totalMinutes);
    };

    const getResourceInputValue = (id) => parseResourceValue(document.getElementById(id).value);
    const getTimeInputValue = (id) => parseTimeValue(document.getElementById(id).value);

    const displayResult = (resourceResult, speedupResult) => {
        const resultContainer = document.getElementById('result-container');
        const resourceResultDiv = document.getElementById('resource-result');
        const speedupResultDiv = document.getElementById('speedup-result');
        const divider = document.getElementById('result-divider');

        resultContainer.classList.remove('hidden');
        resourceResultDiv.innerHTML = generateResourceResultHtml(resourceResult);
        
        if (speedupResult.wasNeeded) {
            speedupResultDiv.innerHTML = generateSpeedupResultHtml(speedupResult);
            speedupResultDiv.classList.remove('hidden');
            divider.classList.remove('hidden');
        } else {
            speedupResultDiv.classList.add('hidden');
            divider.classList.add('hidden');
        }
    };

    const generateResourceResultHtml = (result) => {
        let html = '<h3>Resources</h3><p id="result-message-resources"';
        if (result.isSufficient) {
            html += ' class="success">Congratulations! You have enough resources.</p>';
            html += generateAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += ' class="failure">You do not have enough resources. Final deficit:</p>';
            html += '<div class="deficit-details">';
            for (const resource in result.finalDeficit) {
                html += `<div class="deficit-item">${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${result.finalDeficit[resource].toLocaleString()}</div>`;
            }
            html += '</div>';
        }
        return html;
    };

    const generateSpeedupResultHtml = (result) => {
        let html = '<h3>Speedups</h3><p id="result-message-speedups"';
        if (result.isSufficient) {
            html += ' class="success">Congratulations! You have enough speedups.</p>';
            html += generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += ' class="failure">You do not have enough speedups. Final deficit:</p>';
            const time = result.finalDeficit.time;
            html += `<div class="deficit-details"><div class="deficit-item">Time: ${Math.floor(time / 1440)}d ${Math.floor((time % 1440) / 60)}h ${time % 60}m</div></div>`;
        }
        return html;
    };
    
    const generateAllocationHtml = (allocation, remaining) => {
        let html = '<h4>Chest Allocation Plan:</h4>';
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
        if (!usedAtLeastOne) { html += '<p>No selectable resource chests were needed.</p>'; }

        html += '<h4>Remaining Resource Chests:</h4>';
        let remainingAtLeastOne = false;
        for (const level in remaining) {
             const count = remaining[level];
             if (count > 0) {
                 remainingAtLeastOne = true;
                 html += `<div class="remaining-item">${level.replace('l', 'L')}: <strong>${count.toLocaleString()}</strong> left</div>`;
             }
        }
        if (!remainingAtLeastOne) { html += '<p>All selectable resource chests were used.</p>'; }
        return html;
    };

    const generateSpeedupAllocationHtml = (allocation, remaining) => {
        let html = '<h4>Speedup Chest Allocation Plan:</h4>';
        let usedAtLeastOne = false;

        for (const level in allocation) {
            const count = allocation[level];
            if (count > 0) {
                usedAtLeastOne = true;
                html += `<div class="allocation-item">Use <strong>${count.toLocaleString()}</strong> x ${level.replace('l', 'L')} speedup chest(s).</div>`;
            }
        }
        if (!usedAtLeastOne) { html += '<p>No selectable speedup chests were needed.</p>'; }

        html += '<h4>Remaining Speedup Chests:</h4>';
        let remainingAtLeastOne = false;
        for (const level in remaining) {
            const count = remaining[level];
            if (count > 0) {
                remainingAtLeastOne = true;
                html += `<div class="remaining-item">${level.replace('l', 'L')}: <strong>${count.toLocaleString()}</strong> left</div>`;
            }
        }
        if (!remainingAtLeastOne) { html += '<p>All selectable speedup chests were used.</p>'; }
        return html;
    };

    calculateBtn.addEventListener('click', () => {
        const resourceResult = calculateUpgradeFeasibility({
            food: getResourceInputValue('current-food'),
            wood: getResourceInputValue('current-wood'),
            stone: getResourceInputValue('current-stone'),
            gold: getResourceInputValue('current-gold'),
        }, {
            food: getResourceInputValue('cost-food'),
            wood: getResourceInputValue('cost-wood'),
            stone: getResourceInputValue('cost-stone'),
            gold: getResourceInputValue('cost-gold'),
        }, {
            level1: getChestCount('level1-chests'),
            level2: getChestCount('level2-chests'),
            level3: getChestCount('level3-chests'),
            level4: getChestCount('level4-chests'),
        });

        const speedupResult = calculateSpeedupFeasibility({
            building: getTimeInputValue('current-building-su'),
            research: getTimeInputValue('current-research-su'),
            training: getTimeInputValue('current-training-su'),
            healing: getTimeInputValue('current-healing-su'),
            general: getTimeInputValue('current-general-su'),
        }, {
            type: document.getElementById('cost-time-type').value,
            value: getTimeInputValue('cost-time'),
        }, {
            level2: getChestCount('level2-su-chests'),
            level3: getChestCount('level3-su-chests'),
            level4: getChestCount('level4-su-chests'),
        });

        displayResult(resourceResult, speedupResult);
    });
}); 
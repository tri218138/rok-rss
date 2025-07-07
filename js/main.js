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

    const getPercentageValue = (id) => {
        const value = document.getElementById(id).value;
        return parseFloat(value) || 0;
    };

    const formatMinutes = (minutes) => {
        if (minutes <= 0) return '0m';
        const d = Math.floor(minutes / 1440);
        const h = Math.floor((minutes % 1440) / 60);
        const m = Math.floor(minutes % 60);
        let str = '';
        if (d > 0) str += `${d}d `;
        if (h > 0) str += `${h}h `;
        if (m > 0) str += `${m}m`;
        return str.trim() || '0m';
    };

    const getResourceInputValue = (id) => parseResourceValue(document.getElementById(id).value);
    const getTimeInputValue = (id) => parseTimeValue(document.getElementById(id).value);

    const displayResult = (resourceResult, speedupResult, originalTimeCost) => {
        const resultContainer = document.getElementById('result-container');
        const resourceResultDiv = document.getElementById('resource-result');
        const speedupResultDiv = document.getElementById('speedup-result');
        const divider = document.getElementById('result-divider');

        resultContainer.classList.remove('hidden');
        resourceResultDiv.innerHTML = generateResourceResultHtml(resourceResult);
        
        if (speedupResult.wasNeeded) {
            speedupResultDiv.innerHTML = generateSpeedupResultHtml(speedupResult, originalTimeCost);
            speedupResultDiv.classList.remove('hidden');
            divider.classList.remove('hidden');
        } else {
            speedupResultDiv.classList.add('hidden');
            divider.classList.add('hidden');
        }
    };

    const generateResourceResultHtml = (result) => {
        let html = '<h3>Resources</h3>';
        if (result.isSufficient) {
            html += '<p id="result-message-resources" class="success">Congratulations! You have enough resources.</p>';
            html += generateAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += '<p id="result-message-resources" class="failure">You do not have enough resources.</p>';
            html += generateAllocationHtml(result.chestAllocation, result.remainingChests);
            html += '<h4>Final Deficit (after using chests):</h4>';
            html += '<div class="deficit-details">';
            for (const resource in result.finalDeficit) {
                html += `<div class="deficit-item">${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${result.finalDeficit[resource].toLocaleString()}</div>`;
            }
            html += '</div>';
        }
        return html;
    };

    const generateSpeedupResultHtml = (result, originalTimeCost) => {
        let html = '<h3>Speedups</h3>';

        if (originalTimeCost > 0) {
            html += `<p class="effective-time-info">Initial time: ${formatMinutes(originalTimeCost)}<br>Effective time after buffs: <strong>${formatMinutes(result.timeAfterBuffs)}</strong></p>`;
        }

        if (result.isSufficient) {
            html += '<p id="result-message-speedups" class="success">Congratulations! You have enough speedups.</p>';
            html += generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += '<p id="result-message-speedups" class="failure">You do not have enough speedups.</p>';
            html += generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
            html += '<h4>Final Deficit (after using chests):</h4>';
            const time = result.finalDeficit.time;
            html += `<div class="deficit-details"><div class="deficit-item">Time: ${formatMinutes(time)}</div></div>`;
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

        const originalTimeCost = getTimeInputValue('cost-time');
        const speedupResult = calculateSpeedupFeasibility({
            building: getTimeInputValue('current-building-su'),
            research: getTimeInputValue('current-research-su'),
            training: getTimeInputValue('current-training-su'),
            healing: getTimeInputValue('current-healing-su'),
            general: getTimeInputValue('current-general-su'),
        }, {
            type: document.getElementById('cost-time-type').value,
            value: originalTimeCost,
        }, {
            level2: getChestCount('level2-su-chests'),
            level3: getChestCount('level3-su-chests'),
            level4: getChestCount('level4-su-chests'),
        }, {
            speedBuffPercent: getPercentageValue('speed-buff'),
            allianceHelps: getChestCount('alliance-helps')
        });

        displayResult(resourceResult, speedupResult, originalTimeCost);
    });

    const fetchGitHubStars = async () => {
        const starCountElement = document.getElementById('github-star-count');
        if (!starCountElement) return;

        try {
            const response = await fetch('https://api.github.com/repos/tri218138/rok-rss');
            if (!response.ok) {
                starCountElement.style.display = 'none';
                return;
            }
            const data = await response.json();
            const starCount = data.stargazers_count;

            if (starCount !== undefined) {
                starCountElement.textContent = starCount;
            } else {
                starCountElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching GitHub stars:', error);
            starCountElement.style.display = 'none';
        }
    };

    fetchGitHubStars();

    // We need to re-implement the HTML generation functions fully
    window.generateResourceResultHtml = (result) => {
        let html = '<h3>Resources</h3>';
        if (result.isSufficient) {
            html += '<p id="result-message-resources" class="success">Congratulations! You have enough resources.</p>';
            html += window.generateAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += '<p id="result-message-resources" class="failure">You do not have enough resources.</p>';
            html += window.generateAllocationHtml(result.chestAllocation, result.remainingChests);
            html += '<h4>Final Deficit (after using chests):</h4>';
            html += '<div class="deficit-details">';
            for (const resource in result.finalDeficit) {
                html += `<div class="deficit-item">${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${result.finalDeficit[resource].toLocaleString()}</div>`;
            }
            html += '</div>';
        }
        return html;
    };
    
    const originalGenerateSpeedupResultHtml = generateSpeedupResultHtml;
    window.generateSpeedupResultHtml = (result, originalTimeCost) => {
        let html = '<h3>Speedups</h3>';

        if (originalTimeCost > 0) {
            html += `<p class="effective-time-info">Initial time: ${formatMinutes(originalTimeCost)}<br>Effective time after buffs: <strong>${formatMinutes(result.timeAfterBuffs)}</strong></p>`;
        }

        if (result.isSufficient) {
            html += '<p id="result-message-speedups" class="success">Congratulations! You have enough speedups.</p>';
            html += window.generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
        } else {
            html += '<p id="result-message-speedups" class="failure">You do not have enough speedups.</p>';
            html += window.generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
            html += '<h4>Final Deficit (after using chests):</h4>';
            const time = result.finalDeficit.time;
            html += `<div class="deficit-details"><div class="deficit-item">Time: ${formatMinutes(time)}</div></div>`;
        }
        return html;
    };
    
    calculateBtn.removeEventListener('click', () => {}); // This is tricky, easier to rewrite the file

    const initQuickCalculator = () => {
        const calculator = document.getElementById('quick-calculator');
        const toggleBtn = document.getElementById('toggle-calculator-btn');
        const closeBtn = document.getElementById('close-calculator-btn');
        const screen = document.getElementById('calculator-screen');
        const keys = document.querySelector('.calculator-keys');

        let currentInput = '';
        let operator = '';
        let previousInput = '';

        const updateScreen = () => {
            screen.value = currentInput || previousInput || '0';
        };

        const calculate = () => {
            const prev = parseFloat(previousInput);
            const current = parseFloat(currentInput);
            if (isNaN(prev) || isNaN(current)) return;
            
            let result;
            switch (operator) {
                case '+': result = prev + current; break;
                case '−': result = prev - current; break;
                case '×': result = prev * current; break;
                case '÷': result = prev / current; break;
                default: return;
            }
            currentInput = result.toString();
            operator = '';
            previousInput = '';
        };

        keys.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            const key = e.target.dataset.key;

            if (/\d/.test(key)) {
                currentInput += key;
            } else if (key === '.') {
                if (!currentInput.includes('.')) {
                    currentInput += '.';
                }
            } else if (key === 'clear') {
                currentInput = '';
                operator = '';
                previousInput = '';
            } else if (key === 'backspace') {
                currentInput = currentInput.slice(0, -1);
            } else if (key === '=') {
                if (currentInput && previousInput) {
                    calculate();
                }
            } else { // Operator
                if (currentInput && previousInput) calculate();
                operator = e.target.textContent;
                if(currentInput) previousInput = currentInput;
                currentInput = '';
            }
            updateScreen();
        });

        toggleBtn.addEventListener('click', () => calculator.classList.toggle('hidden'));
        closeBtn.addEventListener('click', () => calculator.classList.add('hidden'));
    };

    initQuickCalculator();
}); 
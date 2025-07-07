import { setLanguage, initI18n, getTranslation } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    await initI18n();

    const calculateBtn = document.getElementById('calculate-btn');

    // --- Event Listeners ---
    document.querySelector('.lang-switcher').addEventListener('click', (e) => {
        if (e.target.matches('button[data-lang]')) {
            const lang = e.target.getAttribute('data-lang');
            setLanguage(lang);
        }
    });

    const getChestCount = (id) => {
        const value = document.getElementById(id).value;
        return parseInt(value, 10) || 0;
    };

    const parseResourceValue = (strValue) => {
        if (!strValue) return 0;
        const value = strValue.trim().toLowerCase();
        let num = parseFloat(value);
        if (isNaN(num)) return 0;

        if (value.endsWith('k')) {
            num *= 1000;
        } else if (value.endsWith('m')) {
            num *= 1000000;
        } else if (value.endsWith('b')) {
            num *= 1000000000;
        }
        return Math.floor(num);
    };

    const parseTimeValue = (strValue) => {
        if (!strValue) return 0;
        const parts = strValue.trim().toLowerCase().split(/\s+/);
        let totalMinutes = 0;

        parts.forEach(part => {
            const num = parseFloat(part);
            if (isNaN(num)) return;

            if (part.endsWith('d')) {
                totalMinutes += num * 24 * 60;
            } else if (part.endsWith('h')) {
                totalMinutes += num * 60;
            } else if (part.endsWith('m') || !isNaN(part)) {
                totalMinutes += num;
            }
        });

        return Math.floor(totalMinutes);
    };
    
    const getPercentageValue = (id) => parseFloat(document.getElementById(id).value) || 0;
    const getResourceInputValue = (id) => parseResourceValue(document.getElementById(id).value);
    const getTimeInputValue = (id) => parseTimeValue(document.getElementById(id).value);

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
        let html = `<h3>${getTranslation('resources')}</h3>`;
        if (result.isSufficient) {
            html += `<p class="success">${getTranslation('resultSuccessResources')}</p>`;
        } else {
            html += `<p class="failure">${getTranslation('resultFailureResources')}</p>`;
        }
        html += generateAllocationHtml(result.chestAllocation, result.remainingChests);
        if (!result.isSufficient) {
            html += `<h4>${getTranslation('finalDeficit')}</h4><div class="deficit-details">`;
            for (const resource in result.finalDeficit) {
                const translatedResource = getTranslation(`resource${resource.charAt(0).toUpperCase() + resource.slice(1)}`);
                html += `<div class="deficit-item">${translatedResource}: ${result.finalDeficit[resource].toLocaleString()}</div>`;
            }
            html += '</div>';
        }
        return html;
    };

    const generateSpeedupResultHtml = (result, originalTimeCost) => {
        let html = `<h3>${getTranslation('speedups')}</h3>`;
        if (originalTimeCost > 0) {
            html += `<p class="effective-time-info">${getTranslation('initialTime', { time: formatMinutes(originalTimeCost) })}<br>${getTranslation('effectiveTime', { time: formatMinutes(result.timeAfterBuffs) })}</p>`;
        }
        if (result.isSufficient) {
            html += `<p class="success">${getTranslation('resultSuccessSpeedups')}</p>`;
        } else {
            html += `<p class="failure">${getTranslation('resultFailureSpeedups')}</p>`;
        }
        html += generateSpeedupAllocationHtml(result.chestAllocation, result.remainingChests);
        if (!result.isSufficient) {
            html += `<h4>${getTranslation('finalDeficit')}</h4><div class="deficit-details">`;
            const time = result.finalDeficit.time;
            html += `<div class="deficit-item">${getTranslation('deficitTime')}: ${formatMinutes(time)}</div>`;
            html += '</div>';
        }
        return html;
    };

    const generateAllocationHtml = (allocation, remaining) => {
        let html = `<h4>${getTranslation('chestAllocationPlan')}</h4>`;
        let usedAtLeastOne = false;
        for (const level in allocation) {
            for (const resource in allocation[level]) {
                const count = allocation[level][resource];
                if (count > 0) {
                    usedAtLeastOne = true;
                    html += `<div class="allocation-item">${getTranslation('useChestsFor', {
                        count: count.toLocaleString(),
                        level: getTranslation(`chest${level.charAt(0).toUpperCase() + level.slice(1)}`),
                        resource: getTranslation(`resource${resource.charAt(0).toUpperCase() + resource.slice(1)}`)
                    })}</div>`;
                }
            }
        }
        if (!usedAtLeastOne) html += `<p>${getTranslation('noResourceChestsNeeded')}</p>`;

        html += `<h4>${getTranslation('remainingResourceChests')}</h4>`;
        let remainingAtLeastOne = false;
        for (const level in remaining) {
             const count = remaining[level];
             if (count > 0) {
                 remainingAtLeastOne = true;
                 html += `<div class="remaining-item">${getTranslation('chestsLeft', {
                     level: getTranslation(`chest${level.charAt(0).toUpperCase() + level.slice(1)}`),
                     count: count.toLocaleString()
                 })}</div>`;
             }
        }
        if (!remainingAtLeastOne) html += `<p>${getTranslation('allResourceChestsUsed')}</p>`;
        return html;
    };

    const generateSpeedupAllocationHtml = (allocation, remaining) => {
        let html = `<h4>${getTranslation('speedupAllocationPlan')}</h4>`;
        let usedAtLeastOne = false;
        for (const level in allocation) {
            const count = allocation[level];
            if (count > 0) {
                usedAtLeastOne = true;
                html += `<div class="allocation-item">${getTranslation('useSpeedupChests', {
                    count: count.toLocaleString(),
                    level: getTranslation(`speedupChest${level.charAt(0).toUpperCase() + level.slice(1)}`)
                })}</div>`;
            }
        }
        if (!usedAtLeastOne) html += `<p>${getTranslation('noSpeedupChestsNeeded')}</p>`;

        html += `<h4>${getTranslation('remainingSpeedupChests')}</h4>`;
        let remainingAtLeastOne = false;
        for (const level in remaining) {
            const count = remaining[level];
            if (count > 0) {
                remainingAtLeastOne = true;
                html += `<div class="remaining-item">${getTranslation('chestsLeft', {
                    level: getTranslation(`speedupChest${level.charAt(0).toUpperCase() + level.slice(1)}`),
                    count: count.toLocaleString()
                })}</div>`;
            }
        }
        if (!remainingAtLeastOne) html += `<p>${getTranslation('allSpeedupChestsUsed')}</p>`;
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
                starCountElement.parentElement.style.display = 'none';
                return;
            }
            const data = await response.json();
            starCountElement.textContent = data.stargazers_count;
        } catch (error) {
            console.error('Error fetching GitHub stars:', error);
            starCountElement.parentElement.style.display = 'none';
        }
    };

    fetchGitHubStars();

    const initQuickCalculator = () => {
        const calculator = document.getElementById('quick-calculator');
        const toggleBtn = document.getElementById('toggle-calculator-btn');
        const closeBtn = document.getElementById('close-calculator-btn');
        const screen = document.getElementById('calculator-screen');
        const keys = document.querySelector('.calculator-keys');

        let currentInput = '', operator = '', previousInput = '';
        const updateScreen = () => { screen.value = currentInput || previousInput || '0'; };

        const calculate = () => {
            const prev = parseFloat(previousInput);
            const current = parseFloat(currentInput);
            if (isNaN(prev) || isNaN(current)) return;
            let result;
            switch (operator) {
                case '+': result = prev + current; break;
                case '−': case '-': result = prev - current; break;
                case '×': case '*': result = prev * current; break;
                case '÷': case '/': result = prev / current; break;
                default: return;
            }
            currentInput = result.toString();
            operator = '', previousInput = '';
        };

        keys.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            const key = e.target.dataset.key;
            const keyContent = e.target.textContent;

            if (/\d/.test(key)) currentInput += key;
            else if (key === '.' && !currentInput.includes('.')) currentInput += '.';
            else if (key === 'clear') currentInput = '', operator = '', previousInput = '';
            else if (key === 'backspace') currentInput = currentInput.slice(0, -1);
            else if (key === '=') { if (currentInput && previousInput) calculate(); }
            else if (['+', '−', '-', '×', '*', '÷', '/'].includes(keyContent)) {
                if (currentInput && previousInput) calculate();
                operator = keyContent;
                if (currentInput) previousInput = currentInput;
                currentInput = '';
            }
            updateScreen();
        });

        toggleBtn.addEventListener('click', () => calculator.classList.toggle('hidden'));
        closeBtn.addEventListener('click', () => calculator.classList.add('hidden'));
    };

    initQuickCalculator();
}); 
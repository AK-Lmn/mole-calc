const massInput = document.getElementById('mass');
const massUnitInput = document.getElementById('massUnit');
const molarMassInput = document.getElementById('molarMass');
const resultDiv = document.getElementById('result');
const formMessage = document.getElementById('formMessage');
const calculateButton = document.getElementById('calculateButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');

const historyContainer = document.createElement('div');
historyContainer.classList.add('history-container');
document.body.appendChild(historyContainer);

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  showToast(isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled');
}

window.onload = () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'light') {
    document.body.classList.add('light-theme');
  }
  validateInputs();
  displayHistory();
  massInput.focus();
};

function getInputValues() {
  return {
    mass: Number.parseFloat(massInput.value),
    massUnit: massUnitInput.value,
    molarMass: Number.parseFloat(molarMassInput.value),
  };
}

function validateInputs(values = getInputValues()) {
  const isMassValid = Number.isFinite(values.mass) && values.mass > 0;
  const isMolarMassValid = Number.isFinite(values.molarMass) && values.molarMass > 0;
  calculateButton.disabled = !(isMassValid && isMolarMassValid);
  return {
    isValid: isMassValid && isMolarMassValid,
    isMassValid,
    isMolarMassValid,
  };
}

function convertMassToGrams(mass, massUnit) {
  if (!Number.isFinite(mass)) {
    return Number.NaN;
  }

  if (massUnit === 'mg') {
    return mass / 1000;
  }

  if (massUnit === 'kg') {
    return mass * 1000;
  }

  return mass;
}

function calculateMoles(mass, molarMass) {
  return mass / molarMass;
}

function calculateParticles(moles) {
  return moles * 6.022e23;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const absoluteValue = Math.abs(value);
  if ((absoluteValue > 0 && absoluteValue < 0.0001) || absoluteValue >= 100000) {
    return value.toExponential(4);
  }

  const rounded = Number.parseFloat(value.toFixed(4));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatParticles(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / (10 ** exponent);
  const roundedMantissa = mantissa.toFixed(3).replace(/\.?0+$/, '');
  const superscripts = {
    '-': '⁻',
    0: '⁰',
    1: '¹',
    2: '²',
    3: '³',
    4: '⁴',
    5: '⁵',
    6: '⁶',
    7: '⁷',
    8: '⁸',
    9: '⁹',
  };

  const exponentText = String(exponent)
    .split('')
    .map((char) => superscripts[char] || char)
    .join('');

  return `${roundedMantissa} × 10${exponentText}`;
}

function parseFormattedNumber(value) {
  if (typeof value !== 'string') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const normalized = value
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/×10\^([+-]?\d+)/i, (_, exponent) => `e${exponent}`)
    .replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/i, (_, superscriptExponent) => {
      const reverseSuperscripts = {
        '⁻': '-',
        '⁰': '0',
        '¹': '1',
        '²': '2',
        '³': '3',
        '⁴': '4',
        '⁵': '5',
        '⁶': '6',
        '⁷': '7',
        '⁸': '8',
        '⁹': '9',
      };
      const exponent = superscriptExponent
        .split('')
        .map((char) => reverseSuperscripts[char] || '')
        .join('');
      return `e${exponent}`;
    });

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatMassOrMolarMass(value) {
  return formatNumber(value);
}

function formatHistoryNumber(value, options = {}) {
  const parsed = parseFormattedNumber(value);
  if (!Number.isFinite(parsed)) {
    return '';
  }

  if (options.particles) {
    return formatParticles(parsed);
  }

  return formatMassOrMolarMass(parsed);
}

function formatHistoryMass(value, massUnit = 'g') {
  const parsed = parseFormattedNumber(value);
  if (!Number.isFinite(parsed)) {
    return '';
  }

  return `${formatNumber(parsed)} ${massUnit}`;
}

function showResult(mass, massUnit, molarMass, moles, particles) {
  formMessage.textContent = '';
  formMessage.classList.remove('success');
  resultDiv.innerHTML = `
    <div class="result-line">
      <span class="result-label">Moles</span>
      <span class="result-value">${formatNumber(moles)} mol</span>
    </div>
    <div class="result-line">
      <span class="result-label">Particles</span>
      <span class="result-value">${formatParticles(particles)} particles</span>
    </div>
  `;
  resultDiv.classList.add('show');
  resultDiv.classList.add('highlight');
  setTimeout(() => resultDiv.classList.remove('highlight'), 1000);
  saveCalculation(mass, massUnit, molarMass, moles, particles);
  showToast('Calculation saved!');
}

function showError(message) {
  formMessage.textContent = message;
  formMessage.classList.remove('success');
  resultDiv.innerHTML = '';
  resultDiv.classList.remove('show');
}

function saveCalculation(mass, massUnit, molarMass, moles, particles) {
  const calculation = {
    mass,
    massUnit,
    molarMass,
    moles,
    particles,
    timestamp: new Date().toLocaleString(),
  };

  let history = JSON.parse(localStorage.getItem('history')) || [];
  history.push(calculation);
  if (history.length > 10) history.shift();

  localStorage.setItem('history', JSON.stringify(history));
  displayHistory();
}

function displayHistory() {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  historyContainer.innerHTML = '<h2>Past Calculations</h2>';

  if (history.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'history-empty';
    emptyState.textContent = 'No calculations yet. Your saved mole conversions will appear here.';
    historyContainer.appendChild(emptyState);
    historyContainer.style.display = 'block';
    return;
  }

  historyContainer.style.display = 'block';
  history.forEach((calc) => {
    const entry = document.createElement('p');
    const massUnit = calc.massUnit || 'g';
    const displayMass = formatHistoryMass(calc.mass, massUnit);
    const displayMolarMass = `${formatHistoryNumber(calc.molarMass)} g/mol`;
    const displayMoles = formatHistoryNumber(calc.moles);
    const displayParticles = formatHistoryNumber(calc.particles, { particles: true });
    entry.innerText = `${calc.timestamp}: ${displayMass} \u00F7 ${displayMolarMass} = ${displayMoles} mol\nParticles: ${displayParticles} particles`;
    historyContainer.appendChild(entry);
  });

  historyContainer.scrollIntoView({ behavior: 'smooth' });
}

function clearHistory() {
  localStorage.removeItem('history');
  historyContainer.innerHTML = '<h2>Past Calculations</h2><p class="history-empty">No calculations yet. Your saved mole conversions will appear here.</p>';
  historyContainer.style.display = 'block';
  showToast('History Cleared!');
}

function clearFields() {
  massInput.value = '';
  massUnitInput.value = 'g';
  molarMassInput.value = '';
  resultDiv.innerText = '';
  resultDiv.classList.remove('show');
  formMessage.textContent = '';
  validateInputs();
}

function calculateAndRender() {
  const values = getInputValues();
  const validation = validateInputs(values);

  if (!validation.isValid) {
    showError('Please enter valid positive numbers for both Mass and Molar Mass.');
    return;
  }

  const massInGrams = convertMassToGrams(values.mass, values.massUnit);
  if (!Number.isFinite(massInGrams) || massInGrams <= 0) {
    showError('Please enter valid positive numbers for both Mass and Molar Mass.');
    return;
  }

  const moles = calculateMoles(massInGrams, values.molarMass);
  if (!Number.isFinite(moles)) {
    showError('Calculation could not be completed. Please check your values.');
    return;
  }

  const particles = calculateParticles(moles);
  if (!Number.isFinite(particles)) {
    showError('Calculation could not be completed. Please check your values.');
    return;
  }

  showResult(values.mass, values.massUnit, values.molarMass, moles, particles);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0;
  toast.style.transition = 'opacity 0.5s';

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = 1;
  }, 100);
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => document.body.removeChild(toast), 500);
  }, 2000);
}

massInput.addEventListener('input', () => {
  validateInputs();
  formMessage.textContent = '';
});
massUnitInput.addEventListener('change', () => {
  validateInputs();
  formMessage.textContent = '';
});
molarMassInput.addEventListener('input', () => {
  validateInputs();
  formMessage.textContent = '';
});
clearHistoryButton.addEventListener('click', clearHistory);
calculateButton.addEventListener('click', calculateAndRender);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !calculateButton.disabled) {
    calculateAndRender();
  }
});

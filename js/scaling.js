// Ingredient Scaling Calculator

let baseServings = 4;
let currentServings = 4;
let recipeData = null;

// Unicode fraction map
const FRACTIONS = {
  0.125: '\u215B', // 1/8
  0.25: '\u00BC',  // 1/4
  0.333: '\u2153', // 1/3
  0.375: '\u215C', // 3/8
  0.5: '\u00BD',   // 1/2
  0.625: '\u215D', // 5/8
  0.666: '\u2154', // 2/3
  0.75: '\u00BE',  // 3/4
  0.875: '\u215E'  // 7/8
};

function initScaling(recipe) {
  recipeData = recipe;
  baseServings = recipe.servings?.base || 4;
  currentServings = baseServings;

  const container = document.getElementById('scaling-controls');
  if (!container) return;

  container.innerHTML = `
    <span class="scaling-label">SERVINGS:</span>
    <div class="spin-button-container">
      <input type="text" class="spin-input" id="servings-input" value="${currentServings}" readonly>
      <div class="spin-buttons">
        <button class="spin-btn" onclick="adjustServings(1)">\u25B2</button>
        <button class="spin-btn" onclick="adjustServings(-1)">\u25BC</button>
      </div>
    </div>
    <span class="scaling-info" id="scaling-info">Base recipe: ${baseServings} ${recipe.servings?.unit || 'servings'}</span>
  `;
}

function adjustServings(delta) {
  const newServings = currentServings + delta;
  if (newServings < 1 || newServings > 20) return;

  currentServings = newServings;
  document.getElementById('servings-input').value = currentServings;

  const scaleFactor = currentServings / baseServings;
  updateScalingInfo(scaleFactor);
  scaleIngredients(scaleFactor);
}

function updateScalingInfo(factor) {
  const info = document.getElementById('scaling-info');
  if (factor === 1) {
    info.textContent = `Base recipe: ${baseServings} ${recipeData.servings?.unit || 'servings'}`;
  } else {
    info.textContent = `Scaled ${factor > 1 ? 'up' : 'down'} from ${baseServings} to ${currentServings}`;
  }
}

function scaleIngredients(factor) {
  if (!recipeData) return;

  recipeData.ingredientGroups.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      const el = document.querySelector(`[data-group="${groupIndex}"][data-item="${itemIndex}"] .ingredient-quantity`);
      if (!el) return;

      if (item.scalable && item.quantity) {
        const scaled = item.quantity * factor;
        el.textContent = formatQuantity(scaled, item.unit);
      }
    });
  });
}

function formatQuantity(num, unit) {
  if (num === null || num === undefined) return '';

  // Handle whole numbers
  if (Number.isInteger(num)) {
    return unit ? `${num} ${unit}` : `${num}`;
  }

  // Split into whole and fractional parts
  const whole = Math.floor(num);
  const frac = num - whole;

  // Find closest fraction
  let closestFrac = '';
  let minDiff = 1;

  for (const [key, symbol] of Object.entries(FRACTIONS)) {
    const diff = Math.abs(frac - parseFloat(key));
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff;
      closestFrac = symbol;
    }
  }

  let result;
  if (closestFrac) {
    result = whole > 0 ? `${whole}${closestFrac}` : closestFrac;
  } else {
    // Fall back to decimal with 1-2 places
    result = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  }

  return unit ? `${result} ${unit}` : result;
}

// Export for use in recipe-loader
window.initScaling = initScaling;
window.adjustServings = adjustServings;
window.formatQuantity = formatQuantity;

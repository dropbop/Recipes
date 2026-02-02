// Ingredient Scaling Calculator
// Depends on: utils.js (must load first — provides formatQuantity)

let baseServings = 4;
let currentServings = 4;
let recipeData = null;

function initScaling(recipe) {
  recipeData = recipe;
  baseServings = recipe.servings?.base || 4;
  currentServings = baseServings;

  const container = document.getElementById('scaling-controls');
  if (!container) return;

  container.innerHTML = `
    <div class="multiplier-buttons">
      <button class="multiplier-btn" onclick="setMultiplier(0.5)">\u00BD\u00D7</button>
      <button class="multiplier-btn active" onclick="setMultiplier(1)">1\u00D7</button>
      <button class="multiplier-btn" onclick="setMultiplier(2)">2\u00D7</button>
    </div>
    <span class="scaling-label">Servings:</span>
    <div class="spin-button-container">
      <input type="text" class="spin-input" id="servings-input" value="${currentServings}" readonly>
      <div class="spin-buttons">
        <button class="spin-btn" onclick="adjustServings(1)">\u25B2</button>
        <button class="spin-btn" onclick="adjustServings(-1)">\u25BC</button>
      </div>
    </div>
    <span class="scaling-info" id="scaling-info">Base: ${baseServings} ${recipe.servings?.unit || 'servings'}</span>
  `;
}

function setMultiplier(factor) {
  currentServings = Math.max(1, Math.round(baseServings * factor));
  document.getElementById('servings-input').value = currentServings;

  // Update multiplier button states
  document.querySelectorAll('.multiplier-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const scaleFactor = currentServings / baseServings;
  updateScalingInfo(scaleFactor);
  scaleIngredients(scaleFactor);
  updateStatusBar(scaleFactor);
}

function adjustServings(delta) {
  const newServings = currentServings + delta;
  if (newServings < 1 || newServings > 20) return;

  currentServings = newServings;
  document.getElementById('servings-input').value = currentServings;

  // Clear multiplier button active states (custom serving count)
  document.querySelectorAll('.multiplier-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const scaleFactor = currentServings / baseServings;
  updateScalingInfo(scaleFactor);
  scaleIngredients(scaleFactor);
  updateStatusBar(scaleFactor);
}

function updateScalingInfo(factor) {
  const info = document.getElementById('scaling-info');
  if (!info) return;

  if (factor === 1) {
    info.textContent = `Base: ${baseServings} ${recipeData.servings?.unit || 'servings'}`;
  } else {
    info.textContent = `Scaled ${factor > 1 ? 'up' : 'down'} from ${baseServings} to ${currentServings}`;
  }
}

function updateStatusBar(factor) {
  const statusEl = document.getElementById('status-servings');
  if (statusEl) {
    statusEl.textContent = `Scale: ${factor}×`;
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
        const scaledMax = item.quantityMax ? item.quantityMax * factor : null;
        el.textContent = formatQuantity(scaled, item.unit, scaledMax);
      }
    });
  });
}

// Export for use in recipe-loader
window.initScaling = initScaling;
window.adjustServings = adjustServings;
window.setMultiplier = setMultiplier;

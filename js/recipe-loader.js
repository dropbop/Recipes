// Recipe Loader - Fetches and renders recipe JSON
// Depends on: utils.js (must load first — provides formatQuantity, getTagColor)

document.addEventListener('DOMContentLoaded', init);

let nutritionRecipe = null;
let nutritionTouched = false;
let nutritionBaseServings = 1;
let nutritionBatchServings = 1;
let nutritionContainerCount = 1;
let nutritionIngredientView = 'basis';

async function init() {
  const recipeId = getRecipeIdFromUrl();
  if (!recipeId) {
    showError('No recipe specified. Please select a recipe from the index.');
    return;
  }

  try {
    if (isRawJsonView()) {
      const rawJson = await loadRecipeText(recipeId);
      renderRawJsonView(recipeId, rawJson);
      return;
    }

    const recipe = await loadRecipe(recipeId);
    if (recipe) {
      renderRecipe(recipe);
      initTabs();
      if (typeof initScaling === 'function') {
        initScaling(recipe);
      }
    }
  } catch (error) {
    showError(`Could not load recipe: ${error.message}`);
  }
}

function getRecipeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function isRawJsonView() {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'json';
}

async function loadRecipe(id) {
  const response = await fetch(`recipes/${id}.json`);
  if (!response.ok) {
    throw new Error(`Recipe "${id}" not found`);
  }
  return await response.json();
}

async function loadRecipeText(id) {
  const response = await fetch(`recipes/${id}.json`);
  if (!response.ok) {
    throw new Error(`Recipe "${id}" not found`);
  }
  return await response.text();
}

function openRawJsonView() {
  const recipeId = getRecipeIdFromUrl();
  if (!recipeId) return;
  location.href = `recipe.html?id=${encodeURIComponent(recipeId)}&view=json`;
}

function renderRawJsonView(recipeId, rawJson) {
  document.title = `Recipe JSON - ${recipeId}`;
  document.body.innerHTML = '';
  document.body.style.background = '#FFFFFF';
  document.body.style.color = '#000000';
  document.body.style.fontFamily = '"Courier New", monospace';
  document.body.style.fontSize = '14px';
  document.body.style.lineHeight = '1.35';
  document.body.style.margin = '0';
  document.body.style.padding = '12px';
  document.body.style.minHeight = '';

  const pre = document.createElement('pre');
  pre.textContent = rawJson;
  pre.style.margin = '0';
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.wordBreak = 'break-word';
  document.body.appendChild(pre);
}

function renderRecipe(recipe) {
  // Update window title
  document.title = `Recipe Viewer - ${recipe.title}`;
  document.getElementById('window-title').textContent = recipe.title;

  // Header
  document.getElementById('recipe-title').textContent = recipe.title;

  // Subtitle - hide if empty
  const subtitleEl = document.getElementById('recipe-subtitle');
  if (recipe.subtitle) {
    subtitleEl.textContent = recipe.subtitle;
    subtitleEl.style.display = '';
  } else {
    subtitleEl.style.display = 'none';
  }

  // Meta info (time)
  if (recipe.time) {
    const t = recipe.time;
    const totalTime = (t.prep || 0) + (t.active || 0) + (t.passive || 0);
    document.getElementById('recipe-meta').innerHTML = `
      <span>Prep: ${t.prep || 0} min</span>
      <span>Active: ${t.active || 0} min</span>
      <span>Passive: ${t.passive || 0} min</span>
      <span>Total: ${totalTime} min</span>
    `;
  }

  // Tags with dynamic colors
  if (recipe.tags && recipe.tags.length > 0) {
    const tagsHtml = recipe.tags.map(tag =>
      `<span class="tag" style="background: ${getTagColor(tag)}">${tag}</span>`
    ).join('');
    document.getElementById('recipe-tags').innerHTML = tagsHtml;
  }

  // Status bar source
  document.getElementById('status-info').textContent = recipe.source || '';

  // Render tabs
  renderOverview(recipe);
  renderRecipeTab(recipe);
  renderNutrition(recipe);
  renderNotes(recipe);
}

function renderIngredients(recipe) {
  const container = document.getElementById('ingredients-list');
  let html = '';

  recipe.ingredientGroups.forEach((group, groupIndex) => {
    html += `<div class="section">
      <div class="section-title">\u25C6 ${group.name}</div>`;

    group.items.forEach((item, itemIndex) => {
      const quantity = formatQuantity(item.quantity, item.unit, item.quantityMax);
      const note = item.note ? `<span class="ingredient-note"> \u2014 ${item.note}</span>` : '';

      html += `<div class="ingredient" data-group="${groupIndex}" data-item="${itemIndex}">
        <span class="ingredient-quantity">${quantity}</span> ${item.item}${note}
      </div>`;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

function renderOverview(recipe) {
  const container = document.getElementById('overview-content');
  let html = '';

  if (recipe.description) {
    html += `<div class="section"><div class="section-title">\u25C6 Overview</div><p>${recipe.description}</p></div>`;
  }

  if (recipe.deviations && recipe.deviations.length > 0) {
    html += '<div class="section"><div class="section-title">\u25C6 Deviations from Tradition</div>';
    recipe.deviations.forEach(dev => {
      if (typeof dev === 'string') {
        html += `<div class="deviation-item">${dev}</div>`;
      } else {
        html += `<div class="deviation-item"><strong>${dev.what}</strong> \u2014 ${dev.why}</div>`;
      }
    });
    html += '</div>';
  }

  if (recipe.source) {
    html += `<div class="section"><div class="section-title">\u25C6 Source</div><p>${recipe.source}</p></div>`;
  }

  if (!html) {
    html = '<div class="empty-log">No overview information yet.</div>';
  }

  container.innerHTML = html;
}

function renderRecipeTab(recipe) {
  renderIngredients(recipe);

  const container = document.getElementById('directions-list');
  let html = '<div class="section"><div class="section-title">\u25C6 Method</div>';

  recipe.directions.forEach(dir => {
    const title = dir.title ? `<span class="direction-title">${dir.title}:</span> ` : '';
    html += `<div class="direction">
      <span class="direction-number">${dir.step}</span>
      ${title}${dir.text}
    </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderNutrition(recipe, scaleFactor = 1, servingCount = null) {
  nutritionRecipe = recipe;

  const container = document.getElementById('nutrition-content');
  if (!container) return;

  const batch = recipe.nutrition?.batch;
  if (!batch) {
    container.innerHTML = '<div class="empty-log">No nutrition data yet.</div>';
    return;
  }

  nutritionBaseServings = recipe.servings?.base || 1;
  if (!nutritionTouched) {
    const syncedServings = servingCount || Math.max(1, Math.round(nutritionBaseServings * scaleFactor));
    nutritionBatchServings = syncedServings;
    nutritionContainerCount = syncedServings;
  }

  renderNutritionContent();
}

function renderNutritionContent() {
  if (!nutritionRecipe) return;

  const container = document.getElementById('nutrition-content');
  const batch = nutritionRecipe.nutrition?.batch;
  if (!container || !batch) return;

  const batchScale = nutritionBatchServings / nutritionBaseServings;
  const unit = nutritionRecipe.servings?.unit || 'servings';
  const scaledBatch = {
    calories: (batch.calories || 0) * batchScale,
    protein: (batch.protein || 0) * batchScale,
    fat: (batch.fat || 0) * batchScale,
    carbs: (batch.carbs || 0) * batchScale,
    fiber: (batch.fiber || 0) * batchScale
  };

  const perServing = {
    calories: scaledBatch.calories / nutritionContainerCount,
    protein: scaledBatch.protein / nutritionContainerCount,
    fat: scaledBatch.fat / nutritionContainerCount,
    carbs: scaledBatch.carbs / nutritionContainerCount,
    fiber: scaledBatch.fiber / nutritionContainerCount
  };

  container.innerHTML = `
    ${renderNutritionControls(batchScale, unit)}
    <div class="section">
      <div class="section-title">\u25C6 Per ${titleCase(singularizeUnit(unit))}</div>
      <div class="nutrition-grid">
        ${renderNutritionStat('Calories', perServing.calories, 'cal')}
        ${renderNutritionStat('Protein', perServing.protein, 'g')}
        ${renderNutritionStat('Fat', perServing.fat, 'g')}
        ${renderNutritionStat('Carbs', perServing.carbs, 'g')}
        ${renderNutritionStat('Fiber', perServing.fiber, 'g')}
      </div>
    </div>
    <div class="section">
      <div class="section-title">\u25C6 Batch Total</div>
      <div class="nutrition-grid batch">
        ${renderNutritionStat('Calories', scaledBatch.calories, 'cal')}
        ${renderNutritionStat('Protein', scaledBatch.protein, 'g')}
        ${renderNutritionStat('Fat', scaledBatch.fat, 'g')}
        ${renderNutritionStat('Carbs', scaledBatch.carbs, 'g')}
        ${renderNutritionStat('Fiber', scaledBatch.fiber, 'g')}
      </div>
    </div>
    ${renderIngredientNutritionBreakdown(batchScale)}
  `;
}

function renderNutritionControls(batchScale, unit) {
  const unitLabel = unit || 'servings';
  return `<div class="nutrition-controls">
    <div class="nutrition-control-group">
      <span class="scaling-label">Batch Size:</span>
      <div class="nutrition-multiplier-buttons">
        ${renderNutritionMultiplierButton(0.5, batchScale, '\u00BD\u00D7')}
        ${renderNutritionMultiplierButton(1, batchScale, '1\u00D7')}
        ${renderNutritionMultiplierButton(2, batchScale, '2\u00D7')}
      </div>
      <div class="spin-button-container">
        <input type="text" class="spin-input" id="nutrition-batch-input" value="${nutritionBatchServings}" readonly>
        <div class="spin-buttons">
          <button class="spin-btn" onclick="adjustNutritionBatchSize(1)">\u25B2</button>
          <button class="spin-btn" onclick="adjustNutritionBatchSize(-1)">\u25BC</button>
        </div>
      </div>
    </div>
    <div class="nutrition-control-group">
      <span class="scaling-label">${titleCase(unitLabel)}:</span>
      <div class="spin-button-container">
        <input type="text" class="spin-input" id="nutrition-containers-input" value="${nutritionContainerCount}" readonly>
        <div class="spin-buttons">
          <button class="spin-btn" onclick="adjustNutritionContainers(1)">\u25B2</button>
          <button class="spin-btn" onclick="adjustNutritionContainers(-1)">\u25BC</button>
        </div>
      </div>
    </div>
    <span class="scaling-info">Nutrition: ${formatNutritionScaleFactor(batchScale)}\u00D7 batch split into ${nutritionContainerCount} ${unitLabel}</span>
  </div>`;
}

function renderNutritionMultiplierButton(factor, activeFactor, label) {
  const active = Math.abs(factor - activeFactor) < 0.001 ? ' active' : '';
  return `<button class="nutrition-multiplier-btn${active}" onclick="setNutritionBatchMultiplier(${factor})">${label}</button>`;
}

function setNutritionBatchMultiplier(factor) {
  nutritionTouched = true;
  nutritionBatchServings = clampNutritionCount(Math.round(nutritionBaseServings * factor));
  renderNutritionContent();
}

function adjustNutritionBatchSize(delta) {
  nutritionTouched = true;
  nutritionBatchServings = clampNutritionCount(nutritionBatchServings + delta);
  renderNutritionContent();
}

function adjustNutritionContainers(delta) {
  nutritionTouched = true;
  nutritionContainerCount = clampNutritionCount(nutritionContainerCount + delta);
  renderNutritionContent();
}

function clampNutritionCount(value) {
  return Math.max(1, Math.min(20, value));
}

function setNutritionIngredientView(view) {
  if (!['basis', 'batch', 'container'].includes(view)) return;
  nutritionIngredientView = view;
  renderNutritionContent();
}

function renderIngredientNutritionBreakdown(batchScale) {
  const rows = nutritionRecipe.nutrition?.ingredients;
  if (!rows || rows.length === 0) return '';

  const sortedRows = rows
    .map(row => ({
      ...row,
      batchValues: getIngredientNutritionValues(row, 'batch', batchScale)
    }))
    .sort((a, b) => b.batchValues.macros.calories - a.batchValues.macros.calories);

  const tableRows = sortedRows.map(row => {
    const values = nutritionIngredientView === 'batch'
      ? row.batchValues
      : getIngredientNutritionValues(row, nutritionIngredientView, batchScale);
    return renderIngredientNutritionRow(row.label, values);
  }).join('');

  return `<div class="section">
    <div class="section-title">\u25C6 Ingredient Breakdown</div>
    <div class="nutrition-view-controls">
      ${renderNutritionViewButton('basis', 'Basis')}
      ${renderNutritionViewButton('batch', 'Batch')}
      ${renderNutritionViewButton('container', `Per ${titleCase(singularizeUnit(nutritionRecipe.servings?.unit || 'serving'))}`)}
    </div>
    <div class="nutrition-table-wrap">
      <table class="nutrition-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Amount</th>
            <th>Calories</th>
            <th>Protein</th>
            <th>Fat</th>
            <th>Carbs</th>
            <th>Fiber</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  </div>`;
}

function renderNutritionViewButton(view, label) {
  const active = nutritionIngredientView === view ? ' active' : '';
  return `<button class="nutrition-view-btn${active}" onclick="setNutritionIngredientView('${view}')">${label}</button>`;
}

function getIngredientNutritionValues(row, view, batchScale) {
  const basisAmount = row.basis?.amount || 1;
  const recipeAmount = row.recipeQuantity?.amount || basisAmount;
  const recipeUnit = row.recipeQuantity?.unit || row.basis?.unit || '';
  const amountFactor = recipeAmount / basisAmount;
  const batchFactor = amountFactor * batchScale;

  if (view === 'basis') {
    return {
      amount: row.basis?.amount || 1,
      unit: row.basis?.unit || recipeUnit,
      macros: row.macros || {}
    };
  }

  if (view === 'container') {
    return {
      amount: (recipeAmount * batchScale) / nutritionContainerCount,
      unit: recipeUnit,
      macros: scaleMacroSet(row.macros, batchFactor / nutritionContainerCount)
    };
  }

  return {
    amount: recipeAmount * batchScale,
    unit: recipeUnit,
    macros: scaleMacroSet(row.macros, batchFactor)
  };
}

function scaleMacroSet(macros = {}, factor) {
  return {
    calories: (macros.calories || 0) * factor,
    protein: (macros.protein || 0) * factor,
    fat: (macros.fat || 0) * factor,
    carbs: (macros.carbs || 0) * factor,
    fiber: (macros.fiber || 0) * factor
  };
}

function renderIngredientNutritionRow(label, values) {
  return `<tr>
    <td>${label}</td>
    <td>${formatNutritionAmount(values.amount, values.unit)}</td>
    <td>${formatIngredientMacro(values.macros.calories)}</td>
    <td>${formatIngredientMacro(values.macros.protein)}g</td>
    <td>${formatIngredientMacro(values.macros.fat)}g</td>
    <td>${formatIngredientMacro(values.macros.carbs)}g</td>
    <td>${formatIngredientMacro(values.macros.fiber)}g</td>
  </tr>`;
}

function formatNutritionAmount(amount, unit) {
  if (!Number.isFinite(amount)) return unit || '';
  if (unit === 'batch') return `${formatIngredientMacro(amount)} batch`;
  return `${formatIngredientMacro(amount)}${unit ? ` ${unit}` : ''}`;
}

function formatIngredientMacro(value) {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value - Math.round(value)) < 0.05) return Math.round(value).toString();
  return value.toFixed(1).replace(/\.0$/, '');
}

function renderNutritionStat(label, value, unit) {
  return `<div class="nutrition-stat">
    <div class="nutrition-value">${formatNutritionValue(value)}</div>
    <div class="nutrition-label">${label}${unit ? ` (${unit})` : ''}</div>
  </div>`;
}

function formatNutritionValue(value) {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toString();
}

function singularizeUnit(unit) {
  if (!unit) return 'serving';
  return unit.endsWith('s') ? unit.slice(0, -1) : unit;
}

function titleCase(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatNutritionScaleFactor(factor) {
  if (factor === 0.5) return '\u00BD';
  if (factor === 0.25) return '\u00BC';
  if (factor === 0.75) return '\u00BE';
  if (Number.isInteger(factor)) return factor.toString();
  return factor.toFixed(2).replace(/\.?0+$/, '');
}

function renderNotes(recipe) {
  const container = document.getElementById('notes-content');
  const hasNotes = recipe.notes && recipe.notes.length > 0;
  const hasLog = recipe.log && recipe.log.length > 0;

  if (!hasNotes && !hasLog) {
    container.innerHTML = '<div class="empty-log">No notes yet. Make the recipe and add your observations!</div>';
    return;
  }

  let html = '';

  if (hasNotes) {
    html += '<div class="section"><div class="section-title">\u25C6 Notes</div>';
    recipe.notes.forEach(note => {
      html += `<div class="note-item">${note}</div>`;
    });
    html += '</div>';
  }

  if (hasNotes && hasLog) {
    html += '<hr class="win-hr">';
  }

  if (hasLog) {
    const sortedLog = [...recipe.log].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    html += '<div class="section"><div class="section-title">\u25C6 Lab Log</div>';
    sortedLog.forEach(entry => {
      const date = formatDate(entry.date);
      html += `<div class="log-entry">
        <div class="log-date">${date}</div>
        <div class="log-text">${entry.entry}</div>
      </div>`;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active to clicked tab and corresponding content
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById(`${target}-content`).classList.add('active');
    });
  });
}

function showError(message) {
  const content = document.querySelector('.content');
  content.innerHTML = `
    <div class="error-dialog">
      <div class="error-icon">\u26A0\uFE0F</div>
      <div class="error-message">${message}</div>
      <button class="error-btn" onclick="location.href='index.html'">OK</button>
    </div>
  `;
}

window.renderNutrition = renderNutrition;
window.setNutritionBatchMultiplier = setNutritionBatchMultiplier;
window.adjustNutritionBatchSize = adjustNutritionBatchSize;
window.adjustNutritionContainers = adjustNutritionContainers;
window.setNutritionIngredientView = setNutritionIngredientView;

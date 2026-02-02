// Recipe Loader - Fetches and renders recipe JSON
// Depends on: utils.js (must load first — provides formatQuantity, getTagColor)

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const recipeId = getRecipeIdFromUrl();
  if (!recipeId) {
    showError('No recipe specified. Please select a recipe from the index.');
    return;
  }

  try {
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

async function loadRecipe(id) {
  const response = await fetch(`recipes/${id}.json`);
  if (!response.ok) {
    throw new Error(`Recipe "${id}" not found`);
  }
  return await response.json();
}

function renderRecipe(recipe) {
  // Update window title
  document.title = `Recipe Viewer - ${recipe.title}`;
  document.getElementById('window-title').textContent = `\uD83D\uDCCB ${recipe.title}`;

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

  // Canonical badge
  if (recipe.canonical) {
    document.getElementById('canonical-badge').style.display = 'inline-block';
  }

  // Meta info (time)
  if (recipe.time) {
    const totalTime = (recipe.time.prep || 0) + (recipe.time.cook || 0);
    document.getElementById('recipe-meta').innerHTML = `
      <span>Prep: ${recipe.time.prep || '?'} min</span>
      <span>Cook: ${recipe.time.cook || '?'} min</span>
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

  // Ingredients
  renderIngredients(recipe);

  // Directions
  renderDirections(recipe);

  // Notes
  renderNotes(recipe);

  // Deviations
  renderDeviations(recipe);

  // Lab Log
  renderLog(recipe);
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

function renderDirections(recipe) {
  const container = document.getElementById('directions-content');
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

function renderNotes(recipe) {
  const container = document.getElementById('notes-content');

  if (!recipe.notes || recipe.notes.length === 0) {
    container.innerHTML = '<div class="empty-log">No notes yet.</div>';
    return;
  }

  let html = '<div class="section"><div class="section-title">\u25C6 Notes</div>';
  recipe.notes.forEach(note => {
    html += `<div class="note-item">${note}</div>`;
  });
  html += '</div>';

  container.innerHTML = html;
}

function renderDeviations(recipe) {
  const container = document.getElementById('deviations-content');

  if (!recipe.deviations || recipe.deviations.length === 0) {
    container.innerHTML = '<div class="empty-log">No deviations from tradition documented.</div>';
    return;
  }

  let html = '<div class="section"><div class="section-title">\u25C6 Deviations from Tradition</div>';
  recipe.deviations.forEach(dev => {
    html += `<div class="deviation-item">${dev}</div>`;
  });
  html += '</div>';

  if (recipe.source) {
    html += `<div class="section">
      <div class="section-title">\u25C6 Source</div>
      <p>${recipe.source}</p>
    </div>`;
  }

  container.innerHTML = html;
}

function renderLog(recipe) {
  const container = document.getElementById('log-content');

  if (!recipe.log || recipe.log.length === 0) {
    container.innerHTML = '<div class="empty-log">No lab entries yet. Make the recipe and add your observations!</div>';
    return;
  }

  // Sort by date, newest first
  const sortedLog = [...recipe.log].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  let html = '<div class="section"><div class="section-title">\u25C6 Lab Notebook</div>';
  sortedLog.forEach(entry => {
    const date = formatDate(entry.date);
    html += `<div class="log-entry">
      <div class="log-date">${date}</div>
      <div class="log-text">${entry.entry}</div>
    </div>`;
  });
  html += '</div>';

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

// Index page: status filter toolbar + recipe cards grouped into category sections.
// Depends on: utils.js (getTagColor), categories.js (RECIPE_CATEGORIES), manifest.js (RECIPE_MANIFEST)

const STATUS_FILTER_LABELS = {
  'all': 'All',
  'dialed-in': 'Dialed In',
  'experimenting': 'Experimenting',
  'to-cook': 'To Cook'
};

const UNCATEGORIZED = { key: 'uncategorized', label: 'Uncategorized' };

let currentFilter = 'all';

// "All" means everything that has actually been cooked; To Cook briefs only show under their own filter.
function filterByStatus(recipes, filter) {
  if (filter === 'all') return recipes.filter(r => r.status !== 'to-cook');
  return recipes.filter(r => r.status === filter);
}

// Returns non-empty sections in RECIPE_CATEGORIES order. Recipes with a missing or
// unknown category land in a trailing Uncategorized section so they are never hidden.
function groupByCategory(recipes, categories) {
  const known = new Set(categories.map(c => c.key));
  const sections = [...categories, UNCATEGORIZED].map(c => ({ key: c.key, label: c.label, recipes: [] }));
  const byKey = new Map(sections.map(s => [s.key, s]));

  recipes.forEach(recipe => {
    const key = known.has(recipe.category) ? recipe.category : UNCATEGORIZED.key;
    byKey.get(key).recipes.push(recipe);
  });

  return sections.filter(s => s.recipes.length > 0);
}

// Dialed-in recipes float to the top of each section; otherwise manifest order is kept.
function sortForDisplay(recipes) {
  return [...recipes].sort((a, b) =>
    (b.status === 'dialed-in' ? 1 : 0) - (a.status === 'dialed-in' ? 1 : 0)
  );
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function recipeCardHtml(recipe) {
  let timeHtml = '';
  if (recipe.time) {
    const totalTime = (recipe.time.prep || 0) + (recipe.time.active || 0) + (recipe.time.passive || 0);
    const handsOnTime = (recipe.time.prep || 0) + (recipe.time.active || 0);
    timeHtml = `<div class="recipe-card-time">${formatTime(totalTime)} total · ${formatTime(handsOnTime)} hands-on</div>`;
  }

  const tagsHtml = (recipe.tags || []).slice(0, 3).map(tag =>
    `<span class="tag" style="background: ${getTagColor(tag)}">${escapeHtml(tag)}</span>`
  ).join('');

  const toCookHtml = recipe.status === 'to-cook'
    ? '<div class="to-cook-status">&#9744; TO COOK</div>'
    : '';

  const href = `recipe.html?id=${encodeURIComponent(recipe.id)}`;

  return `
    <div class="recipe-card status-${escapeHtml(recipe.status)}" data-id="${escapeHtml(recipe.id)}" onclick="location.href='${href}'">
      <div class="recipe-card-title">${escapeHtml(recipe.title)}</div>
      <div class="recipe-card-desc">${escapeHtml(recipe.desc)}</div>
      ${timeHtml}
      <div class="tags">${tagsHtml}</div>
      ${toCookHtml}
    </div>`;
}

function renderRecipeListHtml(recipes, filter, categories) {
  const sections = groupByCategory(filterByStatus(recipes, filter), categories);

  if (sections.length === 0) {
    return '<p class="recipe-list-empty">No recipes match the current filter.</p>';
  }

  return sections.map(section => `
    <section class="recipe-section" data-category="${escapeHtml(section.key)}">
      <h2 class="recipe-section-header">
        <span class="recipe-section-title">${escapeHtml(section.label)}</span>
        <span class="recipe-section-count">(${section.recipes.length})</span>
      </h2>
      <div class="recipe-grid">${sortForDisplay(section.recipes).map(recipeCardHtml).join('')}
      </div>
    </section>`).join('');
}

function renderRecipeList() {
  document.getElementById('recipe-list').innerHTML =
    renderRecipeListHtml(RECIPE_MANIFEST, currentFilter, RECIPE_CATEGORIES);
}

function updateStatus() {
  const count = filterByStatus(RECIPE_MANIFEST, currentFilter).length;
  document.getElementById('recipe-count').textContent = `${count} recipe${count !== 1 ? 's' : ''}`;
  document.getElementById('filter-status').textContent = `Filter: ${STATUS_FILTER_LABELS[currentFilter]}`;
}

function filterRecipes(filter, event) {
  currentFilter = filter;
  renderRecipeList();
  updateStatus();

  document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecipeList();
  updateStatus();
});

// Run with: node --test tests/nutrition.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const recipes = fs.readdirSync(path.join(root, 'recipes')).filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(fs.readFileSync(path.join(root, 'recipes', file), 'utf8')));
const byId = id => recipes.find(recipe => recipe.id === id);
const macros = ['calories', 'protein', 'fat', 'carbs', 'fiber'];

function viewer() {
  const elements = new Map();
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', style: {}, value: '', textContent: '' });
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  const context = vm.createContext({ document, window: {} });
  for (const file of ['js/recipe-loader.js', 'js/scaling.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const html = () => document.getElementById('nutrition-content').innerHTML;
  const values = () => [...html().matchAll(/class="nutrition-value">([^<]+)/g)].map(match => Number(match[1]));
  return { context, html, values };
}

test('every manifest recipe has valid nutrition data or a specific explanation', () => {
  const manifest = vm.runInNewContext(fs.readFileSync(path.join(root, 'js/manifest.js'), 'utf8') + '\nRECIPE_MANIFEST');
  assert.deepEqual(Array.from(manifest, recipe => recipe.id).sort(), recipes.map(recipe => recipe.id).sort());
  for (const recipe of recipes) {
    const nutrition = recipe.nutrition;
    assert.ok(nutrition?.notes?.length, recipe.id);
    assert.ok(['estimated', 'reference', 'unavailable'].includes(nutrition.status), recipe.id);
    if (nutrition.status === 'unavailable') {
      assert.equal(nutrition.batch, undefined, recipe.id);
      continue;
    }
    assert.ok(nutrition.servings.base > 0, recipe.id);
    assert.ok(['servings', 'portions', 'containers', 'slices', 'cups'].includes(nutrition.servings.unit), recipe.id);
    assert.ok(nutrition.ingredients.length, recipe.id);
    for (const row of nutrition.ingredients) {
      assert.equal(row.recipeQuantity.unit, row.basis.unit, `${recipe.id}: normalize units before storing`);
      assert.ok(row.recipeQuantity.amount > 0 && row.basis.amount > 0, recipe.id);
      assert.ok(/^https:\/\//.test(row.source), recipe.id);
      for (const key of macros) assert.ok(Number.isFinite(row.macros[key]) && row.macros[key] >= 0, `${recipe.id}: ${row.label} ${key}`);
    }
    for (const key of macros) {
      const sum = nutrition.ingredients.reduce((total, row) => total + row.macros[key] * row.recipeQuantity.amount / row.basis.amount, 0);
      assert.ok(Math.abs(sum - nutrition.batch[key]) < 0.011, `${recipe.id}: ${key} batch differs from ingredient sum`);
    }
  }
});

test('all recipe nutrition tabs render and half/double batches preserve their proportions', () => {
  const { context, html, values } = viewer();
  for (const recipe of recipes) {
    context.renderNutrition(recipe);
    if (!recipe.nutrition.batch) {
      assert.match(html(), /Nutrition not yet calculable/);
      assert.doesNotMatch(html(), /nutrition-value|nutrition-controls/);
      continue;
    }
    assert.equal(values().length, 10, recipe.id);
    const base = recipe.nutrition.batch.calories;
    const portions = recipe.nutrition.servings.base;
    assert.equal(values()[0], Math.round(base / portions), recipe.id);
    context.setNutritionBatchMultiplier(0.5);
    assert.equal(values()[5], Math.round(base / 2), recipe.id);
    assert.equal(values()[0], Math.round(base / 2 / portions), recipe.id);
    context.setNutritionBatchMultiplier(2);
    assert.equal(values()[5], Math.round(base * 2), recipe.id);
  }
});

test('bean and bread nutrition use portions instead of dry grams or whole loaves', () => {
  const { context, html, values } = viewer();
  context.renderNutrition(byId('pressure-cooker-white-beans'));
  assert.match(html(), /1× batch split into 4 portions/);
  assert.equal(values()[0], 192);
  context.initScaling(byId('milk-bread'));
  context.renderNutrition(byId('milk-bread'));
  context.setMultiplier(0.5);
  assert.equal(context.getRecipeScaleState().currentServings, 0.5);
  assert.match(html(), /½× batch split into 6 slices/);
  assert.equal(values()[0], 177);
});

test('fractional pound and gram yields are not rounded by recipe scaling', () => {
  const { context } = viewer();
  context.initScaling(byId('chipotle-braised-pork'));
  context.setMultiplier(1);
  assert.equal(context.getRecipeScaleState().currentServings, 4.5);
  context.setMultiplier(0.5);
  assert.equal(context.getRecipeScaleState().currentServings, 2.25);
  context.initScaling(byId('pressure-cooker-white-beans'));
  context.setMultiplier(0.5);
  assert.equal(context.getRecipeScaleState().currentServings, 112.5);
  context.adjustServings(1);
  assert.equal(context.getRecipeScaleState().currentServings, 113.5);
});

test('independent portions exceed 20, stay positive, and reset to recipe scale', () => {
  const { context, html, values } = viewer();
  const recipe = byId('cajun-chicken-pasta');
  context.initScaling(recipe);
  context.renderNutrition(recipe);
  context.adjustNutritionContainers(1);
  assert.equal(values()[0], 511);
  context.setMultiplier(2);
  assert.equal(values()[5], 2554); // A manual nutrition split stays independent.
  context.resetNutritionScale();
  assert.equal(values()[5], 5108);
  assert.match(html(), /2× batch split into 8 portions/);
  context.adjustNutritionContainers(16);
  assert.match(html(), /split into 24 portions/);
  context.adjustNutritionContainers(-100);
  assert.match(html(), /split into 1 portion</);
  context.setNutritionBatchMultiplier(0.5);
  context.adjustNutritionBatchSize(-1);
  assert.match(html(), /¼× batch/);
});

test('ingredient basis, batch, and portion views use the selected scale', () => {
  const { context } = viewer();
  context.renderNutrition(byId('big-flavor-broccoli'));
  const row = { recipeQuantity: { amount: 100, unit: 'g' }, basis: { amount: 50, unit: 'g' }, macros: { calories: 200, protein: 10, fat: 12, carbs: 5, fiber: 1 } };
  assert.equal(context.getIngredientNutritionValues(row, 'basis', 2).macros.calories, 200);
  assert.equal(context.getIngredientNutritionValues(row, 'batch', 2).macros.calories, 800);
  assert.equal(context.getIngredientNutritionValues(row, 'container', 2).macros.calories, 200);
  context.adjustNutritionContainers(1);
  assert.equal(context.getIngredientNutritionValues(row, 'container', 2).macros.calories, 160);
});

test('stock labels reference values and unknown results do not appear as zero', () => {
  const { context, html } = viewer();
  context.renderNutrition(byId('pressure-cooked-chicken-veg-stock'));
  assert.match(html(), /Reference only/);
  assert.match(html(), /Reference Per Portion/);
  context.renderNutrition(byId('kvass'));
  assert.doesNotMatch(html(), /nutrition-value/);
  assert.equal(context.formatNutritionValue(undefined), '—');
  assert.equal(context.formatIngredientMacro(undefined), '—');
});

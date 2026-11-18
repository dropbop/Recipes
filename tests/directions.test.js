// Run with: node --test tests/directions.test.js
// The method has to scale with the recipe: every amount a reader sees in a step comes from an
// ingredient token, so hitting 2x doubles it in the steps just like in the ingredient list.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const recipes = fs.readdirSync(path.join(root, 'recipes')).filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(read(`recipes/${file}`)));

const TOKEN = /\{([a-z0-9-]+)(?::(\d*\.?\d+)(?:-(\d*\.?\d+))?)?\}/g;
// An amount typed straight into a step, which would not scale.
const HARDCODED = /(?:\d+(?:\.\d+)?|[½¼¾⅓⅔⅛])(?:\s*(?:-|–|to)\s*(?:\d+(?:\.\d+)?|[½¼¾⅓⅔⅛]))?\s*(?:g|kg|ml|oz|lbs?|cups?|tbsp|tsp|tablespoons?|teaspoons?|cloves?|sprigs?|liters?|quarts?|pounds?|ounces?|grams?)\b/i;

function viewer() {
  const elements = new Map();
  const document = {
    body: { style: { setProperty() {} }, classList: { add() {}, remove() {} } },
    documentElement: { style: { setProperty() {} } },
    addEventListener() {},
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', style: {}, value: '', textContent: '' });
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  const window = {};
  const context = vm.createContext({ document, window, localStorage: { getItem() { return null; }, setItem() {} } });
  for (const file of ['js/utils.js', 'js/scaling.js', 'js/recipe-loader.js']) {
    vm.runInContext(read(file), context, { filename: file });
  }
  // The page reaches these through window; the sandbox keeps window and globals separate.
  vm.runInContext('window.renderDirections = renderDirections; window.renderNutrition = renderNutrition;', context);
  const method = () => document.getElementById('directions-list').innerHTML
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace('◆ Method', '').trim();
  return { context, method };
}

const sample = {
  id: 'sample',
  servings: { base: 4, unit: 'servings' },
  ingredientGroups: [
    { name: 'Stuff', items: [
      { key: 'milk', quantity: 0.5, quantityMax: null, unit: 'cups', item: 'milk', note: null, scalable: true },
      { key: 'butter', quantity: 8, quantityMax: null, unit: 'tbsp', item: 'butter', note: null, scalable: true },
      { key: 'garlic', quantity: 4, quantityMax: 6, unit: 'cloves', item: 'garlic', note: null, scalable: true },
      { key: 'bay', quantity: 2, quantityMax: null, unit: '', item: 'bay leaves', note: null, scalable: false }
    ] }
  ],
  directions: [
    { step: 1, text: 'Warm {milk} milk. Melt {butter} butter, then brush {butter:2} on top.' },
    { step: 2, text: 'Add {garlic} garlic and {bay} bay leaves.' }
  ]
};

test('method amounts render from the ingredient list and scale with the recipe', () => {
  const { context, method } = viewer();
  context.initScaling(sample);
  context.renderDirections(sample);
  assert.equal(method(), '1 Warm ½ cup milk. Melt 8 tbsp butter, then brush 2 tbsp on top. 2 Add 4–6 cloves garlic and 2 bay leaves.');

  context.scaleIngredients(2);
  assert.equal(method(), '1 Warm 1 cup milk. Melt 16 tbsp butter, then brush 4 tbsp on top. 2 Add 8–12 cloves garlic and 2 bay leaves.');

  context.scaleIngredients(0.5);
  assert.equal(method(), '1 Warm ¼ cup milk. Melt 4 tbsp butter, then brush 1 tbsp on top. 2 Add 2–3 cloves garlic and 2 bay leaves.');
});

test('a token that points at nothing shows up as broken instead of disappearing', () => {
  const { context } = viewer();
  assert.match(context.renderDirectionText('Add {nope} salt.', sample), /direction-qty-missing">\{nope\}/);
});

for (const recipe of recipes) {
  test(`${recipe.id}: method amounts come from the ingredient list`, () => {
    const items = (recipe.ingredientGroups || []).flatMap(group => group.items);
    const keyed = new Map();
    for (const item of items) {
      if (!item.key) continue;
      assert.match(item.key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `bad key "${item.key}"`);
      assert.ok(!keyed.has(item.key), `duplicate key "${item.key}"`);
      keyed.set(item.key, item);
    }

    const used = new Set();
    const parts = new Map();
    for (const dir of recipe.directions || []) {
      for (const [token, key, part] of dir.text.matchAll(TOKEN)) {
        const item = keyed.get(key);
        assert.ok(item, `step ${dir.step}: ${token} matches no ingredient key`);
        assert.ok(typeof item.quantity === 'number', `step ${dir.step}: ${token} points at an ingredient with no quantity`);
        used.add(key);
        if (part !== undefined) parts.set(key, (parts.get(key) || 0) + Number(part));
      }
      const plain = dir.text.replace(TOKEN, '');
      const hardcoded = HARDCODED.exec(plain);
      assert.equal(hardcoded, null, `step ${dir.step}: "${hardcoded?.[0]}" is typed in and won't scale; use a token`);
    }

    for (const [key, total] of parts) {
      const item = keyed.get(key);
      const available = item.quantityMax ?? item.quantity;
      assert.ok(total <= available + 1e-9, `parts of {${key}} add up to ${total}, more than the ${available} listed`);
    }

    if ((recipe.directions || []).length === 0) return;
    for (const item of items) {
      if (typeof item.quantity !== 'number') continue;
      assert.ok(item.key && used.has(item.key), `"${item.item}" has an amount but never appears in the method`);
    }
  });
}

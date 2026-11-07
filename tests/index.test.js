// Run with: node --test tests/
// Checks the index page the way a reader sees it: which recipes show up, under which
// heading, in what order, and whether every card leads to a real recipe.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const recipeFiles = fs.readdirSync(path.join(root, 'recipes')).filter(file => file.endsWith('.json'));
const recipes = recipeFiles.map(file => JSON.parse(read(`recipes/${file}`)));
const recipeById = new Map(recipes.map(recipe => [recipe.id, recipe]));
const STATUSES = ['dialed-in', 'experimenting', 'to-cook'];

// Loads the index page's scripts in index.html order against a minimal DOM.
function loadIndexPage() {
  const elements = new Map();
  const listeners = [];
  const element = () => ({
    innerHTML: '', textContent: '', style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, contains() { return false; }
  });
  const document = {
    body: element(),
    addEventListener(type, fn) { if (type === 'DOMContentLoaded') listeners.push(fn); },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll() { return []; }
  };
  const localStorage = { getItem() { return null; }, setItem() {} };
  const context = vm.createContext({ document, localStorage, window: {} });

  const indexHtml = read('index.html');
  const scripts = [...indexHtml.matchAll(/<script src="([^"?]+)/g)].map(match => match[1]);
  assert.deepEqual(scripts, ['js/utils.js', 'js/categories.js', 'js/manifest.js', 'js/index.js'],
    'index.html must load utils, categories and manifest before index.js');
  for (const file of scripts) vm.runInContext(read(file), context, { filename: file });
  listeners.forEach(fn => fn());

  return {
    context,
    // Copied out as plain data: arrays from the sandbox carry a different Array prototype.
    manifest: JSON.parse(vm.runInContext('JSON.stringify(RECIPE_MANIFEST)', context)),
    categories: JSON.parse(vm.runInContext('JSON.stringify(RECIPE_CATEGORIES)', context)),
    listHtml: () => document.getElementById('recipe-list').innerHTML,
    countText: () => document.getElementById('recipe-count').textContent,
    filterText: () => document.getElementById('filter-status').textContent,
    click: filter => context.filterRecipes(filter, { target: element() })
  };
}

// Reads rendered markup back into what a reader sees: headings, counts, and where each card links.
function readList(html) {
  return [...html.matchAll(/<section class="recipe-section"[^>]*>([\s\S]*?)<\/section>/g)].map(([, body]) => ({
    heading: /class="recipe-section-title">([^<]*)</.exec(body)?.[1],
    shownCount: Number(/class="recipe-section-count">\((\d+)\)</.exec(body)?.[1]),
    ids: [...body.matchAll(/class="recipe-card[\s\S]*?location\.href='([^']+)'/g)].map(([, href]) => {
      const url = new URL(href, 'https://example.test/');
      assert.equal(url.pathname, '/recipe.html');
      return url.searchParams.get('id');
    })
  }));
}

const fixture = (id, category, status = 'experimenting') => ({ id, title: `Title ${id}`, desc: '', tags: [], status, category });

test('category list is well formed', () => {
  const { categories } = loadIndexPage();
  assert.ok(categories.length > 0);
  assert.equal(new Set(categories.map(c => c.key)).size, categories.length, 'duplicate category key');
  for (const c of categories) {
    assert.match(c.key, /^[a-z]+(-[a-z]+)*$/, `${c.key}: keys are lowercase hyphenated`);
    assert.ok(c.label.trim(), `${c.key}: needs a label`);
  }
});

test('every recipe has a valid category and its manifest entry matches the recipe file', () => {
  const { manifest, categories } = loadIndexPage();
  const keys = new Set(categories.map(c => c.key));
  assert.equal(new Set(manifest.map(m => m.id)).size, manifest.length, 'duplicate manifest id');
  assert.deepEqual(manifest.map(m => m.id).sort(), recipes.map(r => r.id).sort(), 'manifest and recipes/ disagree');

  for (const recipe of recipes) {
    assert.ok(recipeFiles.includes(`${recipe.id}.json`), `${recipe.id}: id must match filename`);
    assert.ok(keys.has(recipe.category), `${recipe.id}: category "${recipe.category}" is not in js/categories.js`);
    assert.ok(STATUSES.includes(recipe.status), `${recipe.id}: unknown status "${recipe.status}"`);
    const entry = manifest.find(m => m.id === recipe.id);
    for (const field of ['title', 'status', 'category', 'tags', 'time']) {
      assert.deepEqual(entry[field], recipe[field], `${recipe.id}: manifest ${field} differs from recipe JSON`);
    }
    assert.ok(entry.desc, `${recipe.id}: manifest needs a desc for the index card`);
    assert.equal(recipe.canonical, undefined, `${recipe.id}: canonical was retired; use status`);
  }
});

test('All view shows every cooked recipe exactly once, under its category heading, in category order', () => {
  const page = loadIndexPage();
  const sections = readList(page.listHtml());
  const cooked = recipes.filter(r => r.status !== 'to-cook');
  const shown = sections.flatMap(s => s.ids);

  assert.deepEqual([...shown].sort(), cooked.map(r => r.id).sort(), 'All must show every cooked recipe and no To Cook briefs');
  assert.equal(new Set(shown).size, shown.length, 'a recipe appears twice');

  const labelOrder = page.categories.map(c => c.label);
  const headings = sections.map(s => s.heading);
  assert.deepEqual(headings, labelOrder.filter(label => headings.includes(label)), 'sections out of order');

  for (const section of sections) {
    const category = page.categories.find(c => c.label === section.heading);
    assert.ok(category, `unexpected section "${section.heading}"`);
    assert.ok(section.ids.length > 0, `empty section "${section.heading}" is rendered`);
    assert.equal(section.shownCount, section.ids.length, `${section.heading}: heading count is wrong`);
    for (const id of section.ids) {
      assert.ok(recipeById.has(id), `card links to missing recipe ${id}`);
      assert.equal(recipeById.get(id).category, category.key, `${id} is under the wrong heading`);
    }
  }
  assert.equal(page.countText(), `${cooked.length} recipes`);
  assert.equal(page.filterText(), 'Filter: All');
});

test('each status filter shows exactly that status, still grouped, and the status bar agrees', () => {
  const page = loadIndexPage();
  for (const [status, label] of [['dialed-in', 'Dialed In'], ['experimenting', 'Experimenting'], ['to-cook', 'To Cook']]) {
    page.click(status);
    const sections = readList(page.listHtml());
    const shown = sections.flatMap(s => s.ids).sort();
    const expected = recipes.filter(r => r.status === status).map(r => r.id).sort();
    assert.deepEqual(shown, expected, `${status} filter`);
    for (const section of sections) assert.ok(section.ids.length > 0, `${status}: empty "${section.heading}" rendered`);
    assert.equal(page.countText(), `${expected.length} recipe${expected.length === 1 ? '' : 's'}`);
    assert.equal(page.filterText(), `Filter: ${label}`);
  }
  page.click('all');
  assert.ok(readList(page.listHtml()).every(s => s.ids.every(id => recipeById.get(id).status !== 'to-cook')));
});

test('recipes with a missing or unknown category are still shown, in Uncategorized at the bottom', () => {
  const { context, categories } = loadIndexPage();
  const list = [
    fixture('no-category', undefined),
    fixture('typo-category', 'mainz'),
    fixture('a-main', 'mains'),
    fixture('a-dessert', 'desserts')
  ];
  const sections = readList(context.renderRecipeListHtml(list, 'all', categories));
  const last = sections.at(-1);
  assert.equal(last.heading, 'Uncategorized');
  assert.deepEqual(last.ids.sort(), ['no-category', 'typo-category']);
  assert.deepEqual(sections.flatMap(s => s.ids).sort(), list.map(r => r.id).sort());

  const clean = readList(context.renderRecipeListHtml(list.slice(2), 'all', categories));
  assert.ok(!clean.some(s => s.heading === 'Uncategorized'), 'Uncategorized shown with nothing in it');
});

test('dialed-in recipes come first within a section in the All view', () => {
  const { context, categories } = loadIndexPage();
  const list = [fixture('exp-1', 'mains'), fixture('dial-1', 'mains', 'dialed-in'), fixture('exp-2', 'mains'), fixture('dial-2', 'mains', 'dialed-in')];
  const [mains] = readList(context.renderRecipeListHtml(list, 'all', categories));
  assert.deepEqual(mains.ids, ['dial-1', 'dial-2', 'exp-1', 'exp-2']);
});

test('a filter with no matches says so instead of rendering empty sections', () => {
  const { context, categories } = loadIndexPage();
  const html = context.renderRecipeListHtml([fixture('only-planned', 'mains', 'to-cook')], 'dialed-in', categories);
  assert.equal(readList(html).length, 0);
  assert.match(html, /No recipes match the current filter/);
});

test('recipe text is shown literally, not interpreted as markup', () => {
  const { context, categories } = loadIndexPage();
  const html = context.renderRecipeListHtml([{ ...fixture('x', 'mains'), title: 'Mac & <b>Cheese</b>' }], 'all', categories);
  assert.doesNotMatch(html, /<b>Cheese<\/b>/);
  assert.match(html, /Mac &amp; &lt;b&gt;Cheese/);
});

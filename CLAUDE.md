# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal recipe lab notebook site with Win98 aesthetic. Static HTML/CSS/JS, no build step, deployed via GitHub Pages.

## Adding Recipes

If the user wants to add a new recipe, **read `recipe-writing-guide.md` in full** before proceeding. That guide covers the JSON schema, voice preservation, and the required back-and-forth workflow for confirming entries with the user. Do not skip the confirmation steps.

## Architecture

**Two-page structure:**
- `index.html` — Explorer-style recipe listing, reads from `js/manifest.js`. Status filter toolbar (All / Dialed In / Experimenting / To Cook); cards are grouped into category sections.
- `recipe.html` — Recipe viewer template, loads recipe via `?id=slug` query param

**Data flow:**
1. `js/manifest.js` contains metadata array for index page (avoids CORS issues with static hosting)
2. Individual recipes stored as JSON in `recipes/{id}.json`
3. `js/categories.js` defines `RECIPE_CATEGORIES`, the ordered list of index sections (`{ key, label }`)
4. `js/index.js` renders the index: filters by status, groups by category, puts missing/unknown categories in a trailing Uncategorized section
5. `js/recipe-loader.js` fetches and renders recipe JSON
6. `js/scaling.js` handles ingredient scaling with multiplier buttons
7. `js/utils.js` contains shared functions (`formatQuantity`, `getTagColor`, theme system)

**Script load order matters:**
- `recipe.html`: `utils.js` → `scaling.js` → `recipe-loader.js`
- `index.html`: `utils.js` → `categories.js` → `manifest.js` → `index.js`

**Cache busting:** GitHub Pages caches aggressively. When a recipe or manifest changes, bump the `?v=` stamps in `index.html` / `recipe.html` and `RECIPE_DATA_VERSION` in `js/recipe-loader.js`.

## Adding a New Recipe

1. Create `recipes/{slug}.json` following the schema (see existing recipes)
2. Add entry to `RECIPE_MANIFEST` array in `js/manifest.js`
3. Run `node --test`

## Manifest Schema (`js/manifest.js`)

Each entry in `RECIPE_MANIFEST` has:
- `id` — matches the JSON filename (e.g., `"shrimp-scampi"` → `recipes/shrimp-scampi.json`)
- `title` — display name on index cards
- `desc` — short description (50-60 chars) shown on index cards below title
- `tags` — array of strings for display
- `time` — `{ prep, active, passive }` in minutes; omit when unknown (To Cook)
- `status` — `to-cook`, `experimenting`, or `dialed-in`; dialed-in cards get a burgundy left border and sort first
- `category` — one key from `js/categories.js`; decides the index section

`title`, `tags`, `time`, `status`, and `category` must match the recipe JSON (enforced by tests).

## Recipe JSON Schema

Key fields:
- `id`, `title`
- `status` — `to-cook` (planning brief), `experimenting` (cooked, still changing), `dialed-in` (settled)
- `category` — `small-plates`, `mains`, `sides`, `meal-prep`, `breads`, `desserts`, `staples`, or `beverages` (definitions and tie-breaks in `recipe-writing-guide.md`)
- `description` — 1-2 sentence blurb shown in Overview tab; explains what the dish is and what makes this version distinct
- `subtitle`, `source` — optional metadata
- `time` — `{ prep, active, passive }` in minutes: hands-on prep, hands-on cooking, unattended time
- `nutrition` — optional `{ batch: { calories, protein, fat, carbs, fiber }, ingredients: [...] }` for batch totals and ingredient macro breakdowns
- `ingredientGroups[].items[]` with `quantity`, `quantityMax` (for ranges like "4–6"), `unit`, `item`, `note`, `scalable`
- `directions[]` with `step`, `title` (optional), `text`
- `deviations[]` — array of `{ what, why }` objects explaining what you changed from tradition and why
- `notes[]` — array of strings for cooking tips and future improvements (not deviation explanations)
- `openQuestions[]` — unresolved planning decisions (mainly To Cook records)
- `log[]` — dated lab notebook entries: `{ date, entry }`

## Tests

`node --test` from the repo root runs everything in `tests/`:
- `tests/index.test.js` — category/manifest data checks, and the rendered index (every recipe shown once under the right heading, filters, Uncategorized fallback)
- `tests/nutrition.test.js` — nutrition data and the Nutrition tab's scaling math

Tests should check what the page is supposed to do for a reader, not mirror the implementation.

## Theme System

Six desktop background colors selectable via View menu, persisted in localStorage:
- teal `#547E7E`, slate `#5A6A7A`, olive `#6B6B4A`, plum `#6B4A5E` (default), storm `#4A5A6B`, charcoal `#4A4A4A`

## Design Constraints

- Win98 aesthetic is intentional — no soft shadows, no gradients on body, use Trebuchet MS not Comic Sans
- All paths must be relative (works on GitHub Pages at `/Recipes/`)
- `.nojekyll` file prevents Jekyll processing
- Tab order: Overview → Recipe → Nutrition → Notes
  - **Overview:** description, deviations from tradition, source
  - **Recipe:** scaling controls, ingredients, directions (single scroll for cooking)
  - **Nutrition:** optional batch/per-serving macro totals and ingredient macro breakdowns with independent batch-size and split-count controls
  - **Notes:** cooking notes + lab log combined

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal recipe lab notebook site with Win98 aesthetic. Static HTML/CSS/JS, no build step, deployed via GitHub Pages.

## Architecture

**Two-page structure:**
- `index.html` — Explorer-style recipe listing, reads from `js/manifest.js`
- `recipe.html` — Recipe viewer template, loads recipe via `?id=slug` query param

**Data flow:**
1. `js/manifest.js` contains metadata array for index page (avoids CORS issues with static hosting)
2. Individual recipes stored as JSON in `recipes/{id}.json`
3. `js/recipe-loader.js` fetches and renders recipe JSON
4. `js/scaling.js` handles ingredient scaling with multiplier buttons
5. `js/utils.js` contains shared functions (`formatQuantity`, `getTagColor`)

**Script load order matters:** `utils.js` → `scaling.js` → `recipe-loader.js`

## Adding a New Recipe

1. Create `recipes/{slug}.json` following the schema (see existing recipes)
2. Add entry to `RECIPE_MANIFEST` array in `js/manifest.js`

## Recipe JSON Schema

Key fields:
- `id`, `title`, `version`, `canonical` (boolean for "dialed in" recipes)
- `ingredientGroups[].items[]` with `quantity`, `quantityMax` (for ranges like "4–6"), `unit`, `item`, `note`, `scalable`
- `directions[]` with `step`, `title` (optional), `text`
- `notes[]`, `deviations[]` — arrays of strings
- `log[]` — dated lab notebook entries: `{ date, entry }`

## Design Constraints

- Win98 aesthetic is intentional — no soft shadows, no gradients on body, use Trebuchet MS not Comic Sans
- All paths must be relative (works on GitHub Pages at `/Recipes/`)
- `.nojekyll` file prevents Jekyll processing

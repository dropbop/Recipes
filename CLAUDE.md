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
5. `js/utils.js` contains shared functions (`formatQuantity`, `getTagColor`, theme system)

**Script load order matters:** `utils.js` → `scaling.js` → `recipe-loader.js`

## Adding a New Recipe

1. Create `recipes/{slug}.json` following the schema (see existing recipes)
2. Add entry to `RECIPE_MANIFEST` array in `js/manifest.js`

## Manifest Schema (`js/manifest.js`)

Each entry in `RECIPE_MANIFEST` has:
- `id` — matches the JSON filename (e.g., `"shrimp-scampi"` → `recipes/shrimp-scampi.json`)
- `title` — display name on index cards
- `desc` — short description (50-60 chars) shown on index cards below title
- `tags` — array of strings for filtering/display
- `time` — `{ prep, cook }` in minutes
- `canonical` — boolean, shows burgundy border on index cards

## Recipe JSON Schema

Key fields:
- `id`, `title`, `canonical` (boolean — shows burgundy border on index cards, used for filtering; not displayed on recipe page)
- `description` — 1-2 sentence blurb shown in Overview tab; explains what the dish is and what makes this version distinct
- `subtitle`, `source` — optional metadata
- `ingredientGroups[].items[]` with `quantity`, `quantityMax` (for ranges like "4–6"), `unit`, `item`, `note`, `scalable`
- `directions[]` with `step`, `title` (optional), `text`
- `deviations[]` — array of `{ what, why }` objects explaining what you changed from tradition and why
- `notes[]` — array of strings for cooking tips and future improvements (not deviation explanations)
- `log[]` — dated lab notebook entries: `{ date, entry }`

## Theme System

Six desktop background colors selectable via View menu, persisted in localStorage:
- teal `#547E7E` (default), slate `#5A6A7A`, olive `#6B6B4A`, plum `#6B4A5E`, storm `#4A5A6B`, charcoal `#4A4A4A`

## Design Constraints

- Win98 aesthetic is intentional — no soft shadows, no gradients on body, use Trebuchet MS not Comic Sans
- All paths must be relative (works on GitHub Pages at `/Recipes/`)
- `.nojekyll` file prevents Jekyll processing
- Tab order: Overview → Recipe → Notes
  - **Overview:** description, deviations from tradition, source
  - **Recipe:** scaling controls, ingredients, directions (single scroll for cooking)
  - **Notes:** cooking notes + lab log combined

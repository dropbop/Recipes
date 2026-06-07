# Repository Guidelines

## Project Structure & Module Organization

This is a static GitHub Pages recipe notebook. There is no build step.

- `index.html` renders the recipe explorer from `js/manifest.js`.
- `recipe.html` renders individual recipes from `recipes/{id}.json`.
- `recommendations.html` contains standalone recommendation content.
- `css/win95.css` holds the Win98-style visual system and responsive/print styles.
- `js/utils.js` contains shared formatting, tag colors, and theme persistence.
- `js/scaling.js` handles ingredient scaling controls.
- `js/recipe-loader.js` fetches and renders recipe JSON.
- `recipes/*.json` are the source of truth for full recipe content.
- `.nojekyll` and `CNAME` support GitHub Pages deployment.

## Build, Test, and Development Commands

No package manager or framework is used. Open `index.html` directly, or serve the directory with any static server if fetch behavior needs testing:

```bash
python3 -m http.server 8000
```

Validate recipe JSON before committing:

```bash
jq empty recipes/*.json
```

Check manifest/file consistency manually when adding recipes: each manifest `id` must match `recipes/{id}.json`.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, JavaScript, CSS, and JSON. Keep paths relative so the site works under GitHub Pages at `/Recipes/`.

Recipe IDs and filenames are lowercase hyphenated slugs, for example `polpette-del-rinascimento` and `recipes/polpette-del-rinascimento.json`. Tags are lowercase and hyphenated when multi-word.

Preserve the existing plain JavaScript style. Script load order matters: `utils.js`, then `scaling.js`, then `recipe-loader.js`.

## Recipe Data Guidelines

Read `recipe-writing-guide.md` before adding or rewriting recipes. Confirm title, description, canonical status, deviations, ingredients, directions, notes, and log entries with the user before creating JSON.

Use `canonical: true` only for dialed-in recipes. Put deliberate departures from tradition in `deviations`, durable cooking advice in `notes`, and dated cook-session observations in `log`.

## Testing Guidelines

There is no automated test suite. At minimum, validate JSON with `jq`, load `index.html`, open the new recipe page, switch tabs, test scaling buttons, and verify print layout if the recipe format changed.

## Commit & Pull Request Guidelines

Commit messages in this repo are short, imperative summaries, such as `Add pressure cooker white beans recipe` or `Update shrimp scampi recipe from 2/8 cook`.

For pull requests, describe what changed, why it changed, and how it was checked. Include screenshots for visible layout or style changes. Do not include unrelated local files such as `.codex`.

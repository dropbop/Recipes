# Recipe Writing Guide

Reference for translating a casual recipe description into a structured JSON file for the recipe lab notebook site. Read this in full before writing any recipe JSON.

---

## Workflow

This is a **collaborative process**, not a one-shot generation. The user may not know what fields like "deviations" or recipe `status` mean. Walk them through it.

### Step 1: Gather the raw recipe
User describes a recipe in their own voice — stream of consciousness, shorthand, whatever. Don't interrupt. Let them dump it all out.

### Step 2: Confirm identity and framing
Before writing any JSON, confirm these with the user:

- **Title**: "I'm calling this [X] — does that work?"
- **Description**: Draft 1-2 sentences explaining what the dish is and what makes this version distinct. Show it to the user: "Here's how I'd describe this for the overview — [description]. Does that capture it?"
- **Status**: Confirm whether this is `to-cook` (not made yet), `experimenting` (made but still changing), or `dialed-in` (you'd make it the same way next time).
- **Deviations**: This is the core of the site. Ask: "What did you change from the traditional version, and why?" If the user doesn't know what's traditional, help them identify deviations based on culinary knowledge. Confirm each one: "So the deviation is [what] because [why] — right?"

### Step 3: Confirm ingredients
Draft the ingredient groups and show them to the user. Call out:
- How you've grouped things ("I put the aromatics in their own group — make sense?")
- Any judgment calls on scaling ("I marked the bay leaves as non-scaling since you'd use the same amount for any batch size")
- Notes you've attached ("I added 'see notes' to the butter since you mentioned it might need more")

### Step 4: Confirm directions
Draft the directions preserving the user's voice. Show them: "Here's how I wrote up the method — [directions]. I kept your phrasing about [X]. Anything to adjust?"

### Step 5: Notes, deviations, and log
- **Notes**: Durable cooking tips. "You mentioned [X] — I'm putting that in notes since it applies every time you make this."
- **Deviations**: Already confirmed in step 2, but review the final list.
- **Log**: If this is from a specific cook session, ask: "Should I add a dated log entry for this cook? What was the date?"

### Step 6: Create files
1. Write `recipes/{slug}.json`
2. Add an entry to `js/manifest.js` with matching `id`, `title`, `desc`, `tags`, optional `time`, and `status`

### Step 7: Final review
Show the user the complete JSON (or summarize key fields) and confirm before committing.

---

## JSON Schema

```json
{
  "id": "slug-like-this",
  "title": "Title Case Name",
  "subtitle": "optional — short qualifier if needed",
  "description": "1-2 sentences. What the dish IS and what makes THIS version distinct.",
  "status": "experimenting",
  "tags": ["protein", "cuisine", "method", "context"],
  "source": "Where it came from",
  "time": {
    "prep": 20,
    "active": 25,
    "passive": 0
  },
  "servings": {
    "base": 4,
    "unit": "servings"
  },
  "nutrition": {
    "batch": {
      "calories": 0,
      "protein": 0,
      "fat": 0,
      "carbs": 0,
      "fiber": 0
    },
    "ingredients": [
      {
        "label": "Parmesan",
        "recipeQuantity": { "amount": 100, "unit": "g" },
        "basis": { "amount": 50, "unit": "g" },
        "macros": {
          "calories": 195,
          "protein": 18,
          "fat": 13,
          "carbs": 1.5,
          "fiber": 0
        }
      }
    ]
  },
  "ingredientGroups": [],
  "directions": [],
  "notes": [],
  "deviations": [],
  "openQuestions": [],
  "log": []
}
```

---

## Field-by-Field Guidance

**id**: Lowercase, hyphenated. Match the filename: `recipes/{id}.json`.

**title**: The dish name. No version numbers, no qualifiers — that's what `subtitle` is for.

**subtitle**: Optional. Use sparingly. "Intentionally Imperfect" for a first attempt, or a short descriptor if the title alone is ambiguous. Most recipes won't need one.

**description**: Shows in the Overview tab and on index cards. Tell someone what they're looking at and why this version exists. Examples:
- "A pepper-heavy wine braise. The garlic paste is the whole trick — it penetrates the meat in a way whole cloves can't."
- "A hard-seared take on scampi that trades the traditional gentle saute for fond and crust. The MSG is doing the work that shell stock would do in a restaurant version."

**status**: Exactly one lifecycle value:
- `to-cook` — a planning brief that has not been made yet
- `experimenting` — cooked at least once but still being adjusted
- `dialed-in` — cooked and settled enough that you'd make it the same way next time

Do not add a separate `canonical` boolean. A To Cook record moves to `experimenting` after the first cook, once the recipe is completed and the first dated log entry is added.

**tags**: 3-5 tags. Consistent vocabulary across recipes. Categories: protein (beef, seafood, chicken), cuisine (italian, japanese, cajun), method (braise, grill, quick), context (weeknight, winter, meal-prep). Lowercase, hyphenated if multi-word.

**source**: One line. Can be casual: "Family tradition, heavily improvised" or "Kenji's recipe with modifications" or "Made it up after eating something similar at Sézanne."

### To Cook records

A `to-cook` record is an honest planning brief, not a fake finished recipe. Use the normal recipe fields for everything already known and `openQuestions` for decisions that remain unresolved.

- `time`, `servings`, and `nutrition` may be omitted when unknown.
- `ingredientGroups` and `directions` may be partial or empty arrays.
- Unknown quantities should be `null`; do not invent numbers just to complete the schema.
- `notes` should preserve useful planning context, equipment needs, and menu ideas.
- `log` stays empty until the dish has actually been cooked.
- After the first cook, fill in the recipe, change `status` to `experimenting`, and add the first dated log entry.

**time**: Three buckets, all in whole minutes — `prep`, `active`, `passive`.
- `prep` — hands-on work before cooking starts: knife work, measuring, forming, dry-brining setup.
- `active` — hands-on work *during* cooking that needs your attention: searing, stirring, monitoring a reduction.
- `passive` — unattended time the dish takes care of itself: braising, proofing, marinating, chilling, freezing.

Split honestly. A 4-hour freeze is `passive: 240`, never active time. A 10-minute sear you can't walk away from is `active`. Total is all three summed; the index card also shows "hands-on" (`prep + active`). The whole point of the split is telling a 20-minutes-of-attention recipe apart from a 5-minute-active-plus-4-hour-wait one — don't bury passive time inside `active`.

**servings**: `base` is the number this recipe makes at 1×. `unit` is usually "servings" but could be "portions", "bowls", "sandwiches", whatever's natural.

**nutrition**: Optional. Use when batch-level nutrition is known. Store totals for the whole batch under `nutrition.batch`: `calories`, `protein`, `fat`, `carbs`, and `fiber`. The site calculates per-serving values from `servings.base`; the Nutrition tab also lets the reader independently adjust batch size and split the batch into a different number of servings or containers. Skip sodium unless the user explicitly wants it tracked.

For ingredient-level macro breakdowns, add standalone rows under `nutrition.ingredients`. Each row should include a display `label`, the full `recipeQuantity`, a flexible `basis`, and the macros for that basis. Keep `nutrition.batch` as the source of truth for the total; ingredient rows are for identifying major contributors and may have small rounding drift.

---

## Ingredient Groups

Split ingredients into logical groups by component or phase. Each group has a `name` and `items` array.

Good group names: "Main Components", "Sauce", "Shrimp", "Herbs & Aromatics", "To Finish", "Spice Rub", "Optional Vegetables". Name them by what they ARE, not when they're used.

### Ingredient item schema

```json
{
  "quantity": 2,
  "quantityMax": null,
  "unit": "tbsp",
  "item": "butter",
  "note": "see notes — may need more",
  "scalable": true
}
```

**quantity**: Number or `null`. Use `null` for "to taste" or imprecise amounts. This is what the scaling calculator multiplies.

**quantityMax**: For ranges like "4–6 ribs". Set `quantity: 4` and `quantityMax: 6`. Both scale together. Leave `null` if not a range.

**unit**: Consistent abbreviations: `tbsp`, `tsp`, `cups`, `lbs`, `oz`, `cloves`, `sprigs`. Empty string `""` for countable items ("4 eggs") or items with no unit.

**item**: The ingredient name. Keep it concise. Don't repeat the unit. "garlic" not "cloves of garlic".

**note**: Optional qualifier, prep instruction, or editorial comment. Examples:
- "peeled, deveined, no tails"
- "a few sprigs"
- "see notes — may need 5-6 tbsp"
- "most of a head, just use a fuckton"
- `null` if no note needed

**scalable**: `true` for things that scale with servings (proteins, liquids, measured amounts). `false` for things that don't meaningfully scale: "salt to taste", "a few sprigs of thyme", "bay leaves", "oil for the pan". Rule of thumb: if you'd use the same amount making 2 servings or 8, it's `false`.

### Judgment calls

- "salt and pepper to taste" → ONE item: `"item": "salt, black pepper"` with `"note": "to taste"` and `scalable: false`.
- Exact amounts of salt/pepper → split into separate items with `scalable: true`.
- "A pinch of X" → `quantity: null`, note: "pinch", scalable: false.
- "Juice of one lemon" → `quantity: 1, unit: "", item: "lemon, juiced"`, scalable: true.
- Garnishes and finishing ingredients often go in their own "To Finish" group.

---

## Directions

Array of step objects:

```json
{
  "step": 1,
  "title": "Shrimp",
  "text": "The actual instruction text."
}
```

**step**: Sequential integer starting at 1.

**title**: Optional. Use when steps map to distinct phases: "Shrimp", "Sauce", "Combine". Skip for simple recipes where steps flow linearly.

**text**: The instruction. Write in the user's voice. Keep it practical and direct. Personality is good. Over-explanation is bad. Assume the reader can cook.

Good direction writing:
- "Salt short ribs. You may sear them but need not. I sometimes sear them and use the fond for something else entirely, then use the seared ribs with a fondless pot. Chaos."
- "Get a stainless steel pan ripping hot with a thin layer of avocado oil. Sear shrimp mostly on one side until you build a deep golden crust and a good fond in the pan, flipping briefly to finish."

Bad direction writing:
- "In a large saucepan over medium-high heat, carefully add the olive oil and wait until it shimmers, approximately 2-3 minutes."
- "Gently fold in the cheese, being careful not to overmix, until just combined."

The voice should sound like someone telling a friend how to cook, not a cookbook editor.

---

## Notes vs. Deviations vs. Log

These are three distinct things. Getting the categorization right matters.

### Deviations (`deviations[]`)
**What changed from tradition, and why.** The philosophical core of the site. Every recipe should be honest about where it departs from the canonical version.

```json
{
  "what": "Hard sear on colossal shrimp instead of gentle saute",
  "why": "Builds fond in the pan and creates a crispy crust on the shrimp. Different texture profile, richer flavor base for the sauce."
}
```

A deviation is NOT a mistake or a thing to fix. It's a conscious choice. "I used butter instead of ghee" is a deviation. "I burned the garlic" is a log entry.

If the user doesn't know what the traditional version looks like, help them identify deviations. If unsure whether something is a deviation, ask.

### Notes (`notes[]`)
**Cooking tips, observations, and future improvements.** Durable — true every time you make the recipe.

```json
[
  "The longer you braise, the more the meat falls off the bone. 3.5 hours is minimum; 4+ is better if you have time.",
  "Avocado oil for the sear, not butter. Butter burns at the temperatures you need for a proper Maillard sear."
]
```

Notes answer "what should I know before I make this?"

### Log (`log[]`)
**Dated entries from specific cook sessions.** Temporal — tied to a particular time you made it.

```json
{
  "date": "2026-01-31",
  "entry": "Sauce ran lean at these ratios. Next time bump butter to 5-6 tbsp, or mount cold butter at the end for emulsification."
}
```

A log entry captures what happened THIS time. It might overlap with notes — if something is both a specific observation and durable advice, put it in both places, worded appropriately for each.

If the recipe is brand new with no cook history, `log` should be an empty array `[]`.

---

## Manifest Entry

After creating the recipe JSON, add an entry to `RECIPE_MANIFEST` in `js/manifest.js`:

```js
{
  id: "slug-like-this",
  title: "Title Case Name",
  desc: "Short description for index card (50-60 chars)",
  tags: ["tag1", "tag2", "tag3"],
  time: { prep: 20, active: 25, passive: 0 },
  status: "experimenting"
}
```

The `desc` field is a truncated version of the recipe's description — punchy enough to differentiate recipes while browsing. Tags and status must match the recipe JSON. Time must also match when known; omit it from both places for an unresolved To Cook record.

---

## Voice Preservation

**Do NOT sanitize the user's voice.** This is a personal lab notebook, not a food blog.

- If the user says "just use a fuckton of garlic", the note should say "just use a fuckton"
- If the user says "who cares", keep "who cares"
- Opinions, profanity, and personality are features, not bugs

---

## Common Mistakes to Avoid

- **Sanitizing the voice.** Don't clean up casual language or personality.
- **Over-structuring simple recipes.** A 3-ingredient sauce doesn't need 4 ingredient groups.
- **Inventing deviations.** Only list deviations the user mentions or that you can clearly identify. Don't pad the list.
- **Making notes redundant with directions.** If a tip is already in a direction step, it doesn't need to be in notes.
- **Food blog voice.** No "this delicious recipe is perfect for weeknight dinners!" No SEO. No life stories.
- **Imprecise scaling flags.** Think about each ingredient: does it actually scale? "2 bay leaves" doesn't become "4 bay leaves" for double servings.
- **Forgetting `quantityMax`.** If the user says "4-6 ribs" or "1-2 tablespoons", use the range fields.
- **Skipping confirmations.** Don't assume — ask the user about title, description, deviations, and lifecycle status.

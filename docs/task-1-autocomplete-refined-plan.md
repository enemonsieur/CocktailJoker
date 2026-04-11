# Task 1 Refined Plan: Autocomplete and Dropdown Unification

## Scope
This document refines the original roadmap and limits execution scope to **task 1 only**:

- add a searchable cocktail picker instead of the current wall of buttons
- add ingredient-name autocomplete tied to `masterIngredients`
- preserve support for brand-new custom ingredients
- keep the app compatible with its current **classic script + `window` globals** architecture

Tasks 2 and 3 are intentionally deferred. They depend on cleaner lookup behavior, normalized names, and less duplicate data entry, so they should stay out of this implementation pass.

## Why Task 1 Should Stay First
This is still the right first step because it fixes the most visible usability issue and creates reusable lookup primitives without forcing pricing or asset-model changes.

In this repo specifically, task 1 fits well because:

- cocktail selection is currently rendered into `#cocktail-list` from [logic-refactored.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/logic-refactored.js:77)
- ingredient rows are built in [ui-helpers.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/ui-helpers.js:104)
- ingredient costs already depend on `masterIngredients` from [data.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/data.js:1)
- state mutations already flow through `AppState` in [state.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/state.js:21)

That means autocomplete can be added as a thin UI and lookup layer without redesigning the state model first.

## Existing Constraints To Respect
The implementation should be shaped around the current codebase, not around a hypothetical framework rewrite.

### Architectural constraints
- `index.html` is the entrypoint and loads classic browser scripts in order.
- Public globals already exposed on `window` must keep working.
- Inline handlers are still used in generated HTML.
- `masterIngredients` is an object keyed by ingredient name.
- Selected cocktails and ingredient edits already re-render through `AppState.notify()`.

### UX constraints
- cocktail search must prevent duplicate additions
- ingredient search must suggest known names without blocking custom entries
- keyboard interaction must work
- the control should read like one selection field, not a button grid disguised as search

## Refined Goal
Replace the current selection UI with two related but separate behaviors:

1. A **cocktail combobox** at the top of step 1 for finding and adding cocktails.
2. An **ingredient name combobox-like input** inside each ingredient row for matching known ingredients while still allowing free text.

Both should share one normalization and search layer so later work can reuse the same name matching rules.

## Proposed Deliverable
At the end of task 1, the app should behave like this:

### Cocktail add flow
- The top of step 1 shows one search input with a suggestion popup.
- Typing filters available cocktails by normalized name.
- Arrow keys move through results.
- `Enter` selects the highlighted result.
- Clicking a result adds that cocktail.
- If the cocktail is already selected, it is shown as unavailable or skipped on select.
- A separate secondary action remains available for creating a custom cocktail.

### Ingredient row flow
- Each ingredient name field behaves like an autocomplete input.
- Typing shows matching known ingredients from `masterIngredients`.
- Choosing a known ingredient switches that row to the canonical ingredient name so cost linkage remains intact.
- Leaving a non-matching custom value is still allowed.
- New ingredient master data is created once, only when needed.

## Implementation Strategy
Do this as a small, staged refactor rather than a full UI rewrite.

### Stage 1: Add a shared lookup and normalization layer
Create a small helper layer dedicated to name matching.

Suggested file:
- new file: `search-helpers.js`

Reason:
- it avoids stuffing search behavior into `logic-refactored.js`
- it keeps future task-2 and task-3 matching logic reusable
- it fits the current classic-script model because helpers can be attached to `window`

Minimum helper surface:
- `normalizeSearchText(value)`
- `buildCocktailSearchIndex(cocktails)`
- `buildIngredientSearchIndex(masterIngredients)`
- `searchCocktails(query, selectedNames)`
- `searchIngredients(query)`
- optional `isExactNormalizedMatch(query, candidate)`

Normalization rules should be conservative:
- lowercase
- trim outer whitespace
- collapse repeated spaces
- remove simple punctuation noise
- optionally strip accents if needed for French input tolerance

Output shape should separate:
- `label`: what the user sees
- `key`: normalized search key
- `value`: canonical source name used by state updates

### Stage 2: Replace the cocktail button wall with a searchable picker
Current cocktail selection is rendered from `renderCocktailList()` in [logic-refactored.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/logic-refactored.js:77). That function should stop rendering a large list of add buttons and instead render:

- one combobox shell
- one result list popup
- one custom-cocktail button below or beside it

Practical approach:
- keep `#cocktail-list` as the mount point
- inject semantic markup for the combobox there
- bind event listeners after render
- do not depend on inline `onchange` strings for popup keyboard behavior

Recommended markup pieces:
- text input with `role="combobox"`
- popup container with `role="listbox"`
- options with `role="option"`
- `aria-expanded`, `aria-controls`, `aria-activedescendant`

### Stage 3: Add reusable combobox UI helpers
The current [ui-helpers.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/ui-helpers.js:1) already owns reusable UI builders, so combobox DOM helpers belong there unless they become too large.

Add helpers for:
- rendering a combobox shell
- opening and closing a popup
- highlighting an option
- positioning active option state
- clearing result markup safely

Keep them small. This app does not need a generalized component system.

### Stage 4: Wire cocktail selection into existing state flows
Selection should continue using the existing public add path from [logic-refactored.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/logic-refactored.js:423).

Implementation detail:
- when a result is selected, call the existing `addCocktail(...)` logic rather than duplicating mutation logic in the combobox code
- after add, clear the input, close the popup, and re-render selected cocktails
- exclude already selected cocktails from search results, or mark them disabled

This reduces regression risk because cost and summary logic already depend on the current selected-cocktail structure.

### Stage 5: Convert ingredient name fields into autocomplete inputs
Ingredient rows are generated by `buildIngredientRow()` in [ui-helpers.js](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/ui-helpers.js:104). That is the correct insertion point for autocomplete-capable markup.

The ingredient name input should change from plain text-only behavior to:

- text input with a row-specific popup id
- input event handler that queries `searchIngredients(...)`
- selection handler that writes the canonical ingredient name into the row
- blur/commit behavior that still allows unmatched custom text

Important detail:
- price, unit, and buy-volume fields currently call `updateIngredientMasterData('<ingredient.name>', ...)`
- if the ingredient name changes, those handlers must now point to the updated canonical name after re-render

That means the implementation should rely on normal re-render after selection instead of trying to patch every sibling field manually in place.

### Stage 6: Handle custom ingredient creation safely
This is the main area where the current app can easily create duplicate ingredient records if implemented carelessly.

The rule should be:
- if the typed value resolves to an existing normalized ingredient match and the user selects it, use the canonical existing ingredient name
- if the typed value is genuinely new, do not create master data on every keystroke
- create or seed master data only on a commit action

Safe commit points:
- selecting a new custom value explicitly
- blur from the field with a non-empty unmatched value
- pressing `Enter` when no suggestion is highlighted

When seeding new master data:
- create exactly one `masterIngredients[newName]` record if it does not already exist
- initialize it from `CONFIG.DEFAULT_INGREDIENT`
- then let the existing pricing/unit editors work as they do today

### Stage 7: Keep browser-global compatibility explicit
Because this repo is not using modules in the browser, new cross-file functions must be exported on `window` if another script needs them.

Likely globals to expose:
- `window.searchCocktails`
- `window.searchIngredients`
- `window.normalizeSearchText`
- any combobox event handlers that are attached from generated HTML

Avoid hidden dependencies on block-scoped top-level variables across files. This repo already mixes browser globals and CommonJS fallbacks, so explicit `window` export is safer than assuming load-time visibility.

## Step-by-Step Build Plan
This is the practical order I would use to implement task 1 with the least regression risk.

### Step 1: Inspect current render paths and name mutation points
Read and map:
- `renderCocktailList()`
- `renderSelected()`
- `buildIngredientRow()`
- `updateIngredient(...)`
- `updateMasterData(...)`

Goal:
- confirm where to swap UI
- confirm which mutation path should stay authoritative

### Step 2: Add `search-helpers.js`
Implement only normalization and pure search helpers first.

Do not touch UI yet.

Goal:
- make search behavior testable and reusable before wiring DOM

### Step 3: Load the new helper file in `index.html`
Insert it in the current script order before the main logic file that consumes it.

Goal:
- keep classic-script load order correct
- avoid runtime `undefined` globals

### Step 4: Build the cocktail combobox UI shell
Update `renderCocktailList()` so step 1 renders:
- search input
- popup container
- custom-cocktail action

Do not remove the add behavior yet until the new search path can call it.

Goal:
- replace the wall-of-buttons structure with the new primary control

### Step 5: Add cocktail combobox interactions
Bind:
- input filtering
- arrow navigation
- highlighted option tracking
- enter-to-select
- escape-to-close
- click-to-select

Goal:
- reach full keyboard and pointer usability for cocktail add flow

### Step 6: Reuse the same lookup layer for ingredient suggestions
Extend `buildIngredientRow()` so the ingredient name input includes row-level popup markup and row identifiers.

Goal:
- add suggestions without changing pricing logic or card layout structure more than necessary

### Step 7: Add ingredient commit logic
Implement the distinction between:
- selecting an existing ingredient
- committing a new custom ingredient

Goal:
- preserve free text while avoiding duplicated master records

### Step 8: Re-render and verify dependent fields
After ingredient selection or commit:
- confirm unit fields still read from the right master ingredient
- confirm price inputs still update the intended master record
- confirm total cost recalculates

Goal:
- validate the real business effect of autocomplete, not just the popup visuals

### Step 9: Run browser smoke tests
Use the repo’s own local verification flow from [README.md](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/README.md:1).

Goal:
- verify startup
- verify search interaction
- verify no blocking runtime errors

## File-Level Change Plan
This is the smallest sensible change set for task 1.

### `index.html`
- include the new helper script in the correct order
- keep `#cocktail-list` as the render mount
- only add static markup if necessary; prefer rendering dynamic search UI from JS

### `ui-helpers.js`
- add combobox shell builders or popup helper functions
- update ingredient row markup to support autocomplete popup containers and ARIA attributes
- remove button text assumptions like `Ajouter {name}` for the primary cocktail selection experience

### `logic-refactored.js`
- replace the cocktail wall rendering inside `renderCocktailList()`
- wire event listeners for cocktail search
- add row-level ingredient autocomplete behavior
- reuse existing mutation functions instead of duplicating state logic

### `state.js`
- keep state ownership here
- only change this file if custom ingredient commit needs one small helper for canonical rename or safe master-data seeding

### `data.js`
- no structural change required for task 1

### `search-helpers.js`
- new file containing normalization and search index logic

## Behavior Rules
These rules should be explicit before implementation starts.

### Cocktail rules
- search over cocktail names only for now
- no duplicate add
- exact or close match should be easy to select with keyboard
- selected result should clear the field

### Ingredient rules
- suggestions are advisory, not mandatory
- canonical existing names should be preferred when selected
- custom ingredient names remain allowed
- new master ingredient records should be created once, on commit

### Accessibility rules
- combobox must be focusable with keyboard only
- popup must announce expanded state
- highlighted option must be reflected through `aria-activedescendant`
- interaction must not rely on mouse only

## Risks To Watch
The main risks are not visual. They are data-linkage risks.

### Risk 1: Ingredient rename breaks master-data linkage
Because cost fields reference `ingredient.name`, a bad rename flow can leave one row pointing at a non-existent master record.

Mitigation:
- canonicalize on selection
- re-render immediately after commit

### Risk 2: Duplicate master ingredient records from casing or accents
`Citron`, `citron`, and `citron ` should not become separate records by accident.

Mitigation:
- normalize for matching
- keep one canonical display label
- seed new master data only after checking normalized uniqueness

### Risk 3: Inline handlers and dynamic DOM get out of sync
This app still mixes generated HTML strings and global functions.

Mitigation:
- keep popup event logic centralized
- expose any required handlers on `window`
- prefer re-render over fragile in-place patching

### Risk 4: Keyboard support is half-implemented
Search UIs often look complete while still failing on `ArrowDown`, `Enter`, or `Escape`.

Mitigation:
- verify keyboard behavior explicitly before considering the task done

## Acceptance Criteria
Task 1 is complete only if all of the following are true:

### Cocktail picker
- typing `moj` suggests `Mojito`
- selecting `Mojito` adds it once
- selecting it again is prevented
- the large add-button wall is gone from the primary flow

### Ingredient picker
- typing in an ingredient name shows known matches
- selecting a known ingredient keeps cost linkage working
- entering a new ingredient still works
- the new ingredient is seeded into `masterIngredients` once

### App stability
- startup still works through `window.startApp`
- `window.AppState` and `window.DOM` still exist
- summary generation still works after editing autocompleted ingredients
- no blocking runtime errors appear in browser console

## What Not To Do In This Task
- do not add pricing recommendation logic
- do not add elasticity modeling
- do not add image ingestion
- do not redesign the state model beyond what autocomplete strictly requires
- do not convert the app to modules, bundlers, or a framework

## Recommended Output Name
If you want this kept as the implementation brief for the repo, this file is a suitable working document:

- [docs/task-1-autocomplete-refined-plan.md](C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les%20Confiotes/CocktailJoker-refactored/docs/task-1-autocomplete-refined-plan.md)

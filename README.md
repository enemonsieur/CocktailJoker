# CocktailJoker Refactored

Always a sk questions unil you are 90% sure of your alpproach.

This is a static browser app. There is no build step in the project root, so the fastest way to test it is to serve the folder locally and open `index.html` in a browser.

## Quick Test Kit

Copy these PowerShell helpers into your terminal when you want repeatable browser checks:

```powershell
function Start-CocktailJokerServer {
  Start-Job -ScriptBlock {
    Set-Location 'C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored'
    python -m http.server 4173 --bind 127.0.0.1
  }
}

function Open-CocktailJokerBrowser {
  npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173/index.html --headed --session cocktailjoker
}

function Get-CocktailJokerSnapshot {
  npx --yes --package @playwright/cli playwright-cli snapshot --session cocktailjoker
}

function Get-CocktailJokerConsole {
  npx --yes --package @playwright/cli playwright-cli console --session cocktailjoker
}

function Test-CocktailJokerGlobals {
  npx --yes --package @playwright/cli playwright-cli eval "() => ({
    hasConfig: typeof window.CONFIG,
    hasDOM: typeof window.DOM,
    hasAppState: typeof window.AppState,
    hasStartApp: typeof window.startApp,
    hasGenerateMenu: typeof window.generateMenu
  })" --session cocktailjoker
}

function Invoke-CocktailJokerSmokeFlow {
  npx --yes --package @playwright/cli playwright-cli eval "() => {
    window.startApp();
    ['Mojito','Margarita','Daiquiri','Pina Colada','Gin Basil'].forEach(name => window.addCocktail(name));
    document.getElementById('venue-type-input').value = 'bar';
    document.getElementById('persons-per-week-input').value = '300';
    document.getElementById('attach-rate-input').value = '25';
    window.generateMenu();
    return {
      introHidden: document.getElementById('intro-section')?.classList.contains('hidden'),
      summaryHidden: document.getElementById('summary-step')?.classList.contains('hidden'),
      tablePresent: !!document.querySelector('#menu-summary table'),
      monthlyPresent: !!document.getElementById('monthly-summary')
    };
  }" --session cocktailjoker
}
```

Recommended sequence:

1. Run `Start-CocktailJokerServer`.
2. Run `Open-CocktailJokerBrowser`.
3. Run `Test-CocktailJokerGlobals`.
4. Run `Invoke-CocktailJokerSmokeFlow`.
5. Run `Get-CocktailJokerConsole`.

Expected healthy browser result:

- `hasConfig`, `hasDOM`, `hasAppState` are `"object"`.
- `hasStartApp`, `hasGenerateMenu` are `"function"`.
- `introHidden` is `true`.
- `summaryHidden` is `false`.
- `tablePresent` is `true`.
- `monthlyPresent` is `true`.

## Menu Grading Harness

Use this when you want to compare cocktail menus and see whether the optimizer is making believable moves.

From the `tests/` folder:

```powershell
npx --yes jest --verbose --runInBand menu-grading.test.js
```

The report prints:

- current vs recommended orders
- current vs recommended profit
- cocktail share before and after
- how many items were raised, lowered, or held
- the top positive movers
- suspicious recommendations

The letter grade is interpreted as:

- `A`: strong business result and believable item-level changes
- `B`: useful but mixed, or profitable enough with a few questionable moves
- `C`: unstable, weak, or unrealistic enough to tune further

## Manual Browser Check

### 1. Start a local server

From the project root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/index.html
```

### 2. Run the smoke flow

Verify this flow in the browser:

1. The intro card renders with the `Commencer l'analyse` button.
2. Click `Commencer l'analyse`.
3. The intro section hides.
4. The `cocktail-list` section becomes visible.
5. Select at least 3–5 cocktails (e.g., Mojito, Margarita, Daiquiri).
6. The selected cocktail cards render with cost and margin values.
7. Scroll to **Étape 3 — Votre clientèle** and enter:
   - **Type d'établissement:** Bar
   - **Clients par semaine:** 300
   - **% qui commandent un cocktail:** 25
8. Click `Générer le résumé`.
9. The **Votre position** section appears (benchmark vs. sectorial targets).
10. The **Profit bar** (before/after) shows estimated gain.
11. The **Rebalancement du menu** table appears with 4 columns: Cocktail+stars / Nouveau prix / Commandes/mois / Profit mensuel.
12. Click **"Voir les détails"** to expand the hidden section with reasons and scenario projections.

If the intro stays visible, the Étape 3 fields are missing, or the summary never renders, the app is not booting correctly.

### 3. Check the console

Open DevTools and check the console after page load and after clicking `Commencer l'analyse`.

Treat these as blocking errors:

- `Identifier 'CONFIG' has already been declared`
- `Cannot read properties of undefined`
- Any error thrown from `logic-refactored.js`, `state.js`, or `ui-helpers.js`

These are non-blocking unless you are polishing production readiness:

- Tailwind CDN warning from `cdn.tailwindcss.com`
- Missing `favicon.ico`

## Playwright CLI

Open the app:

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173/index.html --headed --session cocktailjoker
```

Snapshot:

```powershell
npx --yes --package @playwright/cli playwright-cli snapshot --session cocktailjoker
```

Console:

```powershell
npx --yes --package @playwright/cli playwright-cli console --session cocktailjoker
```

Globals check:

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => ({ hasConfig: typeof window.CONFIG, hasDOM: typeof window.DOM, hasAppState: typeof window.AppState, hasStartApp: typeof window.startApp, hasGenerateMenu: typeof window.generateMenu })" --session cocktailjoker
```

Start flow directly:

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => { window.startApp(); return { introHidden: document.getElementById('intro-section')?.classList.contains('hidden'), cocktailHidden: document.getElementById('cocktail-list')?.classList.contains('hidden') }; }" --session cocktailjoker
```

Force the summary:

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => { window.generateMenu(); return { summaryHidden: document.getElementById('summary-step')?.classList.contains('hidden'), tablePresent: !!document.querySelector('#menu-summary table'), monthlyPresent: !!document.getElementById('monthly-summary') }; }" --session cocktailjoker
```

## Debugging Prompt

Use this when you want another agent to fix browser boot issues with the same verification strategy:

```text
Review this static browser app by fixing it with the smallest possible changes and verifying after each step.

Rules:
- Do not do a big refactor.
- Make one small change at a time.
- After each change, reload the app in a real browser and check the console immediately.
- Only fix the next real blocking error shown by the browser.
- Continue until the core flow works end to end.

Verification strategy:
1. Serve the project locally with:
   python -m http.server 4173 --bind 127.0.0.1
2. Open:
   http://127.0.0.1:4173/index.html
3. Check browser console on load.
4. Verify these globals exist in the browser:
   - window.CONFIG
   - window.DOM
   - window.AppState
   - window.startApp
   - window.generateMenu
5. Trigger the startup flow and re-check the console.
6. Test the main flow:
   - click "Commencer l'analyse"
   - select one cocktail
   - confirm the selected card renders
   - enter weekday/weekend values
   - click "Générer le résumé"
   - confirm the summary table and monthly summary appear
7. Ignore non-blocking noise unless asked:
   - Tailwind CDN production warning
   - missing favicon.ico
8. Stop only when the app works and the console has no blocking runtime errors.

What to watch for:
- classic script global collisions from top-level const/let/function declarations across files
- browser globals expected on window but only exported with module.exports
- helper wrappers accidentally shadowing existing globals and causing recursion
- fixes that appear to help one click path but still fail on the next user action
```

## Reference Docs

- [`docs/browser-test-and-ux-review.md`](C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored\docs\browser-test-and-ux-review.md)
- [`docs/manual-card-import-guide.md`](C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored\docs\manual-card-import-guide.md)
- [`docs/ux-ui-design-guidelines.md`](C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored\docs\ux-ui-design-guidelines.md)

## Test Notes

The `tests/` folder contains Jest tests, but they should resolve the real

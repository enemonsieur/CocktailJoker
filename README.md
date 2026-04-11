# CocktailJoker Refactored

This project is a static browser app. There is no app server or build step in the root folder, so the safest way to verify behavior is to serve the folder locally and open `index.html` through `http://127.0.0.1`.

## Browser Verification

### 1. Start a local server

From the project root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

### 2. Manual smoke test

Verify this flow in the browser:

1. The intro card renders with the `Commencer gratuitement` button.
2. Click `Commencer gratuitement`.
3. The intro section should hide.
4. The `cocktail-list` section should become visible.
5. Select at least one cocktail.
6. The selected cocktail cards should render with cost and margin values.
7. Enter values in `Semaine` and/or `Week-End`.
8. Click `Générer le Résumé du Menu`.
9. The summary table and monthly summary card should appear.

If step 2 does nothing, or the intro stays visible, the app is not booting correctly.

### 3. Console check

Open DevTools and check the console after page load and after clicking `Commencer gratuitement`.

Treat these as blocking errors:

- `Identifier 'CONFIG' has already been declared`
- `Cannot read properties of undefined`
- Any error thrown from `logic-refactored.js`, `state.js`, or `ui-helpers.js`

These are non-blocking noise unless you are polishing production readiness:

- Tailwind CDN warning from `cdn.tailwindcss.com`
- Missing `favicon.ico`

## Playwright CLI Verification

If you want repeatable browser checks from the terminal, use Playwright CLI through `npx`.

### Open the app

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173/index.html --headed --session cocktailjoker
```

### Inspect the page

```powershell
npx --yes --package @playwright/cli playwright-cli snapshot --session cocktailjoker
npx --yes --package @playwright/cli playwright-cli console --session cocktailjoker
```

### Check whether browser globals are available

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => ({ hasConfig: typeof window.CONFIG, hasDOM: typeof window.DOM, hasAppState: typeof window.AppState, hasStartApp: typeof window.startApp })" --session cocktailjoker
```

Expected healthy result:

- `hasConfig` is `"object"`
- `hasDOM` is `"object"`
- `hasAppState` is `"object"`
- `hasStartApp` is `"function"`

### Trigger startup without relying on a flaky animated click

The start button animates, so Playwright may refuse a normal click while the element is moving. In that case, call the function directly:

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => { window.startApp(); return { introHidden: document.getElementById('intro-section')?.classList.contains('hidden'), cocktailHidden: document.getElementById('cocktail-list')?.classList.contains('hidden') }; }" --session cocktailjoker
```

Expected healthy result:

- `introHidden` is `true`
- `cocktailHidden` is `false`

## Debugging Prompt

Use this prompt when you want another agent to fix browser boot issues with the same verification strategy:

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
5. Click or trigger the startup flow and re-check the console.
6. Test the main flow:
   - click "Commencer gratuitement"
   - select one cocktail
   - confirm the selected card renders
   - enter weekday/weekend values
   - click "Générer le Résumé du Menu"
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

Output format:
- show each blocking error found
- show the exact minimal change made to fix it
- show the result of the next browser verification
- finish with a short summary of what was fixed and what remains, if anything
```

## Agent Browser And UX Guide

For the current browser-testing workflow and a separate UX/UI review prompt focused on accessibility, plain language, and manager-friendly usability, use:

[`docs/browser-test-and-ux-review.md`](C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored\docs\browser-test-and-ux-review.md)

This guide includes:

- the required minimal-change browser verification behavior
- the Playwright commands for real-browser checks
- the implementation history around global browser-script collisions
- a ready-to-use UX/UI audit prompt grounded in WCAG, USWDS, Digital.gov plain-language guidance, and usability research
- a shortlist of issues already visible in the current files

## UX/UI Design Standard

For implementation-facing UX/UI rules for this app, use:

[`docs/ux-ui-design-guidelines.md`](C:\Users\njeuk\OneDrive\Documents\Claude\Projects\Les Confiotes\CocktailJoker-refactored\docs\ux-ui-design-guidelines.md)

Use this guide when changing forms, summary areas, recommendation tables, or small charts. It complements `docs/browser-test-and-ux-review.md` and captures the project's manager-facing clarity, accessibility, and decision-support rules.

## Test Notes

There is a `tests/` folder with Jest tests, but the current test harness must resolve the real app files from the project root. If tests fail with `Cannot find module './config'` or missing `index.html`, the test paths are wrong, even before app behavior is checked.

## Rollback

Before making further code changes, keep a timestamped duplicate of the project folder. A backup was created during review here:

```text
C:/Users/njeuk/OneDrive/Documents/Claude/Projects/Les Confiotes/CocktailJoker-refactored-backup-20260411-153101
```

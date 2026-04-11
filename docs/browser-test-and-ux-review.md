# Browser Test And UX Review Guide

Use this document when an agent continues work on this project.

## Project Facts

- This is a static browser app.
- The browser entrypoint is `index.html`.
- Scripts are loaded as classic `<script>` tags in this order:
  1. `data.js`
  2. `config.js`
  3. `search-helpers.js`
  4. `ui-helpers.js`
  5. `state.js`
  6. `logic-refactored.js`
- Because these are classic scripts, top-level `const`, `let`, and `function` names can collide across files.
- Browser-mode dependencies must be exposed on `window` when other files read them from `window`.
- Major browser boot issues were already fixed with small targeted patches. Do not undo that by refactoring aggressively.

## Browser Test Behavior

Follow this workflow exactly when changing runtime behavior.

### Rules

- Inspect first.
- Make only small, minimal changes.
- Change one thing at a time.
- After each change, verify immediately in a real browser.
- Treat the real browser and console as the source of truth.
- Fix only the next real blocking issue shown by the browser/runtime.
- Do not do a broad refactor unless explicitly asked.
- Ignore only these non-blocking issues unless asked to fix them:
  - Tailwind CDN production warning
  - missing `favicon.ico`

### What already works

- App loads in the browser.
- `startApp()` works.
- Selecting a cocktail works.
- Cost and margin render.
- Entering weekday/weekend values works.
- Clicking the summary-generation button works.
- Summary table and monthly summary render.

### Important implementation history

- `state.js` had global name collisions and helper-name issues. It now uses internal aliases.
- `state.js` exposes browser globals on `window`, including:
  - `window.AppState`
  - `window.calcTotalCost`
  - `window.calcMargin`
  - `window.generateCode`
- `ui-helpers.js` exposes browser globals on `window`, including:
  - `window.DOM`
  - UI helper functions consumed by `logic-refactored.js`
- `logic-refactored.js` previously had wrapper/helper collisions that caused recursion or load-time failures.
- Wrapper names in `logic-refactored.js` were renamed to avoid collisions with already-loaded globals.

### How to run locally

From project root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/index.html
```

### Playwright verification commands

Open app:

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

Evaluate browser globals:

```powershell
npx --yes --package @playwright/cli playwright-cli eval "() => ({ hasConfig: typeof window.CONFIG, hasDOM: typeof window.DOM, hasAppState: typeof window.AppState, hasStartApp: typeof window.startApp })" --session cocktailjoker
```

### Core browser flow to verify

1. Page loads without blocking runtime errors.
2. Click `Commencer gratuitement` or trigger `startApp()` if the animated button is unreliable.
3. Confirm intro hides and cocktail list shows.
4. Select one cocktail, for example `Mojito`.
5. Confirm selected cocktail card renders.
6. Enter values in `Semaine` and `Week-End`.
7. Click the summary-generation button.
8. Confirm summary table and monthly summary are visible.

### Reporting format

When reporting back:

- Say what exact issue was found.
- Say what exact minimal change was made.
- Say what the browser/console showed after the change.
- Keep going until the requested task is actually working.

## UX/UI Review Prompt

Use this prompt when the task is to audit and improve the interface quality, accessibility, and ease of use.

```text
Review this static browser app as a manager-facing product and produce a practical UX/UI improvement plan.

Context:
- The audience includes non-technical managers.
- Prioritize clarity, low cognitive load, accessibility, confidence, and task completion speed over visual cleverness.
- Keep recommendations realistic for a static app with classic browser scripts.
- Inspect the real local files first, especially:
  - index.html
  - config.js
  - ui-helpers.js
  - state.js
  - logic-refactored.js
  - README.md
- Use current external guidance from primary or authoritative sources for accessibility and usability. Prefer:
  - W3C WCAG 2.2
  - U.S. Web Design System
  - Digital.gov plain-language guidance
  - Baymard or Nielsen Norman Group for form and usability research

What excellent UI should look like here:
- The first screen explains the value, the time required, and the next action in plain French.
- The primary action is obvious and uses a verb-first label.
- The workflow feels linear, with clear step status and no ambiguity about what to do next.
- Labels stay visible at all times and help text is short, concrete, and adjacent to the relevant field.
- Validation is specific, placed near the field, and tells the user how to recover.
- Typography, spacing, and hierarchy make scanning easy for a tired or inexperienced manager.
- Color is never the only signal for state, risk, or success.
- Interactive targets are easy to tap and keyboard focus is obvious.
- The page works well on mobile and desktop without forcing the user to understand the layout.
- The summary emphasizes decisions, not raw data overload.
- Copy avoids jargon, hidden assumptions, and ambiguous business terms.

Review dimensions:
1. Information architecture
2. Task flow and progressive disclosure
3. Content clarity and plain language
4. Forms and inputs
5. Feedback, validation, and error prevention
6. Visual hierarchy, typography, spacing, and contrast
7. Accessibility: keyboard, focus, semantics, labels, live regions, target size, language, and color reliance
8. Mobile usability
9. Trust and decision support for a restaurant/bar manager

Also identify concrete issues already visible in the current implementation, such as:
- mojibake / broken French encoding in UI text and README
- inconsistent CTA wording between documentation and UI
- any step or action label that is not immediately understandable
- places where the layout asks the user to process too much at once
- places where field grouping or validation could be clearer
- places where the summary can be more decision-oriented

Output format:
- Start with a short statement of the overall UX maturity.
- Then list the top issues, ordered by severity.
- For each issue, include:
  - what the user problem is
  - where it appears
  - why it hurts accessibility/usability
  - the smallest worthwhile fix
  - the better follow-up improvement if more time is available
- Then provide a phased task plan:
  - Phase 1: highest-impact quick wins
  - Phase 2: structural usability improvements
  - Phase 3: polish and trust improvements
- Finish with a concise "world-class target state" describing how the app should feel when these issues are fixed.
```

## Current Issues Already Visible In The Files

These are worth checking before deeper redesign work:

- `index.html` and `README.md` contain mojibake in French copy, which weakens trust and readability immediately.
- The README still mentions `Commencer gratuitement` and `Générer le Résumé du Menu`, while the current UI shows `Commencer l'analyse` and `Générer le résumé`.
- The sales step uses a three-column layout that may be harder to scan for less technical users on narrower screens.
- Several decisions are presented as data-entry tasks before the user sees stronger reassurance about defaults and what is optional.
- The summary area likely needs stronger prioritization of recommended actions versus raw metrics.

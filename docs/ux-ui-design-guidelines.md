# UX/UI Design Guidelines

## Purpose
This guide is the working UX/UI standard for CocktailJoker Refactored.

The app is built for non-technical restaurant and bar managers. UI changes should optimize for:
- fast comprehension
- decision confidence
- low cognitive load
- quick task completion

This is not a generic design document. It translates the project's current UX direction and current external guidance into practical rules for this specific static browser app.

## Sources And Scope
This guide complements:
- `docs/browser-test-and-ux-review.md`
- the current summary and dashboard patterns in `logic-refactored.js`

It is informed by:
- W3C WCAG 2.2
- U.S. Web Design System guidance for tables and data visualizations
- Digital.gov plain-language guidance

Use this guide when changing:
- forms and workflow copy
- summary and dashboard areas
- recommendation tables
- small charts or gain/profit visuals

## Core Product Principles
- Decision first, not data first. Show what matters to the manager before showing supporting detail.
- Plain French before business jargon. Use direct wording and explain any unavoidable business term.
- Keep labels visible. Do not rely on placeholders as labels.
- Never use color as the only signal for risk, quality, gain, or status.
- Work well on mobile and desktop. The manager should not need to decode the layout.
- Prefer small targeted improvements over broad refactors.
- Recommendations must protect customer trust, not just margin. Avoid patterns that encourage aggressive repricing without context.

## Forms And Input Guidance
- Keep the workflow linear and obvious. Each step should tell the user what to do next.
- Use persistent labels above or beside fields. Placeholder text can support, but must not replace, labels.
- Place short help text next to the relevant field. Keep it concrete and action-oriented.
- Show validation near the field and explain how to recover.
- Prefer a few grouped inputs over large dense forms.
- Mark optional fields clearly.
- Keep keyboard access intact for every control.
- Preserve visible focus styling for links, buttons, inputs, and custom controls.

For this app, good form copy should answer:
- what this field means
- whether it is required
- what unit or time basis it expects
- what will happen if the user leaves it empty

## Table Design Guidance
- Use tables when the user needs to compare cocktails side by side.
- Keep column labels short, plain, and concrete.
- Sort rows by business priority when possible, not alphabetically.
- Make one decision column prominent, such as recommendation or suggested action.
- Do not overload a table with too many metrics in the first view.
- Add short supporting text if a metric could be misunderstood.
- Preserve semantic table markup with real `table`, `thead`, `tbody`, and header cells.
- Make sure row content remains readable on narrower screens. If compression is necessary, hide lower-priority detail before hiding key decisions.

For recommendation tables in this app:
- lead with cocktail name, current state, and recommended action
- keep secondary calculations visually quieter
- surface the reason in plain French

## Data Visualization Guidance
- The chart supports the table. It does not replace the table.
- Use small, simple visuals for comparison or direction, not dense dashboards.
- State the purpose of the visual in plain language near the chart.
- Provide the same essential information in text or table form.
- Use restrained color and clear labels.
- Avoid decorative charts that increase cognitive load without improving understanding.
- Do not rely on color alone to show gain, loss, confidence, or warning.
- Keep any mini-chart secondary in visual weight to the recommendation table.

For this app, a good mini-visual should:
- compare a small number of states clearly
- reinforce the recommendation
- remain understandable without hovering or expert interpretation

Examples that fit this product:
- a small before/after profit comparison
- a small scenario comparison line or sparkline with a text summary

Examples that do not fit this product:
- dense multi-series dashboards
- decorative area charts with unclear meaning
- visuals that hide exact values behind interaction

## Content And Plain-Language Guidance
- Prefer short verb-first titles where possible.
- Explain what changed, why it matters, and what to do next.
- Replace ambiguous business wording with direct French.
- Keep paragraphs short and scannable.
- Chunk long explanations into short sections or bullets.
- Surface assumptions whenever a recommendation is estimated or modeled.
- Avoid pretending the tool knows more than it does.

In this app, recommendation copy should usually include:
- current situation
- suggested change
- expected effect
- why the suggestion is cautious or limited

## Accessibility Checklist
- All controls must be reachable by keyboard.
- Focus states must remain visible.
- Labels must be linked to their controls.
- Errors must be identified in text, not only by color.
- Expanded and collapsed states must be exposed where relevant.
- Tables must remain understandable to assistive technology.
- Charts must include a text summary and accessible alternative.
- Touch targets must remain usable on mobile.
- Help text must stay close enough to its field to be understood in context.

## App-Specific Implementation Implications
- New optimizer results should appear in a decision-first summary area, not as raw calculations dumped into the page.
- Recommendation tables should match the current visual language: simple cards, clear spacing, strong labels, restrained color.
- Any mini-chart for estimated gains should remain secondary to the recommendation table.
- New UI helpers must respect classic script loading order and expose anything shared on `window` if cross-file access is required.
- Existing browser behavior should be preserved unless the change clearly improves usability without breaking current flows.

## Practical Review Questions
Before shipping a UI change, check:
- Can a tired manager tell what to do in a few seconds?
- Is the main action obvious?
- Are the most important decisions visible without reading every number?
- Would the screen still make sense if color cues were removed?
- Is the recommendation language honest about uncertainty?
- Does the table carry the main comparison, with charts only supporting it?

## References
- W3C WCAG 2.2: https://www.w3.org/TR/wcag/
- U.S. Web Design System Table: https://designsystem.digital.gov/components/table/
- U.S. Web Design System Data Visualizations: https://designsystem.digital.gov/components/data-visualizations/
- Digital.gov Plain Language: https://digital.gov/guides/plain-language/
- Digital.gov Design for Understanding: https://digital.gov/guides/plain-language/design

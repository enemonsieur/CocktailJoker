# Task 2 Detailed Plan: Margin Optimizer And Price Recommendation Engine

## Purpose
This document replaces the earlier rough pricing notes with a more detailed implementation plan for the app's next business feature: a **margin optimizer** that recommends cautious cocktail price adjustments.

The goal is not to build an academic pricing model. The goal is to help a restaurant or bar manager:
- understand which cocktails are underpriced or overpriced relative to ingredient cost
- rebalance prices without harming customer trust
- see recommendations in a manager-friendly table
- understand estimated gains through a small supporting visual

This feature must remain compatible with the current static browser app and its classic-script architecture.

## Product Goal
The optimizer should answer one practical question:

`Given raw ingredient costs, current selling price, and current popularity, which cocktails should stay, move slightly up, move slightly down, or be reviewed?`

The optimizer should not:
- auto-edit prices without the user choosing to do so
- pretend it knows true local elasticity
- push aggressive across-the-board increases
- optimize only for short-term margin percent while ignoring customer perception

## Core Business Methodology
The pricing methodology should use two layers:

1. **Menu engineering**
2. **Popularity as a practical demand-sensitivity proxy**

This follows the repo's business direction and the external pricing references already reviewed:
- the restaurant guide supports menu engineering based on popularity and contribution margin
- the pricing experiment paper supports cautious item-level price testing, not broad brute-force increases

## Important Caveat: High-End Bar Margin Ranges
Some widely cited beverage-margin ranges come from bars with strong pricing power, premium positioning, or mature cocktail programs.

That matters here.

Those ranges are still useful as reference, but they should not be treated as automatic targets for this app. A premium cocktail bar can often sustain higher gross margins than:
- a mainstream neighborhood bar
- a mixed food-and-drink venue
- a menu built for broader accessibility

So the optimizer should use those ranges as **reference bands**, not fixed truth.

Practical implication:
- the app can still treat `75%` ingredient-margin as a healthy floor
- it should not assume that every item should be pushed toward the upper end of premium-bar margins
- customer-safe rebalancing must remain the controlling rule

## What Margin Means In This App
The current app calculates cocktail cost from **raw ingredient cost only**.

That means the optimizer should also work from raw ingredient economics only.

It should not include:
- labor
- rent
- glassware breakage
- taxes
- service overhead
- marketing

This is important because the app's current margin numbers are **gross ingredient margin**, not full business profit margin.

### Required definitions
For each cocktail:

- `cost = raw ingredient cost per drink`
- `price = current menu price`
- `contribution_value = price - cost`
- `ingredient_margin_percent = (price - cost) / price * 100`

### Why this basis is still useful
Even though the app does not model full operating cost, raw ingredient margin is still useful because:
- it is the cleanest cost input the product already has
- it is consistent with the current app behavior
- it is understandable to a manager
- it is enough to support first-pass menu engineering decisions

## Margin Reference Bands To Use
These bands should be explicitly documented in the implementation so the tool stays honest about what it is doing.

### Recommended working interpretation
- `< 70%`: weak ingredient margin, usually needs attention
- `70% to < 75%`: acceptable but fragile
- `75% to 85%`: healthy target zone for most cocktails in this app
- `> 85% to 90%`: high margin zone, often acceptable if the item still fits customer expectations
- `> 90%`: very high ingredient margin, should trigger review before the app recommends further increases

### Why these bands make sense
- They stay close to the repo's current thresholds:
  - `MARGIN_GOOD = 75`
  - `MARGIN_HIGH = 90`
- They align with common bar-industry ingredient-margin references without overcommitting to premium-bar assumptions.
- They leave room for different concepts and customer bases.

### Important product rule
The optimizer should not behave like this:
- `margin below target -> always raise price`
- `margin above target -> always lower price`

Instead it should behave like this:
- `margin is one signal`
- `popularity is another signal`
- `customer-safe rebalancing controls how much movement is allowed`

## Demand Logic: Popularity As Elasticity Proxy
The app already asks the user for popularity from `1` to `5`.

That should be treated as the product's practical demand-sensitivity proxy.

### Interpretation
- `5`: very popular, least price-sensitive in the app's model
- `4`: popular, somewhat resilient to modest increases
- `3`: medium popularity, moderate sensitivity
- `2`: low popularity, price increases are risky
- `1`: very low popularity, avoid increases by default

### Why use popularity this way
- It uses the data the app already collects.
- It is explainable to managers.
- It avoids fake precision.
- It is consistent with the idea that strong sellers can usually tolerate slightly more pricing pressure than weak sellers.

### Important limitation
The app must describe this as a modeled heuristic, not measured elasticity.

Good wording:
- `La popularite actuelle sert ici d'indicateur simple de sensibilite au prix.`

Bad wording:
- `Ce cocktail a une elasticite prouvee de X.`

## Main Decision Framework: Menu Engineering
The optimizer should classify cocktails using:
- popularity
- contribution value

### Required menu averages
Across selected cocktails, calculate:
- `avg_popularity`
- `avg_contribution_value`

### Classification rules
For each cocktail:
- `Star`: popularity >= average and contribution >= average
- `Plow Horse`: popularity >= average and contribution < average
- `Puzzle`: popularity < average and contribution >= average
- `Dog`: popularity < average and contribution < average

### Business meaning
- `Star`
  - strong seller
  - strong contribution
  - usually protect it

- `Plow Horse`
  - strong seller
  - weak contribution
  - best candidate for a cautious increase

- `Puzzle`
  - good contribution
  - weak demand
  - avoid pushing price up

- `Dog`
  - weak contribution
  - weak demand
  - usually review recipe, position, or relevance rather than forcing price higher

## Price Recommendation Method
The optimizer should use a simple controlled recommendation formula, not a black-box optimizer.

### General equation
`suggested_price = clamp(round(current_price * (1 + adjustment_rate)), hard_floor, hard_ceiling)`

Where:
- `adjustment_rate` comes from menu class plus popularity sensitivity
- `hard_floor` prevents absurdly low recommendations
- `hard_ceiling` prevents menu drift and customer-hostile pricing
- `round(...)` means round to practical FCFA increments

### Recommended direction by class
- `Star`
  - default: hold
  - optional: slight increase only if margin is below healthy band and popularity is strong

- `Plow Horse`
  - default: slight increase
  - strongest upward candidate, but still capped

- `Puzzle`
  - default: hold or slight decrease
  - use price as a traction test, not a margin squeeze

- `Dog`
  - default: review
  - usually no automatic increase
  - optional slight decrease only if the manager wants a traction test

## Customer-Safe Rebalancing Rules
This is the non-negotiable product rule set.

The optimizer must rebalance in a way that does not punish the customer for the app's need to improve margins.

### Rules
- Never recommend broad simultaneous increases as the default posture.
- Prefer small moves over large ones.
- Do not recommend price increases on weak-demand cocktails by default.
- Do not recommend increasing already very-high-margin cocktails.
- Avoid recommendations that would create abrupt visible menu jumps.
- Keep recommendation text explicit that the move is a test or a cautious adjustment where relevant.

### Suggested move caps
These are initial implementation caps, not permanent business truth.

- popularity `5`
  - upward cap: `+5%`
  - downward cap: `-3%`

- popularity `4`
  - upward cap: `+4%`
  - downward cap: `-4%`

- popularity `3`
  - upward cap: `+3%`
  - downward cap: `-3%`

- popularity `2`
  - upward cap: `+1%` to `+2%` only in rare cases
  - downward cap: `-4%` to `-5%`

- popularity `1`
  - upward cap: `0%` by default
  - downward cap: `-5%` to `-6%`

### Why these caps work
- They create visible but not violent movement.
- They match the product's need for trust and explainability.
- They reduce the chance of damaging customer perception through algorithmic overreach.

## Floors, Ceilings, And Rounding
The optimizer needs business guardrails before any recommendation reaches the UI.

### Hard floor
Recommended:
- `hard_floor = max(cost + minimum_profit_buffer, current_price * floor_retention_ratio)`

Reason:
- the app should not recommend a price below cost
- the app should not overreact with unrealistic cuts

### Soft target floor
Also compute a softer warning metric:
- `soft_target_price = cost / (1 - target_margin_ratio)`

This should help explain when a cocktail is under target without forcing a giant recommendation jump.

### Hard ceiling
Recommended:
- derive a ceiling from the cheapest selected cocktail
- also cap by maximum allowed increase percentage

Example:
- `anchor_price = cheapest selected cocktail price`
- `hard_ceiling = min(current_price * max_increase_cap, anchor_price * anchor_multiplier)`

Reason:
- protects menu coherence
- prevents the optimizer from drifting premium items too far away from the rest of the menu

### Rounding
Round recommended prices to a clean FCFA step such as:
- nearest `50`
- or nearest `100`

Reason:
- keeps recommendations usable on a real menu
- avoids fake precision

## Detailed Step-By-Step Implementation Plan
This is the build order that best fits the current repo.

### Step 1: Confirm existing calculation basis
Review and keep the current source of truth in:
- `state.js` for `calcTotalCost()` and `calcMargin()`
- `config.js` for current display thresholds
- `logic-refactored.js` for summary generation

Goal:
- ensure the optimizer is built on the same ingredient-cost basis as the rest of the app

### Step 2: Add optimizer constants to `config.js`
Add explicit pricing-optimizer settings such as:
- healthy margin low bound
- healthy margin upper bound
- very high margin threshold
- minimum profit buffer
- popularity-based move caps
- maximum increase cap
- maximum decrease cap
- anchor multiplier
- rounding increment

Goal:
- keep business rules centralized
- avoid hiding pricing assumptions inside rendering code

### Step 3: Add a dedicated optimizer helper layer
Create a new helper file, for example:
- `pricing-optimizer.js`

This file should contain pure or mostly pure helpers for:
- computing contribution values
- classifying menu items
- mapping popularity to sensitivity
- calculating recommended moves
- applying guardrails
- building recommendation text

Goal:
- keep optimizer logic isolated from UI generation
- avoid inflating `logic-refactored.js`

### Step 4: Define the optimizer result object
Each selected cocktail should produce a normalized result object like:
- `name`
- `currentPrice`
- `cost`
- `ingredientMarginPercent`
- `contributionValue`
- `popularity`
- `menuClass`
- `sensitivityBand`
- `recommendedAction`
- `suggestedPrice`
- `priceDeltaValue`
- `priceDeltaPercent`
- `expectedDemandDirection`
- `expectedProfitDirection`
- `reasonFr`
- `status`

Goal:
- give the UI one clean data shape to render
- keep calculated recommendation data separate from base cocktail data

### Step 5: Compute optimizer results during summary generation
Hook the optimizer into the current `generateMenu()` flow.

Order of operations:
1. Existing summary calculations run.
2. Optimizer receives selected cocktails plus computed costs.
3. Optimizer returns one result per valid cocktail.
4. The page renders:
   - existing summary table
   - existing monthly summary card
   - new recommendation table
   - small supporting gain visual

Goal:
- avoid creating a separate workflow branch
- reuse the current "generate summary" action

### Step 6: Render a decision-first recommendation table
The recommendation table should be the main optimizer UI.

Required columns:
- Cocktail
- Prix actuel
- Cout ingredient
- Marge ingredient
- Classe
- Recommandation
- Prix suggere
- Effet attendu

Optional secondary information:
- popularity score
- reason text

### Table behavior rules
- Sort by priority, not alphabetically.
- Highest-priority rows first:
  - weakest margin strong sellers
  - risky very-high-margin items
  - review-needed items
- Keep explanations readable and short.
- Use clear row hierarchy, not dense dashboard styling.

Goal:
- make the manager see the important decisions first

### Step 7: Add a small supporting gain visual
The visual should support the table, not compete with it.

Recommended form:
- a small scenario comparison visual for each cocktail or for the menu total
- compare `current` vs `recommended`
- optional third point for `safe upper test limit`

Do not build:
- a large multiseries dashboard
- a decorative chart with unclear meaning

Good uses:
- a compact line or sparkline with labels
- a small before/after profit comparison bar

Required support text:
- one short sentence explaining what the visual shows
- one accessible text alternative with the same core meaning

Goal:
- reinforce expected gain direction without increasing cognitive load

### Step 8: Add plain-French recommendation text
Each recommendation should explain:
- what the current situation is
- what the suggested move is
- what effect is expected
- why the move is limited

Examples:
- `Cocktail populaire mais marge ingredient faible: hausse legere recommandee pour proteger la rentabilite sans casser la demande.`
- `Cocktail peu demande mais deja rentable: maintien ou baisse legere pour tester une meilleure traction.`
- `Cocktail peu demande et peu rentable: a revoir avant toute hausse automatique.`

Goal:
- make the optimizer understandable without reading formulas

### Step 9: Handle incomplete data safely
If a cocktail lacks:
- valid price
- valid popularity
- computable cost

the optimizer should:
- skip recommendation for that item
- return a warning status
- show a short explanation in the UI

Goal:
- prevent crashes
- prevent nonsense recommendations

### Step 10: Verify browser compatibility
Because the app uses classic scripts:
- load the new helper file in the correct script order
- expose any shared helper on `window` if needed by another file
- avoid top-level name collisions

Goal:
- fit the current architecture with minimal risk

## Detailed UX/UI Plan For The Optimizer
The optimizer UI must follow the repo's current UX direction.

### Layout
- Keep the existing summary area.
- Add the optimizer below the current summary dashboard or beside it only if width clearly supports it.
- On smaller screens, stack it below the current summary.

### Visual hierarchy
- Start with a short heading that says what the section is for.
- Put the recommendation table first.
- Put the small gain visual second.
- Put longer methodological notes last.

### Copy principles
- Use plain French.
- Use short labels.
- Explain estimated outcomes as estimates.
- Avoid jargon unless necessary, and define it if used.

### Accessibility
- Table uses semantic markup.
- Mini-chart includes text summary.
- Do not encode recommendation severity with color alone.
- Keep focus visible if controls are added later.

## Concrete Examples
### Example 1: Popular cocktail with weak margin
- price: `3000`
- cost: `1100`
- popularity: `5`

Computed:
- contribution value: `1900`
- margin: `63.3%`

Likely classification:
- `Plow Horse`

Likely recommendation:
- slight increase
- maybe `3150` or `3200` depending on configured rounding

Why:
- strong demand
- weak ingredient margin
- popularity suggests a modest increase is safer here than on a weak seller

### Example 2: High-margin cocktail with weak popularity
- price: `4500`
- cost: `900`
- popularity: `2`

Computed:
- contribution value: `3600`
- margin: `80%`

Likely classification:
- `Puzzle`

Likely recommendation:
- hold or slight decrease

Why:
- margin is already healthy
- demand is weak
- pushing price up would likely worsen the commercial problem

### Example 3: Weak seller and weak margin
- price: `2500`
- cost: `900`
- popularity: `1`

Computed:
- contribution value: `1600`
- margin: `64%`

Likely classification:
- `Dog`

Likely recommendation:
- review, not automatic increase

Why:
- both economics and traction are weak
- a forced increase would likely hurt customer response

## Testing Plan
### Functional verification
- Optimizer returns one result per valid selected cocktail.
- No negative suggested prices.
- No suggestion below cost.
- No suggestion exceeds the configured ceiling.
- Sorting puts priority actions first.

### Business verification
- Popular low-margin items receive the strongest permitted increases.
- Weak-demand items are not pushed upward by default.
- Very-high-margin items are not pushed even higher automatically.
- Healthy-margin, medium-demand items often return `hold`.

### UX verification
- Recommendation table is readable without needing the chart.
- Chart supports the table and does not dominate it.
- Copy is understandable to a non-technical manager.
- Color is not the only status cue.

### Browser verification
- App still loads without blocking runtime errors.
- Existing summary still renders.
- Recommendation section appears after summary generation.
- No classic-script global collision is introduced.

## Assumptions
- The optimizer remains advisory only.
- All margin calculations are based on raw ingredient cost only.
- High-end bar margin references inform the app but do not dictate every threshold.
- Customer-safe rebalancing has priority over aggressive margin capture.
- The recommendation table is the primary output and the mini-chart is secondary.

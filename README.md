# CocktailJoker

A small web app that helps calculate cocktail margins and exports them to a Google Sheets backend.

## Mobile optimisation

This release focuses on responsive layout without altering how data is saved to Google Sheets.

- Added `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` for proper scaling.
- Main content is wrapped in a `max-w-screen-sm mx-auto px-4` container.
- Buttons expand to full width on small screens while inputs break onto new lines.
- Ingredient and summary tables scroll horizontally if the screen is too narrow.

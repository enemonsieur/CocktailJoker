/**
 * @jest-environment jsdom
 */
// smoke.test.js — End-to-end browser simulation test
// Simulates loading index.html and performing a full user workflow

const fs = require('fs');
const path = require('path');

// ── Load the full HTML ───────────────────────────────────
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Strip external script/link tags (CDN) but keep our local scripts
const cleanHtml = html
  .replace(/<script src="https:\/\/[^"]*"><\/script>/g, '')
  .replace(/<link[^>]*cdnjs[^>]*>/g, '')
  // Remove our script tags too — we'll load via require
  .replace(/<script src="[^"]*\.js"><\/script>/g, '');

document.documentElement.innerHTML = cleanHtml;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// ── Load modules in browser order ────────────────────────
const dataCode = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
eval(dataCode.replace(/^const /gm, 'var ').replace(/if \(typeof module.*\n?.*\n?.*\}/m, ''));

const { CONFIG, COLORS, getPopularityTooltip, getConversionFactor } = require('./config');
const uiHelpers = require('./ui-helpers');
const { AppState, calcTotalCost, calcMargin, generateCode } = require('./state');

Object.assign(window, { CONFIG, COLORS, getPopularityTooltip, getConversionFactor });
Object.assign(window, uiHelpers);
Object.assign(window, { AppState, calcMargin, generateCode });
window.cocktails = cocktails;
window.masterIngredients = masterIngredients;

const logic = require('./logic-refactored');

// ── Smoke Tests ──────────────────────────────────────────

describe('Smoke Test: Full User Workflow', () => {

  beforeEach(() => {
    AppState.reset();
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    uiHelpers.DOM.clear();
  });

  test('1. App starts: intro visible, cocktail list hidden', () => {
    const intro = document.getElementById('intro-section');
    const cocktailList = document.getElementById('cocktail-list');
    expect(intro).toBeTruthy();
    expect(cocktailList.classList.contains('hidden')).toBe(true);
  });

  test('2. Click "start" reveals cocktail list', () => {
    logic.startApp();
    const cocktailList = document.getElementById('cocktail-list');
    expect(cocktailList.classList.contains('hidden')).toBe(false);
  });

  test('3. Render cocktail buttons (popular ones by default)', () => {
    logic.renderCocktailList();
    const buttons = document.getElementById('cocktail-list').querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(3); // At least popular cocktails + toggle + create
  });

  test('4. Select 3 cocktails → cards render with costs', () => {
    logic.addCocktail('Mojito');
    logic.addCocktail('Margarita');
    logic.addCocktail('Cosmopolitan');

    expect(AppState.selected).toHaveLength(3);

    const container = document.getElementById('selected-cocktails');
    expect(container.querySelectorAll('.cost-amount').length).toBe(3);
    expect(container.querySelectorAll('.margin-percentage').length).toBe(3);

    // Verify costs are positive numbers
    container.querySelectorAll('.cost-amount').forEach(el => {
      const cost = parseInt(el.textContent);
      expect(cost).toBeGreaterThan(0);
    });
  });

  test('5. Create custom cocktail', () => {
    logic.addCustomCocktail();
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Nouveau cocktail');
  });

  test('6. Update cocktail properties', () => {
    logic.addCocktail('Mojito');

    logic.updateCocktailPrice(0, 4000);
    expect(AppState.selected[0].price).toBe(4000);

    logic.updateCocktailPopularity(0, 3);
    expect(AppState.selected[0].popularity).toBe(3);

    logic.updateCocktailName(0, 'Super Mojito');
    expect(AppState.selected[0].name).toBe('Super Mojito');
  });

  test('7. Add and remove ingredients', () => {
    logic.addCocktail('Mojito');
    const initialCount = AppState.selected[0].ingredients.length;

    logic.addNewIngredient(0);
    expect(AppState.selected[0].ingredients.length).toBe(initialCount + 1);

    logic.removeIngredient(0, AppState.selected[0].ingredients.length - 1);
    expect(AppState.selected[0].ingredients.length).toBe(initialCount);
  });

  test('8. Generate menu summary with sales data', () => {
    logic.addCocktail('Mojito');
    logic.addCocktail('Margarita');
    logic.addCocktail('Tequila Sunrise');

    document.getElementById('weekday-input').value = '5';
    document.getElementById('weekend-input').value = '20';

    logic.generateMenu();

    const summary = document.getElementById('menu-summary');
    expect(summary.classList.contains('hidden')).toBe(false);
    expect(summary.innerHTML).toContain('<table');
    expect(summary.innerHTML).toContain('Résumé du Menu');

    // Monthly summary card
    const monthly = document.getElementById('monthly-summary');
    expect(monthly).toBeTruthy();
    expect(monthly.textContent).toContain('FCFA');
  });

  test('9. Remove cocktail → card disappears', () => {
    logic.addCocktail('Mojito');
    logic.addCocktail('Margarita');
    expect(AppState.selected).toHaveLength(2);

    logic.removeCocktail(0);
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Margarita');
  });

  test('10. All original function exports work', () => {
    const exports = [
      'calcTotalCost', 'generateMenu', 'renderCocktailList', 'renderSelected',
      'addCocktail', 'addCustomCocktail', 'updateCocktailName', 'removeCocktail',
      'exportMenu', 'startApp', 'isSelected',
      'updateCocktailPrice', 'updateCocktailPopularity',
      'updateIngredient', 'addNewIngredient', 'removeIngredient',
      'updateIngredientUnitServed', 'updateIngredientMasterData',
      'updateMasterIngredient', 'updateIngredientPrice',
    ];
    exports.forEach(name => {
      expect(typeof logic[name]).toBe('function');
    });
  });
});

describe('Smoke Test: Module Architecture', () => {
  test('config.js exports all needed constants', () => {
    expect(CONFIG.MARGIN_HIGH).toBeDefined();
    expect(CONFIG.ENDPOINT_URL).toBeDefined();
    expect(COLORS.getMarginColor).toBeDefined();
  });

  test('state.js AppState has all CRUD methods', () => {
    ['addCocktail', 'addCustomCocktail', 'removeCocktail',
     'updateCocktail', 'updateIngredient', 'addIngredient',
     'removeIngredient', 'updateIngredientUnit', 'updateMasterData',
     'isSelected', 'onChange', 'reset'].forEach(method => {
      expect(typeof AppState[method]).toBe('function');
    });
  });

  test('ui-helpers.js has all builder functions', () => {
    ['DOM', 'createButton', 'createCocktailButton', 'createToggleButton',
     'createAddButton', 'buildTextInput', 'buildNumberInput', 'buildSelect',
     'buildUnitSelect', 'buildBuyUnitSelect', 'buildIngredientRow',
     'buildCocktailCard', 'displayMessage'].forEach(name => {
      expect(uiHelpers[name]).toBeDefined();
    });
  });
});

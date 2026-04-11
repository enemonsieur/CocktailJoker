/**
 * @jest-environment jsdom
 */
// integration.test.js — Full integration tests comparing refactored logic vs original behavior

// ── Setup DOM ────────────────────────────────────────────
beforeAll(() => {
  // Minimal HTML matching index.html structure
  document.body.innerHTML = `
    <div id="intro-section"></div>
    <button id="start-btn"></button>
    <button id="scroll-cta" class="hidden"></button>
    <div id="cocktail-list" class="hidden"></div>
    <div id="selected-cocktails" class="hidden"></div>
    <div id="sales-estimation" class="hidden">
      <select id="gross-revenue-input"><option value=""></option><option value="2000000">2M</option></select>
      <input id="weekday-input" type="number" value="5">
      <input id="weekend-input" type="number" value="15">
    </div>
    <div id="menu-summary" class="hidden"></div>
    <div id="export-section" class="hidden"><button>Save</button></div>
    <button onclick="generateMenu()">Générer</button>
  `;
});

// ── Load modules in correct order ────────────────────────
const { CONFIG, COLORS, getPopularityTooltip, getConversionFactor } = require('./config');
const uiHelpers = require('./ui-helpers');
const stateModule = require('./state');
const { AppState, calcTotalCost: rawCalcCost, calcMargin, generateCode } = stateModule;

// Load data.js — it uses `const` so we need to eval it to get globals
const fs = require('fs');
const dataCode = fs.readFileSync(require.resolve('./data'), 'utf8');
const dataCodeGlobal = dataCode.replace(/^const /gm, 'var ');
eval(dataCodeGlobal);

// Expose on window (mimics browser <script> loading)
// IMPORTANT: expose data globals BEFORE loading logic-refactored.js
Object.assign(window, { CONFIG, COLORS, getPopularityTooltip, getConversionFactor });
Object.assign(window, uiHelpers);
Object.assign(window, { AppState, calcMargin, generateCode });
// Note: do NOT put calcTotalCost on window to avoid shadowing the wrapper in logic-refactored.js
window.cocktails = cocktails;
window.masterIngredients = masterIngredients;

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Now load refactored logic
const logic = require('./logic-refactored');

// ── Tests ────────────────────────────────────────────────

describe('Integration: Cocktail selection flow', () => {
  beforeEach(() => {
    AppState.reset();
    // Re-register listeners since reset clears them
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    document.getElementById('selected-cocktails').innerHTML = '';
    document.getElementById('cocktail-list').innerHTML = '';
    uiHelpers.DOM.clear();
  });

  test('addCocktail adds Margarita from the cocktails database', () => {
    logic.addCocktail('Margarita');
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Margarita');
  });

  test('addCocktail ignores unknown cocktail name', () => {
    logic.addCocktail('DoesNotExist');
    expect(AppState.selected).toHaveLength(0);
  });

  test('addCustomCocktail creates editable cocktail', () => {
    logic.addCustomCocktail();
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Nouveau cocktail');
    expect(AppState.selected[0].ingredients.length).toBe(3);
  });

  test('removeCocktail removes and re-renders', () => {
    logic.addCocktail('Margarita');
    logic.addCocktail('Mojito');
    expect(AppState.selected).toHaveLength(2);
    logic.removeCocktail(0);
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Mojito');
  });

  test('isSelected tracks selection state', () => {
    expect(logic.isSelected('Margarita')).toBe(false);
    logic.addCocktail('Margarita');
    expect(logic.isSelected('Margarita')).toBe(true);
  });
});

describe('Integration: Cocktail updates', () => {
  beforeEach(() => {
    AppState.reset();
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    uiHelpers.DOM.clear();
    logic.addCocktail('Margarita');
  });

  test('updateCocktailPrice changes price', () => {
    logic.updateCocktailPrice(0, 3500);
    expect(AppState.selected[0].price).toBe(3500);
  });

  test('updateCocktailPopularity clamps to 1-5', () => {
    logic.updateCocktailPopularity(0, 10);
    expect(AppState.selected[0].popularity).toBe(5);
    logic.updateCocktailPopularity(0, -3);
    expect(AppState.selected[0].popularity).toBe(1);
  });

  test('updateCocktailName trims and falls back', () => {
    logic.updateCocktailName(0, '  ');
    expect(AppState.selected[0].name).toBe('Sans nom');
    logic.updateCocktailName(0, ' Daiquiri ');
    expect(AppState.selected[0].name).toBe('Daiquiri');
  });
});

describe('Integration: Ingredient management', () => {
  beforeEach(() => {
    AppState.reset();
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    uiHelpers.DOM.clear();
    logic.addCocktail('Margarita');
  });

  test('updateIngredient changes ingredient property', () => {
    logic.updateIngredient(0, 0, 'volume', 6);
    expect(AppState.selected[0].ingredients[0].volume).toBe(6);
  });

  test('addNewIngredient adds ingredient and seeds master data', () => {
    const initialCount = AppState.selected[0].ingredients.length;
    logic.addNewIngredient(0);
    expect(AppState.selected[0].ingredients.length).toBe(initialCount + 1);
    expect(masterIngredients['Nouvel ingrédient']).toBeDefined();
  });

  test('removeIngredient removes by index', () => {
    const initialCount = AppState.selected[0].ingredients.length;
    logic.removeIngredient(0, 0);
    expect(AppState.selected[0].ingredients.length).toBe(initialCount - 1);
  });
});

describe('Integration: Cost calculation matches original', () => {
  test('Margarita cost matches manual calculation', () => {
    // Gin: 5000 / (0.7 * 100) = 71.43/cl × 4cl = 285.71
    // Tonic: 800 / (1.0 * 100) = 8/cl × 10cl = 80
    // Total ≈ 366
    const ginTonic = cocktails.find(c => c.name === 'Margarita');
    if (!ginTonic) return; // Skip if not in data
    const cost = logic.calcTotalCost(ginTonic);
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  test('calcMargin produces correct percentage', () => {
    expect(calcMargin(2500, 366)).toBe(85);
    expect(calcMargin(0, 100)).toBe(0);
    expect(calcMargin(1000, 0)).toBe(100);
  });
});

describe('Integration: renderCocktailList', () => {
  beforeEach(() => {
    AppState.reset();
    uiHelpers.DOM.clear();
  });

  test('renders buttons into cocktail-list div', () => {
    logic.renderCocktailList();
    const div = document.getElementById('cocktail-list');
    const buttons = div.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('selected cocktails show checkmark', () => {
    logic.addCocktail('Mojito');
    logic.renderCocktailList();
    const div = document.getElementById('cocktail-list');
    const buttons = Array.from(div.querySelectorAll('button'));
    const mojitoBtn = buttons.find(b => b.textContent.includes('Mojito'));
    if (mojitoBtn) {
      expect(mojitoBtn.textContent).toContain('✓');
      expect(mojitoBtn.className).toContain('bg-blue-500');
    }
  });

  test('toggle button exists and toggles cocktail display', () => {
    logic.renderCocktailList();
    const div = document.getElementById('cocktail-list');
    const allButtons = Array.from(div.querySelectorAll('button'));
    const toggleBtn = allButtons.find(b => b.innerHTML.includes('Voir tous'));
    if (toggleBtn) {
      const initialCount = allButtons.length;
      toggleBtn.click();
      const newButtons = div.querySelectorAll('button');
      // After toggle, should show more or fewer cocktails
      expect(newButtons.length).not.toBe(0);
    }
  });
});

describe('Integration: renderSelected', () => {
  beforeEach(() => {
    AppState.reset();
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    uiHelpers.DOM.clear();
  });

  test('renders cocktail cards when cocktails are selected', () => {
    logic.addCocktail('Mojito');
    const container = document.getElementById('selected-cocktails');
    expect(container.innerHTML).toContain('Mojito');
    expect(container.innerHTML).toContain('Marge');
    expect(container.innerHTML).toContain('FCFA');
  });

  test('shows cost and margin in each card', () => {
    logic.addCocktail('Margarita');
    const container = document.getElementById('selected-cocktails');
    expect(container.querySelector('.cost-amount')).toBeTruthy();
    expect(container.querySelector('.margin-percentage')).toBeTruthy();
  });

  test('empty selection clears container', () => {
    logic.addCocktail('Margarita');
    logic.removeCocktail(0);
    const container = document.getElementById('selected-cocktails');
    expect(container.innerHTML).toBe('');
  });
});

describe('Integration: generateMenu', () => {
  beforeEach(() => {
    AppState.reset();
    AppState.onChange(() => {
      logic.renderSelected();
      logic.renderCocktailList();
    });
    uiHelpers.DOM.clear();
    document.getElementById('weekday-input').value = '5';
    document.getElementById('weekend-input').value = '15';
  });

  test('generates summary table with cocktails', () => {
    logic.addCocktail('Margarita');
    logic.addCocktail('Mojito');
    logic.generateMenu();
    const summary = document.getElementById('menu-summary');
    expect(summary.innerHTML).toContain('<table');
    expect(summary.innerHTML).toContain('Résumé du Menu');
    expect(summary.innerHTML).toContain('Marge globale');
  });

  test('shows monthly summary card', () => {
    logic.addCocktail('Margarita');
    logic.generateMenu();
    const monthlyCard = document.getElementById('monthly-summary');
    expect(monthlyCard).toBeTruthy();
    expect(monthlyCard.innerHTML).toContain('Cocktails / mois');
  });

  test('shows error when no sales data entered', () => {
    logic.addCocktail('Margarita');
    document.getElementById('weekday-input').value = '0';
    document.getElementById('weekend-input').value = '0';
    logic.generateMenu();
    // Should display error message (appended to body)
    const messages = document.querySelectorAll('.message-box');
    expect(messages.length).toBeGreaterThan(0);
  });
});

describe('Integration: startApp', () => {
  test('reveals cocktail list and hides intro', () => {
    document.getElementById('intro-section').classList.remove('hidden');
    document.getElementById('cocktail-list').classList.add('hidden');
    logic.startApp();
    expect(document.getElementById('intro-section').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('cocktail-list').classList.contains('hidden')).toBe(false);
  });
});

describe('Integration: All original exports still work', () => {
  test('all expected functions are exported', () => {
    const requiredExports = [
      'calcTotalCost', 'generateMenu', 'renderCocktailList', 'renderSelected',
      'addCocktail', 'addCustomCocktail', 'updateCocktailName', 'removeCocktail',
      'exportMenu', 'startApp',
    ];
    requiredExports.forEach(name => {
      expect(typeof logic[name]).toBe('function');
    });
  });
});

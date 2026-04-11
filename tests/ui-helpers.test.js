/**
 * @jest-environment jsdom
 */
// ui-helpers.test.js — Step 2 tests: verify UI builders produce correct HTML

// Provide CONFIG/COLORS on window for browser-style fallback
const { CONFIG, COLORS } = require('./config');
window.CONFIG = CONFIG;
window.COLORS = COLORS;

const {
  DOM,
  createButton,
  createCocktailButton,
  createToggleButton,
  createAddButton,
  buildTextInput,
  buildNumberInput,
  buildSelect,
  buildUnitSelect,
  buildBuyUnitSelect,
  buildIngredientRow,
  buildCocktailCard,
} = require('./ui-helpers');

beforeEach(() => {
  document.body.innerHTML = '<div id="test"></div>';
  DOM.clear();
});

// ── DOM Cache ────────────────────────────────────────────
describe('DOM cache', () => {
  test('get returns element by id', () => {
    const el = DOM.get('test');
    expect(el).toBeTruthy();
    expect(el.id).toBe('test');
  });

  test('caches results', () => {
    const el1 = DOM.get('test');
    const el2 = DOM.get('test');
    expect(el1).toBe(el2);
  });

  test('clear resets cache', () => {
    DOM.get('test');
    DOM.clear();
    expect(DOM._cache).toEqual({});
  });
});

// ── Button Factory ───────────────────────────────────────
describe('createButton', () => {
  test('creates button with text and class', () => {
    const btn = createButton({
      text: 'Click me',
      className: 'bg-red-500',
      onClick: () => {},
    });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.textContent).toBe('Click me');
    expect(btn.className).toBe('bg-red-500');
  });

  test('supports innerHTML instead of text', () => {
    const btn = createButton({
      innerHTML: '<strong>Bold</strong>',
      className: 'test',
      onClick: () => {},
    });
    expect(btn.innerHTML).toBe('<strong>Bold</strong>');
  });

  test('sets title and onclick', () => {
    let clicked = false;
    const btn = createButton({
      text: 'T',
      className: '',
      onClick: () => { clicked = true; },
      title: 'My title',
    });
    expect(btn.title).toBe('My title');
    btn.click();
    expect(clicked).toBe(true);
  });
});

describe('createCocktailButton', () => {
  test('active button has blue background and checkmark', () => {
    const btn = createCocktailButton('Mojito', true, () => {});
    expect(btn.textContent).toContain('✓');
    expect(btn.textContent).toContain('Mojito');
    expect(btn.className).toContain('bg-blue-500');
  });

  test('inactive button has gray background and plus sign', () => {
    const btn = createCocktailButton('Gin Tonic', false, () => {});
    expect(btn.textContent).toContain('+');
    expect(btn.className).toContain('bg-gray-200');
  });
});

describe('createToggleButton', () => {
  test('showAll=false shows "Voir tous"', () => {
    const btn = createToggleButton(false, () => {});
    expect(btn.innerHTML).toContain('Voir tous les cocktails...');
  });

  test('showAll=true shows "Voir moins"', () => {
    const btn = createToggleButton(true, () => {});
    expect(btn.innerHTML).toContain('Voir moins...');
  });
});

describe('createAddButton', () => {
  test('renders label with + prefix', () => {
    const btn = createAddButton('Créer un cocktail', () => {});
    expect(btn.innerHTML).toContain('+ Créer un cocktail');
    expect(btn.className).toContain('bg-green-500');
  });
});

// ── HTML Input Builders ──────────────────────────────────
describe('buildTextInput', () => {
  test('produces text input with value and onchange', () => {
    const html = buildTextInput({ value: 'Gin', onchange: 'update()' });
    expect(html).toContain('type="text"');
    expect(html).toContain('value="Gin"');
    expect(html).toContain('onchange="update()"');
  });

  test('escapes double quotes in value', () => {
    const html = buildTextInput({ value: 'Rhum "special"', onchange: '' });
    expect(html).toContain('&quot;');
  });
});

describe('buildNumberInput', () => {
  test('produces number input with step', () => {
    const html = buildNumberInput({ value: 4, step: 0.1, onchange: 'x()' });
    expect(html).toContain('type="number"');
    expect(html).toContain('value="4"');
    expect(html).toContain('step="0.1"');
  });
});

describe('buildSelect / buildUnitSelect / buildBuyUnitSelect', () => {
  test('buildSelect renders options with selected', () => {
    const html = buildSelect({
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
      selectedValue: 'b',
      onchange: 'fn()',
    });
    expect(html).toContain('<option value="a" >A</option>');
    expect(html).toContain('<option value="b" selected>B</option>');
  });

  test('buildUnitSelect has cl/g/piece', () => {
    const html = buildUnitSelect('g', 'fn()');
    expect(html).toContain('value="cl"');
    expect(html).toContain('value="g" selected');
    expect(html).toContain('value="piece"');
  });

  test('buildBuyUnitSelect has liter/g/piece', () => {
    const html = buildBuyUnitSelect('liter', 'fn()');
    expect(html).toContain('value="liter" selected');
    expect(html).toContain('value="g"');
    expect(html).toContain('value="piece"');
  });
});

// ── Ingredient Row Builder ───────────────────────────────
describe('buildIngredientRow', () => {
  const ingredient = { name: 'Gin', volume: 4 };
  const ingInfo = { unitServed: 'cl', buyVolume: 0.7, buyUnit: 'liter', price: 5000 };

  test('contains remove button with correct indices', () => {
    const html = buildIngredientRow(0, 1, ingredient, ingInfo);
    expect(html).toContain('removeIngredient(0, 1)');
  });

  test('contains ingredient name input', () => {
    const html = buildIngredientRow(0, 0, ingredient, ingInfo);
    expect(html).toContain('value="Gin"');
    expect(html).toContain("updateIngredient(0, 0, 'name', this.value)");
  });

  test('contains volume input with correct value', () => {
    const html = buildIngredientRow(0, 0, ingredient, ingInfo);
    expect(html).toContain('value="4"');
  });

  test('contains price and buyVolume from ingInfo', () => {
    const html = buildIngredientRow(0, 0, ingredient, ingInfo);
    expect(html).toContain('value="5000"');
    expect(html).toContain('value="0.7"');
  });

  test('falls back to defaults when ingInfo is null', () => {
    const html = buildIngredientRow(0, 0, ingredient, null);
    expect(html).toContain('value="0"');   // default price
    expect(html).toContain('value="1"');   // default buyVolume
  });
});

// ── Cocktail Card Builder ────────────────────────────────
describe('buildCocktailCard', () => {
  const cocktail = { name: 'Mojito', price: 3000, popularity: 5, ingredients: [] };

  test('contains cocktail name', () => {
    const html = buildCocktailCard(cocktail, 0, 500, 83, 'text-green-600', '');
    expect(html).toContain('value="Mojito"');
  });

  test('contains cost and margin', () => {
    const html = buildCocktailCard(cocktail, 0, 500, 83, 'text-green-600', '');
    expect(html).toContain('500');
    expect(html).toContain('83');
    expect(html).toContain('text-green-600');
  });

  test('contains remove button for correct index', () => {
    const html = buildCocktailCard(cocktail, 2, 500, 83, 'text-green-600', '');
    expect(html).toContain('removeCocktail(2)');
  });

  test('contains price and popularity inputs', () => {
    const html = buildCocktailCard(cocktail, 0, 500, 83, 'text-green-600', '');
    expect(html).toContain('value="3000"');
    expect(html).toContain('value="5"');
    expect(html).toContain('updateCocktailPrice(0');
    expect(html).toContain('updateCocktailPopularity(0');
  });
});

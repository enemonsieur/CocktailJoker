// state.test.js — Step 3 tests: verify state management & calculations

const { AppState, calcTotalCost, calcMargin, generateCode } = require('./state');

// ── Sample data ──────────────────────────────────────────
const sampleMaster = {
  'Gin':    { unitServed: 'cl', buyVolume: 0.7, buyUnit: 'liter', price: 5000 },
  'Tonic':  { unitServed: 'cl', buyVolume: 1.0, buyUnit: 'liter', price: 800 },
  'Rhum':   { unitServed: 'cl', buyVolume: 0.7, buyUnit: 'liter', price: 4000 },
  'Menthe': { unitServed: 'g',  buyVolume: 50,  buyUnit: 'g',     price: 150 },
};

const ginTonic = {
  name: 'Gin Tonic',
  price: 2500,
  popularity: 4,
  ingredients: [
    { name: 'Gin', volume: 4 },
    { name: 'Tonic', volume: 10 },
  ],
};

beforeEach(() => {
  AppState.reset();
});

// ── AppState: Cocktail CRUD ──────────────────────────────
describe('AppState cocktail management', () => {
  test('addCocktail adds a deep clone', () => {
    AppState.addCocktail(ginTonic);
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Gin Tonic');
    // Verify it's a clone, not a reference
    expect(AppState.selected[0]).not.toBe(ginTonic);
  });

  test('addCocktail prevents duplicates', () => {
    AppState.addCocktail(ginTonic);
    AppState.addCocktail(ginTonic);
    expect(AppState.selected).toHaveLength(1);
  });

  test('addCustomCocktail adds default cocktail', () => {
    AppState.addCustomCocktail();
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Nouveau cocktail');
    expect(AppState.selected[0].ingredients).toHaveLength(3);
  });

  test('removeCocktail removes by index', () => {
    AppState.addCocktail(ginTonic);
    AppState.addCustomCocktail();
    expect(AppState.selected).toHaveLength(2);
    AppState.removeCocktail(0);
    expect(AppState.selected).toHaveLength(1);
    expect(AppState.selected[0].name).toBe('Nouveau cocktail');
  });

  test('isSelected returns correct boolean', () => {
    expect(AppState.isSelected('Gin Tonic')).toBe(false);
    AppState.addCocktail(ginTonic);
    expect(AppState.isSelected('Gin Tonic')).toBe(true);
  });
});

// ── AppState: onChange listener ───────────────────────────
describe('AppState notifications', () => {
  test('onChange callback fires on state changes', () => {
    let callCount = 0;
    AppState.onChange(() => { callCount++; });

    AppState.addCocktail(ginTonic);
    expect(callCount).toBe(1);

    AppState.addCustomCocktail();
    expect(callCount).toBe(2);

    AppState.removeCocktail(0);
    expect(callCount).toBe(3);
  });

  test('multiple listeners all fire', () => {
    let a = 0, b = 0;
    AppState.onChange(() => { a++; });
    AppState.onChange(() => { b++; });
    AppState.addCustomCocktail();
    expect(a).toBe(1);
    expect(b).toBe(1);
  });
});

// ── AppState: Generic updates ────────────────────────────
describe('AppState.updateCocktail', () => {
  beforeEach(() => {
    AppState.addCocktail(ginTonic);
  });

  test('updates price', () => {
    AppState.updateCocktail(0, 'price', 3000);
    expect(AppState.selected[0].price).toBe(3000);
  });

  test('clamps popularity to 1-5', () => {
    AppState.updateCocktail(0, 'popularity', 10);
    expect(AppState.selected[0].popularity).toBe(5);
    AppState.updateCocktail(0, 'popularity', -1);
    expect(AppState.selected[0].popularity).toBe(1);
  });

  test('trims name and falls back to default', () => {
    AppState.updateCocktail(0, 'name', '  ');
    expect(AppState.selected[0].name).toBe('Sans nom');
    AppState.updateCocktail(0, 'name', '  Daiquiri  ');
    expect(AppState.selected[0].name).toBe('Daiquiri');
  });

  test('ignores invalid index', () => {
    AppState.updateCocktail(99, 'price', 1000);
    // Should not throw
  });
});

// ── AppState: Ingredient updates ─────────────────────────
describe('AppState ingredient management', () => {
  beforeEach(() => {
    AppState.addCocktail(ginTonic);
  });

  test('updateIngredient changes a property', () => {
    AppState.updateIngredient(0, 0, 'volume', 6);
    expect(AppState.selected[0].ingredients[0].volume).toBe(6);
  });

  test('addIngredient pushes new ingredient', () => {
    const master = { ...sampleMaster };
    AppState.addIngredient(0, master);
    expect(AppState.selected[0].ingredients).toHaveLength(3);
    expect(AppState.selected[0].ingredients[2].name).toBe('Nouvel ingrédient');
    expect(master['Nouvel ingrédient']).toBeDefined();
  });

  test('removeIngredient splices correctly', () => {
    AppState.removeIngredient(0, 0);
    expect(AppState.selected[0].ingredients).toHaveLength(1);
    expect(AppState.selected[0].ingredients[0].name).toBe('Tonic');
  });
});

// ── AppState: Unit changes ───────────────────────────────
describe('AppState.updateIngredientUnit', () => {
  beforeEach(() => {
    AppState.addCocktail(ginTonic);
  });

  test('cl → liter divides volume by 100', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    AppState.selected[0].ingredients[0].volume = 4; // 4 cl
    AppState.updateIngredientUnit(0, 0, 'liter', master);
    expect(AppState.selected[0].ingredients[0].volume).toBeCloseTo(0.04);
  });

  test('liter → cl multiplies volume by 100', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    master['Gin'].unitServed = 'liter';
    AppState.selected[0].ingredients[0].volume = 0.04;
    AppState.updateIngredientUnit(0, 0, 'cl', master);
    expect(AppState.selected[0].ingredients[0].volume).toBeCloseTo(4);
  });

  test('forces buyUnit to match unitServed', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    AppState.updateIngredientUnit(0, 0, 'piece', master);
    expect(master['Gin'].buyUnit).toBe('piece');
    expect(master['Gin'].unitServed).toBe('piece');
  });
});

// ── AppState: Master data updates ────────────────────────
describe('AppState.updateMasterData', () => {
  test('updates existing ingredient price', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    AppState.updateMasterData('Gin', 'price', '6000', master);
    expect(master['Gin'].price).toBe(6000);
  });

  test('seeds new ingredient if unknown', () => {
    const master = {};
    AppState.updateMasterData('Vodka', 'price', '3000', master);
    expect(master['Vodka']).toBeDefined();
    expect(master['Vodka'].price).toBe(3000);
    expect(master['Vodka'].unitServed).toBe('cl');
  });

  test('rejects invalid buyUnit', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    AppState.updateMasterData('Gin', 'buyUnit', 'invalid', master);
    expect(master['Gin'].buyUnit).toBe('liter'); // unchanged
  });

  test('rejects NaN for numeric fields', () => {
    const master = JSON.parse(JSON.stringify(sampleMaster));
    AppState.updateMasterData('Gin', 'price', 'abc', master);
    expect(master['Gin'].price).toBe(5000); // unchanged
  });
});

// ── Pure functions ───────────────────────────────────────
describe('calcTotalCost', () => {
  test('calculates Gin Tonic cost correctly', () => {
    // Gin: 5000 / (0.7 * 100) = 71.43 per cl × 4 = 285.71
    // Tonic: 800 / (1.0 * 100) = 8 per cl × 10 = 80
    // Total: 365.71 → rounded = 366
    const cost = calcTotalCost(ginTonic, sampleMaster);
    expect(cost).toBe(366);
  });

  test('returns 0 for unknown ingredients', () => {
    const cocktail = {
      name: 'Unknown',
      price: 1000,
      ingredients: [{ name: 'DoesNotExist', volume: 5 }],
    };
    expect(calcTotalCost(cocktail, sampleMaster)).toBe(0);
  });

  test('handles empty ingredients', () => {
    const cocktail = { name: 'Empty', price: 0, ingredients: [] };
    expect(calcTotalCost(cocktail, sampleMaster)).toBe(0);
  });

  test('handles gram-based ingredients', () => {
    // Menthe: 150 / (50 * 1) = 3 per g × 2g = 6
    const mojito = {
      name: 'Test',
      price: 1000,
      ingredients: [{ name: 'Menthe', volume: 2 }],
    };
    expect(calcTotalCost(mojito, sampleMaster)).toBe(6);
  });
});

describe('calcMargin', () => {
  test('calculates margin percentage', () => {
    expect(calcMargin(2500, 366)).toBe(85);
  });

  test('returns 0 when price is 0', () => {
    expect(calcMargin(0, 100)).toBe(0);
  });

  test('returns 100 when cost is 0', () => {
    expect(calcMargin(1000, 0)).toBe(100);
  });
});

describe('generateCode', () => {
  test('generates code in YYMMDD-XXXX format', () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}-[A-Z0-9]{4}$/);
  });

  test('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(15); // high probability of uniqueness
  });
});

// state.js — Centralized state management
// Replaces 6+ scattered update functions with a unified state handler
// Also contains calcTotalCost (pure function) and generateCode

// In browser: CONFIG is already declared globally by config.js
// In Node: use require to load it
let _stateConfig, _stateGetConversionFactor;

if (typeof require !== 'undefined') {
  // Node.js environment
  const _configModule = require('./config');
  _stateConfig = _configModule.CONFIG;
  _stateGetConversionFactor = _configModule.getConversionFactor;
} else {
  // Browser environment - CONFIG already exists globally
  _stateConfig = typeof CONFIG !== 'undefined' ? CONFIG : {};
  _stateGetConversionFactor = typeof getConversionFactor !== 'undefined' ? getConversionFactor : () => 1;
}

// ── Application State ────────────────────────────────────
const AppState = {
  selected: [],          // User's chosen cocktails
  showAllCocktails: false,
  _listeners: [],        // render callbacks

  // Subscribe a re-render function
  onChange(fn) {
    this._listeners.push(fn);
  },

  // Notify all listeners (triggers re-render)
  _notify() {
    this._listeners.forEach(fn => fn());
  },

  // ── Cocktail CRUD ──────────────────────────────────────

  addCocktail(cocktailBlueprint) {
    if (this.isSelected(cocktailBlueprint.name)) return;
    this.selected.push(JSON.parse(JSON.stringify(cocktailBlueprint)));
    this._notify();
  },

  addCustomCocktail() {
    this.selected.push({
      name: _stateConfig.DEFAULT_NEW_COCKTAIL_NAME,
      price: 0,
      popularity: 3,
      ingredients: [
        { name: "", volume: 0 },
        { name: "", volume: 0 },
        { name: "", volume: 0 },
      ],
    });
    this._notify();
  },

  removeCocktail(index) {
    this.selected.splice(index, 1);
    this._notify();
  },

  isSelected(name) {
    return this.selected.some(c => c.name === name);
  },

  // ── Generic property updates ───────────────────────────
  // Replaces updateCocktailPrice, updateCocktailPopularity, updateCocktailName

  updateCocktail(index, property, value) {
    if (!this.selected[index]) return;

    if (property === 'popularity') {
      value = Math.min(_stateConfig.POPULARITY_MAX, Math.max(_stateConfig.POPULARITY_MIN, value));
    }
    if (property === 'name') {
      value = (value || '').trim() || _stateConfig.DEFAULT_COCKTAIL_NAME;
    }

    this.selected[index][property] = value;
    this._notify();
  },

  // ── Ingredient updates ─────────────────────────────────
  // Replaces updateIngredient + addNewIngredient + removeIngredient

  updateIngredient(cocktailIndex, ingredientIndex, property, value) {
    const ing = this.selected[cocktailIndex]?.ingredients?.[ingredientIndex];
    if (!ing) return;
    ing[property] = value;
    this._notify();
  },

  addIngredient(cocktailIndex, masterIngredients) {
    if (!this.selected[cocktailIndex]) return;

    const baseName = _stateConfig.DEFAULT_NEW_INGREDIENT_NAME;
    let name = baseName;
    let suffix = 2;
    while (masterIngredients[name]) {
      name = `${baseName} ${suffix}`;
      suffix += 1;
    }
    masterIngredients[name] = { ..._stateConfig.DEFAULT_INGREDIENT };

    this.selected[cocktailIndex].ingredients.push({ name, volume: 1 });
    this._notify();
  },

  removeIngredient(cocktailIndex, ingredientIndex) {
    const ings = this.selected[cocktailIndex]?.ingredients;
    if (!ings || !ings[ingredientIndex]) return;
    ings.splice(ingredientIndex, 1);
    this._notify();
  },

  // ── Ingredient unit change (with conversion) ───────────
  updateIngredientUnit(cocktailIndex, ingredientIndex, newUnit, masterIngredients) {
    const ingObj = this.selected[cocktailIndex]?.ingredients?.[ingredientIndex];
    if (!ingObj) return;

    const name = ingObj.name;
    const oldUnit = masterIngredients[name]?.unitServed || 'cl';

    // Volume conversion between cl ⇄ liter
    if (oldUnit === 'cl' && newUnit === 'liter') ingObj.volume /= 100;
    else if (oldUnit === 'liter' && newUnit === 'cl') ingObj.volume *= 100;

    // Ensure master entry exists
    if (!masterIngredients[name]) {
      masterIngredients[name] = { ..._stateConfig.DEFAULT_INGREDIENT, unitServed: newUnit };
    } else {
      masterIngredients[name].unitServed = newUnit;
    }

    // Force buyUnit to match
    if (newUnit === 'cl')    masterIngredients[name].buyUnit = 'liter';
    else if (newUnit === 'g')    masterIngredients[name].buyUnit = 'g';
    else if (newUnit === 'piece') masterIngredients[name].buyUnit = 'piece';

    this._notify();
  },

  // ── Master ingredient data updates ─────────────────────
  // Replaces updateIngredientMasterData + updateIngredientPrice + updateMasterIngredient

  updateMasterData(name, field, value, masterIngredients) {
    // Seed if new
    if (!masterIngredients[name]) {
      masterIngredients[name] = { ..._stateConfig.DEFAULT_INGREDIENT };
    }

    // Validate/convert
    if (field === 'price' || field === 'buyVolume') {
      value = parseFloat(value);
      if (isNaN(value)) return;
    }
    if (field === 'buyUnit' && !_stateConfig.BUY_UNITS.includes(value)) return;
    if (field === 'unitServed' && !_stateConfig.SERVED_UNITS.includes(value)) return;

    masterIngredients[name][field] = value;

    // If overriding unitServed, force buyUnit to match
    if (field === 'unitServed') {
      if (value === 'cl')       masterIngredients[name].buyUnit = 'liter';
      else if (value === 'g')   masterIngredients[name].buyUnit = 'g';
      else if (value === 'piece') masterIngredients[name].buyUnit = 'piece';
    }

    this._notify();
  },

  // ── Reset (for testing) ────────────────────────────────
  reset() {
    this.selected = [];
    this.showAllCocktails = false;
    this._listeners = [];
  },
};

// ── Pure calculation functions ────────────────────────────

function calcTotalCost(cocktail, masterIngredients) {
  const total = cocktail.ingredients.reduce((sum, ing) => {
    const ref = masterIngredients[ing.name];
    if (!ref) return sum;

    const factor = _stateGetConversionFactor(ref.buyUnit, ref.unitServed);
    const costPerServed = ref.price / (ref.buyVolume * factor);
    return sum + costPerServed * ing.volume;
  }, 0);

  return Math.round(total);
}

function calcMargin(price, cost) {
  if (!price) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function generateCode() {
  const d = new Date();
  const stamp = d.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${stamp}-${random}`;
}

// ── Export ────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.AppState = AppState;
  window.calcTotalCost = calcTotalCost;
  window.calcMargin = calcMargin;
  window.generateCode = generateCode;
}

if (typeof module !== 'undefined') {
  module.exports = { AppState, calcTotalCost, calcMargin, generateCode };
}

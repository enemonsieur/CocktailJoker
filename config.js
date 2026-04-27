// config.js - Centralized constants, thresholds, and UI strings
// Extracted from logic.js to eliminate magic numbers and duplicated values

const CONFIG = {
  // Thresholds
  POPULARITY_HIGH: 4,
  POPULARITY_MIN: 1,
  POPULARITY_MAX: 5,

  MARGIN_HIGH: 90,
  MARGIN_GOOD: 75,
  MARGIN_TARGET_LOW: 75,
  MARGIN_TARGET_HIGH: 85,
  MARGIN_VERY_HIGH: 90,
  DEMAND_SHIFT_FACTOR_BASE: 2.3,
  DEMAND_SHIFT_FACTOR_RECOVERY: 2.8,

  OVERALL_MARGIN_HIGH: 88,
  OVERALL_MARGIN_GOOD: 75,

  REVENUE_SHARE_HIGHLIGHT: 40,

  // Sales multipliers
  WEEKEND_DAYS: 2,
  WEEKDAY_DAYS: 5,
  WEEKS_PER_MONTH: 4,

  // API
  ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbxysnEAej5cKRdP8Xq93gbw81Ddrg4boJVBbhx2YR9fijlwa6IckMnmPfd6AwtPMZGyrw/exec",
  WHATSAPP_NUMBER: "237694218017",

  // Valid units
  SERVED_UNITS: ['cl', 'g', 'piece'],
  BUY_UNITS: ['liter', 'g', 'piece'],

  // Unit conversion factors
  UNIT_FACTORS: {
    liter_cl: 100,
    kg_g: 1000,
  },

  // Default values for new ingredients
  DEFAULT_INGREDIENT: {
    unitServed: 'cl',
    buyVolume: 1,
    buyUnit: 'liter',
    price: 0,
  },

  DEFAULT_NEW_INGREDIENT_NAME: "Nouvel ingrédient",
  DEFAULT_COCKTAIL_NAME: "Sans nom",
  DEFAULT_NEW_COCKTAIL_NAME: "Nouveau cocktail",

  // Message display duration (ms)
  MESSAGE_TIMEOUT: 5000,
  WHATSAPP_REDIRECT_DELAY: 900,

  // Pricing optimizer guardrails
  PRICE_ROUNDING_STEP: 50,
  PRICE_MIN_PROFIT_BUFFER: 150,
  PRICE_FLOOR_RETENTION_RATIO: 0.9,
  PRICE_ANCHOR_MULTIPLIER: 2.2,
  PRICE_MAX_UPWARD_MOVE: 0.3,
  PRICE_MAX_DOWNWARD_MOVE: 0.06,
  PRICE_GAIN_CURVE_UPPER_TEST: 0.03,
  PRICE_TARGET_MARGIN_PUSH: 0.45,
  PRICE_CLEAR_MISPRICED_MARGIN: 60,
  PRICE_AGGRESSIVE_UPWARD_MOVE: 0.3,
  PRICE_MODERATE_UPWARD_MOVE: 0.2,

  // --- Elasticity model (Cameroon market-calibrated) ---
  // Price drops unlock pent-up demand more than increases suppress it.
  // 'increase' = elasticity magnitude when price goes UP (demand goes DOWN).
  // 'decrease' = elasticity magnitude when price goes DOWN (demand goes UP).
  ELASTICITY_BY_POPULARITY: {
    1: { increase: 0.0, decrease: 2.8 },  // Pop-1: don't raise, big unlock on drops
    2: { increase: 0.5, decrease: 2.2 },  // Pop-2: low stickiness, strong unlock
    3: { increase: 0.8, decrease: 1.7 },  // Pop-3: moderate both ways
    4: { increase: 1.0, decrease: 1.4 },  // Pop-4: resilient to small increases
    5: { increase: 1.2, decrease: 1.1 },  // Pop-5: most resilient, loyal demand base
  },
  DEMAND_RESPONSE_MAX_DECREASE: 1.20,  // max +120% orders when price drops
  DEMAND_RESPONSE_MAX_INCREASE: 0.65,  // max -65% orders when price rises

  // --- Critical underpricing (pop >= 4 AND margin below this threshold) ---
  // These items need a genuine correction, not a nudge.
  PRICE_CRITICAL_UNDERPRICED_MARGIN: 40,
  PRICE_CRITICAL_UNDERPRICED_PUSH: 0.72,  // push 72% toward target (vs 45% default)

  // --- Critical overpricing (pop <= 2 AND margin above this threshold) ---
  // These items are priced out of the market. Allow real downward moves.
  PRICE_CRITICAL_OVERPRICED_MARGIN: 88,
  PRICE_CRITICAL_DOWNWARD_RATE: 0.30,             // allow up to -30% rate
  PRICE_CRITICAL_FLOOR_RETENTION_RATIO: 0.60,     // floor = 60% of current (vs 90% default)

  PSYCHOLOGICAL_PRICE_POINTS: [
    2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000,
    6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000,
    11000, 12000, 13000, 14000, 15000, 17500, 20000
  ],
  POPULARITY_UPWARD_CAPS: {
    1: 0,
    2: 0.05,
    3: 0.08,
    4: 0.12,
    5: 0.15,
  },
  POPULARITY_DOWNWARD_CAPS: {
    1: 0.06,
    2: 0.05,
    3: 0.03,
    4: 0.04,
    5: 0.03,
  },
};

const COLORS = {
  getMarginColor(percent) {
    if (percent > CONFIG.MARGIN_HIGH) return 'text-orange-500';
    if (percent >= CONFIG.MARGIN_GOOD) return 'text-green-600';
    return 'text-red-600';
  },

  getButtonState(isActive) {
    return isActive
      ? 'bg-blue-500 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  },

  getProfitColor(overallMargin) {
    if (overallMargin > CONFIG.MARGIN_HIGH) return 'text-orange-500';
    if (overallMargin < CONFIG.MARGIN_GOOD) return 'text-red-600';
    return 'text-green-600';
  },
};

function getPopularityTooltip(pop, margin) {
  if (pop >= CONFIG.POPULARITY_HIGH && margin > CONFIG.MARGIN_HIGH) {
    return "Cocktail très populaire mais marge trop élevée : risque de perdre des clients sensibles au prix.";
  } else if (pop >= CONFIG.POPULARITY_HIGH && margin < CONFIG.MARGIN_GOOD) {
    return "Cocktail populaire avec une marge encore fragile.";
  } else if (pop <= 2 && margin > CONFIG.MARGIN_HIGH) {
    return "Cocktail peu vendu mais très rentable. À surveiller avant toute hausse.";
  } else if (pop <= 2 && margin < CONFIG.MARGIN_GOOD) {
    return "Cocktail peu vendu et à faible marge : revue conseillée.";
  }
  return "Popularité moyenne : à surveiller selon les ventes réelles.";
}

function getConversionFactor(buyUnit, unitServed) {
  const key = `${buyUnit}_${unitServed}`;
  return CONFIG.UNIT_FACTORS[key] || 1;
}

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.COLORS = COLORS;
  window.getPopularityTooltip = getPopularityTooltip;
  window.getConversionFactor = getConversionFactor;
}

if (typeof module !== 'undefined') {
  module.exports = { CONFIG, COLORS, getPopularityTooltip, getConversionFactor };
}

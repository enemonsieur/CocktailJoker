// config.test.js — Step 1 tests: verify config constants & utility functions
const { CONFIG, COLORS, getPopularityTooltip, getConversionFactor } = require('./config');

describe('CONFIG constants', () => {
  test('thresholds are defined and correct types', () => {
    expect(CONFIG.POPULARITY_HIGH).toBe(4);
    expect(CONFIG.MARGIN_HIGH).toBe(90);
    expect(CONFIG.MARGIN_GOOD).toBe(75);
    expect(typeof CONFIG.ENDPOINT_URL).toBe('string');
    expect(CONFIG.ENDPOINT_URL).toContain('script.google.com');
  });

  test('valid units are arrays', () => {
    expect(CONFIG.SERVED_UNITS).toEqual(['cl', 'g', 'piece']);
    expect(CONFIG.BUY_UNITS).toEqual(['liter', 'g', 'piece']);
  });

  test('default ingredient has required fields', () => {
    const def = CONFIG.DEFAULT_INGREDIENT;
    expect(def).toHaveProperty('unitServed', 'cl');
    expect(def).toHaveProperty('buyVolume', 1);
    expect(def).toHaveProperty('buyUnit', 'liter');
    expect(def).toHaveProperty('price', 0);
  });

  test('sales multipliers match original logic', () => {
    // Original: weeklyTotal = weekend * 2 + weekday * 5
    expect(CONFIG.WEEKEND_DAYS).toBe(2);
    expect(CONFIG.WEEKDAY_DAYS).toBe(5);
    expect(CONFIG.WEEKS_PER_MONTH).toBe(4);
  });
});

describe('COLORS.getMarginColor', () => {
  test('returns orange for margins > 90%', () => {
    expect(COLORS.getMarginColor(95)).toBe('text-orange-500');
    expect(COLORS.getMarginColor(91)).toBe('text-orange-500');
  });

  test('returns green for margins between 75-90%', () => {
    expect(COLORS.getMarginColor(90)).toBe('text-green-600');
    expect(COLORS.getMarginColor(80)).toBe('text-green-600');
    expect(COLORS.getMarginColor(75)).toBe('text-green-600');
  });

  test('returns red for margins below 75%', () => {
    expect(COLORS.getMarginColor(74)).toBe('text-red-600');
    expect(COLORS.getMarginColor(50)).toBe('text-red-600');
    expect(COLORS.getMarginColor(0)).toBe('text-red-600');
  });
});

describe('COLORS.getButtonState', () => {
  test('returns active classes when true', () => {
    expect(COLORS.getButtonState(true)).toContain('bg-blue-500');
    expect(COLORS.getButtonState(true)).toContain('text-white');
  });

  test('returns inactive classes when false', () => {
    expect(COLORS.getButtonState(false)).toContain('bg-gray-200');
    expect(COLORS.getButtonState(false)).toContain('hover:bg-gray-300');
  });
});

describe('getPopularityTooltip', () => {
  test('high popularity + high margin → warning', () => {
    const tip = getPopularityTooltip(5, 95);
    expect(tip).toContain('⚠');
  });

  test('high popularity + low margin → good', () => {
    const tip = getPopularityTooltip(5, 70);
    expect(tip).toContain('✅');
  });

  test('low popularity + high margin → okay to keep', () => {
    const tip = getPopularityTooltip(1, 95);
    expect(tip).toContain('🤷');
  });

  test('low popularity + low margin → remove suggestion', () => {
    const tip = getPopularityTooltip(1, 50);
    expect(tip).toContain('❌');
  });

  test('medium popularity → generic message', () => {
    const tip = getPopularityTooltip(3, 80);
    expect(tip).toContain('surveiller');
  });
});

describe('getConversionFactor', () => {
  test('liter → cl = 100', () => {
    expect(getConversionFactor('liter', 'cl')).toBe(100);
  });

  test('kg → g = 1000', () => {
    expect(getConversionFactor('kg', 'g')).toBe(1000);
  });

  test('same unit → factor 1 (fallback)', () => {
    expect(getConversionFactor('piece', 'piece')).toBe(1);
    expect(getConversionFactor('g', 'g')).toBe(1);
  });
});

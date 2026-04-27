// volume-benchmark-config.js
// Shared venue benchmarks and helper functions for the V2 simulation lane.

(() => {

const _isNode = typeof module !== 'undefined' && typeof require === 'function';
const _configMod = _isNode ? require('./config') : window;
const _config = _configMod.CONFIG;

const VENUE_PROFILES = {
  high_end_bar: {
    label: 'High-end cocktail bar / lounge',
    monthlyCocktails: { good: 1200, bad: 700, veryBad: 700 },
    attachRate: { min: 0.26, bad: 0.34, good: 0.52, max: 0.68 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.1, good: 1.5, max: 2.1 },
  },
  high_end_hotel: {
    label: 'High-end hotel bar',
    monthlyCocktails: { good: 600, bad: 300, veryBad: 300 },
    attachRate: { min: 0.18, bad: 0.24, good: 0.42, max: 0.58 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.0, good: 1.35, max: 1.8 },
  },
  high_end_restaurant: {
    label: 'High-end restaurant with serious bar',
    monthlyCocktails: { good: 400, bad: 250, veryBad: 250 },
    attachRate: { min: 0.12, bad: 0.18, good: 0.34, max: 0.5 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.0, good: 1.25, max: 1.7 },
  },
  middle_end_bar: {
    label: 'Middle-end CHR bar / lounge',
    monthlyCocktails: { good: 800, bad: 500, veryBad: 500 },
    attachRate: { min: 0.22, bad: 0.3, good: 0.48, max: 0.64 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.05, good: 1.4, max: 1.9 },
  },
  middle_end_hotel: {
    label: 'Middle-end CHR hotel bar',
    monthlyCocktails: { good: 400, bad: 250, veryBad: 250 },
    attachRate: { min: 0.14, bad: 0.2, good: 0.36, max: 0.52 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.0, good: 1.2, max: 1.55 },
  },
  middle_end_restaurant: {
    label: 'Middle-end CHR restaurant',
    monthlyCocktails: { good: 250, bad: 150, veryBad: 150 },
    attachRate: { min: 0.1, bad: 0.14, good: 0.28, max: 0.44 },
    avgCocktailsPerBuyer: { min: 1.0, bad: 1.0, good: 1.15, max: 1.4 },
  },
};

const DEFAULT_MARKET_MATURITY_FACTOR = 0.85;

const NAME_ALIASES = {
  'virgin mojito': 'virgin mojito',
  'mojito sans alcool': 'virgin mojito',
  'pina colada': 'pina colada',
  'virgin pina colada': 'virgin colada',
  'virgin colada': 'virgin colada',
  'long island': 'long island iced tea',
  'long island tea': 'long island iced tea',
  'long island iced tea': 'long island iced tea',
  'americano': 'americano',
  'americano cocktail': 'americano',
  'margarita': 'margarita',
  'mai tai': 'mai tai',
  'kir royal': 'kir royal',
  'sangria': 'sangria',
  'daiquiri': 'daiquiri',
};

function normalizeCocktailName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCocktailAlias(name) {
  const normalized = normalizeCocktailName(name);
  return NAME_ALIASES[normalized] || normalized;
}

function normalizeVenueType(venueType, averageCocktailPrice = 0) {
  const tier = averageCocktailPrice >= 5500 ? 'high_end' : 'middle_end';
  if (venueType === 'bar') return `${tier}_bar`;
  if (venueType === 'hotel_bar') return `${tier}_hotel`;
  if (venueType === 'restaurant') return `${tier}_restaurant`;
  return venueType || 'middle_end_bar';
}

function getVenueBenchmarkProfile(venueType) {
  return VENUE_PROFILES[normalizeVenueType(venueType)] || VENUE_PROFILES.middle_end_bar;
}

function getVenueHealthBand(context = {}, profile = getVenueBenchmarkProfile(context.venueType)) {
  const monthlyCocktails = +context.monthlyCocktails || 0;
  const maturity = context.marketMaturityFactor ?? DEFAULT_MARKET_MATURITY_FACTOR;
  const adjustedVolume = monthlyCocktails / Math.max(maturity, 0.1);
  const good = profile.monthlyCocktails.good;
  const bad = profile.monthlyCocktails.bad;

  if (adjustedVolume >= good) return 'good';
  if (adjustedVolume >= bad) return 'bad';
  return 'very_bad';
}

function getBottleneckType(context = {}, profile = getVenueBenchmarkProfile(context.venueType)) {
  const covers = +context.monthlyCovers || 0;
  const attachRate = +context.cocktailAttachRate || 0;
  const avgCocktailsPerBuyer = +context.avgCocktailsPerBuyer || 0;

  const coverBand = covers >= (profile.monthlyCocktails.good * 1.2)
    ? 'good'
    : covers >= profile.monthlyCocktails.bad
      ? 'bad'
      : 'very_bad';
  const attachBand = attachRate >= profile.attachRate.good
    ? 'good'
    : attachRate >= profile.attachRate.bad
      ? 'bad'
      : 'very_bad';
  const repeatBand = avgCocktailsPerBuyer >= profile.avgCocktailsPerBuyer.good
    ? 'good'
    : avgCocktailsPerBuyer >= profile.avgCocktailsPerBuyer.bad
      ? 'bad'
      : 'very_bad';

  // Attach is very weak regardless of covers → conversion is the primary bottleneck.
  // Do NOT let low covers excuse poor cocktail conversion — that mistake leads to
  // "bring more traffic" advice when the real fix is to make cocktails worth ordering.
  if (attachBand === 'very_bad') return 'attach_rate';
  if (repeatBand === 'very_bad') return 'repeat_rate';
  // Only blame covers when attach and repeat are genuinely acceptable
  if (coverBand === 'very_bad' && attachBand !== 'very_bad') return 'covers';
  if (coverBand === 'bad' && attachBand === 'good' && repeatBand === 'good') return 'covers';
  return 'balanced';
}

// Richer bottleneck context — exposes primary + secondary bottleneck so that
// the optimizer can reason about combined weak-conversion / weak-traffic cases
// without collapsing them to a single label.
function getBottleneckContext(context = {}, profile = getVenueBenchmarkProfile(context.venueType)) {
  const covers = +context.monthlyCovers || 0;
  const attachRate = +context.cocktailAttachRate || 0;
  const avgCocktailsPerBuyer = +context.avgCocktailsPerBuyer || 0;

  const coverBand = covers >= (profile.monthlyCocktails.good * 1.2)
    ? 'good'
    : covers >= profile.monthlyCocktails.bad
      ? 'bad'
      : 'very_bad';
  const attachBand = attachRate >= profile.attachRate.good
    ? 'good'
    : attachRate >= profile.attachRate.bad
      ? 'bad'
      : 'very_bad';
  const repeatBand = avgCocktailsPerBuyer >= profile.avgCocktailsPerBuyer.good
    ? 'good'
    : avgCocktailsPerBuyer >= profile.avgCocktailsPerBuyer.bad
      ? 'bad'
      : 'very_bad';

  const primary = getBottleneckType(context, profile);
  let secondary = null;

  if (primary === 'attach_rate' && coverBand === 'very_bad') secondary = 'covers';
  if (primary === 'attach_rate' && repeatBand === 'very_bad') secondary = 'repeat_rate';
  if (primary === 'covers' && attachBand === 'bad') secondary = 'attach_rate';
  if (primary === 'repeat_rate' && coverBand === 'bad') secondary = 'covers';

  return { primary, secondary, coverBand, attachBand, repeatBand };
}

function getAbsoluteDemandBand(monthlySales, monthlyCocktails, popularityBand = 'medium') {
  const total = Math.max(+monthlyCocktails || 0, 1);
  const sales = Math.max(+monthlySales || 0, 0);
  const share = sales / total;

  if (share >= 0.18 || (popularityBand === 'high' && share >= 0.12)) return 'strong';
  if (share >= 0.07) return 'soft';
  return 'weak';
}

function getRelativePopularityBand(popularity) {
  if (popularity >= 4) return 'high';
  if (popularity === 3) return 'medium';
  return 'low';
}

function getMarketPricePosition(currentPrice, benchmarkSummary) {
  if (!benchmarkSummary || !benchmarkSummary.median) return 'unknown';
  const price = +currentPrice || 0;
  const median = benchmarkSummary.median;
  const low = benchmarkSummary.low;
  const high = benchmarkSummary.high;

  if (price < low) return 'below_market';
  if (price > high) return 'above_market';
  if (price < median * 0.93) return 'below_market';
  if (price > median * 1.07) return 'above_market';
  return 'within_market';
}

function summarizeBenchmarkRows(rows = []) {
  const byName = new Map();
  for (const row of rows) {
    const key = resolveCocktailAlias(row.cocktailNameNorm || row.cocktailNameRaw || row.name || '');
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(row);
  }

  const summary = {};
  for (const [name, items] of byName.entries()) {
    const prices = items.map(item => +item.price).filter(price => Number.isFinite(price)).sort((a, b) => a - b);
    if (!prices.length) continue;
    const middle = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0 ? (prices[middle - 1] + prices[middle]) / 2 : prices[middle];
    summary[name] = {
      rows: items,
      count: prices.length,
      low: prices[0],
      high: prices[prices.length - 1],
      median,
      confidence: prices.length >= 4 ? 'high' : prices.length >= 2 ? 'medium' : 'low',
      venueTypes: [...new Set(items.map(item => item.venueType).filter(Boolean))],
    };
  }

  return summary;
}

function estimateVenueActivityScore(context = {}, profile = getVenueBenchmarkProfile(context.venueType)) {
  const covers = +context.monthlyCovers || 0;
  const attachRate = +context.cocktailAttachRate || 0;
  const avgCocktailsPerBuyer = +context.avgCocktailsPerBuyer || 0;
  const monthlyCocktails = +context.monthlyCocktails || covers * attachRate * avgCocktailsPerBuyer;
  const maturity = context.marketMaturityFactor ?? DEFAULT_MARKET_MATURITY_FACTOR;
  const venueType = normalizeVenueType(context.venueType, context.averageCocktailPrice);

  const volumeScore = Math.min(1, monthlyCocktails / Math.max(profile.monthlyCocktails.good, 1));
  const attachScore = Math.min(1, attachRate / Math.max(profile.attachRate.good, 0.01));
  const repeatScore = Math.min(1, avgCocktailsPerBuyer / Math.max(profile.avgCocktailsPerBuyer.good, 0.01));

  // For bar-type venues, cocktail conversion (attach) is the primary health signal.
  // Raw volume is heavily influenced by total covers and can mask a conversion problem.
  // Giving attach equal weight to volume stops the system from blaming volume alone.
  const isBarType = venueType === 'high_end_bar' || venueType === 'middle_end_bar';
  const weights = isBarType
    ? { volume: 0.35, attach: 0.40, repeat: 0.25 }
    : { volume: 0.45, attach: 0.30, repeat: 0.25 };

  return Math.round(
    ((volumeScore * weights.volume) + (attachScore * weights.attach) + (repeatScore * weights.repeat))
    * maturity * 100
  );
}

function classifyBenchmarkConfidence(summary, cocktailName) {
  const key = resolveCocktailAlias(cocktailName);
  const entry = summary?.[key];
  if (!entry) return 'unknown';
  if (entry.confidence === 'high') return 'high';
  if (entry.confidence === 'medium') return 'medium';
  return 'low';
}

function getCocktailBenchmarkSummary(summary, cocktailName) {
  const key = resolveCocktailAlias(cocktailName);
  return summary?.[key] || null;
}

function getStepAdjustment(currentPrice, targetPrice) {
  const price = Math.max(+currentPrice || 0, 0);
  const target = Math.max(+targetPrice || 0, 0);
  const gap = target - price;
  const phaseCap = Math.max(price * 0.15, 250);

  if (gap === 0) return price;
  if (Math.abs(gap) <= phaseCap) return target;
  return price + Math.sign(gap) * phaseCap;
}

if (typeof window !== 'undefined') {
  window.DEFAULT_MARKET_MATURITY_FACTOR = DEFAULT_MARKET_MATURITY_FACTOR;
  window.VENUE_PROFILES = VENUE_PROFILES;
  window.normalizeCocktailName = normalizeCocktailName;
  window.resolveCocktailAlias = resolveCocktailAlias;
  window.normalizeVenueType = normalizeVenueType;
  window.getVenueBenchmarkProfile = getVenueBenchmarkProfile;
  window.getVenueHealthBand = getVenueHealthBand;
  window.getBottleneckType = getBottleneckType;
  window.getBottleneckContext = getBottleneckContext;
  window.getAbsoluteDemandBand = getAbsoluteDemandBand;
  window.getRelativePopularityBand = getRelativePopularityBand;
  window.getMarketPricePosition = getMarketPricePosition;
  window.summarizeBenchmarkRows = summarizeBenchmarkRows;
  window.estimateVenueActivityScore = estimateVenueActivityScore;
  window.classifyBenchmarkConfidence = classifyBenchmarkConfidence;
  window.getCocktailBenchmarkSummary = getCocktailBenchmarkSummary;
  window.getStepAdjustment = getStepAdjustment;
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_MARKET_MATURITY_FACTOR,
    VENUE_PROFILES,
    normalizeCocktailName,
    resolveCocktailAlias,
    normalizeVenueType,
    getVenueBenchmarkProfile,
    getVenueHealthBand,
    getBottleneckType,
    getBottleneckContext,
    getAbsoluteDemandBand,
    getRelativePopularityBand,
    getMarketPricePosition,
    summarizeBenchmarkRows,
    estimateVenueActivityScore,
    classifyBenchmarkConfidence,
    getCocktailBenchmarkSummary,
    getStepAdjustment,
  };
}

})();

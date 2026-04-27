// pricing-optimizer-v2.js
// Experimental venue-aware optimizer for volume baseline simulations.

(() => {

const _isNode = typeof module !== 'undefined' && typeof require === 'function';
const _configMod = _isNode ? require('./config') : window;
const _benchMod = _isNode ? require('./volume-benchmark-config') : window;
const _config = _configMod.CONFIG;
const {
  DEFAULT_MARKET_MATURITY_FACTOR,
  getAbsoluteDemandBand,
  getBottleneckType,
  getBottleneckContext,
  getCocktailBenchmarkSummary,
  getMarketPricePosition,
  getRelativePopularityBand,
  getStepAdjustment,
  getVenueBenchmarkProfile,
  getVenueHealthBand,
  normalizeVenueType,
  estimateVenueActivityScore,
  summarizeBenchmarkRows,
} = _benchMod;

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundPrice(value) {
  const step = _config.PRICE_ROUNDING_STEP || 50;
  return Math.max(0, Math.round(value / step) * step);
}

function getContributionValue(price, cost) {
  return Math.round((+price || 0) - (+cost || 0));
}

function getIngredientMarginPercent(price, cost) {
  if (!price) return 0;
  return Math.round((((+price || 0) - (+cost || 0)) / (+price || 1)) * 100);
}

function getPopularityWeightedAverage(cocktails) {
  const valid = cocktails.filter(item => item && item.popularity >= 1);
  const total = valid.reduce((sum, item) => sum + item.popularity, 0) || 1;
  return valid.reduce((sum, item) => sum + item.popularity, 0) / total;
}

function getMean(values) {
  const filtered = values.filter(value => Number.isFinite(value));
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function getMedian(values) {
  const filtered = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  if (!filtered.length) return 0;
  const middle = Math.floor(filtered.length / 2);
  return filtered.length % 2 === 0
    ? (filtered[middle - 1] + filtered[middle]) / 2
    : filtered[middle];
}

function getTargetPriceForMargin(cost, targetMarginRatio) {
  if (targetMarginRatio >= 1) return cost;
  return cost / (1 - targetMarginRatio);
}

function estimateDemandDeltaV2(popularity, priceDeltaPercent, venueHealthBand, marketMaturityFactor, demandRecoveryMode = false) {
  if (!priceDeltaPercent) return 0;

  const pop = Math.round(clampValue(+popularity || 1, 1, 5));
  let table = {
    1: { increase: 0.08, decrease: 1.05 },
    2: { increase: 0.12, decrease: 0.92 },
    3: { increase: 0.18, decrease: 0.78 },
    4: { increase: 0.24, decrease: 0.62 },
    5: { increase: 0.28, decrease: 0.55 },
  };

  // In demand recovery mode (very bad venue with high margin + weak demand),
  // boost elasticity for pop-1 items so that price cuts can actually unlock demand.
  // Pop-1 items are unknown/unpopular but not inherently price-insensitive.
  // A boost from 1.05 → 1.8 reflects that we're testing a real repositioning, not a marginal nudge.
  if (demandRecoveryMode && pop === 1 && priceDeltaPercent < 0) {
    table = { ...table, 1: { ...table[1], decrease: 1.8 } };
  }

  const isDecrease = priceDeltaPercent < 0;
  const elasticity = isDecrease ? table[pop].decrease : table[pop].increase;
  const healthFactor = venueHealthBand === 'very_bad' ? 1.15 : venueHealthBand === 'bad' ? 1.05 : 0.95;
  const maturityFactor = 1 + ((DEFAULT_MARKET_MATURITY_FACTOR - (marketMaturityFactor ?? DEFAULT_MARKET_MATURITY_FACTOR)) * 0.6);
  const demandShiftFactor = demandRecoveryMode
    ? (_config.DEMAND_SHIFT_FACTOR_RECOVERY || 1.7)
    : (_config.DEMAND_SHIFT_FACTOR_BASE || 1.5);
  const raw = Math.abs(priceDeltaPercent) * elasticity * healthFactor * maturityFactor * demandShiftFactor;
  const cap = isDecrease ? 1.10 : 0.55;
  const saturated = cap * Math.tanh(raw / cap);
  const direction = isDecrease ? 1 : -1;
  return clampValue(direction * saturated, -0.55, 1.10);
}

function estimateSalesProjection(cocktail, stepSuggestedPrice, venueHealthBand, marketMaturityFactor, demandRecoveryMode = false) {
  const currentPrice = cocktail.currentPrice || 0;
  const priceDeltaPercent = currentPrice ? (stepSuggestedPrice - currentPrice) / currentPrice : 0;
  const demandDelta = estimateDemandDeltaV2(cocktail.popularity, priceDeltaPercent, venueHealthBand, marketMaturityFactor, demandRecoveryMode);
  const estimatedMonthlySales = Math.max(0, Math.round((cocktail.estimatedMonthlySales || 0) * (1 + demandDelta)));
  const estimatedRevenue = Math.round(stepSuggestedPrice * estimatedMonthlySales);
  const estimatedProfit = Math.round((stepSuggestedPrice - cocktail.cost) * estimatedMonthlySales);
  return {
    estimatedMonthlySales,
    estimatedRevenue,
    estimatedProfit,
    orderDeltaPct: +demandDelta.toFixed(3),
  };
}

function buildPricingOptimizerResultsV2(cocktails, context = {}) {
  const averageCocktailPrice = cocktails.length
    ? cocktails.reduce((sum, item) => sum + (+item.price || 0), 0) / cocktails.length
    : 0;
  const venueType = normalizeVenueType(context.venueType || 'bar', averageCocktailPrice);
  const profile = getVenueBenchmarkProfile(venueType);
  const marketMaturityFactor = context.marketMaturityFactor ?? DEFAULT_MARKET_MATURITY_FACTOR;
  const monthlyCovers = +context.monthlyCovers || 0;
  const cocktailAttachRate = +context.cocktailAttachRate || 0;
  const avgCocktailsPerBuyer = +context.avgCocktailsPerBuyer || 0;
  const monthlyCocktails = +context.monthlyCocktails || Math.round(monthlyCovers * cocktailAttachRate * avgCocktailsPerBuyer);
  const benchmarkSummary = summarizeBenchmarkRows(context.competitorBenchmarks || []);
  const venueHealthBand = context.venueHealthBand || getVenueHealthBand({
    venueType,
    monthlyCocktails,
    marketMaturityFactor,
  }, profile);
  const bottleneck = context.bottleneck || getBottleneckType({
    venueType,
    monthlyCovers,
    cocktailAttachRate,
    avgCocktailsPerBuyer,
  }, profile);
  const venueActivityScore = estimateVenueActivityScore({
    venueType,
    monthlyCovers,
    cocktailAttachRate,
    avgCocktailsPerBuyer,
    monthlyCocktails,
    marketMaturityFactor,
  }, profile);
  const bottleneckContext = getBottleneckContext({
    venueType,
    monthlyCovers,
    cocktailAttachRate,
    avgCocktailsPerBuyer,
  }, profile);
  const secondaryBottleneck = bottleneckContext.secondary;
  const avgPopularity = getMean(cocktails.map(item => +item.popularity || 0)) || 3;
  const medianPopularity = getMedian(cocktails.map(item => +item.popularity || 0)) || 3;
  const medianMonthlySales = getMedian(cocktails.map(item => +item.estimatedMonthlySales || 0)) || 0;
  const maxPopularity = Math.max(...cocktails.map(item => +item.popularity || 0), 0);

  return cocktails.map(cocktail => {
    if (!(cocktail.price > 0) || !(cocktail.cost >= 0) || !(cocktail.popularity >= 1)) {
      return {
        name: cocktail.name,
        status: 'warning',
        warning: 'Donnees insuffisantes pour la simulation V2.',
      };
    }

    const currentPrice = Math.round(cocktail.price);
    const cost = Math.round(cocktail.cost);
    const marginPercent = getIngredientMarginPercent(currentPrice, cost);
    const contributionValue = cocktail.contributionValue ?? getContributionValue(currentPrice, cost);
    const relativePopularityBand = getRelativePopularityBand(cocktail.popularity);
    const absoluteDemandBand = getAbsoluteDemandBand(cocktail.estimatedMonthlySales, monthlyCocktails, relativePopularityBand);
    const marketSummary = getCocktailBenchmarkSummary(benchmarkSummary, cocktail.name);
    const marketPricePosition = getMarketPricePosition(currentPrice, marketSummary);
    const benchmarkConfidence = marketSummary ? marketSummary.confidence : 'unknown';
    const benchmarkMedian = marketSummary?.median || 0;

    // --- Margin target floors ---
    // In Cameroon CHR, most venues have no idea what they should charge. The pattern is:
    // very high ingredient margins + cocktails barely selling = the category is inaccessible.
    // We therefore use tiered recovery floors instead of pushing every weak venue toward 75-80%.
    //
    // good venue:              keep standard 75% floor
    // bad venue + weak attach: allow recovery floor down to 68%
    // very_bad + weak attach + weak demand: allow floor down to 60% (demand recovery mode)
    const weakAttach = bottleneck === 'attach_rate';
    const weakRepeat = bottleneck === 'repeat_rate';
    const weakVenueTraffic = venueHealthBand !== 'good' && bottleneck === 'covers';
    const venueIsBad = venueHealthBand === 'bad' || venueHealthBand === 'very_bad';
    const venueIsVeryBad = venueHealthBand === 'very_bad';

    let targetMarginRatio;
    if (venueHealthBand === 'good') {
      targetMarginRatio = 0.75;
    } else if (venueIsVeryBad && weakAttach && absoluteDemandBand === 'weak') {
      targetMarginRatio = 0.60; // demand recovery — stop insisting on ultra-high margins
    } else if (venueIsBad && weakAttach) {
      targetMarginRatio = 0.68; // recovery mode
    } else if (venueHealthBand === 'bad') {
      targetMarginRatio = 0.75;
    } else {
      targetMarginRatio = 0.78;
    }

    const marginTargetPrice = getTargetPriceForMargin(cost, targetMarginRatio);
    const marketTargetPrice = benchmarkMedian
      ? (marketPricePosition === 'below_market'
        ? benchmarkMedian * 0.98
        : marketPricePosition === 'above_market'
          ? benchmarkMedian * 0.94
          : benchmarkMedian)
      : currentPrice;

    let recommendedAction = 'Maintenir';
    let reasonCode = 'protect_healthy_item';
    let stepSuggestedPrice = currentPrice;
    let targetPrice = currentPrice;
    let correctionPhaseCount = 1;
    let demandRecoveryEligible = false;
    let aggressiveCutEligible = false;

    const strongItem = relativePopularityBand === 'high' && absoluteDemandBand === 'strong';

    // --- Combined signal: high margin + weak demand ---
    // This is the Cameroon baseline problem. The item is high-margin because nobody
    // told the venue what to charge, and nobody is buying because the price is too high
    // (or the item is just unknown). Price must be the first lever, not the last.
    const veryHighMargin = marginPercent >= _config.MARGIN_VERY_HIGH;  // >= 90
    const highMarginWeak = marginPercent >= _config.MARGIN_TARGET_HIGH && absoluteDemandBand === 'weak'; // >= 85 + weak
    const veryHighMarginWeak = veryHighMargin && absoluteDemandBand !== 'strong';

    // Demand recovery mode: venue struggling + attach/repeat bottleneck + item not selling +
    // margin already very high + not already priced below market
    // In Cameroon CHR, weak demand includes 'soft' band (7-18% share) not just strict 'weak' (<7%)
    // because even modest share is problematic in venues with overall 10% attach
    const lowDemandForRecovery = absoluteDemandBand === 'weak' || (absoluteDemandBand === 'soft' && venueIsBad);
    if (
      venueIsBad &&
      (weakAttach || weakRepeat) &&
      lowDemandForRecovery &&
      marginPercent >= _config.MARGIN_TARGET_HIGH &&
      marketPricePosition !== 'below_market'
    ) {
      demandRecoveryEligible = true;
    }

    // Aggressive cut: even stronger signal — very bad venue, very high margin, weak demand
    if (
      venueIsVeryBad &&
      weakAttach &&
      lowDemandForRecovery &&
      veryHighMargin &&
      marketPricePosition !== 'below_market'
    ) {
      aggressiveCutEligible = true;
    }

    // --- Decision tree ---

    if (strongItem && marketPricePosition === 'within_market' && marginPercent >= _config.MARGIN_TARGET_LOW) {
      // Protect healthy items — but only if venue is healthy too. In a bad venue even strong
      // items may be dragging the category down if they're overpriced.
      if (!venueIsBad || marketPricePosition !== 'above_market') {
        recommendedAction = 'Maintenir';
        reasonCode = 'protect_healthy_item';
        targetPrice = currentPrice;
      }
    }

    if (reasonCode === 'protect_healthy_item' && !strongItem) {
      // Not a strong item — evaluate all other cases below
      reasonCode = null;
    }

    if (!reasonCode) {
      if (aggressiveCutEligible) {
        // Very bad venue + very high margin + weak demand + weak attach → aggressive demand recovery
        recommendedAction = 'Baisser par paliers';
        reasonCode = 'demand_recovery_aggressive';
        // Target: whichever is lower — market median or recovery margin floor
        const recoveryTarget = benchmarkMedian
          ? Math.min(marketTargetPrice, marginTargetPrice)
          : marginTargetPrice;
        targetPrice = Math.max(recoveryTarget, cost + _config.PRICE_MIN_PROFIT_BUFFER);
      } else if (demandRecoveryEligible) {
        // Bad venue + high margin + weak demand → demand recovery (moderate)
        recommendedAction = 'Baisser par paliers';
        reasonCode = 'demand_recovery_price_cut';
        const recoveryTarget = benchmarkMedian
          ? Math.min(marketTargetPrice, marginTargetPrice)
          : marginTargetPrice;
        targetPrice = Math.max(recoveryTarget, cost + _config.PRICE_MIN_PROFIT_BUFFER);
      } else if (weakVenueTraffic && strongItem && absoluteDemandBand !== 'weak') {
        // Traffic is the real ceiling — price won't fix a venue with no footfall
        recommendedAction = 'Action hors prix';
        reasonCode = 'venue_traffic_issue';
        targetPrice = currentPrice;
      } else if (weakAttach && absoluteDemandBand === 'weak' && marketPricePosition === 'below_market') {
        // Weak attach + weak demand BUT already priced below market → price isn't the issue
        recommendedAction = 'Action hors prix';
        reasonCode = 'attach_rate_issue';
        targetPrice = currentPrice;
      } else if (weakAttach && absoluteDemandBand !== 'weak') {
        // Weak attach but the item itself isn't weak in absolute terms →
        // conversion problem, not item problem
        recommendedAction = 'Action hors prix';
        reasonCode = 'attach_rate_issue';
        targetPrice = currentPrice;
      } else if (weakRepeat && relativePopularityBand !== 'high' && !highMarginWeak) {
        // Repeat is weak and item has no price-driven reason to cut
        recommendedAction = 'Travailler la recurrence';
        reasonCode = 'repeat_rate_issue';
        targetPrice = currentPrice;
      } else if (veryHighMarginWeak && marketPricePosition !== 'below_market') {
        // Very high margin AND not selling well — cut even outside of full demand recovery mode
        recommendedAction = 'Baisser par paliers';
        reasonCode = 'high_margin_weak_demand';
        targetPrice = Math.max(marginTargetPrice, cost + _config.PRICE_MIN_PROFIT_BUFFER);
        if (benchmarkMedian) {
          targetPrice = Math.min(targetPrice, marketTargetPrice);
        }
      } else if ((marketPricePosition === 'above_market' || marginPercent >= _config.MARGIN_TARGET_HIGH) && absoluteDemandBand !== 'strong') {
        recommendedAction = 'Baisser par paliers';
        reasonCode = marketPricePosition === 'above_market' ? 'above_market_relief' : 'above_margin_relief';
        targetPrice = Math.min(currentPrice, Math.max(marketTargetPrice, cost + _config.PRICE_MIN_PROFIT_BUFFER));
      } else if ((marketPricePosition === 'below_market' || marginPercent < _config.MARGIN_TARGET_LOW) && absoluteDemandBand !== 'weak') {
        recommendedAction = 'Augmenter par paliers';
        reasonCode = marketPricePosition === 'below_market' ? 'below_market_upside' : 'phased_underprice_correction';
        targetPrice = Math.max(marginTargetPrice, marketTargetPrice, currentPrice);
      } else if (marginPercent < _config.MARGIN_TARGET_LOW && relativePopularityBand === 'high') {
        recommendedAction = 'Correction par paliers';
        reasonCode = 'phased_underprice_correction';
        targetPrice = Math.max(marginTargetPrice, currentPrice);
      } else if (absoluteDemandBand === 'weak' && marketPricePosition === 'within_market' && marginPercent < _config.MARGIN_TARGET_HIGH) {
        // Weak demand but margin is already reasonable → non-price issue
        recommendedAction = 'Action hors prix';
        reasonCode = 'needs_non_price_action';
        targetPrice = currentPrice;
      } else {
        // Fallback: maintain
        recommendedAction = 'Maintenir';
        reasonCode = 'protect_healthy_item';
        targetPrice = currentPrice;
      }
    }

    // Final safety: above_market + very high margin — cap the target at market median
    if (marketPricePosition === 'above_market' && marginPercent >= _config.MARGIN_TARGET_HIGH) {
      targetPrice = Math.max(cost + _config.PRICE_MIN_PROFIT_BUFFER, Math.min(targetPrice, marketTargetPrice));
    }

    targetPrice = roundPrice(Math.max(targetPrice, cost + _config.PRICE_MIN_PROFIT_BUFFER));
    const priceGap = targetPrice - currentPrice;
    const direction = Math.sign(priceGap);

    // --- Asymmetric step caps ---
    // Downward moves in demand-recovery mode should be meaningfully larger than generic cuts.
    // A -500 FCFA move on a 10,000 FCFA cocktail is cosmetic and will not unlock demand.
    let phaseCap;
    if (direction < 0) {
      if (aggressiveCutEligible) {
        phaseCap = Math.max(currentPrice * 0.25, 500); // aggressive: up to -25% per phase
      } else if (demandRecoveryEligible || reasonCode === 'high_margin_weak_demand') {
        phaseCap = Math.max(currentPrice * 0.20, 400); // recovery: up to -20% per phase
      } else {
        phaseCap = Math.max(currentPrice * 0.12, 250); // standard downward cap
      }
    } else {
      phaseCap = Math.max(currentPrice * 0.18, 300); // upward stays as-is
    }

    stepSuggestedPrice = roundPrice(getStepAdjustment(currentPrice, targetPrice));
    if (direction === 0) {
      stepSuggestedPrice = currentPrice;
    } else if (Math.abs(priceGap) > phaseCap) {
      stepSuggestedPrice = roundPrice(currentPrice + (phaseCap * direction));
    }
    stepSuggestedPrice = Math.max(stepSuggestedPrice, cost + _config.PRICE_MIN_PROFIT_BUFFER);
    correctionPhaseCount = Math.max(1, Math.ceil(Math.abs(priceGap) / phaseCap));

    const frozenActions = ['Maintenir', 'Action hors prix', 'Travailler la recurrence'];
    if (frozenActions.includes(recommendedAction)) {
      stepSuggestedPrice = currentPrice;
      targetPrice = currentPrice;
      correctionPhaseCount = 1;
    }

    const priceDeltaValue = stepSuggestedPrice - currentPrice;
    const priceDeltaPercent = currentPrice ? +(priceDeltaValue / currentPrice).toFixed(3) : 0;
    // Pass demand recovery mode to boost elasticity for low-popularity items
    const demandRecoveryMode = aggressiveCutEligible || demandRecoveryEligible;
    const salesProjection = estimateSalesProjection({
      ...cocktail,
      currentPrice,
    }, stepSuggestedPrice, venueHealthBand, marketMaturityFactor, demandRecoveryMode);

    const demandSignal = estimateDemandDeltaV2(cocktail.popularity, priceDeltaPercent, venueHealthBand, marketMaturityFactor, demandRecoveryMode);
    const shortReasonMap = {
      protect_healthy_item: 'Item sain à protéger',
      venue_traffic_issue: 'Le problème principal semble être le trafic',
      attach_rate_issue: 'Conversion faible — prix non prioritaire ici',
      repeat_rate_issue: 'Le problème principal semble être la récurrence',
      above_market_relief: 'Prix au-dessus du marché',
      above_margin_relief: 'Marge trop élevée, prix à ajuster',
      below_market_upside: 'Prix en dessous du marché',
      phased_underprice_correction: 'Correction nécessaire mais par paliers',
      needs_non_price_action: 'Marge correcte — levier non-prix à privilégier',
      non_price_action: 'Action hors prix prioritaire',
      demand_recovery_price_cut: 'Baisse nécessaire pour relancer la demande',
      demand_recovery_aggressive: 'Baisse forte recommandée — marge très élevée, demande quasi nulle',
      high_margin_weak_demand: 'Marge excessive : le prix bloque probablement la demande',
    };

    const result = {
      name: cocktail.name,
      currentPrice,
      cost,
      marginPercent,
      contributionValue,
      popularity: cocktail.popularity,
      relativePopularityBand,
      absoluteDemandBand,
      marketPricePosition,
      benchmarkConfidence,
      marketBenchmarkMedian: benchmarkMedian || null,
      marketBenchmarkRange: marketSummary ? { low: marketSummary.low, high: marketSummary.high } : null,
      venueType,
      venueHealthBand,
      venueActivityScore,
      bottleneck,
      secondaryBottleneck,
      monthlyCovers,
      cocktailAttachRate,
      avgCocktailsPerBuyer,
      monthlyCocktails,
      marketMaturityFactor,
      sourceLabels: context.sourceLabels || [],
      recommendedAction,
      reasonCode,
      reasonFr: shortReasonMap[reasonCode] || 'Action calculee',
      demandRecoveryEligible,
      aggressiveCutEligible,
      targetMarginRatio,
      stepSuggestedPrice,
      targetPrice,
      correctionPhaseCount,
      suggestedPrice: stepSuggestedPrice,
      priceDeltaValue,
      priceDeltaPercent,
      estimatedMonthlySales: cocktail.estimatedMonthlySales || 0,
      estimatedRecommendedSales: salesProjection.estimatedMonthlySales,
      estimatedRecommendedRevenue: salesProjection.estimatedRevenue,
      estimatedRecommendedProfit: salesProjection.estimatedProfit,
      estimatedOrderDelta: demandSignal,
      status: 'ok',
    };

    result.estimatedMonthlySales = cocktail.estimatedMonthlySales || 0;
    result.reasonSummary = `${result.reasonFr} (${venueHealthBand}, ${bottleneck})`;
    return result;
  }).sort((a, b) => {
    const priority = item => {
      if (item.status === 'warning') return 99;
      if (item.reasonCode === 'demand_recovery_aggressive') return 0;
      if (item.reasonCode === 'demand_recovery_price_cut') return 1;
      if (item.reasonCode === 'high_margin_weak_demand') return 2;
      if (item.reasonCode === 'above_market_relief') return 3;
      if (item.reasonCode === 'above_margin_relief') return 3;
      if (item.reasonCode === 'venue_traffic_issue') return 4;
      if (item.reasonCode === 'attach_rate_issue') return 5;
      if (item.reasonCode === 'repeat_rate_issue') return 6;
      if (item.reasonCode === 'phased_underprice_correction') return 7;
      if (item.reasonCode === 'below_market_upside') return 8;
      return 9;
    };

    const aPriority = priority(a);
    const bPriority = priority(b);
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.venueActivityScore || 0) - (a.venueActivityScore || 0);
  });
}

if (typeof window !== 'undefined') {
  window.buildPricingOptimizerResultsV2 = buildPricingOptimizerResultsV2;
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildPricingOptimizerResultsV2,
    getContributionValue,
    getIngredientMarginPercent,
  };
}

})();

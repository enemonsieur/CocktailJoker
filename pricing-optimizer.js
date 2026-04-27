// pricing-optimizer.js
// Pure helpers for cautious cocktail price recommendations.

const _pricingIsNode = typeof module !== 'undefined' && typeof require === 'function';
const { CONFIG: _pricingConfig } = _pricingIsNode ? require('./config') : window;

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundPrice(value) {
  const step = _pricingConfig.PRICE_ROUNDING_STEP || 50;
  return Math.max(0, Math.round(value / step) * step);
}

function findNextPricePoint(value, direction = 'up') {
  const points = _pricingConfig.PSYCHOLOGICAL_PRICE_POINTS || [];
  if (!points.length) return roundPrice(value);

  if (direction === 'down') {
    const lower = [...points].filter(point => point <= value);
    return lower.length ? lower[lower.length - 1] : points[0];
  }

  const higher = points.find(point => point >= value);
  return higher || roundPrice(value);
}

function getContributionValue(price, cost) {
  return Math.round((+price || 0) - (+cost || 0));
}

function getIngredientMarginPercent(price, cost) {
  if (!price) return 0;
  return Math.round((((+price || 0) - (+cost || 0)) / (+price || 1)) * 100);
}

function getSensitivityBand(popularity) {
  if (popularity >= 5) return 'Sensibilite tres forte';
  if (popularity >= 4) return 'Sensibilite forte';
  if (popularity >= 3) return 'Sensibilite moyenne';
  if (popularity >= 2) return 'Sensibilite moderee';
  return 'Sensibilite faible';
}

function getPopularityBand(popularity) {
  if (popularity >= 4) return 'high';
  if (popularity === 3) return 'medium';
  return 'low';
}

function getMenuClass(popularity, contributionValue, avgPopularity, avgContributionValue) {
  const isPopular = popularity >= avgPopularity;
  const isStrongMargin = contributionValue >= avgContributionValue;
  if (isPopular && isStrongMargin) return 'Star';
  if (isPopular && !isStrongMargin) return 'Plow Horse';
  if (!isPopular && isStrongMargin) return 'Puzzle';
  return 'Dog';
}

function getRecommendedAction(menuClass, marginPercent, popularity) {
  const band = getPopularityBand(popularity);
  const criticalOverpricedMargin = _pricingConfig.PRICE_CRITICAL_OVERPRICED_MARGIN || 88;

  if (band === 'high' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 'Ne pas toucher';
  if (band === 'high' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter un peu';
  if (band === 'medium' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 'Baisser un peu';
  if (band === 'medium' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter un peu';

  // Two-tier logic for low-demand items:
  // Healthy margin (≥ 85%): test a small price drop first → "Tester baisse moderee" (-12%)
  // Below target margin (< 85%): "Baisser pour relancer" (more aggressive moves allowed)
  if (band === 'low' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 'Tester baisse moderee';  // >= 85%: test first
  if (band === 'low' && marginPercent >= _pricingConfig.MARGIN_TARGET_LOW && marginPercent < _pricingConfig.MARGIN_TARGET_HIGH) return 'Baisser pour relancer';  // 75-85%: already unprofitable
  if (band === 'low' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter ou revoir';  // < 75%: dual problem

  return 'Maintenir';
}

function getDemandDirection(orderDelta) {
  if (orderDelta > 0.08) return 'Commandes estimees en hausse nette';
  if (orderDelta > 0.02) return 'Commandes estimees en hausse';
  if (orderDelta < -0.08) return 'Commandes estimees en baisse nette';
  if (orderDelta < -0.02) return 'Commandes estimees en baisse';
  return 'Commandes estimees plutot stables';
}

function getProfitDirection(deltaPercent) {
  if (deltaPercent > 0) return 'Profit unitaire en hausse';
  if (deltaPercent < 0) return 'Profit unitaire a surveiller';
  return 'Profit unitaire stable';
}

function getReasonText(result) {
  if (result.status === 'warning') return result.warning;

  if (result.recommendedAction === 'Augmenter un peu') {
    return `${result.name} garde une bonne traction mais la marge ingredient reste trop basse. Le moteur propose une hausse limitee, avec un palier de prix plus net, pour mieux proteger la rentabilite sans brusquer la clientele.`;
  }
  if (result.recommendedAction === 'Baisser un peu') {
    return `${result.name} reste correct en marge mais pourrait gagner en commandes avec un prix un peu plus accessible. L'idee est de tester un meilleur equilibre volume-prix.`;
  }
  if (result.recommendedAction === 'Tester baisse moderee') {
    return `${result.name} jouit deja d'une marge ingredient confortable mais peu de clients le commandent. Le moteur recommande de tester une baisse moderee d'abord (${Math.round(Math.abs(result.priceDeltaPercent) * 100)}%) avant une correction plus aggressive. Cette approche mesure preserve votre positionnement tout en testant si le prix etait bien le frein principal.`;
  }
  if (result.recommendedAction === 'Baisser pour relancer') {
    return `${result.name} est peu demande alors que sa marge ingredient est deja confortable. Le moteur prefere tester une baisse plus visible pour relancer les commandes.`;
  }
  if (result.recommendedAction === 'Augmenter ou revoir') {
    return `${result.name} est peu demande et peu rentable. Une hausse peut aider sur la marge unitaire, mais il faut aussi revoir le produit, la recette ou la mise en avant sur la carte.`;
  }
  if (result.recommendedAction === 'Ne pas toucher') {
    return `${result.name} se vend deja bien et reste dans une zone de marge satisfaisante. Le moteur recommande de ne pas y toucher pour ne pas penaliser un best-seller sain.`;
  }
  return `${result.name} est deja dans une zone economique acceptable. Le moteur conseille surtout de conserver ce prix.`;
}

function buildGainCurvePoints(result) {
  const upperTestPrice = roundPrice(result.suggestedPrice * (1 + _pricingConfig.PRICE_GAIN_CURVE_UPPER_TEST));
  const upperTestProfit = Math.round((upperTestPrice - result.cost) * result.estimatedMonthlySales);
  return [
    { label: 'Actuel', price: result.currentPrice, profit: result.currentProfit },
    { label: 'Recommande', price: result.suggestedPrice, profit: result.estimatedRecommendedProfit },
    { label: 'Test haut', price: upperTestPrice, profit: upperTestProfit },
  ];
}

function getPopularityStrength(popularity) {
  return clampValue((+popularity || 0) / 5, 0.2, 1);
}

function getAdjustmentRate(menuClass, marginPercent, popularity) {
  const band = getPopularityBand(popularity);
  const upwardCap = _pricingConfig.POPULARITY_UPWARD_CAPS[popularity] ?? _pricingConfig.PRICE_MAX_UPWARD_MOVE;
  const downwardCap = _pricingConfig.POPULARITY_DOWNWARD_CAPS[popularity] ?? _pricingConfig.PRICE_MAX_DOWNWARD_MOVE;

  // For low-demand items with healthy margins (≥ 85%), suggest a cautious test move first.
  // Per the optimizer's "minimal disruption" principle: already-profitable items may have
  // problems other than price (positioning, description, execution). A -10-15% test lets us
  // isolate whether price is the real barrier before proposing aggressive -30% corrections.
  const moderateOverpricedMargin = _pricingConfig.MARGIN_TARGET_HIGH || 85;
  const moderateDownwardRate = 0.12; // -12% test correction for low-demand, profitable items

  if (band === 'low' && marginPercent >= moderateOverpricedMargin) {
    // Low-demand + healthy margin (≥ 85%): test -12% first, not aggressive -30%
    return -moderateDownwardRate;
  }

  if (band === 'high' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 0;
  if (band === 'high' && marginPercent < _pricingConfig.PRICE_CLEAR_MISPRICED_MARGIN) return Math.min(0.12, upwardCap);
  if (band === 'high' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return Math.min(0.06, upwardCap);
  if (band === 'medium' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return -Math.min(0.08, downwardCap);
  if (band === 'medium' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return Math.min(0.08, upwardCap);
  if (band === 'low' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return -Math.min(0.12, downwardCap);
  if (band === 'low' && marginPercent < _pricingConfig.PRICE_CLEAR_MISPRICED_MARGIN) return Math.min(0.08, upwardCap);
  if (band === 'low' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return Math.min(0.06, upwardCap);
  return 0;
}

function getContinuousDemandResponse(popularity, priceDeltaPercent, marginPercent, targetMarginPercent = _pricingConfig.MARGIN_TARGET_LOW) {
  if (!priceDeltaPercent) return 0;

  // Elasticity-based model calibrated for Cameroon bar market.
  // Key insight: price drops unlock pent-up demand aggressively in low-penetration markets.
  // Price increases on popular items are tolerated more than decreases hurt low-popularity items.
  const pop = Math.round(clampValue(+popularity || 1, 1, 5));
  const elasticityMap = _pricingConfig.ELASTICITY_BY_POPULARITY || {};
  const bandEntry = elasticityMap[pop] || { increase: 0.8, decrease: 1.5 };

  const isDecrease = priceDeltaPercent < 0;
  const elasticity = isDecrease ? bandEntry.decrease : bandEntry.increase;
  const absDelta = Math.abs(priceDeltaPercent);

  // Linear elasticity with tanh saturation to prevent absurd large-move results.
  // tanh(x) → 1 as x → ∞, giving smooth saturation.
  const maxResponse = isDecrease
    ? (_pricingConfig.DEMAND_RESPONSE_MAX_DECREASE || 1.20)
    : (_pricingConfig.DEMAND_RESPONSE_MAX_INCREASE || 0.65);

  const rawResponse = elasticity * absDelta;
  const saturated = maxResponse * Math.tanh(rawResponse / maxResponse);
  const direction = isDecrease ? 1 : -1;

  return clampValue(direction * saturated, -maxResponse, maxResponse);
}

function getScenarioMultiplier(popularity, scenario, marginPercent, targetMarginPercent, priceDeltaPercent) {
  const band = getPopularityBand(popularity);
  const table = {
    conservative: { high: 0.62, medium: 0.5, low: 0.42 },
    base: { high: 1, medium: 1, low: 1 },
    aggressive: { high: 1.34, medium: 1.5, low: 1.72 },
  };
  const bandMultiplier = (table[scenario] && table[scenario][band]) || 1;
  const weakMarginBoost = priceDeltaPercent > 0 && marginPercent < targetMarginPercent && popularity >= 4
    ? 1.15
    : 1;
  return bandMultiplier * weakMarginBoost;
}

function getEstimatedOrderDelta(action, popularity, priceDeltaPercent, marginPercent, targetMarginPercent = _pricingConfig.MARGIN_TARGET_LOW) {
  if (action === 'Maintenir' || action === 'Ne pas toucher' || !priceDeltaPercent) return 0;

  const demandResponse = getContinuousDemandResponse(popularity, priceDeltaPercent, marginPercent, targetMarginPercent);
  const actionBias = action === 'Baisser pour relancer'
    ? 1.2
    : action === 'Baisser un peu'
      ? 0.92
      : action === 'Augmenter un peu'
        ? 0.82
        : action === 'Augmenter ou revoir'
          ? 0.58
          : 0.65;
  const maxDown = _pricingConfig.DEMAND_RESPONSE_MAX_INCREASE || 0.65;
  const maxUp = (_pricingConfig.DEMAND_RESPONSE_MAX_DECREASE || 1.20) * 1.25;
  return clampValue(demandResponse * actionBias, -maxDown, maxUp);
}

function getEstimatedOrderDeltaRange(action, popularity, priceDeltaPercent, marginPercent, targetMarginPercent = _pricingConfig.MARGIN_TARGET_LOW) {
  const base = getEstimatedOrderDelta(action, popularity, priceDeltaPercent, marginPercent, targetMarginPercent);
  return {
    conservative: +(base * getScenarioMultiplier(popularity, 'conservative', marginPercent, targetMarginPercent, priceDeltaPercent)).toFixed(3),
    base: +(base * getScenarioMultiplier(popularity, 'base', marginPercent, targetMarginPercent, priceDeltaPercent)).toFixed(3),
    aggressive: +(base * getScenarioMultiplier(popularity, 'aggressive', marginPercent, targetMarginPercent, priceDeltaPercent)).toFixed(3),
  };
}

function getTargetPriceForMargin(cost, targetMarginRatio) {
  if (targetMarginRatio >= 1) return cost;
  return cost / (1 - targetMarginRatio);
}

function buildScenarioProjection(cocktail, scenarioName, suggestedPrice, marginPercent, priceDeltaPercent, targetMarginPercent) {
  const multiplier = getScenarioMultiplier(cocktail.popularity, scenarioName, marginPercent, targetMarginPercent, priceDeltaPercent);
  const baseResponse = getEstimatedOrderDelta(
    cocktail.recommendedAction,
    cocktail.popularity,
    priceDeltaPercent,
    marginPercent,
    targetMarginPercent
  );
  const orderDeltaPct = clampValue(baseResponse * multiplier, -0.70, 1.80);
  const monthlyOrders = Math.max(0, Math.round(cocktail.estimatedMonthlySales * (1 + orderDeltaPct)));
  const monthlyRevenue = Math.round(suggestedPrice * monthlyOrders);
  const monthlyIngredientProfit = Math.round((suggestedPrice - cocktail.cost) * monthlyOrders);
  const scenarioMarginPercent = monthlyRevenue > 0 ? (monthlyIngredientProfit / monthlyRevenue) * 100 : 0;

  return {
    orderDeltaPct: +orderDeltaPct.toFixed(3),
    monthlyOrders,
    monthlyRevenue,
    monthlyIngredientProfit,
    marginLift: +(scenarioMarginPercent - marginPercent).toFixed(1),
    marginPercent: +scenarioMarginPercent.toFixed(1),
  };
}

function buildPricingOptimizerResults(cocktails) {
  const valid = cocktails.filter(c => c.price > 0 && c.cost >= 0 && c.popularity >= 1);
  const avgPopularity = valid.reduce((sum, c) => sum + c.popularity, 0) / (valid.length || 1);
  const avgContributionValue = valid.reduce((sum, c) => sum + c.contributionValue, 0) / (valid.length || 1);
  const cheapestPrice = valid.reduce((min, c) => Math.min(min, c.price), Number.POSITIVE_INFINITY);
  const anchorPrice = Number.isFinite(cheapestPrice) ? cheapestPrice : 0;

  return cocktails.map(cocktail => {
    if (!(cocktail.price > 0) || !(cocktail.cost >= 0) || !(cocktail.popularity >= 1)) {
      return {
        name: cocktail.name,
        status: 'warning',
        warning: 'Donnees insuffisantes pour proposer un prix fiable.',
      };
    }

    const marginPercent = getIngredientMarginPercent(cocktail.price, cocktail.cost);
    const menuClass = getMenuClass(cocktail.popularity, cocktail.contributionValue, avgPopularity, avgContributionValue);
    const rate = getAdjustmentRate(menuClass, marginPercent, cocktail.popularity);
    const currentPrice = Math.round(cocktail.price);

    // --- Detect critical pricing situations ---
    const criticalUnderpricedMargin = _pricingConfig.PRICE_CRITICAL_UNDERPRICED_MARGIN || 40;
    const criticalOverpricedMargin  = _pricingConfig.PRICE_CRITICAL_OVERPRICED_MARGIN  || 88;
    const isCriticallyUnderpriced = marginPercent < criticalUnderpricedMargin && cocktail.popularity >= 4;
    const isCriticallyOverpriced  = marginPercent > criticalOverpricedMargin  && cocktail.popularity <= 2;

    // --- Floor: normally 90% of current price; for critically overpriced items allow 60% ---
    // This lets the optimizer suggest a real downward correction instead of a cosmetic -6%.
    const floorRetentionRatio = isCriticallyOverpriced
      ? (_pricingConfig.PRICE_CRITICAL_FLOOR_RETENTION_RATIO || 0.60)
      : _pricingConfig.PRICE_FLOOR_RETENTION_RATIO;
    const hardFloor = Math.max(
      cocktail.cost + _pricingConfig.PRICE_MIN_PROFIT_BUFFER,
      Math.round(currentPrice * floorRetentionRatio)
    );

    // --- Target margin ---
    const targetMarginRatio = (marginPercent < _pricingConfig.PRICE_CLEAR_MISPRICED_MARGIN && cocktail.popularity >= 4)
      ? (_pricingConfig.MARGIN_TARGET_HIGH / 100)
      : (_pricingConfig.MARGIN_TARGET_LOW / 100);
    const targetMarginPrice = getTargetPriceForMargin(cocktail.cost, targetMarginRatio);

    // --- Ceiling: special handling for critically priced items ---
    // For underpriced (margin < 40%, pop ≥ 4): bypass anchor cap, use margin-based target
    // For overpriced (margin > 88%, pop ≤ 2): allow full downward correction to reasonable margin
    const targetMarginPriceLow = getTargetPriceForMargin(cocktail.cost, _pricingConfig.MARGIN_TARGET_LOW / 100);
    let hardCeiling;

    if (isCriticallyUnderpriced) {
      // Bypass anchor multiplier; let margin-based pricing work
      hardCeiling = Math.round(targetMarginPriceLow * 1.15);
    } else if (isCriticallyOverpriced) {
      // For overpriced items receiving a downward correction: allow the move to proceed
      // by setting ceiling high enough that the -12% adjustment rate works without clamping.
      // Use the current price as a minimum to prevent unintended upward moves.
      hardCeiling = currentPrice; // Allow any downward move from current price
    } else {
      // Normal case: anchor multiplier caps upward moves
      hardCeiling = Math.min(
        Math.round(currentPrice * (1 + _pricingConfig.PRICE_MAX_UPWARD_MOVE)),
        Math.round(anchorPrice * _pricingConfig.PRICE_ANCHOR_MULTIPLIER)
      );
    }

    // --- Push factor: for critically underpriced use stronger push (72% vs 45%) ---
    const pushFactor = isCriticallyUnderpriced
      ? (_pricingConfig.PRICE_CRITICAL_UNDERPRICED_PUSH || 0.72)
      : _pricingConfig.PRICE_TARGET_MARGIN_PUSH;
    const pushedTargetPrice = currentPrice + ((targetMarginPrice - currentPrice) * pushFactor);
    const recommendedAction = getRecommendedAction(menuClass, marginPercent, cocktail.popularity);
    const preferredPrice = rate >= 0
      ? Math.max(currentPrice * (1 + rate), pushedTargetPrice)
      : currentPrice * (1 + rate);

    // For non-downward moves, ensure the ceiling never falls below the current price.
    // Without this, items priced above the anchor ceiling would be silently lowered —
    // which creates contradictions like "Augmenter" action but a lower suggested price.
    const effectiveCeiling = rate >= 0
      ? Math.max(hardCeiling, currentPrice)
      : hardCeiling;

    let suggestedPrice = rate >= 0
      ? findNextPricePoint(preferredPrice, 'up')
      : findNextPricePoint(preferredPrice, 'down');
    suggestedPrice = clampValue(suggestedPrice, hardFloor, Math.max(hardFloor, effectiveCeiling));
    if (recommendedAction === 'Ne pas toucher' || recommendedAction === 'Maintenir') suggestedPrice = currentPrice;
    if (menuClass === 'Plow Horse' && suggestedPrice === currentPrice && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) {
      const fallbackUp = findNextPricePoint(currentPrice + 1, 'up');
      suggestedPrice = clampValue(fallbackUp, hardFloor, Math.max(hardFloor, effectiveCeiling));
    }

    const priceDeltaValue = suggestedPrice - currentPrice;
    const priceDeltaPercent = currentPrice ? +(priceDeltaValue / currentPrice).toFixed(3) : 0;
    const targetMarginPercent = targetMarginRatio * 100;
    const estimatedOrderDelta = getEstimatedOrderDelta(
      recommendedAction,
      cocktail.popularity,
      priceDeltaPercent,
      marginPercent,
      targetMarginPercent
    );
    const estimatedOrderDeltaRange = {
      conservative: +(estimatedOrderDelta * getScenarioMultiplier(cocktail.popularity, 'conservative', marginPercent, targetMarginPercent, priceDeltaPercent)).toFixed(3),
      base: +estimatedOrderDelta.toFixed(3),
      aggressive: +(estimatedOrderDelta * getScenarioMultiplier(cocktail.popularity, 'aggressive', marginPercent, targetMarginPercent, priceDeltaPercent)).toFixed(3),
    };
    const scenarioBase = buildScenarioProjection(
      { ...cocktail, recommendedAction, estimatedMonthlySales: cocktail.estimatedMonthlySales },
      'base',
      suggestedPrice,
      marginPercent,
      priceDeltaPercent,
      targetMarginPercent
    );
    const scenarioConservative = buildScenarioProjection(
      { ...cocktail, recommendedAction, estimatedMonthlySales: cocktail.estimatedMonthlySales },
      'conservative',
      suggestedPrice,
      marginPercent,
      priceDeltaPercent,
      targetMarginPercent
    );
    const scenarioAggressive = buildScenarioProjection(
      { ...cocktail, recommendedAction, estimatedMonthlySales: cocktail.estimatedMonthlySales },
      'aggressive',
      suggestedPrice,
      marginPercent,
      priceDeltaPercent,
      targetMarginPercent
    );
    const currentProfit = Math.round((currentPrice - cocktail.cost) * cocktail.estimatedMonthlySales);

    const result = {
      name: cocktail.name,
      currentPrice,
      cost: cocktail.cost,
      marginPercent,
      contributionValue: cocktail.contributionValue,
      popularity: cocktail.popularity,
      menuClass,
      sensitivityBand: getSensitivityBand(cocktail.popularity),
      recommendedAction,
      suggestedPrice,
      priceDeltaValue,
      priceDeltaPercent,
      estimatedOrderDelta,
      estimatedOrderDeltaRange,
      expectedDemandDirection: getDemandDirection(scenarioBase.orderDeltaPct),
      expectedProfitDirection: getProfitDirection(priceDeltaPercent),
      estimatedMonthlySales: cocktail.estimatedMonthlySales,
      estimatedRecommendedSales: scenarioBase.monthlyOrders,
      estimatedRecommendedSalesConservative: scenarioConservative.monthlyOrders,
      estimatedRecommendedSalesAggressive: scenarioAggressive.monthlyOrders,
      currentProfit,
      estimatedRecommendedRevenue: scenarioBase.monthlyRevenue,
      estimatedRecommendedRevenueConservative: scenarioConservative.monthlyRevenue,
      estimatedRecommendedRevenueAggressive: scenarioAggressive.monthlyRevenue,
      estimatedRecommendedProfit: scenarioBase.monthlyIngredientProfit,
      estimatedRecommendedProfitConservative: scenarioConservative.monthlyIngredientProfit,
      estimatedRecommendedProfitAggressive: scenarioAggressive.monthlyIngredientProfit,
      scenarios: {
        conservative: scenarioConservative,
        base: scenarioBase,
        aggressive: scenarioAggressive,
      },
      status: 'ok',
    };
    result.gainCurve = buildGainCurvePoints(result);
    result.reasonFr = getReasonText(result);
    return result;
  }).sort((a, b) => {
    const priorityFor = (item) => {
      if (item.status === 'warning') return 99;
      if (item.recommendedAction === 'Augmenter ou revoir') return 0;
      if (item.recommendedAction === 'Augmenter un peu') return 1;
      if (item.recommendedAction === 'Baisser pour relancer') return 2;
      if (item.recommendedAction === 'Baisser un peu') return 3;
      return 4;
    };
    const aPriority = priorityFor(a);
    const bPriority = priorityFor(b);
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.marginPercent || 0) - (b.marginPercent || 0);
  });
}

if (typeof window !== 'undefined') {
  window.buildPricingOptimizerResults = buildPricingOptimizerResults;
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildPricingOptimizerResults,
    getIngredientMarginPercent,
    getContributionValue,
  };
}

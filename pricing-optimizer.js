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
  if (band === 'high' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 'Ne pas toucher';
  if (band === 'high' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter un peu';
  if (band === 'medium' && marginPercent >= _pricingConfig.MARGIN_TARGET_HIGH) return 'Baisser un peu';
  if (band === 'medium' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter un peu';
  if (band === 'low' && marginPercent >= _pricingConfig.MARGIN_TARGET_LOW) return 'Baisser pour relancer';
  if (band === 'low' && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) return 'Augmenter ou revoir';
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

function getAdjustmentRate(menuClass, marginPercent, popularity) {
  const band = getPopularityBand(popularity);
  const upwardCap = _pricingConfig.POPULARITY_UPWARD_CAPS[popularity] ?? _pricingConfig.PRICE_MAX_UPWARD_MOVE;
  const downwardCap = _pricingConfig.POPULARITY_DOWNWARD_CAPS[popularity] ?? _pricingConfig.PRICE_MAX_DOWNWARD_MOVE;

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

function getEstimatedOrderDelta(action, popularity, priceDeltaPercent) {
  const band = getPopularityBand(popularity);
  if (action === 'Maintenir' || !priceDeltaPercent) return 0;
  if (action === 'Ne pas toucher') return 0;

  if (action === 'Augmenter un peu') {
    if (band === 'high') return -0.08;
    if (band === 'medium') return -0.03;
    return -0.01;
  }
  if (action === 'Augmenter ou revoir') {
    return -0.02;
  }
  if (action === 'Baisser un peu') {
    if (band === 'medium') return 0.08;
    return 0.05;
  }
  if (action === 'Baisser pour relancer') {
    return band === 'low' ? 0.16 : 0.1;
  }
  return priceDeltaPercent > 0 ? -0.03 : 0.03;
}

function getTargetPriceForMargin(cost, targetMarginRatio) {
  if (targetMarginRatio >= 1) return cost;
  return cost / (1 - targetMarginRatio);
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
    const hardFloor = Math.max(
      cocktail.cost + _pricingConfig.PRICE_MIN_PROFIT_BUFFER,
      Math.round(currentPrice * _pricingConfig.PRICE_FLOOR_RETENTION_RATIO)
    );
    const hardCeiling = Math.min(
      Math.round(currentPrice * (1 + _pricingConfig.PRICE_MAX_UPWARD_MOVE)),
      Math.round(anchorPrice * _pricingConfig.PRICE_ANCHOR_MULTIPLIER)
    );
    const targetMarginRatio = (marginPercent < _pricingConfig.PRICE_CLEAR_MISPRICED_MARGIN && cocktail.popularity >= 4)
      ? (_pricingConfig.MARGIN_TARGET_HIGH / 100)
      : (_pricingConfig.MARGIN_TARGET_LOW / 100);
    const targetMarginPrice = getTargetPriceForMargin(cocktail.cost, targetMarginRatio);
    const pushedTargetPrice = currentPrice + ((targetMarginPrice - currentPrice) * _pricingConfig.PRICE_TARGET_MARGIN_PUSH);
    const recommendedAction = getRecommendedAction(menuClass, marginPercent, cocktail.popularity);
    const preferredPrice = rate >= 0
      ? Math.max(currentPrice * (1 + rate), pushedTargetPrice)
      : currentPrice * (1 + rate);

    let suggestedPrice = rate >= 0
      ? findNextPricePoint(preferredPrice, 'up')
      : findNextPricePoint(preferredPrice, 'down');
    suggestedPrice = clampValue(suggestedPrice, hardFloor, Math.max(hardFloor, hardCeiling));
    if (recommendedAction === 'Ne pas toucher' || recommendedAction === 'Maintenir') suggestedPrice = currentPrice;
    if (menuClass === 'Plow Horse' && suggestedPrice === currentPrice && marginPercent < _pricingConfig.MARGIN_TARGET_LOW) {
      const fallbackUp = findNextPricePoint(currentPrice + 1, 'up');
      suggestedPrice = clampValue(fallbackUp, hardFloor, Math.max(hardFloor, hardCeiling));
    }

    const priceDeltaValue = suggestedPrice - currentPrice;
    const priceDeltaPercent = currentPrice ? +(priceDeltaValue / currentPrice).toFixed(3) : 0;
    const estimatedOrderDelta = getEstimatedOrderDelta(recommendedAction, cocktail.popularity, priceDeltaPercent);
    const estimatedRecommendedSales = Math.max(0, Math.round(cocktail.estimatedMonthlySales * (1 + estimatedOrderDelta)));
    const currentProfit = Math.round((currentPrice - cocktail.cost) * cocktail.estimatedMonthlySales);
    const estimatedRecommendedRevenue = Math.round(suggestedPrice * estimatedRecommendedSales);
    const estimatedRecommendedProfit = Math.round((suggestedPrice - cocktail.cost) * estimatedRecommendedSales);

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
      expectedDemandDirection: getDemandDirection(estimatedOrderDelta),
      expectedProfitDirection: getProfitDirection(priceDeltaPercent),
      estimatedMonthlySales: cocktail.estimatedMonthlySales,
      estimatedRecommendedSales,
      currentProfit,
      estimatedRecommendedRevenue,
      estimatedRecommendedProfit,
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

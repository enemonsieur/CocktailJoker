// logic-refactored.js
// Classic browser script entrypoint for rendering and interaction.

const _isNode = typeof module !== 'undefined' && typeof require === 'function';

const _configMod = _isNode ? require('./config') : window;
const _config = _configMod.CONFIG;
const _colors = _configMod.COLORS;
const _tooltip = _configMod.getPopularityTooltip;

const _ui = _isNode ? require('./ui-helpers') : window;
const _stateMod = _isNode ? require('./state') : window;
const _searchMod = _isNode ? require('./search-helpers') : window;
const _pricingMod = _isNode ? require('./pricing-optimizer') : window;
const _pricingModV2 = _isNode ? require('./pricing-optimizer-v2') : window;

const {
  AppState: state,
  calcTotalCost: _calcCost,
  calcMargin: _calcMargin,
  generateCode: _genCode,
} = _stateMod;

const {
  DOM: dom,
  createCocktailButton: _cocktailBtn,
  createToggleButton: _toggleBtn,
  createAddButton: _addBtn,
  buildIngredientRow: _ingRow,
  buildCocktailCard: _card,
  displayMessage: _msg,
} = _ui;

const {
  searchCocktails: _searchCocktails,
  searchIngredients: _searchIngredients,
  findExactIngredientMatch: _findExactIngredientMatch,
} = _searchMod;

const {
  buildPricingOptimizerResults: _buildPricingOptimizerResults,
} = _pricingMod;

const {
  buildPricingOptimizerResultsV2: _buildPricingOptimizerResultsV2,
} = _pricingModV2;

const _cocktails = (typeof window !== 'undefined' && window.cocktails) ? window.cocktails : (typeof cocktails !== 'undefined' ? cocktails : []);
const _masterIngredients = (typeof window !== 'undefined' && window.masterIngredients) ? window.masterIngredients : (typeof masterIngredients !== 'undefined' ? masterIngredients : {});
const _searchUiState = {
  cocktail: { query: '', open: false, highlight: -1, results: [] },
  ingredients: {},
};

function getSelectedCocktailNames() {
  return state.selected.map(c => c.name);
}

function getIngredientStateKey(cocktailIndex, ingredientIndex) {
  return `${cocktailIndex}:${ingredientIndex}`;
}

function ensureIngredientState(cocktailIndex, ingredientIndex) {
  const key = getIngredientStateKey(cocktailIndex, ingredientIndex);
  if (!_searchUiState.ingredients[key]) {
    _searchUiState.ingredients[key] = { open: false, highlight: -1, results: [] };
  }
  return _searchUiState.ingredients[key];
}

function ensureMasterIngredient(name) {
  if (!name || _masterIngredients[name]) return;
  _masterIngredients[name] = { ..._config.DEFAULT_INGREDIENT };
}

function getCocktailSearchResults(query) {
  return _searchCocktails(query, _cocktails, getSelectedCocktailNames(), { limit: 8 });
}

function renderCocktailSuggestions() {
  const list = document.getElementById('cocktail-search-list');
  const input = document.getElementById('cocktail-search-input');
  if (!list || !input) return;

  const stateUi = _searchUiState.cocktail;
  stateUi.results = getCocktailSearchResults(stateUi.query);
  const hasResults = stateUi.open && stateUi.results.length > 0;
  list.classList.toggle('hidden', !hasResults);
  input.setAttribute('aria-expanded', hasResults ? 'true' : 'false');
  input.setAttribute('aria-activedescendant', hasResults && stateUi.highlight >= 0 ? stateUi.results[stateUi.highlight]?.id || '' : '');

  if (!hasResults) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = stateUi.results.map((item, index) => `
    <button type="button"
      id="${item.id}"
      role="option"
      aria-selected="${index === stateUi.highlight ? 'true' : 'false'}"
      class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${index === stateUi.highlight ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-stone-50'}"
      onmousedown="selectCocktailSuggestionByIndex(${index})">
      <span>${item.label}</span>
      <span class="text-xs text-stone-500">Popularité ${item.popularity || 0}/5</span>
    </button>
  `).join('');
}

function closeCocktailSuggestions() {
  _searchUiState.cocktail.open = false;
  _searchUiState.cocktail.highlight = -1;
  renderCocktailSuggestions();
}

function updateCocktailSearch(value, shouldOpen = true) {
  _searchUiState.cocktail.query = value || '';
  _searchUiState.cocktail.open = shouldOpen;
  _searchUiState.cocktail.results = getCocktailSearchResults(_searchUiState.cocktail.query);
  _searchUiState.cocktail.highlight = _searchUiState.cocktail.results.length ? 0 : -1;
  renderCocktailSuggestions();
}

function focusCocktailSearch() {
  updateCocktailSearch(_searchUiState.cocktail.query, true);
}

function selectCocktailSuggestionByIndex(index) {
  const item = _searchUiState.cocktail.results[index];
  if (!item) return;
  addCocktail(item.value);
  _searchUiState.cocktail.query = '';
  _searchUiState.cocktail.open = false;
  _searchUiState.cocktail.highlight = -1;
  const input = document.getElementById('cocktail-search-input');
  if (input) input.value = '';
}

function handleCocktailSearchKeydown(event) {
  const stateUi = _searchUiState.cocktail;
  if (!stateUi.open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    updateCocktailSearch(stateUi.query, true);
  }
  if (!stateUi.results.length) {
    if (event.key === 'Escape') closeCocktailSuggestions();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    stateUi.highlight = (stateUi.highlight + 1) % stateUi.results.length;
    renderCocktailSuggestions();
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    stateUi.highlight = (stateUi.highlight - 1 + stateUi.results.length) % stateUi.results.length;
    renderCocktailSuggestions();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    if (stateUi.highlight >= 0) {
      selectCocktailSuggestionByIndex(stateUi.highlight);
    }
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCocktailSuggestions();
  }
}

function getIngredientSuggestionElements(cocktailIndex, ingredientIndex) {
  const prefix = `cocktail-${cocktailIndex}-ingredient-${ingredientIndex}`;
  return {
    input: document.getElementById(`${prefix}-name`),
    list: document.getElementById(`${prefix}-suggestions`),
  };
}

function renderIngredientSuggestions(cocktailIndex, ingredientIndex) {
  const uiState = ensureIngredientState(cocktailIndex, ingredientIndex);
  const { input, list } = getIngredientSuggestionElements(cocktailIndex, ingredientIndex);
  if (!input || !list) return;

  const hasResults = uiState.open && uiState.results.length > 0;
  list.classList.toggle('hidden', !hasResults);
  input.setAttribute('aria-expanded', hasResults ? 'true' : 'false');
  input.setAttribute('aria-activedescendant', hasResults && uiState.highlight >= 0 ? uiState.results[uiState.highlight]?.id || '' : '');

  if (!hasResults) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = uiState.results.map((item, index) => `
    <button type="button"
      id="${item.id}-${cocktailIndex}-${ingredientIndex}"
      role="option"
      aria-selected="${index === uiState.highlight ? 'true' : 'false'}"
      class="block w-full rounded-lg px-3 py-2 text-left text-sm ${index === uiState.highlight ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-stone-50'}"
      onmousedown="selectIngredientSuggestion(${cocktailIndex}, ${ingredientIndex}, ${index})">${item.label}</button>
  `).join('');
}

function closeIngredientSuggestions(cocktailIndex, ingredientIndex) {
  const uiState = ensureIngredientState(cocktailIndex, ingredientIndex);
  uiState.open = false;
  uiState.highlight = -1;
  renderIngredientSuggestions(cocktailIndex, ingredientIndex);
}

function getIngredientResults(query) {
  return _searchIngredients(query, _masterIngredients, { limit: 8 });
}

function commitIngredientName(cocktailIndex, ingredientIndex, rawValue, matchedValue) {
  const trimmed = (rawValue || '').trim();
  if (!trimmed) {
    state.updateIngredient(cocktailIndex, ingredientIndex, 'name', '');
    return;
  }

  const exact = _findExactIngredientMatch(trimmed, _masterIngredients);
  const finalName = matchedValue || exact?.value || trimmed;
  ensureMasterIngredient(finalName);
  state.updateIngredient(cocktailIndex, ingredientIndex, 'name', finalName);
}

function handleIngredientNameInput(cocktailIndex, ingredientIndex, value) {
  const uiState = ensureIngredientState(cocktailIndex, ingredientIndex);
  uiState.open = true;
  uiState.results = getIngredientResults(value);
  uiState.highlight = uiState.results.length ? 0 : -1;
  renderIngredientSuggestions(cocktailIndex, ingredientIndex);
}

function handleIngredientNameFocus(cocktailIndex, ingredientIndex, value) {
  handleIngredientNameInput(cocktailIndex, ingredientIndex, value);
}

function handleIngredientNameKeydown(event, cocktailIndex, ingredientIndex) {
  const uiState = ensureIngredientState(cocktailIndex, ingredientIndex);
  if (!uiState.results.length) {
    if (event.key === 'Enter') {
      commitIngredientName(cocktailIndex, ingredientIndex, event.target.value);
    }
    if (event.key === 'Escape') {
      closeIngredientSuggestions(cocktailIndex, ingredientIndex);
    }
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    uiState.open = true;
    uiState.highlight = (uiState.highlight + 1) % uiState.results.length;
    renderIngredientSuggestions(cocktailIndex, ingredientIndex);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    uiState.open = true;
    uiState.highlight = (uiState.highlight - 1 + uiState.results.length) % uiState.results.length;
    renderIngredientSuggestions(cocktailIndex, ingredientIndex);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const selected = uiState.results[uiState.highlight];
    commitIngredientName(cocktailIndex, ingredientIndex, event.target.value, selected?.value);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeIngredientSuggestions(cocktailIndex, ingredientIndex);
  }
}

function handleIngredientNameBlur(cocktailIndex, ingredientIndex) {
  setTimeout(() => {
    const { input } = getIngredientSuggestionElements(cocktailIndex, ingredientIndex);
    if (!input) return;
    commitIngredientName(cocktailIndex, ingredientIndex, input.value);
    closeIngredientSuggestions(cocktailIndex, ingredientIndex);
  }, 120);
}

function selectIngredientSuggestion(cocktailIndex, ingredientIndex, index) {
  const uiState = ensureIngredientState(cocktailIndex, ingredientIndex);
  const item = uiState.results[index];
  if (!item) return;
  commitIngredientName(cocktailIndex, ingredientIndex, item.label, item.value);
}

function isSelected(name) { return state.isSelected(name); }

function addCocktail(name) {
  const blueprint = _cocktails.find(x => x.name === name);
  if (blueprint) state.addCocktail(blueprint);
}

function addCustomCocktail() { state.addCustomCocktail(); }
function removeCocktail(index) { state.removeCocktail(index); }

function updateCocktailPrice(index, price) { state.updateCocktail(index, 'price', price); }
function updateCocktailPopularity(index, pop) { state.updateCocktail(index, 'popularity', pop); }
function updateCocktailName(index, name) { state.updateCocktail(index, 'name', name); }

function updateIngredient(ci, ii, prop, val) { state.updateIngredient(ci, ii, prop, val); }
function addNewIngredient(ci) { state.addIngredient(ci, _masterIngredients); }
function removeIngredient(ci, ii) { state.removeIngredient(ci, ii); }

function updateIngredientUnitServed(ci, ii, unit) {
  state.updateIngredientUnit(ci, ii, unit, _masterIngredients);
}

function updateIngredientMasterData(name, field, value) {
  state.updateMasterData(name, field, value, _masterIngredients);
}

function updateIngredientPrice(name, price) {
  state.updateMasterData(name, 'price', price, _masterIngredients);
}

function updateMasterIngredient(name, prop, val) {
  state.updateMasterData(name, prop, val, _masterIngredients);
  state.selected.forEach((c, index) => {
    const card = document.querySelector(`#selected-cocktails article:nth-child(${index + 1})`);
    const cost = _calcCost(c, _masterIngredients);
    const margin = _calcMargin(c.price, cost);
    card?.querySelector('.cost-amount')?.replaceChildren(document.createTextNode(Math.round(cost)));
    card?.querySelector('.margin-percentage')?.replaceChildren(document.createTextNode(margin));
  });
}

const calcTotalCostForSelection = (cocktail) => _calcCost(cocktail, _masterIngredients);

function renderCocktailList() {
  const div = dom.get('cocktail-list');
  if (!div) return;
  div.innerHTML = `
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-start">
      <div class="relative">
        <label class="mb-2 block text-sm font-semibold text-slate-900" for="cocktail-search-input">Rechercher un cocktail</label>
        <input
          id="cocktail-search-input"
          type="text"
          value="${_searchUiState.cocktail.query.replace(/"/g, '&quot;')}"
          class="w-full rounded-xl border border-stone-300 px-4 py-3 text-base"
          placeholder="Ex. Mojito, Spritz, Daiquiri"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="cocktail-search-list"
          aria-expanded="false"
          autocomplete="off"
          oninput="updateCocktailSearch(this.value)"
          onkeydown="handleCocktailSearchKeydown(event)"
          onfocus="focusCocktailSearch()">
        <div id="cocktail-search-list" class="absolute left-0 right-0 top-full z-20 mt-1 hidden max-h-72 overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg" role="listbox"></div>
        <p class="mt-2 text-sm leading-6 text-stone-600">Tapez pour filtrer la liste, puis validez avec les flèches et la touche Entrée.</p>
      </div>
      <div class="flex lg:pt-8">
        <button type="button" onclick="addCustomCocktail()" class="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-stone-50 lg:w-auto">
          Créer un cocktail personnalisé
        </button>
      </div>
    </div>
  `;
  renderCocktailSuggestions();
}

function renderSelected() {
  const container = dom.get('selected-cocktails');
  if (!container) return;

  if (state.selected.length === 0) {
    container.innerHTML = '';
  } else {
    container.innerHTML = state.selected.map((c, i) => {
      const totalCost = _calcCost(c, _masterIngredients);
      const marginPercent = _calcMargin(c.price, totalCost);
      const marginColor = _colors.getMarginColor(marginPercent);
      const ingredientRows = c.ingredients.map((ing, idx) => {
        const ingInfo = _masterIngredients[ing.name] || null;
        return _ingRow(i, idx, ing, ingInfo);
      }).join('');
      return _card(c, i, totalCost, marginPercent, marginColor, ingredientRows);
    }).join('');
  }

  if (dom.get('menu-summary')?.innerHTML.includes('<table')) {
    generateMenu();
  }

  const hasSelection = state.selected.length > 0;
  dom.get('analysis-step')?.classList.toggle('hidden', !hasSelection);
  dom.get('sales-step')?.classList.toggle('hidden', !hasSelection);
  dom.get('summary-step')?.classList.add('hidden');
  dom.get('export-section')?.classList.toggle('hidden', true);
  dom.get('menu-summary')?.classList.toggle('hidden', true);
}

function toggleSalesErrors(show) {
  dom.get('persons-error')?.classList.toggle('hidden', !show);
  dom.get('attach-error')?.classList.toggle('hidden', !show);
}

function toggleAdvancedSales() {
  const el = dom.get('advanced-sales');
  if (!el) return;
  el.classList.toggle('hidden');
}

// Auto-detect venue tier from average cocktail price.
// >= 5500 FCFA average → haut de gamme, otherwise milieu de gamme.
const TIER_THRESHOLD = 5500;

function detectVenueTier(cocktails) {
  if (!cocktails || !cocktails.length) return 'milieu';
  const avgPrice = cocktails.reduce((sum, c) => sum + (c.price || 0), 0) / cocktails.length;
  return avgPrice >= TIER_THRESHOLD ? 'haut' : 'milieu';
}

// buildVenueDiagnosis — replaces the old static BENCHMARKS / getBenchmarkVerdict.
//
// The old version compared monthly cocktail volume against abstract sector targets
// and attach rate against universal norms. That framing was misleading in venues
// where traffic is modest: it implied low volume was a direct failure, and steered
// the advice toward "bring more customers" even when cocktail conversion was the
// real bottleneck.
//
// This version reads the V2 optimizer context directly and separates:
//   traffic (covers) · cocktail conversion (attach) · repeat intensity · resulting volume
//
// It draws on venueHealthBand, primaryBottleneck, and secondaryBottleneck that the
// V2 optimizer already computes, so the diagnosis stays consistent with the algorithm.

function buildVenueDiagnosis({
  monthlyTotal,        // resulting cocktail volume (computed)
  attachRate,          // % as entered by user (e.g. 10 for 10%)
  personsPerWeek,
  cocktailsPerBuyer,
  venueType,
  tier,
  // V2 context — pulled from the first optimizer result item when available
  venueHealthBand,
  primaryBottleneck,
  secondaryBottleneck,
}) {
  const venueLabel = { bar: 'bar', hotel_bar: 'bar d\'hôtel', restaurant: 'restaurant' }[venueType] || venueType;
  const tierLabel = tier === 'haut' ? 'haut de gamme' : 'milieu de gamme';

  // ── Traffic signal ────────────────────────────────────────────────
  // We do not compare against a static cover target. We describe what
  // we observe so the user can form their own judgment.
  const monthlyCovers = personsPerWeek * 4;
  let trafficSignal, trafficBadge;
  if (primaryBottleneck === 'covers' && !secondaryBottleneck) {
    trafficSignal = 'LIMITANT';
    trafficBadge = 'bg-red-100 text-red-800';
  } else if (primaryBottleneck === 'covers' || secondaryBottleneck === 'covers') {
    trafficSignal = 'FAIBLE';
    trafficBadge = 'bg-amber-100 text-amber-800';
  } else {
    trafficSignal = 'OK';
    trafficBadge = 'bg-emerald-100 text-emerald-800';
  }

  // ── Conversion signal ─────────────────────────────────────────────
  let conversionSignal, conversionBadge;
  if (primaryBottleneck === 'attach_rate') {
    conversionSignal = 'FAIBLE';
    conversionBadge = 'bg-red-100 text-red-800';
  } else if (secondaryBottleneck === 'attach_rate') {
    conversionSignal = 'À SURVEILLER';
    conversionBadge = 'bg-amber-100 text-amber-800';
  } else {
    conversionSignal = 'OK';
    conversionBadge = 'bg-emerald-100 text-emerald-800';
  }

  // ── Repeat signal ─────────────────────────────────────────────────
  let repeatSignal, repeatBadge;
  if (primaryBottleneck === 'repeat_rate') {
    repeatSignal = 'FAIBLE';
    repeatBadge = 'bg-red-100 text-red-800';
  } else if (secondaryBottleneck === 'repeat_rate') {
    repeatSignal = 'À SURVEILLER';
    repeatBadge = 'bg-amber-100 text-amber-800';
  } else {
    repeatSignal = 'OK';
    repeatBadge = 'bg-emerald-100 text-emerald-800';
  }

  // ── Volume signal ─────────────────────────────────────────────────
  // Volume is presented as a result of the three factors above, not as
  // the primary grade. Badging follows overall venue health.
  let volumeSignal, volumeBadge;
  if (venueHealthBand === 'good') {
    volumeSignal = 'BON';
    volumeBadge = 'bg-emerald-100 text-emerald-800';
  } else if (venueHealthBand === 'bad') {
    volumeSignal = 'FAIBLE';
    volumeBadge = 'bg-amber-100 text-amber-800';
  } else {
    volumeSignal = 'CRITIQUE';
    volumeBadge = 'bg-red-100 text-red-800';
  }

  // ── Card border / background ──────────────────────────────────────
  let cardBorder;
  if (venueHealthBand === 'good') {
    cardBorder = 'border-emerald-200 bg-emerald-50';
  } else if (venueHealthBand === 'very_bad') {
    cardBorder = 'border-red-200 bg-red-50';
  } else {
    cardBorder = 'border-amber-200 bg-amber-50';
  }

  // ── Diagnosis text ────────────────────────────────────────────────
  // Written to match the copy direction in the ticket:
  //   • honest and operational
  //   • no universal attach-rate percentages
  //   • weak-attach cases → conversion-first priority
  //   • traffic mentioned only when it is genuinely the main limit
  let diagnosisLines = [];

  if (venueHealthBand === 'good') {
    diagnosisLines.push(
      'Votre bar présente une bonne dynamique cocktail pour ce positionnement.',
      'Appliquez les ajustements de prix ci-dessous pour sécuriser et améliorer votre marge.'
    );
  } else if (primaryBottleneck === 'attach_rate') {
    diagnosisLines.push(
      `Le volume cocktail reste faible pour ce positionnement, mais il doit être lu avec votre trafic réel (${monthlyCovers.toLocaleString()} passages/mois estimés).`
    );
    if (secondaryBottleneck === 'covers') {
      diagnosisLines.push(
        'Le trafic est également limité, mais le point de friction principal reste la conversion cocktail : trop peu de clients présents choisissent un cocktail.'
      );
    } else {
      diagnosisLines.push(
        'Le point de friction principal est la conversion cocktail : trop peu de clients présents choisissent un cocktail.'
      );
    }
    diagnosisLines.push(
      'Priorité :\n1. rendre l\'offre cocktail plus accessible et plus lisible\n2. corriger les prix des cocktails à faible demande et très forte marge\n3. améliorer la conversion sur les clients déjà présents avant de raisonner en acquisition de trafic'
    );
  } else if (primaryBottleneck === 'covers') {
    diagnosisLines.push(
      `Le volume cocktail est limité principalement par le trafic (${monthlyCovers.toLocaleString()} passages/mois estimés).`
    );
    if (secondaryBottleneck === 'attach_rate') {
      diagnosisLines.push(
        'La conversion cocktail est également perfectible : travailler la carte et le positionnement prix peut aider à convertir davantage parmi les clients déjà présents.'
      );
    } else {
      diagnosisLines.push(
        'La conversion cocktail et la répétition d\'achat semblent correctes compte tenu du flux de clients.'
      );
    }
    diagnosisLines.push(
      'Appliquez les recommandations de prix pour optimiser la marge sur le volume actuel.'
    );
  } else if (primaryBottleneck === 'repeat_rate') {
    diagnosisLines.push(
      'Les clients qui commandent des cocktails en commandent peu par visite.',
      'Travaillez l\'offre cocktail (lisibilité, format, prix) pour encourager les commandes additionnelles.',
      'Appliquez les recommandations de prix pour améliorer la rentabilité sur chaque cocktail vendu.'
    );
  } else {
    // balanced / unknown
    diagnosisLines.push(
      'Aucun point de friction dominant identifié.',
      'Appliquez les recommandations de prix pour sécuriser la marge.'
    );
  }

  const diagnosisText = diagnosisLines.join(' ');

  return {
    venueLabel,
    tierLabel,
    cardBorder,
    monthlyCovers,
    trafficSignal, trafficBadge,
    conversionSignal, conversionBadge,
    repeatSignal, repeatBadge,
    volumeSignal, volumeBadge,
    attachRate,
    cocktailsPerBuyer,
    monthlyTotal,
    diagnosisText,
  };
}

function getMarginStatusText(margin) {
  if (margin > _config.MARGIN_HIGH) return 'Marge haute';
  if (margin >= _config.MARGIN_GOOD) return 'Marge saine';
  return 'Marge fragile';
}

function buildRecommendation(overallMargin, strongestCocktail, weakestCocktail, dominantCocktail) {
  const parts = [];

  if (weakestCocktail) {
    parts.push(`À surveiller en premier : ${weakestCocktail.name} avec une marge de ${weakestCocktail.margin} %.`);
  }

  if (dominantCocktail && dominantCocktail.revenueShare > _config.REVENUE_SHARE_HIGHLIGHT) {
    parts.push(`${dominantCocktail.name} porte ${dominantCocktail.revenueShare.toFixed(1)} % du chiffre d'affaires estimé.`);
  }

  if (overallMargin > _config.OVERALL_MARGIN_HIGH) {
    parts.push("Votre marge globale paraît élevée. Quand les prix sont trop hauts, certains clients commandent moins souvent. Baisser légèrement certains prix peut aider à vendre plus souvent et à augmenter le profit mensuel.");
  } else if (overallMargin < _config.OVERALL_MARGIN_GOOD) {
    parts.push('Votre marge globale paraît faible. Revoyez les recettes ou les prix des cocktails les moins rentables.');
  } else {
    parts.push('Votre marge globale reste dans une zone plutôt saine pour piloter la carte.');
  }

  if (strongestCocktail) {
    parts.push(`Point fort actuel : ${strongestCocktail.name} affiche ${strongestCocktail.margin} % de marge.`);
  }

  return parts.join(' ');
}

function starsHtml(popularity) {
  const n = Math.max(1, Math.min(5, Math.round(popularity)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatNumber(value) {
  return Math.round(value || 0).toLocaleString('fr-FR');
}

function formatCurrency(value) {
  return `${formatNumber(value)} FCFA`;
}

function formatSignedNumber(value) {
  const rounded = Math.round(value || 0);
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('fr-FR')}`;
}

function formatSignedCurrency(value) {
  return `${formatSignedNumber(value)} FCFA`;
}

function formatSignedPercent(value) {
  const rounded = Math.round(value || 0);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function calculateMarginPercent(price, cost) {
  if (!(price > 0)) return 0;
  return Math.round((((price || 0) - (cost || 0)) / price) * 100);
}

function getMarginPillClass(margin) {
  if (margin > _config.MARGIN_HIGH) return 'bg-teal-100 text-teal-800';
  if (margin >= _config.MARGIN_GOOD) return 'bg-emerald-100 text-emerald-800';
  return 'bg-orange-100 text-orange-800';
}

function renderMarginPill(margin, status = '') {
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getMarginPillClass(margin)}">${margin}%${status ? ` <span class="ml-1 font-normal opacity-70">${status}</span>` : ''}</span>`;
}

function getDeltaTone(value, positiveClass = 'text-emerald-700', negativeClass = 'text-red-600', neutralClass = 'text-stone-500') {
  if (value > 0) return positiveClass;
  if (value < 0) return negativeClass;
  return neutralClass;
}

// ─────────────────────────────────────────────────────────────────────────────
// RÉSUMÉ DE LA CARTE : tableau cocktail par cocktail (coût / prix / marge / ventes / CA / profit)
// Affiché AVANT la barre de profit et le rebalancement
// ─────────────────────────────────────────────────────────────────────────────
function buildMenuSummaryTable(cocktails, totalRevenue, totalProfit) {
  if (!cocktails || cocktails.length === 0) return '';

  const totalMonthlySales = cocktails.reduce((s, c) => s + (c.estimatedMonthlySales || 0), 0);
  const totalEstRevenue   = cocktails.reduce((s, c) => s + (c.estimatedRevenue || 0), 0);
  const totalEstProfit    = cocktails.reduce((s, c) => s + (c.estimatedProfit || 0), 0);
  const overallMargin     = totalEstRevenue > 0 ? Math.round((totalEstProfit / totalEstRevenue) * 100) : 0;

  const rows = cocktails.map((c, idx) => {
    const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-stone-50';
    const revenueShareBar = Math.round(c.revenueShare || 0);
    return `
      <tr class="${bgClass}">
        <td class="px-4 py-3 text-sm font-medium text-slate-900">
          ${c.name}
          <span class="ml-1 text-amber-500 text-xs">${starsHtml(c.popularity)}</span>
        </td>
        <td class="px-4 py-3 text-sm text-stone-600 tabular-nums">${formatCurrency(c.cost)}</td>
        <td class="px-4 py-3 text-sm font-semibold text-slate-900 tabular-nums">${formatCurrency(c.price)}</td>
        <td class="px-4 py-3 text-sm">${renderMarginPill(Math.round(c.margin), c.marginStatus)}</td>
        <td class="px-4 py-3 text-sm tabular-nums text-slate-700">${c.estimatedMonthlySales || 0}</td>
        <td class="px-4 py-3 text-sm tabular-nums text-slate-700">${formatCurrency(c.estimatedRevenue || 0)}</td>
        <td class="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-700">${formatCurrency(c.estimatedProfit || 0)}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="h-1.5 rounded-full bg-teal-500" style="width:${Math.max(2, revenueShareBar)}%"></div>
            <span class="text-xs text-stone-500 tabular-nums">${revenueShareBar}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `
    <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="menu-resume-title">
      <h3 id="menu-resume-title" class="text-lg font-bold text-slate-900">Résumé de votre carte</h3>
      <p class="mt-1 text-sm leading-6 text-stone-600">Coût, prix, marge et contribution estimée de chaque cocktail — avant toute optimisation.</p>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full overflow-hidden rounded-xl text-left">
          <thead class="bg-stone-100">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Cocktail</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Coût / verre</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Prix vente</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Marge</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Ventes / mois</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">CA mensuel</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Profit mensuel</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Part CA</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            ${rows}
          </tbody>
          <tfoot class="bg-stone-100">
            <tr>
              <td class="px-4 py-3 text-sm font-bold text-slate-900" colspan="4">TOTAL (${cocktails.length} cocktails)</td>
              <td class="px-4 py-3 text-sm font-bold tabular-nums text-slate-900">${totalMonthlySales}</td>
              <td class="px-4 py-3 text-sm font-bold tabular-nums text-slate-900">${formatCurrency(totalEstRevenue)}</td>
              <td class="px-4 py-3 text-sm font-bold tabular-nums text-emerald-700">${formatCurrency(totalEstProfit)}</td>
              <td class="px-4 py-3 text-sm font-semibold text-stone-600">Marge moy. ${overallMargin}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>`;
}

// Profit bar: before/after visual per SUMMARY_SECTION_MOCKUP
function buildProfitBar(profitBefore, profitAfter, gain, gainPct) {
  if (!profitBefore && !profitAfter) return '';

  const conservativeGain = gain * 0.76;
  const baseGain = gain;
  const aggressiveGain = gain * 1.25;

  const safeProfitBefore = Math.max(1, Math.abs(profitBefore));
  const maxScenarioGain = Math.max(Math.abs(conservativeGain), Math.abs(baseGain), Math.abs(aggressiveGain), 1);
  const scenarioTrackWidth = 100;
  const conservativeWidthPct = Math.max(12, Math.round((Math.abs(conservativeGain) / maxScenarioGain) * scenarioTrackWidth));
  const baseWidthPct = Math.max(12, Math.round((Math.abs(baseGain) / maxScenarioGain) * scenarioTrackWidth));
  const aggressiveWidthPct = Math.max(12, Math.round((Math.abs(aggressiveGain) / maxScenarioGain) * scenarioTrackWidth));
  const gainColor = gain >= 0 ? 'var(--success)' : 'var(--danger)';

  return `
    <div class="profit-impact">
      <div class="profit-impact-header">
        <h3 class="profit-title">Impact mensuel estimé après ajustements</h3>
        <div class="profit-primary-value" style="color:${gainColor};">${formatSignedCurrency(gain)} <span style="color:${gainColor};">(${formatSignedPercent(gainPct)})</span></div>
        <p class="profit-summary-line">Profit mensuel estimé : ${formatCurrency(profitBefore)} <span aria-hidden="true">→</span> ${formatCurrency(profitAfter)}</p>
      </div>

      <div class="profit-scenarios" aria-label="Fourchette probable d'impact mensuel">
        <div class="profit-scenarios-heading">
          <h4>Fourchette probable</h4>
          <p>Hypothèse : vous appliquez les nouveaux prix suggérés.</p>
        </div>

        <div class="scenario-list">
          <div class="scenario-row">
            <div class="scenario-copy">
              <span class="scenario-label">Prudent</span>
              <span class="scenario-value">${formatSignedCurrency(conservativeGain)}</span>
            </div>
            <div class="scenario-meter" aria-hidden="true">
              <div class="scenario-meter-fill" style="width: ${conservativeWidthPct}%;"></div>
            </div>
            <div class="scenario-percent">${formatSignedPercent((conservativeGain / safeProfitBefore) * 100)}</div>
          </div>

          <div class="scenario-row scenario-row-active">
            <div class="scenario-copy">
              <span class="scenario-label">Attendu</span>
              <span class="scenario-value">${formatSignedCurrency(baseGain)}</span>
            </div>
            <div class="scenario-meter" aria-hidden="true">
              <div class="scenario-meter-fill scenario-meter-fill-active" style="width: ${baseWidthPct}%;"></div>
            </div>
            <div class="scenario-percent">${formatSignedPercent(gainPct)}</div>
          </div>

          <div class="scenario-row">
            <div class="scenario-copy">
              <span class="scenario-label">Haut</span>
              <span class="scenario-value">${formatSignedCurrency(aggressiveGain)}</span>
            </div>
            <div class="scenario-meter" aria-hidden="true">
              <div class="scenario-meter-fill" style="width: ${aggressiveWidthPct}%;"></div>
            </div>
            <div class="scenario-percent">${formatSignedPercent((aggressiveGain / safeProfitBefore) * 100)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// Details block (collapsible) — one sentence per cocktail
function buildOptimizerDetails(results) {
  return results
    .filter(r => r.status === 'ok')
    .map(r => {
      const currentProfit = r.currentProfit ?? Math.round((r.currentPrice - r.cost) * (r.estimatedMonthlySales || 0));
      const conservativeProfit = r.scenarios?.conservative?.monthlyIngredientProfit ?? currentProfit;
      const baseProfit = r.estimatedRecommendedProfit ?? r.scenarios?.base?.monthlyIngredientProfit ?? currentProfit;
      const aggressiveProfit = r.scenarios?.aggressive?.monthlyIngredientProfit ?? baseProfit;
      const profitDelta = baseProfit - currentProfit;
      return `
        <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div class="font-semibold text-slate-900">${r.name} ${starsHtml(r.popularity)} — ${formatSignedCurrency(profitDelta)}</div>
          <p class="mt-1 text-sm leading-6 text-stone-700">${r.reasonFr}</p>
          <div class="mt-2 text-xs text-stone-500">
            Prudent : ${formatCurrency(conservativeProfit)} ·
            Base : ${formatCurrency(baseProfit)} ·
            Agressif : ${formatCurrency(aggressiveProfit)}
          </div>
        </div>`;
    }).join('');
}

// Main table rows — before/after view for price, margin and monthly impact.
function buildOptimizerRows(results) {
  const sorted = [...results].sort((a, b) => {
    const currentProfitA = a.currentProfit ?? Math.round(((a.currentPrice || 0) - (a.cost || 0)) * (a.estimatedMonthlySales || 0));
    const currentProfitB = b.currentProfit ?? Math.round(((b.currentPrice || 0) - (b.cost || 0)) * (b.estimatedMonthlySales || 0));
    const profitA = a.status === 'ok' ? (a.estimatedRecommendedProfit ?? a.scenarios?.base?.monthlyIngredientProfit ?? currentProfitA) - currentProfitA : -Infinity;
    const profitB = b.status === 'ok' ? (b.estimatedRecommendedProfit ?? b.scenarios?.base?.monthlyIngredientProfit ?? currentProfitB) - currentProfitB : -Infinity;
    return profitB - profitA;
  });

  return sorted.map(result => {
    if (result.status === 'warning') {
      return `
        <tr class="bg-amber-50">
          <td class="px-4 py-4 text-sm font-semibold text-slate-900" colspan="7">${result.name} — ${result.warning}</td>
        </tr>`;
    }

    const currentOrders = result.estimatedMonthlySales || 0;
    const baseOrders    = result.estimatedRecommendedSales ?? result.scenarios?.base?.monthlyOrders ?? currentOrders;
    const orderDelta    = Math.round(baseOrders - currentOrders);
    const currentProfit = result.currentProfit ?? Math.round(((result.currentPrice || 0) - (result.cost || 0)) * currentOrders);
    const profitAfter   = result.estimatedRecommendedProfit ?? result.scenarios?.base?.monthlyIngredientProfit ?? currentProfit;
    const profitDelta   = Math.round(profitAfter - currentProfit);
    const priceChanged  = result.suggestedPrice !== result.currentPrice;
    const currentMargin = Math.round(result.marginPercent ?? calculateMarginPercent(result.currentPrice, result.cost));
    const newMargin = calculateMarginPercent(result.suggestedPrice ?? result.currentPrice, result.cost);
    const orderColor = getDeltaTone(orderDelta);
    const profitColor = getDeltaTone(profitDelta, 'text-emerald-700', 'text-red-600', 'text-stone-500');
    const rowBg = profitDelta > 0
      ? 'bg-emerald-50 hover:bg-emerald-100'
      : profitDelta === 0 && !priceChanged
        ? 'bg-stone-50 hover:bg-stone-100'
        : 'hover:bg-stone-50';

    return `
      <tr class="align-middle ${rowBg}">
        <td class="px-4 py-4 text-sm">
          <div class="font-semibold text-slate-900">${result.name}</div>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span class="text-amber-500">${starsHtml(result.popularity)}</span>
            <span>${result.reasonFr}</span>
          </div>
        </td>
        <td class="px-4 py-4 text-sm tabular-nums text-stone-700">
          ${formatCurrency(result.currentPrice)}
        </td>
        <td class="px-4 py-4 text-sm tabular-nums font-semibold ${priceChanged ? 'text-teal-700' : 'text-stone-400'}">
          ${formatCurrency(priceChanged ? result.suggestedPrice : result.currentPrice)}
        </td>
        <td class="px-4 py-4 text-sm">
          ${renderMarginPill(currentMargin)}
        </td>
        <td class="px-4 py-4 text-sm">
          ${renderMarginPill(newMargin, priceChanged ? '' : 'Identique')}
        </td>
        <td class="px-4 py-4 text-sm">
          <div class="grid gap-1">
            <div class="flex items-center justify-between gap-3 text-stone-500">
              <span class="text-xs uppercase tracking-wide">Actuel</span>
              <span class="font-medium text-slate-700">${formatNumber(currentOrders)}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs uppercase tracking-wide text-stone-500">Après</span>
              <span class="font-semibold ${orderColor}">${formatNumber(baseOrders)}</span>
            </div>
            <div class="text-xs font-semibold ${orderColor}">
              ${orderDelta === 0 ? 'Aucun changement estimé' : `Δ ${formatSignedNumber(orderDelta)} commandes`}
            </div>
          </div>
        </td>
        <td class="px-4 py-4 text-sm">
          <div class="grid gap-1">
            <div class="flex items-center justify-between gap-3 text-stone-500">
              <span class="text-xs uppercase tracking-wide">Actuel</span>
              <span class="font-medium text-slate-700">${formatCurrency(currentProfit)}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs uppercase tracking-wide text-stone-500">Après</span>
              <span class="font-semibold ${profitColor}">${formatCurrency(profitAfter)}</span>
            </div>
            <div class="text-xs font-semibold ${profitColor}">
              ${profitDelta === 0 ? 'Aucun gain estimé' : `Δ ${formatSignedCurrency(profitDelta)}`}
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// buildMenuGainSummary is replaced by buildProfitBar + buildOptimizerDetails above.
// Kept as no-op stub to avoid errors if called from old cached code.
function buildMenuGainSummary(results) {
  const validResults = results.filter(result => result.status === 'ok');
  if (!validResults.length) return '';

  const currentOrders = validResults.reduce((sum, result) => sum + result.estimatedMonthlySales, 0);
  const conservativeOrders = validResults.reduce((sum, result) => sum + (result.scenarios?.conservative?.monthlyOrders || result.estimatedMonthlySales), 0);
  const baseOrders = validResults.reduce((sum, result) => sum + (result.scenarios?.base?.monthlyOrders || result.estimatedMonthlySales), 0);
  const aggressiveOrders = validResults.reduce((sum, result) => sum + (result.scenarios?.aggressive?.monthlyOrders || result.estimatedMonthlySales), 0);
  const currentRevenue = validResults.reduce((sum, result) => sum + (result.currentPrice * result.estimatedMonthlySales), 0);
  const conservativeRevenue = validResults.reduce((sum, result) => sum + (result.scenarios?.conservative?.monthlyRevenue || (result.suggestedPrice * result.estimatedMonthlySales)), 0);
  const baseRevenue = validResults.reduce((sum, result) => sum + (result.scenarios?.base?.monthlyRevenue || (result.suggestedPrice * result.estimatedMonthlySales)), 0);
  const aggressiveRevenue = validResults.reduce((sum, result) => sum + (result.scenarios?.aggressive?.monthlyRevenue || (result.suggestedPrice * result.estimatedMonthlySales)), 0);
  const currentProfit = validResults.reduce((sum, result) => sum + result.currentProfit, 0);
  const conservativeProfit = validResults.reduce((sum, result) => sum + (result.scenarios?.conservative?.monthlyIngredientProfit || result.currentProfit), 0);
  const baseProfit = validResults.reduce((sum, result) => sum + (result.scenarios?.base?.monthlyIngredientProfit || result.currentProfit), 0);
  const aggressiveProfit = validResults.reduce((sum, result) => sum + (result.scenarios?.aggressive?.monthlyIngredientProfit || result.currentProfit), 0);
  const deltaOrders = Math.round(baseOrders - currentOrders);
  const deltaOrdersAggressive = Math.round(aggressiveOrders - currentOrders);
  const deltaOrdersConservative = Math.round(conservativeOrders - currentOrders);
  const deltaRevenue = Math.round(baseRevenue - currentRevenue);
  const deltaRevenueAggressive = Math.round(aggressiveRevenue - currentRevenue);
  const deltaRevenueConservative = Math.round(conservativeRevenue - currentRevenue);
  const deltaProfit = Math.round(baseProfit - currentProfit);
  const deltaProfitAggressive = Math.round(aggressiveProfit - currentProfit);
  const deltaProfitConservative = Math.round(conservativeProfit - currentProfit);
  const profitDeltaTone = deltaProfit > 0 ? 'text-emerald-700' : deltaProfit < 0 ? 'text-amber-700' : 'text-stone-500';
  const summaryTone = deltaProfit > 0 ? 'bg-emerald-50 text-emerald-900' : deltaProfit < 0 ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-slate-700';
  const summaryText = deltaOrdersAggressive > deltaOrders
    ? "Le scénario agressif explore une demande plus sensible. Le scénario base reste la lecture principale pour piloter la carte."
    : "Le scénario base reste la meilleure lecture pour arbitrer les prix; l'agressif sert uniquement de test de sensibilité.";
  const metrics = [
    { label: 'Commandes / mois', current: currentOrders, conservative: conservativeOrders, base: baseOrders, aggressive: aggressiveOrders, formatter: value => `${Math.round(value).toLocaleString()}` },
    { label: 'CA mensuel', current: currentRevenue, conservative: conservativeRevenue, base: baseRevenue, aggressive: aggressiveRevenue, formatter: value => `${Math.round(value).toLocaleString()} FCFA` },
    { label: 'Profit ingredient', current: currentProfit, conservative: conservativeProfit, base: baseProfit, aggressive: aggressiveProfit, formatter: value => `${Math.round(value).toLocaleString()} FCFA` },
  ];
  const figureMax = Math.max(...metrics.flatMap(metric => [metric.current, metric.conservative, metric.base, metric.aggressive]), 1);
  const metricCard = (label, value, currentValue, tone, isBase = false) => {
    const delta = value - currentValue;
    const width = Math.max(8, Math.round((value / figureMax) * 100));
    return `
      <div class="rounded-xl border ${isBase ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'} p-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold ${isBase ? 'text-emerald-900' : 'text-slate-800'}">${label}</span>
          <span class="text-xs font-semibold ${tone}">${delta >= 0 ? '+' : ''}${Math.round(delta).toLocaleString()}</span>
        </div>
        <div class="mt-2 h-2 rounded-full bg-stone-100">
          <div class="h-2 rounded-full ${isBase ? 'bg-emerald-500' : tone === 'text-amber-700' ? 'bg-amber-500' : 'bg-slate-400'}" style="width:${width}%"></div>
        </div>
        <div class="mt-2 text-lg font-black text-slate-900">${value.toLocaleString()}</div>
      </div>`;
  };

  return `
    <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="menu-gain-title">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h4 id="menu-gain-title" class="text-xl font-bold text-slate-900">Impact estime sur l'ensemble du bar</h4>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-stone-600">Le visuel compare les trois scénarios en mensuel sur les commandes, le chiffre d'affaires et le profit ingredient. La lecture base est la reference principale.</p>
        </div>
        <div class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${summaryTone}">
          Base commandes ${deltaOrders >= 0 ? '+' : ''}${deltaOrders.toLocaleString()} · Base profit ${deltaProfit >= 0 ? '+' : ''}${deltaProfit.toLocaleString()} FCFA
        </div>
      </div>

      <div class="mt-5 space-y-4">
        ${metrics.map(metric => `
          <div class="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div class="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div class="text-sm font-semibold text-slate-900">${metric.label}</div>
              <div class="mt-1 text-xs text-stone-500">Estimation mensuelle</div>
            </div>
            ${metricCard("Aujourd'hui", metric.current, metric.current, 'text-slate-500')}
            ${metricCard('Base', metric.base, metric.current, 'text-emerald-700', true)}
            ${metricCard('Agressif', metric.aggressive, metric.current, 'text-amber-700')}
          </div>
        `).join('')}
      </div>

      <div class="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <p class="text-sm leading-6 text-stone-700">${summaryText}</p>
        <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Estimation scenario-based. Les chiffres sont des ordres de grandeur, pas une certitude.</p>
      </div>
    </section>`;
}

function generateMenu() {
  const container = dom.get('menu-summary');
  if (!container) {
    _msg("Erreur : impossible d'afficher le résumé du menu.", 'error');
    return;
  }

  if (state.selected.length === 0) {
    container.innerHTML = "<p class='text-center text-gray-500 italic py-4'>Aucun cocktail sélectionné.</p>";
    return;
  }

  const personsPerWeek = +(dom.get('persons-per-week-input')?.value) || 0;
  const attachRatePct  = +(dom.get('attach-rate-input')?.value) || 0;
  const cocktailsPerBuyer = +(dom.get('cocktails-per-buyer-input')?.value) || 1.3;
  const venueType = dom.get('venue-type-input')?.value || 'bar';

  if (!personsPerWeek || !attachRatePct) {
    toggleSalesErrors(true);
    _msg('Indiquez le nombre de clients par semaine et le pourcentage qui commandent un cocktail.', 'error');
    return;
  }
  toggleSalesErrors(false);

  // Volume mensuel = personnes/sem × 4 × taux% × cocktails/acheteur
  const monthlyPersons  = personsPerWeek * 4;
  const monthlyBuyers   = monthlyPersons * (attachRatePct / 100);
  const monthlyTotal    = Math.round(monthlyBuyers * cocktailsPerBuyer);
  const attachRate      = attachRatePct; // keep as % for benchmark
  const manualRevenue   = 0; // removed from UI; kept for backward-compat in export

  const summary = { cocktails: [] };
  state.selected.forEach(cocktail => {
    const cost = _calcCost(cocktail, _masterIngredients);
    const price = +cocktail.price || 0;
    const margin = _calcMargin(price, cost);
    summary.cocktails.push({
      name: cocktail.name,
      cost,
      price,
      margin,
      popularity: +cocktail.popularity || 0,
      contributionValue: Math.round(price - cost),
    });
  });

  const popSum = summary.cocktails.reduce((s, c) => s + c.popularity, 0) || 1;
  let totalRevenue = 0;
  let totalProfit = 0;

  summary.cocktails.forEach(c => {
    const estimatedMonthlySales = Math.round(monthlyTotal * (c.popularity / popSum));
    c.estimatedMonthlySales = estimatedMonthlySales;
    c.estimatedRevenue = estimatedMonthlySales * c.price;
    c.estimatedProfit = estimatedMonthlySales * (c.price - c.cost);
    totalRevenue += c.estimatedRevenue;
    totalProfit += c.estimatedProfit;
  });

  const marginRatio = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  if (manualRevenue > 0) {
    totalRevenue = manualRevenue;
    totalProfit = manualRevenue * marginRatio;
  }

  summary.cocktails.forEach(c => {
    c.revenueShare = totalRevenue > 0 ? (c.estimatedRevenue / totalRevenue) * 100 : 0;
    c.marginStatus = getMarginStatusText(c.margin);
  });

  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const tier = detectVenueTier(summary.cocktails);

  // Use V2 optimizer with venue context for aggressive demand recovery
  // V2 factors in weak attach-rate and weak demand to apply larger price cuts
  const monthlyCovers = personsPerWeek * 4;
  const cocktailsPerBuyerVal = cocktailsPerBuyer;
  const optimizerResults = _buildPricingOptimizerResultsV2(summary.cocktails, {
    venueType,
    monthlyCovers,
    cocktailAttachRate: attachRatePct / 100,
    avgCocktailsPerBuyer: cocktailsPerBuyerVal,
    monthlyCocktails: monthlyTotal,
    sourceLabels: ['cameroon', 'live-app'],
    competitorBenchmarks: [],
  });

  // Pull V2 venue context from the first valid result item for the diagnosis card.
  // The V2 optimizer attaches venueHealthBand, bottleneck, and secondaryBottleneck
  // to every result; all items share the same venue context so any one is sufficient.
  const firstV2 = optimizerResults.find(r => r.status === 'ok') || {};
  const diag = buildVenueDiagnosis({
    monthlyTotal,
    attachRate,
    personsPerWeek,
    cocktailsPerBuyer,
    venueType,
    tier,
    venueHealthBand:      firstV2.venueHealthBand      || 'bad',
    primaryBottleneck:    firstV2.bottleneck            || 'balanced',
    secondaryBottleneck:  firstV2.secondaryBottleneck   || null,
  });

  // Totals for profit bar
  // V2 optimizer returns estimatedRecommendedProfit directly (not in scenarios.base)
  const totalProfitAfter = optimizerResults
    .filter(r => r.status === 'ok')
    .reduce((sum, r) => sum + (r.estimatedRecommendedProfit || r.scenarios?.base?.monthlyIngredientProfit || 0), 0);
  // Current profit = (current price - cost) × estimated monthly sales
  const totalProfitBefore = optimizerResults
    .filter(r => r.status === 'ok')
    .reduce((sum, r) => sum + ((r.currentPrice - r.cost) * r.estimatedMonthlySales || 0), 0);
  const totalProfitGain = Math.round(totalProfitAfter - totalProfitBefore);
  const totalProfitGainPct = totalProfitBefore > 0
    ? Math.round((totalProfitGain / totalProfitBefore) * 100)
    : 0;

  container.innerHTML = `
    <div class="space-y-5">

      <!-- DIAGNOSTIC VENUE : trafic / conversion / répétition / volume -->
      <section class="rounded-2xl border ${diag.cardBorder} p-5 shadow-sm" aria-labelledby="benchmark-title">
        <h3 id="benchmark-title" class="text-lg font-bold text-slate-900">Diagnostic — ${diag.venueLabel} ${diag.tierLabel}</h3>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl bg-white/80 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Trafic mensuel</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">${diag.monthlyCovers.toLocaleString()}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-bold ${diag.trafficBadge}">${diag.trafficSignal}</span>
            </div>
            <div class="mt-1 text-xs text-stone-500">passages estimés / mois</div>
          </div>
          <div class="rounded-xl bg-white/80 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Conversion cocktail</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">${diag.attachRate}%</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-bold ${diag.conversionBadge}">${diag.conversionSignal}</span>
            </div>
            <div class="mt-1 text-xs text-stone-500">des clients choisissent un cocktail (repère directionnel, dépend du profil client)</div>
          </div>
          <div class="rounded-xl bg-white/80 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Intensité de répétition</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">${diag.cocktailsPerBuyer.toFixed(1)}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-bold ${diag.repeatBadge}">${diag.repeatSignal}</span>
            </div>
            <div class="mt-1 text-xs text-stone-500">cocktails / acheteur par visite</div>
          </div>
          <div class="rounded-xl bg-white/80 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Volume cocktail résultant</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">${diag.monthlyTotal.toLocaleString()}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-bold ${diag.volumeBadge}">${diag.volumeSignal}</span>
            </div>
            <div class="mt-1 text-xs text-stone-500">cocktails vendus / mois (résultat des 3 facteurs ci-dessus)</div>
          </div>
        </div>
        <p class="mt-4 text-sm font-medium leading-6 text-slate-800" style="white-space: pre-line;">${diag.diagnosisText}</p>
      </section>

      <!-- RÉSUMÉ DE LA CARTE : coût / prix / marge / ventes / CA / profit par cocktail -->
      ${buildMenuSummaryTable(summary.cocktails, totalRevenue, totalProfit)}

      <!-- TABLEAU PRINCIPAL : mockup-driven -->
      <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="rebalance-title">
        <h3 id="rebalance-title" class="text-2xl font-bold text-slate-900">Rebalancement du menu</h3>
        <p class="mt-1 text-sm leading-6 text-stone-600">Trié par impact sur le profit. Le tableau montre l'ancien prix, le nouveau prix, l'ancienne marge, la nouvelle marge et l'impact mensuel estimé.</p>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full overflow-hidden rounded-xl">
            <thead class="bg-stone-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Cocktail (demande)</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Ancien prix</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Nouveau prix</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Ancienne marge</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Nouvelle marge</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Impact commandes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Impact profit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 bg-white">
              ${buildOptimizerRows(optimizerResults)}
            </tbody>
          </table>
        </div>

        ${buildProfitBar(totalProfitBefore, totalProfitAfter, totalProfitGain, totalProfitGainPct)}

        <div class="mt-5">
          <button type="button" onclick="this.nextElementSibling.classList.toggle('hidden'); this.textContent = this.nextElementSibling.classList.contains('hidden') ? 'Voir les raisons de chaque recommandation' : 'Masquer les raisons';" class="text-sm font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900">
            Voir les raisons de chaque recommandation
          </button>
          <div class="hidden mt-4 space-y-3">
            ${buildOptimizerDetails(optimizerResults)}
          </div>
        </div>
      </section>

    </div>`;

  dom.get('summary-step')?.classList.remove('hidden');
  container.classList.remove('hidden');
  dom.get('export-section')?.classList.remove('hidden');
}

async function exportMenu() {
  const btn = document.querySelector('#export-section button');
  const originalTxt = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading">Enregistrement...</span>';

  try {
    if (!state.selected.length) throw new Error('Sélectionnez au moins un cocktail.');

    const personsWeek   = +(dom.get('persons-per-week-input')?.value) || 0;
    const attachPct     = +(dom.get('attach-rate-input')?.value) || 0;
    const cPerBuyer     = +(dom.get('cocktails-per-buyer-input')?.value) || 1.3;
    const grossRev      = 0;
    const monthlyCocktails = Math.round(personsWeek * 4 * (attachPct / 100) * cPerBuyer);

    const rows = state.selected.map(c => {
      const cost = _calcCost(c, _masterIngredients);
      const price = +c.price || 0;
      const margin = _calcMargin(price, cost);
      return {
        name: c.name,
        price,
        cost,
        margin,
        popularity: +c.popularity || 0,
        ingredients: c.ingredients.map(i => ({
          name: i.name,
          volume: i.volume,
          unit: _masterIngredients[i.name]?.unitServed || 'cl',
          price: _masterIngredients[i.name]?.price || 0,
        })),
      };
    });

    const totals = rows.reduce((m, r) => {
      m.totalRevenue += r.price;
      m.totalCost += r.cost;
      return m;
    }, { totalRevenue: 0, totalCost: 0 });
    totals.totalProfit = totals.totalRevenue - totals.totalCost;
    totals.overallMargin = totals.totalRevenue ? totals.totalProfit / totals.totalRevenue : 0;

    const code = _genCode();
    const body = {
      code,
      payload: {
        cocktails: rows,
        meta: { ...totals, grossRevenue: grossRev, personsPerWeek: personsWeek, attachRatePct: attachPct, cocktailsPerBuyer: cPerBuyer, monthlyCocktails },
        timestamp: new Date().toISOString(),
      },
    };

    const resp = await fetch(_config.ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Erreur serveur (${resp.status})`);

    _msg(`Analyse sauvegardée. Code : ${code}`, 'success');
    setTimeout(() => {
      window.open(`https://wa.me/${_config.WHATSAPP_NUMBER}?text=Votre%20code%20${code}`, '_blank');
    }, _config.WHATSAPP_REDIRECT_DELAY);
  } catch (err) {
    console.error(err);
    _msg(err.message || 'Erreur inconnue', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalTxt;
  }
}

function startApp() {
  dom.clear();

  ['selection-step', 'cocktail-list'].forEach(id => {
    const el = dom.get(id);
    if (el) {
      el.classList.remove('hidden');
    }
  });

  dom.get('intro-section')?.classList.add('hidden');
  dom.get('selection-step')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const cocktailWrap = document.getElementById('cocktail-list');
    if (cocktailWrap && !cocktailWrap.contains(event.target)) {
      closeCocktailSuggestions();
    }
  });
}

state.onChange(() => {
  _searchUiState.ingredients = {};
  renderSelected();
  renderCocktailList();
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    renderCocktailList();
    renderSelected();
  });
}

if (typeof window !== 'undefined') {
  window.startApp = startApp;
  window.exportMenu = exportMenu;
  window.generateMenu = generateMenu;
  window.toggleAdvancedSales = toggleAdvancedSales;
  window.addCocktail = addCocktail;
  window.addCustomCocktail = addCustomCocktail;
  window.removeCocktail = removeCocktail;
  window.updateCocktailPrice = updateCocktailPrice;
  window.updateCocktailPopularity = updateCocktailPopularity;
  window.updateCocktailName = updateCocktailName;
  window.updateIngredient = updateIngredient;
  window.addNewIngredient = addNewIngredient;
  window.removeIngredient = removeIngredient;
  window.updateIngredientUnitServed = updateIngredientUnitServed;
  window.updateIngredientMasterData = updateIngredientMasterData;
  window.updateMasterIngredient = updateMasterIngredient;
  window.updateIngredientPrice = updateIngredientPrice;
  window.updateCocktailSearch = updateCocktailSearch;
  window.focusCocktailSearch = focusCocktailSearch;
  window.handleCocktailSearchKeydown = handleCocktailSearchKeydown;
  window.selectCocktailSuggestionByIndex = selectCocktailSuggestionByIndex;
  window.handleIngredientNameInput = handleIngredientNameInput;
  window.handleIngredientNameFocus = handleIngredientNameFocus;
  window.handleIngredientNameKeydown = handleIngredientNameKeydown;
  window.handleIngredientNameBlur = handleIngredientNameBlur;
  window.selectIngredientSuggestion = selectIngredientSuggestion;
  window.DOM = dom;
}

if (typeof module !== 'undefined') {
  module.exports = {
    calcTotalCost: calcTotalCostForSelection,
    generateMenu,
    renderCocktailList,
    renderSelected,
    addCocktail,
    addCustomCocktail,
    updateCocktailName,
    removeCocktail,
    exportMenu,
    startApp,
    isSelected,
    updateCocktailPrice,
    updateCocktailPopularity,
    updateIngredient,
    addNewIngredient,
    removeIngredient,
    updateIngredientUnitServed,
    updateIngredientMasterData,
    updateMasterIngredient,
    updateIngredientPrice,
    __getState: () => state,
  };
}

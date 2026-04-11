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
      <span class="text-xs text-stone-500">Popularite ${item.popularity || 0}/5</span>
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
        <p class="mt-2 text-sm leading-6 text-stone-600">Tapez pour filtrer la liste, puis validez avec les fleches et la touche Entrer.</p>
      </div>
      <div class="flex lg:pt-8">
        <button type="button" onclick="addCustomCocktail()" class="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-stone-50 lg:w-auto">
          Creer un cocktail personnalise
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
  dom.get('weekday-error')?.classList.toggle('hidden', !show);
  dom.get('weekend-error')?.classList.toggle('hidden', !show);
}

function getMarginStatusText(margin) {
  if (margin > _config.MARGIN_HIGH) return 'Marge haute';
  if (margin >= _config.MARGIN_GOOD) return 'Marge saine';
  return 'Marge fragile';
}

function buildRecommendation(overallMargin, strongestCocktail, weakestCocktail, dominantCocktail) {
  const parts = [];

  if (weakestCocktail) {
    parts.push(`A surveiller en premier: ${weakestCocktail.name} avec une marge de ${weakestCocktail.margin}%.`);
  }

  if (dominantCocktail && dominantCocktail.revenueShare > _config.REVENUE_SHARE_HIGHLIGHT) {
    parts.push(`${dominantCocktail.name} porte ${dominantCocktail.revenueShare.toFixed(1)}% du chiffre d'affaires estime.`);
  }

  if (overallMargin > _config.OVERALL_MARGIN_HIGH) {
    parts.push("Votre marge globale parait elevee. Quand les prix sont trop hauts, certains clients commandent moins souvent. Baisser legerement certains prix peut aider a vendre plus souvent et a augmenter le profit mensuel.");
  } else if (overallMargin < _config.OVERALL_MARGIN_GOOD) {
    parts.push('Votre marge globale parait faible. Revoyez les recettes ou les prix des cocktails les moins rentables.');
  } else {
    parts.push('Votre marge globale reste dans une zone plutot saine pour piloter la carte.');
  }

  if (strongestCocktail) {
    parts.push(`Point fort actuel: ${strongestCocktail.name} affiche ${strongestCocktail.margin}% de marge.`);
  }

  return parts.join(' ');
}

function buildOptimizerRows(results) {
  return results.map(result => {
    if (result.status === 'warning') {
      return `
        <tr class="bg-amber-50">
          <td class="px-4 py-4 text-sm font-semibold text-slate-900">${result.name}</td>
          <td class="px-4 py-4 text-sm text-stone-600" colspan="7">${result.warning}</td>
        </tr>`;
    }

    const deltaTone = result.priceDeltaValue > 0
      ? 'text-amber-700'
      : result.priceDeltaValue < 0
        ? 'text-teal-700'
        : 'text-slate-700';
    const actionTone = result.recommendedAction === 'Augmenter un peu'
      ? 'bg-amber-100 text-amber-900'
      : result.recommendedAction === 'Augmenter ou revoir'
        ? 'bg-rose-100 text-rose-900'
        : result.recommendedAction.includes('Baisser')
          ? 'bg-teal-100 text-teal-900'
          : 'bg-stone-100 text-slate-800';

    const shortReason = result.menuClass === 'Plow Horse'
      ? 'Bon volume, marge faible.'
      : result.menuClass === 'Puzzle'
        ? 'Bonne marge, traction faible.'
        : result.menuClass === 'Dog'
          ? 'Faible traction et faible marge.'
          : 'Cocktail globalement sain.';

    return `
      <tr class="align-top hover:bg-stone-50">
        <td class="px-4 py-4 text-sm font-semibold text-slate-900">${result.name}</td>
        <td class="px-4 py-4 text-sm text-slate-700">${result.currentPrice} FCFA</td>
        <td class="px-4 py-4 text-sm text-slate-700">${Math.round(result.cost)} FCFA</td>
        <td class="px-4 py-4 text-sm">
          <div class="font-semibold ${_colors.getMarginColor(result.marginPercent)}">${result.marginPercent}%</div>
          <div class="text-xs text-stone-500">${result.menuClass} · ${result.sensitivityBand}</div>
        </td>
        <td class="px-4 py-4 text-sm">
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionTone}">${result.recommendedAction}</span>
        </td>
        <td class="px-4 py-4 text-sm font-semibold text-slate-900">${result.suggestedPrice} FCFA</td>
        <td class="px-4 py-4 text-sm ${deltaTone}">${result.priceDeltaValue > 0 ? '+' : ''}${result.priceDeltaValue} FCFA</td>
        <td class="px-4 py-4 text-sm text-stone-700">
          <div class="font-medium text-slate-800">${shortReason}</div>
          <div class="mt-1 text-xs text-stone-500">${result.expectedProfitDirection} · ${result.expectedDemandDirection}</div>
          <div class="mt-1 text-xs font-medium ${result.estimatedOrderDelta > 0 ? 'text-teal-700' : result.estimatedOrderDelta < 0 ? 'text-amber-700' : 'text-stone-500'}">
            Commandes/mois ${result.estimatedOrderDelta > 0 ? '+' : ''}${Math.round(result.estimatedOrderDelta * 100)}% · ${result.estimatedMonthlySales} -> ${result.estimatedRecommendedSales}
          </div>
          <details class="mt-2">
            <summary class="cursor-pointer text-xs font-semibold text-teal-700">Pourquoi ?</summary>
            <div class="mt-2 max-w-[24rem] text-xs leading-5 text-stone-600">${result.reasonFr}</div>
          </details>
        </td>
      </tr>`;
  }).join('');
}

function buildGainCurveCard(result) {
  if (result.status === 'warning') return '';
  const profits = result.gainCurve.map(point => point.profit);
  const maxProfit = Math.max(...profits, 1);
  const width = 220;
  const height = 64;
  const points = result.gainCurve.map((point, index) => {
    const x = index * (width / (result.gainCurve.length - 1 || 1));
    const y = height - ((point.profit / maxProfit) * (height - 8)) - 4;
    return { ...point, x, y };
  });
  const polyline = points.map(point => `${point.x},${point.y}`).join(' ');

  return `
    <article class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h4 class="text-sm font-semibold text-slate-900">${result.name}</h4>
          <p class="mt-1 text-xs leading-5 text-stone-600">Petit repere visuel du profit mensuel estime entre le prix actuel, le prix recommande et une borne de test prudente.</p>
        </div>
        <div class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">${result.menuClass}</div>
      </div>
      <svg class="mt-4 h-20 w-full" viewBox="0 0 220 72" role="img" aria-label="Courbe simple des gains estimes pour ${result.name}">
        <polyline fill="none" stroke="#0f766e" stroke-width="3" points="${polyline}" />
        ${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#f59e0b"></circle>`).join('')}
      </svg>
      <div class="mt-3 grid gap-2 sm:grid-cols-3">
        ${result.gainCurve.map(point => `
          <div class="rounded-lg bg-stone-50 p-3">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">${point.label}</div>
            <div class="mt-1 text-sm font-semibold text-slate-900">${point.price} FCFA</div>
            <div class="mt-1 text-xs text-stone-600">${Math.round(point.profit).toLocaleString()} FCFA de profit estime</div>
          </div>`).join('')}
      </div>
    </article>`;
}

function buildMenuGainSummary(results) {
  const validResults = results.filter(result => result.status === 'ok');
  if (!validResults.length) return '';

  const currentOrders = validResults.reduce((sum, result) => sum + result.estimatedMonthlySales, 0);
  const recommendedOrders = validResults.reduce((sum, result) => sum + (result.estimatedRecommendedSales || result.estimatedMonthlySales), 0);
  const currentRevenue = validResults.reduce((sum, result) => sum + (result.currentPrice * result.estimatedMonthlySales), 0);
  const recommendedRevenue = validResults.reduce((sum, result) => sum + (result.estimatedRecommendedRevenue || (result.suggestedPrice * result.estimatedRecommendedSales)), 0);
  const currentProfit = validResults.reduce((sum, result) => sum + result.currentProfit, 0);
  const recommendedProfit = validResults.reduce((sum, result) => sum + result.estimatedRecommendedProfit, 0);
  const deltaOrders = Math.round(recommendedOrders - currentOrders);
  const deltaRevenue = Math.round(recommendedRevenue - currentRevenue);
  const deltaProfit = Math.round(recommendedProfit - currentProfit);
  const orderDeltaPct = currentOrders > 0 ? ((recommendedOrders - currentOrders) / currentOrders) * 100 : 0;
  const revenueDeltaPct = currentRevenue > 0 ? ((recommendedRevenue - currentRevenue) / currentRevenue) * 100 : 0;
  const profitDeltaPct = currentProfit > 0 ? ((recommendedProfit - currentProfit) / currentProfit) * 100 : 0;
  const summaryTone = deltaProfit > 0 ? 'bg-emerald-50 text-emerald-900' : deltaProfit < 0 ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-slate-700';
  const orderDeltaTone = deltaOrders > 0 ? 'text-teal-700' : deltaOrders < 0 ? 'text-amber-700' : 'text-slate-700';
  const revenueDeltaTone = deltaRevenue > 0 ? 'text-amber-700' : deltaRevenue < 0 ? 'text-rose-700' : 'text-slate-700';
  const profitDeltaTone = deltaProfit > 0 ? 'text-emerald-700' : deltaProfit < 0 ? 'text-amber-700' : 'text-slate-700';
  const summaryText = deltaOrders > 0 && deltaProfit > 0
    ? 'La recommandation combine ici deux effets attendus: davantage de commandes et plus de profit ingredient.'
    : deltaOrders <= 0 && deltaProfit > 0
      ? 'Ici, le levier principal vient surtout du meilleur prix moyen et du profit unitaire, pas d\'une hausse de volume.'
      : deltaOrders > 0 && deltaProfit <= 0
        ? 'Ici, la priorite est plutot de relancer le volume. Le profit se lit donc avec prudence.'
        : 'Sur cette selection, le moteur suggere peu de mouvements utiles a grande echelle.';
  const metrics = [
    { label: 'Commandes/mois', before: currentOrders, after: recommendedOrders, delta: deltaOrders, accent: '#0f766e', formatter: value => `${Math.round(value).toLocaleString()}` },
    { label: 'CA mensuel', before: currentRevenue, after: recommendedRevenue, delta: deltaRevenue, accent: '#f59e0b', formatter: value => `${Math.round(value).toLocaleString()} FCFA` },
    { label: 'Profit ingredient', before: currentProfit, after: recommendedProfit, delta: deltaProfit, accent: '#2563eb', formatter: value => `${Math.round(value).toLocaleString()} FCFA` },
  ];
  const figureMax = Math.max(...metrics.flatMap(metric => [metric.before, metric.after]), 1);
  const figureRows = metrics.map((metric, index) => {
    const y = 50 + (index * 78);
    const beforeX = 190 + ((metric.before / figureMax) * 290);
    const afterX = 190 + ((metric.after / figureMax) * 290);
    const deltaSuffix = metric.label === 'Commandes/mois' ? '' : ' FCFA';
    const chipX = Math.min(beforeX, afterX) + (Math.abs(afterX - beforeX) / 2) - 55;

    return `
      <g>
        <text x="16" y="${y - 12}" fill="#334155" font-size="13" font-weight="700">${metric.label}</text>
        <text x="16" y="${y + 10}" fill="#78716c" font-size="12">${metric.formatter(metric.before)}</text>
        <line x1="${beforeX}" y1="${y}" x2="${afterX}" y2="${y}" stroke="${metric.accent}" stroke-width="8" stroke-linecap="round" opacity="0.28"></line>
        <circle cx="${beforeX}" cy="${y}" r="9" fill="#ffffff" stroke="${metric.accent}" stroke-width="3"></circle>
        <circle cx="${afterX}" cy="${y}" r="9" fill="${metric.accent}"></circle>
        <text x="${beforeX}" y="${y - 18}" text-anchor="middle" fill="#64748b" font-size="11" font-weight="700">Aujourd'hui</text>
        <text x="${afterX}" y="${y - 18}" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="700">Apres</text>
        <text x="${afterX + 16}" y="${y + 5}" fill="#0f172a" font-size="12" font-weight="700">${metric.formatter(metric.after)}</text>
        <rect x="${chipX}" y="${y + 15}" width="110" height="22" rx="999" ry="999" fill="#ffffff" stroke="#e2e8f0"></rect>
        <text x="${chipX + 55}" y="${y + 30}" text-anchor="middle" fill="${metric.delta >= 0 ? '#047857' : '#b45309'}" font-size="11" font-weight="700">${metric.delta >= 0 ? '+' : ''}${Math.round(metric.delta).toLocaleString()}${deltaSuffix}</text>
      </g>`;
  }).join('');

  return `
    <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="menu-gain-title">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h4 id="menu-gain-title" class="text-xl font-bold text-slate-900">Impact estime sur l'ensemble du bar</h4>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-stone-600">Avant / apres, rien de plus. Le visuel compare seulement les commandes estimees, le chiffre d'affaires mensuel et le profit ingredient du bar.</p>
        </div>
        <div class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${summaryTone}">
          Commandes ${deltaOrders >= 0 ? '+' : ''}${deltaOrders.toLocaleString()} · Profit ${deltaProfit >= 0 ? '+' : ''}${deltaProfit.toLocaleString()} FCFA
        </div>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div class="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <svg class="h-[290px] w-full" viewBox="0 0 520 220" role="img" aria-label="Comparaison avant apres des commandes, du chiffre d'affaires et du profit ingredient du bar">
            <text x="190" y="24" fill="#64748b" font-size="12" font-weight="700">Aujourd'hui</text>
            <text x="430" y="24" fill="#0f172a" font-size="12" font-weight="700">Apres ajustement</text>
            <line x1="190" y1="32" x2="480" y2="32" stroke="#e7e5e4" stroke-width="2" stroke-dasharray="4 4"></line>
            ${figureRows}
          </svg>
        </div>

        <div class="space-y-3">
          <div class="rounded-2xl border border-stone-200 bg-white p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Aujourd'hui</div>
            <div class="mt-3 text-2xl font-black text-slate-900">${Math.round(currentOrders).toLocaleString()}</div>
            <div class="text-xs text-stone-500">Commandes estimees / mois</div>
            <div class="mt-4 text-xl font-bold text-slate-900">${Math.round(currentRevenue).toLocaleString()} FCFA</div>
            <div class="text-xs text-stone-500">CA mensuel estime</div>
            <div class="mt-4 text-xl font-bold text-slate-900">${Math.round(currentProfit).toLocaleString()} FCFA</div>
            <div class="text-xs text-stone-500">Profit ingredient estime</div>
          </div>

          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-emerald-800">Apres ajustement</div>
            <div class="mt-3 text-2xl font-black text-slate-900">${Math.round(recommendedOrders).toLocaleString()}</div>
            <div class="text-xs text-emerald-900">Commandes estimees / mois</div>
            <div class="mt-4 text-xl font-bold text-slate-900">${Math.round(recommendedRevenue).toLocaleString()} FCFA</div>
            <div class="text-xs text-emerald-900">CA mensuel estime</div>
            <div class="mt-4 text-xl font-bold text-slate-900">${Math.round(recommendedProfit).toLocaleString()} FCFA</div>
            <div class="text-xs text-emerald-900">Profit ingredient estime</div>
          </div>

          <div class="rounded-2xl border border-stone-200 bg-white p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Variation attendue</div>
            <div class="mt-3 space-y-2 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-stone-600">Commandes</span>
                <span class="font-semibold ${orderDeltaTone}">${deltaOrders >= 0 ? '+' : ''}${deltaOrders.toLocaleString()} (${orderDeltaPct >= 0 ? '+' : ''}${orderDeltaPct.toFixed(1)}%)</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-stone-600">CA</span>
                <span class="font-semibold ${revenueDeltaTone}">${deltaRevenue >= 0 ? '+' : ''}${deltaRevenue.toLocaleString()} FCFA (${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct.toFixed(1)}%)</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-stone-600">Profit ingredient</span>
                <span class="font-semibold ${profitDeltaTone}">${deltaProfit >= 0 ? '+' : ''}${deltaProfit.toLocaleString()} FCFA (${profitDeltaPct >= 0 ? '+' : ''}${profitDeltaPct.toFixed(1)}%)</span>
              </div>
            </div>
            <p class="mt-4 text-sm leading-6 text-stone-700">${summaryText}</p>
          </div>
        </div>
      </div>
    </section>`;
}

function generateMenu() {
  const container = dom.get('menu-summary');
  if (!container) {
    _msg("Erreur: impossible d'afficher le resume du menu.", 'error');
    return;
  }

  if (state.selected.length === 0) {
    container.innerHTML = "<p class='text-center text-gray-500 italic py-4'>Aucun cocktail selectionne.</p>";
    return;
  }

  const weekend = +(dom.get('weekend-input')?.value) || 0;
  const weekday = +(dom.get('weekday-input')?.value) || 0;

  if (!weekend && !weekday) {
    toggleSalesErrors(true);
    _msg('Indiquez vos ventes en semaine ou le week-end pour generer un resume utile.', 'error');
    return;
  }
  toggleSalesErrors(false);

  const weeklyTotal = weekend * _config.WEEKEND_DAYS + weekday * _config.WEEKDAY_DAYS;
  const monthlyTotal = weeklyTotal * _config.WEEKS_PER_MONTH;
  const manualRevenue = parseInt(dom.get('gross-revenue-input')?.value || '0', 10) || 0;

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
  const marginColor = _colors.getMarginColor(Math.round(overallMargin));
  const strongestCocktail = [...summary.cocktails].sort((a, b) => b.margin - a.margin)[0];
  const weakestCocktail = [...summary.cocktails].sort((a, b) => a.margin - b.margin)[0];
  const dominantCocktail = [...summary.cocktails].sort((a, b) => b.revenueShare - a.revenueShare)[0];
  const recommendation = buildRecommendation(overallMargin, strongestCocktail, weakestCocktail, dominantCocktail);
  const optimizerResults = _buildPricingOptimizerResults(summary.cocktails);
  const menuGainSummary = buildMenuGainSummary(optimizerResults);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 class="text-2xl font-bold text-slate-900">Tableau de pilotage du menu</h3>
            <p class="mt-1 text-sm leading-6 text-stone-600">Utilisez ce resume pour repere les cocktails les plus utiles et ceux a ajuster.</p>
          </div>
          <div class="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Marge globale <span class="${marginColor}">${Math.round(overallMargin)}%</span>
          </div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full overflow-hidden rounded-xl">
            <thead class="bg-stone-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Cocktail</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Prix</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Marge</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Popularite</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Poids dans le CA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 bg-white">
              ${summary.cocktails.map(c => {
                const mc = _colors.getMarginColor(c.margin);
                return `
                  <tr class="hover:bg-stone-50">
                    <td class="px-4 py-4 text-sm font-semibold text-slate-900">${c.name}</td>
                    <td class="px-4 py-4 text-sm text-slate-700">${Math.round(c.price)} FCFA</td>
                    <td class="px-4 py-4 text-sm">
                      <div class="font-semibold ${mc}">${c.margin}%</div>
                      <div class="text-xs text-stone-500">${c.marginStatus} Â· Cout ${Math.round(c.cost)} FCFA</div>
                    </td>
                    <td class="px-4 py-4 text-sm text-slate-700" title="${_tooltip(c.popularity, c.margin)}">${c.popularity}/5</td>
                    <td class="px-4 py-4 text-sm ${c.revenueShare > _config.REVENUE_SHARE_HIGHLIGHT ? 'text-emerald-700 font-semibold' : 'text-slate-700'}">${c.revenueShare.toFixed(1)}%</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-4">
        <div id="monthly-summary" class="rounded-2xl border border-stone-200 bg-amber-50 p-5 shadow-sm">
          <h3 class="text-lg font-bold text-slate-900">Vue mensuelle</h3>
          <div class="mt-4 grid gap-3">
            <div class="rounded-xl bg-white/80 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Cocktails vendus par mois</div>
              <div class="mt-1 text-2xl font-bold text-slate-900">${monthlyTotal}</div>
            </div>
            <div class="rounded-xl bg-white/80 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Chiffre d'affaires mensuel estime</div>
              <div class="mt-1 text-2xl font-bold text-slate-900">${Math.round(manualRevenue > 0 ? manualRevenue : totalRevenue).toLocaleString()} FCFA</div>
            </div>
            <div class="rounded-xl bg-white/80 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-stone-500">Profit mensuel estime</div>
              <div class="mt-1 text-2xl font-bold text-slate-900">${Math.round(totalProfit).toLocaleString()} FCFA</div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 class="text-lg font-bold text-slate-900">Lecture rapide</h3>
          <p class="mt-3 text-sm leading-7 text-stone-700">${recommendation}</p>
        </div>
      </div>
      </div>

      <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="optimizer-title">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 id="optimizer-title" class="text-2xl font-bold text-slate-900">Recommandations de reequilibrage</h3>
            <p class="mt-1 max-w-3xl text-sm leading-6 text-stone-600">Le moteur part du cout ingredient, de la popularite et de la place de chaque cocktail sur la carte. Les ajustements restent prudents pour ne pas casser la perception client.</p>
          </div>
          <div class="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-600">Popularite = indicateur simple de sensibilite au prix</div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full overflow-hidden rounded-xl">
            <thead class="bg-stone-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Cocktail</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Prix actuel</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Cout</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Marge</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Action</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Prix suggere</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Ecart</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Lecture</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 bg-white">
              ${buildOptimizerRows(optimizerResults)}
            </tbody>
          </table>
        </div>

        <div class="mt-5 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          Le tableau reste la source principale de decision. Le repere visuel ci-dessous montre seulement l'effet cumule estime sur l'ensemble du bar.
        </div>

        <div class="mt-5">
          ${menuGainSummary}
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
    if (!state.selected.length) throw new Error('Selectionnez au moins un cocktail.');

    const weekEnd = +(dom.get('weekend-input')?.value) || 0;
    const weekDay = +(dom.get('weekday-input')?.value) || 0;
    const grossRev = +(dom.get('gross-revenue-input')?.value) || 0;
    const monthlyCocktails = weekEnd * _config.WEEKEND_DAYS + weekDay * _config.WEEKDAY_DAYS;

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
        meta: { ...totals, grossRevenue: grossRev, weekdaySales: weekDay, weekendSales: weekEnd, monthlyCocktails },
        timestamp: new Date().toISOString(),
      },
    };

    const resp = await fetch(_config.ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Erreur serveur (${resp.status})`);

    _msg(`Analyse sauvegardee. Code: ${code}`, 'success');
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


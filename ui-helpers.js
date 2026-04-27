// ui-helpers.js - Reusable UI builder functions for classic browser scripts

const DOM = {
  _cache: {},

  get(id) {
    if (!this._cache[id]) {
      this._cache[id] = document.getElementById(id);
    }
    return this._cache[id];
  },

  clear() {
    this._cache = {};
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInfoTooltip(message, label = 'Informations complémentaires') {
  return `
    <span class="info-tooltip" tabindex="0" aria-label="${escapeHtml(label)}">
      <span class="info-tooltip__icon" aria-hidden="true">i</span>
      <span class="info-tooltip__content" role="tooltip">${escapeHtml(message)}</span>
    </span>`;
}

function createButton({ text, className, onClick, title = '', innerHTML = null }) {
  const btn = document.createElement('button');
  btn.className = className;
  if (innerHTML) {
    btn.innerHTML = innerHTML;
  } else {
    btn.textContent = text;
  }
  if (title) btn.title = title;
  btn.onclick = onClick;
  return btn;
}

function createCocktailButton(name, isActive, onClick) {
  const { COLORS } = typeof require !== 'undefined'
    ? require('./config')
    : { COLORS: window.COLORS };

  return createButton({
    text: `${isActive ? 'Sélectionné' : 'Ajouter'} ${name}`,
    className: `font-bold py-3 px-4 rounded-xl m-1 transition-colors duration-150 border border-transparent ${COLORS.getButtonState(isActive)}`,
    title: 'Sélectionnez un cocktail à analyser',
    onClick,
  });
}

function createToggleButton(showAll, onClick) {
  return createButton({
    innerHTML: showAll ? 'Afficher moins de cocktails' : 'Afficher toute la liste des cocktails',
    className: 'w-full bg-stone-100 hover:bg-stone-200 text-gray-800 py-3 px-4 rounded-xl m-1 border border-stone-200',
    onClick,
  });
}

function createAddButton(label, onClick) {
  return createButton({
    innerHTML: `+ ${label}`,
    className: 'bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl m-1 hover:bg-emerald-700',
    onClick,
  });
}

function buildTextInput({ value, onchange, className = 'p-1 border-b', title = '', id = '', ariaLabel = '' }) {
  const escaped = (value || '').toString().replace(/"/g, '&quot;');
  return `<input type="text" value="${escaped}" onchange="${onchange}" class="${className}" title="${title}" ${id ? `id="${id}"` : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>`;
}

function buildAutocompleteTextInput({ value, className = 'p-1 border-b', title = '', id = '', ariaLabel = '', controls = '', expanded = false, activeDescendant = '', oninput = '', onkeydown = '', onfocus = '', onblur = '', autocomplete = 'off' }) {
  const escaped = (value || '').toString().replace(/"/g, '&quot;');
  return `<input type="text" value="${escaped}" class="${className}" title="${title}" ${id ? `id="${id}"` : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} role="combobox" aria-autocomplete="list" ${controls ? `aria-controls="${controls}"` : ''} aria-expanded="${expanded ? 'true' : 'false'}" ${activeDescendant ? `aria-activedescendant="${activeDescendant}"` : ''} autocomplete="${autocomplete}" ${oninput ? `oninput="${oninput}"` : ''} ${onkeydown ? `onkeydown="${onkeydown}"` : ''} ${onfocus ? `onfocus="${onfocus}"` : ''} ${onblur ? `onblur="${onblur}"` : ''}>`;
}

function buildNumberInput({ value, step = 1, onchange, className = 'w-12 p-1 border-b', title = '', id = '', min = '', max = '', ariaLabel = '' }) {
  return `<input type="number" value="${value}" step="${step}" onchange="${onchange}" class="${className}" title="${title}" ${id ? `id="${id}"` : ''} ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>`;
}

function buildSelect({ options, selectedValue, onchange, className = 'w-16 p-1 border-b', title = '', id = '', ariaLabel = '' }) {
  const opts = options.map(opt =>
    `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`
  ).join('');
  return `<select onchange="${onchange}" class="${className}" title="${title}" ${id ? `id="${id}"` : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>${opts}</select>`;
}

function buildUnitSelect(selectedUnit, onchange) {
  return buildSelect({
    options: [
      { value: 'cl', label: 'cl' },
      { value: 'g', label: 'g' },
      { value: 'piece', label: 'pièce' },
    ],
    selectedValue: selectedUnit,
    onchange,
    className: 'rounded-lg border border-stone-300 px-3 py-2',
    ariaLabel: "Unité de service de l'ingrédient",
  });
}

function buildBuyUnitSelect(selectedUnit, onchange) {
  return buildSelect({
    options: [
      { value: 'liter', label: 'L' },
      { value: 'g', label: 'g' },
      { value: 'piece', label: 'pièce' },
    ],
    selectedValue: selectedUnit,
    onchange,
    className: 'rounded-lg border border-stone-300 px-3 py-2',
    ariaLabel: "Unité d'achat de l'ingrédient",
  });
}

function buildIngredientRow(cocktailIdx, ingIdx, ingredient, ingInfo) {
  const info = ingInfo || { unitServed: 'cl', buyVolume: 1, buyUnit: 'liter', price: 0 };
  const prefix = `cocktail-${cocktailIdx}-ingredient-${ingIdx}`;
  const listId = `${prefix}-suggestions`;

  return `
    <div class="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,2fr)_auto]">
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500" for="${prefix}-name">Ingrédient</label>
        <div class="relative">
        ${buildAutocompleteTextInput({
          value: ingredient.name,
          oninput: `handleIngredientNameInput(${cocktailIdx}, ${ingIdx}, this.value)`,
          onkeydown: `handleIngredientNameKeydown(event, ${cocktailIdx}, ${ingIdx})`,
          onfocus: `handleIngredientNameFocus(${cocktailIdx}, ${ingIdx}, this.value)`,
          onblur: `handleIngredientNameBlur(${cocktailIdx}, ${ingIdx})`,
          className: 'w-full rounded-lg border border-stone-300 px-3 py-2',
          title: "Nom de l'ingrédient",
          id: `${prefix}-name`,
          ariaLabel: `Nom de l'ingrédient ${ingIdx + 1} du cocktail ${cocktailIdx + 1}`,
          controls: listId,
        })}
          <div id="${listId}" class="absolute left-0 right-0 top-full z-20 mt-1 hidden max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg" role="listbox"></div>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500" for="${prefix}-volume">Volume par verre</label>
        <div class="flex gap-2">
          ${buildNumberInput({
            value: ingredient.volume,
            step: 0.1,
            onchange: `updateIngredient(${cocktailIdx}, ${ingIdx}, 'volume', parseFloat(this.value))`,
            className: 'w-full rounded-lg border border-stone-300 px-3 py-2',
            title: 'Quantité utilisée dans un verre',
            id: `${prefix}-volume`,
            min: 0,
            ariaLabel: `Volume de l'ingrédient ${ingIdx + 1} du cocktail ${cocktailIdx + 1}`,
          })}
          ${buildUnitSelect(info.unitServed, `updateIngredientUnitServed(${cocktailIdx}, ${ingIdx}, this.value)`)}
        </div>
      </div>

      <div>
        <label class="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500" for="${prefix}-price">
          Achat ingrédient
          ${buildInfoTooltip("Entrez le prix d'achat et la quantité totale achetée pour fiabiliser le coût par verre.", "Aide sur l'achat ingrédient")}
        </label>
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          ${buildNumberInput({
            value: info.price,
            step: 1,
            onchange: `updateIngredientMasterData('${ingredient.name}', 'price', this.value)`,
            className: 'w-full rounded-lg border border-stone-300 px-3 py-2',
            title: "Prix d'achat",
            id: `${prefix}-price`,
            min: 0,
            ariaLabel: `Prix d'achat de l'ingrédient ${ingIdx + 1} du cocktail ${cocktailIdx + 1}`,
          })}
          ${buildNumberInput({
            value: info.buyVolume,
            step: 0.01,
            onchange: `updateIngredientMasterData('${ingredient.name}', 'buyVolume', this.value)`,
            className: 'w-full rounded-lg border border-stone-300 px-3 py-2',
            title: "Quantité achetée",
            id: `${prefix}-buy-volume`,
            min: 0,
            ariaLabel: `Quantité achetée de l'ingrédient ${ingIdx + 1} du cocktail ${cocktailIdx + 1}`,
          })}
          ${buildBuyUnitSelect(info.buyUnit, `updateIngredientMasterData('${ingredient.name}', 'buyUnit', this.value)`)}
        </div>
      </div>

      <div class="flex items-start justify-end">
        <button onclick="removeIngredient(${cocktailIdx}, ${ingIdx})" class="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" title="Supprimer cet ingrédient" aria-label="Supprimer l'ingrédient ${ingredient.name || ingIdx + 1}">
          Supprimer
        </button>
      </div>
    </div>`;
}

function buildCocktailCard(cocktail, index, totalCost, marginPercent, marginColor, ingredientRows) {
  const ingredientCount = cocktail.ingredients.length;
  const ingredientCountLabel = `${ingredientCount} ingrédient${ingredientCount > 1 ? 's' : ''}`;
  const marginLabel = marginPercent >= 75 && marginPercent <= 90
    ? 'Marge saine'
    : marginPercent > 90
      ? 'Marge haute'
      : 'Marge fragile';

  return `
    <article class="bg-white rounded-[20px] p-4 mb-4 border border-stone-200 shadow-sm sm:p-5" aria-labelledby="cocktail-title-${index}">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Identité du cocktail</p>
          <label class="sr-only" for="cocktail-name-${index}">Nom du cocktail</label>
          ${buildTextInput({
            value: cocktail.name,
            onchange: `updateCocktailName(${index}, this.value)`,
            className: 'mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-lg font-semibold text-slate-900',
            id: `cocktail-name-${index}`,
            ariaLabel: `Nom du cocktail ${index + 1}`,
          })}
        </div>
        <button onclick="removeCocktail(${index})" class="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" title="Supprimer ce cocktail de votre sélection" aria-label="Supprimer le cocktail ${cocktail.name || index + 1}">
          Retirer
        </button>
      </div>

      <section class="mt-4" aria-labelledby="ingredients-title-${index}">
        <details class="recipe-expander rounded-2xl border border-stone-200 bg-stone-50">
          <summary class="recipe-expander__summary">
            <div>
              <h3 id="ingredients-title-${index}" class="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Recette et achats</h3>
              <p class="mt-1 text-sm leading-6 text-stone-600">${ingredientCountLabel}. Ouvrez pour modifier la recette et les achats.</p>
            </div>
            <span class="recipe-expander__chevron" aria-hidden="true">
              <i class="fa-solid fa-chevron-down"></i>
            </span>
          </summary>
          <div class="recipe-expander__body">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <p class="text-sm leading-6 text-stone-600">Vérifiez les quantités et les achats. Les calculs se mettent à jour automatiquement.</p>
              <button onclick="addNewIngredient(${index})" class="text-sm font-semibold text-teal-700 hover:text-teal-800" title="Ajoutez un nouvel ingrédient à ce cocktail">
                + Ajouter un ingrédient
              </button>
            </div>
            <div id="ingredients-${index}" class="mt-4 space-y-3">
              ${ingredientRows}
            </div>
          </div>
        </details>
      </section>

      <section class="mt-5" aria-labelledby="pricing-title-${index}">
        <h3 id="pricing-title-${index}" class="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Prix et popularité</h3>
        <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900" for="cocktail-price-${index}">
              Prix de vente (FCFA)
              ${buildInfoTooltip("Entrez le prix réellement affiché à la carte.", "Aide sur le prix de vente")}
            </label>
            ${buildNumberInput({
              value: cocktail.price,
              onchange: `updateCocktailPrice(${index}, parseInt(this.value))`,
              className: 'w-full rounded-xl border border-stone-300 px-3 py-3',
              id: `cocktail-price-${index}`,
              min: 0,
              ariaLabel: `Prix de vente du cocktail ${index + 1}`,
            })}
          </div>
          <div>
            <label class="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900" for="cocktail-popularity-${index}">
              Popularité (1 à 5)
              ${buildInfoTooltip("1 = rarement commandé, 5 = très souvent commandé.", "Aide sur la popularité")}
            </label>
            <input type="number" min="1" max="5" value="${cocktail.popularity}"
                 title="Popularité du cocktail"
                 onchange="updateCocktailPopularity(${index}, parseInt(this.value))"
                 id="cocktail-popularity-${index}"
                 aria-label="Popularité du cocktail ${index + 1}"
                 class="w-full rounded-xl border border-stone-300 px-3 py-3">
          </div>
        </div>
      </section>

      <section class="mt-5 border-t border-stone-200 pt-4" aria-labelledby="profitability-title-${index}">
        <h3 id="profitability-title-${index}" class="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Rentabilité</h3>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-stone-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Coût par verre</p>
            <p class="mt-1 text-lg font-bold text-slate-900"><span class="cost-amount">${Math.round(totalCost)}</span> FCFA</p>
          </div>
          <div class="rounded-xl bg-stone-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Prix de vente</p>
            <p class="mt-1 text-lg font-bold text-slate-900">${Math.round(cocktail.price)} FCFA</p>
          </div>
          <div class="rounded-xl bg-stone-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Marge estimée</p>
            <p class="mt-1 text-lg font-bold ${marginColor}"><span class="margin-percentage">${marginPercent}</span>%</p>
            <p class="mt-1 text-xs text-stone-600">${marginLabel}</p>
          </div>
        </div>
      </section>
    </article>`;
}

function displayMessage(message, type = 'info') {
  const messageBox = document.createElement('div');
  const isError = type === 'error';
  messageBox.className = `message-box fixed left-4 right-4 top-4 z-[1100] rounded-xl border-l-4 p-4 shadow-lg sm:left-auto sm:right-4 sm:w-[28rem] ${
    isError
      ? 'border-red-700 bg-red-50 text-red-800'
      : 'border-blue-700 bg-blue-50 text-blue-800'
  }`;
  messageBox.role = 'alert';

  const p = document.createElement('p');
  p.textContent = message;
  messageBox.appendChild(p);
  document.body.appendChild(messageBox);

  const { CONFIG: cfg } = typeof require !== 'undefined'
    ? require('./config')
    : { CONFIG: window.CONFIG };
  setTimeout(() => messageBox.remove(), cfg.MESSAGE_TIMEOUT);
}

if (typeof window !== 'undefined') {
  window.DOM = DOM;
  window.createButton = createButton;
  window.createCocktailButton = createCocktailButton;
  window.createToggleButton = createToggleButton;
  window.createAddButton = createAddButton;
  window.buildTextInput = buildTextInput;
  window.buildAutocompleteTextInput = buildAutocompleteTextInput;
  window.buildNumberInput = buildNumberInput;
  window.buildSelect = buildSelect;
  window.buildUnitSelect = buildUnitSelect;
  window.buildBuyUnitSelect = buildBuyUnitSelect;
  window.buildInfoTooltip = buildInfoTooltip;
  window.buildIngredientRow = buildIngredientRow;
  window.buildCocktailCard = buildCocktailCard;
  window.displayMessage = displayMessage;
}

if (typeof module !== 'undefined') {
  module.exports = {
    DOM,
    createButton,
    createCocktailButton,
    createToggleButton,
    createAddButton,
    buildTextInput,
    buildAutocompleteTextInput,
    buildNumberInput,
    buildSelect,
    buildUnitSelect,
    buildBuyUnitSelect,
    buildInfoTooltip,
    buildIngredientRow,
    buildCocktailCard,
    displayMessage,
  };
}

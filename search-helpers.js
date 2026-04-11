// search-helpers.js - shared normalization and search helpers for classic scripts

function normalizeSearchText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCocktailSearchIndex(cocktails) {
  return (cocktails || []).map((cocktail, index) => ({
    id: `cocktail-option-${index}`,
    label: cocktail.name,
    value: cocktail.name,
    key: normalizeSearchText(cocktail.name),
    popularity: cocktail.popularity || 0,
  }));
}

function buildIngredientSearchIndex(masterIngredients) {
  return Object.keys(masterIngredients || {}).map((name, index) => ({
    id: `ingredient-option-${index}`,
    label: name,
    value: name,
    key: normalizeSearchText(name),
  }));
}

function scoreSearchResult(item, normalizedQuery) {
  if (!normalizedQuery) return item.popularity || 0;
  if (item.key === normalizedQuery) return 1000;
  if (item.key.startsWith(normalizedQuery)) return 750;
  if (item.key.includes(normalizedQuery)) return 500;
  return 0;
}

function searchIndex(index, query, options) {
  const normalizedQuery = normalizeSearchText(query);
  const limit = options?.limit || 8;
  const excludeValues = new Set(options?.excludeValues || []);

  return (index || [])
    .filter(item => !excludeValues.has(item.value))
    .map(item => ({ ...item, score: scoreSearchResult(item, normalizedQuery) }))
    .filter(item => normalizedQuery ? item.score > 0 : true)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.popularity || 0) !== (a.popularity || 0)) return (b.popularity || 0) - (a.popularity || 0);
      return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
    })
    .slice(0, limit);
}

function searchCocktails(query, cocktails, selectedNames, options) {
  const index = buildCocktailSearchIndex(cocktails);
  return searchIndex(index, query, {
    ...options,
    excludeValues: selectedNames || [],
  });
}

function searchIngredients(query, masterIngredients, options) {
  const index = buildIngredientSearchIndex(masterIngredients);
  return searchIndex(index, query, options);
}

function findExactIngredientMatch(query, masterIngredients) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  return buildIngredientSearchIndex(masterIngredients)
    .find(item => item.key === normalizedQuery) || null;
}

if (typeof window !== 'undefined') {
  window.normalizeSearchText = normalizeSearchText;
  window.buildCocktailSearchIndex = buildCocktailSearchIndex;
  window.buildIngredientSearchIndex = buildIngredientSearchIndex;
  window.searchCocktails = searchCocktails;
  window.searchIngredients = searchIngredients;
  window.findExactIngredientMatch = findExactIngredientMatch;
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalizeSearchText,
    buildCocktailSearchIndex,
    buildIngredientSearchIndex,
    searchCocktails,
    searchIngredients,
    findExactIngredientMatch,
  };
}

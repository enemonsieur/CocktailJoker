/** @jest-environment jsdom */
const fs = require('fs');
const { generateMenu, __setSelected, renderCocktailList } = require('../logic.js');

test('Monthly summary appears after generating menu', () => {
  document.body.innerHTML = fs.readFileSync('index.html', 'utf8');
  document.getElementById('weekend-input').value = '1';
  document.getElementById('weekday-input').value = '1';
  __setSelected([{ name: 'Test', price: 1000, popularity: 1, ingredients: [] }]);
  generateMenu();
  const summaryBox = document.querySelector('#monthly-summary');
  expect(summaryBox).not.toBeNull();
});

test('Summary table omits redundant columns', () => {
  document.body.innerHTML = '<div id="menu-summary"></div><input id="weekend-input" value="1"><input id="weekday-input" value="1">';
  __setSelected([{ name: 'T', price: 1000, popularity: 1, ingredients: [] }]);
  generateMenu();
  const ths = [...document.querySelectorAll('#menu-summary th')];
  const headers = ths.map(th => th.textContent.toLowerCase());
  expect(headers).not.toContain('ventes m.');
  expect(headers).not.toContain('profit m.');
});

test('Clicking on a selected cocktail removes it', () => {
  document.body.innerHTML = fs.readFileSync('index.html', 'utf8');
  __setSelected([{ name: 'T', price: 1000, popularity: 5, ingredients: [] }]);
  global.cocktails = [{ name: 'T', price: 1000, popularity: 5 }];
  renderCocktailList();
  generateMenu();
  const btn = [...document.querySelectorAll('#cocktail-list button')].find(b => b.textContent.includes('✓'));
  btn.click();
  const updated = document.querySelector('#cocktail-list button');
  expect(updated.textContent.startsWith('+')).toBe(true);
});

test('Monthly KPI color reflects low margin', () => {
  document.body.innerHTML = '<div id="menu-summary"></div><input id="weekend-input" value="1"><input id="weekday-input" value="1">';
  global.masterIngredients = { I: { unitServed: "cl", buyVolume: 1, buyUnit: "liter", price: 1000 } };
  __setSelected([{ name: 'T', price: 100, popularity: 5, ingredients: [{ name: 'I', volume: 10 }] }]);
  generateMenu();
  const span = document.querySelector('#monthly-summary span');
  expect(span.className).toContain('text-red-600');
});

test('Manual revenue dropdown overrides revenue', () => {
  document.body.innerHTML = fs.readFileSync('index.html', 'utf8');
  document.getElementById('weekend-input').value = '1';
  document.getElementById('weekday-input').value = '1';
  document.getElementById('gross-revenue-input').value = '1500000';
  __setSelected([{ name: 'X', price: 1000, popularity: 3, ingredients: [] }]);
  generateMenu();
  const revenueText = document.querySelector('#monthly-summary span').textContent;
  const digits = revenueText.replace(/\D/g, '');
  expect(digits).toBe('1500000');
});

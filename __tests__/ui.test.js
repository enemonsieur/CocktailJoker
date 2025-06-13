/** @jest-environment jsdom */
const fs = require('fs');
const { generateMenu, __setSelected, renderCocktailList } = require('../logic.js');

test('Monthly summary shows up above the margin box', () => {
  document.body.innerHTML = fs.readFileSync('index.html', 'utf8');
  const menu = document.getElementById('menu-summary');
  document.body.innerHTML += '<input id="weekend-input" value="1"/><input id="weekday-input" value="1"/>';
  __setSelected([{ name: 'Test', price: 1000, popularity: 1, ingredients: [] }]);
  generateMenu();
  const monthly = document.getElementById('monthly-summary');
  const header = document.querySelector('h3');
  expect(monthly && header).toBeTruthy();
  expect(monthly.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('Summary table omits redundant columns', () => {
  document.body.innerHTML = '<div id="menu-summary"></div><input id="weekend-input" value="1"/><input id="weekday-input" value="1"/>';
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

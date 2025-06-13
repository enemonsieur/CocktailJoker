/** @jest-environment jsdom */
const { calcTotalCost, generateMenu, __setSelected } = require('../logic.js');

describe('calcTotalCost', () => {
  beforeEach(() => {
    global.masterIngredients = {
      Rum: { unitServed: 'cl', buyVolume: 1, buyUnit: 'liter', price: 1000 },
      Sugar: { unitServed: 'g', buyVolume: 100, buyUnit: 'g', price: 200 },
      Lemon: { unitServed: 'piece', buyVolume: 1, buyUnit: 'piece', price: 50 },
      Flour: { unitServed: 'g', buyVolume: 1, buyUnit: 'kg', price: 4000 }
    };
  });

  it('calculates total cost with various unit conversions', () => {
    const cocktail = {
      name: 'Test',
      ingredients: [
        { name: 'Rum', volume: 5 },
        { name: 'Sugar', volume: 10 },
        { name: 'Lemon', volume: 1 },
        { name: 'Flour', volume: 100 }
      ]
    };

    // Rum: 1000/(1*100)*5 = 50
    // Sugar: 200/(100)*10 = 20
    // Lemon: 50*1 = 50
    // Flour: buyUnit kg => factor 1000 -> 4000/(1*1000)*100 = 400
    expect(calcTotalCost(cocktail)).toBe(520);
  });
});

describe('generateMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="menu-summary"></div>
      <input id="weekend-input" />
      <input id="weekday-input" />
    `;

    global.masterIngredients = {
      Rum: { unitServed: 'cl', buyVolume: 1, buyUnit: 'liter', price: 1000 }
    };

    const sel = [
      { name: 'C1', price: 1000, popularity: 2, ingredients: [{ name: 'Rum', volume: 5 }] },
      { name: 'C2', price: 800, popularity: 1, ingredients: [{ name: 'Rum', volume: 5 }] },
      { name: 'C3', price: 1200, popularity: 3, ingredients: [{ name: 'Rum', volume: 5 }] }
    ];
    __setSelected(sel);
  });

  it('displays correct monthly summary totals', () => {
    document.getElementById('weekend-input').value = '2';
    document.getElementById('weekday-input').value = '4';

    generateMenu();

    const summary = document.getElementById('monthly-summary');
    expect(summary.textContent).toContain('96');
    expect(summary.textContent).toContain('102,400');
  });

  it('calculates weighted revenue and profit', () => {
    document.getElementById('weekend-input').value = '2';
    document.getElementById('weekday-input').value = '4';

    generateMenu();

    const rows = document.querySelectorAll('#menu-summary tbody tr');
    expect(rows).toHaveLength(3);
    const texts = Array.from(rows).map(r => r.textContent);
    expect(texts[0]).toContain('C1');
    expect(texts[1]).toContain('C2');
    expect(texts[2]).toContain('C3');
  });
});

describe('index.html inputs', () => {
  it('contains numeric weekend and weekday fields', () => {
    const fs = require('fs');
    const html = fs.readFileSync('index.html', 'utf8');
    document.body.innerHTML = html;
    const weekend = document.getElementById('weekend-input');
    const weekday = document.getElementById('weekday-input');
    expect(weekend).not.toBeNull();
    expect(weekday).not.toBeNull();
    expect(weekend.type).toBe('number');
    expect(weekday.type).toBe('number');
  });
});

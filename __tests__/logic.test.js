const { calcTotalCost, generateMenu } = require('../logic.js');

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
      <div id="weekly-total"></div>
      <div id="monthly-total"></div>
      <div id="average-margin"></div>
      <input id="weekend-input" value="10" />
      <input id="weekday-input" value="20" />
    `;

    global.masterIngredients = {
      Rum: { unitServed: 'cl', buyVolume: 1, buyUnit: 'liter', price: 1000 }
    };

    global.selected = [
      { name: 'C1', price: 1000, popularity: 2, ingredients: [{ name: 'Rum', volume: 5 }] },
      { name: 'C2', price: 800, popularity: 1, ingredients: [{ name: 'Rum', volume: 5 }] }
    ];
  });

  it('updates sales summary and table with computed values', () => {
    generateMenu();

    expect(document.getElementById('weekly-total').textContent).toBe('120');
    expect(document.getElementById('monthly-total').textContent).toBe('480');
    expect(document.getElementById('average-margin').textContent).toBe('95');

    const rows = document.querySelectorAll('#menu-summary tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('320');
    expect(rows[0].textContent).toContain('320000');
    expect(rows[0].textContent).toContain('304000');
    expect(rows[1].textContent).toContain('160');
    expect(rows[1].textContent).toContain('128000');
    expect(rows[1].textContent).toContain('120000');
  });
});

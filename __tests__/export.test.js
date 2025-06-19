/** @jest-environment jsdom */
const { exportMenu, __setSelected } = require('../logic.js');

test('exportMenu posts analytics meta block', async () => {
  document.body.innerHTML = `
    <div id="export-section"><button>Export</button></div>
    <input id="weekend-input" />
    <input id="weekday-input" />
    <input id="gross-revenue-input" />
  `;

  document.getElementById('weekend-input').value = '2';
  document.getElementById('weekday-input').value = '4';
  document.getElementById('gross-revenue-input').value = '1500000';

  __setSelected([{ name: 'T', price: 1000, popularity: 1, ingredients: [] }]);

  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) })
  );

  await exportMenu();

  expect(fetch).toHaveBeenCalled();
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.payload.meta).toEqual({
    grossRevenue: 1500000,
    weekdaySales: 4,
    weekendSales: 2,
    monthlyCocktails: 4 * 5 + 2 * 2
  });
  expect(body.payload.timestamp).toMatch(/T/);
});


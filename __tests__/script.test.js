const fs = require('fs');
const vm = require('vm');

describe('Apps Script doPost', () => {
  let context;
  let sheet;
  beforeEach(() => {
    const code = fs.readFileSync('script.gs', 'utf8');
    sheet = { getLastRow: jest.fn(() => 1), appendRow: jest.fn() };
    context = {
      SpreadsheetApp: {
        openById: jest.fn(() => ({ getSheets: () => [sheet] }))
      },
      ContentService: {
        MimeType: { JSON: 'json', TEXT: 'text' },
        createTextOutput: jest.fn(() => ({
          setMimeType: jest.fn().mockReturnThis(),
          setHeader: jest.fn().mockReturnThis()
        }))
      }
    };
    vm.runInNewContext(code, context);
  });

  test('appends meta and cocktails', () => {
    const event = { postData: { contents: JSON.stringify({
      payload: {
        meta: { grossRevenue: 1 },
        cocktails: [{ name: 'A', price: 10, cost: 5, margin: 50, popularity: 3 }]
      }
    }) } };

    context.doPost(event);

    expect(sheet.appendRow).toHaveBeenCalledTimes(2);
  });
});

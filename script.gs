const SPREADSHEET_ID = 'REPLACE_ME';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheets()[0];

  const cocktails = data.payload.cocktails;
  const meta = data.payload.meta || {};

  if (sheet.getLastRow() === 1) {
    sheet.appendRow([
      'Résumé',
      meta.grossRevenue || '',
      meta.weekdaySales || '',
      meta.weekendSales || '',
      meta.monthlyCocktails || '',
      '',
      new Date()
    ]);
  }

  cocktails.forEach(c => {
    sheet.appendRow([
      c.name,
      c.price,
      c.cost,
      c.margin,
      c.popularity,
      '',
      new Date()
    ]);
  });

  return ContentService.createTextOutput(
    JSON.stringify({ message: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}

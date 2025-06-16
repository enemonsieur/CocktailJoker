const SPREADSHEET_ID = '1j7IYkIvlaTi3m9SctiKk-ND4--_Aq4cFXOGX50Kauj0';

function doPost(e) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

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

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders);
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function doGet() {
  return ContentService
    .createTextOutput('✅ Web App is running. Use POST to submit menu data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

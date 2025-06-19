// code.gs
const SPREADSHEET_ID = '1j7IYkIvlaTi3m9SctiKk-ND4--_Aq4cFXOGX50Kauj0';

function doPost(e) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // 1) Parse incoming JSON
  const data = JSON.parse(e.postData.contents);
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const name = data.code
    || 'Menu ' + (
      typeof Utilities !== 'undefined'
        ? Utilities.formatDate(new Date(), 'GMT+1', 'dd/MM/yyyy')
        : new Date().toISOString().split('T')[0]
    );
  let sheet;
  if (typeof ss.getSheetByName === 'function' && typeof ss.insertSheet === 'function') {
    sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  } else {
    sheet = ss.getSheets()[0];
  }

  // 2) SUMMARY SECTION (rows 1–3)
  const meta = data.payload.meta || {};
  if (typeof sheet.getRange === 'function') {
    if (sheet.getLastRow && sheet.getLastRow() === 0) {
      // Row 1: Title
      sheet.getRange(1, 1).setValue('Résumé');
      // Row 2: Headers
      sheet.getRange(2, 1, 1, 6).setValues([[
        'Revenus mensuels',
        'Coûts totaux',
        'Profits',
        'Marge %',
        'Ventes / mois',
        'Timestamp'
      ]]);
    }

    sheet.getRange(3, 1, 1, 6).setValues([[
      meta.totalRevenue      || '',
      meta.totalCost         || '',
      meta.totalProfit       || '',
      typeof meta.overallMargin === 'number'
        ? Math.round(meta.overallMargin * 100) / 100 : '',
      meta.monthlyCocktails  || '',
      new Date()
    ]]);

    // 3) COCKTAIL TABLE HEADER (row 6)
    sheet.getRange(6, 1, 1, 6).setValues([[
      'Nom',
      'Prix',
      'Coût',
      'Marge',
      'Popularité',
      'Timestamp'
    ]]);

    // 4) COCKTAIL ROWS (starting row 7)
    const cocktails = data.payload.cocktails || [];
    cocktails.forEach((c, i) => {
      sheet.getRange(7 + i, 1, 1, 6).setValues([[
        c.name,
        c.price,
        c.cost,
        c.margin,
        c.popularity,
        new Date()
      ]]);
    });
  } else {
    if (sheet.getLastRow && sheet.getLastRow() === 1) {
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

    const cocktails = data.payload.cocktails || [];
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
  }

  // 5) Return OK with CORS headers
  const out = ContentService
    .createTextOutput(JSON.stringify({ message: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
  return out;
}

function doOptions() {
  const out = ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
  out.setHeader('Access-Control-Allow-Origin', '*');
  out.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return out;
}

function doGet() {
  return ContentService
    .createTextOutput('✅ Web App running — use POST.')
    .setMimeType(ContentService.MimeType.TEXT);
}

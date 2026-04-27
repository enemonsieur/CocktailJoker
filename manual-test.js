const { chromium } = require('@playwright/test');

(async () => {
  console.log('\n=== V2 OPTIMIZER INTEGRATION TEST ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to app
    await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
    console.log('✓ App loaded');

    // Check globals
    const globals = await page.evaluate(() => ({
      hasConfig: typeof window.CONFIG,
      hasDOM: typeof window.DOM,
      hasAppState: typeof window.AppState,
      hasStartApp: typeof window.startApp,
      hasGenerateMenu: typeof window.generateMenu,
    }));

    console.log('✓ Globals check:');
    Object.entries(globals).forEach(([key, val]) => {
      console.log(`  - ${key}: ${val}`);
    });

    // Run smoke flow
    const result = await page.evaluate(() => {
      window.startApp();
      window.addCocktail('Mojito');
      window.addCocktail('Margarita');
      window.addCocktail('Daiquiri');

      window.AppState.venueType = 'bar';
      window.AppState.personsPerWeek = 300;
      window.AppState.attachRate = 25;

      window.generateMenu();

      return {
        selectedCount: window.AppState.selected.length,
        menuDetailsCount: window.AppState.menuDetails?.length,
        totalProfitGain: window.AppState.totalProfitGain,
        totalProfitGainPct: window.AppState.totalProfitGainPct,
        firstItem: window.AppState.menuDetails?.[0],
        allItems: window.AppState.menuDetails?.slice(0, 3).map(item => ({
          name: item.name,
          reasonCode: item.reasonCode,
          suggestedPrice: item.suggestedPrice,
          currentPrice: item.currentPrice,
          demandRecoveryEligible: item.demandRecoveryEligible,
        })),
      };
    });

    console.log('\n✓ Smoke flow executed');
    console.log(`  - Selected cocktails: ${result.selectedCount}`);
    console.log(`  - Menu details: ${result.menuDetailsCount}`);
    console.log(`  - Profit gain: ${result.totalProfitGain}`);
    console.log(`  - Profit gain %: ${result.totalProfitGainPct}%`);

    if (result.allItems) {
      console.log('\n✓ V2 Optimizer Results (first 3 items):');
      result.allItems.forEach(item => {
        console.log(`  ${item.name}:`);
        console.log(`    - Price: ${item.currentPrice} → ${item.suggestedPrice}`);
        console.log(`    - Reason: ${item.reasonCode}`);
        console.log(`    - Demand Recovery Eligible: ${item.demandRecoveryEligible}`);
      });
    }

    // Check for V2 signatures
    if (result.firstItem?.reasonCode && result.firstItem?.demandRecoveryEligible !== undefined) {
      console.log('\n✓✓✓ V2 OPTIMIZER VERIFIED ✓✓✓');
      console.log('  All V2 signatures present (reason codes + demand recovery fields)');
    }

  } catch (error) {
    console.error('✗ Test failed:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== TEST COMPLETE ===\n');
})();

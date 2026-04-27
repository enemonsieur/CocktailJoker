const { test, expect } = require('@playwright/test');

test('V2 Optimizer Integration Test', async ({ page }) => {
  console.log('\n=== V2 OPTIMIZER INTEGRATION TEST ===\n');

  // Navigate to the app
  await page.goto('http://127.0.0.1:4173/index.html');
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
  console.log('  - CONFIG:', globals.hasConfig);
  console.log('  - DOM:', globals.hasDOM);
  console.log('  - AppState:', globals.hasAppState);
  console.log('  - startApp:', globals.hasStartApp);
  console.log('  - generateMenu:', globals.hasGenerateMenu);

  expect(globals.hasConfig).toBe('object');
  expect(globals.hasDOM).toBe('object');
  expect(globals.hasAppState).toBe('object');
  expect(globals.hasStartApp).toBe('function');
  expect(globals.hasGenerateMenu).toBe('function');

  // Run the smoke flow
  const result = await page.evaluate(() => {
    // Start app
    window.startApp();

    // Add cocktails
    window.addCocktail('Mojito');
    window.addCocktail('Margarita');
    window.addCocktail('Daiquiri');

    // Set venue parameters
    window.AppState.venueType = 'bar';
    window.AppState.personsPerWeek = 300;
    window.AppState.attachRate = 25;

    // Generate menu (runs V2 optimizer)
    window.generateMenu();

    // Wait a bit for async operations
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          selectedCount: window.AppState.selected.length,
          menuDetailsCount: window.AppState.menuDetails?.length,
          totalProfitGain: window.AppState.totalProfitGain,
          totalProfitGainPct: window.AppState.totalProfitGainPct,
          firstItem: window.AppState.menuDetails?.[0],
        });
      }, 100);
    });
  });

  console.log('\n✓ Smoke flow executed');
  console.log('  - Selected cocktails:', result.selectedCount);
  console.log('  - Menu details:', result.menuDetailsCount);
  console.log('  - Profit gain:', result.totalProfitGain);
  console.log('  - Profit gain %:', result.totalProfitGainPct);

  expect(result.selectedCount).toBe(3);
  expect(result.menuDetailsCount).toBeGreaterThan(0);

  // Verify V2 results
  if (result.firstItem) {
    console.log('\n✓ V2 Optimizer Results (first item):');
    console.log('  - Name:', result.firstItem.name);
    console.log('  - Reason code:', result.firstItem.reasonCode);
    console.log('  - Current price:', result.firstItem.currentPrice);
    console.log('  - Suggested price:', result.firstItem.suggestedPrice);
    console.log('  - Status:', result.firstItem.status);
    console.log('  - Demand recovery eligible:', result.firstItem.demandRecoveryEligible);

    // Verify V2 signature (has reason codes and demand recovery fields)
    expect(result.firstItem.reasonCode).toBeTruthy();
    expect(result.firstItem.demandRecoveryEligible).toBeDefined();

    console.log('\n✓ V2 OPTIMIZER VERIFIED - All signatures present');
  }

  // Check for console errors
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Give page time to log any errors
  await page.waitForTimeout(500);

  if (errors.length === 0) {
    console.log('\n✓ No console errors detected');
  } else {
    console.log('\n⚠ Console errors:', errors);
  }

  console.log('\n=== TEST PASSED ===\n');
});

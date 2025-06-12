// logic.js
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbx5I6Pa5ay3-vF3JueYGQjo4NReWL3YQmRr73EGjKG-Q7CzYfQlt12eTA2npmkpAPYC7w/exec";
let selected = []; // Holds the user's chosen cocktails
let showAllCocktails = false; // Tracks if we should show all cocktails or just popular ones

function isSelected(name) {
  return selected.some(c => c.name === name);
}

function addCocktail(name) {
  const cocktailBlueprint = cocktails.find(x => x.name === name);
  if (cocktailBlueprint && !isSelected(name)) {
    const newCocktail = JSON.parse(JSON.stringify(cocktailBlueprint)); // Deep clone
    selected.push(newCocktail);
    renderSelected();           // Show new card
    renderCocktailList();       // Refresh highlighting
  }
}

// Renders the initial list of cocktail buttons
function renderCocktailList() {
  const div = document.getElementById("cocktail-list");
  if (!div) {
    console.error("Element with ID 'cocktail-list' not found.");
    return;
  }

  // Clear existing content
  div.innerHTML = '';

  // Filter cocktails based on showAll state
  const cocktailsToShow = showAllCocktails 
    ? cocktails 
    : cocktails.filter(c => c.popularity >= 4);

  // Render the cocktails with selection highlighting
  cocktailsToShow.forEach(c => {
    const button = document.createElement('button');
    const active = isSelected(c.name); // Check if cocktail is selected

    button.className = `font-bold py-2 px-4 rounded-md m-1 transition-colors duration-150 
                      ${active 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`;
    button.textContent = `${active ? '✓' : '+'} ${c.name}`;
    button.onclick = () => { 
      if (!isSelected(c.name)) {
        addCocktail(c.name); 
        renderCocktailList(); // Refresh selection states
      }
    };
    
    div.appendChild(button);
  });

  // Add "Show More/Less" button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md m-1';
  toggleButton.textContent = showAllCocktails ? 'Voir moins...' : 'Voir tous les cocktails...';
  toggleButton.onclick = () => {
    showAllCocktails = !showAllCocktails;
    renderCocktailList();
  };

  // Only show the button if there are cocktails to toggle
  if (cocktails.some(c => c.popularity < 4)) {
    div.appendChild(toggleButton);
  }
}

// Renders the cards for each selected cocktail
function renderSelected() {
  const container = document.getElementById("selected-cocktails");
  if (!container) {
    console.error("Element with ID 'selected-cocktails' not found.");
    return;
  }

  if (selected.length === 0) {
    container.innerHTML = "<p class='text-gray-600 italic text-center py-4'>No cocktails selected yet. Click a cocktail from the list above to add it.</p>";
    const menuSummaryContainer = document.getElementById("menu-summary");
    if (menuSummaryContainer) {
      menuSummaryContainer.innerHTML = "<p class='text-center text-gray-500 italic py-4'>Aucun cocktail sélectionné pour générer un résumé du menu.</p>";
    }
    return;
  }

  container.innerHTML = selected.map((c, i) => {
    const totalCost = calcTotalCost(c);
    const margin = c.price - totalCost;
    const marginPercentage = totalCost > 0 ? (margin / c.price) * 100 : (c.price > 0 ? 100 : 0);
    const marginColor = marginPercentage > 90 ? 'text-orange-500' : marginPercentage >= 75 ? 'text-green-600' : 'text-red-600';

    return `
      <div class="bg-white rounded-lg p-4 mb-4 border">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-semibold">${c.name}</h3>
          <button onclick="removeCocktail(${i})" class="text-red-500">×</button>
        </div>

        <div class="mb-3">
          <div class="grid grid-cols-11 gap-2 mb-1 text-xs text-gray-500">
            <div class="col-span-1"></div>
            <div class="col-span-4">Ingrédient</div>
            <div class="col-span-2">Volume</div>
            <div class="col-span-4">Prix d'achat</div>
          </div>

        <div id="ingredients-${i}" class="space-y-2">
          ${c.ingredients.map((ing, idx) => {
            const ingInfo = masterIngredients[ing.name] || { unitServed: 'cl', buyVolume: 1, buyUnit: 'liter', price: 0 };
            return `
              <div class="grid grid-cols-11 gap-2 items-center">
                <button onclick="removeIngredient(${i}, ${idx})" class="text-red-500 col-span-1">×</button>

                <!-- Ingredient name input -->
                <input type="text"
                      value="${ing.name}"
                      onchange="updateIngredient(${i}, ${idx}, 'name', this.value)"
                      class="col-span-4 p-1 border-b">

                <!-- Volume number + unit select -->
                <div class="col-span-2 flex items-center gap-1">
                  <input type="number"
                        value="${ing.volume}"
                        step="0.1"
                        onchange="updateIngredient(${i}, ${idx}, 'volume', parseFloat(this.value))"
                        class="w-12 p-1 border-b">
                  <select onchange="updateIngredientUnitServed(${i}, ${idx}, this.value)"
                          class="w-16 p-1 border-b">
                    <option value="cl"    ${ingInfo.unitServed === 'cl'    ? 'selected' : ''}>cl</option>
                    <option value="g"     ${ingInfo.unitServed === 'g'     ? 'selected' : ''}>g</option>
                    <option value="piece" ${ingInfo.unitServed === 'piece' ? 'selected' : ''}>piece</option>
                  </select>
                </div>

                <!-- Prix d'achat: price / buyVolume and buyUnit select -->
                <div class="col-span-4 flex items-center gap-1">
                  <input type="number"
                        value="${ingInfo.price}"
                        step="1"
                        onchange="updateIngredientMasterData('${ing.name}', 'price', this.value)"
                        class="w-16 p-1 border-b">
                  <span class="mx-1">/</span>
                  <input type="number"
                        value="${ingInfo.buyVolume}"
                        step="0.01"
                        onchange="updateIngredientMasterData('${ing.name}', 'buyVolume', this.value)"
                        class="w-16 p-1 border-b">
                  <select onchange="updateIngredientMasterData('${ing.name}', 'buyUnit', this.value)"
                          class="w-16 p-1 border-b">
                    <option value="liter" ${ingInfo.buyUnit === 'liter' ? 'selected' : ''}>liter</option>
                    <option value="g"     ${ingInfo.buyUnit === 'g'     ? 'selected' : ''}>g</option>
                    <option value="piece" ${ingInfo.buyUnit === 'piece' ? 'selected' : ''}>piece</option>
                  </select>
                </div>
              </div>`;
          }).join('')}
        </div>


          <button onclick="addNewIngredient(${i})" class="mt-2 text-sm text-blue-500 hover:text-blue-700">+ Ajouter un ingrédient</button>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-3">
          <div>
            <div class="text-xs text-gray-500 mb-1">Prix de vente (FCFA)</div>
            <div class="flex items-center">
              <input type="number" 
                     value="${c.price}" 
                     onchange="updateCocktailPrice(${i}, parseInt(this.value))" 
                     class="w-24 p-1 border-b">
            </div>
          </div>

          <div>
            <div class="text-xs text-gray-500 mb-1">Popularité (1-5)</div>
            <input type="number" 
                   min="1" 
                   max="5" 
                   value="${c.popularity}" 
                   onchange="updateCocktailPopularity(${i}, parseInt(this.value))" 
                   class="w-16 p-1 border-b">
          </div>
        </div>

        <div class="mt-3 pt-2 border-t">
          <div class="flex justify-between">
            <span class="text-sm">Coût: <span class="cost-amount">${Math.round(totalCost)}</span> FCFA</span>
            <span class="text-sm">Prix: ${Math.round(c.price)} FCFA</span>
            <span class="text-sm font-medium ${marginColor}">Marge: <span class="margin-percentage">${Math.round(marginPercentage)}</span>%</span>
          </div>
        </div>



      </div>`;
  }).join('');

  if (document.getElementById("menu-summary").innerHTML.includes("<table>")) {
    generateMenu();
  }
}

function updateIngredientUnitServed(cocktailIndex, ingredientIndex, newUnit) {
  const ingObj = selected[cocktailIndex]?.ingredients[ingredientIndex];
  if (!ingObj) return;
  const name = ingObj.name;
  const oldUnit = masterIngredients[name]?.unitServed || 'cl';

  // 1) If switching between cl ⇄ liter, adjust numeric volume
  if (oldUnit === 'cl' && newUnit === 'cl') { /* no change */ }
  else if (oldUnit === 'cl' && newUnit === 'g')  { /* no conversion between liquid/solid. leave volume unchanged */ }
  else if (oldUnit === 'g' && newUnit === 'g')   { /* no change */ }
  else if (oldUnit === 'cl' && newUnit === 'piece') { /* no conversion; user must manually adjust volume if needed */ }
  // If you want auto-conversion ONLY between cl ⇄ liter, do:
  if (oldUnit === 'cl' && newUnit === 'liter')      ingObj.volume /= 100;
  else if (oldUnit === 'liter' && newUnit === 'cl') ingObj.volume *= 100;

  // 2) Ensure masterIngredients entry exists, set unitServed
  if (!masterIngredients[name]) {
    masterIngredients[name] = { buyVolume: 1, buyUnit: 'liter', price: 0, unitServed: newUnit };
  } else {
    masterIngredients[name].unitServed = newUnit;
  }

  // 3) Force buyUnit to match exactly:
  //    - if newUnit === "cl", then buyUnit must be "liter"
  //    - if newUnit === "g",   then buyUnit must be "g"
  //    - if newUnit === "piece", buyUnit must be "piece"
  if (newUnit === 'cl')       masterIngredients[name].buyUnit = 'liter';
  else if (newUnit === 'g')   masterIngredients[name].buyUnit = 'g';
  else if (newUnit === 'piece') masterIngredients[name].buyUnit = 'piece';

  // 4) Re‐render so cost & margin update immediately
  renderSelected();
}



// Calculate total cost of a cocktail
function calcTotalCost(cocktail) {
  // this function inputs a cocktail object 
  // and returns the total cost of the ingredients
  return cocktail.ingredients.reduce((sum, ing) => {
    const ref = masterIngredients[ing.name];
    if (!ref) return sum;

    // 1) figure out how many "served units" in one "buyUnit"
    let conversionFactor = 1;
    if (ref.buyUnit === "liter" && ref.unitServed === "cl") {
      conversionFactor = 100;      // 1 liter = 100 cl
    } else if (ref.buyUnit === "kg" && ref.unitServed === "g") {
      conversionFactor = 1000;     // 1 kg = 1000 g
    }
    // (no conversion needed if both are "piece" or if buyUnit/unitServed already match)

    // 2) compute cost per single "served unit"
    const costPerServedUnit = ref.price / (ref.buyVolume * conversionFactor);

    // 3) multiply by how many units this cocktail actually uses
    return sum + (costPerServedUnit * ing.volume);
  }, 0);
}


// Remove a cocktail from the selected list
function removeCocktail(index) {
  selected.splice(index, 1);
  renderSelected();
  renderCocktailList(); // Refresh the cocktail button styles
}

// Update an ingredient's property
function updateMasterIngredient(ingredientName, property, value) {
  if (masterIngredients[ingredientName]) {
    masterIngredients[ingredientName][property] = parseFloat(value) || 0;

    // Forcer le recalcul des coûts
    selected.forEach((_, index) => {
      const cost = calcTotalCost(selected[index]);
      const margin = selected[index].price - cost;
      const marginPercentage = cost > 0 ? (margin / selected[index].price) * 100 : (selected[index].price > 0 ? 100 : 0);
    
      const costElement = document.querySelector(`#selected-cocktails > div:nth-child(${index + 1}) .cost-amount`);
      const marginElement = document.querySelector(`#selected-cocktails > div:nth-child(${index + 1}) .margin-percentage`);
    
      if (costElement) costElement.textContent = Math.round(cost);
      if (marginElement) marginElement.textContent = Math.round(marginPercentage);
    });
    
  }
}

function updateIngredient(cocktailIndex, ingredientIndex, property, value) {
  if (selected[cocktailIndex] && selected[cocktailIndex].ingredients[ingredientIndex]) {
    selected[cocktailIndex].ingredients[ingredientIndex][property] = value;
    renderSelected();
  }
}

function updateIngredientMasterData(name, field, value) {
  // 1) If ingredient is brand-new, seed it so unitServed='cl' → buyUnit='liter'
  if (!masterIngredients[name]) {
    masterIngredients[name] = {
      unitServed: 'cl',
      buyVolume: 1,
      buyUnit: 'liter', // force literal pairing for cl
      price: 0
    };
  }

  // 2) Convert numeric fields if needed
  if (field === "price" || field === "buyVolume") {
    value = parseFloat(value);
    if (isNaN(value)) return;
  }

  // 3) If field === "buyUnit", only allow "liter","g","piece". Reject anything else.
  if (field === 'buyUnit' && !['liter','g','piece'].includes(value)) {
    return; // ignore invalid unit
  }

  // 4) If field === "unitServed", only allow "cl","g","piece". If someone tries to set unitServed to something else,
  //    ignore.  But in our UI, they only see cl/g/piece anyway.
  if (field === 'unitServed' && !['cl','g','piece'].includes(value)) {
    return;
  }

  masterIngredients[name][field] = value;

  // 5) If overriding unitServed, force buyUnit to match:
  if (field === 'unitServed') {
    if (value === 'cl')            masterIngredients[name].buyUnit = 'liter';
    else if (value === 'g')        masterIngredients[name].buyUnit = 'g';
    else if (value === 'piece')    masterIngredients[name].buyUnit = 'piece';
  }

  renderSelected(); // Recompute costs
}


function updateIngredientPrice(name, newPrice) {
  if (masterIngredients[name]) {
    masterIngredients[name].price = parseFloat(newPrice);
    renderSelected(); // Recalculate cost and refresh
  }
}
// Add a new ingredient to a cocktail
function addNewIngredient(cocktailIndex) {
  if (!selected[cocktailIndex]) return;

  // 1) Immediately seed masterIngredients so that a new ingredient
  //    starts with unitServed='cl' → buyUnit='liter'
  masterIngredients["Nouvel ingrédient"] = {
    unitServed: 'cl',    // default
    buyVolume: 1,        // default “per 1 liter”
    buyUnit: 'liter',    // force the matching pair for 'cl'
    price: 0             // start with 0
  };

  // 2) Push the new ingredient into the cocktail
  selected[cocktailIndex].ingredients.push({
    name: "Nouvel ingrédient",
    volume: 1
  });

  // 3) Re‐render so user sees the correct defaults right away
  renderSelected();
}


// Remove an ingredient from a cocktail
function removeIngredient(cocktailIndex, ingredientIndex) {
  if (selected[cocktailIndex] && selected[cocktailIndex].ingredients[ingredientIndex]) {
    selected[cocktailIndex].ingredients.splice(ingredientIndex, 1);
    renderSelected();
  }
}

// Update cocktail price
function updateCocktailPrice(index, price) {
  if (selected[index]) {
    selected[index].price = price;
    renderSelected();
  }
}

// Update cocktail popularity
function updateCocktailPopularity(index, popularity) {
  if (selected[index]) {
    selected[index].popularity = Math.min(5, Math.max(1, popularity));
    renderSelected();
  }
}

// Generate menu summary
function generateMenu() {
  const container = document.getElementById("menu-summary");
  if (!container) {
    console.error("Menu summary container not found.");
    displayMessage("Erreur : impossible de trouver où afficher le résumé du menu.", "error");
    return;
  }

  if (selected.length === 0) {
    container.innerHTML = "<p class='text-center text-gray-500 italic py-4'>Aucun cocktail sélectionné.</p>";
    return;
  }

  // Calculate total cost, revenue, and profit
  const summary = selected.reduce((acc, cocktail) => {
    const cost = calcTotalCost(cocktail);
    const revenue = cocktail.price;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    acc.totalCost += cost;
    acc.totalRevenue += revenue;
    acc.totalProfit += profit;
    acc.cocktails.push({
      name: cocktail.name,
      cost: cost,
      price: revenue,
      profit: profit,
      margin: margin,
      popularity: cocktail.popularity
    });
    
    return acc;
  }, { totalCost: 0, totalRevenue: 0, totalProfit: 0, cocktails: [] });

  // Calculate overall margin (using same formula as individual cocktails)
  const overallMargin = summary.totalRevenue > 0 
    ? (summary.totalProfit / summary.totalRevenue) * 100 
    : 0;
    
  const marginColor = overallMargin > 89 ? 'text-orange-500' : 
                     overallMargin >= 78 ? 'text-green-600' : 'text-red-600';

  // Generate HTML for the menu summary
  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-gray-800">Résumé du Menu</h3>
      <div class="text-sm">
        <span class="text-gray-600">Marge globale: </span>
        <span class="font-medium ${marginColor}">${Math.round(overallMargin)}%</span>
      </div>
    </div>
    
    <div class="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
      <p>Objectif: marges entre 75% et 90%</p>
      <p class="text-xs opacity-80">En dessous de 75%: prix trop bas ou coûts trop élevés</p>
      <p class="text-xs opacity-80">Au-dessus de 90%: prix potentiellement trop élevés</p>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cocktail</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marge</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popularité</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${summary.cocktails.map(cocktail => {
            const marginColor = cocktail.margin > 90 ? 'text-orange-500' : 
                              cocktail.margin >= 75 ? 'text-green-600' : 'text-red-600';
            return `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${cocktail.name}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${Math.round(cocktail.price)} FCFA</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium ${marginColor}">
                ${Math.round(cocktail.margin)}%
                <div class="text-xs text-gray-500">
                  (Coût: ${Math.round(cocktail.cost)} FCFA)
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                ${'★'.repeat(cocktail.popularity)}${'☆'.repeat(5 - cocktail.popularity)}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

async function exportMenu() {
  console.log("Export button clicked");
  
  // Show loading state
  const exportBtn = document.querySelector('#export-section button');
  const originalText = exportBtn.textContent;
  exportBtn.disabled = true;
  exportBtn.innerHTML = '<span class="loading">Enregistrement...</span>';
  
  try {
    if (!selected.length) {
      throw new Error('Veuillez sélectionner au moins un cocktail');
    }
    
    const code = generateCode();
    
    // Prepare data in the format expected by Google Apps Script
    const menuData = {
      code: code,
      payload: {
        cocktails: selected.map(c => ({
          name: c.name,
          price: c.price,
          cost: calcTotalCost(c),
          margin: c.price - calcTotalCost(c),
          popularity: c.popularity,
          ingredients: c.ingredients.map(i => ({
            name: i.name,
            volume: i.volume,
            unit: i.unit || 'cl'
          }))
        })),
        timestamp: new Date().toISOString()
      }
    };
    
    // Send data to Google Sheets
    try {
      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData)

      });
      
      // Show success message
      displayMessage(`Menu sauvegardé avec le code: ${code}`, 'success');
      
      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(`https://wa.me/237694218017?text=Votre%20code%20${code}`, '_blank');
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Still open WhatsApp even if we can't confirm the save
      window.open(`https://wa.me/237694218017?text=Votre%20code%20${code}`, '_blank');
      displayMessage(`Menu partagé avec le code: ${code} (sauvegarde non confirmée)`, 'info');
    }
    
  } catch (error) {
    console.error('Erreur lors de la préparation du menu:', error);
    displayMessage(error.message || 'Une erreur est survenue', 'error');
  } finally {
    // Restore button state
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = originalText;
    }
  }
}

// Update ingredient purchase info (price or buyVolume)
function updateIngredientPurchase(ingredientName, field, value) {
  if (masterIngredients[ingredientName]) {
    masterIngredients[ingredientName][field] = parseFloat(value) || 0;
    renderSelected();
  }
}

// Generate a random code for menu identification
function generateCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Make exportMenu available globally
window.exportMenu = exportMenu;

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  renderCocktailList();
  renderSelected();
});

// Helper function to display messages
function displayMessage(message, type = 'info') {
  const messageBox = document.createElement('div');
  messageBox.className = `message-box bg-${type === 'error' ? 'red' : 'blue'}-100 border-l-4 border-${type === 'error' ? 'red' : 'blue'}-500 text-${type === 'error' ? 'red' : 'blue'}-700 p-4`;
  messageBox.role = 'alert';
  
  const p = document.createElement('p');
  p.textContent = message;
  messageBox.appendChild(p);
  
  document.body.appendChild(messageBox);
  
  // Remove the message after 5 seconds
  setTimeout(() => {
    messageBox.remove();
  }, 5000);


}

async function sendTestCocktail() {
  const testPayload = {
    code: "TEST_MENU",
    payload: {
      cocktails: [
        {
          name: "Gin Tonic",
          price: 1200,
          cost: 400,
          margin: 800,
          popularity: 4,
          ingredients: [
            { name: "Gin", volume: 4, unit: "cl" },
            { name: "Tonic", volume: 10, unit: "cl" }
          ]
        }
      ],
      timestamp: new Date().toISOString()
    }
  };

  try {
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log("✅ Success:", result);
    alert(`✅ ${result.message || "Saved!"}`);
  } catch (error) {
    console.error("💥 Error sending:", error);
    alert("💥 Failed: " + error.message);
  }
}


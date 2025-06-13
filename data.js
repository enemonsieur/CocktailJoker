const masterIngredients = {
  /* ————————————— ℙ𝕣𝕚𝕞𝕒𝕣𝕪 𝔽𝕣𝕖𝕟𝕔𝕙 𝕀𝕟𝕘𝕣𝕖𝕕𝕚𝕖𝕟𝕥𝕤 ————————————— */

  "Bière blonde":               { unitServed: "cl",    buyVolume: 0.65,  buyUnit: "liter", price: 700 },
  "Bière citronnée":            { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 375 },
  "Blue de Curaçao":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 12375 },

  "Cacao":                      { unitServed: "g",     buyVolume: 250,   buyUnit: "g",     price: 2000 },
  "Clou de girofle":            { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 1875 },
  "Poivre noir":                { unitServed: "g",     buyVolume: 1000,  buyUnit: "g",     price: 5000 },
  "Poudre de cacao":            { unitServed: "g",     buyVolume: 250,   buyUnit: "g",     price: 2000 },
  "Sel de céleri":              { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 500 },
  "Sucre":                      { unitServed: "g",     buyVolume: 1000,  buyUnit: "g",     price: 600 },
  "Nutmeg":                     { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 2500 },

  "Feuilles de menthe":         { unitServed: "g",     buyVolume: 50,    buyUnit: "g",     price: 150 },
  "Feuilles de basilic":        { unitServed: "g",     buyVolume: 50,    buyUnit: "g",     price: 200 },
  "Lime wedges":                { unitServed: "piece", buyVolume: 1,     buyUnit: "piece", price: 30 },
    // (anglais “Lime” → français “Tranche de citron”; utilisant même “Tranche de citron”)

  "Thé vert":                   { unitServed: "g",     buyVolume: 12,    buyUnit: "g",     price: 600 },
  "Perles de tapioca":          { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 200 },

  "Tranche de citron":          { unitServed: "piece", buyVolume: 1,     buyUnit: "piece", price: 25 },
  "Jus de tomate":     { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1500 },
  "Worcestershire sauce":       { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 2000 },
  "Tabasco":                    { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 3000 },

  /* ————————————————— 𝔻𝕒𝕚𝕣𝕪 & 𝕄𝕚𝕝𝕜 ———————————————— */

  "Lait":                       { unitServed: "cl",    buyVolume: 0.16,  buyUnit: "liter", price: 50 },
  "Lait entier":                { unitServed: "cl",    buyVolume: 0.16,  buyUnit: "liter", price: 50 },
  "Fresh milk":                 { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 800 },
    // (français “Lait” couvre ces quatre équivalents)

  "Crème":                      { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 4000 },
  "Crème chantilly":            { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 6000 },
  "Crème fraîche":              { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 3500 },
  "Crème de coco":              { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 1100 },
  "Lait de coco":               { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 1250 },
    // (“Crème”, “Crème chantilly”, “Crème fraîche” et “Crème de coco” sont tous distincts ; “Lait de coco” est végétal)

  "Coconut ice Crème":          { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 3000 },

  /* ————————————— 𝔽𝕣𝕦𝕚𝕥 𝕁𝕦𝕚𝕔𝕖𝕤 ———————————————— */

  "Jus de citron":              { unitServed: "cl",    buyVolume: 0.3,   buyUnit: "liter", price: 50 },
  "Jus d’orange":               { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2500 },
  "Grapefruit juice":           { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2000 },
    // (pas de fusion ici)

  "Jus d’ananas":               { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1696 },
  "Pineapple syrup":            { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 3000 },

  "Jus de pomme":               { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2500 },
  "Green apple juice":          { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2000 },
    // (même famille : deux produits distincts)

  "Jus de raisin":              { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1550 },
  "Cranberry juice":            { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2500 },
  "Jus de passion":             { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2000 },
  "Purée de passion":           { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1800 },

  "Guava juice":                { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1800 },
  "Passion‐fruit juice":        { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2000 },
    // (distincts même si proches)

  "Jus de canneberge":          { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2500 },
    // (“Cranberry juice” → “Jus de canneberge”)
    "Jus de mangue":         { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1800 },
    "Jus de pamplemousse":   { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 2000 },
    "Poudre de coco":        { unitServed: "g",     buyVolume: 250,   buyUnit: "g",     price: 2000 },
    "Liqueur de café":       { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7000 },
    "Blanc d'œuf":           { unitServed: "piece", buyVolume: 10,    buyUnit: "piece", price: 1000 },
    "Sour mix":              { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 3200 },
    "Rhum à la noix de coco":{ unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7500 },
    "Noix de muscade":       { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 2500 },
    "Jus de gingembre":      { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 3000 },
    "Malibu":                { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7000 },
    "Crème de cassis":       { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 6000 },
    "Jus de tomate":         { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1500 },
    "Sauce Worcestershire":  { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 2000 },
    "Sorbet à la fraise":    { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 3500 },
    "Sirop d’ananas":        { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 3000 },
  
  /* ————————————— 𝕊𝕔𝕙𝕖𝕣𝕖𝕤𝕤𝕖𝕤  & 𝕊𝕪𝕣𝕦𝕡𝕤 ———————————————— */

  "Sirop de sucre":             { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 1500 },
  "Simple syrup":               { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 1500 },
  "Sirop de canne":             { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 2800 },
    // (trois versions pour “sirop de sucre” – tous maintenus distincts)

  "Sirop d’orgeat":             { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 5000 },
  "Sirop de grenadine":         { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 1500 },
  "Sirop de grenadine syrup":   { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 1500 },
    // (“Sirop de grenadine” et sa variante répétée pour compatibilité)

  "Mint syrup":                 { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 3200 },
  "Sirop de menthe":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 3200 },
    // (même produit, mais “Mint syrup” conservé pour référence anglophone)

  "Strawberry syrup":           { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 3500 },
  "Sirop de fraise":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 3500 },

  /* —————————————— 𝔹𝕤𝕜𝕦𝕚𝕥𝕤  𝕒𝕝𝕔𝕠𝕠𝕝 —————————————— */

  "Gin":                        { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 2900 },
  "Vodka":                      { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 2900 },
  "Vanilla Vodka":              { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8500 },
  "Rum":                        { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7000 },
  "Rhum blanc":                 { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 7000 },
  "Rhum brun":                  { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 7000 },
  "Cachaça":                    { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8500 },
  "Bourbon":                    { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8500 },
  "Whisky":                     { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },
  "Jack Daniel’s":              { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8500 },

  "Ricard":                     { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9500 },

  "Liqueur de banane":          { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },
  "Peach schnapps":             { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },
  "Peach liqueur":              { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },
  "Strawberry liqueur":         { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },
  "liqueur de coco":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8000 },

  "Cointreau":                  { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9000 },
  "Triple sec":                 { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7500 },
  "Curaçao bleu":               { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 12375 },
  "Orange curaçao":             { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7500 },

  "Bénédictine DOM":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 11000 },
  "Marie Brizard":              { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9500 },

  "Campari":                    { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 9450 },
  "Vermouth rouge":             { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 8000 },
  "Vermouth sec":               { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 8000 },
  "Martini":                    { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 8990 },
  "Martini blanc":              { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 8990 },

  "Bénédictine DOM":            { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 11000 },

  "Bailey's":                   { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9500 },

  "Angostura":                  { unitServed: "cl",    buyVolume: 0.2,   buyUnit: "liter", price: 3000 },

  /* ————————————— 𝔸𝕝𝕔𝕠𝕠𝕝 𝕔𝕠𝕧𝕖𝕣𝕤 𝕲𝕖𝕟𝕖́𝕣𝕒𝕝𝕚𝕤𝕖́𝕤 ————————————— */

  "Champagne":                  { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 15000 },
  "Vin rouge":                  { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 4000 },
  "vin blanc":                  { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 3500 },
  "Vin mousseux":               { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 5000 },

  /* ————————————— 𝕊𝕠𝕕𝕒𝕤 & 𝕄𝕚𝕩𝕖𝕤 ——————————————— */

  "Limonade":                   { unitServed: "cl",    buyVolume: 9.0,   buyUnit: "liter", price: 5100 },
  "Sprite":                     { unitServed: "cl",    buyVolume: 1.5,   buyUnit: "liter", price: 600 },
  "Coca-Cola":                  { unitServed: "cl",    buyVolume: 1.5,   buyUnit: "liter", price: 600 },
  "Red Bull":                   { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 700 },

  "Sirop épicé":                { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 8500 },
  "Sirop de matcha":            { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 6000 },

  /* ————————————— 𝕆𝕥𝕙𝕖𝕣𝕤 & 𝔸𝕔𝕔𝕖𝕤𝕤𝕠𝕣𝕚𝕖𝕤 ——————————————— */

  "Cacao":                      { unitServed: "g",     buyVolume: 250,   buyUnit: "g",     price: 2000 },
  "Perles de tapioca":          { unitServed: "g",     buyVolume: 100,   buyUnit: "g",     price: 200 },

  "Coffee":                     { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1500 },
    // (« Café noir / Café expresso / Espresso / Coffee » fusionnés sous « Coffee »)

  "Rum":                        { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 7000 },
    // (« Rhum blanc / Rum » fusionnés sous « Rhum blanc » ; mais on conserve « Rum » aussi pour code)
    "Eau gazeuse":           { unitServed: "cl",    buyVolume: 1.5,   buyUnit: "liter", price: 400 },
    "Tequila":               { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9000 },
    "Jus de goyave":         { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 1800 },
    "Café noir":             { unitServed: "cl",    buyVolume: 0.25,  buyUnit: "liter", price: 2500 },
    "Cognac":                { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 12000 },
    "Vanilla ice Crème":     { unitServed: "cl",    buyVolume: 0.5,   buyUnit: "liter", price: 3500 },
    "Milk":                  { unitServed: "cl",    buyVolume: 1.0,   buyUnit: "liter", price: 800 },
    "Liqueur de cerise":     { unitServed: "cl",    buyVolume: 0.7,   buyUnit: "liter", price: 9500 },
    "Vin blanc":             { unitServed: "cl",    buyVolume: 0.75,  buyUnit: "liter", price: 3500 }

};

const cocktails = [
  {
    name: "Mojito",
    price: 3500,
    popularity: 5,
    ingredients: [
      { name: "Rhum blanc", volume: 5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Feuilles de menthe", volume: 6 },
      { name: "Eau gazeuse", volume: 6 }
    ]
  },
  {
    name: "Rodeo Drive",
    price: 2000,
    popularity: 1,
    ingredients: [
      { name: "Jus de mangue", volume: 9 },
      { name: "Tequila", volume: 4.5 },
      { name: "Triple sec", volume: 1.5 }
    ]
  },
  {
    name: "Dark Dream",
    price: 2500,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 3 },
      { name: "Gin", volume: 3 },
      { name: "Rhum blanc", volume: 3 },
      { name: "Blue de Curaçao", volume: 1.5 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Zizi Coincoin",
    price: 1000,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 5 },
      { name: "Triple sec", volume: 2 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Zombie",
    price: 2000,
    popularity: 1,
    ingredients: [
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Rhum brun", volume: 4.5 },
      { name: "Jus de mangue", volume: 6 },
      { name: "Jus de goyave", volume: 6 },
      { name: "Sirop de grenadine", volume: 1.5 }
    ]
  },
  {
    name: "Pussy Cat",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Jus d’orange", volume: 4 },
      { name: "Jus d’ananas", volume: 4 },
      { name: "Jus de pamplemousse", volume: 4 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Sweety",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Lait de coco", volume: 6 },
      { name: "Sirop de grenadine", volume: 1 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Sweet Menthe",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Crème fraîche", volume: 6 },
      { name: "Sirop de menthe", volume: 1.5 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Virgin Mojito",
    price: 4400,
    popularity: 5,
    ingredients: [
      { name: "Eau gazeuse", volume: 10 },
      { name: "Jus de citron", volume: 3 },
      { name: "Feuilles de menthe", volume: 6 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Rose Sol",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Jus de goyave", volume: 4 },
      { name: "Jus de mangue", volume: 4 },
      { name: "Sirop de fraise", volume: 4 },
      { name: "Jus de citron", volume: 2 }
    ]
  },
  {
    name: "Lisa Simpson",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Eau gazeuse", volume: 10 },
      { name: "Coca-Cola", volume: 6 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Tequila Sunrise",
    price: 6700,
    popularity: 5,
    ingredients: [
      { name: "Tequila", volume: 4.5 },
      { name: "Jus d’orange", volume: 9 },
      { name: "Sirop de grenadine", volume: 1.5 }
    ]
  },
  {
    name: "Margarita",
    price: 8200,
    popularity: 5,
    ingredients: [
      { name: "Tequila", volume: 4.5 },
      { name: "Triple sec", volume: 2 },
      { name: "Jus de citron", volume: 3 }
    ]
  },
  {
    name: "Blue Lagoon",
    price: 6000,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 4.5 },
      { name: "Blue de Curaçao", volume: 2 },
      { name: "Jus de citron", volume: 3 }
    ]
  },
  {
    name: "Long Island Iced Tea",
    price: 6000,
    popularity: 4,
    ingredients: [
      { name: "Vodka", volume: 1.5 },
      { name: "Gin", volume: 1.5 },
      { name: "Rhum blanc", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 2 },
      { name: "Coca-Cola", volume: 5 }
    ]
  },
  {
    name: "Coco Beach",
    price: 3000,
    popularity: 1,
    ingredients: [
      { name: "Jus de passion", volume: 6 },
      { name: "Lait de coco", volume: 3 },
      { name: "Poudre de coco", volume: 5 }
    ]
  },
  {
    name: "Mai Tai",
    price: 7250,
    popularity: 4,
    ingredients: [
      { name: "Rhum blanc", volume: 4 },
      { name: "Rhum brun", volume: 2 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop d’orgeat", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 }
    ]
  },
  {
    name: "Pina Colada",
    price: 6167,
    popularity: 5,
    ingredients: [
      { name: "Rhum brun", volume: 4.5 },
      { name: "Crème de coco", volume: 3 },
      { name: "Jus d’ananas", volume: 9 }
    ]
  },
  {
    name: "Long Island",
    price: 8500,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 1.5 },
      { name: "Gin", volume: 1.5 },
      { name: "Rhum blanc", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Coca-Cola", volume: 5 }
    ]
  },
  {
    name: "Espresso Martini",
    price: 7500,
    popularity: 1,
    ingredients: [
      { name: "Vodka à la vanille", volume: 5 },
      { name: "Café noir", volume: 3 },
      { name: "Liqueur de café", volume: 1 }
    ]
  },
  {
    name: "Gin Basil",
    price: 8500,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 6 },
      { name: "Feuilles de basilic", volume: 8 },
      { name: "Jus de citron", volume: 2.5 },
      { name: "Sirop de sucre", volume: 1.5 }
    ]
  },
  {
    name: "Whiskey Sour",
    price: 9167,
    popularity: 4,
    ingredients: [
      { name: "Jack Daniel’s", volume: 4.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1.5 },
      { name: "Blanc d'œuf", volume: 2 }
    ]
  },
  {
    name: "Cosmopolitan",
    price: 8250,
    popularity: 4,
    ingredients: [
      { name: "Vodka", volume: 4.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Jus de canneberge", volume: 3 },
      { name: "Jus de citron", volume: 1.5 }
    ]
  },
  {
    name: "Frozen Margarita",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Tequila", volume: 4.5 },
      { name: "Triple sec", volume: 2 },
      { name: "Jus de citron", volume: 3 }
    ]
  },
  {
    name: "Caipirinha",
    price: 6500,
    popularity: 4,
    ingredients: [
      { name: "Cachaça", volume: 6 },
      { name: "Tranche de citron", volume: 4 },
      { name: "Sucre", volume: 1 }
    ]
  },
  {
    name: "The Roo top Experience",
    price: 6000,
    popularity: 1,
    ingredients: [
      { name: "Sirop de fraise", volume: 1.5 },
      { name: "Sour mix", volume: 3 },
      { name: "Rhum à la noix de coco", volume: 4.5 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Blue de Curaçao", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Vodka", volume: 1.5 }
    ]
  },
  {
    name: "Sandrina",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Cognac", volume: 4.5 },
      { name: "Poudre de cacao", volume: 1.5 },
      { name: "Crème fraîche", volume: 3 },
      { name: "Noix de muscade", volume: 1 }
    ]
  },
  {
    name: "Tremblement de Terre",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Bailey's", volume: 4.5 },
      { name: "Cointreau", volume: 2 },
      { name: "Vodka", volume: 3 }
    ]
  },
  {
    name: "Sangria",
    price: 5750,
    popularity: 3,
    ingredients: [
      { name: "Vin rouge", volume: 12 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Cointreau", volume: 1.5 },
      { name: "Jus d’orange", volume: 6 },
      { name: "Jus de pamplemousse", volume: 6 }
    ]
  },
  {
    name: "Bloody Mary",
    price: 9000,
    popularity: 4,
    ingredients: [
      { name: "Jus de tomate", volume: 12 },
      { name: "Vodka", volume: 4.5 },
      { name: "Worcestershire sauce", volume: 0.5 },
      { name: "Tabasco", volume: 0.2 },
      { name: "Sel de céleri", volume: 1 }
    ]
  },
  {
    name: "Parfum de Femme",
    price: 5500,
    popularity: 1,
    ingredients: [
      { name: "Jus d’orange", volume: 6 },
      { name: "Jus de pamplemousse", volume: 6 },
      { name: "Jus de citron", volume: 3 },
      { name: "Marie Brizard", volume: 1.5 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Virgin Colada",
    price: 5833,
    popularity: 3,
    ingredients: [
      { name: "Lait de coco", volume: 6 },
      { name: "Crème", volume: 3 },
      { name: "Jus d’ananas", volume: 9 }
    ]
  },
  {
    name: "Njindja Punch",
    price: 6000,
    popularity: 1,
    ingredients: [
      { name: "Jus de gingembre", volume: 2 },
      { name: "Jus d’ananas", volume: 9 },
      { name: "Sirop de sucre", volume: 1.5 }
    ]
  },
  {
    name: "Copacabana",
    price: 7000,
    popularity: 1,
    ingredients: [
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus d’orange", volume: 6 },
      { name: "Purée de passion", volume: 3 },
      { name: "Sorbet à la fraise", volume: 1 }
    ]
  },
  {
    name: "Miss Passion",
    price: 6000,
    popularity: 1,
    ingredients: [
      { name: "Jus de passion", volume: 6 },
      { name: "Jus de pomme", volume: 6 },
      { name: "Jus de citron", volume: 2 },
      { name: "Sirop de sucre", volume: 1.5 },
      { name: "Eau gazeuse", volume: 6 }
    ]
  },
  {
    name: "Florida",
    price: 3833,
    popularity: 3,
    ingredients: [
      { name: "Jus d’orange", volume: 6 },
      { name: "Jus de pamplemousse", volume: 6 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1.5 }
    ]
  },
  {
    name: "Coco Exotique",
    price: 7000,
    popularity: 1,
    ingredients: [
      { name: "Crème de coco", volume: 1 },
      { name: "Fresh milk", volume: 6 },
      { name: "Vanilla ice Crème", volume: 1 },
      { name: "Sirop de fraise", volume: 1 }
    ]
  },
  {
    name: "Soleil Vert sur La Falaise",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Sprite", volume: 12 },
      { name: "Sirop d’ananas", volume: 2 },
      { name: "Sirop de menthe", volume: 1.5 }
    ]
  },
  {
    name: "Cuba Libre",
    price: 3000,
    popularity: 1,
    ingredients: [
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Jus de citron", volume: 1 },
      { name: "Coca-Cola", volume: 12 }
    ]
  },
  {
    name: "Sex on the Beach",
    price: 5000,
    popularity: 4,
    ingredients: [
      { name: "Vodka", volume: 4.5 },
      { name: "Peach schnapps", volume: 2 },
      { name: "Jus de canneberge", volume: 4.5 },
      { name: "Jus d’orange", volume: 4.5 }
    ]
  },
  {
    name: "Electric Iced Tea",
    price: 4000,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Gin", volume: 1.5 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Blue de Curaçao", volume: 1.5 },
      { name: "Eau gazeuse", volume: 5 }
    ]
  },
  {
    name: "Americano",
    price: 5500,
    popularity: 3,
    ingredients: [
      { name: "Campari", volume: 3 },
      { name: "Vermouth rouge", volume: 3 },
      { name: "Eau gazeuse", volume: 6 }
    ]
  },
  {
    name: "Malibu",
    price: 3750,
    popularity: 3,
    ingredients: [
      { name: "Malibu", volume: 4.5 },
      { name: "Jus d’ananas", volume: 9 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Smooky Sweet Passion",
    price: 3500,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 4.5 },
      { name: "Peach schnapps", volume: 2 },
      { name: "Jus d’orange", volume: 9 }
    ]
  },
  {
    name: "Blue Smooky",
    price: 3500,
    popularity: 1,
    ingredients: [
      { name: "Blue de Curaçao", volume: 2 },
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Elegant Smooky",
    price: 3500,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 4.5 },
      { name: "Strawberry liqueur", volume: 2 },
      { name: "Sirop de fraise", volume: 1 },
      { name: "Jus d’ananas", volume: 6 }
    ]
  },
  {
    name: "The Smooky",
    price: 5000,
    popularity: 1,
    ingredients: []
  },
  {
    name: "Virgin Pina Colada",
    price: 2500,
    popularity: 1,
    ingredients: [
      { name: "Lait de coco", volume: 6 },
      { name: "Jus d’ananas", volume: 9 }
    ]
  },
  {
    name: "Bora Bora",
    price: 5500,
    popularity: 3,
    ingredients: [
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus de passion", volume: 6 },
      { name: "Jus de citron", volume: 2 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Limonade",
    price: 2750,
    popularity: 3,
    ingredients: [
      { name: "Jus de citron", volume: 3 },
      { name: "Eau gazeuse", volume: 12 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Fresh and Cold",
    price: 2000,
    popularity: 1,
    ingredients: [
      { name: "Sirop de menthe", volume: 1.5 },
      { name: "Sprite", volume: 12 }
    ]
  },
  {
    name: "Menthe au Lait",
    price: 2667,
    popularity: 3,
    ingredients: [
      { name: "Sirop de menthe", volume: 1.5 },
      { name: "Milk", volume: 12 }
    ]
  },
  {
    name: "Ginger punch",
    price: 2500,
    popularity: 1,
    ingredients: [
      { name: "Jus de gingembre", volume: 2 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus de citron", volume: 2 },
      { name: "Sirop de sucre", volume: 1 }
    ]
  },
  {
    name: "Cocktail de fruits",
    price: 2500,
    popularity: 1,
    ingredients: []
  },
  {
    name: "Daiquiri",
    price: 7667,
    popularity: 4,
    ingredients: [
      { name: "Rhum blanc", volume: 5 },
      { name: "Jus de citron", volume: 2.5 },
      { name: "Sirop de sucre", volume: 1.5 }
    ]
  },
  {
    name: "Gin Fizz",
    price: 6500,
    popularity: 2,
    ingredients: [
      { name: "Gin", volume: 4.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1.5 },
      { name: "Eau gazeuse", volume: 6 }
    ]
  },
  {
    name: "Spécial Maison",
    price: 2000,
    popularity: 1,
    ingredients: []
  },
  {
    name: "Café Irlandais",
    price: 3000,
    popularity: 1,
    ingredients: [
      { name: "Café noir", volume: 15 },
      { name: "Crème", volume: 3 }
    ]
  },
  {
    name: "Tango",
    price: 2000,
    popularity: 1,
    ingredients: [
      { name: "Vin rouge", volume: 9 },
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Jus d’orange", volume: 6 }
    ]
  },
  {
    name: "Mojito Corse",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Rhum brun", volume: 5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Feuilles de menthe", volume: 6 },
      { name: "Eau gazeuse", volume: 6 }
    ]
  },
  {
    name: "Special CK",
    price: 4000,
    popularity: 1,
    ingredients: []
  },
  {
    name: "Bahamas",
    price: 5000,
    popularity: 1,
    ingredients: [
      { name: "Rhum brun", volume: 4.5 },
      { name: "Crème de coco", volume: 3 },
      { name: "Jus d’ananas", volume: 9 }
    ]
  },
  {
    name: "Dry Martini",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 6 },
      { name: "Vermouth sec", volume: 1 }
    ]
  },
  {
    name: "Long Island Tea",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 1.5 },
      { name: "Gin", volume: 1.5 },
      { name: "Rhum blanc", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Coca-Cola", volume: 5 }
    ]
  },
  {
    name: "Singapore Sling",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 3 },
      { name: "Liqueur de cerise", volume: 1.5 },
      { name: "Bénédictine DOM", volume: 0.75 },
      { name: "Cointreau", volume: 0.75 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus de citron", volume: 1.5 },
      { name: "Sirop de grenadine", volume: 0.5 },
      { name: "Angostura", volume: 1 }
    ]
  },
  {
    name: "White Russian",
    price: 10000,
    popularity: 3,
    ingredients: [
      { name: "Vodka", volume: 5 },
      { name: "Liqueur de café", volume: 2 },
      { name: "Crème", volume: 3 }
    ]
  },
  {
    name: "Planter’s Punch",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Rhum brun", volume: 4.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Sirop de grenadine", volume: 1 },
      { name: "Angostura", volume: 1 }
    ]
  },
  {
    name: "Mai-Tai",
    price: 9000,
    popularity: 1,
    ingredients: [
      { name: "Rhum blanc", volume: 3 },
      { name: "Rhum brun", volume: 3 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop d’orgeat", volume: 1.5 },
      { name: "Orange curaçao", volume: 1.5 }
    ]
  },
  {
    name: "Negroni",
    price: 10000,
    popularity: 4,
    ingredients: [
      { name: "Gin", volume: 3 },
      { name: "Campari", volume: 3 },
      { name: "Vermouth rouge", volume: 3 }
    ]
  },
  {
    name: "Old Fashioned",
    price: 9000,
    popularity: 2,
    ingredients: [
      { name: "Bourbon", volume: 6 },
      { name: "Sucre", volume: 0.5 },
      { name: "Angostura", volume: 2 }
    ]
  },
  {
    name: "Pussy Foot",
    price: 8500,
    popularity: 1,
    ingredients: [
      { name: "Jus d’orange", volume: 6 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus de citron", volume: 2 },
      { name: "Sirop de grenadine", volume: 1 }
    ]
  },
  {
    name: "Blue Blue",
    price: 8000,
    popularity: 1,
    ingredients: [
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Blue de Curaçao", volume: 1.5 },
      { name: "Liqueur de coco", volume: 1.5 },
      { name: "Jus d’ananas", volume: 9 }
    ]
  },
  {
    name: "Gin Basil Smash",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 6 },
      { name: "Feuilles de basilic", volume: 8 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Sprite", volume: 6 }
    ]
  },
  {
    name: "Gin Pin",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 6 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Jus d’ananas", volume: 6 }
    ]
  },
  {
    name: "Grape Capiroska",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Vodka", volume: 6 },
      { name: "Jus de citron", volume: 3 },
      { name: "Sirop de sucre", volume: 1 },
      { name: "Sprite", volume: 6 }
    ]
  },
  {
    name: "Johnny Cocktail",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 4.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Ricard", volume: 1 }
    ]
  },
  {
    name: "Planter's Punch",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Rhum blanc", volume: 4.5 },
      { name: "Jus d’orange", volume: 6 },
      { name: "Jus d’ananas", volume: 6 },
      { name: "Jus de citron", volume: 3 },
      { name: "Triple sec", volume: 1.5 }
    ]
  },
  {
    name: "Long Island Ice Tea",
    price: 11000,
    popularity: 1,
    ingredients: [
      { name: "Gin", volume: 1.5 },
      { name: "Tequila", volume: 1.5 },
      { name: "Vodka", volume: 1.5 },
      { name: "Triple sec", volume: 1.5 },
      { name: "Rhum blanc", volume: 1.5 },
      { name: "Jus de citron", volume: 3 },
      { name: "Coca-Cola", volume: 5 }
    ]
  },
  {
    name: "Kir Royal",
    price: 20000,
    popularity: 1,
    ingredients: [
      { name: "Champagne", volume: 9 },
      { name: "Crème de cassis", volume: 1 }
    ]
  },
  {
    name: "Kir Ordinaire",
    price: 8000,
    popularity: 1,
    ingredients: [
      { name: "Crème de cassis", volume: 1 },
      { name: "Vin blanc", volume: 9 }
    ]
  }
];

// Export data for testing when running in Node
if (typeof module !== 'undefined') {
  module.exports = { masterIngredients, cocktails };
}


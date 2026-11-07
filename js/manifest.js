// Recipe Manifest - Metadata for index page
// Add new recipes here when you create them

const RECIPE_MANIFEST = [
  {
    id: "braised-short-rib",
    title: "Braised Short Rib",
    desc: "Blows every restaurant's version out of the water",
    tags: ["beef", "braise", "dutch-oven", "winter"],
    time: { prep: 20, active: 15, passive: 285 },
    status: "dialed-in",
    category: "mains"
  },
  {
    id: "shrimp-scampi",
    title: "Shrimp Scampi",
    desc: "Hard-seared scampi with fond and crust",
    tags: ["seafood", "italian", "quick", "weeknight"],
    time: { prep: 15, active: 10, passive: 0 },
    status: "experimenting",
    category: "mains"
  },
  {
    id: "polpette-del-rinascimento",
    title: "Polpette del Rinascimento",
    desc: "Orange-fennel meatballs with scappi spice",
    tags: ["pork", "chicken", "italian", "meatballs", "weeknight"],
    time: { prep: 25, active: 20, passive: 15 },
    status: "experimenting",
    category: "mains"
  },
  {
    id: "pierogi-x-plosion",
    title: "Pierogi X-plosion",
    desc: "Pierogies and kielbasa in creamy dijon sauce",
    tags: ["polish", "casserole", "comfort"],
    time: { prep: 15, active: 35, passive: 0 },
    status: "dialed-in",
    category: "mains"
  },
  {
    id: "milk-bread",
    title: "Milk Bread",
    desc: "Soft tangzhong bread with herb or topping variations",
    tags: ["bread", "baking", "japanese"],
    time: { prep: 20, active: 35, passive: 215 },
    status: "dialed-in",
    category: "breads"
  },
  {
    id: "chipotle-braised-pork",
    title: "Chipotle Braised Pork",
    desc: "Cheap, easy, complex. Great for bulk prep.",
    tags: ["pork", "mexican", "braise", "pressure-cooker", "meal-prep"],
    time: { prep: 20, active: 30, passive: 110 },
    status: "experimenting",
    category: "meal-prep"
  },
  {
    id: "grilled-sambal-shrimp",
    title: "Grilled Sambal Shrimp",
    desc: "Spicy coconut-lime marinade for shrimp or chicken",
    tags: ["seafood", "grilling", "marinade", "thai"],
    time: { prep: 10, active: 15, passive: 120 },
    status: "dialed-in",
    category: "mains"
  },
  {
    id: "pressure-cooker-white-beans",
    title: "Pressure Cooker White Beans",
    desc: "No-soak Instant Pot white beans — dead simple blank canvas",
    tags: ["beans", "pressure-cooker", "side"],
    time: { prep: 5, active: 0, passive: 30 },
    status: "experimenting",
    category: "staples"
  },
  {
    id: "frozen-lemon-posset",
    title: "Frozen Lemon Posset",
    desc: "British posset, frozen into a dense custardy dessert",
    tags: ["dessert", "lemon", "frozen", "british", "make-ahead"],
    time: { prep: 5, active: 8, passive: 250 },
    status: "dialed-in",
    category: "desserts"
  },
  {
    id: "caramelized-onion-protein-pasta",
    title: "Caramelized Onion Protein Pasta",
    desc: "High-protein pasta with real caramelized onions",
    tags: ["chicken", "pasta", "meal-prep", "high-protein"],
    time: { prep: 25, active: 100, passive: 85 },
    status: "dialed-in",
    category: "meal-prep"
  },
  {
    id: "big-flavor-broccoli",
    title: "Big-Flavor Broccoli",
    desc: "Roasted broccoli with anchovies, Parmesan, and lemon",
    tags: ["broccoli", "roast", "side"],
    status: "dialed-in",
    category: "sides"
  },
  {
    id: "cajun-chicken-pasta",
    title: "Cajun Chicken Pasta",
    desc: "Spicy, tangy chicken pasta with a Greek yogurt sauce",
    tags: ["chicken", "pasta", "cajun", "meal-prep", "high-protein"],
    status: "dialed-in",
    category: "meal-prep"
  },
  {
    id: "pressure-cooked-chicken-veg-stock",
    title: "Pressure-Cooked Chicken & Veg Stock",
    desc: "Collagen-rich stock with chicken feet, necks, and veg",
    tags: ["chicken", "stock", "pressure-cooker", "meal-prep"],
    status: "dialed-in",
    category: "staples"
  },
  {
    id: "kvass",
    title: "Kvass",
    desc: "Dark-toasted bread kvass with raisins and lemon",
    tags: ["beverage", "fermented", "bread"],
    status: "experimenting",
    category: "beverages"
  },
  {
    id: "tsoureki",
    title: "Tsoureki",
    desc: "Mahlab and tonka braided bread trial",
    tags: ["bread", "greek", "baking", "spiced"],
    status: "to-cook",
    category: "breads"
  },
  {
    id: "xinjiang-chuanr",
    title: "Xinjiang Chuanr",
    desc: "Uyghur charcoal lamb skewers for the coworker BBQ",
    tags: ["lamb", "uyghur", "grilling", "skewers", "cookout"],
    status: "to-cook",
    category: "mains"
  },
  {
    id: "cranberry-sauce",
    title: "Cranberry Sauce",
    desc: "Burst-berry Thanksgiving staple; the zest is non-negotiable",
    tags: ["side", "thanksgiving", "make-ahead", "quick"],
    time: { prep: 5, active: 10, passive: 60 },
    status: "dialed-in",
    category: "sides"
  },
  {
    id: "garlic-bread-with-anchovy",
    title: "Garlic Bread with Anchovy",
    desc: "Slit baguette stuffed with roasted garlic-anchovy butter",
    tags: ["bread", "side", "garlic", "anchovy"],
    time: { prep: 10, active: 10, passive: 65 },
    status: "experimenting",
    category: "sides"
  },
  {
    id: "shrimp-a-la-strike",
    title: "Shrimp à la Strike",
    desc: "Prosciutto-wrapped shrimp and Gruyère from Total Synthesis II",
    tags: ["seafood", "grilling", "skewers", "appetizer"],
    time: { prep: 20, active: 10, passive: 0 },
    status: "dialed-in",
    category: "small-plates"
  },
  {
    id: "chef-johns-parker-house-rolls",
    title: "Parker House Rolls",
    desc: "Buttery fold-over dinner rolls from Chef John's dough",
    tags: ["bread", "baking", "side", "holiday"],
    time: { prep: 40, active: 5, passive: 215 },
    status: "experimenting",
    category: "breads"
  }
];

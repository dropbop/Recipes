// Recipe Manifest - Metadata for index page
// Add new recipes here when you create them

const RECIPE_MANIFEST = [
  {
    id: "braised-short-rib",
    title: "Braised Short Rib",
    desc: "Blows every restaurant's version out of the water",
    tags: ["beef", "braise", "dutch-oven", "winter"],
    time: { prep: 20, active: 15, passive: 285 },
    canonical: true
  },
  {
    id: "shrimp-scampi",
    title: "Shrimp Scampi",
    desc: "Hard-seared scampi with fond and crust",
    tags: ["seafood", "italian", "quick", "weeknight"],
    time: { prep: 15, active: 10, passive: 0 },
    canonical: false
  },
  {
    id: "polpette-del-rinascimento",
    title: "Polpette del Rinascimento",
    desc: "Orange-fennel meatballs with scappi spice",
    tags: ["pork", "chicken", "italian", "meatballs", "weeknight"],
    time: { prep: 25, active: 20, passive: 15 },
    canonical: false
  },
  {
    id: "pierogi-x-plosion",
    title: "Pierogi X-plosion",
    desc: "Pierogies and kielbasa in creamy dijon sauce",
    tags: ["polish", "casserole", "comfort"],
    time: { prep: 15, active: 35, passive: 0 },
    canonical: true
  },
  {
    id: "milk-bread",
    title: "Milk Bread",
    desc: "Soft tangzhong bread with herb or topping variations",
    tags: ["bread", "baking", "japanese"],
    time: { prep: 20, active: 35, passive: 215 },
    canonical: true
  },
  {
    id: "chipotle-braised-pork",
    title: "Chipotle Braised Pork",
    desc: "Cheap, easy, complex. Great for bulk prep.",
    tags: ["pork", "mexican", "braise", "pressure-cooker", "meal-prep"],
    time: { prep: 20, active: 30, passive: 110 },
    canonical: false
  },
  {
    id: "grilled-sambal-shrimp",
    title: "Grilled Sambal Shrimp",
    desc: "Spicy coconut-lime marinade for shrimp or chicken",
    tags: ["seafood", "grilling", "marinade", "thai"],
    time: { prep: 10, active: 15, passive: 120 },
    canonical: true
  },
  {
    id: "pressure-cooker-white-beans",
    title: "Pressure Cooker White Beans",
    desc: "No-soak Instant Pot white beans — dead simple blank canvas",
    tags: ["beans", "pressure-cooker", "side"],
    time: { prep: 5, active: 0, passive: 30 },
    canonical: false
  },
  {
    id: "frozen-lemon-posset",
    title: "Frozen Lemon Posset",
    desc: "British posset, frozen into a dense custardy dessert",
    tags: ["dessert", "lemon", "frozen", "british", "make-ahead"],
    time: { prep: 5, active: 8, passive: 250 },
    canonical: true
  }
];

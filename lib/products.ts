export interface ProductColor {
  id: string
  name: string
  hex: string
  swatchHex: string
  tone: 'black' | 'white' | 'red' | 'blue' | 'green' | 'gold' | 'silver' | 'orange'
  metalness?: number
  roughness?: number
  clearcoat?: number
}

export interface ProductFamily {
  number: string
  title: string
  tagline: string
  description: string
  specs: string[]
  accent: string
}

export interface CatalogueProduct {
  id: string
  name: string
  category: string
  description: string
  capacity: string
  material: string
  image: string
  modelPath?: string
  colors: string[]
  features: string[]
}

// 8 exact color finishes with custom PBR material tuning
export const PRODUCT_COLORS: Record<string, ProductColor> = {
  black: {
    id: 'black',
    name: 'Obsidian Black',
    hex: '#1c2022',
    swatchHex: '#1c2022',
    tone: 'black',
    metalness: 0.15,
    roughness: 0.35,
  },
  white: {
    id: 'white',
    name: 'Arctic White',
    hex: '#f4f4f3',
    swatchHex: '#f4f4f3',
    tone: 'white',
    metalness: 0.1,
    roughness: 0.28,
  },
  red: {
    id: 'red',
    name: 'Crimson Red',
    hex: '#c93b2b',
    swatchHex: '#c93b2b',
    tone: 'red',
    metalness: 0.2,
    roughness: 0.28,
  },
  blue: {
    id: 'blue',
    name: 'Pacific Blue',
    hex: '#1e4d6a',
    swatchHex: '#1e4d6a',
    tone: 'blue',
    metalness: 0.22,
    roughness: 0.28,
  },
  green: {
    id: 'green',
    name: 'Forest Green',
    hex: '#2d5a3f',
    swatchHex: '#2d5a3f',
    tone: 'green',
    metalness: 0.2,
    roughness: 0.32,
  },
  gold: {
    id: 'gold',
    name: 'Champagne Gold',
    hex: '#d4af37',
    swatchHex: '#d4af37',
    tone: 'gold',
    metalness: 0.85,
    roughness: 0.2,
  },
  silver: {
    id: 'silver',
    name: 'Stainless Steel',
    hex: '#d8dcde',
    swatchHex: '#d8dcde',
    tone: 'silver',
    metalness: 0.9,
    roughness: 0.22,
  },
  orange: {
    id: 'orange',
    name: 'Kohinoor Orange',
    hex: '#ed5a24',
    swatchHex: '#ed5a24',
    tone: 'orange',
    metalness: 0.2,
    roughness: 0.28,
  },
}

// Ordered list of tumbler colors (Default: Orange)
export const TUMBLER_COLORS: ProductColor[] = [
  PRODUCT_COLORS.orange,
  PRODUCT_COLORS.black,
  PRODUCT_COLORS.white,
  PRODUCT_COLORS.red,
  PRODUCT_COLORS.blue,
  PRODUCT_COLORS.green,
  PRODUCT_COLORS.gold,
  PRODUCT_COLORS.silver,
]

// Editorial chapters for the 8 product families
export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    number: '01',
    title: 'VACUUM BOTTLES',
    tagline: 'Extreme thermal endurance for travel & altitude.',
    description: 'Double-wall copper vacuum core engineered to preserve internal liquid temperatures for up to 24 hours cold and 12 hours steaming hot.',
    specs: ['1000ML & 750ML', '18/8 Stainless Steel', 'Sweat-Proof Finish'],
    accent: '#202527',
  },
  {
    number: '02',
    title: 'TUMBLERS',
    tagline: '40oz handled daily carry with splash-resistant lid.',
    description: 'Designed around morning commutes and all-day hydration. Tapered base seamlessly fits standard automotive cup holders with heavy-duty comfort grip.',
    specs: ['40 OZ / 1180 ML', 'Ergonomic Handle', 'Silicone Seal Lid'],
    accent: '#ed5a24',
  },
  {
    number: '03',
    title: 'SPORTS BOTTLES',
    tagline: 'High-flow active hydration engineered for movement.',
    description: 'Ultra-lightweight food-grade polymers with leakproof rapid-flow spout designed for gym routines, cycling cages, and running tracks.',
    specs: ['800ML Capacity', 'One-Touch Cap', 'Impact Resistance'],
    accent: '#1e4d6a',
  },
  {
    number: '04',
    title: 'SIPPERS',
    tagline: 'Quick-access ergonomic straw hydration for desktop and commute.',
    description: 'Precision angled flip straws integrated with airtight silicone leak guards for seamless one-handed drinking.',
    specs: ['650ML Capacity', 'Flip-Up Straw', 'One-Handed Carry'],
    accent: '#2d5a3f',
  },
  {
    number: '05',
    title: 'KIDS COLLECTION',
    tagline: 'Impact-resistant lightweight silicone loop carry.',
    description: '100% BPA-free drop-proof construction with rounded mouthpieces and easy-carry finger loops designed for active school days.',
    specs: ['500ML Easy Carry', 'Food-Safe Silicone', 'Drop-Tested Shell'],
    accent: '#c93b2b',
  },
  {
    number: '06',
    title: 'STAINLESS STEEL',
    tagline: 'Brushed raw industrial durability without compromise.',
    description: 'Single and double-wall food-grade austenitic steel with raw brushed satin texture built to last decades of rugged daily utility.',
    specs: ['Raw Brushed Finish', 'Corrosion Proof', 'Zero Plastic Contact'],
    accent: '#7c8382',
  },
  {
    number: '07',
    title: 'PLASTIC BOTTLES',
    tagline: 'Dual-compartment lightweight daily hydration.',
    description: 'Innovative dual-chamber vessels and crystal-clear polymer bottles allowing separated beverages in one ultra-portable silhouette.',
    specs: ['Dual Chamber', 'Featherlight Weight', 'Recyclable Polypropylene'],
    accent: '#2d5a3f',
  },
  {
    number: '08',
    title: 'TRAVEL DRINKWARE',
    tagline: 'Engineered for airport terminals, vehicle consoles, and road trips.',
    description: 'Slim-line profiles with locking push-button covers and thermal retention walls that keep you refreshed across time zones.',
    specs: ['Fits All Cup Holders', 'Leak-Lock Lid', 'Double Vacuum Wall'],
    accent: '#d4af37',
  },
]

// Curated 6 core catalogue products matching exact user specifications
export const CATALOGUE_PRODUCTS: CatalogueProduct[] = [
  {
    id: 'vac-1000',
    name: '1000ML VACUUM BOTTLE',
    category: 'Vacuum Bottles',
    description: 'Engineered with double-wall copper vacuum insulation to maintain beverage temperature for 24 hours cold and 12 hours steaming hot. Food-grade 18/8 stainless steel throughout.',
    capacity: '1000 ML',
    material: '18/8 Pro-Grade Austenitic Steel',
    image: '/images/products/vacuum-1000.jpg',
    colors: ['#1c2022', '#d8dcde', '#1e4d6a', '#ed5a24'],
    features: [
      'Double-wall vacuum thermal core',
      '24 hours cold / 12 hours hot',
      'Leakproof sealed carry cap',
      'Sweat-free condensation barrier',
      'Food-grade austenitic steel interior',
    ],
  },
  {
    id: 'premium-tumbler',
    name: 'PREMIUM TUMBLER',
    category: 'Tumblers',
    description: 'Flagship 40oz handled travel tumbler featuring 3-way rotating splash cover, reusable straw, and universal 75mm automotive cup-holder tapered base.',
    capacity: '40 OZ / 1180 ML',
    material: '18/8 Austenitic Stainless Steel & Food-Safe Polymer',
    image: '/images/products/tumbler-40.jpg',
    modelPath: '/model/stanley_tumbler_travel_cup_40_oz.glb',
    colors: ['#ed5a24', '#1c2022', '#f4f4f3', '#c93b2b', '#1e4d6a', '#2d5a3f', '#d4af37', '#d8dcde'],
    features: [
      '3-way rotating splash lid with reusable straw',
      'Dual-injection ergonomic comfort handle',
      '75mm tapered base fits standard vehicle cup holders',
      'Double-wall vacuum insulation (24H Ice Retention)',
      'Laser-etched branding and custom finishes',
    ],
  },
  {
    id: 'sports-sipper',
    name: 'SPORTS SIPPER',
    category: 'Sports Bottles',
    description: 'High-flow active hydration bottle designed with one-touch rapid flow spout, ergonomic finger loop, and bike-cage ready profile for intense workouts.',
    capacity: '800 ML',
    material: 'Ultra-Durable BPA-Free Tritan Polymer',
    image: '/images/products/sports-sipper.jpg',
    colors: ['#1e4d6a', '#1c2022', '#2d5a3f', '#ed5a24'],
    features: [
      'One-touch rapid-flow sports spout',
      'Ergonomic contour with textured finger grip',
      'Precision bicycle cage diameter',
      '100% leak-proof locking mechanism',
      'Tritan food-grade shatter-resistant polymer',
    ],
  },
  {
    id: 'steel-bottle',
    name: 'STAINLESS STEEL BOTTLE',
    category: 'Stainless Steel',
    description: 'Pure brushed industrial stainless steel bottle with raw satin texture, zero internal plastic contact, and indestructible all-metal threaded cap.',
    capacity: '750 ML',
    material: 'Single-Wall Brushed 304 Stainless Steel',
    image: '/images/products/steel-bottle.jpg',
    colors: ['#d8dcde', '#1c2022', '#d4af37'],
    features: [
      'Raw satin brushed industrial finish',
      'Zero plastic contact interior for pure taste',
      'Ultralight single-wall rugged build',
      'Wide-mouth ice filling and easy bottle-brush cleaning',
      'Stainless steel loop carry handle',
    ],
  },
  {
    id: 'kids-bottle',
    name: 'KIDS BOTTLE',
    category: 'Kids Collection',
    description: 'Drop-tested shock-resistant junior hydration bottle with soft food-grade silicone drinking spout and protective shock-absorbing bumper base.',
    capacity: '500 ML',
    material: 'Food-Safe Recyclable Polypropylene & Soft Silicone',
    image: '/images/products/kids-bottle.jpg',
    colors: ['#c93b2b', '#1e4d6a', '#ed5a24', '#2d5a3f'],
    features: [
      'Impact-damped base bumper survives drops',
      'Hygienic flip straw dust cover',
      'Integrated soft-touch silicone carry loop',
      '100% BPA and phthalate free',
      'Easy 3-piece disassembly for thorough dishwasher cleaning',
    ],
  },
  {
    id: 'double-compartment',
    name: 'DOUBLE COMPARTMENT BOTTLE',
    category: 'Plastic Bottles',
    description: 'Innovative split-chamber vessel providing two separate beverage compartments with dual dedicated sips in one ultra-portable silhouette.',
    capacity: '700 ML (350ml + 350ml)',
    material: 'High-Clarity BPA-Free Co-Polyester',
    image: '/images/products/double-compartment.jpg',
    colors: ['#2d5a3f', '#1e4d6a', '#1c2022', '#ed5a24'],
    features: [
      'Twin independent liquid chambers for 2 different drinks',
      'Dual drinking spouts with secure silicone seals',
      'Featherweight daily mobility for commute and gym',
      'Crystal clear scratch-resistant body',
      'Recyclable eco-conscious polymer construction',
    ],
  },
]

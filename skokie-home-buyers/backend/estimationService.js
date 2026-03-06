/**
 * Property Estimation Service
 * Enhanced mock system using historical Skokie sales data
 * Uses comparable sales analysis with property characteristics
 */

/**
 * Historical Skokie sales data (mock database)
 * Based on realistic Skokie, IL market trends
 */
const historicalSales = [
  // Recent sales (2024-2025)
  { address: '8234 Keeler Ave', sqft: 1850, beds: 3, baths: 2, yearBuilt: 1958, soldPrice: 425000, soldDate: '2024-11', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '9015 Gross Point Rd', sqft: 2100, beds: 4, baths: 2.5, yearBuilt: 1965, soldPrice: 485000, soldDate: '2024-10', condition: 'excellent', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '4812 Oakton St', sqft: 1650, beds: 3, baths: 2, yearBuilt: 1972, soldPrice: 395000, soldDate: '2024-09', condition: 'good', garage: false, basement: true, propertyType: 'Single Family' },
  { address: '7623 Niles Center Rd', sqft: 1400, beds: 2, baths: 1.5, yearBuilt: 1955, soldPrice: 310000, soldDate: '2024-11', condition: 'fair', garage: true, basement: true, propertyType: 'Townhouse' },
  { address: '5234 Church St', sqft: 2400, beds: 4, baths: 3, yearBuilt: 2015, soldPrice: 625000, soldDate: '2024-08', condition: 'excellent', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '8901 Lincoln Ave', sqft: 1200, beds: 2, baths: 1, yearBuilt: 1960, soldPrice: 265000, soldDate: '2024-10', condition: 'fair', garage: false, basement: false, propertyType: 'Condo' },
  { address: '3456 Dempster St', sqft: 1950, beds: 3, baths: 2, yearBuilt: 1968, soldPrice: 445000, soldDate: '2024-07', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '9123 Crawford Ave', sqft: 2250, beds: 4, baths: 2.5, yearBuilt: 2010, soldPrice: 575000, soldDate: '2024-11', condition: 'excellent', garage: true, basement: false, propertyType: 'Single Family' },
  { address: '4567 Main St', sqft: 1580, beds: 3, baths: 2, yearBuilt: 1975, soldPrice: 380000, soldDate: '2024-09', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '7890 Kostner Ave', sqft: 1750, beds: 3, baths: 2, yearBuilt: 1962, soldPrice: 410000, soldDate: '2024-08', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },

  // More sales across different neighborhoods
  { address: '5678 Kedzie Ave', sqft: 2600, beds: 5, baths: 3, yearBuilt: 2018, soldPrice: 685000, soldDate: '2024-06', condition: 'excellent', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '3210 Central Park Ave', sqft: 1350, beds: 2, baths: 1.5, yearBuilt: 1958, soldPrice: 295000, soldDate: '2024-10', condition: 'fair', garage: false, basement: true, propertyType: 'Townhouse' },
  { address: '8765 Ridge Ave', sqft: 1900, beds: 3, baths: 2, yearBuilt: 1970, soldPrice: 430000, soldDate: '2024-07', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '4321 Tripp Ave', sqft: 2150, beds: 4, baths: 2.5, yearBuilt: 1980, soldPrice: 495000, soldDate: '2024-09', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '6543 Howard St', sqft: 1450, beds: 2, baths: 2, yearBuilt: 2005, soldPrice: 340000, soldDate: '2024-08', condition: 'excellent', garage: false, basement: false, propertyType: 'Condo' },
  { address: '9876 Touhy Ave', sqft: 2050, beds: 4, baths: 2.5, yearBuilt: 1995, soldPrice: 520000, soldDate: '2024-11', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '2345 McCormick Blvd', sqft: 1680, beds: 3, baths: 2, yearBuilt: 1965, soldPrice: 395000, soldDate: '2024-06', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '7654 Gross Point Rd', sqft: 2300, beds: 4, baths: 3, yearBuilt: 2012, soldPrice: 615000, soldDate: '2024-10', condition: 'excellent', garage: true, basement: false, propertyType: 'Single Family' },
  { address: '5432 Oakton St', sqft: 1550, beds: 3, baths: 1.5, yearBuilt: 1968, soldPrice: 365000, soldDate: '2024-09', condition: 'fair', garage: true, basement: true, propertyType: 'Single Family' },
  { address: '8123 Niles Ave', sqft: 1800, beds: 3, baths: 2, yearBuilt: 1978, soldPrice: 415000, soldDate: '2024-08', condition: 'good', garage: true, basement: true, propertyType: 'Single Family' }
];

/**
 * Hash function to generate consistent values from strings
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Extract street name from full address
 */
function extractStreetName(address) {
  const cleaned = address
    .replace(/^\d+\s+/, '') // Remove house number
    .replace(/,.*$/, '') // Remove everything after comma
    .replace(/\s+(apt|unit|#).*$/i, '') // Remove apt/unit
    .toLowerCase()
    .trim();
  return cleaned;
}

/**
 * Validate if address is in Skokie, IL (60076)
 */
function isSkokieAddress(address) {
  const addressLower = address.toLowerCase();

  if (addressLower.includes('60076') || addressLower.includes('skokie')) {
    return true;
  }

  const skokieStreets = [
    'oakton', 'dempster', 'church', 'main', 'howard', 'touhy',
    'lincoln', 'crawford', 'niles', 'gross point', 'mccormick',
    'kostner', 'kedzie', 'ridge', 'central park', 'tripp'
  ];

  return skokieStreets.some(street => addressLower.includes(street));
}

/**
 * Generate realistic property characteristics based on address
 * Uses address hash to ensure consistency (same address = same characteristics)
 */
function generatePropertyCharacteristics(address) {
  const hash = hashString(address);
  const streetName = extractStreetName(address);
  const streetHash = hashString(streetName);

  // Generate square footage (1,200 - 2,800 sq ft typical for Skokie)
  const sqft = 1200 + (hash % 1600);

  // Generate bedrooms based on square footage
  let bedrooms;
  if (sqft < 1500) bedrooms = 2 + (hash % 2); // 2-3 bed
  else if (sqft < 2000) bedrooms = 3 + (hash % 2); // 3-4 bed
  else bedrooms = 4 + (hash % 2); // 4-5 bed

  // Generate bathrooms based on bedrooms and sq ft
  let bathrooms;
  if (bedrooms <= 2) bathrooms = 1 + ((hash % 10) > 6 ? 0.5 : 0); // 1-1.5
  else if (bedrooms === 3) bathrooms = 2 + ((hash % 10) > 5 ? 0.5 : 0); // 2-2.5
  else bathrooms = 2.5 + ((hash % 10) > 7 ? 0.5 : 0); // 2.5-3

  // Generate year built (1950-2020 typical for Skokie)
  const yearBuilt = 1950 + (streetHash % 70);

  // Generate lot size (3,000 - 8,000 sq ft typical)
  const lotSize = 3000 + (streetHash % 5000);

  // Property type based on square footage and lot size
  let propertyType;
  if (sqft < 1400 && lotSize < 4000) propertyType = 'Townhouse';
  else if (sqft < 1600 && lotSize < 5000) propertyType = 'Condo';
  else propertyType = 'Single Family';

  // Generate condition based on age
  const age = 2026 - yearBuilt;
  let condition;
  if (age < 15) condition = 'excellent';
  else if (age < 35) condition = (hash % 10) > 4 ? 'good' : 'excellent';
  else if (age < 55) condition = (hash % 10) > 3 ? 'good' : 'fair';
  else condition = (hash % 10) > 6 ? 'good' : 'fair';

  // Garage: more common in single family homes
  const hasGarage = propertyType === 'Single Family'
    ? (hash % 10) > 2 // 80% have garage
    : (hash % 10) > 7; // 30% for condos/townhouses

  // Basement: very common in older Skokie homes
  const hasBasement = propertyType === 'Condo'
    ? false // Condos typically don't have basements
    : (hash % 10) > 1; // 90% of houses have basement

  return {
    sqft,
    bedrooms,
    bathrooms,
    yearBuilt,
    lotSize,
    propertyType,
    condition,
    garage: hasGarage,
    basement: hasBasement
  };
}

/**
 * Find comparable sales from historical data
 * Returns up to 5 most similar properties
 */
function findComparables(characteristics) {
  const { sqft, bedrooms, bathrooms, propertyType, yearBuilt } = characteristics;

  // Calculate similarity score for each historical sale
  const scoredComps = historicalSales.map(sale => {
    let score = 100;

    // Square footage similarity (most important factor)
    const sqftDiff = Math.abs(sale.sqft - sqft);
    score -= (sqftDiff / 100) * 2; // Penalize 2 points per 100 sqft difference

    // Property type match (critical)
    if (sale.propertyType !== propertyType) {
      score -= 30; // Heavy penalty for different type
    }

    // Bedroom similarity
    const bedDiff = Math.abs(sale.beds - bedrooms);
    score -= bedDiff * 8; // 8 points per bedroom difference

    // Bathroom similarity
    const bathDiff = Math.abs(sale.baths - bathrooms);
    score -= bathDiff * 6; // 6 points per bathroom difference

    // Age similarity
    const ageDiff = Math.abs(sale.yearBuilt - yearBuilt);
    score -= (ageDiff / 10) * 1; // 1 point per 10 years difference

    return { sale, score };
  });

  // Sort by score (highest first) and take top 5
  scoredComps.sort((a, b) => b.score - a.score);
  return scoredComps.slice(0, 5).map(item => item.sale);
}

/**
 * Calculate property estimate using comparable sales analysis
 * This is a more sophisticated approach based on actual market data
 */
function calculateEstimate(characteristics, address) {
  const { sqft, bedrooms, bathrooms, yearBuilt, propertyType, condition, garage, basement } = characteristics;

  // Find comparable sales
  const comparables = findComparables(characteristics);

  // Calculate weighted average price per sqft from comparables
  let totalPricePerSqFt = 0;
  let totalWeight = 0;

  comparables.forEach((comp, index) => {
    const pricePerSqFt = comp.soldPrice / comp.sqft;
    // More weight to closer matches (first comp has highest weight)
    const weight = 5 - index; // 5, 4, 3, 2, 1
    totalPricePerSqFt += pricePerSqFt * weight;
    totalWeight += weight;
  });

  const avgPricePerSqFt = totalPricePerSqFt / totalWeight;

  // Start with base estimate from comparables
  let estimate = sqft * avgPricePerSqFt;

  // Adjust for property-specific features

  // Condition adjustment
  const conditionMultipliers = {
    'excellent': 1.08,
    'good': 1.00,
    'fair': 0.92
  };
  estimate *= conditionMultipliers[condition] || 1.00;

  // Garage value
  if (garage) {
    estimate += 15000; // Garage adds value
  }

  // Basement value
  if (basement) {
    estimate += 20000; // Finished/usable basement adds value
  }

  // Age adjustment (relative to comparables average)
  const avgCompAge = comparables.reduce((sum, comp) => sum + (2026 - comp.yearBuilt), 0) / comparables.length;
  const propertyAge = 2026 - yearBuilt;
  const ageDifference = avgCompAge - propertyAge;

  if (ageDifference > 0) {
    // Property is newer than comparables
    estimate *= (1 + (ageDifference / 100) * 0.5); // 0.5% per year newer
  } else {
    // Property is older than comparables
    estimate *= (1 + (ageDifference / 100) * 0.5); // Penalty for older
  }

  // Bedroom/Bathroom premium for larger homes
  if (bedrooms >= 4 && sqft > 2000) estimate *= 1.03;
  if (bathrooms >= 3) estimate *= 1.02;

  // Street-based micro-market adjustment
  const streetName = extractStreetName(address);
  const streetHash = hashString(streetName);
  const streetMultiplier = 1 + ((streetHash % 20) - 10) / 100; // ±10%
  estimate *= streetMultiplier;

  // Ensure within realistic Skokie bounds
  const minEstimate = 180000;
  const maxEstimate = 800000;
  estimate = Math.max(minEstimate, Math.min(maxEstimate, estimate));

  return Math.round(estimate);
}

/**
 * Generate property estimate for a Skokie address
 */
export function estimateProperty(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address provided');
  }

  if (!isSkokieAddress(address)) {
    return {
      success: false,
      error: 'We currently only buy properties in Skokie, IL (60076). Please enter a valid Skokie address.'
    };
  }

  // Generate property characteristics
  const characteristics = generatePropertyCharacteristics(address);

  // Calculate estimate based on characteristics
  const estimate = calculateEstimate(characteristics, address);

  return {
    success: true,
    estimate,
    address,
    propertyDetails: characteristics
  };
}

/**
 * Calculate cash offer based on property condition and market factors
 * Uses realistic model: 50-72% depending on property characteristics
 * Accounts for repairs, holding costs, transaction fees, and profit margin
 */
export function calculateCashOffer(estimate, address, propertyDetails) {
  const addressHash = hashString(address);
  const { yearBuilt, condition, garage, basement, sqft, bedrooms } = propertyDetails;

  // Base offer percentage: 55% (industry standard for cash buyers)
  let offerPercentage = 0.55;

  // Condition is the biggest factor (affects repair costs)
  const conditionAdjustments = {
    'excellent': 0.12,  // 67% base - minimal repairs needed
    'good': 0.06,       // 61% base - some cosmetic updates
    'fair': 0.00        // 55% base - significant repairs expected
  };
  offerPercentage += conditionAdjustments[condition] || 0.00;

  // Age factor (older homes = more hidden issues)
  const age = 2026 - yearBuilt;
  if (age < 10) {
    offerPercentage += 0.05; // Nearly new: minimal risk, +5%
  } else if (age < 25) {
    offerPercentage += 0.03; // Modern systems: +3%
  } else if (age > 60) {
    offerPercentage -= 0.05; // Likely needs major updates: -5%
  }

  // Desirable features reduce holding time (easier to flip/rent)
  if (garage) offerPercentage += 0.02; // +2%
  if (basement) offerPercentage += 0.02; // +2%

  // Market demand affects resale speed
  if (sqft > 2200 && bedrooms >= 4) {
    offerPercentage += 0.03; // Family homes sell faster: +3%
  }

  if (sqft < 1500 && bedrooms >= 2) {
    offerPercentage += 0.03; // Starter homes high demand: +3%
  }

  // Add small variation based on address for realism (±1.5%)
  const randomVariation = ((addressHash % 30) - 15) / 1000; // -0.015 to +0.015
  offerPercentage += randomVariation;

  // Ensure within realistic cash buyer bounds (50-72%)
  offerPercentage = Math.max(0.50, Math.min(0.72, offerPercentage));

  const cashOffer = Math.round(estimate * offerPercentage);

  return {
    cashOffer,
    offerPercentage: Math.round(offerPercentage * 100),
    // Return breakdown for transparency
    factors: {
      condition,
      age: 2026 - yearBuilt,
      hasGarage: garage,
      hasBasement: basement
    }
  };
}

/**
 * Get complete offer details for an address
 */
export function getOfferDetails(address) {
  try {
    // Get property estimate with characteristics
    const estimateResult = estimateProperty(address);

    if (!estimateResult.success) {
      return estimateResult;
    }

    // Find comparable sales for transparency
    const comparables = findComparables(estimateResult.propertyDetails);

    // Calculate cash offer based on property details
    const offerResult = calculateCashOffer(
      estimateResult.estimate,
      address,
      estimateResult.propertyDetails
    );

    return {
      success: true,
      address: address,
      estimate: estimateResult.estimate,
      cashOffer: offerResult.cashOffer,
      offerPercentage: offerResult.offerPercentage,
      propertyDetails: estimateResult.propertyDetails,
      comparableSales: comparables.map(comp => ({
        address: comp.address,
        sqft: comp.sqft,
        beds: comp.beds,
        baths: comp.baths,
        soldPrice: comp.soldPrice,
        soldDate: comp.soldDate
      })),
      offerFactors: offerResult.factors,
      message: `We can offer you ${formatCurrency(offerResult.cashOffer)} in cash for your property!`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to generate offer. Please check the address and try again.'
    };
  }
}

/**
 * Format number as currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

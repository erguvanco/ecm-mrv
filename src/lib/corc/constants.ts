/**
 * Puro.earth Biochar Methodology Constants
 * Edition 2025 V1
 *
 * Contains persistence parameters (Table 6.1), GWP values, and iLUC factors
 */

/**
 * BC+200 Persistence Parameters (Table 6.1)
 *
 * Regression coefficients for calculating persistence fraction (PF)
 * based on mean annual soil temperature.
 *
 * Equation 6.4: PF = M - a × H/C_org
 *
 * Where:
 * - M: Intercept coefficient (%)
 * - a: Slope coefficient (relates H/C_org to persistence loss)
 * - Temperature: Mean annual soil temperature in °C (7-40 range)
 */
export const PERSISTENCE_PARAMS: Record<number, { M: number; a: number }> = {
  7: { M: 96.59, a: 11.28 },
  8: { M: 95.98, a: 13.44 },
  9: { M: 95.28, a: 15.78 },
  10: { M: 94.49, a: 18.28 },
  11: { M: 93.60, a: 20.93 },
  12: { M: 92.62, a: 23.70 },
  13: { M: 91.54, a: 26.58 },
  14: { M: 90.37, a: 29.54 },
  15: { M: 89.10, a: 32.56 },
  16: { M: 87.75, a: 35.60 },
  17: { M: 86.31, a: 38.64 },
  18: { M: 86.19, a: 38.86 },
  19: { M: 86.19, a: 39.70 },
  20: { M: 86.19, a: 40.53 },
  21: { M: 86.19, a: 41.37 },
  22: { M: 86.19, a: 42.20 },
  23: { M: 86.19, a: 43.04 },
  24: { M: 86.19, a: 43.88 },
  25: { M: 86.19, a: 44.71 },
  26: { M: 86.19, a: 45.55 },
  27: { M: 86.19, a: 46.38 },
  28: { M: 86.19, a: 47.22 },
  29: { M: 86.19, a: 48.05 },
  30: { M: 86.19, a: 48.25 },
  31: { M: 86.19, a: 48.25 },
  32: { M: 86.19, a: 48.25 },
  33: { M: 86.19, a: 48.25 },
  34: { M: 86.19, a: 48.25 },
  35: { M: 86.19, a: 48.25 },
  36: { M: 86.19, a: 48.25 },
  37: { M: 86.19, a: 48.25 },
  38: { M: 86.19, a: 48.25 },
  39: { M: 86.19, a: 48.25 },
  40: { M: 86.19, a: 48.25 },
};

/**
 * Global Warming Potential (GWP) values
 * Based on IPCC AR5 (100-year time horizon)
 */
export const GWP_VALUES = {
  CO2: 1,
  CH4: 28, // Methane
  N2O: 265, // Nitrous oxide
} as const;

/**
 * Carbon conversion ratio
 * CO2/C molar mass ratio = 44/12 = 3.667
 */
export const CO2_TO_C_RATIO = 44 / 12; // 3.6667

/**
 * Biochar quality threshold
 * H/C_org ratio must be <= 0.7 per Puro methodology (Section 3.5)
 */
export const H_C_ORG_THRESHOLD = 0.7;

/**
 * iLUC factors (Table 8.3)
 * Indirect Land Use Change factors for high-risk feedstocks
 * Units: kg CO2e per MJ of biomass feedstock (dry LHV basis)
 */
export const ILUC_FACTORS = {
  CEREALS_STARCH: 0.012, // kg CO2e/MJ
  SUGAR_CROPS: 0.013, // kg CO2e/MJ
  OIL_CROPS: 0.055, // kg CO2e/MJ
} as const;

/**
 * High iLUC risk feedstock types (Section 8.2.3.d)
 */
export const HIGH_ILUC_RISK_FEEDSTOCKS = [
  'palm', // Biomass from palm tree plantations
  'soybean', // Biomass from soybean cultivation
] as const;

/**
 * Puro Biomass Categories (A-O) per Section 3.4.5
 */
export const PURO_BIOMASS_CATEGORIES = {
  A: {
    code: 'A',
    name: 'Straw, stover, husks, shells, cobs, and similar agricultural production residues',
    description: 'Agricultural residues from crop production',
    examples: ['wheat_straw', 'corn_stover', 'rice_husk', 'hazelnut_shells', 'corn_silk'],
  },
  B: {
    code: 'B',
    name: 'Garden and park waste (excluding food waste)',
    description: 'Green waste from gardens and parks',
    examples: [],
  },
  C: {
    code: 'C',
    name: 'Forestry residues (harvesting residues, dead wood, and other non-commercial wood)',
    description: 'Residues from forestry operations',
    examples: ['logging_residues'],
  },
  D: {
    code: 'D',
    name: 'Wood processing industry streams (sawdust, bark, chips)',
    description: 'By-products from wood processing',
    examples: ['wood_chips', 'sawdust', 'bark'],
  },
  E: {
    code: 'E',
    name: 'Post-consumer wood (construction, demolition, furniture)',
    description: 'Waste wood from end-of-life products',
    examples: [],
  },
  F: {
    code: 'F',
    name: 'Food and beverage processing residues (excluding animal fats)',
    description: 'Organic residues from food processing',
    examples: ['food_waste', 'brewery_spent_grain', 'fruit_vegetable_residues', 'sugar_beet_pulp'],
  },
  G: {
    code: 'G',
    name: 'Food processing fats and oils (used cooking oil, animal fats)',
    description: 'Waste fats and oils from food industry',
    examples: ['used_cooking_oil', 'animal_fats'],
  },
  H: {
    code: 'H',
    name: 'Animal manure and slurry',
    description: 'Organic waste from animal husbandry',
    examples: ['cattle_manure', 'poultry_litter', 'animal_slurry'],
  },
  I: {
    code: 'I',
    name: 'Human waste (biosolids from composting toilets)',
    description: 'Processed human waste',
    examples: [],
  },
  J: {
    code: 'J',
    name: 'Sewage sludge',
    description: 'Sludge from wastewater treatment',
    examples: [],
  },
  K: {
    code: 'K',
    name: 'Paper industry sludge and black liquor',
    description: 'Residues from paper manufacturing',
    examples: [],
  },
  L: {
    code: 'L',
    name: 'Other industrial and commercial organic streams',
    description: 'Miscellaneous industrial organic waste',
    examples: [],
  },
  M: {
    code: 'M',
    name: 'Invasive species and nuisance vegetation',
    description: 'Biomass from invasive plant management',
    examples: [],
  },
  N: {
    code: 'N',
    name: 'Landscape management residues (fire prevention, roadside clearing)',
    description: 'Residues from landscape maintenance',
    examples: ['cotton_stalks'],
  },
  O: {
    code: 'O',
    name: 'Cultivated or harvested water-based plants or algae',
    description: 'Aquatic biomass',
    examples: [],
  },
} as const;

/**
 * End-use categories per Puro methodology (Section 3.6)
 */
export const END_USE_CATEGORIES = {
  SOIL_AGRICULTURE: {
    code: 'SOIL_AGRICULTURE',
    name: 'Soil - Agriculture',
    description: 'Application to agricultural soils',
    requiresSoilTemp: true,
  },
  SOIL_FORESTRY: {
    code: 'SOIL_FORESTRY',
    name: 'Soil - Forestry',
    description: 'Application to forest soils',
    requiresSoilTemp: true,
  },
  SOIL_URBAN: {
    code: 'SOIL_URBAN',
    name: 'Soil - Urban/Landscaping',
    description: 'Application to urban soils and landscaping',
    requiresSoilTemp: true,
  },
  CONSTRUCTION_CONCRETE: {
    code: 'CONSTRUCTION_CONCRETE',
    name: 'Construction - Concrete',
    description: 'Embedded in concrete products',
    requiresSoilTemp: false,
  },
  CONSTRUCTION_ASPHALT: {
    code: 'CONSTRUCTION_ASPHALT',
    name: 'Construction - Asphalt',
    description: 'Mixed into asphalt',
    requiresSoilTemp: false,
  },
  CONSTRUCTION_BRICKS: {
    code: 'CONSTRUCTION_BRICKS',
    name: 'Construction - Bricks/Blocks',
    description: 'Embedded in bricks or blocks',
    requiresSoilTemp: false,
  },
  OTHER: {
    code: 'OTHER',
    name: 'Other',
    description: 'Other eligible end-use',
    requiresSoilTemp: false,
  },
} as const;

/**
 * Baseline types per Puro methodology (Section 3.2)
 */
export const BASELINE_TYPES = {
  NEW_BUILT: {
    code: 'NEW_BUILT',
    name: 'New Built',
    description: 'New facility with no prior carbonization activity',
    baselineStorageDefault: 0,
  },
  RETROFIT_FACILITY: {
    code: 'RETROFIT_FACILITY',
    name: 'Retrofit Facility',
    description: 'Existing bioenergy/biomaterial facility retrofitted for biochar',
    baselineStorageDefault: 0,
  },
  CHARCOAL_REPURPOSE: {
    code: 'CHARCOAL_REPURPOSE',
    name: 'Charcoal Repurpose',
    description: 'Existing charcoal diverted from combustion to long-term storage',
    baselineStorageDefault: null, // Must be calculated
  },
} as const;

/**
 * Leakage status options
 */
export const LEAKAGE_STATUS = {
  MITIGATED: 'MITIGATED',
  QUANTIFIED: 'QUANTIFIED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

/**
 * CORC status lifecycle
 */
export const CORC_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  RETIRED: 'retired',
} as const;

/**
 * Permanence types
 */
export const PERMANENCE_TYPES = {
  BC100: 'BC100+',
  BC200: 'BC200+',
} as const;

/**
 * Calculation version identifier
 * Used for audit trail and result reproducibility
 */
export const CALCULATION_VERSION = 'puro-biochar-2025-v1.0.0';

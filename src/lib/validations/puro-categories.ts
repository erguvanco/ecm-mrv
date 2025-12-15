import { z } from 'zod';

/**
 * Puro.earth Biochar Methodology Categories
 * Based on Section 3.4.5 (Biomass Categories A-O) and Section 3.6 (End-Use)
 */

/**
 * Puro Biomass Categories (A-O) per Section 3.4.5
 */
export const PURO_BIOMASS_CATEGORIES = [
  {
    code: 'A',
    name: 'Agricultural Production Residues',
    description: 'Straw, stover, husks, shells, cobs, and similar agricultural production residues',
    ilucRisk: 'high',
    examples: ['wheat_straw', 'corn_stover', 'rice_husk', 'hazelnut_shells', 'corn_silk'],
  },
  {
    code: 'B',
    name: 'Garden and Park Waste',
    description: 'Garden and park waste (excluding food waste)',
    ilucRisk: 'high',
    examples: [],
  },
  {
    code: 'C',
    name: 'Forestry Residues',
    description: 'Forestry residues (harvesting residues, dead wood, non-commercial wood)',
    ilucRisk: 'low',
    examples: ['logging_residues'],
  },
  {
    code: 'D',
    name: 'Wood Processing Industry',
    description: 'Wood processing industry streams (sawdust, bark, chips)',
    ilucRisk: 'low',
    examples: ['wood_chips', 'sawdust', 'bark'],
  },
  {
    code: 'E',
    name: 'Post-Consumer Wood',
    description: 'Post-consumer wood (construction, demolition, furniture)',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'F',
    name: 'Food Processing Residues',
    description: 'Food and beverage processing residues (excluding animal fats)',
    ilucRisk: 'low',
    examples: ['food_waste', 'brewery_spent_grain', 'fruit_vegetable_residues', 'sugar_beet_pulp'],
  },
  {
    code: 'G',
    name: 'Waste Fats and Oils',
    description: 'Food processing fats and oils (used cooking oil, animal fats)',
    ilucRisk: 'low',
    examples: ['used_cooking_oil', 'animal_fats'],
  },
  {
    code: 'H',
    name: 'Animal Manure',
    description: 'Animal manure and slurry',
    ilucRisk: 'low',
    examples: ['cattle_manure', 'poultry_litter', 'animal_slurry'],
  },
  {
    code: 'I',
    name: 'Human Waste',
    description: 'Human waste (biosolids from composting toilets)',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'J',
    name: 'Sewage Sludge',
    description: 'Sewage sludge',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'K',
    name: 'Paper Industry Sludge',
    description: 'Paper industry sludge and black liquor',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'L',
    name: 'Industrial Organic Streams',
    description: 'Other industrial and commercial organic streams',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'M',
    name: 'Invasive Species',
    description: 'Invasive species and nuisance vegetation',
    ilucRisk: 'low',
    examples: [],
  },
  {
    code: 'N',
    name: 'Landscape Management',
    description: 'Landscape management residues (fire prevention, roadside clearing)',
    ilucRisk: 'high',
    examples: ['cotton_stalks'],
  },
  {
    code: 'O',
    name: 'Aquatic Plants',
    description: 'Cultivated or harvested water-based plants or algae',
    ilucRisk: 'low',
    examples: [],
  },
] as const;

export type PuroBiomassCategory = typeof PURO_BIOMASS_CATEGORIES[number];
export type PuroCategoryCode = PuroBiomassCategory['code'];

/**
 * End-Use Categories per Section 3.6
 */
export const PURO_END_USE_CATEGORIES = [
  {
    code: 'SOIL_AGRICULTURE',
    name: 'Soil - Agriculture',
    description: 'Application to agricultural soils',
    requiresSoilTemp: true,
    permanenceType: 'BC200+',
  },
  {
    code: 'SOIL_FORESTRY',
    name: 'Soil - Forestry',
    description: 'Application to forest soils',
    requiresSoilTemp: true,
    permanenceType: 'BC200+',
  },
  {
    code: 'SOIL_URBAN',
    name: 'Soil - Urban/Landscaping',
    description: 'Application to urban soils and landscaping',
    requiresSoilTemp: true,
    permanenceType: 'BC200+',
  },
  {
    code: 'CONSTRUCTION_CONCRETE',
    name: 'Construction - Concrete',
    description: 'Embedded in concrete products',
    requiresSoilTemp: false,
    permanenceType: 'BC200+',
  },
  {
    code: 'CONSTRUCTION_ASPHALT',
    name: 'Construction - Asphalt',
    description: 'Mixed into asphalt',
    requiresSoilTemp: false,
    permanenceType: 'BC200+',
  },
  {
    code: 'CONSTRUCTION_BRICKS',
    name: 'Construction - Bricks/Blocks',
    description: 'Embedded in bricks or blocks',
    requiresSoilTemp: false,
    permanenceType: 'BC200+',
  },
  {
    code: 'OTHER',
    name: 'Other',
    description: 'Other eligible end-use (requires documentation)',
    requiresSoilTemp: false,
    permanenceType: 'BC200+',
  },
] as const;

export type PuroEndUseCategory = typeof PURO_END_USE_CATEGORIES[number];
export type EndUseCategoryCode = PuroEndUseCategory['code'];

/**
 * Source Classification per Section 3.4
 */
export const SOURCE_CLASSIFICATIONS = [
  { value: 'RESIDUE', label: 'Residue', description: 'By-product from other production processes' },
  { value: 'WASTE', label: 'Waste', description: 'Material with no other economic use' },
  { value: 'DEDICATED_CROP', label: 'Dedicated Crop', description: 'Specifically grown for biochar production' },
] as const;

export type SourceClassification = typeof SOURCE_CLASSIFICATIONS[number]['value'];

/**
 * Soil Temperature Regions (approximate values for BC+200 model)
 * Based on global mean annual soil temperatures
 */
export const SOIL_TEMPERATURE_REGIONS = [
  { region: 'Arctic/Subarctic', tempC: 7, countries: ['Iceland', 'Greenland', 'Northern Canada', 'Northern Russia'] },
  { region: 'Northern Europe', tempC: 10, countries: ['Norway', 'Sweden', 'Finland', 'Denmark'] },
  { region: 'Central Europe', tempC: 12, countries: ['Germany', 'Poland', 'Austria', 'Czech Republic'] },
  { region: 'Western Europe', tempC: 13, countries: ['UK', 'Ireland', 'Belgium', 'Netherlands', 'France'] },
  { region: 'Southern Europe', tempC: 17, countries: ['Spain', 'Portugal', 'Italy', 'Greece'] },
  { region: 'Turkey/Eastern Mediterranean', tempC: 15, countries: ['Turkey', 'Cyprus'] },
  { region: 'Middle East', tempC: 22, countries: ['Israel', 'Jordan', 'Lebanon', 'UAE', 'Saudi Arabia'] },
  { region: 'Northern USA/Canada', tempC: 10, countries: ['Northern USA', 'Southern Canada'] },
  { region: 'Central USA', tempC: 14, countries: ['Central USA'] },
  { region: 'Southern USA', tempC: 20, countries: ['Southern USA', 'Texas', 'Florida'] },
  { region: 'Central America', tempC: 25, countries: ['Mexico', 'Guatemala', 'Costa Rica'] },
  { region: 'South America - Temperate', tempC: 15, countries: ['Argentina', 'Chile', 'Uruguay'] },
  { region: 'South America - Tropical', tempC: 26, countries: ['Brazil', 'Colombia', 'Peru'] },
  { region: 'Northern Africa', tempC: 22, countries: ['Morocco', 'Tunisia', 'Egypt'] },
  { region: 'Sub-Saharan Africa', tempC: 28, countries: ['Kenya', 'Tanzania', 'Nigeria', 'Ghana'] },
  { region: 'Southern Africa', tempC: 20, countries: ['South Africa', 'Namibia', 'Botswana'] },
  { region: 'South Asia', tempC: 26, countries: ['India', 'Pakistan', 'Bangladesh'] },
  { region: 'Southeast Asia', tempC: 28, countries: ['Thailand', 'Vietnam', 'Indonesia', 'Malaysia'] },
  { region: 'East Asia - Temperate', tempC: 14, countries: ['Japan', 'South Korea'] },
  { region: 'East Asia - Subtropical', tempC: 18, countries: ['Southern China', 'Taiwan'] },
  { region: 'Australia - Temperate', tempC: 16, countries: ['Southern Australia', 'Tasmania'] },
  { region: 'Australia - Tropical', tempC: 28, countries: ['Northern Australia', 'Queensland'] },
  { region: 'New Zealand', tempC: 12, countries: ['New Zealand'] },
] as const;

/**
 * Zod schemas for validation
 */
export const puroCategorySchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']);

export const endUseCategorySchema = z.enum([
  'SOIL_AGRICULTURE',
  'SOIL_FORESTRY',
  'SOIL_URBAN',
  'CONSTRUCTION_CONCRETE',
  'CONSTRUCTION_ASPHALT',
  'CONSTRUCTION_BRICKS',
  'OTHER',
]);

export const sourceClassificationSchema = z.enum(['RESIDUE', 'WASTE', 'DEDICATED_CROP']);

/**
 * Map existing feedstock types to Puro categories
 */
export function mapFeedstockToPuroCategory(feedstockType: string): PuroCategoryCode | null {
  const mapping: Record<string, PuroCategoryCode> = {
    // Category A - Agricultural residues
    wheat_straw: 'A',
    corn_stover: 'A',
    corn_silk: 'A',
    rice_husk: 'A',
    sugar_beet_pulp: 'A',
    cotton_stalks: 'N', // Actually landscape management
    hazelnut_shells: 'A',

    // Category C - Forestry residues
    logging_residues: 'C',

    // Category D - Wood processing
    wood_chips: 'D',
    sawdust: 'D',
    bark: 'D',

    // Category F - Food processing
    food_waste: 'F',
    brewery_spent_grain: 'F',
    fruit_vegetable_residues: 'F',

    // Category G - Waste fats/oils
    used_cooking_oil: 'G',
    animal_fats: 'G',

    // Category H - Animal manure
    cattle_manure: 'H',
    poultry_litter: 'H',
    animal_slurry: 'H',

    // Energy crops - would need dedicated crop classification
    energy_maize: 'A', // Treat as agricultural
    miscanthus: 'A',
    switchgrass: 'A',
    sweet_sorghum: 'A',
  };

  return mapping[feedstockType] || null;
}

/**
 * Get iLUC risk level for a Puro category
 */
export function getPuroCategoryILUCRisk(categoryCode: PuroCategoryCode): 'low' | 'high' {
  const category = PURO_BIOMASS_CATEGORIES.find(c => c.code === categoryCode);
  return category?.ilucRisk || 'low';
}

/**
 * Check if end-use category requires soil temperature
 */
export function endUseRequiresSoilTemp(categoryCode: EndUseCategoryCode): boolean {
  const category = PURO_END_USE_CATEGORIES.find(c => c.code === categoryCode);
  return category?.requiresSoilTemp ?? false;
}

/**
 * Get suggested soil temperature for a country/region
 */
export function getSuggestedSoilTemperature(country: string): number | null {
  const region = SOIL_TEMPERATURE_REGIONS.find(r =>
    r.countries.some(c => c.toLowerCase().includes(country.toLowerCase()))
  );
  return region?.tempC || null;
}

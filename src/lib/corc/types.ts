/**
 * Puro.earth Biochar Methodology Types
 * Edition 2025 V1
 */

/**
 * Input for H/C_org ratio calculation (Equation 6.5)
 */
export interface HCorgInput {
  /** Hydrogen mass content (%) */
  hydrogenPercent: number;
  /** Organic carbon mass content (%) */
  organicCarbonPercent: number;
}

/**
 * Input for C_stored calculation (Equation 6.1)
 */
export interface CStoredInput {
  /** Dry mass of biochar produced (tonnes) */
  biocharDryMassTonnes: number;
  /** Organic carbon content (%) */
  organicCarbonPercent: number;
}

/**
 * Input for persistence fraction calculation (Equation 6.4)
 */
export interface PersistenceInput {
  /** H/C_org molar ratio */
  hCorgRatio: number;
  /** Mean annual soil temperature (°C) */
  meanSoilTempC: number;
}

/**
 * Biomass sourcing emissions (E_biomass)
 */
export interface BiomassEmissions {
  /** Cultivation emissions (only for dedicated crops) - kg CO2e */
  cultivation: number;
  /** Collection/gathering emissions - kg CO2e */
  collection: number;
  /** Transport to facility emissions - kg CO2e */
  transport: number;
  /** Pre-processing emissions (chipping, drying) - kg CO2e */
  preprocessing: number;
}

/**
 * Production emissions (E_production)
 */
export interface ProductionEmissions {
  /** Energy input emissions (start-up fuel, electricity) - kg CO2e */
  energy: number;
  /** Material input emissions (consumables, chemicals) - kg CO2e */
  materials: number;
  /** Waste disposal emissions - kg CO2e */
  waste: number;
  /** Direct CH4 emissions at stack - kg CH4 */
  stackCH4Kg: number;
  /** Direct N2O emissions at stack - kg N2O */
  stackN2OKg: number;
  /** Fossil CO2 from impurities - kg CO2 */
  fossilCO2Kg: number;
  /** Maintenance emissions - kg CO2e */
  maintenance: number;
}

/**
 * Embodied emissions (E_emb)
 */
export interface EmbodiedEmissions {
  /** Infrastructure/equipment lifecycle emissions (amortized) - kg CO2e */
  infrastructure: number;
  /** Direct land use change emissions - kg CO2e */
  dLUC: number;
}

/**
 * End-use emissions (E_use)
 */
export interface EndUseEmissions {
  /** Transport to end-use location - kg CO2e */
  transport: number;
  /** Packaging emissions - kg CO2e */
  packaging: number;
  /** Incorporation/application emissions - kg CO2e */
  incorporation: number;
}

/**
 * Full project emissions input (E_project = E_ops + E_emb)
 */
export interface EProjectInput {
  /** Biomass sourcing emissions */
  biomassEmissions: BiomassEmissions;
  /** Production emissions */
  productionEmissions: ProductionEmissions;
  /** Embodied emissions (amortized) */
  embodiedEmissions: EmbodiedEmissions;
  /** End-use emissions */
  endUseEmissions: EndUseEmissions;
  /** Co-product allocation factor (0-1, applied to production emissions) */
  coProductAllocationFactor?: number;
}

/**
 * Ecological leakage components
 */
export interface EcologicalLeakage {
  /** Facility construction/extension leakage - kg CO2e */
  facility: number;
  /** Biomass sourcing area leakage - kg CO2e */
  biomassSourcing: number;
}

/**
 * Market and activity-shifting leakage components
 */
export interface MarketActivityLeakage {
  /** AFOLU sector leakage - kg CO2e */
  afolu: number;
  /** Energy/material market leakage - kg CO2e */
  energyMaterial: number;
  /** iLUC contribution (for high-risk feedstocks) - kg CO2e */
  iluc: number;
}

/**
 * Full leakage input (E_leakage = L_ECO + L_MA)
 */
export interface LeakageInput {
  /** Ecological leakage */
  ecologicalLeakage: EcologicalLeakage;
  /** Market and activity-shifting leakage */
  marketActivityLeakage: MarketActivityLeakage;
}

/**
 * Baseline type
 */
export type BaselineType = 'NEW_BUILT' | 'RETROFIT_FACILITY' | 'CHARCOAL_REPURPOSE';

/**
 * Permanence type
 */
export type PermanenceType = 'BC100+' | 'BC200+';

/**
 * Full CORC calculation input
 */
export interface CORCCalculationInput {
  // Production batch data
  /** Dry mass of biochar produced (tonnes) */
  biocharDryMassTonnes: number;
  /** Organic carbon content (%) */
  organicCarbonPercent: number;
  /** Hydrogen content (%) */
  hydrogenPercent: number;

  // End-use data
  /** Mean annual soil temperature at application site (°C) */
  meanSoilTempC: number;

  // Baseline
  /** Baseline scenario type */
  baselineType: BaselineType;
  /** Baseline carbon storage (only for CHARCOAL_REPURPOSE) - tCO2e */
  baselineCarbonStorageTCO2e?: number;

  // LCA data
  /** Project emissions input */
  projectEmissions: EProjectInput;
  /** Leakage emissions input */
  leakageEmissions: LeakageInput;
}

/**
 * CORC calculation result
 */
export interface CORCCalculationResult {
  // Inputs processed
  /** Calculated H/C_org molar ratio */
  hCorgRatio: number;
  /** Whether biochar passes quality threshold (H/Corg <= 0.7) */
  qualityValid: boolean;

  // Formula components
  /** Carbon stored in biochar (tCO2e) - Equation 6.1 */
  cStoredTCO2e: number;
  /** Baseline carbon storage (tCO2e) */
  cBaselineTCO2e: number;
  /** Carbon loss due to decomposition (tCO2e) - Equation 6.3 */
  cLossTCO2e: number;
  /** Persistence fraction (%) - Equation 6.4 */
  persistenceFractionPercent: number;
  /** Project emissions (tCO2e) - Equation 7.1 */
  eProjectTCO2e: number;
  /** Leakage emissions (tCO2e) - Equation 8.1 */
  eLeakageTCO2e: number;

  // Result
  /** Net CORCs (tCO2e) - Equation 5.1 */
  netCORCsTCO2e: number;

  // Metadata
  /** Permanence claim type */
  permanenceType: PermanenceType;
  /** Calculation version identifier */
  calculationVersion: string;

  // Detailed breakdown
  breakdown: {
    biomassEmissionsTCO2e: number;
    productionEmissionsTCO2e: number;
    embodiedEmissionsTCO2e: number;
    endUseEmissionsTCO2e: number;
    ecologicalLeakageTCO2e: number;
    marketLeakageTCO2e: number;
  };
}

/**
 * Quality validation result
 */
export interface QualityValidationResult {
  /** H/C_org molar ratio */
  hCorgRatio: number;
  /** Whether it passes the threshold */
  isValid: boolean;
  /** Threshold value */
  threshold: number;
  /** Message */
  message: string;
}

/**
 * iLUC calculation input
 */
export interface ILUCInput {
  /** Quantity of feedstock (dry tonnes) */
  quantityDryTonnes: number;
  /** Lower heating value (GJ per dry tonne) */
  lowerHeatingValueGJ: number;
  /** iLUC factor (kg CO2e per MJ) */
  ilucFactorKgCO2ePerMJ: number;
  /** Attribution factor (0-1, default 1.0) */
  attributionFactor?: number;
}

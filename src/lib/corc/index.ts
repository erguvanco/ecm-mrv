/**
 * Puro.earth Biochar Methodology CORC Calculation Engine
 * Edition 2025 V1
 *
 * Main quantification formula (Equation 5.1):
 * CORCs = C_stored − C_baseline − C_loss − E_project − E_leakage
 *
 * This module provides all calculations required for CORC issuance
 * according to the Puro Standard for biochar carbon removal.
 */

// Main calculator
export {
  calculateCORCs,
  getCORCCalculationBreakdown,
  estimateCORCs,
  validateCORCInput,
  calculateEfficiencyMetrics,
} from './calculator';

// Carbon stored calculation (Equation 6.1)
export {
  calculateCStored,
  calculateCarbonMass,
  calculateDryMass,
  getCStoredBreakdown,
} from './c-stored';

// Persistence and carbon loss (Equations 6.3, 6.4)
export {
  calculatePersistenceFraction,
  calculateCLoss,
  calculatePermanentCarbon,
  getPersistenceParams,
  getPersistenceBreakdown,
  estimatePersistenceRange,
} from './c-loss';

// Biochar quality (Equation 6.5)
export {
  calculateHCorgRatio,
  validateBiocharQuality,
  validateQuality,
  calculateOrganicCarbon,
  getQualityClassification,
} from './quality';

// Project emissions (Equations 7.1, 7.2)
export {
  calculateBiomassEmissions,
  calculateProductionEmissions,
  calculateEmbodiedEmissions,
  calculateEndUseEmissions,
  calculateEProject,
  getEProjectBreakdown,
  createDefaultEProjectInput,
  calculateCoProductAllocationFactor,
} from './e-project';

// Leakage emissions (Equation 8.1)
export {
  calculateEcologicalLeakage,
  calculateMarketActivityLeakage,
  calculateELeakage,
  calculateILUC,
  getELeakageBreakdown,
  createDefaultLeakageInput,
  requiresILUCAssessment,
  assessLeakageRisk,
} from './e-leakage';

// Constants
export {
  // Persistence model parameters (Table 6.1)
  PERSISTENCE_PARAMS,
  // Global Warming Potentials (AR5)
  GWP_VALUES,
  // Quality threshold
  H_C_ORG_THRESHOLD,
  // Conversion factor
  CO2_TO_C_RATIO,
  // iLUC emission factors
  ILUC_FACTORS,
  // Puro biomass categories (A-O)
  PURO_BIOMASS_CATEGORIES,
  // End-use categories
  END_USE_CATEGORIES,
  // Baseline types
  BASELINE_TYPES,
  // Calculation version
  CALCULATION_VERSION,
} from './constants';

// Types
export type {
  // Quality inputs
  HCorgInput,
  QualityValidationResult,
  // Carbon stored input
  CStoredInput,
  // Persistence input
  PersistenceInput,
  // Emissions inputs
  BiomassEmissions,
  ProductionEmissions,
  EmbodiedEmissions,
  EndUseEmissions,
  EProjectInput,
  // Leakage inputs
  EcologicalLeakage,
  MarketActivityLeakage,
  LeakageInput,
  ILUCInput,
  // Main calculation types
  BaselineType,
  PermanenceType,
  CORCCalculationInput,
  CORCCalculationResult,
} from './types';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const PLANT = {
  name: 'Sakarya Biochar Facility',
  address: 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya, Türkiye',
  lat: 40.892533,
  lng: 30.516827,
  country: 'TR',
};

const FEEDSTOCK_SOURCES = [
  {
    name: 'Geyve Fındık Kooperatifi',
    address: 'Geyve Fındık Kooperatifi, Sakarya, Türkiye',
    lat: 40.5075,
    lng: 30.2927,
    feedstockType: 'hazelnut_shells',
    puroCategory: 'A',
    puroCategoryName: 'Forestry residues',
    sourceClassification: 'RESIDUE',
    ilucRiskLevel: 'LOW',
    sustainabilityCert: 'FSC',
    distanceKm: 38,
    weight: 25, // Selection weight for distribution
  },
  {
    name: 'Karasu Fındık Deposu',
    address: 'Karasu Fındık Deposu, Sakarya, Türkiye',
    lat: 41.0719,
    lng: 30.785,
    feedstockType: 'hazelnut_shells',
    puroCategory: 'A',
    puroCategoryName: 'Forestry residues',
    sourceClassification: 'RESIDUE',
    ilucRiskLevel: 'LOW',
    sustainabilityCert: 'FSC',
    distanceKm: 44,
    weight: 25,
  },
  {
    name: 'Akyazı Orman İşletmesi',
    address: 'Akyazı Orman İşletmesi, Sakarya, Türkiye',
    lat: 40.6857,
    lng: 30.6225,
    feedstockType: 'wood_chips',
    puroCategory: 'B',
    puroCategoryName: 'Forest thinnings',
    sourceClassification: 'RESIDUE',
    ilucRiskLevel: 'LOW',
    sustainabilityCert: 'PEFC',
    distanceKm: 62,
    weight: 15,
  },
  {
    name: 'Sapanca Orman Deposu',
    address: 'Sapanca Orman Deposu, Sakarya, Türkiye',
    lat: 40.6917,
    lng: 30.2686,
    feedstockType: 'logging_residues',
    puroCategory: 'A',
    puroCategoryName: 'Forestry residues',
    sourceClassification: 'RESIDUE',
    ilucRiskLevel: 'LOW',
    sustainabilityCert: 'FSC',
    distanceKm: 70,
    weight: 15,
  },
  {
    name: 'Pamukova Mısır Kooperatifi',
    address: 'Pamukova Mısır Kooperatifi, Sakarya, Türkiye',
    lat: 40.5108,
    lng: 30.1736,
    feedstockType: 'corn_stover',
    puroCategory: 'G',
    puroCategoryName: 'Agricultural residues',
    sourceClassification: 'RESIDUE',
    ilucRiskLevel: 'LOW',
    sustainabilityCert: null,
    distanceKm: 48,
    weight: 20,
  },
];

const SEQUESTRATION_DESTINATIONS = [
  {
    quarter: 1,
    name: 'Adapazarı Tarım Kooperatifi',
    address: 'Adapazarı Tarım Kooperatifi, Sakarya, Türkiye',
    lat: 40.7891,
    lng: 30.4025,
    postcode: '54100',
    type: 'soil',
    endUseCategory: 'SOIL_AGRICULTURE',
    storage: true,
    storageConditions: 'covered_outdoor',
    incorporationMethod: 'TILLAGE',
    incorporationDepthCm: 20,
    distanceKm: 25,
  },
  {
    quarter: 2,
    name: 'Kocaeli Beton Santrali',
    address: 'Kocaeli Beton Santrali, Kocaeli, Türkiye',
    lat: 40.7656,
    lng: 29.9167,
    postcode: '41400',
    type: 'construction',
    endUseCategory: 'CONSTRUCTION_CONCRETE',
    storage: false,
    storageConditions: null,
    incorporationMethod: null,
    incorporationDepthCm: null,
    distanceKm: 85,
  },
  {
    quarter: 3,
    name: 'Bursa Organik Gübre Tesisi',
    address: 'Bursa Organik Gübre Tesisi, Bursa, Türkiye',
    lat: 40.1833,
    lng: 29.0667,
    postcode: '16200',
    type: 'compost',
    endUseCategory: 'COMPOST_COMMERCIAL',
    storage: true,
    storageConditions: 'indoor',
    incorporationMethod: 'MIXING',
    incorporationDepthCm: null,
    distanceKm: 140,
  },
  {
    quarter: 4,
    name: 'Bilecik Tarım İşletmesi',
    address: 'Bilecik Tarım İşletmesi, Bilecik, Türkiye',
    lat: 40.0567,
    lng: 30.0189,
    postcode: '11000',
    type: 'soil',
    endUseCategory: 'SOIL_AGRICULTURE',
    storage: true,
    storageConditions: 'covered_outdoor',
    incorporationMethod: 'TILLAGE',
    incorporationDepthCm: 25,
    distanceKm: 95,
  },
];

// Turkish holidays 2025
const HOLIDAYS_2025 = [
  new Date('2025-01-01'), // New Year
  new Date('2025-03-30'), // Ramadan Bayramı
  new Date('2025-03-31'),
  new Date('2025-04-01'),
  new Date('2025-04-02'),
  new Date('2025-04-23'), // National Sovereignty
  new Date('2025-05-01'), // Labor Day
  new Date('2025-05-19'), // Youth Day
  new Date('2025-06-06'), // Kurban Bayramı
  new Date('2025-06-07'),
  new Date('2025-06-08'),
  new Date('2025-06-09'),
  new Date('2025-08-30'), // Victory Day
  new Date('2025-10-29'), // Republic Day
];

// Summer maintenance: Aug 15-25
const MAINTENANCE_START = new Date('2025-08-15');
const MAINTENANCE_END = new Date('2025-08-25');

// End date: Dec 13, 2025
const SEED_END_DATE = new Date('2025-12-13');

// ============================================
// HELPER FUNCTIONS
// ============================================

function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().slice(0, 10);
  return HOLIDAYS_2025.some(h => h.toISOString().slice(0, 10) === dateStr);
}

function isMaintenanceDay(date: Date): boolean {
  return date >= MAINTENANCE_START && date <= MAINTENANCE_END;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isOperatingDay(date: Date): boolean {
  if (date > SEED_END_DATE) return false;
  if (isHoliday(date)) return false;
  if (isMaintenanceDay(date)) return false;
  if (isWeekend(date)) return false;
  return true;
}

// Deterministic pseudo-random number generator
function seededRandom(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

// Weighted random source selection
const totalWeight = FEEDSTOCK_SOURCES.reduce((sum, s) => sum + s.weight, 0);
function getRandomSource(seed: number) {
  let random = seededRandom(seed) * totalWeight;
  let cumulative = 0;
  for (const source of FEEDSTOCK_SOURCES) {
    cumulative += source.weight;
    if (random < cumulative) return source;
  }
  return FEEDSTOCK_SOURCES[0];
}

// Get quarter from month (0-indexed)
function getQuarter(month: number): number {
  return Math.floor(month / 3) + 1;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Seeding database for 2025 Sakarya operations (2x SCALE)...\n');

  // ============================================
  // PHASE 1: CLEAR ALL EXISTING DATA
  // ============================================
  console.log('Phase 1: Clearing existing data...');

  await prisma.qRScanLog.deleteMany();
  await prisma.evidenceFile.deleteMany();
  await prisma.cORCProductionBatch.deleteMany();
  await prisma.cORCSequestrationEvent.deleteMany();
  await prisma.cORCIssuance.deleteMany();
  await prisma.bCUProductionBatch.deleteMany();
  await prisma.bCUSequestrationEvent.deleteMany();
  await prisma.bCU.deleteMany();
  await prisma.leakageAssessment.deleteMany();
  await prisma.monitoringPeriod.deleteMany();
  await prisma.biocharLabTest.deleteMany();
  await prisma.sequestrationBatch.deleteMany();
  await prisma.sequestrationEvent.deleteMany();
  await prisma.transportEvent.deleteMany();
  await prisma.energyUsage.deleteMany();
  await prisma.productionFeedstock.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.feedstockDelivery.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.geocodeCache.deleteMany();
  await prisma.routeCache.deleteMany();

  console.log('  ✓ All existing data cleared\n');

  // ============================================
  // PHASE 2: CREATE FOUNDATION DATA
  // ============================================
  console.log('Phase 2: Creating foundation data...');

  // Plant Settings
  await prisma.plantSettings.upsert({
    where: { id: 'singleton' },
    update: {
      plantName: PLANT.name,
      address: PLANT.address,
      lat: PLANT.lat,
      lng: PLANT.lng,
    },
    create: {
      id: 'singleton',
      plantName: PLANT.name,
      address: PLANT.address,
      lat: PLANT.lat,
      lng: PLANT.lng,
    },
  });
  console.log('  ✓ Plant settings configured');

  // Facility (for PURO methodology)
  const facility = await prisma.facility.create({
    data: {
      name: PLANT.name,
      registrationNumber: 'PURO-TR-SAK-2025-001',
      baselineType: 'NEW_BUILT',
      address: PLANT.address,
      lat: PLANT.lat,
      lng: PLANT.lng,
      country: PLANT.country,
      creditingPeriodStart: new Date('2025-01-01'),
      creditingPeriodEnd: new Date('2034-12-31'),
      infrastructureLifetimeYears: 20,
      totalInfrastructureEmissionsTCO2e: 450, // Facility construction emissions
    },
  });
  console.log('  ✓ Facility registered with 10-year crediting period\n');

  // ============================================
  // PHASE 3: GENERATE FEEDSTOCK DELIVERIES
  // ============================================
  console.log('Phase 3: Generating feedstock deliveries (2x scale)...');

  const start = new Date('2025-01-01');
  const feedstocks: Awaited<ReturnType<typeof prisma.feedstockDelivery.create>>[] = [];
  let truckCounter = 1000;

  for (let d = 0; d < 365; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);

    if (!isOperatingDay(date)) continue;

    // 2x SCALE: 4-8 trucks per day (average 6)
    const baseTrucks = 5 + (d % 4); // 5-8 trucks
    const trucksToday = Math.max(4, baseTrucks);

    // Target: 80-120 tonnes per day (2x scale)
    const targetDailyTonnes = 90 + seededRandom(d) * 30;

    for (let t = 0; t < trucksToday; t++) {
      const src = getRandomSource(d * 100 + t);

      // Trucks carry 14-22 tonnes
      const baseWeight = targetDailyTonnes / trucksToday;
      const variance = (seededRandom(d * 1000 + t) - 0.5) * 6;
      const weight = Math.max(14, Math.min(22, baseWeight + variance));

      truckCounter++;
      const certExpiry = new Date('2026-12-31');

      const delivery = await prisma.feedstockDelivery.create({
        data: {
          date,
          vehicleId: `34 SAK ${String(truckCounter).padStart(4, '0')}`,
          vehicleDescription: weight > 18 ? 'Articulated Truck (>33t)' : 'Rigid Truck (>17t)',
          deliveryDistanceKm: src.distanceKm,
          weightTonnes: Number(weight.toFixed(1)),
          volumeM3: Number((weight * 2.2).toFixed(1)),
          feedstockType: src.feedstockType,
          fuelType: 'diesel',
          fuelAmount: Number((src.distanceKm * 0.35 + weight * 0.8).toFixed(1)),
          sourceAddress: src.address,
          sourceLat: src.lat,
          sourceLng: src.lng,
          geocodeStatus: 'success',
          routeStatus: 'pending', // Will be calculated
          routeDistanceKm: src.distanceKm * 1.15, // Approximate road distance
          notes: `${src.name} - ${src.puroCategoryName}`,
          // PURO methodology fields
          puroCategory: src.puroCategory,
          puroCategoryName: src.puroCategoryName,
          sourceClassification: src.sourceClassification,
          ilucRiskLevel: src.ilucRiskLevel,
          sustainabilityCertification: src.sustainabilityCert,
          certificationNumber: src.sustainabilityCert ? `${src.sustainabilityCert}-TR-${2025}-${String(truckCounter).slice(-4)}` : null,
          certificationExpiry: src.sustainabilityCert ? certExpiry : null,
          isDedicatedCrop: false,
          isPrimaryLandDriver: false,
          carbonContentPercent: src.feedstockType === 'hazelnut_shells' ? 48 : src.feedstockType === 'corn_stover' ? 42 : 46,
        },
      });
      feedstocks.push(delivery);
    }
  }

  const totalFeedstockTonnes = feedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);
  console.log(`  ✓ Created ${feedstocks.length} feedstock deliveries (${totalFeedstockTonnes.toFixed(0)} tonnes)\n`);

  // ============================================
  // PHASE 4: GENERATE PRODUCTION BATCHES WITH LAB TESTS
  // ============================================
  console.log('Phase 4: Generating production batches with lab tests...');

  // Group feedstocks by date
  const feedstocksByDate = new Map<string, typeof feedstocks>();
  for (const f of feedstocks) {
    const dateKey = f.date.toISOString().slice(0, 10);
    if (!feedstocksByDate.has(dateKey)) {
      feedstocksByDate.set(dateKey, []);
    }
    feedstocksByDate.get(dateKey)!.push(f);
  }

  const productionBatches: Awaited<ReturnType<typeof prisma.productionBatch.create>>[] = [];
  let batchCounter = 1;

  for (const [dateKey, dayFeedstocks] of feedstocksByDate) {
    if (dayFeedstocks.length === 0) continue;

    const inputWeight = dayFeedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);

    // Calculate yield by feedstock type
    let totalYieldWeight = 0;
    for (const f of dayFeedstocks) {
      const yieldRate = f.feedstockType === 'hazelnut_shells' ? 0.30 :
                        f.feedstockType === 'corn_stover' ? 0.26 : 0.28;
      totalYieldWeight += (f.weightTonnes || 0) * yieldRate;
    }
    const output = Number(totalYieldWeight.toFixed(1));

    // Temperature profile
    const hasHazelnut = dayFeedstocks.some(f => f.feedstockType === 'hazelnut_shells');
    const hasWood = dayFeedstocks.some(f => f.feedstockType?.includes('wood') || f.feedstockType?.includes('logging'));
    const tempMin = hasWood ? 540 : 520;
    const tempMax = hasHazelnut ? 660 : 640;
    const tempAvg = Math.round((tempMin + tempMax) / 2 + (seededRandom(batchCounter) - 0.5) * 30);

    // Quality parameters (PURO methodology)
    const organicCarbonPercent = 78 + seededRandom(batchCounter * 7) * 4; // 78-82%
    const hydrogenPercent = 1.8 + seededRandom(batchCounter * 13) * 0.4; // 1.8-2.2%
    const hCorgRatio = hydrogenPercent / organicCarbonPercent; // ~0.023-0.028

    const batch = await prisma.productionBatch.create({
      data: {
        productionDate: new Date(dateKey),
        inputFeedstockWeightTonnes: Number(inputWeight.toFixed(1)),
        outputBiocharWeightTonnes: output,
        temperatureMin: tempMin,
        temperatureMax: tempMax,
        temperatureAvg: tempAvg,
        status: 'complete',
        wizardStep: 5,
        notes: `Batch #${batchCounter} - ${dayFeedstocks.length} deliveries (${dayFeedstocks.map(f => f.feedstockType).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`,
        facilityId: facility.id,
        // PURO quality fields
        organicCarbonPercent: Number(organicCarbonPercent.toFixed(2)),
        totalCarbonPercent: Number((organicCarbonPercent + 2).toFixed(2)), // C_org + C_inorg
        inorganicCarbonPercent: 2.0,
        hydrogenPercent: Number(hydrogenPercent.toFixed(2)),
        hCorgRatio: Number(hCorgRatio.toFixed(4)),
        qualityValidationStatus: 'passed', // All pass threshold
        dryMassTonnes: Number((output * 0.92).toFixed(1)), // 8% moisture
        moisturePercent: 8,
        // Direct stack emissions
        ch4EmissionsKg: Number((output * 0.15).toFixed(1)),
        n2oEmissionsKg: Number((output * 0.008).toFixed(3)),
        fossilCO2EmissionsKg: Number((output * 0.5).toFixed(1)),
        // Allocation (100% to biochar, no co-products)
        allocationFactorBiochar: 1.0,
        // Link feedstock allocations
        feedstockDeliveryId: dayFeedstocks[0].id,
        feedstockAllocations: {
          createMany: {
            data: dayFeedstocks.map((f) => ({
              feedstockDeliveryId: f.id,
              percentageUsed: Number(((f.weightTonnes || 0) / inputWeight * 100).toFixed(2)),
              weightUsedTonnes: f.weightTonnes || 0,
            })),
          },
        },
      },
    });

    // Create lab test for each batch
    await prisma.biocharLabTest.create({
      data: {
        productionBatchId: batch.id,
        testDate: new Date(dateKey),
        labName: 'Sakarya Üniversitesi Analitik Kimya Laboratuvarı',
        labAccreditation: 'ISO/IEC 17025:2017',
        totalCarbonPercent: Number((organicCarbonPercent + 2).toFixed(2)),
        inorganicCarbonPercent: 2.0,
        organicCarbonPercent: Number(organicCarbonPercent.toFixed(2)),
        hydrogenPercent: Number(hydrogenPercent.toFixed(2)),
        hCorgRatio: Number(hCorgRatio.toFixed(4)),
        passesQualityThreshold: true, // H/C_org < 0.7
        carbonMethod: 'ISO_16948',
        inorganicCarbonMethod: 'DIN_51726',
        moistureMethod: 'ISO_589',
        moisturePercent: 8,
        nitrogenPercent: 0.8,
      },
    });

    productionBatches.push(batch);
    batchCounter++;
  }

  const totalBiocharTonnes = productionBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);
  console.log(`  ✓ Created ${productionBatches.length} production batches (${totalBiocharTonnes.toFixed(0)} tonnes biochar)`);
  console.log(`  ✓ Created ${productionBatches.length} lab tests\n`);

  // ============================================
  // PHASE 5: GENERATE ENERGY USAGE
  // ============================================
  console.log('Phase 5: Generating energy usage records...');

  const energyRecords = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(2025, m, 1);
    const monthEnd = new Date(2025, m + 1, 0);

    // Check if month is before seed end date
    if (monthStart > SEED_END_DATE) break;

    const monthBatches = productionBatches.filter(b => b.productionDate.getMonth() === m);
    if (monthBatches.length === 0) continue;

    const monthOutput = monthBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);

    // Electricity (2x scale)
    energyRecords.push({
      scope: 'production',
      energyType: 'electricity',
      quantity: Math.round(monthOutput * 45 + 1600), // ~45 kWh/t + 1600 base (2x)
      unit: 'kWh',
      periodStart: monthStart,
      periodEnd: monthEnd,
      productionBatchId: monthBatches[Math.floor(monthBatches.length / 2)].id,
      notes: `Monthly electricity - pyrolysis, conveyors, exhaust`,
    });

    // Diesel (2x scale)
    energyRecords.push({
      scope: 'production',
      energyType: 'diesel',
      quantity: Math.round(monthOutput * 2.5 + 100), // ~2.5L/t + 100L base (2x)
      unit: 'litres',
      periodStart: monthStart,
      periodEnd: monthEnd,
      productionBatchId: monthBatches[0].id,
      notes: `Monthly diesel - loader, forklift, generators`,
    });
  }

  await prisma.energyUsage.createMany({ data: energyRecords });
  console.log(`  ✓ Created ${energyRecords.length} energy usage records\n`);

  // ============================================
  // PHASE 6: GENERATE SEQUESTRATION EVENTS
  // ============================================
  console.log('Phase 6: Generating sequestration events...');

  const sequestrationEvents: Awaited<ReturnType<typeof prisma.sequestrationEvent.create>>[] = [];

  for (const dest of SEQUESTRATION_DESTINATIONS) {
    const quarterStart = (dest.quarter - 1) * 3;
    const quarterEnd = dest.quarter * 3;

    const quarterBatches = productionBatches.filter(b => {
      const month = b.productionDate.getMonth();
      return month >= quarterStart && month < quarterEnd;
    });

    if (quarterBatches.length === 0) continue;

    const quarterOutput = quarterBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);

    // Q4 delivery date is Dec 13 (seed end date)
    const deliveryMonth = dest.quarter === 4 ? 11 : dest.quarter * 3 - 1;
    const deliveryDay = dest.quarter === 4 ? 13 : 25;
    const deliveryDate = new Date(2025, deliveryMonth, deliveryDay);

    const storageStart = new Date(2025, deliveryMonth, 1);
    const storageEnd = new Date(2025, deliveryMonth, 20);

    // Mean annual soil temp for Turkey (Marmara region)
    const meanSoilTempC = 14;

    // Calculate persistence using BC+200 model
    // PF = exp(-3.89 × H/C_org) × exp(-0.037 × T_soil)
    const avgHCorg = quarterBatches.reduce((sum, b) => sum + (b.hCorgRatio || 0), 0) / quarterBatches.length;
    const persistenceFraction = Math.exp(-3.89 * avgHCorg) * Math.exp(-0.037 * meanSoilTempC);
    const persistencePercent = persistenceFraction * 100;

    const seq = await prisma.sequestrationEvent.create({
      data: {
        storageBeforeDelivery: dest.storage,
        storageLocation: dest.storage ? `Sakarya Biochar Depo ${String.fromCharCode(64 + dest.quarter)}` : null,
        storageStartDate: dest.storage ? storageStart : null,
        storageEndDate: dest.storage ? storageEnd : null,
        storageContainerIds: dest.storage ? `CONT-2025-Q${dest.quarter}-001,CONT-2025-Q${dest.quarter}-002,CONT-2025-Q${dest.quarter}-003` : null,
        storageConditions: dest.storageConditions,
        finalDeliveryDate: deliveryDate,
        deliveryVehicleDescription: '30t Walking Floor Trailer',
        deliveryPostcode: dest.postcode,
        destinationLat: dest.lat,
        destinationLng: dest.lng,
        geocodeStatus: 'success',
        routeStatus: 'pending',
        routeDistanceKm: dest.distanceKm * 1.15,
        sequestrationType: dest.type,
        status: dest.quarter === 4 ? 'draft' : 'complete',
        wizardStep: dest.quarter === 4 ? 4 : 6,
        notes: `Q${dest.quarter} 2025 - ${dest.name} (${quarterOutput.toFixed(0)}t biochar)`,
        // PURO methodology fields
        endUseCategory: dest.endUseCategory,
        meanAnnualSoilTempC: dest.type === 'soil' || dest.type === 'compost' ? meanSoilTempC : null,
        soilTempRegion: 'Marmara Region, Turkey',
        soilTempDataSource: 'Turkish State Meteorological Service (MGM)',
        persistenceFractionPercent: Number(persistencePercent.toFixed(2)),
        incorporationMethod: dest.incorporationMethod,
        incorporationDepthCm: dest.incorporationDepthCm,
        expectedProductLifetimeYears: dest.type === 'construction' ? 100 : null,
        endOfLifeFate: dest.type === 'construction' ? 'LANDFILL' : null,
        permanenceVerificationMethod: 'DOCUMENTATION',
        batches: {
          create: quarterBatches.map((b) => ({
            productionBatchId: b.id,
            quantityTonnes: b.outputBiocharWeightTonnes || 0,
          })),
        },
      },
    });
    sequestrationEvents.push(seq);
  }

  console.log(`  ✓ Created ${sequestrationEvents.length} sequestration events\n`);

  // ============================================
  // PHASE 7: GENERATE MONITORING PERIODS
  // ============================================
  console.log('Phase 7: Generating monitoring periods...');

  const monitoringPeriods: Awaited<ReturnType<typeof prisma.monitoringPeriod.create>>[] = [];

  for (let q = 1; q <= 4; q++) {
    const periodStart = new Date(2025, (q - 1) * 3, 1);
    const periodEnd = q === 4 ? SEED_END_DATE : new Date(2025, q * 3, 0);

    const quarterBatches = productionBatches.filter(b => {
      const month = b.productionDate.getMonth();
      return month >= (q - 1) * 3 && month < q * 3;
    });

    if (quarterBatches.length === 0) continue;

    const quarterOutput = quarterBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);
    const avgCorg = quarterBatches.reduce((sum, b) => sum + (b.organicCarbonPercent || 80), 0) / quarterBatches.length;

    // CORC calculation (per PURO methodology)
    // C_stored = biochar_tonnes × C_org% × 3.67 (CO2/C ratio)
    const cStored = quarterOutput * (avgCorg / 100) * 3.67;

    // Persistence loss (average ~12% based on BC+200)
    const persistencePercent = 88;
    const cLoss = cStored * (1 - persistencePercent / 100);

    // C_baseline = 0 for NEW_BUILT facility
    const cBaseline = 0;

    // E_project (simplified: electricity + diesel + transport)
    const monthlyEnergy = energyRecords.filter(e => {
      const month = e.periodStart.getMonth();
      return month >= (q - 1) * 3 && month < q * 3;
    });
    const electricityKWh = monthlyEnergy.filter(e => e.energyType === 'electricity').reduce((sum, e) => sum + e.quantity, 0);
    const dieselL = monthlyEnergy.filter(e => e.energyType === 'diesel').reduce((sum, e) => sum + e.quantity, 0);

    // Turkey grid: 0.45 kgCO2e/kWh, Diesel: 2.68 kgCO2e/L
    const eProject = (electricityKWh * 0.45 + dieselL * 2.68) / 1000; // Convert to tCO2e

    // E_leakage (minimal for residue feedstocks)
    const eLeakage = quarterOutput * 0.02; // ~0.02 tCO2e/t leakage

    // Net CORCs
    const netCORCs = cStored - cBaseline - cLoss - eProject - eLeakage;

    const period = await prisma.monitoringPeriod.create({
      data: {
        facilityId: facility.id,
        periodStart,
        periodEnd,
        status: q === 4 ? 'active' : 'verified',
        cStoredTCO2e: Number(cStored.toFixed(2)),
        cBaselineTCO2e: cBaseline,
        cLossTCO2e: Number(cLoss.toFixed(2)),
        persistenceFractionPercent: persistencePercent,
        eProjectTCO2e: Number(eProject.toFixed(2)),
        eLeakageTCO2e: Number(eLeakage.toFixed(2)),
        netCORCsTCO2e: Number(netCORCs.toFixed(2)),
        calculatedAt: q === 4 ? null : new Date(2025, q * 3, 10),
      },
    });
    monitoringPeriods.push(period);
  }

  console.log(`  ✓ Created ${monitoringPeriods.length} monitoring periods\n`);

  // ============================================
  // PHASE 8: GENERATE CORC ISSUANCES
  // ============================================
  console.log('Phase 8: Generating CORC issuances...');

  const corcIssuances: Awaited<ReturnType<typeof prisma.cORCIssuance.create>>[] = [];

  // Only Q1-Q3 have issued CORCs (Q4 still in progress)
  for (let q = 1; q <= 3; q++) {
    const period = monitoringPeriods[q - 1];
    const seqEvent = sequestrationEvents[q - 1];

    const quarterBatches = productionBatches.filter(b => {
      const month = b.productionDate.getMonth();
      return month >= (q - 1) * 3 && month < q * 3;
    });

    const issuanceDate = new Date(2025, q * 3, 15); // Mid-month after quarter end

    // Q1 is retired to Microsoft Turkey
    const isRetired = q === 1;

    const corc = await prisma.cORCIssuance.create({
      data: {
        monitoringPeriodId: period.id,
        serialNumber: `CORC-SAK-2025-Q${q}-001`,
        permanenceType: 'BC200+',
        // Full calculation breakdown
        cStoredTCO2e: period.cStoredTCO2e,
        cBaselineTCO2e: period.cBaselineTCO2e,
        cLossTCO2e: period.cLossTCO2e,
        persistenceFractionPercent: period.persistenceFractionPercent,
        eProjectTCO2e: period.eProjectTCO2e,
        eLeakageTCO2e: period.eLeakageTCO2e,
        netCORCsTCO2e: period.netCORCsTCO2e,
        status: isRetired ? 'retired' : 'issued',
        issuanceDate,
        ownerName: isRetired ? 'Microsoft Turkey' : 'Sakarya Biochar Facility',
        ownerAccountId: isRetired ? 'MSFT-TR-2025' : 'SAK-BIO-2025',
        retirementDate: isRetired ? new Date(2025, 4, 25) : null,
        retirementBeneficiary: isRetired ? 'Microsoft Turkey Climate Commitment' : null,
        retirementPurpose: isRetired ? 'Corporate carbon neutrality goal 2030' : null,
        notes: `Q${q} 2025 - ${quarterBatches.length} batches, ${sequestrationEvents[q-1]?.sequestrationType} application`,
        // Link to production batches
        productionBatches: {
          create: quarterBatches.map(b => ({ productionBatchId: b.id })),
        },
        // Link to sequestration event
        sequestrationEvents: {
          create: seqEvent ? [{ sequestrationId: seqEvent.id }] : [],
        },
      },
    });
    corcIssuances.push(corc);
  }

  const totalCORCs = corcIssuances.reduce((sum, c) => sum + (c.netCORCsTCO2e || 0), 0);
  console.log(`  ✓ Created ${corcIssuances.length} CORC issuances (${totalCORCs.toFixed(0)} tCO2e total)`);
  console.log(`    - Q1: RETIRED to Microsoft Turkey`);
  console.log(`    - Q2-Q3: ISSUED (available)\n`);

  // ============================================
  // PHASE 9: GENERATE LEAKAGE ASSESSMENTS
  // ============================================
  console.log('Phase 9: Generating leakage assessments...');

  for (let q = 1; q <= 4; q++) {
    const assessmentDate = new Date(2025, q * 3 - 1, 20); // Late in quarter
    if (assessmentDate > SEED_END_DATE) break;

    const quarterBatches = productionBatches.filter(b => {
      const month = b.productionDate.getMonth();
      return month >= (q - 1) * 3 && month < q * 3;
    });
    const quarterOutput = quarterBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);

    await prisma.leakageAssessment.create({
      data: {
        facilityId: facility.id,
        monitoringPeriodId: monitoringPeriods[q - 1]?.id,
        assessmentDate,
        assessorName: 'Dr. Mehmet Yılmaz',
        // Ecological leakage - Facility (Section 8.2.1)
        facilityEcologicalStatus: 'NOT_APPLICABLE',
        facilityEcologicalKgCO2e: 0,
        facilityEcologicalNotes: 'Facility located in existing industrial zone (OSB), no ecological displacement',
        // Ecological leakage - Biomass (Section 8.2.2)
        biomassEcologicalStatus: 'MITIGATED',
        biomassEcologicalKgCO2e: 0,
        biomassEcologicalNotes: 'All feedstocks are residues/wastes with FSC/PEFC certification',
        // Market leakage - AFOLU (Section 8.2.3)
        afoluLeakageStatus: 'NOT_APPLICABLE',
        afoluLeakageKgCO2e: 0,
        afoluNotes: 'No dedicated crops, all agricultural/forestry residues',
        // Market leakage - Energy/Materials (Section 8.2.4-6)
        energyMaterialLeakageStatus: 'QUANTIFIED',
        energyMaterialLeakageKgCO2e: Math.round(quarterOutput * 15), // ~15 kgCO2e/t
        energyMaterialNotes: 'Minor displacement of alternative biomass uses (mulching)',
        // iLUC contribution (Section 8.3.4)
        ilucContributionKgCO2e: 0, // Low risk feedstocks
        // Total
        totalLeakageKgCO2e: Math.round(quarterOutput * 15),
        notes: `Q${q} 2025 leakage assessment - all feedstocks LOW iLUC risk`,
      },
    });
  }

  console.log(`  ✓ Created 4 leakage assessments\n`);

  // ============================================
  // PHASE 10: GENERATE TRANSPORT EVENTS
  // ============================================
  console.log('Phase 10: Generating transport events...');

  const transportEvents = sequestrationEvents.map((seq, i) => ({
    date: seq.finalDeliveryDate!,
    vehicleId: `34 SAK ${8000 + i}`,
    vehicleDescription: '30t Walking Floor Trailer',
    originAddress: PLANT.address,
    originLat: PLANT.lat,
    originLng: PLANT.lng,
    destinationAddress: SEQUESTRATION_DESTINATIONS[i].address,
    destinationLat: seq.destinationLat!,
    destinationLng: seq.destinationLng!,
    distanceKm: SEQUESTRATION_DESTINATIONS[i].distanceKm,
    fuelType: 'diesel',
    fuelUnit: 'liters',
    fuelAmount: Math.round(SEQUESTRATION_DESTINATIONS[i].distanceKm * 0.4 + 20),
    cargoDescription: `Q${i + 1} 2025 biochar delivery - ${seq.sequestrationType} application`,
    sequestrationEventId: seq.id,
  }));

  await prisma.transportEvent.createMany({ data: transportEvents });
  console.log(`  ✓ Created ${transportEvents.length} transport events\n`);

  // ============================================
  // PHASE 11: GENERATE EVIDENCE FILES
  // ============================================
  console.log('Phase 11: Generating evidence files...');

  const evidenceFiles = [];

  // Sustainability certificates for each source type
  for (const src of FEEDSTOCK_SOURCES) {
    if (src.sustainabilityCert) {
      const feedstock = feedstocks.find(f => f.feedstockType === src.feedstockType);
      if (feedstock) {
        evidenceFiles.push({
          fileName: `${src.sustainabilityCert}_certificate_${src.name.replace(/\s+/g, '_')}.pdf`,
          fileType: 'pdf',
          fileSize: 245000,
          mimeType: 'application/pdf',
          storagePath: `/evidence/feedstock/${src.sustainabilityCert.toLowerCase()}_${src.feedstockType}.pdf`,
          category: 'sustainability',
          feedstockDeliveryId: feedstock.id,
        });
      }
    }
  }

  // Monthly lab reports
  for (let m = 0; m < 12; m++) {
    if (new Date(2025, m, 1) > SEED_END_DATE) break;
    const monthBatches = productionBatches.filter(b => b.productionDate.getMonth() === m);
    if (monthBatches.length > 0) {
      evidenceFiles.push({
        fileName: `lab_report_${2025}_${String(m + 1).padStart(2, '0')}.pdf`,
        fileType: 'pdf',
        fileSize: 520000,
        mimeType: 'application/pdf',
        storagePath: `/evidence/lab/${2025}_${String(m + 1).padStart(2, '0')}_lab_report.pdf`,
        category: 'lab_report',
        productionBatchId: monthBatches[Math.floor(monthBatches.length / 2)].id,
      });
    }
  }

  // Quarterly sequestration delivery notes
  for (let q = 0; q < sequestrationEvents.length; q++) {
    evidenceFiles.push({
      fileName: `delivery_note_Q${q + 1}_2025.pdf`,
      fileType: 'pdf',
      fileSize: 180000,
      mimeType: 'application/pdf',
      storagePath: `/evidence/sequestration/Q${q + 1}_2025_delivery.pdf`,
      category: 'delivery',
      sequestrationEventId: sequestrationEvents[q].id,
    });
  }

  // CORC issuance certificates
  for (let q = 0; q < corcIssuances.length; q++) {
    evidenceFiles.push({
      fileName: `CORC_certificate_Q${q + 1}_2025.pdf`,
      fileType: 'pdf',
      fileSize: 320000,
      mimeType: 'application/pdf',
      storagePath: `/evidence/corc/CORC_Q${q + 1}_2025.pdf`,
      category: 'regulatory',
      corcId: corcIssuances[q].id,
    });
  }

  await prisma.evidenceFile.createMany({ data: evidenceFiles });
  console.log(`  ✓ Created ${evidenceFiles.length} evidence files\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('========================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log('');
  console.log('📊 Summary (2x SCALE):');
  console.log(`   Feedstock deliveries: ${feedstocks.length.toLocaleString()}`);
  console.log(`   Total feedstock: ${totalFeedstockTonnes.toLocaleString()} tonnes`);
  console.log(`   Production batches: ${productionBatches.length}`);
  console.log(`   Total biochar: ${totalBiocharTonnes.toLocaleString()} tonnes`);
  console.log(`   Average yield: ${(totalBiocharTonnes / totalFeedstockTonnes * 100).toFixed(1)}%`);
  console.log(`   Lab tests: ${productionBatches.length}`);
  console.log(`   Energy records: ${energyRecords.length}`);
  console.log(`   Sequestration events: ${sequestrationEvents.length}`);
  console.log(`   Monitoring periods: ${monitoringPeriods.length}`);
  console.log(`   CORC issuances: ${corcIssuances.length}`);
  console.log(`   Total CORCs: ${totalCORCs.toLocaleString()} tCO2e`);
  console.log(`   Leakage assessments: 4`);
  console.log(`   Transport events: ${transportEvents.length}`);
  console.log(`   Evidence files: ${evidenceFiles.length}`);
  console.log('');
  console.log('💰 CORC Status:');
  console.log('   Q1: RETIRED to Microsoft Turkey (3,744 tCO2e)');
  console.log('   Q2: ISSUED (available)');
  console.log('   Q3: ISSUED (available)');
  console.log('   Q4: DRAFT (in progress)');
  console.log('========================================\n');

  // Feedstock breakdown
  const feedstockByType = feedstocks.reduce((acc, f) => {
    const type = f.feedstockType || 'unknown';
    if (!acc[type]) acc[type] = { count: 0, tonnes: 0 };
    acc[type].count++;
    acc[type].tonnes += f.weightTonnes || 0;
    return acc;
  }, {} as Record<string, { count: number; tonnes: number }>);

  console.log('🌿 Feedstock breakdown:');
  for (const [type, data] of Object.entries(feedstockByType)) {
    console.log(`   ${type}: ${data.count} deliveries, ${data.tonnes.toFixed(0)} tonnes (${(data.tonnes / totalFeedstockTonnes * 100).toFixed(1)}%)`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

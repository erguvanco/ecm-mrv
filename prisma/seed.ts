import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for 2025 Sakarya operations...');

  // Wipe existing records (order matters for FK constraints)
  await prisma.qRScanLog.deleteMany();
  await prisma.evidenceFile.deleteMany();
  await prisma.bCUProductionBatch.deleteMany();
  await prisma.bCUSequestrationEvent.deleteMany();
  await prisma.sequestrationBatch.deleteMany();
  await prisma.bCU.deleteMany();
  await prisma.sequestrationEvent.deleteMany();
  await prisma.transportEvent.deleteMany();
  await prisma.energyUsage.deleteMany();
  await prisma.productionFeedstock.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.feedstockDelivery.deleteMany();
  await prisma.geocodeCache.deleteMany();
  await prisma.routeCache.deleteMany();

  // Keep the Sakarya plant in place
  await prisma.plantSettings.upsert({
    where: { id: 'singleton' },
    update: {
      plantName: 'Sakarya Biochar Facility',
      address: 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya, Türkiye',
      lat: 40.892533,
      lng: 30.516827,
    },
    create: {
      id: 'singleton',
      plantName: 'Sakarya Biochar Facility',
      address: 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya, Türkiye',
      lat: 40.892533,
      lng: 30.516827,
    },
  });

  console.log('Creating 2025 feedstock deliveries (2-3 trucks/day, 40-50t total)...');

  const start = new Date('2025-01-01');
  const daysInYear = 365;

  // 2-3 trucks per day pattern
  const dailyTruckCount = (dayIndex: number) => {
    // Sunday (day 0): 2 trucks, weekdays vary 2-3, occasional 3
    const dayOfWeek = dayIndex % 7;
    if (dayOfWeek === 0) return 2; // Sunday - lighter
    if (dayOfWeek === 6) return 2; // Saturday - lighter
    return 2 + (dayIndex % 3 === 0 ? 1 : 0); // Weekdays: 2-3 trucks
  };

  // Feedstock sources with realistic types
  // ~50% hazelnut shells, ~30% woody biomass, ~20% corn stover
  const sources = [
    {
      address: 'Geyve Fındık Kooperatifi, Sakarya, Türkiye',
      lat: 40.5075,
      lng: 30.2927,
      feedstockType: 'hazelnut_shells',
      note: 'Hazelnut shells - premium quality',
      distanceKm: 38,
      weight: 50, // selection weight for random distribution
    },
    {
      address: 'Karasu Fındık Deposu, Sakarya, Türkiye',
      lat: 41.0719,
      lng: 30.785,
      feedstockType: 'hazelnut_shells',
      note: 'Hazelnut shells - low moisture',
      distanceKm: 44,
      weight: 50, // 50% total hazelnut
    },
    {
      address: 'Akyazı Orman İşletmesi, Sakarya, Türkiye',
      lat: 40.6857,
      lng: 30.6225,
      feedstockType: 'wood_chips',
      note: 'Mixed hardwood chips - beech/oak',
      distanceKm: 62,
      weight: 15,
    },
    {
      address: 'Sapanca Orman Deposu, Sakarya, Türkiye',
      lat: 40.6917,
      lng: 30.2686,
      feedstockType: 'logging_residues',
      note: 'Pine/beech logging residues',
      distanceKm: 70,
      weight: 15, // 30% total woody
    },
    {
      address: 'Pamukova Mısır Kooperatifi, Sakarya, Türkiye',
      lat: 40.5108,
      lng: 30.1736,
      feedstockType: 'corn_stover',
      note: 'Corn stover - stalks and cobs',
      distanceKm: 48,
      weight: 20, // 20% corn
    },
  ];

  // Weighted random source selection
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const getRandomSource = (seed: number) => {
    let random = (seed * 9301 + 49297) % 233280 / 233280; // Deterministic pseudo-random
    random *= totalWeight;
    let cumulative = 0;
    for (const source of sources) {
      cumulative += source.weight;
      if (random < cumulative) return source;
    }
    return sources[0];
  };

  const feedstocks: Awaited<ReturnType<typeof prisma.feedstockDelivery.create>>[] = [];
  let truckCounter = 100;

  for (let d = 0; d < daysInYear; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);

    // Skip ~5% of days for maintenance/holidays
    if (d === 0 || d === 1 || d === 105 || d === 106 || d === 255 || d === 256) {
      // New Year, Eid holidays, Summer maintenance
      continue;
    }

    const trucksToday = dailyTruckCount(d);
    const targetDailyTonnes = 40 + (d % 11); // 40-50 tonnes target per day

    for (let t = 0; t < trucksToday; t++) {
      const src = getRandomSource(d * 100 + t);

      // Calculate weight per truck to hit daily target
      // Trucks carry 14-22 tonnes depending on vehicle
      const baseWeight = targetDailyTonnes / trucksToday;
      const variance = ((d + t) % 5 - 2) * 1.5; // -3 to +3 variance
      const weight = Math.max(14, Math.min(22, baseWeight + variance));

      truckCounter++;
      const delivery = await prisma.feedstockDelivery.create({
        data: {
          date,
          vehicleId: `34 SAK ${String(truckCounter).padStart(3, '0')}`,
          vehicleDescription: weight > 18 ? 'Articulated Truck (>33t)' : 'Rigid Truck (>17 tonnes)',
          deliveryDistanceKm: src.distanceKm,
          weightTonnes: Number(weight.toFixed(1)),
          volumeM3: Number((weight * 2.2).toFixed(1)), // Approximate volume based on bulk density
          feedstockType: src.feedstockType,
          fuelType: 'diesel',
          fuelAmount: Number((src.distanceKm * 0.35 + weight * 0.8).toFixed(1)), // Realistic diesel consumption
          sourceAddress: src.address,
          sourceLat: src.lat,
          sourceLng: src.lng,
          geocodeStatus: 'success',
          routeStatus: 'success',
          notes: `${src.note} delivery`,
        },
      });
      feedstocks.push(delivery);
    }
  }

  console.log(`Created ${feedstocks.length} feedstock deliveries`);

  console.log('Creating 2025 production batches (daily aggregation)...');

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

  for (const [dateKey, dayFeedstocks] of feedstocksByDate) {
    if (dayFeedstocks.length === 0) continue;

    const inputWeight = dayFeedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);

    // Biochar yield varies by feedstock type (25-35%)
    // Hazelnut shells: ~30%, Wood: ~28%, Corn stover: ~26%
    const avgYield = dayFeedstocks.reduce((sum, f) => {
      const yieldRate = f.feedstockType === 'hazelnut_shells' ? 0.30 :
                        f.feedstockType === 'corn_stover' ? 0.26 : 0.28;
      return sum + (f.weightTonnes || 0) * yieldRate;
    }, 0) / inputWeight * 100;

    const outputYield = avgYield / 100;
    const output = Number((inputWeight * outputYield).toFixed(1));

    // Temperature varies slightly by feedstock mix
    const hasHazelnut = dayFeedstocks.some(f => f.feedstockType === 'hazelnut_shells');
    const hasWood = dayFeedstocks.some(f => f.feedstockType?.includes('wood') || f.feedstockType?.includes('logging'));

    const tempMin = hasWood ? 520 : 500;
    const tempMax = hasHazelnut ? 680 : 650;
    const tempAvg = Math.round((tempMin + tempMax) / 2 + (Math.random() - 0.5) * 20);

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
        notes: `Daily production from ${dayFeedstocks.length} deliveries (${dayFeedstocks.map(f => f.feedstockType).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`,
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
    productionBatches.push(batch);
  }

  console.log(`Created ${productionBatches.length} production batches`);

  // Calculate totals for reporting
  const totalFeedstockTonnes = feedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);
  const totalBiocharTonnes = productionBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);

  console.log('Creating monthly energy usage records...');

  // Monthly energy records - electricity and diesel for plant operations
  const energyRecords = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(2025, m, 1);
    const monthEnd = new Date(2025, m + 1, 0);
    const monthBatches = productionBatches.filter(b => {
      const batchMonth = b.productionDate.getMonth();
      return batchMonth === m;
    });

    if (monthBatches.length > 0) {
      // Electricity for pyrolysis operations
      const monthOutput = monthBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);
      energyRecords.push({
        scope: 'production',
        energyType: 'electricity',
        quantity: Math.round(monthOutput * 45 + 800), // ~45 kWh per tonne + base load
        unit: 'kWh',
        periodStart: monthStart,
        periodEnd: monthEnd,
        productionBatchId: monthBatches[Math.floor(monthBatches.length / 2)].id,
        notes: `Monthly electricity - pyrolysis line, conveyors, exhaust system`,
      });

      // Diesel for on-site equipment
      energyRecords.push({
        scope: 'production',
        energyType: 'diesel',
        quantity: Math.round(monthOutput * 2.5 + 50), // ~2.5L per tonne + base
        unit: 'litres',
        periodStart: monthStart,
        periodEnd: monthEnd,
        productionBatchId: monthBatches[0].id,
        notes: `Monthly diesel - loader, forklift operations`,
      });
    }
  }

  await prisma.energyUsage.createMany({ data: energyRecords });
  console.log(`Created ${energyRecords.length} energy usage records`);

  console.log('Creating sequestration events (quarterly batches)...');

  const sequestrationEvents: Awaited<ReturnType<typeof prisma.sequestrationEvent.create>>[] = [];

  // Quarterly sequestration events
  const sequestrationData = [
    {
      month: 3, // Q1 end - March
      type: 'soil' as const,
      destination: 'Adapazarı Tarım Kooperatifi, Sakarya',
      destLat: 40.7891,
      destLng: 30.4025,
      postcode: '54100',
      storage: true,
      storageConditions: 'covered_outdoor' as const,
    },
    {
      month: 6, // Q2 end - June
      type: 'construction' as const,
      destination: 'Kocaeli Beton Santrali, Kocaeli',
      destLat: 40.7656,
      destLng: 29.9167,
      postcode: '41400',
      storage: false,
      storageConditions: null,
    },
    {
      month: 9, // Q3 end - September
      type: 'compost' as const,
      destination: 'Bursa Organik Gübre Tesisi, Bursa',
      destLat: 40.1833,
      destLng: 29.0667,
      postcode: '16200',
      storage: true,
      storageConditions: 'indoor' as const,
    },
    {
      month: 12, // Q4 end - December
      type: 'soil' as const,
      destination: 'Bilecik Tarım İşletmesi, Bilecik',
      destLat: 40.0567,
      destLng: 30.0189,
      postcode: '11000',
      storage: true,
      storageConditions: 'covered_outdoor' as const,
    },
  ];

  for (let q = 0; q < sequestrationData.length; q++) {
    const seqData = sequestrationData[q];
    const quarterStart = q * 3;
    const quarterEnd = (q + 1) * 3;

    const quarterBatches = productionBatches.filter(b => {
      const month = b.productionDate.getMonth();
      return month >= quarterStart && month < quarterEnd;
    });

    if (quarterBatches.length === 0) continue;

    const quarterOutput = quarterBatches.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);
    const storageStart = new Date(2025, seqData.month - 1, 1);
    const storageEnd = new Date(2025, seqData.month - 1, 20);
    const deliveryDate = new Date(2025, seqData.month - 1, 25);

    const seq = await prisma.sequestrationEvent.create({
      data: {
        storageBeforeDelivery: seqData.storage,
        storageLocation: seqData.storage ? `Sakarya Biochar Depo ${String.fromCharCode(65 + q)}` : null,
        storageStartDate: seqData.storage ? storageStart : null,
        storageEndDate: seqData.storage ? storageEnd : null,
        storageContainerIds: seqData.storage ? `CONT-${2025}-Q${q + 1}-001,CONT-${2025}-Q${q + 1}-002` : null,
        storageConditions: seqData.storageConditions,
        finalDeliveryDate: deliveryDate,
        deliveryVehicleDescription: '30t Bulk Hauler',
        deliveryPostcode: seqData.postcode,
        destinationLat: seqData.destLat,
        destinationLng: seqData.destLng,
        geocodeStatus: 'success',
        sequestrationType: seqData.type,
        status: 'complete',
        wizardStep: 6,
        notes: `Q${q + 1} 2025 biochar sequestration - ${seqData.type} application (${quarterBatches.length} batches, ${quarterOutput.toFixed(1)}t)`,
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

  console.log(`Created ${sequestrationEvents.length} sequestration events`);

  console.log('Creating BCUs (Biochar Carbon Units)...');

  // BCUs issued for each sequestration event
  // CO2e factor: ~3.0 tCO2e per tonne biochar (conservative estimate)
  const bcuPayloads = sequestrationEvents.map((seq, i) => ({
    seqIdx: i,
    // Calculate from sequestration batches
    quantityTonnesCO2e: Math.round(totalBiocharTonnes / 4 * 3.0), // Quarterly portion * CO2e factor
    serial: `BCU-2025-${String(i + 1).padStart(3, '0')}-SAK`,
    status: i === 0 ? 'retired' : i === 1 ? 'transferred' : 'issued',
  }));

  for (const bcu of bcuPayloads) {
    await prisma.bCU.create({
      data: {
        quantityTonnesCO2e: bcu.quantityTonnesCO2e,
        issuanceDate: new Date(2025, (bcu.seqIdx + 1) * 3, 15),
        status: bcu.status as 'issued' | 'retired' | 'transferred',
        registrySerialNumber: bcu.serial,
        ownerName: bcu.seqIdx === 0 ? 'Turkish Carbon Fund' :
                   bcu.seqIdx === 1 ? 'Marmara Green Investments' :
                   bcu.seqIdx === 2 ? 'Anadolu Carbon Partners' : 'Sakarya Biochar Facility',
        retirementDate: bcu.status === 'retired' ? new Date(2025, 4, 20) : null,
        retirementBeneficiary: bcu.status === 'retired' ? 'Industrial Carbon Offset - Sakarya Packaging Ltd' : null,
        notes: `Q${bcu.seqIdx + 1} 2025 Sakarya biochar production`,
        sequestrationEvents: {
          create: { sequestrationId: sequestrationEvents[bcu.seqIdx].id },
        },
      },
    });
  }

  console.log(`Created ${bcuPayloads.length} BCUs`);

  console.log('Creating transport events for sequestration deliveries...');

  const transportEvents = sequestrationEvents.map((seq, i) => ({
    date: seq.finalDeliveryDate!,
    vehicleId: `34 SAK ${800 + i}`,
    vehicleDescription: '30t Walking Floor Trailer',
    originAddress: 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya, Türkiye',
    originLat: 40.892533,
    originLng: 30.516827,
    destinationAddress: sequestrationData[i].destination,
    destinationLat: seq.destinationLat!,
    destinationLng: seq.destinationLng!,
    distanceKm: Math.round(50 + i * 30 + Math.random() * 20),
    fuelType: 'diesel',
    fuelAmount: Math.round(80 + i * 25),
    cargoDescription: `Biochar delivery for ${seq.sequestrationType} application - Q${i + 1} 2025`,
    sequestrationEventId: seq.id,
  }));

  await prisma.transportEvent.createMany({ data: transportEvents });
  console.log(`Created ${transportEvents.length} transport events`);

  console.log('Creating evidence files...');

  const evidenceFiles = [
    // Feedstock certificates
    {
      fileName: '2025_hazelnut_sustainability_cert.pdf',
      fileType: 'pdf',
      fileSize: 240000,
      mimeType: 'application/pdf',
      storagePath: '/evidence/feedstock/2025_hazelnut_cert.pdf',
      category: 'sustainability',
      feedstockDeliveryId: feedstocks[0].id,
    },
    {
      fileName: '2025_forestry_stewardship_cert.pdf',
      fileType: 'pdf',
      fileSize: 285000,
      mimeType: 'application/pdf',
      storagePath: '/evidence/feedstock/2025_forestry_cert.pdf',
      category: 'sustainability',
      feedstockDeliveryId: feedstocks.find(f => f.feedstockType === 'wood_chips')?.id || feedstocks[1].id,
    },
    // Production evidence
    {
      fileName: 'jan_2025_production_weight_ticket.jpg',
      fileType: 'image',
      fileSize: 820000,
      mimeType: 'image/jpeg',
      storagePath: '/evidence/production/jan_weight.jpg',
      category: 'weight_in',
      productionBatchId: productionBatches[0].id,
    },
    {
      fileName: 'jan_2025_temperature_log.csv',
      fileType: 'csv',
      fileSize: 52000,
      mimeType: 'text/csv',
      storagePath: '/evidence/production/jan_temp.csv',
      category: 'temperature_log',
      productionBatchId: productionBatches[0].id,
    },
    {
      fileName: 'q1_biochar_output_cert.pdf',
      fileType: 'pdf',
      fileSize: 180000,
      mimeType: 'application/pdf',
      storagePath: '/evidence/production/q1_output.pdf',
      category: 'biochar_out',
      productionBatchId: productionBatches[30].id,
    },
    // Sequestration evidence
    {
      fileName: 'q1_delivery_note_soil.pdf',
      fileType: 'pdf',
      fileSize: 156000,
      mimeType: 'application/pdf',
      storagePath: '/evidence/sequestration/q1_delivery.pdf',
      category: 'delivery',
      sequestrationEventId: sequestrationEvents[0]?.id,
    },
    {
      fileName: 'q2_construction_application_cert.pdf',
      fileType: 'pdf',
      fileSize: 198000,
      mimeType: 'application/pdf',
      storagePath: '/evidence/sequestration/q2_construction.pdf',
      category: 'regulatory',
      sequestrationEventId: sequestrationEvents[1]?.id,
    },
  ];

  await prisma.evidenceFile.createMany({
    data: evidenceFiles.filter(e => e.feedstockDeliveryId || e.productionBatchId || e.sequestrationEventId)
  });

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('Summary:');
  console.log(`  Feedstock deliveries: ${feedstocks.length}`);
  console.log(`  Total feedstock: ${totalFeedstockTonnes.toFixed(1)} tonnes`);
  console.log(`  Production batches: ${productionBatches.length}`);
  console.log(`  Total biochar output: ${totalBiocharTonnes.toFixed(1)} tonnes`);
  console.log(`  Average yield: ${(totalBiocharTonnes / totalFeedstockTonnes * 100).toFixed(1)}%`);
  console.log(`  Sequestration events: ${sequestrationEvents.length}`);
  console.log(`  BCUs issued: ${bcuPayloads.length}`);
  console.log(`  Energy records: ${energyRecords.length}`);
  console.log(`  Transport events: ${transportEvents.length}`);
  console.log('========================================\n');

  // Feedstock breakdown
  const feedstockByType = feedstocks.reduce((acc, f) => {
    const type = f.feedstockType || 'unknown';
    if (!acc[type]) acc[type] = { count: 0, tonnes: 0 };
    acc[type].count++;
    acc[type].tonnes += f.weightTonnes || 0;
    return acc;
  }, {} as Record<string, { count: number; tonnes: number }>);

  console.log('Feedstock breakdown:');
  for (const [type, data] of Object.entries(feedstockByType)) {
    console.log(`  ${type}: ${data.count} deliveries, ${data.tonnes.toFixed(1)} tonnes (${(data.tonnes / totalFeedstockTonnes * 100).toFixed(1)}%)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for 2025 Sakarya operations...');

  // Wipe existing records (order matters for FK constraints)
  await prisma.evidenceFile.deleteMany();
  await prisma.bCUProductionBatch.deleteMany();
  await prisma.bCUSequestrationEvent.deleteMany();
  await prisma.sequestrationBatch.deleteMany();
  await prisma.bCU.deleteMany();
  await prisma.sequestrationEvent.deleteMany();
  await prisma.transportEvent.deleteMany();
  await prisma.energyUsage.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.feedstockDelivery.deleteMany();

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

  console.log('Creating 2025 feedstock deliveries (truck-level, ~20t each)...');

  // Generate ~6 trucks per day over the year (~2,190 deliveries, ~48k tonnes)
  const start = new Date('2025-01-01');
  const daysInYear = 365;

  const dailyTruckCount = (dayIndex: number) => 5 + ((dayIndex % 7) % 3); // 5-7 trucks/day
  const feedstockTypes = ['agricultural_residue', 'forestry_residue', 'agricultural_residue'];
  const sources = [
    {
      address: 'Geyve Fındık Kooperatifi, Sakarya, Türkiye',
      lat: 40.5075,
      lng: 30.2927,
      note: 'Hazelnut shells',
      distanceKm: 38,
    },
    {
      address: 'Akyazı Orman İşletmesi, Sakarya, Türkiye',
      lat: 40.6857,
      lng: 30.6225,
      note: 'Mixed forest residues',
      distanceKm: 62,
    },
    {
      address: 'Pamukova Mısır Kooperatifi, Sakarya, Türkiye',
      lat: 40.5108,
      lng: 30.1736,
      note: 'Corn stover',
      distanceKm: 48,
    },
    {
      address: 'Karasu Fındık Deposu, Sakarya, Türkiye',
      lat: 41.0719,
      lng: 30.785,
      note: 'Hazelnut shells (low moisture)',
      distanceKm: 44,
    },
    {
      address: 'Sapanca Orman Deposu, Sakarya, Türkiye',
      lat: 40.6917,
      lng: 30.2686,
      note: 'Pine/beech chips',
      distanceKm: 70,
    },
  ];

  const feedstocks = [];
  for (let d = 0; d < daysInYear; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const trucksToday = dailyTruckCount(d);
    for (let t = 0; t < trucksToday; t++) {
      const src = sources[(d + t) % sources.length];
      const type = feedstockTypes[(d + t) % feedstockTypes.length];
      // weight around 20-24 tonnes
      const weight = 20 + ((d + t) % 5) + (t % 3) * 0.4; // 20–24t band
      const delivery = await prisma.feedstockDelivery.create({
        data: {
          date,
          vehicleId: `TRK-${String(200 + (d % 900)).padStart(3, '0')}`,
          vehicleDescription: '24t Truck',
          deliveryDistanceKm: src.distanceKm,
          weightTonnes: Number(weight.toFixed(1)),
          volumeM3: null,
          feedstockType: type,
          fuelType: 'diesel',
          fuelAmount: 50 + weight * 2, // rough liters equiv
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

  console.log('Creating 2025 production batches (daily aggregation)...');

  // Aggregate by day: one production batch per day using that day's feedstocks
  const productionBatches = [];
  for (let d = 0; d < daysInYear; d++) {
    const dayFeedstocks = feedstocks.filter(
      (f) => f.date.toISOString().slice(0, 10) === new Date(start.getTime() + d * 86400000).toISOString().slice(0, 10)
    );
    if (dayFeedstocks.length === 0) continue;
    const inputWeight = dayFeedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);
    const output = Number((inputWeight * 0.31).toFixed(1)); // ~31% yield -> ~15k t/year

    const batch = await prisma.productionBatch.create({
      data: {
        productionDate: new Date(start.getTime() + d * 86400000),
        inputFeedstockWeightTonnes: Number(inputWeight.toFixed(1)),
        outputBiocharWeightTonnes: output,
        temperatureMin: 480,
        temperatureMax: 650,
        temperatureAvg: 560,
        status: 'complete',
        wizardStep: 5,
        notes: `Daily run from ${dayFeedstocks.length} trucks`,
        // Link first feedstock for legacy field
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

  console.log('Creating energy usage...');
  await prisma.energyUsage.createMany({
    data: productionBatches.slice(0, 6).map((batch, i) => ({
      scope: 'production',
      energyType: 'electricity',
      quantity: 520 + i * 12,
      unit: 'kWh',
      periodStart: new Date(`2025-0${i + 1}-01`),
      periodEnd: new Date(`2025-0${i + 1}-15`),
      productionBatchId: batch.id,
      notes: 'Pyrolysis line + flue gas fan',
    })),
  });

  console.log('Creating sequestration events...');
  console.log('Creating sequestration events (monthly roll-ups)...');
  const sequestrationEvents = [];
  for (let m = 0; m < 3; m++) {
    const monthStart = m * 4; // roughly every 4 months
    const batchesForMonth = productionBatches.slice(monthStart * 30, (monthStart + 1) * 30);
    const quantity = batchesForMonth.reduce((sum, b) => sum + (b.outputBiocharWeightTonnes || 0), 0);
    const seq = await prisma.sequestrationEvent.create({
      data: {
        storageBeforeDelivery: m !== 1,
        storageLocation: m !== 1 ? `Depo ${String.fromCharCode(65 + m)}` : null,
        storageStartDate: new Date(`2025-0${m * 4 + 2}-01`),
        storageEndDate: new Date(`2025-0${m * 4 + 3}-05`),
        storageContainerIds: m !== 1 ? `S-${m + 1}-01,S-${m + 1}-02` : null,
        storageConditions: m === 2 ? 'indoor' : 'covered_outdoor',
        finalDeliveryDate: new Date(`2025-0${m * 4 + 3}-15`),
        deliveryVehicleDescription: '30t Bulk Hauler',
        deliveryPostcode: m === 0 ? '54100' : m === 1 ? '41400' : '16200',
        destinationLat: m === 0 ? 40.8556 : m === 1 ? 40.7656 : 40.1833,
        destinationLng: m === 0 ? 30.5117 : m === 1 ? 29.9167 : 29.0667,
        geocodeStatus: 'success',
        sequestrationType: m === 0 ? 'soil' : m === 1 ? 'construction' : 'compost',
        status: 'complete',
        wizardStep: 6,
        notes: 'Monthly bulk shipment',
        batches: {
          create: batchesForMonth.slice(0, 10).map((b) => ({
            productionBatchId: b.id,
            quantityTonnes: Number(((b.outputBiocharWeightTonnes || 0) * 0.9).toFixed(1)), // allocate 90% to shipment
          })),
        },
      },
    });
    sequestrationEvents.push(seq);
  }

  console.log('Creating BCUs...');
  const bcuPayloads = [
    { seqIdx: 0, quantityTonnesCO2e: 5200, serial: 'BCU-2025-001-SAK' },
    { seqIdx: 1, quantityTonnesCO2e: 5200, serial: 'BCU-2025-002-SAK' },
    { seqIdx: 2, quantityTonnesCO2e: 5200, serial: 'BCU-2025-003-SAK' },
  ];

  await Promise.all(
    bcuPayloads.map((bcu, i) =>
      prisma.bCU.create({
        data: {
          quantityTonnesCO2e: bcu.quantityTonnesCO2e,
          issuanceDate: new Date(`2025-0${i + 3}-20`),
          status: i === 0 ? 'retired' : 'issued',
          registrySerialNumber: bcu.serial,
          ownerName: i === 2 ? 'Anadolu Carbon Fund' : 'Marmara Green Investments',
          retirementDate: i === 0 ? new Date('2025-04-15') : null,
          retirementBeneficiary: i === 0 ? 'Industrial Offset - Packaging Plant' : null,
          notes: 'Issued from 2025 Sakarya operations',
          sequestrationEvents: {
            create: { sequestrationId: sequestrationEvents[bcu.seqIdx].id },
          },
        },
      })
    )
  );

  console.log('Creating transport events...');
  await prisma.transportEvent.createMany({
    data: [
      {
        date: new Date('2025-03-06'),
        vehicleId: 'TRK-450',
        vehicleDescription: '18t Tipper',
        distanceKm: 42,
        fuelType: 'diesel',
        fuelAmount: 85,
        cargoDescription: 'Biochar to soil trial plots',
        sequestrationEventId: sequestrationEvents[0].id,
      },
      {
        date: new Date('2025-05-13'),
        vehicleId: 'TRK-451',
        vehicleDescription: '24t Walking Floor',
        distanceKm: 58,
        fuelType: 'diesel',
        fuelAmount: 112,
        cargoDescription: 'Biochar to concrete batching plant',
        sequestrationEventId: sequestrationEvents[1].id,
      },
      {
        date: new Date('2025-07-06'),
        vehicleId: 'TRK-452',
        vehicleDescription: '30t Curtain Sider',
        distanceKm: 86,
        fuelType: 'diesel',
        fuelAmount: 148,
        cargoDescription: 'Biochar to compost facility',
        sequestrationEventId: sequestrationEvents[2].id,
      },
    ],
  });

  console.log('Seeding evidence files...');
  await prisma.evidenceFile.createMany({
    data: [
      {
        fileName: '2025_feedstock_cert_hazelnut.pdf',
        fileType: 'pdf',
        fileSize: 240000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/feedstock/2025_hazelnut_cert.pdf',
        category: 'sustainability',
        feedstockDeliveryId: feedstocks[0].id,
      },
      {
        fileName: '2025_feedstock_cert_forest.pdf',
        fileType: 'pdf',
        fileSize: 265000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/feedstock/2025_forest_cert.pdf',
        category: 'sustainability',
        feedstockDeliveryId: feedstocks[1].id,
      },
      {
        fileName: 'batch1_weight_ticket.jpg',
        fileType: 'image',
        fileSize: 820000,
        mimeType: 'image/jpeg',
        storagePath: '/evidence/production/batch1_weight.jpg',
        category: 'weight_in',
        productionBatchId: productionBatches[0].id,
      },
      {
        fileName: 'batch1_temp_log.csv',
        fileType: 'csv',
        fileSize: 52000,
        mimeType: 'text/csv',
        storagePath: '/evidence/production/batch1_temp.csv',
        category: 'temperature_log',
        productionBatchId: productionBatches[0].id,
      },
      {
        fileName: 'sequestration_delivery_note_mar.pdf',
        fileType: 'pdf',
        fileSize: 156000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/sequestration/delivery_mar.pdf',
        category: 'delivery',
        sequestrationEventId: sequestrationEvents[0].id,
      },
      {
        fileName: 'bcu_certificate_2025_001.pdf',
        fileType: 'pdf',
        fileSize: 330000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/bcu/2025_001.pdf',
        category: 'general',
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log({
    feedstocks: feedstocks.length,
    productionBatches: productionBatches.length,
    sequestrationEvents: sequestrationEvents.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

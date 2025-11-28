import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
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

  console.log('Setting up plant location...');

  // Set up plant location (Sakarya, Turkey - biochar production facility)
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

  console.log('Creating feedstock deliveries...');

  // Create feedstock deliveries
  const feedstock1 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-01-15'),
      vehicleId: 'TRK-001',
      vehicleDescription: '20t Flatbed Truck',
      deliveryDistanceKm: 45.5,
      weightTonnes: 18.5,
      volumeM3: 65.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'diesel',
      fuelAmount: 25.0,
      sourceAddress: 'Adapazarı Tarım Kooperatifi, Erenler, Sakarya, Türkiye',
      sourceLat: 40.7667,
      sourceLng: 30.4000,
      geocodeStatus: 'success',
      notes: 'Wheat straw from local farm',
    },
  });

  const feedstock2 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-01-22'),
      vehicleId: 'TRK-002',
      vehicleDescription: '15t Box Truck',
      deliveryDistanceKm: 32.0,
      weightTonnes: 12.8,
      volumeM3: 48.0,
      feedstockType: 'forestry_residue',
      fuelType: 'diesel',
      fuelAmount: 18.5,
      sourceAddress: 'Bolu Orman İşletmesi, Merkez, Bolu, Türkiye',
      sourceLat: 40.7356,
      sourceLng: 31.6089,
      geocodeStatus: 'success',
      notes: 'Wood chips from forest thinning',
    },
  });

  const feedstock3 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-02-05'),
      vehicleId: 'TRK-003',
      vehicleDescription: '25t Articulated Lorry',
      deliveryDistanceKm: 78.0,
      weightTonnes: 22.3,
      volumeM3: 80.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'biodiesel',
      fuelAmount: 42.0,
      sourceAddress: 'Bilecik Tarım Çiftliği, Pazaryeri, Bilecik, Türkiye',
      sourceLat: 40.0056,
      sourceLng: 30.0311,
      geocodeStatus: 'success',
      notes: 'Mixed agricultural waste',
    },
  });

  const feedstock4 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-02-18'),
      vehicleId: 'TRK-001',
      vehicleDescription: '20t Flatbed Truck',
      deliveryDistanceKm: 55.0,
      weightTonnes: 16.7,
      volumeM3: 58.0,
      feedstockType: 'organic_waste',
      fuelType: 'diesel',
      fuelAmount: 30.0,
      sourceAddress: 'Kocaeli Gıda OSB, Gebze, Kocaeli, Türkiye',
      sourceLat: 40.7989,
      sourceLng: 29.4306,
      geocodeStatus: 'success',
      notes: 'Food processing waste',
    },
  });

  const feedstock5 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-03-01'),
      vehicleId: 'TRK-004',
      vehicleDescription: 'Electric Delivery Van',
      deliveryDistanceKm: 25.0,
      weightTonnes: 8.5,
      volumeM3: 32.0,
      feedstockType: 'energy_crops',
      fuelType: 'electric',
      fuelAmount: 45.0, // kWh
      sourceAddress: 'Hendek Biyokütle Çiftliği, Hendek, Sakarya, Türkiye',
      sourceLat: 40.7928,
      sourceLng: 30.7511,
      geocodeStatus: 'success',
      notes: 'Miscanthus from energy crop farm',
    },
  });

  // Additional feedstock deliveries from around the region
  const feedstock6 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-03-10'),
      vehicleId: 'TRK-008',
      vehicleDescription: '18t Tipper Truck',
      deliveryDistanceKm: 62.0,
      weightTonnes: 24.5,
      volumeM3: 88.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'diesel',
      fuelAmount: 35.0,
      sourceAddress: 'Pamukova Tarım İşletmesi, Pamukova, Sakarya, Türkiye',
      sourceLat: 40.5042,
      sourceLng: 30.1642,
      geocodeStatus: 'success',
      notes: 'Barley straw from spring harvest remnants',
    },
  });

  const feedstock7 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-03-15'),
      vehicleId: 'TRK-002',
      vehicleDescription: '15t Box Truck',
      deliveryDistanceKm: 48.0,
      weightTonnes: 15.2,
      volumeM3: 55.0,
      feedstockType: 'forestry_residue',
      fuelType: 'biodiesel',
      fuelAmount: 28.0,
      sourceAddress: 'Düzce Orman İşletmesi, Merkez, Düzce, Türkiye',
      sourceLat: 40.8438,
      sourceLng: 31.1628,
      geocodeStatus: 'success',
      notes: 'Pine and spruce brash from forest management',
    },
  });

  const feedstock8 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-03-22'),
      vehicleId: 'TRK-009',
      vehicleDescription: '22t Articulated Lorry',
      deliveryDistanceKm: 85.0,
      weightTonnes: 28.0,
      volumeM3: 95.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'diesel',
      fuelAmount: 48.0,
      sourceAddress: 'Bursa Ovası Tarım Kooperatifi, Karacabey, Bursa, Türkiye',
      sourceLat: 40.2142,
      sourceLng: 28.3586,
      geocodeStatus: 'success',
      notes: 'Mixed wheat and oilseed rape straw',
    },
  });

  const feedstock9 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-03-28'),
      vehicleId: 'TRK-010',
      vehicleDescription: '16t Flatbed Truck',
      deliveryDistanceKm: 38.0,
      weightTonnes: 14.8,
      volumeM3: 52.0,
      feedstockType: 'organic_waste',
      fuelType: 'diesel',
      fuelAmount: 22.0,
      sourceAddress: 'Sapanca Gıda İşleme Tesisi, Sapanca, Sakarya, Türkiye',
      sourceLat: 40.6917,
      sourceLng: 30.2686,
      geocodeStatus: 'success',
      notes: 'Vegetable processing waste - carrot and potato peelings',
    },
  });

  const feedstock10 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-04-02'),
      vehicleId: 'TRK-003',
      vehicleDescription: '25t Articulated Lorry',
      deliveryDistanceKm: 72.0,
      weightTonnes: 26.5,
      volumeM3: 90.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'biodiesel',
      fuelAmount: 40.0,
      sourceAddress: 'Eskişehir Şeker Fabrikası Bölgesi, Mahmudiye, Eskişehir, Türkiye',
      sourceLat: 39.4833,
      sourceLng: 30.9833,
      geocodeStatus: 'success',
      notes: 'Sugar beet tops and wheat straw mix',
    },
  });

  const feedstock11 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-04-08'),
      vehicleId: 'TRK-011',
      vehicleDescription: '12t Box Truck',
      deliveryDistanceKm: 55.0,
      weightTonnes: 11.2,
      volumeM3: 42.0,
      feedstockType: 'forestry_residue',
      fuelType: 'diesel',
      fuelAmount: 30.0,
      sourceAddress: 'Kocaeli Orman Fidanlığı, İzmit, Kocaeli, Türkiye',
      sourceLat: 40.7656,
      sourceLng: 29.9408,
      geocodeStatus: 'success',
      notes: 'Mixed hardwood brash from coppicing',
    },
  });

  const feedstock12 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-04-12'),
      vehicleId: 'TRK-001',
      vehicleDescription: '20t Flatbed Truck',
      deliveryDistanceKm: 42.0,
      weightTonnes: 19.8,
      volumeM3: 70.0,
      feedstockType: 'energy_crops',
      fuelType: 'diesel',
      fuelAmount: 24.0,
      sourceAddress: 'Kaynarca Biyoenerji Çiftliği, Kaynarca, Sakarya, Türkiye',
      sourceLat: 41.0092,
      sourceLng: 30.3022,
      geocodeStatus: 'success',
      notes: 'Willow short rotation coppice - 3 year harvest',
    },
  });

  const feedstock13 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-04-18'),
      vehicleId: 'TRK-008',
      vehicleDescription: '18t Tipper Truck',
      deliveryDistanceKm: 68.0,
      weightTonnes: 21.5,
      volumeM3: 78.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'diesel',
      fuelAmount: 38.0,
      sourceAddress: 'Kütahya Çiftlik Kooperatifi, Tavşanlı, Kütahya, Türkiye',
      sourceLat: 39.5500,
      sourceLng: 29.5000,
      geocodeStatus: 'success',
      notes: 'Spring barley straw - high quality',
    },
  });

  const feedstock14 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-04-25'),
      vehicleId: 'TRK-012',
      vehicleDescription: '14t Curtainsider',
      deliveryDistanceKm: 95.0,
      weightTonnes: 12.5,
      volumeM3: 48.0,
      feedstockType: 'organic_waste',
      fuelType: 'biodiesel',
      fuelAmount: 52.0,
      sourceAddress: 'Efes Pilsen Fabrikası, Lüleburgaz, Kırklareli, Türkiye',
      sourceLat: 41.4039,
      sourceLng: 27.3561,
      geocodeStatus: 'success',
      notes: 'Spent grain and hop residues from brewing',
    },
  });

  const feedstock15 = await prisma.feedstockDelivery.create({
    data: {
      date: new Date('2024-05-02'),
      vehicleId: 'TRK-013',
      vehicleDescription: 'Electric HGV',
      deliveryDistanceKm: 35.0,
      weightTonnes: 16.0,
      volumeM3: 58.0,
      feedstockType: 'agricultural_residue',
      fuelType: 'electric',
      fuelAmount: 180.0, // kWh
      sourceAddress: 'Sakarya Üniversitesi Ziraat Fakültesi, Serdivan, Sakarya, Türkiye',
      sourceLat: 40.7422,
      sourceLng: 30.3347,
      geocodeStatus: 'success',
      notes: 'Research trial crop residues - mixed cereals',
    },
  });

  console.log('Creating production batches...');

  // Create production batches
  const production1 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-01-20'),
      feedstockDeliveryId: feedstock1.id,
      inputFeedstockWeightTonnes: 18.5,
      outputBiocharWeightTonnes: 4.6,
      temperatureMin: 450,
      temperatureMax: 650,
      temperatureAvg: 550,
      status: 'complete',
      wizardStep: 5,
      notes: 'First batch of the year, excellent yield',
    },
  });

  const production2 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-01-28'),
      feedstockDeliveryId: feedstock2.id,
      inputFeedstockWeightTonnes: 12.8,
      outputBiocharWeightTonnes: 3.2,
      temperatureMin: 480,
      temperatureMax: 620,
      temperatureAvg: 560,
      status: 'complete',
      wizardStep: 5,
      notes: 'Wood chip batch, slower pyrolysis',
    },
  });

  const production3 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-02-12'),
      feedstockDeliveryId: feedstock3.id,
      inputFeedstockWeightTonnes: 22.3,
      outputBiocharWeightTonnes: 5.8,
      temperatureMin: 420,
      temperatureMax: 580,
      temperatureAvg: 510,
      status: 'complete',
      wizardStep: 5,
      notes: 'Large batch, good conversion rate',
    },
  });

  const production4 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-02-25'),
      feedstockDeliveryId: feedstock4.id,
      inputFeedstockWeightTonnes: 16.7,
      outputBiocharWeightTonnes: 3.8,
      temperatureMin: 400,
      temperatureMax: 550,
      temperatureAvg: 480,
      status: 'complete',
      wizardStep: 5,
      notes: 'Organic waste batch',
    },
  });

  const production5 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-03-05'),
      feedstockDeliveryId: feedstock5.id,
      inputFeedstockWeightTonnes: 8.5,
      outputBiocharWeightTonnes: 2.4,
      temperatureMin: 500,
      temperatureMax: 680,
      temperatureAvg: 590,
      status: 'draft',
      wizardStep: 3,
      notes: 'In progress - awaiting temperature log',
    },
  });

  // Additional production batches for new feedstock
  const production6 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-03-14'),
      feedstockDeliveryId: feedstock6.id,
      inputFeedstockWeightTonnes: 24.5,
      outputBiocharWeightTonnes: 6.4,
      temperatureMin: 480,
      temperatureMax: 640,
      temperatureAvg: 565,
      status: 'complete',
      wizardStep: 5,
      notes: 'Excellent barley straw conversion - high carbon content',
    },
  });

  const production7 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-03-18'),
      feedstockDeliveryId: feedstock7.id,
      inputFeedstockWeightTonnes: 15.2,
      outputBiocharWeightTonnes: 4.2,
      temperatureMin: 520,
      temperatureMax: 700,
      temperatureAvg: 610,
      status: 'complete',
      wizardStep: 5,
      notes: 'Pine brash - higher temperature for resin volatilization',
    },
  });

  const production8 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-03-26'),
      feedstockDeliveryId: feedstock8.id,
      inputFeedstockWeightTonnes: 28.0,
      outputBiocharWeightTonnes: 7.0,
      temperatureMin: 450,
      temperatureMax: 620,
      temperatureAvg: 540,
      status: 'complete',
      wizardStep: 5,
      notes: 'Large batch - split across two pyrolysis cycles',
    },
  });

  const production9 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-01'),
      feedstockDeliveryId: feedstock9.id,
      inputFeedstockWeightTonnes: 14.8,
      outputBiocharWeightTonnes: 3.1,
      temperatureMin: 380,
      temperatureMax: 520,
      temperatureAvg: 455,
      status: 'complete',
      wizardStep: 5,
      notes: 'Lower temperature for organic waste - preserving nutrients',
    },
  });

  const production10 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-06'),
      feedstockDeliveryId: feedstock10.id,
      inputFeedstockWeightTonnes: 26.5,
      outputBiocharWeightTonnes: 6.9,
      temperatureMin: 470,
      temperatureMax: 630,
      temperatureAvg: 555,
      status: 'complete',
      wizardStep: 5,
      notes: 'Sugar beet mix - consistent quality output',
    },
  });

  const production11 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-11'),
      feedstockDeliveryId: feedstock11.id,
      inputFeedstockWeightTonnes: 11.2,
      outputBiocharWeightTonnes: 3.4,
      temperatureMin: 510,
      temperatureMax: 680,
      temperatureAvg: 595,
      status: 'complete',
      wizardStep: 5,
      notes: 'Hardwood brash - excellent fixed carbon ratio',
    },
  });

  const production12 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-15'),
      feedstockDeliveryId: feedstock12.id,
      inputFeedstockWeightTonnes: 19.8,
      outputBiocharWeightTonnes: 5.5,
      temperatureMin: 490,
      temperatureMax: 660,
      temperatureAvg: 580,
      status: 'complete',
      wizardStep: 5,
      notes: 'Willow SRC - premium grade biochar produced',
    },
  });

  const production13 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-22'),
      feedstockDeliveryId: feedstock13.id,
      inputFeedstockWeightTonnes: 21.5,
      outputBiocharWeightTonnes: 5.6,
      temperatureMin: 460,
      temperatureMax: 610,
      temperatureAvg: 538,
      status: 'complete',
      wizardStep: 5,
      notes: 'Spring barley straw - optimal moisture content',
    },
  });

  const production14 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-04-28'),
      feedstockDeliveryId: feedstock14.id,
      inputFeedstockWeightTonnes: 12.5,
      outputBiocharWeightTonnes: 2.8,
      temperatureMin: 400,
      temperatureMax: 540,
      temperatureAvg: 475,
      status: 'complete',
      wizardStep: 5,
      notes: 'Brewery waste - specialized low-temp process for nutrient retention',
    },
  });

  const production15 = await prisma.productionBatch.create({
    data: {
      productionDate: new Date('2024-05-05'),
      feedstockDeliveryId: feedstock15.id,
      inputFeedstockWeightTonnes: 16.0,
      outputBiocharWeightTonnes: 4.2,
      temperatureMin: 470,
      temperatureMax: 620,
      temperatureAvg: 550,
      status: 'draft',
      wizardStep: 4,
      notes: 'Research batch - multiple samples for analysis',
    },
  });

  console.log('Creating energy usage records...');

  // Create energy usage records
  await prisma.energyUsage.createMany({
    data: [
      {
        scope: 'production',
        energyType: 'electricity',
        quantity: 450,
        unit: 'kWh',
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-20'),
        productionBatchId: production1.id,
        notes: 'Pyrolysis unit operation',
      },
      {
        scope: 'production',
        energyType: 'electricity',
        quantity: 380,
        unit: 'kWh',
        periodStart: new Date('2024-01-23'),
        periodEnd: new Date('2024-01-28'),
        productionBatchId: production2.id,
      },
      {
        scope: 'production',
        energyType: 'electricity',
        quantity: 520,
        unit: 'kWh',
        periodStart: new Date('2024-02-08'),
        periodEnd: new Date('2024-02-12'),
        productionBatchId: production3.id,
      },
      {
        scope: 'storage',
        energyType: 'electricity',
        quantity: 85,
        unit: 'kWh',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        notes: 'Storage facility lighting and ventilation',
      },
      {
        scope: 'storage',
        energyType: 'electricity',
        quantity: 90,
        unit: 'kWh',
        periodStart: new Date('2024-02-01'),
        periodEnd: new Date('2024-02-29'),
      },
      {
        scope: 'other',
        energyType: 'gas',
        quantity: 120,
        unit: 'm3',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-03-01'),
        notes: 'Office heating',
      },
    ],
  });

  console.log('Creating transport events...');

  // Create transport events
  await prisma.transportEvent.createMany({
    data: [
      {
        date: new Date('2024-02-01'),
        vehicleId: 'TRK-005',
        vehicleDescription: '10t Tipper Truck',
        distanceKm: 35.0,
        fuelType: 'diesel',
        fuelAmount: 18.0,
        cargoDescription: 'Biochar delivery to farm A',
        feedstockDeliveryId: null,
      },
      {
        date: new Date('2024-02-15'),
        vehicleId: 'TRK-006',
        vehicleDescription: '8t Box Truck',
        distanceKm: 48.0,
        fuelType: 'diesel',
        fuelAmount: 22.0,
        cargoDescription: 'Biochar delivery to construction site',
      },
      {
        date: new Date('2024-02-28'),
        vehicleId: 'TRK-005',
        vehicleDescription: '10t Tipper Truck',
        distanceKm: 62.0,
        fuelType: 'biodiesel',
        fuelAmount: 28.0,
        cargoDescription: 'Bulk biochar delivery to farm B',
      },
      {
        date: new Date('2024-03-10'),
        vehicleId: 'TRK-007',
        vehicleDescription: 'Electric Delivery Van',
        distanceKm: 25.0,
        fuelType: 'electric',
        fuelAmount: 35.0,
        cargoDescription: 'Biochar samples to research lab',
      },
    ],
  });

  console.log('Creating sequestration events...');

  // Create sequestration events
  const sequestration1 = await prisma.sequestrationEvent.create({
    data: {
      storageBeforeDelivery: true,
      storageLocation: 'Depo A - Kuzey Bölümü',
      storageStartDate: new Date('2024-01-22'),
      storageEndDate: new Date('2024-02-01'),
      storageContainerIds: 'CONT-001, CONT-002',
      storageConditions: 'covered_outdoor',
      finalDeliveryDate: new Date('2024-02-02'),
      deliveryVehicleDescription: '10t Tipper Truck',
      deliveryPostcode: '54100',
      destinationLat: 40.8556,
      destinationLng: 30.5117,
      geocodeStatus: 'success',
      sequestrationType: 'soil',
      status: 'complete',
      wizardStep: 6,
      notes: 'First sequestration event - Akyazı farm soil amendment',
      batches: {
        create: [
          {
            productionBatchId: production1.id,
            quantityTonnes: 4.6,
          },
        ],
      },
    },
  });

  const sequestration2 = await prisma.sequestrationEvent.create({
    data: {
      storageBeforeDelivery: false,
      finalDeliveryDate: new Date('2024-02-16'),
      deliveryVehicleDescription: '8t Box Truck',
      deliveryPostcode: '41400',
      destinationLat: 40.7656,
      destinationLng: 29.9167,
      geocodeStatus: 'success',
      sequestrationType: 'construction',
      status: 'complete',
      wizardStep: 6,
      notes: 'İzmit construction site biochar application',
      batches: {
        create: [
          {
            productionBatchId: production2.id,
            quantityTonnes: 3.2,
          },
        ],
      },
    },
  });

  const sequestration3 = await prisma.sequestrationEvent.create({
    data: {
      storageBeforeDelivery: true,
      storageLocation: 'Depo B',
      storageStartDate: new Date('2024-02-14'),
      storageEndDate: new Date('2024-02-28'),
      storageConditions: 'indoor',
      finalDeliveryDate: new Date('2024-03-01'),
      deliveryVehicleDescription: '10t Tipper Truck',
      deliveryPostcode: '16200',
      destinationLat: 40.1833,
      destinationLng: 29.0667,
      geocodeStatus: 'success',
      sequestrationType: 'compost',
      status: 'complete',
      wizardStep: 6,
      notes: 'Bursa landscaping project - compost blend',
      batches: {
        create: [
          {
            productionBatchId: production3.id,
            quantityTonnes: 5.8,
          },
          {
            productionBatchId: production4.id,
            quantityTonnes: 3.8,
          },
        ],
      },
    },
  });

  console.log('Creating BCUs...');

  // Create BCUs
  const bcu1 = await prisma.bCU.create({
    data: {
      quantityTonnesCO2e: 11.5, // 4.6 tonnes * 2.5 factor
      issuanceDate: new Date('2024-02-05'),
      status: 'retired',
      registrySerialNumber: 'BCU-2024-001-A7F3K',
      ownerName: 'Carbon Credit Corp',
      accountId: 'CC-12345',
      retirementDate: new Date('2024-02-20'),
      retirementBeneficiary: 'GreenTech Industries',
      notes: 'First BCU issued from project\n[Retirement] Retired for 2023 emissions offset',
      sequestrationEvents: {
        create: [{ sequestrationId: sequestration1.id }],
      },
    },
  });

  const bcu2 = await prisma.bCU.create({
    data: {
      quantityTonnesCO2e: 8.0, // 3.2 tonnes * 2.5 factor
      issuanceDate: new Date('2024-02-20'),
      status: 'transferred',
      registrySerialNumber: 'BCU-2024-002-B8G4L',
      ownerName: 'EcoInvest Partners',
      accountId: 'EI-67890',
      notes: 'Construction application BCU\n[Transfer] Transferred from initial owner',
      sequestrationEvents: {
        create: [{ sequestrationId: sequestration2.id }],
      },
    },
  });

  const bcu3 = await prisma.bCU.create({
    data: {
      quantityTonnesCO2e: 24.0, // 9.6 tonnes * 2.5 factor
      issuanceDate: new Date('2024-03-05'),
      status: 'issued',
      registrySerialNumber: 'BCU-2024-003-C9H5M',
      ownerName: 'Biochar Solutions Ltd',
      notes: 'Large compost blend sequestration',
      sequestrationEvents: {
        create: [{ sequestrationId: sequestration3.id }],
      },
    },
  });

  console.log('Creating evidence files...');

  // Create some sample evidence files
  await prisma.evidenceFile.createMany({
    data: [
      {
        fileName: 'feedstock_sustainability_cert_jan24.pdf',
        fileType: 'pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/feedstock/cert_jan24.pdf',
        category: 'sustainability',
        description: 'Sustainability certificate for January feedstock',
        feedstockDeliveryId: feedstock1.id,
      },
      {
        fileName: 'delivery_note_20240115.pdf',
        fileType: 'pdf',
        fileSize: 128000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/feedstock/delivery_20240115.pdf',
        category: 'delivery',
        feedstockDeliveryId: feedstock1.id,
      },
      {
        fileName: 'weight_in_receipt_batch1.jpg',
        fileType: 'image',
        fileSize: 856000,
        mimeType: 'image/jpeg',
        storagePath: '/evidence/production/weight_in_batch1.jpg',
        category: 'weight_in',
        productionBatchId: production1.id,
      },
      {
        fileName: 'biochar_output_batch1.jpg',
        fileType: 'image',
        fileSize: 742000,
        mimeType: 'image/jpeg',
        storagePath: '/evidence/production/output_batch1.jpg',
        category: 'biochar_out',
        productionBatchId: production1.id,
      },
      {
        fileName: 'temperature_log_batch1.csv',
        fileType: 'csv',
        fileSize: 45000,
        mimeType: 'text/csv',
        storagePath: '/evidence/production/temp_log_batch1.csv',
        category: 'temperature_log',
        productionBatchId: production1.id,
      },
      {
        fileName: 'storage_photo_warehouse_a.jpg',
        fileType: 'image',
        fileSize: 1200000,
        mimeType: 'image/jpeg',
        storagePath: '/evidence/sequestration/storage_warehouse_a.jpg',
        category: 'storage',
        sequestrationEventId: sequestration1.id,
      },
      {
        fileName: 'delivery_confirmation_seq1.pdf',
        fileType: 'pdf',
        fileSize: 156000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/sequestration/delivery_seq1.pdf',
        category: 'delivery',
        sequestrationEventId: sequestration1.id,
      },
      {
        fileName: 'bcu_certificate_001.pdf',
        fileType: 'pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        storagePath: '/evidence/bcu/cert_001.pdf',
        category: 'general',
        description: 'Official BCU certificate',
        bcuId: bcu1.id,
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log({
    feedstocks: 15,
    productionBatches: 15,
    energyUsages: 6,
    transportEvents: 4,
    sequestrationEvents: 3,
    bcus: 3,
    evidenceFiles: 8,
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

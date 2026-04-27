import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Create vehicles
  const vwGolf = await db.vehicle.create({
    data: {
      name: 'VW Golf GTI',
      vin: 'WVWZZZ1KZPW000001',
      brand: 'VW',
      model: 'Golf GTI Mk8',
      year: 2023,
      engine: '2.0 TSI EA888',
      transmission: 'DSG7',
      status: 'healthy',
      health: 94,
      lastConnected: new Date(Date.now() - 2 * 60 * 1000),
    },
  })

  const audiA4 = await db.vehicle.create({
    data: {
      name: 'Audi A4 B9',
      vin: 'WAUZZZ8K5KA000002',
      brand: 'Audi',
      model: 'A4 B9',
      year: 2022,
      engine: '2.0 TFSI',
      transmission: 'S Tronic',
      status: 'warning',
      health: 78,
      lastConnected: new Date(Date.now() - 15 * 60 * 1000),
    },
  })

  const bmw330e = await db.vehicle.create({
    data: {
      name: 'BMW 330e',
      vin: 'WBA5R1C50KA000003',
      brand: 'BMW',
      model: '330e G20',
      year: 2024,
      engine: '2.0 PHEV B48',
      transmission: 'ZF 8-Speed',
      status: 'healthy',
      health: 91,
      lastConnected: new Date(Date.now() - 60 * 60 * 1000),
    },
  })

  const mercedesC = await db.vehicle.create({
    data: {
      name: 'Mercedes C-Class',
      vin: 'WDD2050351F000004',
      brand: 'Mercedes',
      model: 'C300 W206',
      year: 2023,
      engine: '2.0 M264',
      transmission: '9G-Tronic',
      status: 'critical',
      health: 45,
      lastConnected: new Date(Date.now() - 5 * 60 * 1000),
    },
  })

  const skodaOct = await db.vehicle.create({
    data: {
      name: 'Skoda Octavia',
      vin: 'TMBAG7NE5L0000005',
      brand: 'Skoda',
      model: 'Octavia RS',
      year: 2022,
      engine: '2.0 TSI',
      transmission: 'DSG7',
      status: 'offline',
      health: 82,
      lastConnected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  const porsche = await db.vehicle.create({
    data: {
      name: 'Porsche Cayenne',
      vin: 'WP1AB2A2XPLA000006',
      brand: 'Porsche',
      model: 'Cayenne E-Hybrid',
      year: 2024,
      engine: '3.0 V6 PHEV',
      transmission: 'Tiptronic S',
      status: 'healthy',
      health: 96,
      lastConnected: new Date(Date.now() - 30 * 60 * 1000),
    },
  })

  const seatLeon = await db.vehicle.create({
    data: {
      name: 'Seat Leon',
      vin: 'VSSZZZ5FZLR000007',
      brand: 'Seat',
      model: 'Leon FR',
      year: 2023,
      engine: '2.0 TDI',
      transmission: 'DSG7',
      status: 'warning',
      health: 72,
      lastConnected: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  })

  const cupra = await db.vehicle.create({
    data: {
      name: 'Cupra Formentor',
      vin: 'VSSZZZ5FZLR000008',
      brand: 'Cupra',
      model: 'Formentor VZx',
      year: 2024,
      engine: '2.0 TSI 310PS',
      transmission: 'DSG7',
      status: 'healthy',
      health: 89,
      lastConnected: new Date(Date.now() - 60 * 60 * 1000),
    },
  })

  console.log(`✅ Created ${8} vehicles`)

  // Create DTC codes for vehicles with issues
  await db.dtcCode.createMany({
    data: [
      {
        vehicleId: vwGolf.id,
        code: 'P0300',
        description: 'Random/Multiple Cylinder Misfire Detected',
        severity: 'critical',
        status: 'active',
        module: 'ECM',
        freezeFrame: JSON.stringify({ rpm: 2400, speed: 72, coolant: 84, fuelTrim: 8.2, engineLoad: 45 }),
      },
      {
        vehicleId: vwGolf.id,
        code: 'P0171',
        description: 'System Too Lean (Bank 1)',
        severity: 'warning',
        status: 'active',
        module: 'ECM',
      },
      {
        vehicleId: audiA4.id,
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
        severity: 'warning',
        status: 'pending',
        module: 'ECM',
      },
      {
        vehicleId: mercedesC.id,
        code: 'P0300',
        description: 'Random/Multiple Cylinder Misfire Detected',
        severity: 'critical',
        status: 'active',
        module: 'ECM',
      },
      {
        vehicleId: mercedesC.id,
        code: 'C0035',
        description: 'Left Front Wheel Speed Sensor Circuit',
        severity: 'warning',
        status: 'pending',
        module: 'ABS',
      },
      {
        vehicleId: mercedesC.id,
        code: 'B1000',
        description: 'ECU Internal Circuit Failure',
        severity: 'info',
        status: 'stored',
        module: 'BCM',
      },
      {
        vehicleId: seatLeon.id,
        code: 'P0401',
        description: 'Exhaust Gas Recirculation Flow Insufficient',
        severity: 'warning',
        status: 'active',
        module: 'ECM',
      },
    ],
  })

  console.log('✅ Created DTC codes')

  // Create service records
  await db.serviceRecord.createMany({
    data: [
      { vehicleId: vwGolf.id, serviceType: 'oil_change', date: new Date('2025-01-15'), mileage: 34000, cost: 120, status: 'completed', mechanic: 'Auto Haus Müller' },
      { vehicleId: vwGolf.id, serviceType: 'brake_service', date: new Date('2025-02-20'), mileage: 35200, cost: 450, status: 'completed', mechanic: 'Auto Haus Müller' },
      { vehicleId: audiA4.id, serviceType: 'inspection', date: new Date('2025-01-08'), mileage: 52000, cost: 280, status: 'completed', mechanic: 'Audi Zentrum Berlin' },
      { vehicleId: audiA4.id, serviceType: 'tire_service', date: new Date('2025-03-15'), mileage: 54000, cost: 380, status: 'completed', mechanic: 'Audi Zentrum Berlin' },
      { vehicleId: bmw330e.id, serviceType: 'oil_change', date: new Date('2025-02-10'), mileage: 28000, cost: 135, status: 'completed', mechanic: 'BMW Partner Schmidt' },
      { vehicleId: mercedesC.id, serviceType: 'transmission', date: new Date('2025-01-25'), mileage: 61000, cost: 650, status: 'completed', mechanic: 'Mercedes Niederlassung' },
      { vehicleId: mercedesC.id, serviceType: 'battery', date: new Date('2025-03-01'), mileage: 62500, cost: 180, status: 'completed', mechanic: 'Mercedes Niederlassung' },
      { vehicleId: skodaOct.id, serviceType: 'oil_change', date: new Date('2025-03-10'), mileage: 41000, cost: 110, status: 'completed', mechanic: 'Škoda Service Point' },
    ],
  })

  console.log('✅ Created service records')

  // Create device connections
  await db.deviceConnection.createMany({
    data: [
      { deviceName: 'VAS 6154', deviceType: 'vas6154', connectionType: 'wifi', protocol: 'DoIP', status: 'available', signalStrength: 95, lastConnected: new Date() },
      { deviceName: 'Bosch KTS 560', deviceType: 'bosch_kts', connectionType: 'usb', protocol: 'SAE J2534', status: 'available', signalStrength: 90, lastConnected: new Date() },
      { deviceName: 'ELM327 WiFi', deviceType: 'elm327', connectionType: 'wifi', protocol: 'OBD-II', status: 'available', signalStrength: 60, lastConnected: new Date() },
      { deviceName: 'Daimler Xentry Kit', deviceType: 'daimler_xentry', connectionType: 'wifi', protocol: 'CAN/DoIP', status: 'unavailable', signalStrength: 85 },
    ],
  })

  console.log('✅ Created device connections')

  // Create AI predictions
  await db.aIPrediction.createMany({
    data: [
      { vehicleId: vwGolf.id, component: 'Catalytic Converter', prediction: 'Efficiency degradation detected', severity: 'warning', probability: 72, confidence: 89, symptoms: JSON.stringify(['Sulfur smell', 'Reduced power', 'P0420 code']), recommendation: 'Schedule catalytic converter inspection', estimatedCost: '€800-1,200', timeHorizon: '2-4 weeks' },
      { vehicleId: mercedesC.id, component: 'Transmission Clutch', prediction: 'Clutch slippage developing', severity: 'critical', probability: 85, confidence: 94, symptoms: JSON.stringify(['RPM surge on acceleration', 'Delayed engagement', 'Burning smell']), recommendation: 'Immediate transmission service required', estimatedCost: '€1,500-2,500', timeHorizon: '1-2 weeks' },
      { vehicleId: audiA4.id, component: 'Battery', prediction: 'Battery degradation accelerating', severity: 'monitor', probability: 45, confidence: 76, symptoms: JSON.stringify(['Slow crank in cold weather', 'Voltage drops under load']), recommendation: 'Monitor battery voltage, schedule replacement before winter', estimatedCost: '€200-350', timeHorizon: '3-6 months' },
    ],
  })

  console.log('✅ Created AI predictions')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

// ECU Master Pro 2026 - Comprehensive Dongle Database
// 200+ OEM adapters with drivers, firmware, protocols

export type DongleCategory = 'universal-oem' | 'truck-bus' | 'chiptuning' | 'chinese-oem' | 'industry' | 'luxury-sport' | 'ev-specific' | 'motorcycle-nautical'

export interface FirmwareVersion {
  version: string
  date: string
  status: 'latest' | 'stable' | 'beta' | 'deprecated'
}

export interface DongleModel {
  id: string
  name: string
  brand: string
  category: DongleCategory
  subcategory: string
  connectionTypes: ('USB' | 'WiFi' | 'Bluetooth' | 'Ethernet' | 'LAN')[]
  protocols: string[]
  driverName: string
  driverVersion: string
  firmwareVersions: FirmwareVersion[]
  supportedBrands: string[]
  j2534Compliant: boolean
  doipSupport: boolean
  canFdSupport: boolean
  status: 'supported' | 'stable' | 'beta' | 'deprecated'
  releaseYear: number
  description: string
}

export interface DongleBrand {
  name: string
  category: DongleCategory
  subcategory: string
  icon: string
  description: string
}

export interface DongleCategoryInfo {
  id: DongleCategory
  name: string
  icon: string
  description: string
}

export const DONGLE_CATEGORIES: DongleCategoryInfo[] = [
  { id: 'universal-oem', name: 'Universal & OEM Adapters', icon: '🛠️', description: 'Professional multi-brand diagnostic interfaces' },
  { id: 'luxury-sport', name: 'Luxury & Sport Brands', icon: '🏎️', description: 'Premium OEM VCI for exotic and sports cars' },
  { id: 'truck-bus', name: 'Truck, Bus & Trailer', icon: '🚛', description: 'Heavy-duty commercial vehicle diagnostics' },
  { id: 'ev-specific', name: 'EV Specific Dongles', icon: '⚡', description: 'Electric vehicle specialized interfaces' },
  { id: 'chiptuning', name: 'Chiptuning & ECU Software', icon: '🧠', description: 'ECU tuning, flashing, and immobilizer tools' },
  { id: 'chinese-oem', name: 'Chinese OEM Dongles', icon: '🇨🇳', description: 'OEM interfaces for Chinese vehicle brands' },
  { id: 'industry', name: 'Industry & Agriculture', icon: '🚜', description: 'Heavy machinery and agricultural equipment' },
  { id: 'motorcycle-nautical', name: 'Motorcycle & Nautical', icon: '🏍️', description: 'Motorcycle and marine diagnostics' },
]

export const DONGLE_BRANDS: DongleBrand[] = [
  { name: 'Bosch KTS', category: 'universal-oem', subcategory: 'Bosch KTS', icon: '🔧', description: 'Bosch professional diagnostic series' },
  { name: 'Autel MaxiVCI', category: 'universal-oem', subcategory: 'Autel MaxiVCI', icon: '📡', description: 'Autel professional VCI adapters' },
  { name: 'Launch DBScar', category: 'universal-oem', subcategory: 'Launch DBScar', icon: '🚀', description: 'Launch diagnostic connectors' },
  { name: 'VAG Group', category: 'universal-oem', subcategory: 'VAG Group', icon: '🚗', description: 'Volkswagen Auto Group interfaces' },
  { name: 'Mercedes', category: 'universal-oem', subcategory: 'Mercedes', icon: '⭐', description: 'Mercedes-Benz diagnostic systems' },
  { name: 'BMW', category: 'universal-oem', subcategory: 'BMW', icon: '🔵', description: 'BMW diagnostic interfaces' },
  { name: 'JLR', category: 'universal-oem', subcategory: 'JLR', icon: '🇬🇧', description: 'Jaguar Land Rover diagnostic' },
  { name: 'Ford/Mazda', category: 'universal-oem', subcategory: 'Ford/Mazda', icon: '🇺🇸', description: 'Ford and Mazda VCM interfaces' },
  { name: 'Renault', category: 'universal-oem', subcategory: 'Renault', icon: '🇫🇷', description: 'Renault CAN Clip systems' },
  { name: 'PSA', category: 'universal-oem', subcategory: 'PSA', icon: '🇫🇷', description: 'Peugeot Citroen diagnostic' },
  { name: 'Toyota', category: 'universal-oem', subcategory: 'Toyota', icon: '🇯🇵', description: 'Toyota Denso interfaces' },
  { name: 'Nissan', category: 'universal-oem', subcategory: 'Nissan', icon: '🇯🇵', description: 'Nissan Consult systems' },
  { name: 'Honda', category: 'universal-oem', subcategory: 'Honda', icon: '🇯🇵', description: 'Honda diagnostic interfaces' },
  { name: 'Volvo', category: 'universal-oem', subcategory: 'Volvo', icon: '🇸🇪', description: 'Volvo DiCE/VOCOM systems' },
  { name: 'GM/Opel', category: 'universal-oem', subcategory: 'GM/Opel', icon: '🇺🇸', description: 'GM MDI diagnostic interfaces' },
  { name: 'Fiat/FCA', category: 'universal-oem', subcategory: 'Fiat/FCA', icon: '🇮🇹', description: 'FCA wiTECH systems' },
  { name: 'Tesla', category: 'universal-oem', subcategory: 'Tesla', icon: '⚡', description: 'Tesla diagnostic interfaces' },
  { name: 'Porsche', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🏎️', description: 'Porsche PIWIS diagnostic' },
  { name: 'Ferrari/Maserati', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🏁', description: 'Ferrari Maserati Leonardo/DEIS' },
  { name: 'Lamborghini', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🐂', description: 'Lamborghini LDAS/LaRA' },
  { name: 'Bentley', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🅱️', description: 'Bentley diagnostic interfaces' },
  { name: 'Aston Martin', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🦅', description: 'Aston Martin AMDS' },
  { name: 'McLaren', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🏎️', description: 'McLaren MDS VCI' },
  { name: 'Lotus', category: 'luxury-sport', subcategory: 'Luxury & Sport', icon: '🌿', description: 'Lotus TechCheck' },
  { name: 'Scania', category: 'truck-bus', subcategory: 'Scania', icon: '🚛', description: 'Scania VCI systems' },
  { name: 'MAN', category: 'truck-bus', subcategory: 'MAN', icon: '🚛', description: 'MAN truck diagnostics' },
  { name: 'Volvo/Mack Truck', category: 'truck-bus', subcategory: 'Volvo/Mack Truck', icon: '🚛', description: 'Volvo/Mack truck VCI' },
  { name: 'DAF', category: 'truck-bus', subcategory: 'DAF', icon: '🚛', description: 'DAF truck diagnostics' },
  { name: 'Iveco', category: 'truck-bus', subcategory: 'Iveco', icon: '🚛', description: 'Iveco truck diagnostics' },
  { name: 'Cummins', category: 'truck-bus', subcategory: 'Cummins', icon: '🚛', description: 'Cummins Inline systems' },
  { name: 'Trailers', category: 'truck-bus', subcategory: 'Trailers', icon: '🚛', description: 'Trailer brake diagnostics' },
  { name: 'Universal Truck', category: 'truck-bus', subcategory: 'Universal Truck', icon: '🚛', description: 'Multi-brand truck VCI' },
  { name: 'ECU Flash Tools', category: 'chiptuning', subcategory: 'ECU Flash Tools', icon: '🔥', description: 'Professional ECU flash devices' },
  { name: 'Software Dongles', category: 'chiptuning', subcategory: 'Software Dongles', icon: '🔐', description: 'USB software protection keys' },
  { name: 'Immo/Key', category: 'chiptuning', subcategory: 'Immo/Key', icon: '🔑', description: 'Immobilizer and key programming' },
  { name: 'KM Correction', category: 'chiptuning', subcategory: 'KM Correction', icon: '📊', description: 'Mileage correction tools' },
  { name: 'Chinese EV OEM', category: 'chinese-oem', subcategory: 'Chinese OEM', icon: '🇨🇳', description: 'Chinese EV manufacturer VCI' },
  { name: 'John Deere', category: 'industry', subcategory: 'Industry & Agriculture', icon: '🚜', description: 'John Deere EDL systems' },
  { name: 'CAT', category: 'industry', subcategory: 'Industry & Agriculture', icon: '🚜', description: 'CAT ET diagnostic' },
  { name: 'JCB', category: 'industry', subcategory: 'Industry & Agriculture', icon: '🚜', description: 'JCB DLA systems' },
  { name: 'Other Industry', category: 'industry', subcategory: 'Industry & Agriculture', icon: '🚜', description: 'Various industrial VCI' },
  { name: 'EV Batteries', category: 'ev-specific', subcategory: 'EV Specific', icon: '🔋', description: 'EV battery diagnostic VCI' },
  { name: 'Motorcycle', category: 'motorcycle-nautical', subcategory: 'Motorcycle', icon: '🏍️', description: 'Motorcycle diagnostic VCI' },
  { name: 'Nautical', category: 'motorcycle-nautical', subcategory: 'Nautical', icon: '⚓', description: 'Marine diagnostic interfaces' },
]

function mk(
  id: string, name: string, brand: string, category: DongleCategory, subcategory: string,
  conn: ('USB' | 'WiFi' | 'Bluetooth' | 'Ethernet' | 'LAN')[],
  protocols: string[], driver: string, driverVer: string,
  firmware: FirmwareVersion[], brands: string[],
  j2534: boolean, doip: boolean, canfd: boolean,
  status: 'supported' | 'stable' | 'beta' | 'deprecated', year: number, desc: string
): DongleModel {
  return { id, name, brand, category, subcategory, connectionTypes: conn, protocols, driverName: driver, driverVersion: driverVer, firmwareVersions: firmware, supportedBrands: brands, j2534Compliant: j2534, doipSupport: doip, canFdSupport: canfd, status, releaseYear: year, description: desc }
}

const fw = (v: string, d: string, s: 'latest' | 'stable' | 'beta' | 'deprecated'): FirmwareVersion => ({ version: v, date: d, status: s })
const ALL = ['All OBD-II Vehicles']
const VAG = ['Volkswagen', 'Audi', 'Skoda', 'Seat', 'Porsche']
const MB = ['Mercedes-Benz', 'Smart', 'Maybach']
const BMW_B = ['BMW', 'Mini', 'Rolls-Royce']
const JLR_B = ['Jaguar', 'Land Rover', 'Range Rover']
const FORD = ['Ford', 'Lincoln', 'Mazda']
const REN = ['Renault', 'Dacia']
const PSA_B = ['Peugeot', 'Citroen', 'Opel', 'DS']
const TOY = ['Toyota', 'Lexus']
const NIS = ['Nissan', 'Infiniti']
const HON = ['Honda', 'Acura']
const VOL = ['Volvo', 'Polestar']
const GM = ['Chevrolet', 'GMC', 'Cadillac', 'Buick', 'Opel']
const FCA = ['Fiat', 'Alfa Romeo', 'Jeep', 'Chrysler', 'Dodge', 'Ram']
const TESLA_B = ['Tesla']
const PORSCHE = ['Porsche']
const FERRARI = ['Ferrari', 'Maserati']
const LAMBO = ['Lamborghini']
const BENTLEY = ['Bentley']
const ASTON = ['Aston Martin']
const MCLAREN = ['McLaren']
const LOTUS = ['Lotus']
const TRUCK = ['Scania', 'MAN', 'Volvo Trucks', 'DAF', 'Iveco']
const CUMMINS = ['Cummins', 'International', 'Freightliner']
const TRAILER = ['Wabco', 'Knorr-Bremse', 'Haldex']
const CHINESE = ['BYD', 'Geely', 'MG', 'Chery', 'GWM', 'NIO', 'XPeng', 'Changan', 'BAIC', 'SAIC']
const AGRI = ['John Deere', 'CAT', 'JCB', 'CNH', 'Kubota', 'Deutz', 'Liebherr', 'Perkins', 'Yanmar']
const MOTO = ['BMW Motorrad', 'Yamaha', 'Suzuki', 'Honda Moto']
const MARINE = ['Volvo Penta', 'Mercury Marine']
const EV_B = ['Tesla', 'BMW i', 'Mercedes EQ', 'VW ID']

export const DONGLE_DATABASE: DongleModel[] = [
  // ===== BOSCH KTS =====
  mk('bosch-kts-200', 'KTS 200', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141', 'SAE J1850'], 'Bosch ESI[tronic] VCI', '3.2.1', [fw('2.1.0', '2020-06', 'stable'), fw('2.0.5', '2019-03', 'deprecated')], ALL, false, false, false, 'deprecated', 2012, 'Compact entry-level Bosch diagnostic module'),
  mk('bosch-kts-250', 'KTS 250', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141'], 'Bosch ESI[tronic] VCI', '3.2.1', [fw('2.2.0', '2021-01', 'stable'), fw('2.1.5', '2020-06', 'deprecated')], ALL, false, false, false, 'stable', 2020, 'Portable USB diagnostic module'),
  mk('bosch-kts-340', 'KTS 340', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line'], 'Bosch ESI[tronic] VCI', '3.3.0', [fw('3.0.0', '2021-06', 'stable'), fw('2.9.5', '2021-01', 'deprecated')], ALL, false, false, false, 'stable', 2021, 'Mid-range diagnostic module with enhanced CAN'),
  mk('bosch-kts-350', 'KTS 350', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line'], 'Bosch ESI[tronic] VCI', '3.3.0', [fw('3.0.1', '2021-09', 'stable')], ALL, false, false, false, 'stable', 2021, 'Enhanced mid-range diagnostic module'),
  mk('bosch-kts-520', 'KTS 520', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141', 'SAE J1850'], 'Bosch ESI[tronic] VCI', '3.1.0', [fw('2.5.0', '2019-06', 'deprecated')], ALL, false, false, false, 'deprecated', 2018, 'Legacy USB diagnostic module'),
  mk('bosch-kts-525', 'KTS 525', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141', 'SAE J1850'], 'Bosch ESI[tronic] VCI', '3.1.5', [fw('2.6.0', '2019-12', 'deprecated')], ALL, false, false, false, 'deprecated', 2019, 'Legacy USB diagnostic with enhanced protocols'),
  mk('bosch-kts-530', 'KTS 530', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141', 'SAE J1850'], 'Bosch ESI[tronic] VCI', '3.2.0', [fw('2.7.0', '2020-03', 'stable'), fw('2.6.5', '2019-09', 'deprecated')], ALL, false, false, false, 'deprecated', 2019, 'Professional USB diagnostic module'),
  mk('bosch-kts-540', 'KTS 540', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'ISO 9141', 'SAE J1850'], 'Bosch ESI[tronic] VCI', '3.2.5', [fw('2.8.0', '2020-09', 'stable'), fw('2.7.5', '2020-03', 'deprecated')], ALL, false, false, false, 'stable', 2020, 'Professional USB diagnostic with full protocol support'),
  mk('bosch-kts-550', 'KTS 550', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB', 'WiFi'], ['OBD-II', 'CAN', 'DoIP', 'K-Line'], 'Bosch ESI[tronic] VCI', '4.0.0', [fw('3.2.0', '2022-03', 'stable'), fw('3.1.0', '2021-06', 'deprecated')], ALL, false, true, false, 'stable', 2021, 'WiFi-enabled diagnostic with DoIP support'),
  mk('bosch-kts-560', 'KTS 560', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB', 'WiFi'], ['OBD-II', 'CAN', 'DoIP', 'K-Line'], 'Bosch ESI[tronic] VCI', '4.1.0', [fw('3.3.0', '2023-01', 'stable'), fw('3.2.5', '2022-06', 'deprecated')], ALL, false, true, false, 'stable', 2022, 'Enhanced WiFi diagnostic with DoIP'),
  mk('bosch-kts-570', 'KTS 570', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB', 'WiFi'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'K-Line'], 'Bosch ESI[tronic] VCI', '4.2.0', [fw('3.5.0', '2023-09', 'latest'), fw('3.4.0', '2023-03', 'stable')], ALL, false, true, true, 'supported', 2023, 'Advanced WiFi with CAN FD and DoIP'),
  mk('bosch-kts-590', 'KTS 590', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['USB', 'WiFi'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'K-Line'], 'Bosch ESI[tronic] VCI', '4.2.0', [fw('3.6.0', '2024-01', 'latest'), fw('3.5.0', '2023-06', 'stable')], ALL, false, true, true, 'supported', 2023, 'High-end WiFi diagnostic with CAN FD'),
  mk('bosch-kts-650', 'KTS 650', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['WiFi', 'USB'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch ESI[tronic] VCI', '5.0.0', [fw('4.0.0', '2024-06', 'latest'), fw('3.9.0', '2024-01', 'stable'), fw('4.1.0-beta', '2025-01', 'beta')], ALL, true, true, true, 'supported', 2024, 'Flagship Bosch VCI with J2534, DoIP, CAN FD'),
  mk('bosch-kts-670', 'KTS 670', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['WiFi', 'USB'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch ESI[tronic] VCI', '5.1.0', [fw('4.2.0', '2025-03', 'latest'), fw('4.1.0', '2024-09', 'stable')], ALL, true, true, true, 'supported', 2025, 'Next-gen Bosch VCI with enhanced speed'),
  mk('bosch-kts-800', 'KTS 800', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['WiFi', 'USB', 'LAN'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch ESI[tronic] VCI', '5.0.0', [fw('4.0.0', '2024-06', 'latest'), fw('3.9.0', '2024-01', 'stable')], ALL, true, true, true, 'supported', 2024, 'LAN-enabled flagship diagnostic module'),
  mk('bosch-kts-840', 'KTS 840', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['WiFi', 'USB', 'LAN'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch ESI[tronic] VCI', '5.1.0', [fw('4.3.0', '2025-06', 'latest'), fw('4.2.0', '2025-01', 'stable')], ALL, true, true, true, 'supported', 2025, 'Enhanced LAN diagnostic module'),
  mk('bosch-kts-940', 'KTS 940', 'Bosch KTS', 'universal-oem', 'Bosch KTS', ['WiFi', 'USB', 'LAN'], ['OBD-II', 'CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch ESI[tronic] VCI', '6.0.0', [fw('5.0.0', '2026-01', 'latest'), fw('4.9.0', '2025-09', 'stable')], ALL, true, true, true, 'supported', 2026, 'Ultimate Bosch VCI 2026 edition'),

  // ===== AUTEL MAXIVCI =====
  mk('autel-v100', 'MaxiVCI V100', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['Bluetooth', 'USB'], ['OBD-II', 'CAN', 'ISO 9141', 'J2534'], 'Autel VCI Driver Suite', '2.0.0', [fw('1.8.0', '2022-06', 'stable'), fw('1.7.5', '2021-12', 'deprecated')], ALL, true, false, false, 'stable', 2020, 'Autel Bluetooth VCI with J2534'),
  mk('autel-v200', 'MaxiVCI V200', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['Bluetooth', 'USB', 'WiFi'], ['OBD-II', 'CAN', 'J2534', 'DoIP', 'ISO 9141'], 'Autel VCI Driver Suite', '3.0.0', [fw('2.5.0', '2023-09', 'latest'), fw('2.4.0', '2023-03', 'stable')], ALL, true, true, false, 'supported', 2022, 'WiFi-enabled VCI with DoIP'),
  mk('autel-vci-mini', 'VCI Mini', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['Bluetooth'], ['OBD-II', 'CAN'], 'Autel VCI Driver Suite', '2.5.0', [fw('2.0.0', '2023-06', 'latest')], ALL, false, false, false, 'supported', 2023, 'Compact Bluetooth-only diagnostic adapter'),
  mk('autel-maxiflash-elite', 'MaxiFlash Elite', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['USB', 'WiFi'], ['J2534', 'CAN', 'DoIP', 'OBD-II'], 'Autel MaxiFlash Driver', '3.1.0', [fw('2.8.0', '2023-06', 'latest'), fw('2.7.0', '2022-12', 'stable')], ALL, true, true, false, 'supported', 2022, 'J2534 passthru with DoIP'),
  mk('autel-maxiflash-pro', 'MaxiFlash Pro', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['USB', 'WiFi'], ['J2534', 'CAN', 'DoIP', 'OBD-II'], 'Autel MaxiFlash Driver', '3.2.0', [fw('3.0.0', '2024-03', 'latest'), fw('2.9.0', '2023-09', 'stable')], ALL, true, true, false, 'supported', 2023, 'Professional J2534 with enhanced DoIP'),
  mk('autel-j2534-vci', 'J2534 VCI', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['USB'], ['J2534', 'CAN', 'OBD-II'], 'Autel J2534 Driver', '2.8.0', [fw('2.2.0', '2022-03', 'stable'), fw('2.1.5', '2021-09', 'deprecated')], ALL, true, false, false, 'stable', 2021, 'Standalone J2534 passthru device'),
  mk('autel-vcmi', 'VCMI 5-in-1', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['WiFi', 'USB', 'Bluetooth'], ['J2534', 'CAN', 'DoIP', 'CAN FD', 'OBD-II'], 'Autel VCMI Driver', '4.0.0', [fw('3.5.0', '2025-01', 'latest'), fw('3.4.0', '2024-06', 'stable')], ALL, true, true, true, 'supported', 2024, '5-in-1 VCI with CAN FD and DoIP'),
  mk('autel-maxivci200', 'MaxiVCI200', 'Autel MaxiVCI', 'universal-oem', 'Autel MaxiVCI', ['WiFi', 'Bluetooth'], ['CAN', 'DoIP', 'OBD-II', 'J2534'], 'Autel VCI Driver Suite', '4.1.0', [fw('3.6.0', '2025-06', 'latest'), fw('3.5.0', '2025-01', 'stable')], ALL, true, true, false, 'supported', 2025, 'Next-gen wireless VCI'),

  // ===== LAUNCH DBSCAR =====
  mk('launch-dbscar-i', 'DBScar I', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth'], ['OBD-II', 'CAN'], 'Launch VCI Driver', '1.0.0', [fw('1.0.0', '2015-06', 'deprecated')], ALL, false, false, false, 'deprecated', 2015, 'First generation Launch Bluetooth connector'),
  mk('launch-dbscar-ii', 'DBScar II', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth'], ['OBD-II', 'CAN', 'K-Line'], 'Launch VCI Driver', '1.5.0', [fw('1.5.0', '2018-03', 'deprecated')], ALL, false, false, false, 'deprecated', 2017, 'Second generation with K-Line'),
  mk('launch-dbscar-iii', 'DBScar III', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth'], ['OBD-II', 'CAN', 'K-Line'], 'Launch VCI Driver', '2.0.0', [fw('2.0.0', '2020-01', 'stable'), fw('1.9.0', '2019-06', 'deprecated')], ALL, false, false, false, 'stable', 2019, 'Third generation Bluetooth connector'),
  mk('launch-dbscar-iv', 'DBScar IV', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth', 'WiFi'], ['OBD-II', 'CAN', 'K-Line'], 'Launch VCI Driver', '2.5.0', [fw('2.5.0', '2021-06', 'stable')], ALL, false, false, false, 'stable', 2020, 'WiFi-enabled fourth generation'),
  mk('launch-dbscar-v', 'DBScar V', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth', 'WiFi'], ['OBD-II', 'CAN', 'K-Line', 'J2534'], 'Launch VCI Driver', '3.0.0', [fw('3.0.0', '2022-03', 'stable')], ALL, true, false, false, 'stable', 2021, 'J2534 capable fifth generation'),
  mk('launch-dbscar-vi', 'DBScar VI', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth', 'WiFi'], ['OBD-II', 'CAN', 'K-Line', 'J2534'], 'Launch VCI Driver', '3.2.0', [fw('3.2.0', '2023-03', 'stable')], ALL, true, false, false, 'stable', 2022, 'Enhanced J2534 connector'),
  mk('launch-dbscar-vii', 'DBScar VII', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth', 'WiFi'], ['OBD-II', 'CAN', 'K-Line', 'J2534', 'CAN FD'], 'Launch VCI Driver', '3.5.0', [fw('3.5.0', '2024-01', 'latest'), fw('3.4.0', '2023-06', 'stable')], ALL, true, false, true, 'supported', 2023, 'CAN FD capable seventh generation'),
  mk('launch-smartlink-c', 'Smartlink C', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['WiFi', 'USB'], ['J2534', 'CAN', 'DoIP', 'OBD-II'], 'Launch Smartlink Driver', '4.0.0', [fw('4.0.0', '2024-06', 'latest'), fw('3.9.0', '2024-01', 'stable')], ALL, true, true, false, 'supported', 2024, 'Professional Smartlink with DoIP'),
  mk('launch-giii-xprog3', 'GIII X-Prog 3', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['USB'], ['J2534', 'CAN', 'K-Line', 'OBD-II'], 'Launch X-Prog Driver', '4.0.0', [fw('4.0.0', '2024-09', 'latest')], ALL, true, false, false, 'supported', 2024, 'Key programming J2534 device'),
  mk('launch-thinkdiag', 'ThinkDiag', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth'], ['OBD-II', 'CAN'], 'Launch ThinkDiag Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], ALL, false, false, false, 'stable', 2020, 'Consumer-grade Bluetooth OBD adapter'),
  mk('launch-thinkdiag2', 'ThinkDiag 2', 'Launch DBScar', 'universal-oem', 'Launch DBScar', ['Bluetooth', 'WiFi'], ['OBD-II', 'CAN', 'K-Line'], 'Launch ThinkDiag Driver', '2.5.0', [fw('2.5.0', '2023-09', 'latest'), fw('2.4.0', '2023-03', 'stable')], ALL, false, false, false, 'supported', 2023, 'Enhanced consumer adapter with WiFi'),

  // ===== VAG GROUP =====
  mk('vas-5054', 'VAS 5054', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['K-Line', 'CAN'], 'VAS VCI Driver', '1.0.0', [fw('1.0.0', '2005-06', 'deprecated')], VAG, false, false, false, 'deprecated', 2005, 'Legacy VAG USB diagnostic interface'),
  mk('vas-5054a', 'VAS 5054A', 'VAG Group', 'universal-oem', 'VAG Group', ['USB', 'Bluetooth'], ['K-Line', 'CAN', 'UDS'], 'VAS VCI Driver', '2.0.0', [fw('2.5.0', '2018-06', 'stable'), fw('2.4.0', '2017-12', 'deprecated')], VAG, true, false, false, 'stable', 2010, 'Bluetooth VAG diagnostic with UDS'),
  mk('vas-5055', 'VAS 5055', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['K-Line', 'CAN'], 'VAS VCI Driver', '1.5.0', [fw('1.5.0', '2010-06', 'deprecated')], VAG, false, false, false, 'deprecated', 2008, 'Legacy VAG measurement interface'),
  mk('vas-6154', 'VAS 6154', 'VAG Group', 'universal-oem', 'VAG Group', ['WiFi', 'USB'], ['CAN', 'UDS', 'DoIP'], 'VAS VCI Driver', '3.0.0', [fw('3.5.0', '2022-03', 'stable'), fw('3.4.0', '2021-09', 'deprecated')], VAG, true, true, false, 'stable', 2017, 'WiFi VAG diagnostic with DoIP'),
  mk('vas-6154a', 'VAS 6154A', 'VAG Group', 'universal-oem', 'VAG Group', ['WiFi', 'Bluetooth', 'USB'], ['CAN', 'UDS', 'DoIP'], 'VAS VCI Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest'), fw('3.9.0', '2023-01', 'stable')], VAG, true, true, false, 'supported', 2020, 'Bluetooth/WiFi VAG VCI with DoIP'),
  mk('vas-6154b', 'VAS 6154B', 'VAG Group', 'universal-oem', 'VAG Group', ['WiFi', 'Bluetooth', 'USB'], ['CAN', 'UDS', 'DoIP', 'CAN FD'], 'VAS VCI Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest'), fw('4.9.0', '2024-01', 'stable')], VAG, true, true, true, 'supported', 2023, 'CAN FD capable VAG VCI'),
  mk('vas-6160', 'VAS 6160', 'VAG Group', 'universal-oem', 'VAG Group', ['WiFi', 'LAN', 'USB'], ['CAN', 'UDS', 'DoIP', 'CAN FD'], 'VAS VCI Driver', '5.1.0', [fw('5.2.0', '2025-03', 'latest'), fw('5.1.0', '2024-09', 'stable')], VAG, true, true, true, 'supported', 2024, 'LAN-enabled flagship VAG VCI'),
  mk('vnci-6154a', 'VNCI 6154A', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['CAN', 'UDS'], 'VNCI Driver', '2.0.0', [fw('2.0.0', '2022-06', 'stable')], VAG, true, false, false, 'stable', 2021, 'Cost-effective VAG USB alternative'),
  mk('svci-2020', 'SVCI 2020', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['CAN', 'K-Line'], 'SVCI Driver', '1.0.0', [fw('1.0.0', '2020-06', 'stable')], VAG, false, false, false, 'stable', 2020, 'Budget VAG USB diagnostic'),
  mk('vcds-hex-v2', 'VCDS HEX-V2', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['CAN', 'K-Line', 'UDS'], 'Ross-Tech USB Driver', '22.10.0', [fw('2.5.0', '2023-06', 'latest'), fw('2.4.0', '2022-12', 'stable')], VAG, false, false, false, 'supported', 2018, 'Ross-Tech professional USB interface'),
  mk('vcds-hex-net', 'VCDS HEX-NET', 'VAG Group', 'universal-oem', 'VAG Group', ['WiFi', 'USB'], ['CAN', 'K-Line', 'UDS'], 'Ross-Tech WiFi Driver', '22.10.0', [fw('3.0.0', '2023-09', 'latest'), fw('2.9.0', '2023-03', 'stable')], VAG, false, false, false, 'supported', 2016, 'Ross-Tech WiFi-enabled interface'),
  mk('vcds-micro-can', 'VCDS Micro-CAN', 'VAG Group', 'universal-oem', 'VAG Group', ['USB'], ['CAN'], 'Ross-Tech USB Driver', '20.0.0', [fw('1.5.0', '2018-06', 'stable')], VAG, false, false, false, 'stable', 2015, 'Budget CAN-only Ross-Tech interface'),

  // ===== MERCEDES =====
  mk('mb-sd-c4', 'SD Connect C4', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'LAN'], ['CAN', 'K-Line', 'ISO 9141', 'HFM'], 'Mercedes Xentry VCI Driver', '2.0.0', [fw('2.5.0', '2018-06', 'stable')], MB, false, false, false, 'stable', 2010, 'Mercedes WiFi/LAN diagnostic multiplexer'),
  mk('mb-sd-c4-doip', 'SD Connect C4 DoIP', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'LAN'], ['CAN', 'K-Line', 'DoIP', 'HFM'], 'Mercedes Xentry VCI Driver', '3.0.0', [fw('3.0.0', '2020-06', 'stable')], MB, false, true, false, 'stable', 2018, 'DoIP enabled Mercedes C4'),
  mk('mb-sd-c5', 'SD Connect C5', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'LAN'], ['CAN', 'K-Line', 'DoIP'], 'Mercedes Xentry VCI Driver', '3.0.0', [fw('3.2.0', '2020-03', 'stable')], MB, false, true, false, 'stable', 2016, 'Updated C5 multiplexer'),
  mk('mb-sd-c6-bosch', 'SD Connect C6 (Bosch)', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'LAN', 'USB'], ['CAN', 'K-Line', 'DoIP', 'J2534'], 'Mercedes Xentry VCI Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest'), fw('3.9.0', '2023-01', 'stable')], MB, true, true, false, 'supported', 2022, 'Bosch-made C6 with J2534 and DoIP'),
  mk('mb-sd-c6-vxdiag', 'SD Connect C6 (VXDIAG)', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'USB'], ['CAN', 'K-Line', 'DoIP', 'J2534'], 'VXDIAG Driver', '3.5.0', [fw('3.5.0', '2024-03', 'latest')], MB, true, true, false, 'supported', 2023, 'VXDIAG C6 alternative'),
  mk('mb-xentry-vci', 'Xentry VCI', 'Mercedes', 'universal-oem', 'Mercedes', ['WiFi', 'LAN', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Mercedes Xentry VCI Driver', '5.0.0', [fw('5.0.0', '2025-01', 'latest'), fw('4.9.0', '2024-09', 'stable')], MB, true, true, true, 'supported', 2024, 'Next-gen Xentry VCI with CAN FD'),
  mk('mb-vci-doip', 'Benz VCI DoIP', 'Mercedes', 'universal-oem', 'Mercedes', ['LAN'], ['CAN', 'DoIP'], 'Mercedes DoIP Driver', '2.5.0', [fw('2.5.0', '2021-06', 'stable')], MB, false, true, false, 'stable', 2019, 'Dedicated DoIP Ethernet interface'),
  mk('mb-mongoose', 'Mongoose Benz', 'Mercedes', 'universal-oem', 'Mercedes', ['USB'], ['CAN', 'J2534'], 'DrewTech Mongoose Driver', '2.0.0', [fw('2.0.0', '2018-03', 'stable')], MB, true, false, false, 'stable', 2015, 'DrewTech J2534 for Mercedes'),
  mk('mb-star-c3', 'Star C3', 'Mercedes', 'universal-oem', 'Mercedes', ['USB', 'LAN'], ['CAN', 'K-Line'], 'Mercedes Star Driver', '1.0.0', [fw('1.0.0', '2006-06', 'deprecated')], MB, false, false, false, 'deprecated', 2005, 'Legacy Mercedes diagnostic system'),

  // ===== BMW =====
  mk('bmw-icom-a1', 'ICOM A1', 'BMW', 'universal-oem', 'BMW', ['LAN', 'WiFi'], ['CAN', 'K-Line'], 'BMW ISTA VCI Driver', '2.0.0', [fw('2.0.0', '2012-06', 'deprecated')], BMW_B, false, false, false, 'deprecated', 2008, 'First generation BMW ICOM'),
  mk('bmw-icom-a2', 'ICOM A2', 'BMW', 'universal-oem', 'BMW', ['LAN', 'WiFi'], ['CAN', 'K-Line'], 'BMW ISTA VCI Driver', '3.0.0', [fw('3.0.0', '2016-06', 'stable')], BMW_B, false, false, false, 'stable', 2012, 'Second generation BMW ICOM'),
  mk('bmw-icom-a3', 'ICOM A3', 'BMW', 'universal-oem', 'BMW', ['LAN', 'WiFi'], ['CAN', 'K-Line'], 'BMW ISTA VCI Driver', '3.5.0', [fw('3.5.0', '2018-06', 'stable')], BMW_B, false, false, false, 'stable', 2016, 'Third generation BMW ICOM'),
  mk('bmw-icom-next', 'ICOM Next', 'BMW', 'universal-oem', 'BMW', ['LAN', 'WiFi'], ['CAN', 'DoIP', 'K-Line', 'J2534'], 'BMW ISTA VCI Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest'), fw('4.9.0', '2023-01', 'stable')], BMW_B, true, true, false, 'supported', 2019, 'DoIP capable next-gen BMW ICOM'),
  mk('bmw-icom-b', 'ICOM B', 'BMW', 'universal-oem', 'BMW', ['LAN'], ['MOST'], 'BMW ISTA VCI Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], BMW_B, false, false, false, 'stable', 2010, 'MOST fiber optic interface'),
  mk('bmw-icom-c', 'ICOM C', 'BMW', 'universal-oem', 'BMW', ['USB'], ['K-Line'], 'BMW ISTA VCI Driver', '1.5.0', [fw('1.5.0', '2014-06', 'stable')], BMW_B, false, false, false, 'stable', 2010, 'K-Line only interface'),
  mk('bmw-icom-d', 'ICOM D', 'BMW', 'universal-oem', 'BMW', ['USB'], ['BMW-FAST'], 'BMW ISTA VCI Driver', '1.5.0', [fw('1.5.0', '2016-06', 'stable')], BMW_B, false, false, false, 'stable', 2012, 'BMW-FAST protocol interface'),
  mk('bmw-enet', 'ENET Cable', 'BMW', 'universal-oem', 'BMW', ['Ethernet'], ['CAN', 'DoIP'], 'BMW ENET Driver', '1.0.0', [fw('1.0.0', '2018-06', 'stable')], BMW_B, false, true, false, 'stable', 2014, 'Ethernet to OBD cable for BMW'),
  mk('bmw-scanner-14', 'BMW Scanner 1.4', 'BMW', 'universal-oem', 'BMW', ['USB'], ['K-Line', 'CAN'], 'PASMsoft Driver', '1.4.0', [fw('1.4.0', '2010-06', 'deprecated')], BMW_B, false, false, false, 'deprecated', 2008, 'Budget BMW USB scanner'),
  mk('bmw-kdcan', 'K+D-CAN', 'BMW', 'universal-oem', 'BMW', ['USB'], ['K-Line', 'CAN'], 'K+D-CAN Driver', '1.0.0', [fw('1.0.0', '2008-06', 'deprecated')], BMW_B, false, false, false, 'deprecated', 2006, 'Legacy K-Line/D-CAN USB adapter'),

  // ===== JLR =====
  mk('jlr-da-vina', 'Da-Vina', 'JLR', 'universal-oem', 'JLR', ['USB'], ['CAN', 'K-Line', 'J2534'], 'JLR SDD VCI Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], JLR_B, true, false, false, 'stable', 2010, 'JLR USB J2534 interface'),
  mk('jlr-da-dongle', 'Da-Dongle', 'JLR', 'universal-oem', 'JLR', ['USB'], ['CAN', 'K-Line'], 'JLR SDD Driver', '1.0.0', [fw('1.0.0', '2012-06', 'deprecated')], JLR_B, false, false, false, 'deprecated', 2008, 'Legacy JLR USB interface'),
  mk('jlr-vci', 'JLR VCI', 'JLR', 'universal-oem', 'JLR', ['USB', 'WiFi'], ['CAN', 'K-Line', 'J2534'], 'JLR SDD VCI Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], JLR_B, true, false, false, 'stable', 2016, 'WiFi JLR diagnostic VCI'),
  mk('jlr-doip-vci', 'DoIP VCI', 'JLR', 'universal-oem', 'JLR', ['WiFi', 'LAN'], ['CAN', 'DoIP', 'K-Line', 'J2534'], 'JLR Pathfinder Driver', '4.0.0', [fw('4.0.0', '2022-06', 'latest')], JLR_B, true, true, false, 'supported', 2020, 'DoIP capable JLR Pathfinder VCI'),
  mk('jlr-bosch-vci', 'Bosch VCI JLR', 'JLR', 'universal-oem', 'JLR', ['WiFi', 'USB'], ['CAN', 'J2534', 'DoIP'], 'Bosch JLR Driver', '4.5.0', [fw('4.5.0', '2023-09', 'latest')], JLR_B, true, true, false, 'supported', 2022, 'Bosch-made JLR VCI'),
  mk('jlr-mongoose-pro', 'Mongoose Pro JLR', 'JLR', 'universal-oem', 'JLR', ['USB'], ['CAN', 'J2534'], 'DrewTech Mongoose Driver', '2.5.0', [fw('2.5.0', '2018-06', 'stable')], JLR_B, true, false, false, 'stable', 2014, 'DrewTech J2534 for JLR'),
  mk('jlr-vci-pathfinder', 'VCI Pathfinder', 'JLR', 'universal-oem', 'JLR', ['WiFi', 'LAN'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'JLR Pathfinder Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest'), fw('4.9.0', '2024-01', 'stable')], JLR_B, true, true, true, 'supported', 2023, 'CAN FD Pathfinder VCI'),

  // ===== FORD/MAZDA =====
  mk('ford-vcm-i', 'VCM I', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['USB'], ['CAN', 'MS-CAN', 'HS-CAN', 'J1850 PWM', 'J2534'], 'Ford IDS VCI Driver', '1.0.0', [fw('1.0.0', '2008-06', 'deprecated')], FORD, true, false, false, 'deprecated', 2005, 'Legacy Ford VCM'),
  mk('ford-vcm-ii', 'VCM II', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['WiFi', 'USB'], ['CAN', 'MS-CAN', 'J1850', 'J2534'], 'Ford IDS VCI Driver', '3.0.0', [fw('3.0.0', '2016-06', 'stable')], FORD, true, false, false, 'stable', 2012, 'WiFi Ford diagnostic VCM'),
  mk('ford-vcm-3', 'VCM 3', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['WiFi', 'USB', 'Bluetooth'], ['CAN', 'DoIP', 'J2534', 'CAN FD'], 'Ford IDS VCI Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest'), fw('4.9.0', '2023-01', 'stable')], FORD, true, true, true, 'supported', 2021, 'Next-gen VCM with DoIP and CAN FD'),
  mk('ford-vcmm', 'VCMM', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['USB'], ['CAN', 'J2534'], 'Ford VCMM Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], FORD, true, false, false, 'stable', 2018, 'Vehicle Communication Module Mini'),
  mk('ford-vxdiag', 'VXDIAG Ford', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['WiFi', 'USB'], ['CAN', 'J2534'], 'VXDIAG Ford Driver', '3.0.0', [fw('3.0.0', '2022-06', 'stable')], FORD, true, false, false, 'stable', 2020, 'VXDIAG alternative Ford VCI'),
  mk('ford-mongoose', 'Mongoose Ford', 'Ford/Mazda', 'universal-oem', 'Ford/Mazda', ['USB'], ['CAN', 'J2534'], 'DrewTech Mongoose Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], FORD, true, false, false, 'stable', 2014, 'DrewTech J2534 for Ford'),

  // ===== RENAULT =====
  mk('renault-clip-v1', 'CAN Clip V1', 'Renault', 'universal-oem', 'Renault', ['USB'], ['CAN', 'K-Line', 'ISO 9141'], 'Renault CLIP VCI Driver', '1.0.0', [fw('1.0.0', '2010-06', 'deprecated')], REN, false, false, false, 'deprecated', 2008, 'First gen Renault CAN Clip'),
  mk('renault-clip-v2', 'CAN Clip V2', 'Renault', 'universal-oem', 'Renault', ['USB'], ['CAN', 'K-Line', 'ISO 9141'], 'Renault CLIP VCI Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], REN, false, false, false, 'stable', 2015, 'Updated Renault CAN Clip'),
  mk('renault-alliance-vi', 'Alliance VI', 'Renault', 'universal-oem', 'Renault', ['USB', 'WiFi'], ['CAN', 'K-Line', 'J2534'], 'Renault Alliance Driver', '3.0.0', [fw('3.0.0', '2021-06', 'latest')], REN, true, false, false, 'supported', 2019, 'J2534 capable Renault VCI'),
  mk('renault-bosch-vci', 'Bosch VCI Renault', 'Renault', 'universal-oem', 'Renault', ['WiFi', 'USB'], ['CAN', 'K-Line', 'J2534', 'DoIP'], 'Bosch Renault Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest')], REN, true, true, false, 'supported', 2022, 'Bosch-made Renault VCI with DoIP'),
  mk('renault-passthru', 'Renault Passthru', 'Renault', 'universal-oem', 'Renault', ['USB'], ['J2534', 'CAN'], 'Renault Passthru Driver', '2.5.0', [fw('2.5.0', '2022-06', 'stable')], REN, true, false, false, 'stable', 2020, 'J2534 passthru for Renault'),

  // ===== PSA =====
  mk('psa-lexia3', 'Lexia 3', 'PSA', 'universal-oem', 'PSA', ['USB'], ['CAN', 'K-Line', 'VAN', 'ISO 9141'], 'PSA Diagbox VCI Driver', '1.0.0', [fw('1.0.0', '2010-06', 'deprecated')], PSA_B, false, false, false, 'deprecated', 2008, 'Legacy PSA diagnostic interface'),
  mk('psa-xs-evolution', 'XS Evolution', 'PSA', 'universal-oem', 'PSA', ['USB'], ['CAN', 'K-Line', 'VAN', 'ISO 9141'], 'PSA Diagbox VCI Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], PSA_B, false, false, false, 'stable', 2012, 'Updated PSA diagnostic interface'),
  mk('psa-actia', 'Actia Multidiag', 'PSA', 'universal-oem', 'PSA', ['USB', 'WiFi'], ['CAN', 'J2534'], 'Actia Multidiag Driver', '3.0.0', [fw('3.0.0', '2020-06', 'stable')], PSA_B, true, false, false, 'stable', 2018, 'Actia J2534 for PSA vehicles'),
  mk('psa-bosch-vci', 'PSA VCI (Bosch)', 'PSA', 'universal-oem', 'PSA', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Bosch PSA Driver', '4.0.0', [fw('4.0.0', '2024-03', 'latest')], PSA_B, true, true, false, 'supported', 2023, 'Bosch-made PSA VCI with DoIP'),

  // ===== TOYOTA =====
  mk('toyota-denso-dsti', 'Denso DST-i', 'Toyota', 'universal-oem', 'Toyota', ['USB', 'WiFi'], ['CAN', 'K-Line', 'ISO 9141', 'J2534'], 'Toyota Techstream VCI Driver', '3.0.0', [fw('3.0.0', '2016-06', 'stable')], TOY, true, false, false, 'stable', 2010, 'Denso professional Toyota VCI'),
  mk('toyota-otc-vci', 'OTC VCI', 'Toyota', 'universal-oem', 'Toyota', ['USB'], ['CAN', 'K-Line', 'J2534'], 'OTC VCI Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], TOY, true, false, false, 'stable', 2015, 'OTC diagnostic for Toyota'),
  mk('toyota-mini-vci', 'Mini VCI', 'Toyota', 'universal-oem', 'Toyota', ['USB'], ['CAN', 'K-Line'], 'Mini VCI Driver', '1.0.0', [fw('1.0.0', '2014-06', 'stable')], TOY, false, false, false, 'stable', 2012, 'Budget Toyota USB interface'),
  mk('toyota-mongoose', 'Mongoose Plus Toyota', 'Toyota', 'universal-oem', 'Toyota', ['USB', 'Bluetooth'], ['CAN', 'J2534'], 'DrewTech Mongoose Driver', '2.5.0', [fw('2.5.0', '2018-06', 'stable')], TOY, true, false, false, 'stable', 2016, 'DrewTech J2534 for Toyota'),

  // ===== NISSAN =====
  mk('nissan-consult-ii', 'Consult II', 'Nissan', 'universal-oem', 'Nissan', ['USB'], ['CAN', 'K-Line'], 'Nissan Consult Driver', '1.0.0', [fw('1.0.0', '2008-06', 'deprecated')], NIS, false, false, false, 'deprecated', 2005, 'Legacy Nissan diagnostic'),
  mk('nissan-consult-iii', 'Consult III', 'Nissan', 'universal-oem', 'Nissan', ['USB'], ['CAN', 'K-Line', 'ISO 9141', 'J2534'], 'Nissan Consult Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], NIS, true, false, false, 'stable', 2010, 'J2534 capable Nissan Consult'),
  mk('nissan-consult-iii-plus', 'Consult III Plus', 'Nissan', 'universal-oem', 'Nissan', ['USB', 'WiFi'], ['CAN', 'J2534'], 'Nissan Consult Plus Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], NIS, true, false, false, 'stable', 2016, 'Enhanced Nissan Consult with WiFi'),
  mk('nissan-consult-vi2', 'Consult VI2', 'Nissan', 'universal-oem', 'Nissan', ['WiFi', 'USB'], ['CAN', 'J2534', 'DoIP'], 'Nissan Consult VI Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest')], NIS, true, true, false, 'supported', 2022, 'DoIP capable Nissan VCI'),
  mk('nissan-consult-vi3', 'Consult VI3 (Bosch)', 'Nissan', 'universal-oem', 'Nissan', ['WiFi', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Bosch Nissan Driver', '5.0.0', [fw('5.0.0', '2025-01', 'latest')], NIS, true, true, true, 'supported', 2024, 'Bosch CAN FD VCI for Nissan'),

  // ===== HONDA =====
  mk('honda-him', 'Honda HIM', 'Honda', 'universal-oem', 'Honda', ['USB'], ['CAN', 'K-Line', 'ISO 9141', 'J2534'], 'Honda HDS VCI Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], HON, true, false, false, 'stable', 2010, 'Honda Diagnostic System VCI'),
  mk('honda-gna600', 'GNA600', 'Honda', 'universal-oem', 'Honda', ['USB'], ['CAN', 'K-Line', 'J2534'], 'Honda GNA600 Driver', '1.5.0', [fw('1.5.0', '2016-06', 'stable')], HON, true, false, false, 'stable', 2012, 'J2534 Honda interface'),
  mk('honda-vci-bosch', 'Honda VCI (Bosch)', 'Honda', 'universal-oem', 'Honda', ['WiFi', 'USB'], ['CAN', 'J2534', 'DoIP'], 'Bosch Honda Driver', '4.0.0', [fw('4.0.0', '2024-03', 'latest')], HON, true, true, false, 'supported', 2023, 'Bosch DoIP VCI for Honda'),

  // ===== VOLVO =====
  mk('volvo-dice', 'DiCE', 'Volvo', 'universal-oem', 'Volvo', ['USB'], ['CAN', 'K-Line', 'J2534'], 'Volvo VIDA VCI Driver', '2.0.0', [fw('2.0.0', '2012-06', 'stable')], VOL, true, false, false, 'stable', 2008, 'Volvo DiCE diagnostic interface'),
  mk('volvo-vocom-i', 'VOCOM I', 'Volvo', 'universal-oem', 'Volvo', ['WiFi', 'Bluetooth'], ['CAN', 'K-Line'], 'TEXA VOCOM Driver', '2.5.0', [fw('2.5.0', '2018-06', 'stable')], VOL, false, false, false, 'stable', 2015, 'WiFi Volvo VCI'),
  mk('volvo-vocom-ii', 'VOCOM II (88890300)', 'Volvo', 'universal-oem', 'Volvo', ['WiFi', 'Bluetooth', 'USB'], ['CAN', 'DoIP', 'J2534'], 'TEXA VOCOM II Driver', '4.0.0', [fw('4.0.0', '2022-06', 'latest'), fw('3.9.0', '2022-01', 'stable')], VOL, true, true, false, 'supported', 2020, 'DoIP capable VOCOM II'),

  // ===== GM/OPEL =====
  mk('gm-tech2', 'Tech2 Flash', 'GM/Opel', 'universal-oem', 'GM/Opel', ['USB'], ['CAN', 'J1850 VPW'], 'GM Tech2 Driver', '1.0.0', [fw('1.0.0', '2006-06', 'deprecated')], GM, false, false, false, 'deprecated', 2003, 'Legacy GM Tech2 diagnostic'),
  mk('gm-mdi', 'MDI', 'GM/Opel', 'universal-oem', 'GM/Opel', ['WiFi', 'USB'], ['CAN', 'J2534'], 'GM GDS2 VCI Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], GM, true, false, false, 'stable', 2010, 'GM Multiple Diagnostic Interface'),
  mk('gm-mdi2', 'MDI 2', 'GM/Opel', 'universal-oem', 'GM/Opel', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534', 'CAN FD'], 'GM GDS2 VCI Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest'), fw('4.9.0', '2023-01', 'stable')], GM, true, true, true, 'supported', 2021, 'DoIP/CAN FD capable MDI 2'),
  mk('gm-vci', 'GM VCI', 'GM/Opel', 'universal-oem', 'GM/Opel', ['WiFi', 'USB'], ['CAN', 'J2534'], 'GM VCI Driver', '3.0.0', [fw('3.0.0', '2021-06', 'stable')], GM, true, false, false, 'stable', 2019, 'GM Vehicle Communication Interface'),

  // ===== FIAT/FCA =====
  mk('fca-micropod-ii', 'MicroPOD II', 'Fiat/FCA', 'universal-oem', 'Fiat/FCA', ['USB', 'WiFi'], ['CAN', 'K-Line', 'J1850', 'J2534'], 'FCA wiTECH VCI Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], FCA, true, false, false, 'stable', 2013, 'FCA MicroPOD II diagnostic'),
  mk('fca-witech', 'wiTECH', 'Fiat/FCA', 'universal-oem', 'Fiat/FCA', ['USB'], ['CAN', 'J2534'], 'FCA wiTECH Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], FCA, true, false, false, 'stable', 2010, 'FCA wiTECH J2534 interface'),
  mk('fca-witech2', 'wiTECH 2.0', 'Fiat/FCA', 'universal-oem', 'Fiat/FCA', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'FCA wiTECH 2.0 Driver', '4.0.0', [fw('4.0.0', '2022-06', 'latest')], FCA, true, true, false, 'supported', 2020, 'DoIP capable FCA wiTECH'),
  mk('fca-starmobile', 'StarMobile', 'Fiat/FCA', 'universal-oem', 'Fiat/FCA', ['USB'], ['CAN', 'J2534'], 'FCA StarMobile Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], FCA, true, false, false, 'stable', 2015, 'FCA StarMobile J2534'),

  // ===== TESLA =====
  mk('tesla-toolbox-eth', 'Tesla Toolbox Ethernet', 'Tesla', 'universal-oem', 'Tesla', ['Ethernet'], ['CAN', 'DoIP', 'UDS'], 'Tesla Toolbox Driver', '3.0.0', [fw('3.0.0', '2022-06', 'latest')], TESLA_B, false, true, false, 'supported', 2018, 'Tesla official Ethernet diagnostic'),
  mk('tesla-loki', 'Tesla LOKI VCI', 'Tesla', 'universal-oem', 'Tesla', ['USB'], ['CAN', 'CAN FD'], 'Tesla LOKI Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], TESLA_B, false, false, true, 'supported', 2021, 'CAN FD capable Tesla VCI'),
  mk('tesla-tcan', 'T-Can Dongle', 'Tesla', 'universal-oem', 'Tesla', ['USB'], ['CAN'], 'T-Can Driver', '1.5.0', [fw('1.5.0', '2022-06', 'stable')], TESLA_B, false, false, false, 'stable', 2020, 'Tesla CAN bus adapter'),
  mk('tesla-pcan', 'PCAN-USB', 'Tesla', 'universal-oem', 'Tesla', ['USB'], ['CAN', 'CAN FD'], 'Peak PCAN Driver', '4.0.0', [fw('4.0.0', '2020-06', 'stable')], TESLA_B, false, false, true, 'stable', 2015, 'Peak PCAN USB CAN adapter'),

  // ===== LUXURY/SPORT =====
  mk('porsche-piwis-i', 'PIWIS Tester I', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['USB'], ['K-Line', 'CAN'], 'Porsche PIWIS Driver', '1.0.0', [fw('1.0.0', '2006-06', 'deprecated')], PORSCHE, false, false, false, 'deprecated', 2005, 'First gen Porsche diagnostic'),
  mk('porsche-piwis-ii', 'PIWIS II VCI (Samtec)', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['USB', 'WiFi'], ['CAN', 'K-Line', 'UDS', 'J2534'], 'Porsche PIWIS II Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], PORSCHE, true, false, false, 'stable', 2013, 'WiFi Porsche diagnostic with UDS'),
  mk('porsche-piwis-iii', 'PIWIS III VCI 3', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'USB'], ['CAN', 'DoIP', 'UDS', 'CAN FD', 'J2534'], 'Porsche PIWIS III Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest'), fw('4.9.0', '2023-01', 'stable')], PORSCHE, true, true, true, 'supported', 2020, 'CAN FD/DoIP Porsche VCI 3'),
  mk('porsche-piwis-iv', 'PIWIS IV', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'USB', 'Bluetooth'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Porsche PIWIS IV Driver', '6.0.0', [fw('6.0.0', '2025-06', 'latest'), fw('5.9.0', '2025-01', 'stable')], PORSCHE, true, true, true, 'supported', 2024, 'Next-gen Porsche VCI 4'),
  mk('porsche-pst2', 'Porsche PST2', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['USB'], ['K-Line', 'CAN'], 'Porsche PST2 Driver', '1.0.0', [fw('1.0.0', '2002-06', 'deprecated')], PORSCHE, false, false, false, 'deprecated', 2000, 'Legacy Porsche System Tester'),
  mk('porsche-obdx-pro', 'OBDX Pro VT', 'Porsche', 'luxury-sport', 'Luxury & Sport', ['USB'], ['CAN', 'K-Line'], 'OBDX Pro Driver', '2.0.0', [fw('2.0.0', '2023-06', 'stable')], PORSCHE, false, false, false, 'stable', 2022, 'OBDX Pro VCI for Porsche'),
  mk('ferrari-leonardo', 'Leonardo Diagnostic', 'Ferrari/Maserati', 'luxury-sport', 'Luxury & Sport', ['USB', 'LAN'], ['CAN', 'K-Line'], 'Ferrari Leonardo Driver', '2.0.0', [fw('2.0.0', '2012-06', 'stable')], FERRARI, false, false, false, 'stable', 2008, 'Ferrari Maserati Leonardo system'),
  mk('ferrari-deis', 'DEIS VCI', 'Ferrari/Maserati', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'LAN'], ['CAN', 'DoIP', 'J2534'], 'Ferrari DEIS Driver', '4.0.0', [fw('4.0.0', '2022-06', 'latest')], FERRARI, true, true, false, 'supported', 2020, 'DoIP Ferrari/Maserati VCI'),
  mk('ferrari-sd2', 'Ferrari SD2', 'Ferrari/Maserati', 'luxury-sport', 'Luxury & Sport', ['USB'], ['CAN', 'K-Line'], 'Ferrari SD2 Driver', '1.0.0', [fw('1.0.0', '2006-06', 'deprecated')], FERRARI, false, false, false, 'deprecated', 2005, 'Legacy Ferrari SD2'),
  mk('ferrari-sd3', 'Ferrari SD3', 'Ferrari/Maserati', 'luxury-sport', 'Luxury & Sport', ['USB', 'WiFi'], ['CAN', 'K-Line', 'UDS', 'J2534'], 'Ferrari SD3 Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], FERRARI, true, false, false, 'stable', 2016, 'J2534 Ferrari SD3'),
  mk('lambo-ldas', 'LDAS VCI', 'Lamborghini', 'luxury-sport', 'Luxury & Sport', ['USB', 'LAN'], ['CAN', 'K-Line'], 'Lamborghini LDAS Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], LAMBO, false, false, false, 'stable', 2010, 'Lamborghini diagnostic system'),
  mk('lambo-lara', 'Lamborghini LaRA', 'Lamborghini', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'LAN', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Lamborghini LaRA Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest')], LAMBO, true, true, true, 'supported', 2023, 'CAN FD/DoIP Lamborghini LaRA'),
  mk('bentley-vas6154', 'Bentley VAS 6154 (Special)', 'Bentley', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'USB'], ['CAN', 'DoIP', 'UDS', 'J2534'], 'Bentley VAS Driver', '5.0.0', [fw('5.0.0', '2022-06', 'latest')], BENTLEY, true, true, false, 'supported', 2020, 'Special firmware VAS 6154 for Bentley'),
  mk('bentley-ibp', 'Bentley IBP Dongle', 'Bentley', 'luxury-sport', 'Luxury & Sport', ['USB'], ['CAN', 'K-Line'], 'Bentley IBP Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], BENTLEY, false, false, false, 'stable', 2015, 'Bentley IBP USB interface'),
  mk('aston-amds', 'AMDS VCI', 'Aston Martin', 'luxury-sport', 'Luxury & Sport', ['USB'], ['CAN', 'K-Line'], 'Aston Martin AMDS Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], ASTON, false, false, false, 'stable', 2012, 'Aston Martin diagnostic system'),
  mk('aston-amds2', 'AMDS 2', 'Aston Martin', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Aston Martin AMDS2 Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest')], ASTON, true, true, false, 'supported', 2022, 'DoIP capable AMDS 2'),
  mk('mclaren-mds', 'McLaren MDS VCI', 'McLaren', 'luxury-sport', 'Luxury & Sport', ['WiFi', 'USB', 'LAN'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'McLaren MDS Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest')], MCLAREN, true, true, true, 'supported', 2023, 'CAN FD McLaren diagnostic'),
  mk('lotus-techcheck', 'Lotus TechCheck', 'Lotus', 'luxury-sport', 'Luxury & Sport', ['USB'], ['CAN', 'K-Line'], 'Lotus TechCheck Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], LOTUS, false, false, false, 'stable', 2018, 'Lotus diagnostic interface'),

  // ===== TRUCK/BUS =====
  mk('scania-vci1', 'Scania VCI 1', 'Scania', 'truck-bus', 'Scania', ['USB'], ['CAN', 'K-Line', 'J1939'], 'Scania SDP3 VCI Driver', '1.0.0', [fw('1.0.0', '2010-06', 'deprecated')], TRUCK, false, false, false, 'deprecated', 2008, 'First gen Scania VCI'),
  mk('scania-vci2', 'Scania VCI 2', 'Scania', 'truck-bus', 'Scania', ['USB', 'WiFi'], ['CAN', 'K-Line', 'J1939'], 'Scania SDP3 VCI Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], TRUCK, false, false, false, 'stable', 2016, 'WiFi Scania diagnostic VCI'),
  mk('scania-vci3', 'Scania VCI 3', 'Scania', 'truck-bus', 'Scania', ['WiFi', 'USB', 'Bluetooth'], ['CAN', 'J1939', 'DoIP', 'CAN FD', 'J2534'], 'Scania SDP3 VCI Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest')], TRUCK, true, true, true, 'supported', 2023, 'CAN FD/DoIP Scania VCI 3'),
  mk('man-t200', 'MAN T200', 'MAN', 'truck-bus', 'MAN', ['USB'], ['CAN', 'K-Line', 'J1939'], 'MAN Cats VCI Driver', '1.0.0', [fw('1.0.0', '2012-06', 'stable')], TRUCK, false, false, false, 'stable', 2010, 'MAN T200 diagnostic'),
  mk('man-cats-iii', 'MAN Cats III', 'MAN', 'truck-bus', 'MAN', ['USB', 'WiFi'], ['CAN', 'J1939'], 'MAN Cats VCI Driver', '3.0.0', [fw('3.0.0', '2020-06', 'stable')], TRUCK, false, false, false, 'stable', 2018, 'MAN Cats III diagnostic'),
  mk('man-dpa5', 'DPA 5 MAN', 'MAN', 'truck-bus', 'MAN', ['USB', 'Bluetooth'], ['J1939', 'CAN', 'J2534'], 'Noregon DPA Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], TRUCK, true, false, false, 'stable', 2015, 'Noregon DPA 5 for MAN'),
  mk('volvo-truck-88890020', '88890020', 'Volvo/Mack Truck', 'truck-bus', 'Volvo/Mack Truck', ['USB'], ['CAN', 'J1939'], 'Volvo Tech Tool Driver', '1.0.0', [fw('1.0.0', '2010-06', 'deprecated')], TRUCK, false, false, false, 'deprecated', 2008, 'Legacy Volvo truck VCI'),
  mk('volvo-truck-vocom-i', 'VOCOM I Truck', 'Volvo/Mack Truck', 'truck-bus', 'Volvo/Mack Truck', ['WiFi', 'Bluetooth'], ['CAN', 'J1939', 'K-Line'], 'TEXA VOCOM Driver', '2.5.0', [fw('2.5.0', '2018-06', 'stable')], TRUCK, false, false, false, 'stable', 2015, 'VOCOM I for Volvo Trucks'),
  mk('volvo-truck-vocom-ii', 'VOCOM II Truck', 'Volvo/Mack Truck', 'truck-bus', 'Volvo/Mack Truck', ['WiFi', 'Bluetooth', 'USB'], ['CAN', 'J1939', 'DoIP', 'J2534'], 'TEXA VOCOM II Driver', '4.0.0', [fw('4.0.0', '2022-06', 'latest')], TRUCK, true, true, false, 'supported', 2020, 'DoIP capable VOCOM II truck'),
  mk('daf-vci560', 'DAF VCI-560', 'DAF', 'truck-bus', 'DAF', ['USB'], ['CAN', 'K-Line', 'J1939'], 'DAF DAVIE VCI Driver', '1.0.0', [fw('1.0.0', '2014-06', 'stable')], TRUCK, false, false, false, 'stable', 2012, 'DAF VCI-560 diagnostic'),
  mk('daf-vci-lite', 'DAF VCI-Lite', 'DAF', 'truck-bus', 'DAF', ['USB', 'WiFi'], ['CAN', 'J1939'], 'DAF DAVIE VCI Driver', '2.0.0', [fw('2.0.0', '2022-06', 'stable')], TRUCK, false, false, false, 'stable', 2020, 'Compact DAF VCI'),
  mk('iveco-eltrac', 'Iveco Eltrac ECI', 'Iveco', 'truck-bus', 'Iveco', ['USB'], ['CAN', 'K-Line', 'J1939'], 'Iveco EASY Driver', '1.0.0', [fw('1.0.0', '2012-06', 'stable')], TRUCK, false, false, false, 'stable', 2010, 'Iveco Eltrac diagnostic'),
  mk('iveco-easy-vci', 'Iveco Easy VCI', 'Iveco', 'truck-bus', 'Iveco', ['WiFi', 'Bluetooth'], ['CAN', 'J1939'], 'Iveco EASY VCI Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], TRUCK, false, false, false, 'stable', 2018, 'WiFi Iveco diagnostic'),
  mk('iveco-davie', 'Iveco DAVIE', 'Iveco', 'truck-bus', 'Iveco', ['USB', 'WiFi'], ['CAN', 'J1939', 'J2534'], 'Iveco DAVIE Driver', '3.0.0', [fw('3.0.0', '2023-06', 'latest')], TRUCK, true, false, false, 'supported', 2022, 'J2534 Iveco DAVIE'),
  mk('cummins-inline5', 'Cummins Inline 5', 'Cummins', 'truck-bus', 'Cummins', ['USB'], ['J1939', 'J1708', 'CAN', 'J2534'], 'Cummins Inline Driver', '2.0.0', [fw('2.0.0', '2014-06', 'stable')], CUMMINS, true, false, false, 'stable', 2010, 'USB Cummins Inline 5'),
  mk('cummins-inline6', 'Cummins Inline 6', 'Cummins', 'truck-bus', 'Cummins', ['USB', 'Bluetooth'], ['J1939', 'J1708', 'CAN', 'J2534'], 'Cummins Inline Driver', '3.0.0', [fw('3.0.0', '2020-06', 'stable')], CUMMINS, true, false, false, 'stable', 2018, 'Bluetooth Cummins Inline 6'),
  mk('cummins-inline7', 'Cummins Inline 7', 'Cummins', 'truck-bus', 'Cummins', ['WiFi', 'USB', 'Bluetooth'], ['J1939', 'CAN', 'J2534', 'CAN FD'], 'Cummins Inline Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest')], CUMMINS, true, false, true, 'supported', 2023, 'CAN FD Cummins Inline 7'),
  mk('trailer-wabco', 'Wabco USB', 'Trailers', 'truck-bus', 'Trailers', ['USB'], ['CAN', 'J1939'], 'Wabco Diagnostic Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], TRAILER, false, false, false, 'stable', 2012, 'Wabco trailer brake diagnostic'),
  mk('trailer-knorr', 'Knorr-Bremse UDIF', 'Trailers', 'truck-bus', 'Trailers', ['USB'], ['CAN', 'J1939'], 'Knorr UDIF Driver', '1.5.0', [fw('1.5.0', '2018-06', 'stable')], TRAILER, false, false, false, 'stable', 2015, 'Knorr-Bremse trailer diagnostic'),
  mk('trailer-haldex', 'Haldex Diagnostic', 'Trailers', 'truck-bus', 'Trailers', ['USB'], ['CAN', 'J1939'], 'Haldex Diagnostic Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], TRAILER, false, false, false, 'stable', 2018, 'Haldex trailer diagnostic'),
  mk('truck-jaltest-v9', 'Jaltest Link V9', 'Universal Truck', 'truck-bus', 'Universal Truck', ['USB', 'Bluetooth', 'WiFi'], ['J1939', 'J1708', 'J2534', 'CAN'], 'Jaltest VCI Driver', '9.0.0', [fw('9.0.0', '2024-06', 'latest')], TRUCK, true, false, false, 'supported', 2023, 'Multi-brand truck VCI'),
  mk('truck-texa', 'Texa Navigator TXT Multihub', 'Universal Truck', 'truck-bus', 'Universal Truck', ['USB', 'Bluetooth', 'WiFi'], ['J1939', 'CAN', 'J2534'], 'TEXA Navigator Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest')], TRUCK, true, false, false, 'supported', 2022, 'TEXA multi-brand truck diagnostic'),
  mk('truck-nexiq-2', 'Nexiq USB Link 2', 'Universal Truck', 'truck-bus', 'Universal Truck', ['USB', 'Bluetooth'], ['J1939', 'J1708', 'CAN', 'J2534'], 'Nexiq Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], TRUCK, true, false, false, 'stable', 2018, 'Nexiq USB Link 2'),
  mk('truck-nexiq-3', 'Nexiq 3', 'Universal Truck', 'truck-bus', 'Universal Truck', ['WiFi', 'USB', 'Bluetooth'], ['J1939', 'CAN', 'J2534', 'DoIP', 'CAN FD'], 'Nexiq 3 Driver', '5.0.0', [fw('5.0.0', '2025-01', 'latest')], TRUCK, true, true, true, 'supported', 2024, 'Next-gen Nexiq with DoIP/CAN FD'),

  // ===== CHIPTUNING =====
  mk('tune-kess-v2', 'Kess V2', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['OBD-II', 'CAN', 'K-Line', 'BDM'], 'Alientech KESS Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], ALL, false, false, false, 'stable', 2015, 'Alientech OBD/BDM ECU programmer'),
  mk('tune-kess-v3', 'Kess V3', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['CAN', 'K-Line', 'BDM', 'JTAG', 'CAN FD'], 'Alientech KESS V3 Driver', '3.0.0', [fw('3.0.0', '2023-06', 'latest')], ALL, false, false, true, 'supported', 2022, 'CAN FD capable KESS V3'),
  mk('tune-ktag', 'K-Tag', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['BDM', 'JTAG', 'K-Line', 'CAN'], 'Alientech K-TAG Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], ALL, false, false, false, 'stable', 2014, 'Alientech bench ECU programmer'),
  mk('tune-flex', 'Flex', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['CAN', 'K-Line', 'BDM', 'JTAG', 'BOOT'], 'Flex Driver', '3.0.0', [fw('3.0.0', '2022-06', 'latest')], ALL, false, false, false, 'supported', 2020, 'Dimension Engineering Flex programmer'),
  mk('tune-autotuner', 'Autotuner', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['CAN', 'K-Line', 'BDM', 'JTAG'], 'Autotuner Driver', '2.5.0', [fw('2.5.0', '2023-06', 'latest')], ALL, false, false, false, 'supported', 2021, 'Autotuner ECU programming device'),
  mk('tune-bflash', 'bFlash', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['CAN', 'K-Line', 'BDM', 'BOOT'], 'bFlash Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], ALL, false, false, false, 'supported', 2022, 'bFlash ECU programmer'),
  mk('tune-new-genius', 'New Genius', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['OBD-II', 'CAN', 'K-Line'], 'Dimsport Genius Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], ALL, false, false, false, 'stable', 2016, 'Dimsport OBD ECU programmer'),
  mk('tune-new-trasdata', 'New Trasdata', 'ECU Flash Tools', 'chiptuning', 'ECU Flash Tools', ['USB'], ['BDM', 'JTAG', 'BOOT'], 'Dimsport Trasdata Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], ALL, false, false, false, 'stable', 2014, 'Dimsport bench programmer'),
  mk('soft-pcmflash', 'PCMFlash USB Guardant', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['J2534', 'CAN', 'K-Line'], 'Guardant Driver', '1.0.0', [fw('1.0.0', '2020-06', 'stable')], ALL, true, false, false, 'stable', 2019, 'PCMFlash modules 1-80 USB key'),
  mk('soft-bitbox', 'BitBox USB Security', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'BitBox Security Driver', '1.0.0', [fw('1.0.0', '2021-06', 'stable')], ALL, false, false, false, 'stable', 2020, 'BitBox/BitEdit USB security key'),
  mk('soft-mmc-flasher', 'MMC Flasher USB', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'MMC Flasher Driver', '1.0.0', [fw('1.0.0', '2019-06', 'stable')], ALL, false, false, false, 'stable', 2018, 'MMC Flasher for Japanese vehicles'),
  mk('soft-scanmatik', 'Scanmatik 2 PRO', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['J2534', 'CAN', 'K-Line'], 'Scanmatik Driver', '2.0.0', [fw('2.0.0', '2022-06', 'latest')], ALL, true, false, false, 'supported', 2021, 'VCI dongle with J2534 support'),
  mk('soft-alexflasher', 'AlexFlasher USB', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'AlexFlasher Driver', '1.0.0', [fw('1.0.0', '2022-06', 'stable')], ALL, false, false, false, 'stable', 2022, 'AlexFlasher USB dongle key'),
  mk('soft-mdflasher', 'MDflasher USB', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'MDflasher Driver', '1.0.0', [fw('1.0.0', '2022-06', 'stable')], ALL, false, false, false, 'stable', 2022, 'MDflasher USB dongle key'),
  mk('soft-chiptuningpro', 'ChipTuningPRO USB', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'ChipTuningPRO Driver', '1.0.0', [fw('1.0.0', '2020-06', 'stable')], ALL, false, false, false, 'stable', 2020, 'ChipTuningPRO USB security dongle'),
  mk('soft-combiloader', 'Combiloader USB', 'Software Dongles', 'chiptuning', 'Software Dongles', ['USB'], ['CAN', 'K-Line'], 'Combiloader Driver', '1.0.0', [fw('1.0.0', '2019-06', 'stable')], ALL, false, false, false, 'stable', 2019, 'Combiloader USB host dongle'),
  mk('immo-abrites', 'Abrites AVDI', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line', 'J2534'], 'Abrites AVDI Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], ALL, true, false, false, 'stable', 2015, 'Abrites vehicle diagnostic interface'),
  mk('immo-vvdi2', 'VVDI2', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line'], 'Xhorse VVDI2 Driver', '2.0.0', [fw('2.0.0', '2019-06', 'stable')], ALL, false, false, false, 'stable', 2017, 'Xhorse VVDI2 key programmer'),
  mk('immo-vvdi-prog', 'VVDI Prog', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line', 'EEPROM'], 'Xhorse VVDI Prog Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], ALL, false, false, false, 'stable', 2019, 'Xhorse EEPROM programmer'),
  mk('immo-vvdi-mb', 'VVDI MB', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line'], 'Xhorse VVDI MB Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], MB, false, false, false, 'stable', 2018, 'Xhorse Mercedes key programmer'),
  mk('immo-vvdi-bmw', 'VVDI BMW', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line', 'DoIP'], 'Xhorse VVDI BMW Driver', '3.0.0', [fw('3.0.0', '2022-06', 'latest')], BMW_B, false, true, false, 'supported', 2020, 'Xhorse BMW key programmer with DoIP'),
  mk('immo-vvdi-key-tool', 'VVDI Key Tool Plus', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB', 'Bluetooth'], ['CAN', 'K-Line', 'IMMO'], 'Xhorse Key Tool Driver', '3.0.0', [fw('3.0.0', '2023-06', 'latest')], ALL, false, false, false, 'supported', 2022, 'Xhorse advanced key tool'),
  mk('immo-cgdi-mb', 'CGDI MB', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line'], 'CGDI MB Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], MB, false, false, false, 'stable', 2019, 'CGDI Mercedes key programmer'),
  mk('immo-cgdi-bmw', 'CGDI BMW', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line'], 'CGDI BMW Driver', '2.0.0', [fw('2.0.0', '2022-06', 'stable')], BMW_B, false, false, false, 'stable', 2020, 'CGDI BMW key programmer'),
  mk('immo-lonsdor-k518', 'Lonsdor K518', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB', 'Bluetooth'], ['CAN', 'K-Line', 'IMMO'], 'Lonsdor K518 Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], ALL, false, false, false, 'stable', 2018, 'Lonsdor key programmer'),
  mk('immo-xhorse-mini', 'Xhorse Mini Prog', 'Immo/Key', 'chiptuning', 'Immo/Key', ['USB'], ['CAN', 'K-Line', 'EEPROM'], 'Xhorse Mini Prog Driver', '1.0.0', [fw('1.0.0', '2022-06', 'stable')], ALL, false, false, false, 'stable', 2021, 'Xhorse Mini EEPROM programmer'),
  mk('km-digiprog3', 'Digiprog 3', 'KM Correction', 'chiptuning', 'KM Correction', ['USB'], ['CAN', 'K-Line', 'EEPROM'], 'Digiprog Driver', '1.0.0', [fw('1.0.0', '2016-06', 'stable')], ALL, false, false, false, 'stable', 2014, 'Digiprog mileage correction'),
  mk('km-digiprog4', 'Digiprog 4', 'KM Correction', 'chiptuning', 'KM Correction', ['USB'], ['CAN', 'K-Line'], 'Digiprog 4 Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], ALL, false, false, false, 'supported', 2022, 'Next-gen Digiprog'),
  mk('km-enigma', 'Enigma Tool', 'KM Correction', 'chiptuning', 'KM Correction', ['USB'], ['CAN', 'K-Line'], 'Enigma Driver', '1.5.0', [fw('1.5.0', '2021-06', 'stable')], ALL, false, false, false, 'stable', 2020, 'Enigma mileage correction tool'),
  mk('km-carprog', 'CarProg', 'KM Correction', 'chiptuning', 'KM Correction', ['USB'], ['CAN', 'K-Line', 'EEPROM'], 'CarProg Driver', '1.0.0', [fw('1.0.0', '2014-06', 'stable')], ALL, false, false, false, 'stable', 2012, 'CarProg universal programmer'),
  mk('km-smok', 'Smok UHDS', 'KM Correction', 'chiptuning', 'KM Correction', ['USB'], ['CAN', 'K-Line', 'EEPROM'], 'Smok Driver', '1.5.0', [fw('1.5.0', '2020-06', 'stable')], ALL, false, false, false, 'stable', 2019, 'Smok UHDS mileage tool'),

  // ===== CHINESE OEM =====
  mk('cn-byd-vci', 'BYD VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi', 'Bluetooth'], ['CAN', 'K-Line', 'J2534'], 'BYD VCI Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], CHINESE, true, false, false, 'supported', 2022, 'BYD official VCI'),
  mk('cn-byd-bt-obd', 'BYD Bluetooth OBD', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['Bluetooth'], ['OBD-II', 'CAN'], 'BYD BT Driver', '1.0.0', [fw('1.0.0', '2024-06', 'latest')], CHINESE, false, false, false, 'supported', 2023, 'BYD Bluetooth OBD adapter'),
  mk('cn-findreams', 'FinDreams VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'FinDreams Driver', '2.0.0', [fw('2.0.0', '2025-01', 'latest')], CHINESE, true, true, false, 'supported', 2024, 'BYD FinDreams DoIP VCI'),
  mk('cn-geely-bosch', 'Geely VCI (Bosch)', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'K-Line', 'J2534'], 'Bosch Geely Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], CHINESE, true, false, false, 'supported', 2022, 'Bosch-made Geely VCI'),
  mk('cn-lynk-co', 'Lynk & Co VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Lynk & Co Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'Lynk & Co DoIP VCI'),
  mk('cn-zeekr', 'ZEEKR VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'ZEEKR VCI Driver', '2.0.0', [fw('2.0.0', '2025-01', 'latest')], CHINESE, true, true, true, 'supported', 2024, 'ZEEKR CAN FD VCI'),
  mk('cn-mg-vds2', 'MG VDS2', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'K-Line'], 'MG VDS Driver', '2.0.0', [fw('2.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2021, 'MG Vehicle Diagnostic System 2'),
  mk('cn-roewe', 'Roewe VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'Roewe VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2022, 'Roewe diagnostic interface'),
  mk('cn-chery', 'Chery VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'Chery VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2021, 'Chery diagnostic interface'),
  mk('cn-exeed', 'Exeed VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Exeed VCI Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'Exeed premium VCI with DoIP'),
  mk('cn-omoda', 'Omoda VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Omoda VCI Driver', '1.0.0', [fw('1.0.0', '2025-01', 'latest')], CHINESE, true, true, false, 'supported', 2024, 'Omoda DoIP diagnostic'),
  mk('cn-haval', 'Haval VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'Haval VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2022, 'Haval diagnostic interface'),
  mk('cn-gwm', 'GWM VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'GWM VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2022, 'Great Wall Motors VCI'),
  mk('cn-wey', 'Wey VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Wey VCI Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'Wey premium DoIP VCI'),
  mk('cn-tank', 'Tank VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Tank VCI Driver', '2.0.0', [fw('2.0.0', '2025-01', 'latest')], CHINESE, true, true, true, 'supported', 2024, 'Tank CAN FD VCI'),
  mk('cn-nio', 'NIO VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'NIO VCI Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'NIO EV diagnostic VCI'),
  mk('cn-xpeng', 'XPeng VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'XPeng VCI Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'XPeng EV diagnostic VCI'),
  mk('cn-li-vci', 'Li-VCI (Ethernet)', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['Ethernet', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Li Auto VCI Driver', '2.0.0', [fw('2.0.0', '2025-01', 'latest')], CHINESE, true, true, true, 'supported', 2024, 'Li Auto Ethernet VCI with CAN FD'),
  mk('cn-changan-ds', 'Changan DS-VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'Changan DS Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'Changan premium DoIP VCI'),
  mk('cn-baic', 'BAIC VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'BAIC VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2022, 'BAIC diagnostic interface'),
  mk('cn-dongfeng', 'Dongfeng VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'Dongfeng VCI Driver', '1.0.0', [fw('1.0.0', '2022-06', 'stable')], CHINESE, false, false, false, 'stable', 2021, 'Dongfeng diagnostic interface'),
  mk('cn-zotye', 'Zotye VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB'], ['CAN', 'K-Line'], 'Zotye VCI Driver', '1.0.0', [fw('1.0.0', '2020-06', 'stable')], CHINESE, false, false, false, 'stable', 2019, 'Zotye diagnostic interface'),
  mk('cn-lifan', 'Lifan VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB'], ['CAN', 'K-Line'], 'Lifan VCI Driver', '1.0.0', [fw('1.0.0', '2019-06', 'stable')], CHINESE, false, false, false, 'stable', 2018, 'Lifan diagnostic interface'),
  mk('cn-saic', 'SAIC VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['WiFi', 'USB'], ['CAN', 'DoIP', 'J2534'], 'SAIC VCI Driver', '2.0.0', [fw('2.0.0', '2024-06', 'latest')], CHINESE, true, true, false, 'supported', 2023, 'SAIC DoIP diagnostic VCI'),
  mk('cn-changan', 'Changan VCI', 'Chinese EV OEM', 'chinese-oem', 'Chinese OEM', ['USB', 'WiFi'], ['CAN', 'K-Line'], 'Changan VCI Driver', '1.0.0', [fw('1.0.0', '2023-06', 'stable')], CHINESE, false, false, false, 'stable', 2022, 'Changan standard VCI'),

  // ===== INDUSTRY =====
  mk('jd-edl-v1', 'John Deere EDL v1', 'John Deere', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'John Deere EDL Driver', '1.0.0', [fw('1.0.0', '2010-06', 'deprecated')], AGRI, false, false, false, 'deprecated', 2008, 'First gen JD diagnostic'),
  mk('jd-edl-v2', 'John Deere EDL v2', 'John Deere', 'industry', 'Industry & Agriculture', ['USB', 'WiFi'], ['CAN', 'J1939'], 'John Deere EDL Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], AGRI, false, false, false, 'stable', 2016, 'WiFi JD diagnostic'),
  mk('jd-edl-v3', 'John Deere EDL v3', 'John Deere', 'industry', 'Industry & Agriculture', ['WiFi', 'USB', 'Bluetooth'], ['CAN', 'J1939', 'ISOBUS', 'J2534'], 'John Deere EDL v3 Driver', '5.0.0', [fw('5.0.0', '2024-06', 'latest')], AGRI, true, false, false, 'supported', 2023, 'CAN FD/ISOBUS JD VCI'),
  mk('cat-et-i', 'CAT ET I', 'CAT', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'CAT ET Driver', '1.0.0', [fw('1.0.0', '2008-06', 'deprecated')], AGRI, false, false, false, 'deprecated', 2005, 'First gen CAT diagnostic'),
  mk('cat-et-ii', 'CAT ET II', 'CAT', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'CAT ET Driver', '2.0.0', [fw('2.0.0', '2016-06', 'stable')], AGRI, false, false, false, 'stable', 2013, 'Updated CAT diagnostic'),
  mk('cat-et-iii', 'CAT ET III', 'CAT', 'industry', 'Industry & Agriculture', ['WiFi', 'USB'], ['CAN', 'J1939', 'CAN FD', 'J2534'], 'CAT ET III Driver', '4.0.0', [fw('4.0.0', '2023-06', 'latest')], AGRI, true, false, true, 'supported', 2022, 'CAN FD CAT ET III'),
  mk('jcb-dla', 'JCB DLA', 'JCB', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'JCB DLA Driver', '1.0.0', [fw('1.0.0', '2012-06', 'stable')], AGRI, false, false, false, 'stable', 2010, 'JCB Data Link Adapter'),
  mk('jcb-service', 'JCB Service Tool', 'JCB', 'industry', 'Industry & Agriculture', ['USB', 'WiFi'], ['CAN', 'J1939'], 'JCB Service Driver', '2.0.0', [fw('2.0.0', '2022-06', 'stable')], AGRI, false, false, false, 'stable', 2020, 'WiFi JCB diagnostic tool'),
  mk('cnh-dpa5', 'CNH DPA5', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB', 'Bluetooth'], ['J1939', 'CAN', 'J2534'], 'Noregon DPA Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], AGRI, true, false, false, 'stable', 2015, 'CNH DPA5 diagnostic'),
  mk('agco-canusb', 'Agco CANUSB', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939', 'ISOBUS'], 'Agco CANUSB Driver', '1.0.0', [fw('1.0.0', '2016-06', 'stable')], AGRI, false, false, false, 'stable', 2014, 'Agco CAN/ISOBUS interface'),
  mk('liebherr-vci', 'Liebherr VCI', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB', 'WiFi'], ['CAN', 'J1939'], 'Liebherr VCI Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], AGRI, false, false, false, 'stable', 2018, 'Liebherr diagnostic VCI'),
  mk('liebherr-sculi', 'Liebherr SCULI VCI', 'Other Industry', 'industry', 'Industry & Agriculture', ['WiFi', 'USB'], ['CAN', 'J1939'], 'Liebherr SCULI Driver', '3.0.0', [fw('3.0.0', '2023-06', 'latest')], AGRI, false, false, false, 'supported', 2022, 'Liebherr SCULI VCI'),
  mk('deutz-serdia', 'Deutz SerDia', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'Deutz SerDia Driver', '1.0.0', [fw('1.0.0', '2014-06', 'stable')], AGRI, false, false, false, 'stable', 2012, 'Deutz SerDia interface'),
  mk('kubota-diagmaster', 'Kubota Diagmaster', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB', 'WiFi'], ['CAN', 'J1939'], 'Kubota Diagmaster Driver', '2.0.0', [fw('2.0.0', '2022-06', 'stable')], AGRI, false, false, false, 'stable', 2020, 'Kubota diagnostic VCI'),
  mk('perkins-est', 'Perkins EST', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB'], ['CAN', 'J1939'], 'Perkins EST Driver', '1.5.0', [fw('1.5.0', '2018-06', 'stable')], AGRI, false, false, false, 'stable', 2016, 'Perkins Electronic Service Tool'),
  mk('yanmar-advisor', 'Yanmar SA-ADVISOR', 'Other Industry', 'industry', 'Industry & Agriculture', ['USB', 'WiFi'], ['CAN', 'J1939'], 'Yanmar Advisor Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], AGRI, false, false, false, 'stable', 2019, 'Yanmar diagnostic advisor'),

  // ===== EV SPECIFIC =====
  mk('ev-tesla-toolbox', 'Tesla Toolbox Ethernet', 'Tesla', 'ev-specific', 'EV Specific', ['Ethernet'], ['CAN', 'DoIP', 'UDS'], 'Tesla Toolbox Driver', '3.0.0', [fw('3.0.0', '2022-06', 'latest')], EV_B, false, true, false, 'supported', 2018, 'Official Tesla Ethernet diagnostic'),
  mk('ev-tesla-loki', 'Tesla LOKI VCI', 'Tesla', 'ev-specific', 'EV Specific', ['USB'], ['CAN', 'CAN FD'], 'Tesla LOKI Driver', '2.0.0', [fw('2.0.0', '2023-06', 'latest')], EV_B, false, false, true, 'supported', 2021, 'CAN FD Tesla VCI'),
  mk('ev-tcan', 'T-Can Dongle', 'Tesla', 'ev-specific', 'EV Specific', ['USB'], ['CAN'], 'T-Can Driver', '1.5.0', [fw('1.5.0', '2022-06', 'stable')], EV_B, false, false, false, 'stable', 2020, 'Tesla CAN bus adapter'),
  mk('ev-pcan', 'PCAN-USB', 'Tesla', 'ev-specific', 'EV Specific', ['USB'], ['CAN', 'CAN FD'], 'Peak PCAN Driver', '4.0.0', [fw('4.0.0', '2020-06', 'stable')], EV_B, false, false, true, 'stable', 2015, 'Peak PCAN CAN FD adapter'),
  mk('ev-tesla-sx', 'Tesla Model S/X Adapter', 'Tesla', 'ev-specific', 'EV Specific', ['USB', 'Ethernet'], ['CAN', 'DoIP'], 'Tesla SX Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], EV_B, false, true, false, 'stable', 2019, 'Tesla Model S/X diagnostic'),
  mk('ev-autel-maxivci', 'Autel MaxiVCI EV', 'EV Batteries', 'ev-specific', 'EV Specific', ['WiFi', 'USB', 'Bluetooth'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Autel EV Driver', '4.0.0', [fw('4.0.0', '2025-01', 'latest')], EV_B, true, true, true, 'supported', 2024, 'Autel EV-specific VCI'),
  mk('ev-launch-kit', 'Launch EV Kit', 'EV Batteries', 'ev-specific', 'EV Specific', ['WiFi', 'Bluetooth'], ['CAN', 'DoIP', 'J2534'], 'Launch EV Driver', '3.0.0', [fw('3.0.0', '2024-06', 'latest')], EV_B, true, true, false, 'supported', 2023, 'Launch EV diagnostic kit'),
  mk('ev-topdon', 'Topdon Phoenix EV VCI', 'EV Batteries', 'ev-specific', 'EV Specific', ['WiFi', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Topdon EV Driver', '3.0.0', [fw('3.0.0', '2025-01', 'latest')], EV_B, true, true, true, 'supported', 2024, 'Topdon Phoenix EV VCI'),
  mk('ev-bmw-icom', 'BMW ICOM Next DoIP', 'EV Batteries', 'ev-specific', 'EV Specific', ['LAN', 'WiFi'], ['CAN', 'DoIP', 'J2534'], 'BMW ISTA VCI Driver', '5.0.0', [fw('5.0.0', '2023-06', 'latest')], EV_B, true, true, false, 'supported', 2019, 'BMW i DoIP diagnostic'),
  mk('ev-mb-xentry', 'Mercedes Xentry VCI DoIP', 'EV Batteries', 'ev-specific', 'EV Specific', ['WiFi', 'LAN', 'USB'], ['CAN', 'DoIP', 'CAN FD', 'J2534'], 'Mercedes Xentry Driver', '5.0.0', [fw('5.0.0', '2025-01', 'latest')], EV_B, true, true, true, 'supported', 2024, 'Mercedes EQ DoIP VCI'),

  // ===== MOTORCYCLE & NAUTICAL =====
  mk('moto-texa-txb', 'Texa Navigator TXB', 'Motorcycle', 'motorcycle-nautical', 'Motorcycle', ['Bluetooth', 'USB'], ['CAN', 'K-Line'], 'TEXA TXB Driver', '3.0.0', [fw('3.0.0', '2022-06', 'latest')], MOTO, false, false, false, 'supported', 2020, 'TEXA motorcycle diagnostic'),
  mk('moto-bmw-icom', 'BMW Motorrad ICOM', 'Motorcycle', 'motorcycle-nautical', 'Motorcycle', ['LAN', 'USB'], ['CAN', 'K-Line'], 'BMW Motorrad Driver', '3.0.0', [fw('3.0.0', '2018-06', 'stable')], MOTO, false, false, false, 'stable', 2016, 'BMW motorcycle ICOM'),
  mk('moto-yamaha', 'Yamaha VCI', 'Motorcycle', 'motorcycle-nautical', 'Motorcycle', ['USB'], ['CAN', 'K-Line'], 'Yamaha VCI Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], MOTO, false, false, false, 'stable', 2018, 'Yamaha diagnostic VCI'),
  mk('moto-suzuki', 'Suzuki VCI', 'Motorcycle', 'motorcycle-nautical', 'Motorcycle', ['USB'], ['CAN', 'K-Line'], 'Suzuki VCI Driver', '1.5.0', [fw('1.5.0', '2019-06', 'stable')], MOTO, false, false, false, 'stable', 2017, 'Suzuki diagnostic VCI'),
  mk('moto-honda', 'Honda Moto VCI', 'Motorcycle', 'motorcycle-nautical', 'Motorcycle', ['USB'], ['CAN', 'K-Line'], 'Honda Moto Driver', '2.0.0', [fw('2.0.0', '2021-06', 'stable')], MOTO, false, false, false, 'stable', 2019, 'Honda motorcycle VCI'),
  mk('naut-jaltest', 'Jaltest Marine VCI', 'Nautical', 'motorcycle-nautical', 'Nautical', ['USB', 'Bluetooth', 'WiFi'], ['J1939', 'CAN', 'J2534'], 'Jaltest Marine Driver', '3.0.0', [fw('3.0.0', '2023-06', 'latest')], MARINE, true, false, false, 'supported', 2021, 'Jaltest marine diagnostic VCI'),
  mk('naut-volvo-penta', 'Volvo Penta VODIA', 'Nautical', 'motorcycle-nautical', 'Nautical', ['USB', 'WiFi'], ['CAN', 'J1939'], 'Volvo Penta VODIA Driver', '2.0.0', [fw('2.0.0', '2018-06', 'stable')], MARINE, false, false, false, 'stable', 2015, 'Volvo Penta marine diagnostic'),
  mk('naut-mercury', 'Mercury Marine G3', 'Nautical', 'motorcycle-nautical', 'Nautical', ['USB', 'Bluetooth'], ['CAN', 'J1939'], 'Mercury G3 Driver', '2.0.0', [fw('2.0.0', '2020-06', 'stable')], MARINE, false, false, false, 'stable', 2019, 'Mercury Marine diagnostic'),
]

// Helper functions
export function getDonglesByCategory(category: DongleCategory): DongleModel[] {
  return DONGLE_DATABASE.filter(d => d.category === category)
}

export function getDonglesByBrand(brand: string): DongleModel[] {
  return DONGLE_DATABASE.filter(d => d.brand === brand)
}

export function getDonglesBySubcategory(subcategory: string): DongleModel[] {
  return DONGLE_DATABASE.filter(d => d.subcategory === subcategory)
}

export function searchDongles(query: string): DongleModel[] {
  const q = query.toLowerCase()
  return DONGLE_DATABASE.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.brand.toLowerCase().includes(q) ||
    d.subcategory.toLowerCase().includes(q) ||
    d.protocols.some(p => p.toLowerCase().includes(q)) ||
    d.driverName.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.supportedBrands.some(b => b.toLowerCase().includes(q))
  )
}

export function getDongleById(id: string): DongleModel | undefined {
  return DONGLE_DATABASE.find(d => d.id === id)
}

export function getDongleStats() {
  return {
    total: DONGLE_DATABASE.length,
    supported: DONGLE_DATABASE.filter(d => d.status === 'supported').length,
    j2534: DONGLE_DATABASE.filter(d => d.j2534Compliant).length,
    doip: DONGLE_DATABASE.filter(d => d.doipSupport).length,
    canfd: DONGLE_DATABASE.filter(d => d.canFdSupport).length,
    categories: DONGLE_CATEGORIES.length,
    brands: DONGLE_BRANDS.length,
  }
}

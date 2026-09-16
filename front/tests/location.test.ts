import { 
  MALIR_DISTRICT, 
  MALIR_TOWNS, 
  MALIR_LOCATIONS, 
  getTownOptions, 
  getUcOptionsForTown, 
  isValidMalirLocation,
  formatLocation,
  normalizeTown
} from '../lib/malirLocations';

console.log('--- STARTING LOCATION HIERARCHY TESTS ---');

// Test 1: Malir UCs
const malirUcs = MALIR_LOCATIONS['Malir'];
console.log(`Test 1: Malir UCs count: ${malirUcs.length} (Expected: 10)`);
if (malirUcs.length !== 10) throw new Error('Test 1 failed!');

// Test 2: Gadap UCs
const gadapUcs = MALIR_LOCATIONS['Gadap'];
console.log(`Test 2: Gadap UCs count: ${gadapUcs.length} (Expected: 9)`);
if (gadapUcs.length !== 9) throw new Error('Test 2 failed!');

// Test 3: Ibrahim Hyderi UCs
const ibrahimUcs = MALIR_LOCATIONS['Ibrahim Hyderi'];
console.log(`Test 3: Ibrahim Hyderi UCs count: ${ibrahimUcs.length} (Expected: 11)`);
if (ibrahimUcs.length !== 11) throw new Error('Test 3 failed!');

// Test 4: Invalid combination rejected
const invalidCheck = isValidMalirLocation('Gadap', 'Gharibabad');
console.log(`Test 4: isValidMalirLocation("Gadap", "Gharibabad") -> ${invalidCheck} (Expected: false)`);
if (invalidCheck !== false) throw new Error('Test 4 failed!');

// Test 5: Valid combination accepted
const validCheck = isValidMalirLocation('Gadap', 'Gulshan-e-Hadeed');
console.log(`Test 5: isValidMalirLocation("Gadap", "Gulshan-e-Hadeed") -> ${validCheck} (Expected: true)`);
if (validCheck !== true) throw new Error('Test 5 failed!');

// Test 6: Location Formatting
const formatted1 = formatLocation('Gulshan-e-Hadeed', 'Gadap', 'Malir');
console.log(`Test 6a: formatLocation -> "${formatted1}" (Expected: "Gulshan-e-Hadeed, Gadap, Malir")`);
if (formatted1 !== 'Gulshan-e-Hadeed, Gadap, Malir') throw new Error('Test 6a failed!');

const formatted2 = formatLocation('Qaidabad', 'Malir', 'Malir');
console.log(`Test 6b: formatLocation -> "${formatted2}" (Expected: "Qaidabad, Malir")`);
if (formatted2 !== 'Qaidabad, Malir') throw new Error('Test 6b failed!');

const formatted3 = formatLocation('', 'Gulshan-e-Hadeed, Gadap', 'Malir');
console.log(`Test 6c: formatLocation composite -> "${formatted3}" (Expected: "Gulshan-e-Hadeed, Gadap, Malir")`);
if (formatted3 !== 'Gulshan-e-Hadeed, Gadap, Malir') throw new Error('Test 6c failed!');

// Test 7: Empty town returns empty UCs
const emptyUcs = getUcOptionsForTown('');
console.log(`Test 7: getUcOptionsForTown("") count: ${emptyUcs.length} (Expected: 0)`);
if (emptyUcs.length !== 0) throw new Error('Test 7 failed!');

console.log('--- ALL LOCATION TESTS PASSED SUCCESSFULLY ---');

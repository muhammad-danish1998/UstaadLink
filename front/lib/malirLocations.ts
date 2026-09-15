/**
 * District Malir, Karachi — Location Hierarchy System
 * District: Malir
 * Towns: Malir Town, Gadap Town, Ibrahim Hyderi Town
 * UCs: Specific Union Councils mapped to each town
 */

export const MALIR_DISTRICT = 'Malir';

export interface MalirTownData {
  town: string;
  ucs: string[];
}

export const MALIR_LOCATIONS: Record<string, string[]> = {
  'Malir Town': [
    'Gharibabad',
    'Dawood Goth',
    'Jafar-e-Tayyar',
    'Khuldabad',
    'Qaidabad',
    'Dawood Chowrangi',
    'Future Colony',
    'Sharafi Goth',
    'Bakhtawar Goth',
    'Bhittaiabad',
  ],
  'Gadap Town': [
    'Gadap',
    'Gaghar',
    'Pipri',
    'Gulshan-e-Hadeed',
    'Steel Town',
    'Saleh Muhammad',
    'Murad Memon Goth',
    'Darsano Chana',
    'Shah Mureed',
  ],
  'Ibrahim Hyderi Town': [
    'Chaukhandi',
    'Shah Latif Town',
    'Cattle Colony',
    'Majeed Colony',
    'Muzaffarabad',
    'Muslimabad',
    'Sher Pao Colony',
    'Ibrahim Hyderi',
    'Chashma',
    'Rehri Goth',
    'Ali Akber Shah',
  ],
};

export const CUSTOM_LOCATION_VALUE = '__custom__';

export const MALIR_TOWNS = Object.keys(MALIR_LOCATIONS);

export function getTownOptions() {
  return [
    ...MALIR_TOWNS.map((town) => ({
      value: town,
      label: town,
    })),
    { value: CUSTOM_LOCATION_VALUE, label: '✏️ Other / Custom Town (Write your own)' },
  ];
}

export function getUcOptionsForTown(townName: string) {
  const ucs = MALIR_LOCATIONS[townName] || [];
  return [
    ...ucs.map((uc) => ({
      value: uc,
      label: uc,
    })),
    { value: CUSTOM_LOCATION_VALUE, label: '✏️ Other / Custom UC / Area (Write your own)' },
  ];
}

export function isValidMalirLocation(townName: string, ucName: string): boolean {
  if (!townName || !townName.trim() || !ucName || !ucName.trim()) return false;
  return townName.trim().length >= 2 && ucName.trim().length >= 2;
}

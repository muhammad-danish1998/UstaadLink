/**
 * UstaadLink — District Malir Location Hierarchy System
 * District: Malir (Fixed)
 * Towns / TMCs: Malir, Gadap, Ibrahim Hyderi
 * Dependent Union Councils (UCs) per Town
 */

export const MALIR_DISTRICT = 'Malir';

export const MALIR_LOCATIONS: Record<'Malir' | 'Gadap' | 'Ibrahim Hyderi', string[]> = {
  'Malir': [
    'Gharibabad',
    'Dawood Goth',
    'Jaffar-e-Tayyar',
    'Khuldabad',
    'Qaidabad',
    'Dawood Chowrangi',
    'Future Colony',
    'Sharafi Goth',
    'Bakhtawar Goth',
    'Bhittaiabad',
  ],
  'Gadap': [
    'Gadap',
    'Ghaghar',
    'Pipri',
    'Gulshan-e-Hadeed',
    'Steel Town',
    'Saleh Muhammad',
    'Murad Memon',
    'Darsano Channo',
    'Shah Mureed',
  ],
  'Ibrahim Hyderi': [
    'Chowkandi',
    'Shah Lateef',
    'Cattle Colony',
    'Majeed Colony',
    'Muzzaffarabad',
    'Muslimabad',
    'Sher Pao Colony',
    'Ibrahim Hyderi',
    'Chashma',
    'Rehri',
    'Ali Akber Shah',
  ],
};

export type MalirTownName = keyof typeof MALIR_LOCATIONS;

export const MALIR_TOWNS: MalirTownName[] = ['Malir', 'Gadap', 'Ibrahim Hyderi'];

/**
 * Normalizes legacy town strings (e.g. 'Malir Town' -> 'Malir')
 */
export function normalizeTown(rawTown?: string): MalirTownName | '' {
  if (!rawTown) return '';
  const clean = rawTown.trim().toLowerCase();
  if (clean.includes('ibrahim') || clean.includes('hyderi')) return 'Ibrahim Hyderi';
  if (clean.includes('gadap')) return 'Gadap';
  if (clean.includes('malir')) return 'Malir';
  return '';
}

/**
 * Normalizes legacy UC strings for spelling variations
 */
export function normalizeUc(town: MalirTownName, rawUc?: string): string {
  if (!rawUc || !town) return rawUc || '';
  const ucs = MALIR_LOCATIONS[town] || [];
  const exactMatch = ucs.find(u => u.toLowerCase() === rawUc.trim().toLowerCase());
  if (exactMatch) return exactMatch;

  // Handle minor spelling variations from legacy data
  const clean = rawUc.trim().toLowerCase();
  const partial = ucs.find(u => 
    u.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '') ||
    clean.includes(u.toLowerCase()) ||
    u.toLowerCase().includes(clean)
  );
  return partial || rawUc;
}

/**
 * Returns options for the Town / TMC dropdown
 */
export function getTownOptions() {
  return MALIR_TOWNS.map((town) => ({
    value: town,
    label: town,
  }));
}

/**
 * Returns dependent Union Councils options for a selected Town
 */
export function getUcOptionsForTown(townName?: string) {
  const normTown = normalizeTown(townName);
  if (!normTown || !MALIR_LOCATIONS[normTown]) {
    return [];
  }
  return MALIR_LOCATIONS[normTown].map((uc) => ({
    value: uc,
    label: uc,
  }));
}

/**
 * Validates that town is one of the 3 Malir TMCs and UC strictly belongs to that Town
 */
export function isValidMalirLocation(townName?: string, ucName?: string): boolean {
  if (!townName || !ucName) return false;
  const normTown = normalizeTown(townName);
  if (!normTown || !MALIR_LOCATIONS[normTown]) return false;

  const cleanUc = ucName.trim().toLowerCase();
  const allowedUcs = MALIR_LOCATIONS[normTown].map(u => u.toLowerCase());
  return allowedUcs.includes(cleanUc);
}

/**
 * Formats a location consistently: "📍 [UC], [Town], Malir"
 */
export function formatLocation(uc?: string, town?: string, district: string = MALIR_DISTRICT): string {
  const parts: string[] = [];
  if (uc && uc.trim()) parts.push(uc.trim());
  if (town && town.trim()) parts.push(normalizeTown(town) || town.trim());
  parts.push(district || MALIR_DISTRICT);
  return parts.join(', ');
}

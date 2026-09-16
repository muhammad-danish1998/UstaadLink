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
 * Parses raw stored location string (e.g. "Qaidabad, Malir" or "Gulshan-e-Hadeed, Gadap")
 * to extract the Union Council (UC) and Town reliably
 */
export function parseMalirLocation(rawLocation?: string): { uc: string; town: MalirTownName | ''; district: string } {
  if (!rawLocation) return { uc: '', town: 'Malir', district: MALIR_DISTRICT };

  const clean = rawLocation.trim();
  const lower = clean.toLowerCase();

  // Create list of all UCs sorted by length descending so longer/more specific names match first
  const allUcs: { uc: string; town: MalirTownName }[] = [];
  for (const town of MALIR_TOWNS) {
    for (const uc of MALIR_LOCATIONS[town]) {
      allUcs.push({ uc, town });
    }
  }
  allUcs.sort((a, b) => b.uc.length - a.uc.length);

  // 1. Check if any known Union Council is in the string (longest first)
  for (const item of allUcs) {
    if (lower.includes(item.uc.toLowerCase())) {
      return {
        uc: item.uc,
        town: item.town,
        district: MALIR_DISTRICT,
      };
    }
  }

  // 2. If no UC matched, check if Town matches
  const normTown = normalizeTown(clean);
  return {
    uc: '',
    town: normTown || 'Malir',
    district: MALIR_DISTRICT,
  };
}

/**
 * Formats a location consistently for teacher cards and profile pages
 * Examples:
 * - "Qaidabad, Malir"
 * - "Gulshan-e-Hadeed, Gadap, Malir"
 * - "Shah Lateef, Ibrahim Hyderi, Malir"
 */
export function formatLocation(rawUc?: string, rawTown?: string, rawDistrict: string = MALIR_DISTRICT): string {
  let parsedUc = rawUc ? rawUc.trim() : '';
  let parsedTown = rawTown ? rawTown.trim() : '';

  // If rawTown or rawUc contains a composite string (e.g. "Qaidabad, Malir"), parse it cleanly
  if (!parsedUc && parsedTown) {
    const parsed = parseMalirLocation(parsedTown);
    parsedUc = parsed.uc;
    parsedTown = parsed.town || parsedTown;
  } else if (parsedUc) {
    const parsed = parseMalirLocation(parsedUc);
    if (parsed.uc) {
      parsedUc = parsed.uc;
      if (!parsedTown || parsedTown === MALIR_DISTRICT) parsedTown = parsed.town;
    }
  }

  const normTown = normalizeTown(parsedTown) || parsedTown;
  const parts: string[] = [];

  if (parsedUc) {
    parts.push(parsedUc);
  }

  if (normTown && !parts.some(p => p.toLowerCase() === normTown.toLowerCase())) {
    parts.push(normTown);
  }

  // If the location only consists of "Malir", return "Malir Town, Karachi"
  if (parts.length === 1 && parts[0].toLowerCase() === 'malir') {
    return 'Malir, Karachi';
  }

  // Add District Malir if town is Gadap or Ibrahim Hyderi (or not already present)
  if (normTown && normTown !== 'Malir' && !parts.includes(MALIR_DISTRICT)) {
    parts.push(MALIR_DISTRICT);
  }

  return parts.length > 0 ? parts.join(', ') : 'Malir, Karachi';
}

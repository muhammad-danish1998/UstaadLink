import assert from 'node:assert';
import { TeachingMode } from '../types/database';

console.log('--- Running Teaching Mode Logic Tests ---');

// Test 1: Teaching Mode Validation Rules
interface CardDraftValidation {
  teachingMode: TeachingMode;
  townTmc: string;
  unionCouncil: string;
  monthlySalary: number;
  onlineHourlyRate: number;
}

function validateStep4(draft: Pick<CardDraftValidation, 'teachingMode' | 'townTmc' | 'unionCouncil'>): boolean {
  if (draft.teachingMode === 'online') {
    return true; // Location not required for online
  }
  return draft.townTmc.trim().length > 0 && draft.unionCouncil.trim().length > 0;
}

function validateStep5(draft: Pick<CardDraftValidation, 'teachingMode' | 'monthlySalary' | 'onlineHourlyRate'>): boolean {
  if (draft.teachingMode === 'onsite') {
    return draft.monthlySalary > 0;
  }
  if (draft.teachingMode === 'online') {
    return draft.onlineHourlyRate > 0;
  }
  if (draft.teachingMode === 'both') {
    return draft.monthlySalary > 0 && draft.onlineHourlyRate > 0;
  }
  return false;
}

// Test On-site
assert.strictEqual(validateStep4({ teachingMode: 'onsite', townTmc: '', unionCouncil: '' }), false, 'On-site requires location');
assert.strictEqual(validateStep4({ teachingMode: 'onsite', townTmc: 'Malir', unionCouncil: 'Model Colony' }), true, 'On-site with location is valid');
assert.strictEqual(validateStep5({ teachingMode: 'onsite', monthlySalary: 0, onlineHourlyRate: 0 }), false, 'On-site requires monthly salary > 0');
assert.strictEqual(validateStep5({ teachingMode: 'onsite', monthlySalary: 45000, onlineHourlyRate: 0 }), true, 'On-site with salary is valid');

// Test Online
assert.strictEqual(validateStep4({ teachingMode: 'online', townTmc: '', unionCouncil: '' }), true, 'Online does not require town/UC');
assert.strictEqual(validateStep5({ teachingMode: 'online', monthlySalary: 0, onlineHourlyRate: 0 }), false, 'Online requires hourly rate > 0');
assert.strictEqual(validateStep5({ teachingMode: 'online', monthlySalary: 0, onlineHourlyRate: 1500 }), true, 'Online with hourly rate is valid');

// Test Both
assert.strictEqual(validateStep4({ teachingMode: 'both', townTmc: '', unionCouncil: '' }), false, 'Both requires location');
assert.strictEqual(validateStep4({ teachingMode: 'both', townTmc: 'Gadap', unionCouncil: 'Murad Memon' }), true, 'Both with location is valid');
assert.strictEqual(validateStep5({ teachingMode: 'both', monthlySalary: 40000, onlineHourlyRate: 0 }), false, 'Both requires both rates (missing hourly)');
assert.strictEqual(validateStep5({ teachingMode: 'both', monthlySalary: 0, onlineHourlyRate: 1200 }), false, 'Both requires both rates (missing monthly)');
assert.strictEqual(validateStep5({ teachingMode: 'both', monthlySalary: 40000, onlineHourlyRate: 1200 }), true, 'Both with both rates is valid');

console.log('✓ Validation rules verified successfully');

// Test 2: Search Filtering Logic
interface MockTeacher {
  id: string;
  name: string;
  teaching_mode?: TeachingMode;
  monthly_salary?: number;
  expected_salary?: number;
  online_hourly_rate?: number;
}

const mockTeachers: MockTeacher[] = [
  { id: '1', name: 'Onsite Teacher', teaching_mode: 'onsite', monthly_salary: 35000, expected_salary: 35000 },
  { id: '2', name: 'Online Teacher', teaching_mode: 'online', online_hourly_rate: 1500 },
  { id: '3', name: 'Hybrid Teacher', teaching_mode: 'both', monthly_salary: 50000, online_hourly_rate: 2000, expected_salary: 50000 },
  { id: '4', name: 'Legacy Teacher', expected_salary: 30000 }, // No teaching_mode set
];

function filterTeachers(
  teachers: MockTeacher[],
  selectedMode: 'all' | TeachingMode,
  maxMonthlySalary?: number,
  maxHourlyRate?: number
): MockTeacher[] {
  return teachers.filter(t => {
    const teacherMode = t.teaching_mode || 'onsite';
    if (selectedMode !== 'all') {
      if (selectedMode === 'both') {
        if (teacherMode !== 'both') return false;
      } else if (teacherMode !== selectedMode && teacherMode !== 'both') {
        return false;
      }
    }

    if (maxMonthlySalary !== undefined && (teacherMode === 'onsite' || teacherMode === 'both')) {
      const salary = t.monthly_salary || t.expected_salary || 0;
      if (salary > maxMonthlySalary) return false;
    }

    if (maxHourlyRate !== undefined && (teacherMode === 'online' || teacherMode === 'both')) {
      const hourly = t.online_hourly_rate || 0;
      if (hourly > maxHourlyRate) return false;
    }

    return true;
  });
}

// All teachers filter
assert.strictEqual(filterTeachers(mockTeachers, 'all').length, 4, 'All filter returns all 4 teachers');

// On-site filter matches 'onsite', 'both', and legacy default 'onsite'
const onsiteMatches = filterTeachers(mockTeachers, 'onsite');
assert.strictEqual(onsiteMatches.length, 3, 'On-site filter returns Onsite, Hybrid, and Legacy');
assert.ok(onsiteMatches.some(t => t.id === '1'), 'Includes Onsite Teacher');
assert.ok(onsiteMatches.some(t => t.id === '3'), 'Includes Hybrid Teacher');
assert.ok(onsiteMatches.some(t => t.id === '4'), 'Includes Legacy Teacher');

// Online filter matches 'online' and 'both'
const onlineMatches = filterTeachers(mockTeachers, 'online');
assert.strictEqual(onlineMatches.length, 2, 'Online filter returns Online and Hybrid');
assert.ok(onlineMatches.some(t => t.id === '2'), 'Includes Online Teacher');
assert.ok(onlineMatches.some(t => t.id === '3'), 'Includes Hybrid Teacher');

// Both filter matches only 'both'
const bothMatches = filterTeachers(mockTeachers, 'both');
assert.strictEqual(bothMatches.length, 1, 'Both filter returns only Hybrid Teacher');
assert.strictEqual(bothMatches[0].id, '3');

// Monthly salary filter
const salaryFiltered = filterTeachers(mockTeachers, 'onsite', 35000);
assert.strictEqual(salaryFiltered.length, 2, 'Salary filter excludes teachers above 35000 (excludes Hybrid 50000)');

// Hourly rate filter
const hourlyFiltered = filterTeachers(mockTeachers, 'online', 1500);
assert.strictEqual(hourlyFiltered.length, 1, 'Hourly filter excludes teachers above 1500/hr (excludes Hybrid 2000)');

console.log('✓ Search & filtering logic verified successfully');
console.log('ALL TEACHING MODE TESTS PASSED!');

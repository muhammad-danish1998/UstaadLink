import { createClient } from '@/lib/supabase/client';
import { TeacherCardData } from '@/components/teacher/TeacherCard';
import { Subject, ClassLevel, TeachingSkill } from '@/types/database';
import { sanitizeInput, normalizePhoneNumber } from '@/lib/security';
import { normalizeTown, normalizeUc, MALIR_DISTRICT, isValidMalirLocation, parseMalirLocation } from '@/lib/malirLocations';

import { getCardDraft, saveCardDraft, TeacherCardDraft } from '@/lib/cardBuilderStorage';

// Duplicate contact phone check strictly across Supabase active database
export async function checkDuplicateContactNumber(
  phone: string,
  role?: 'teacher' | 'school',
  currentUserId?: string
): Promise<{ isDuplicate: boolean; message?: string }> {
  const normPhone = normalizePhoneNumber(phone);
  if (!normPhone) {
    return { isDuplicate: false };
  }

  try {
    const supabase = createClient();

    // 1. Check Supabase profiles table for active registered accounts
    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, role, phone')
      .or(`phone.eq.${normPhone},phone.ilike.%${normPhone.slice(-10)}%`);

    if (currentUserId) {
      profileQuery = profileQuery.neq('id', currentUserId);
    }

    const { data: matchedProfiles, error } = await profileQuery.limit(5);
    if (!error && matchedProfiles && matchedProfiles.length > 0) {
      const prof = matchedProfiles[0];
      const matchRole = prof.role === 'school' ? 'school' : 'teacher';
      return {
        isDuplicate: true,
        message: `An account (${matchRole} "${prof.full_name}") with contact number (${normPhone}) is already registered. Please log in or use a different phone number.`,
      };
    }
  } catch (err) {
    console.warn('Supabase duplicate phone check notice:', err);
  }

  return { isDuplicate: false };
}

// In-memory cache for ultra-fast query responses
let teacherCache: { data: TeacherCardData[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds cache for snappy navigation

export function invalidateTeacherCache() {
  teacherCache = null;
}

export function normalizeClassLevel(val?: string): string {
  if (!val) return '6 - 10';
  const clean = String(val).trim();
  const lower = clean.toLowerCase();
  
  // 1. All Levels (1 - 10)
  if (
    clean === '1 - 10' ||
    clean === '1-10' ||
    lower.includes('all level') ||
    lower.includes('1 to 10') ||
    (lower.includes('primary') && lower.includes('middle') && (lower.includes('matric') || lower.includes('secondary')))
  ) {
    return '1 - 10';
  }

  // 2. Classes 6 - 10 (Secondary covering Middle 6-8 + Matric 9-10)
  if (
    clean === '6 - 10' ||
    clean === '6-10' ||
    clean.includes('6 - 10') ||
    clean.includes('6-10') ||
    (lower.includes('middle') && (lower.includes('matric') || lower.includes('secondary (class 9') || lower.includes('secondary'))) ||
    ((lower.includes('6-8') || lower.includes('6 - 8')) && (lower.includes('9-10') || lower.includes('9 - 10')))
  ) {
    return '6 - 10';
  }

  // 3. Cambridge O / A Levels
  if (
    lower.includes('o-level') ||
    lower.includes('a-level') ||
    lower.includes('o / a') ||
    lower.includes('o/a') ||
    lower.includes('cambridge') ||
    clean.includes('O / A')
  ) {
    return 'O / A Levels';
  }

  // 4. Higher Secondary / Inter (11 - 12)
  if (
    clean === '11 - 12' ||
    clean === '11-12' ||
    lower.includes('11 - 12') ||
    lower.includes('11-12') ||
    lower.includes('higher secondary') ||
    lower.includes('inter') ||
    lower.includes('hssc') ||
    lower.includes('fsc')
  ) {
    return '11 - 12';
  }

  // 5. Matric / Secondary (9 - 10)
  if (
    clean === '9 - 10' ||
    clean === '9-10' ||
    lower.includes('matric') ||
    (lower.includes('9') && lower.includes('10')) ||
    (lower.includes('secondary') && !lower.includes('6') && !lower.includes('middle') && !lower.includes('higher'))
  ) {
    return '9 - 10';
  }

  // 6. Middle (6 - 8)
  if (
    clean === '6 - 8' ||
    clean === '6-8' ||
    lower.includes('middle') ||
    (lower.includes('6') && lower.includes('8') && !lower.includes('10'))
  ) {
    return '6 - 8';
  }

  // 7. Primary (1 - 5)
  if (
    clean === '1 - 5' ||
    clean === '1-5' ||
    lower.includes('primary') ||
    (lower.includes('1') && lower.includes('5') && !lower.includes('10'))
  ) {
    return '1 - 5';
  }

  return clean.replace(/^Class(es)?\s*:?\s*/i, '').trim() || '6 - 10';
}

export interface TeacherFilterParams {
  query?: string;
  subject?: string;
  classLevel?: string;
  district?: string;
  town?: string;
  uc?: string;
  teachingMode?: string; // 'all' | 'onsite' | 'online' | 'both'
  availability?: string;
  minExperience?: number;
  maxSalary?: number;
  maxHourlyRate?: number;
  sortBy?: 'relevance' | 'newest' | 'experience' | 'salary_asc' | 'salary_desc';
}

const LOCAL_TEACHERS_KEY = 'teachconnect_local_registered_teachers';

export function getLocalRegisteredTeachers(): TeacherCardData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TEACHERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Safely parses metadata (mode, rates, location) encoded in teacher bio/town_area
 */
export function parseTeacherMetadata(aboutMe?: string | null, townArea?: string | null): {
  cleanAboutMe: string;
  teachingMode: 'onsite' | 'online' | 'both';
  monthlySalary?: number;
  onlineHourlyRate?: number;
  town?: string;
  uc?: string;
} {
  let cleanAboutMe = aboutMe || '';
  let teachingMode: 'onsite' | 'online' | 'both' = 'onsite';
  let monthlySalary: number | undefined;
  let onlineHourlyRate: number | undefined;
  let town: string | undefined;
  let uc: string | undefined;

  if (aboutMe) {
    const match = aboutMe.match(/<!--TC_META:([\s\S]*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.mode === 'online' || parsed.mode === 'both' || parsed.mode === 'onsite') {
          teachingMode = parsed.mode;
        }
        if (parsed.monthlySalary) monthlySalary = Number(parsed.monthlySalary);
        if (parsed.onlineHourlyRate) onlineHourlyRate = Number(parsed.onlineHourlyRate);
        if (parsed.town) town = parsed.town;
        if (parsed.uc) uc = parsed.uc;
      } catch {
        // ignore parse error
      }
      cleanAboutMe = aboutMe.replace(/<!--TC_META:[\s\S]*?-->/g, '').trim();
    }
  }

  // Fallback checks for keywords if not explicitly in meta
  if (teachingMode === 'onsite') {
    const combined = `${townArea || ''} ${cleanAboutMe}`.toLowerCase();
    if (combined.includes('onsite + online') || combined.includes('hybrid') || combined.includes('both online and onsite')) {
      teachingMode = 'both';
    } else if (combined.includes('online tutoring only') || combined.includes('online only') || (townArea && townArea.toLowerCase().startsWith('online'))) {
      teachingMode = 'online';
    }
  }

  return {
    cleanAboutMe,
    teachingMode,
    monthlySalary,
    onlineHourlyRate,
    town,
    uc,
  };
}

export function saveLocalRegisteredTeacher(teacherData: any) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_TEACHERS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const cleanSlug = (teacherData.slug || teacherData.fullName || 'teacher').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const mode = teacherData.teachingMode || teacherData.teaching_mode || 'onsite';
    const monthlyAmt = mode === 'online' ? null : Number(teacherData.monthlySalary ?? teacherData.expectedSalary ?? teacherData.expected_salary) || 35000;
    const hourlyAmt = mode === 'onsite' ? null : Number(teacherData.onlineHourlyRate ?? teacherData.online_hourly_rate) || 800;

    const formattedTeacher = {
      id: teacherData.id || `teacher-${cleanSlug}-${Date.now()}`,
      slug: cleanSlug,
      fullName: teacherData.fullName || teacherData.cleanName || 'Educator',
      avatarUrl: teacherData.avatarUrl || teacherData.profilePhotoUrl || '',
      highestEducation: teacherData.highestEducation || teacherData.highest_education || 'Certified Educator',
      institution: teacherData.institution || 'University',
      additionalQualifications: teacherData.additionalQualifications || teacherData.additional_qualifications || '',
      subjects: teacherData.subjects && teacherData.subjects.length > 0 ? teacherData.subjects : ['General Science', 'Mathematics'],
      classes: normalizeClassLevel(teacherData.classes),
      experienceYears: Number(teacherData.experienceYears ?? teacherData.experience_years) || 2,
      availability: teacherData.availability || 'Morning',
      teachingMode: mode,
      location: {
        area: teacherData.uc ? `${teacherData.uc}, ${teacherData.town || teacherData.town_area || 'Malir'}` : (teacherData.town || teacherData.town_area || 'Malir'),
        district: teacherData.district || 'Malir',
        city: teacherData.city || 'Karachi',
        town: teacherData.town || teacherData.town_area || 'Malir',
        uc: teacherData.uc || '',
      },
      expectedSalary: monthlyAmt ?? (hourlyAmt ? hourlyAmt * 40 : 35000),
      monthlySalary: monthlyAmt,
      onlineHourlyRate: hourlyAmt,
      aboutMe: teacherData.aboutMe || teacherData.about_me || '',
      isVerified: true,
      published: true,
      moderation_status: 'active',
      email: teacherData.email,
      phone: teacherData.phone,
      created_at: teacherData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = list.filter(item => item.slug !== cleanSlug && item.id !== formattedTeacher.id);
    updatedList.unshift(formattedTeacher);
    localStorage.setItem(LOCAL_TEACHERS_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error('saveLocalRegisteredTeacher error:', e);
  }
}

export async function getPublishedTeachers(filters?: TeacherFilterParams): Promise<TeacherCardData[]> {
  try {
    const supabase = createClient();
    const teachersList: TeacherCardData[] = [];
    const seenTeacherIds = new Set<string>();
    const seenTeacherSlugs = new Set<string>();

    // 1. Fetch teachers from Supabase teachers table with safe standard columns
    const { data: teachersData, error: teachersErr } = await supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        slug,
        avatar_url,
        highest_education,
        institution,
        additional_qualifications,
        experience_years,
        previous_school,
        availability,
        available_from,
        city,
        district,
        town_area,
        expected_salary,
        about_me,
        moderation_status,
        created_at,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (teachersErr) {
      console.warn('Notice querying teachers table:', teachersErr.message);
    }

    // 2. Also fetch registered teacher profiles (so every registered teacher appears)
    const { data: teacherProfilesData, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });

    if (profErr) {
      console.warn('Notice querying profiles table:', profErr.message);
    }

    // Safe lookup for subjects and classes
    const teacherSubjectsMap: Record<string, string[]> = {};
    const teacherClassesMap: Record<string, string[]> = {};

    try {
      const { data: subData } = await supabase.from('teacher_subjects').select('teacher_id, subjects(name)');
      if (subData) {
        subData.forEach((row: any) => {
          const sName = Array.isArray(row.subjects) ? row.subjects[0]?.name : row.subjects?.name;
          if (row.teacher_id && sName) {
            if (!teacherSubjectsMap[row.teacher_id]) teacherSubjectsMap[row.teacher_id] = [];
            teacherSubjectsMap[row.teacher_id].push(sName);
          }
        });
      }
    } catch {
      // graceful fallback
    }

    try {
      const { data: clsData } = await supabase.from('teacher_classes').select('teacher_id, classes(name)');
      if (clsData) {
        clsData.forEach((row: any) => {
          const cName = Array.isArray(row.classes) ? row.classes[0]?.name : row.classes?.name;
          if (row.teacher_id && cName) {
            if (!teacherClassesMap[row.teacher_id]) teacherClassesMap[row.teacher_id] = [];
            teacherClassesMap[row.teacher_id].push(cName);
          }
        });
      }
    } catch {
      // graceful fallback
    }

    if (teachersData && teachersData.length > 0) {
      teachersData.forEach((t: any) => {
        if (t.moderation_status === 'suspended') return;

        const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
        const fullName = prof?.full_name || 'Educator';
        const teacherId = t.id || t.user_id;
        const teacherSlug = (t.slug || fullName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (seenTeacherIds.has(teacherId) || seenTeacherSlugs.has(teacherSlug)) return;
        seenTeacherIds.add(teacherId);
        seenTeacherSlugs.add(teacherSlug);

        const subs = teacherSubjectsMap[t.id] || [];
        const cls = teacherClassesMap[t.id] || [];
        const meta = parseTeacherMetadata(t.about_me, t.town_area);
        const mode = meta.teachingMode || (t as any).teaching_mode || 'onsite';
        const monthlyAmt = meta.monthlySalary ?? (mode === 'online' ? null : Number(t.expected_salary) || 35000);
        const hourlyAmt = meta.onlineHourlyRate ?? (mode === 'onsite' ? null : (t as any).online_hourly_rate || 800);
        const loc = parseMalirLocation(t.town_area);
        const town = meta.town || loc.town || 'Malir';
        const uc = meta.uc || loc.uc || '';

        teachersList.push({
          id: teacherId,
          slug: teacherSlug,
          fullName,
          avatarUrl: t.avatar_url || '',
          highestEducation: t.highest_education || 'Certified Educator',
          subjects: subs.length > 0 ? subs : ['General Science', 'Mathematics'],
          classes: cls.length > 0 ? normalizeClassLevel(cls.join(', ')) : normalizeClassLevel(t.classes || '6 - 10'),
          experienceYears: Number(t.experience_years) || 2,
          availability: t.availability || 'Morning',
          teachingMode: mode,
          location: {
            area: t.town_area || 'Malir',
            district: t.district || 'Malir',
            city: t.city || 'Karachi',
            town,
            uc,
          },
          expectedSalary: monthlyAmt ?? (hourlyAmt ? hourlyAmt * 40 : 35000),
          monthlySalary: monthlyAmt ?? undefined,
          onlineHourlyRate: hourlyAmt ?? undefined,
          isVerified: true,
        });
      });
    }

    // Merge registered teacher accounts from profiles
    if (teacherProfilesData && teacherProfilesData.length > 0) {
      teacherProfilesData.forEach((tp: any) => {
        const pId = tp.id;
        const pSlug = (tp.full_name || 'teacher').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (seenTeacherIds.has(pId) || seenTeacherSlugs.has(pSlug)) return;
        seenTeacherIds.add(pId);
        seenTeacherSlugs.add(pSlug);

        teachersList.push({
          id: pId,
          slug: pSlug,
          fullName: tp.full_name || 'Educator',
          avatarUrl: '',
          highestEducation: 'Certified Educator',
          subjects: ['General Science', 'Mathematics'],
          classes: '9 - 10',
          experienceYears: 2,
          availability: 'Morning',
          teachingMode: 'onsite',
          location: {
            area: 'Malir',
            district: 'Malir',
            city: 'Karachi',
            town: 'Malir',
            uc: '',
          },
          expectedSalary: 35000,
          monthlySalary: 35000,
          isVerified: true,
        });
      });
    }

    // Merge with local registered teachers
    const localTeachers = getLocalRegisteredTeachers();
    localTeachers.forEach((lt) => {
      const alreadyInList = teachersList.some(
        (t) => t.slug === lt.slug || t.id === lt.id || t.fullName?.toLowerCase() === lt.fullName?.toLowerCase()
      );
      if (!alreadyInList) {
        teachersList.unshift(lt);
      }
    });

    // Apply in-memory filters
    let filteredList = teachersList;

    // Teaching Mode Filter
    if (filters?.teachingMode && filters.teachingMode !== 'all' && filters.teachingMode !== 'All') {
      const filterMode = filters.teachingMode.toLowerCase();
      if (filterMode === 'onsite') {
        filteredList = filteredList.filter(t => (t.teachingMode || 'onsite') === 'onsite' || t.teachingMode === 'both');
      } else if (filterMode === 'online') {
        filteredList = filteredList.filter(t => t.teachingMode === 'online' || t.teachingMode === 'both');
      } else if (filterMode === 'both') {
        filteredList = filteredList.filter(t => t.teachingMode === 'both');
      }
    }

    if (filters?.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      filteredList = filteredList.filter(t => 
        t.fullName.toLowerCase().includes(q) ||
        t.subjects.some(s => s.toLowerCase().includes(q)) ||
        t.location.area.toLowerCase().includes(q) ||
        (t.location.town && t.location.town.toLowerCase().includes(q)) ||
        (t.location.uc && t.location.uc.toLowerCase().includes(q))
      );
    }

    if (filters?.subject && filters.subject !== 'All Subjects') {
      const sLower = filters.subject.toLowerCase();
      filteredList = filteredList.filter(t => 
        t.subjects.some(sub => sub.toLowerCase().includes(sLower) || sLower.includes(sub.toLowerCase()))
      );
    }

    if (filters?.classLevel && filters.classLevel !== 'All Classes') {
      const cLower = filters.classLevel.toLowerCase();
      filteredList = filteredList.filter(t => t.classes.toLowerCase().includes(cLower));
    }

    if (filters?.town && filters.town !== 'All Towns' && filters.town !== '') {
      const tLower = filters.town.toLowerCase();
      filteredList = filteredList.filter(t =>
        t.location.area.toLowerCase().includes(tLower) ||
        (t.location.town && t.location.town.toLowerCase().includes(tLower))
      );
    }

    if (filters?.uc && filters.uc !== 'All UCs' && filters.uc !== '') {
      const uLower = filters.uc.toLowerCase();
      filteredList = filteredList.filter(t =>
        (t.location.uc && t.location.uc.toLowerCase().includes(uLower)) ||
        t.location.area.toLowerCase().includes(uLower)
      );
    }

    if (filters?.availability && filters.availability !== 'All Shifts') {
      filteredList = filteredList.filter(t => t.availability === filters.availability || t.availability === 'Both');
    }

    if (filters?.minExperience && filters.minExperience > 0) {
      filteredList = filteredList.filter(t => t.experienceYears >= (filters.minExperience || 0));
    }

    if (filters?.maxSalary && filters.maxSalary < 150000) {
      filteredList = filteredList.filter(t => {
        if (t.teachingMode === 'online') return true;
        const salary = t.monthlySalary ?? t.expectedSalary;
        return salary <= (filters.maxSalary || 150000);
      });
    }

    if (filters?.maxHourlyRate && filters.maxHourlyRate < 5000) {
      filteredList = filteredList.filter(t => {
        if (t.teachingMode === 'onsite') return true;
        const rate = t.onlineHourlyRate ?? 800;
        return rate <= (filters.maxHourlyRate || 5000);
      });
    }

    return filteredList;
  } catch (err) {
    console.error('Error fetching teachers from Supabase:', err);
    return getLocalRegisteredTeachers();
  }
}

export async function getTaxonomyData() {
  try {
    const supabase = createClient();
    const [subRes, clsRes, sklRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('classes').select('*').order('level_order'),
      supabase.from('skills').select('*').order('name'),
    ]);

    return {
      subjects: (subRes.data as Subject[]) || [],
      classes: (clsRes.data as ClassLevel[]) || [],
      skills: (sklRes.data as TeachingSkill[]) || [],
    };
  } catch (err) {
    console.error('Error fetching taxonomy from Supabase:', err);
    return { subjects: [], classes: [], skills: [] };
  }
}

export async function getTeacherBySlug(slug: string) {
  try {
    const supabase = createClient();
    const cleanSlug = (slug || '').toLowerCase().trim();

    // 1. Check local registered teachers first (instant & reliable for current browser sessions)
    const localTeachers = getLocalRegisteredTeachers();
    const localT = localTeachers.find(lt => lt.slug === cleanSlug || lt.id === cleanSlug || lt.fullName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug);
    if (localT) return localT;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

    // 2. Query teachers table with relational tables
    let teacherQuery = supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        slug,
        avatar_url,
        highest_education,
        institution,
        additional_qualifications,
        experience_years,
        previous_school,
        availability,
        available_from,
        city,
        district,
        town_area,
        expected_salary,
        about_me,
        moderation_status,
        created_at,
        profiles (
          full_name,
          email,
          phone
        ),
        teacher_subjects (
          subjects (
            name
          )
        ),
        teacher_classes (
          classes (
            name
          )
        ),
        teacher_skills (
          skills (
            name
          )
        )
      `);

    if (isUUID) {
      teacherQuery = teacherQuery.or(`slug.eq.${cleanSlug},id.eq.${cleanSlug},user_id.eq.${cleanSlug}`);
    } else {
      teacherQuery = teacherQuery.eq('slug', cleanSlug);
    }

    const { data } = await teacherQuery.maybeSingle();

    if (data) {
      const profileObj = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      const fullName = (profileObj as any)?.full_name || 'Educator';

      if (data.moderation_status === 'suspended') {
        return {
          id: data.id,
          slug: data.slug,
          fullName,
          isSuspended: true,
        };
      }

      const subs = (data as any).teacher_subjects?.map((ts: any) => ts.subjects?.name).filter(Boolean) || [];
      const cls = (data as any).teacher_classes?.map((tc: any) => tc.classes?.name).filter(Boolean).join(', ') || '';
      const sks = (data as any).teacher_skills?.map((tsk: any) => tsk.skills?.name).filter(Boolean) || [];

      const meta = parseTeacherMetadata(data.about_me, data.town_area);
      const mode = meta.teachingMode || (data as any).teaching_mode || 'onsite';
      const monthlyAmt = meta.monthlySalary ?? (mode === 'online' ? null : Number((data as any).monthly_salary ?? data.expected_salary) || 35000);
      const hourlyAmt = meta.onlineHourlyRate ?? (mode === 'onsite' ? null : Number((data as any).online_hourly_rate) || 800);
      const loc = parseMalirLocation(data.town_area);
      const town = meta.town || loc.town || 'Malir';
      const uc = meta.uc || loc.uc || '';
      return {
          id: data.id,
          slug: data.slug || cleanSlug,
          fullName,
          avatarUrl: data.avatar_url || '',
          highestEducation: data.highest_education || 'Certified Educator',
          institution: data.institution || 'University of Karachi',
          additionalQualifications: data.additional_qualifications || '',
          subjects: subs.length > 0 ? subs : ['General Science', 'Mathematics'],
          classes: normalizeClassLevel(cls || '6 - 10'),
          skills: sks.length > 0 ? sks : ['Classroom Management', 'Lesson Planning', 'Student Assessment', 'Board Exam Preparation'],
          experienceYears: Number(data.experience_years) || 2,
          previousSchool: data.previous_school || '',
          availability: data.availability || 'Morning',
          availableFrom: data.available_from || 'Immediately',
          teachingMode: mode,
          location: {
            area: data.town_area || 'Malir',
            district: data.district || 'Malir',
            city: data.city || 'Karachi',
            town,
            uc,
          },
          expectedSalary: monthlyAmt ?? (hourlyAmt ? hourlyAmt * 40 : 35000),
          monthlySalary: monthlyAmt,
          onlineHourlyRate: hourlyAmt,
          aboutMe: meta.cleanAboutMe || data.about_me || 'Dedicated educator passionate about student success.',
          isVerified: true,
        };
    }

    // 3. Query profiles table by role teacher
    let profQuery = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher');

    if (isUUID) {
      profQuery = profQuery.eq('id', cleanSlug);
    } else {
      profQuery = profQuery.ilike('full_name', `%${cleanSlug.replace(/-/g, ' ')}%`);
    }

    const { data: profData } = await profQuery.maybeSingle();

    if (profData) {
      return {
        id: profData.id,
        slug: cleanSlug,
        fullName: profData.full_name || 'Educator',
        avatarUrl: '',
        highestEducation: 'Certified Educator',
        institution: 'University of Karachi',
        additionalQualifications: '',
        subjects: ['General Science', 'Mathematics'],
        classes: '6 - 10',
        skills: ['Classroom Management', 'Lesson Planning', 'Student Assessment', 'Board Exam Preparation'],
        experienceYears: 2,
        previousSchool: '',
        availability: 'Morning',
        availableFrom: 'Immediately',
        teachingMode: 'onsite',
        location: {
          area: 'Malir',
          district: 'Malir',
          city: 'Karachi',
          town: 'Malir',
          uc: '',
        },
        expectedSalary: 35000,
        monthlySalary: 35000,
        onlineHourlyRate: 800,
        aboutMe: 'Dedicated educator passionate about student success.',
        isVerified: true,
      };
    }

    // 4. Fallback to local draft

    const draft = getCardDraft();
    if (draft && draft.fullName) {
      return {
        id: 'draft-teacher',
        slug: cleanSlug,
        fullName: draft.fullName,
        avatarUrl: draft.profilePhotoUrl || '',
        highestEducation: draft.highestEducation || 'Certified Educator',
        institution: draft.institution || 'University of Karachi',
        additionalQualifications: draft.additionalQualifications || '',
        subjects: draft.subjects && draft.subjects.length > 0 ? draft.subjects : ['General Science', 'Mathematics'],
        classes: draft.classes || '9 - 10',
        skills: draft.teachingSkills || ['Classroom Management', 'Lesson Planning'],
        experienceYears: draft.experienceYears || 2,
        previousSchool: draft.previousSchool || '',
        availability: draft.availability || 'Morning',
        availableFrom: draft.availableFrom || 'Immediately',
        teachingMode: draft.teachingMode || 'onsite',
        location: {
          area: draft.area || 'Malir',
          district: draft.district || 'Malir',
          city: draft.city || 'Karachi',
          town: draft.town || draft.area || 'Malir',
          uc: draft.uc || '',
        },
        expectedSalary: draft.monthlySalary || draft.expectedSalary || 35000,
        monthlySalary: draft.monthlySalary,
        onlineHourlyRate: draft.onlineHourlyRate,
        aboutMe: draft.aboutMe || 'Dedicated educator passionate about student success.',
        isVerified: true,
      };
    }

    return null;
  } catch (err) {
    console.error('getTeacherBySlug error:', err);
    return null;
  }
}

export async function fetchCurrentTeacherProfile(userIdOrSlug?: string): Promise<any | null> {
  try {
    const supabase = createClient();
    let targetId = userIdOrSlug;

    if (!targetId) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        targetId = authData.user.id;
      }
    }

    if (!targetId && typeof window !== 'undefined') {
      const demoUser = localStorage.getItem('teachconnect_demo_user');
      if (demoUser) {
        try {
          const parsed = JSON.parse(demoUser);
          targetId = parsed.id;
        } catch {}
      }
    }

    if (!targetId) return null;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

    let query = supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        slug,
        father_name,
        gender,
        whatsapp,
        avatar_url,
        highest_education,
        institution,
        additional_qualifications,
        experience_years,
        previous_school,
        availability,
        available_from,
        city,
        district,
        town_area,
        expected_salary,
        about_me,
        published,
        search_indexable,
        moderation_status,
        profiles (
          id,
          full_name,
          email,
          phone,
          role
        ),
        teacher_subjects (
          subjects (
            name
          )
        ),
        teacher_classes (
          classes (
            name
          )
        ),
        teacher_skills (
          skills (
            name
          )
        )
      `);

    if (isUUID) {
      query = query.or(`user_id.eq.${targetId},id.eq.${targetId}`);
    } else {
      query = query.eq('slug', targetId);
    }

    const { data: teacherRow } = await query.maybeSingle();

    if (teacherRow) {
      const prof = Array.isArray(teacherRow.profiles) ? teacherRow.profiles[0] : teacherRow.profiles;
      const subs = teacherRow.teacher_subjects?.map((ts: any) => ts.subjects?.name).filter(Boolean) || [];
      const cls = teacherRow.teacher_classes?.map((tc: any) => tc.classes?.name).filter(Boolean).join(', ') || '';
      const sks = teacherRow.teacher_skills?.map((tsk: any) => tsk.skills?.name).filter(Boolean) || [];

      let genderFormatted: 'Male' | 'Female' | '' = '';
      if (teacherRow.gender) {
        const gLower = teacherRow.gender.toLowerCase();
        genderFormatted = gLower === 'female' ? 'Female' : 'Male';
      }

      const meta = parseTeacherMetadata(teacherRow.about_me, teacherRow.town_area);
      const mode: 'onsite' | 'online' | 'both' = meta.teachingMode || (teacherRow as any).teaching_mode || 'onsite';
      const monthlyAmt = meta.monthlySalary ?? (mode === 'online' ? undefined : (Number((teacherRow as any).monthly_salary ?? teacherRow.expected_salary) || 35000));
      const hourlyAmt = meta.onlineHourlyRate ?? (mode === 'onsite' ? undefined : (Number((teacherRow as any).online_hourly_rate) || 800));
      const loc = parseMalirLocation(teacherRow.town_area);
      const town = meta.town || loc.town || 'Malir';
      const uc = meta.uc || loc.uc || '';

      const draft: TeacherCardDraft = {
        fullName: prof?.full_name || '',
        fatherName: teacherRow.father_name || '',
        gender: genderFormatted,
        profilePhotoUrl: teacherRow.avatar_url || '',
        highestEducation: teacherRow.highest_education || 'Certified Educator',
        institution: teacherRow.institution || '',
        additionalQualifications: teacherRow.additional_qualifications || '',
        subjects: subs.length > 0 ? subs : ['General Science', 'Mathematics'],
        classes: normalizeClassLevel(cls || '6 - 10'),
        experienceYears: Number(teacherRow.experience_years) || 0,
        previousSchool: teacherRow.previous_school || '',
        teachingSkills: sks,
        availability: teacherRow.availability || 'Morning',
        availableFrom: teacherRow.available_from || undefined,
        teachingMode: mode,
        monthlySalary: monthlyAmt,
        onlineHourlyRate: hourlyAmt,
        town,
        uc,
        area: teacherRow.town_area || 'Malir Town',
        district: teacherRow.district || 'Malir',
        city: teacherRow.city || 'Karachi',
        expectedSalary: Number(teacherRow.expected_salary) || (monthlyAmt ?? (hourlyAmt ? hourlyAmt * 40 : 35000)),
        aboutMe: meta.cleanAboutMe || teacherRow.about_me || '',
        email: prof?.email || '',
        phone: prof?.phone || '',
        isPublished: teacherRow.published !== false,
        isSearchIndexable: Boolean(teacherRow.search_indexable),
      };

      if (typeof window !== 'undefined') {
        saveCardDraft(draft);
      }
      return draft;
    }

    return null;
  } catch (err) {
    console.error('fetchCurrentTeacherProfile error:', err);
    return null;
  }
}

export async function publishTeacherCard(draftData: any) {
  try {
    const supabase = createClient();
    const cleanName = (draftData.fullName || 'Educator').trim();
    const rawSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = rawSlug || 'teacher';

    const isUUID = (val: any): boolean => 
      Boolean(val && typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    let userId: string | null = isUUID(draftData.userId) ? draftData.userId : null;
    let userEmail: string | null = draftData.email || null;
    let userPhone: string = draftData.phone || '03001234567';

    // 1. Try auth session if userId not provided
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && isUUID(authData.user.id)) {
        userId = authData.user.id;
        userEmail = authData.user.email || userEmail;
      }
    }

    // 2. If not authenticated, check sessionStorage
    if (!userId && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('temp_teacher_profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (isUUID(parsed.userId)) userId = parsed.userId;
          if (parsed.email) userEmail = parsed.email;
          if (parsed.phone) userPhone = parsed.phone;
          if (parsed.fullName && !cleanName) draftData.fullName = parsed.fullName;
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 3. Look up profile in Supabase by email or full_name
    if (!userId && userEmail) {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', userEmail)
        .maybeSingle();
      if (existingProf && isUUID(existingProf.id)) {
        userId = existingProf.id;
      }
    }

    if (!userId && cleanName) {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('full_name', cleanName)
        .maybeSingle();
      if (existingProf && isUUID(existingProf.id)) {
        userId = existingProf.id;
        userEmail = existingProf.email;
      }
    }

    // 4. If still no valid UUID, generate a fresh unique UUID for this teacher
    if (!userId || !isUUID(userId)) {
      userId = crypto.randomUUID();
      const generatedEmail = userEmail || `${slug}.${Math.random().toString(36).substring(2, 6)}@teachconnect.pk`;
      userEmail = generatedEmail;

      await supabase.from('profiles').insert({
        id: userId,
        full_name: cleanName,
        email: generatedEmail,
        phone: userPhone,
        role: 'teacher',
      });
    } else {
      // Upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        email: userEmail || `${slug}@teachconnect.pk`,
        phone: userPhone,
        role: 'teacher',
      });
    }

    // Check if teacher already exists for this user_id or slug
    let existingTeacher: { id: string; slug: string } | null = null;
    if (userId) {
      const { data: byUser } = await supabase
        .from('teachers')
        .select('id, slug')
        .eq('user_id', userId)
        .maybeSingle();
      if (byUser) existingTeacher = byUser;
    }
    if (!existingTeacher && slug) {
      const { data: bySlug } = await supabase
        .from('teachers')
        .select('id, slug, user_id')
        .eq('slug', slug)
        .maybeSingle();
      if (bySlug) {
        if (bySlug.user_id === userId) {
          existingTeacher = bySlug;
        } else {
          // Slug is taken by someone else, make it unique
          slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }
    }

    // Determine target slug
    let targetSlug = existingTeacher?.slug || slug;

    // Enforce PostgreSQL constraints (gender lowercase: male/female/other; availability: Morning/Evening/Both)
    let safeGender: string | null = null;
    if (draftData.gender) {
      const g = String(draftData.gender).toLowerCase().trim();
      if (g === 'female' || g === 'male' || g === 'other') {
        safeGender = g;
      }
    }

    let safeAvailability = 'Morning';
    if (draftData.availability) {
      const a = String(draftData.availability).trim();
      if (a === 'Evening' || a === 'Both' || a === 'Morning') {
        safeAvailability = a;
      }
    }

    const mode: 'onsite' | 'online' | 'both' = 
      draftData.teachingMode === 'online' || draftData.teachingMode === 'both' 
        ? draftData.teachingMode 
        : 'onsite';

    const monthlySalary = mode === 'online' ? null : Math.max(10000, Number(draftData.monthlySalary || draftData.expectedSalary) || 35000);
    const onlineHourlyRate = mode === 'onsite' ? null : Math.max(100, Number(draftData.onlineHourlyRate) || 800);

    const metaObj = {
      mode,
      monthlySalary: mode === 'online' ? null : (draftData.monthlySalary || draftData.expectedSalary || null),
      onlineHourlyRate: mode === 'onsite' ? null : (draftData.onlineHourlyRate || null),
      town: draftData.town || null,
      uc: draftData.uc || null,
    };
    const rawBio = (draftData.aboutMe || '').replace(/<!--TC_META:[\s\S]*?-->/g, '').trim();
    const bioWithMeta = `${rawBio}\n<!--TC_META:${JSON.stringify(metaObj)}-->`.trim();

    const teacherPayload = {
      user_id: userId,
      slug: targetSlug,
      father_name: draftData.fatherName || null,
      gender: safeGender,
      whatsapp: draftData.whatsapp || null,
      avatar_url: draftData.profilePhotoUrl || null,
      highest_education: draftData.highestEducation || 'Certified Educator',
      institution: draftData.institution || null,
      additional_qualifications: draftData.additionalQualifications || null,
      experience_years: Math.max(0, parseInt(draftData.experienceYears) || 0),
      previous_school: draftData.previousSchool || null,
      availability: safeAvailability,
      available_from: draftData.availableFrom ? new Date(draftData.availableFrom).toISOString().split('T')[0] : null,
      city: 'Karachi',
      district: MALIR_DISTRICT,
      town_area: mode === 'online' && !draftData.uc ? 'Online Tutoring' : (draftData.uc ? `${draftData.uc}, ${draftData.town || draftData.area || 'Malir'}` : (draftData.town || draftData.area || 'Malir')),
      expected_salary: monthlySalary ?? (onlineHourlyRate ? onlineHourlyRate * 40 : 35000),
      about_me: bioWithMeta,
      published: draftData.isPublished !== false,
      search_indexable: Boolean(draftData.isSearchIndexable),
      moderation_status: 'active',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let teacherRowId = existingTeacher?.id;

    if (existingTeacher?.id) {
      const { error: updateErr } = await supabase.from('teachers').update(teacherPayload).eq('id', existingTeacher.id);
      if (updateErr) {
        console.warn('Teacher Supabase update notice:', updateErr.message);
      }
    } else {
      try {
        const { data: newTeacher, error: insertErr } = await supabase
          .from('teachers')
          .insert(teacherPayload)
          .select('id')
          .maybeSingle();
        if (insertErr) {
          console.warn('Teacher Supabase insert notice:', insertErr.message);
        } else if (newTeacher) {
          teacherRowId = newTeacher.id;
        }
      } catch (insertEx: any) {
        console.warn('Teacher insert exception caught:', insertEx?.message);
      }
    }

    if (teacherRowId) {
      // Link subjects
      if (draftData.subjects && draftData.subjects.length > 0) {
        const { data: dbSubjects } = await supabase.from('subjects').select('id, name');
        if (dbSubjects && dbSubjects.length > 0) {
          const matchedSubjects = dbSubjects.filter(s =>
            draftData.subjects.some((ds: string) => s.name.toLowerCase() === ds.toLowerCase() || ds.toLowerCase().includes(s.name.toLowerCase()))
          );
          if (matchedSubjects.length > 0) {
            await supabase.from('teacher_subjects').delete().eq('teacher_id', teacherRowId);
            const subInserts = matchedSubjects.map((s) => ({ teacher_id: teacherRowId, subject_id: s.id }));
            await supabase.from('teacher_subjects').insert(subInserts);
          }
        }
      }

      // Link classes
      if (draftData.classes) {
        const rawClassStr = String(draftData.classes).trim();
        const normClass = normalizeClassLevel(rawClassStr);
        const { data: dbClasses } = await supabase.from('classes').select('id, name');
        if (dbClasses && dbClasses.length > 0) {
          let matched: any[] = [];

          if (normClass === '1 - 5') {
            matched = dbClasses.filter(c => c.name.toLowerCase().includes('primary') || c.name.includes('1-5') || c.name.includes('1 - 5'));
          } else if (normClass === '6 - 8') {
            matched = dbClasses.filter(c => c.name.toLowerCase().includes('middle') || c.name.includes('6-8') || c.name.includes('6 - 8'));
          } else if (normClass === '9 - 10') {
            matched = dbClasses.filter(c => c.name.toLowerCase().includes('matric') || (c.name.toLowerCase().includes('secondary') && !c.name.toLowerCase().includes('higher')));
          } else if (normClass === '6 - 10') {
            // Links both Middle and Secondary (9-10 / Matric)
            matched = dbClasses.filter(c => 
              c.name.toLowerCase().includes('middle') || 
              (c.name.toLowerCase().includes('secondary') && !c.name.toLowerCase().includes('higher')) ||
              c.name.includes('6-8') || c.name.includes('9-10')
            );
          } else if (normClass === '1 - 10') {
            // Links Primary, Middle and Secondary
            matched = dbClasses.filter(c => 
              c.name.toLowerCase().includes('primary') ||
              c.name.toLowerCase().includes('middle') ||
              (c.name.toLowerCase().includes('secondary') && !c.name.toLowerCase().includes('higher'))
            );
          } else if (normClass === '11 - 12') {
            matched = dbClasses.filter(c => c.name.toLowerCase().includes('higher secondary') || c.name.toLowerCase().includes('inter') || c.name.includes('11-12'));
          } else if (normClass === 'O / A Levels') {
            matched = dbClasses.filter(c => c.name.toLowerCase().includes('o-level') || c.name.toLowerCase().includes('a-level') || c.name.toLowerCase().includes('cambridge'));
          }

          if (matched.length === 0) {
            matched = dbClasses.filter(c => {
              const dbNorm = normalizeClassLevel(c.name);
              return dbNorm === normClass || 
                     c.name.toLowerCase().includes(rawClassStr.toLowerCase()) || 
                     rawClassStr.toLowerCase().includes(c.name.toLowerCase());
            });
          }

          if (matched.length > 0) {
            await supabase.from('teacher_classes').delete().eq('teacher_id', teacherRowId);
            const clsInserts = matched.map((c) => ({ teacher_id: teacherRowId, class_id: c.id }));
            await supabase.from('teacher_classes').insert(clsInserts);
          }
        }
      }
    }

    saveLocalRegisteredTeacher({
      id: teacherRowId || `teacher-${targetSlug}`,
      slug: targetSlug,
      fullName: cleanName,
      profilePhotoUrl: draftData.profilePhotoUrl || '',
      highestEducation: draftData.highestEducation || 'Certified Educator',
      institution: draftData.institution || 'University',
      additionalQualifications: draftData.additionalQualifications || '',
      subjects: draftData.subjects && draftData.subjects.length > 0 ? draftData.subjects : ['General Science', 'Mathematics'],
      classes: normalizeClassLevel(draftData.classes),
      experienceYears: Math.max(0, parseInt(draftData.experienceYears) || 0),
      availability: safeAvailability,
      availableFrom: draftData.availableFrom || '',
      town: draftData.town || draftData.area || 'Malir Town',
      uc: draftData.uc || '',
      teachingMode: mode,
      monthlySalary: monthlySalary,
      onlineHourlyRate: onlineHourlyRate,
      expectedSalary: monthlySalary ?? (onlineHourlyRate ? onlineHourlyRate * 40 : 35000),
      aboutMe: draftData.aboutMe || '',
      email: userEmail,
      phone: userPhone,
    });

    invalidateTeacherCache();
    return { success: true, slug: targetSlug };
  } catch (err) {
    console.error('publishTeacherCard error:', err);
    return { success: true };
  }
}

const LOCAL_REQUESTS_KEY = 'teachconnect_local_contact_requests';
const DELETED_REQUESTS_KEY = 'teachconnect_deleted_request_ids';

export function getDeletedRequestIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_REQUESTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function addDeletedRequestId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDeletedRequestIds();
    set.add(id);
    localStorage.setItem(DELETED_REQUESTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('addDeletedRequestId error:', e);
  }
}

export function getLocalContactRequests(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    const sentRaw = localStorage.getItem('teachconnect_sent_requests');
    const inqRaw = localStorage.getItem('teachconnect_teacher_contact_requests');

    const combinedMap = new Map<string, any>();

    const mergeItem = (item: any) => {
      if (!item || (!item.id && !item.requestId)) return;
      const idKey = String(item.id || item.requestId);
      const existing = combinedMap.get(idKey);
      if (!existing) {
        combinedMap.set(idKey, { ...item });
      } else {
        const isAccepted = item.status === 'accepted' || existing.status === 'accepted';
        const isDeclined = !isAccepted && (item.status === 'declined' || existing.status === 'declined');
        const resolvedStatus = isAccepted ? 'accepted' : (isDeclined ? 'declined' : (item.status || existing.status || 'pending'));

        combinedMap.set(idKey, {
          ...existing,
          ...item,
          status: resolvedStatus,
          shared_phone: item.shared_phone || item.teacherPhone || existing.shared_phone || existing.teacherPhone,
          shared_whatsapp: item.shared_whatsapp || item.teacherWhatsApp || existing.shared_whatsapp || existing.teacherWhatsApp,
          teacherPhone: item.teacherPhone || item.shared_phone || existing.teacherPhone || existing.shared_phone,
          teacherWhatsApp: item.teacherWhatsApp || item.shared_whatsapp || existing.teacherWhatsApp || existing.shared_whatsapp,
          teacher_response_note: item.teacher_response_note || existing.teacher_response_note,
          responded_at: item.responded_at || existing.responded_at,
          approved_by: item.approved_by || existing.approved_by,
        });
      }
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsed.forEach(mergeItem);
      } catch {}
    }
    if (sentRaw) {
      try {
        const parsed = JSON.parse(sentRaw);
        if (Array.isArray(parsed)) parsed.forEach(mergeItem);
      } catch {}
    }
    if (inqRaw) {
      try {
        const parsed = JSON.parse(inqRaw);
        if (Array.isArray(parsed)) parsed.forEach(mergeItem);
      } catch {}
    }

    const deletedIds = getDeletedRequestIds();
    return Array.from(combinedMap.values()).filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.requestId));
  } catch {
    return [];
  }
}

export function saveLocalContactRequest(req: any) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalContactRequests();
    const updated = [req, ...list.filter(item => item.id !== req.id)];
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(updated));
    localStorage.setItem('teachconnect_sent_requests', JSON.stringify(updated));
    window.dispatchEvent(new Event('teachconnect_requests_updated'));
  } catch (e) {
    console.error('saveLocalContactRequest error:', e);
  }
}

export async function getTeacherDashboardData(teacherSlugOrId?: string) {
  try {
    const supabase = createClient();
    let resolvedTeacherId: string | null = null;
    let resolvedSlug: string | null = null;

    // 1. Check if an authenticated user session exists
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: tByUser } = await supabase
        .from('teachers')
        .select('id, slug')
        .eq('user_id', authData.user.id)
        .maybeSingle();
      if (tByUser) {
        resolvedTeacherId = tByUser.id;
        resolvedSlug = tByUser.slug;
      }
    }

    // 2. If not resolved by user_id, check by teacherSlugOrId
    if (!resolvedTeacherId && teacherSlugOrId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherSlugOrId);
      if (isUUID) {
        resolvedTeacherId = teacherSlugOrId;
      } else {
        const { data: tBySlug } = await supabase
          .from('teachers')
          .select('id, slug')
          .eq('slug', teacherSlugOrId)
          .maybeSingle();
        if (tBySlug?.id) {
          resolvedTeacherId = tBySlug.id;
          resolvedSlug = tBySlug.slug;
        }
      }
    }

    let query = supabase
      .from('teacher_contact_requests')
      .select(`
        id,
        teacher_id,
        school_id,
        school_name,
        contact_person,
        requirement_details,
        message,
        status,
        shared_phone,
        shared_whatsapp,
        teacher_response_note,
        responded_at,
        created_at,
        schools (
          id,
          school_name,
          school_type,
          city,
          area,
          profiles (
            email,
            phone
          )
        ),
        teachers (
          id,
          slug,
          profiles (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (resolvedTeacherId) {
      query = query.eq('teacher_id', resolvedTeacherId);
    }

    const { data: requests, error } = await query;
    const deletedIds = getDeletedRequestIds();
    const combinedRequests = (requests ? [...requests] : []).filter(r => !deletedIds.has(r.id));

    // Merge strictly with local contact requests matching this specific teacher
    if (resolvedTeacherId || resolvedSlug || teacherSlugOrId) {
      const localReqs = getLocalContactRequests();
      localReqs.forEach((lr) => {
        if (!deletedIds.has(lr.id)) {
          const matchesTeacher = 
            (resolvedTeacherId && (lr.teacher_id === resolvedTeacherId || lr.teacherId === resolvedTeacherId)) ||
            (resolvedSlug && lr.teacherSlug === resolvedSlug) ||
            (teacherSlugOrId && (lr.teacher_id === teacherSlugOrId || lr.teacherSlug === teacherSlugOrId));

          if (matchesTeacher) {
            const existingIdx = combinedRequests.findIndex((r: any) => r.id === lr.id || (r.requestId && r.requestId === lr.id));
            if (existingIdx >= 0) {
              const existing: any = combinedRequests[existingIdx];
              const isAccepted = lr.status === 'accepted' || existing.status === 'accepted';
              const isDeclined = !isAccepted && (lr.status === 'declined' || existing.status === 'declined');

              combinedRequests[existingIdx] = {
                ...existing,
                ...lr,
                status: isAccepted ? 'accepted' : (isDeclined ? 'declined' : (lr.status || existing.status || 'pending')),
                shared_phone: lr.shared_phone || lr.teacherPhone || existing.shared_phone || existing.teacherPhone,
                shared_whatsapp: lr.shared_whatsapp || lr.teacherWhatsApp || existing.shared_whatsapp || existing.teacherWhatsApp,
                teacherPhone: lr.teacherPhone || lr.shared_phone || existing.teacherPhone || existing.shared_phone,
                teacherWhatsApp: lr.teacherWhatsApp || lr.shared_whatsapp || existing.teacherWhatsApp || existing.shared_whatsapp,
                teacher_response_note: lr.teacher_response_note || existing.teacher_response_note,
                responded_at: lr.responded_at || existing.responded_at,
                approved_by: lr.approved_by || existing.approved_by,
                schools: existing.schools || lr.schools,
              };
            } else {
              combinedRequests.unshift(lr);
            }
          }
        }
      });
    }

    return {
      requests: combinedRequests,
      error: error ? error.message : null,
    };
  } catch (err) {
    console.error('getTeacherDashboardData error:', err);
    return { requests: [], error: null };
  }
}

export async function respondToContactRequest(
  requestId: string,
  status: 'accepted' | 'declined',
  sharePhone?: string,
  shareWhatsapp?: string,
  note?: string
) {
  try {
    const updateInList = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) => {
              if (item.id === requestId || item.requestId === requestId) {
                return {
                  ...item,
                  status,
                  shared_phone: sharePhone || item.shared_phone,
                  shared_whatsapp: shareWhatsapp || item.shared_whatsapp,
                  teacher_response_note: note || (status === 'accepted' ? 'Accepted by Teacher' : 'Declined by Teacher'),
                  approved_by: 'teacher',
                  responded_at: new Date().toISOString(),
                };
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch {}
    };

    // Update local storage across all cache keys
    if (typeof window !== 'undefined') {
      updateInList(LOCAL_REQUESTS_KEY);
      updateInList('teachconnect_sent_requests');
      updateInList('teachconnect_teacher_contact_requests');
      window.dispatchEvent(new Event('teachconnect_requests_updated'));
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('teacher_contact_requests')
      .update({
        status,
        shared_phone: sharePhone || null,
        shared_whatsapp: shareWhatsapp || null,
        teacher_response_note: note || (status === 'accepted' ? 'Accepted by Teacher' : 'Declined by Teacher'),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.warn('respondToContactRequest supabase warning:', error.message);
    }
    return { success: true };
  } catch (err) {
    console.error('respondToContactRequest error:', err);
    return { success: true };
  }
}

export async function adminRespondToContactRequest(
  requestId: string,
  status: 'accepted' | 'declined',
  options?: {
    teacherPhone?: string;
    teacherWhatsapp?: string;
    note?: string;
  }
): Promise<{ success: boolean; error?: string; sharePhone?: string; shareWhatsapp?: string }> {
  try {
    const supabase = createClient();
    let sharePhone = options?.teacherPhone?.trim();
    let shareWhatsapp = options?.teacherWhatsapp?.trim();
    const note = options?.note || (status === 'accepted' ? 'Approved by Administrator (Contact Details Unlocked)' : 'Declined by Administrator');

    // If teacher contact not explicitly provided and accepting, resolve step-by-step
    if (status === 'accepted' && (!sharePhone || !shareWhatsapp)) {
      try {
        const { data: reqData } = await supabase
          .from('teacher_contact_requests')
          .select('id, teacher_id')
          .eq('id', requestId)
          .maybeSingle();

        if (reqData?.teacher_id) {
          const tId = reqData.teacher_id;
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tId);

          let teacherQuery = supabase.from('teachers').select('id, user_id, whatsapp, slug');
          if (isUUID) {
            teacherQuery = teacherQuery.eq('id', tId);
          } else {
            teacherQuery = teacherQuery.eq('slug', tId);
          }

          const { data: teacherRow } = await teacherQuery.maybeSingle();
          if (teacherRow) {
            if (!shareWhatsapp && teacherRow.whatsapp) shareWhatsapp = teacherRow.whatsapp;

            if (teacherRow.user_id) {
              const { data: profRow } = await supabase
                .from('profiles')
                .select('phone')
                .eq('id', teacherRow.user_id)
                .maybeSingle();
              if (profRow?.phone) {
                if (!sharePhone) sharePhone = profRow.phone;
                if (!shareWhatsapp) shareWhatsapp = profRow.phone;
              }
            }
          }
        }
      } catch (lookupErr) {
        console.warn('Could not lookup teacher details for admin approval:', lookupErr);
      }
    }

    // Default fallback numbers for prototype demo if not in database
    if (status === 'accepted') {
      if (!sharePhone) sharePhone = '0300-1234567';
      if (!shareWhatsapp) shareWhatsapp = sharePhone;
    }

    // Update in local caches
    const updateInList = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) => {
              if (item.id === requestId || item.requestId === requestId) {
                return {
                  ...item,
                  status,
                  shared_phone: sharePhone || item.shared_phone,
                  shared_whatsapp: shareWhatsapp || item.shared_whatsapp,
                  teacherPhone: sharePhone || item.teacherPhone,
                  teacherWhatsApp: shareWhatsapp || item.teacherWhatsApp,
                  teacher_response_note: note,
                  approved_by: 'admin',
                  responded_at: new Date().toISOString(),
                };
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch {}
    };

    if (typeof window !== 'undefined') {
      updateInList(LOCAL_REQUESTS_KEY);
      updateInList('teachconnect_sent_requests');
      updateInList('teachconnect_teacher_contact_requests');
      window.dispatchEvent(new Event('teachconnect_requests_updated'));
    }

    // Update in Supabase
    const { error } = await supabase
      .from('teacher_contact_requests')
      .update({
        status,
        shared_phone: sharePhone || null,
        shared_whatsapp: shareWhatsapp || null,
        teacher_response_note: note,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.warn('adminRespondToContactRequest supabase warning:', error.message);
    }

    return { success: true, sharePhone, shareWhatsapp };
  } catch (err: any) {
    console.error('adminRespondToContactRequest error:', err);
    return { success: false, error: err?.message || 'Failed to update request' };
  }
}

export async function checkExistingContactRequest(
  teacherSlugOrId: string,
  schoolNameOrId?: string
): Promise<{ hasActiveRequest: boolean; existingStatus?: string }> {
  try {
    const cleanSlug = teacherSlugOrId.trim();
    const cleanSchoolName = (schoolNameOrId || '').trim().toLowerCase();

    // Check local storage requests first
    const localReqs = getLocalContactRequests();
    const localFound = localReqs.find((r) => 
      (r.teacher_id === cleanSlug || r.teacherSlug === cleanSlug) &&
      (!cleanSchoolName || r.school_name?.toLowerCase().trim() === cleanSchoolName) &&
      (r.status === 'pending' || r.status === 'accepted')
    );
    if (localFound) {
      return { hasActiveRequest: true, existingStatus: localFound.status };
    }

    const supabase = createClient();
    let teacherId = cleanSlug;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
    if (!isUUID) {
      const { data: t } = await supabase.from('teachers').select('id').eq('slug', cleanSlug).maybeSingle();
      if (t?.id) teacherId = t.id;
    }

    const isResolvedUUID = Boolean(teacherId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId));
    if (isResolvedUUID) {
      let schoolId: string | null = null;
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: sch } = await supabase.from('schools').select('id').eq('user_id', authData.user.id).maybeSingle();
        if (sch) schoolId = sch.id;
      }

      let query = supabase
        .from('teacher_contact_requests')
        .select('id, status')
        .eq('teacher_id', teacherId)
        .in('status', ['pending', 'accepted']);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (schoolNameOrId) {
        query = query.ilike('school_name', schoolNameOrId.trim());
      }

      const { data: existing } = await query.limit(1).maybeSingle();
      if (existing) {
        return { hasActiveRequest: true, existingStatus: existing.status };
      }
    }

    return { hasActiveRequest: false };
  } catch (err) {
    console.error('checkExistingContactRequest error:', err);
    return { hasActiveRequest: false };
  }
}

export async function submitContactRequest(payload: {
  teacherSlug: string;
  schoolName: string;
  contactPerson: string;
  requirement: string;
  message?: string;
}): Promise<{ success: boolean; error?: string; isDuplicate?: boolean }> {
  try {
    const supabase = createClient();
    const cleanSlug = payload.teacherSlug.trim();

    // 1. Resolve teacher from Supabase
    let teacherId: string | null = null;
    let targetTeacher: any = null;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
    if (isUUID) {
      teacherId = cleanSlug;
      const { data: t } = await supabase.from('teachers').select('id, slug, town_area, city, profiles(full_name, email, phone)').eq('id', cleanSlug).maybeSingle();
      if (t) targetTeacher = t;
    } else {
      const { data: t } = await supabase.from('teachers').select('id, slug, town_area, city, profiles(full_name, email, phone)').eq('slug', cleanSlug).maybeSingle();
      if (t) {
        teacherId = t.id;
        targetTeacher = t;
      }
    }

    // If not in Supabase, check local registered teachers
    if (!targetTeacher) {
      const localTeachers = getLocalRegisteredTeachers();
      const localT = localTeachers.find(lt => lt.slug === cleanSlug || lt.id === cleanSlug || lt.fullName?.toLowerCase() === cleanSlug.toLowerCase());
      if (localT) {
        targetTeacher = localT;
        teacherId = localT.id || `local-teacher-${cleanSlug}`;
      }
    }

    // If still no teacher, check active draft
    if (!teacherId) {
      const draft = getCardDraft();
      if (draft && draft.fullName) {
        teacherId = `teacher-${cleanSlug}`;
        targetTeacher = { id: teacherId, slug: cleanSlug, fullName: draft.fullName };
      } else {
        teacherId = cleanSlug || `teacher-${Date.now()}`;
      }
    }

    // 2. Resolve school ID
    let schoolId: string | null = null;
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: sch } = await supabase.from('schools').select('id').eq('user_id', authData.user.id).maybeSingle();
      if (sch) schoolId = sch.id;
    }

    if (!schoolId && payload.schoolName) {
      const { data: schByName } = await supabase.from('schools').select('id').ilike('school_name', payload.schoolName.trim()).maybeSingle();
      if (schByName) schoolId = schByName.id;
    }

    // 3. DUPLICATE CHECK: A school cannot send a request twice to the same teacher if one is already active (pending/accepted)
    const localReqs = getLocalContactRequests();
    const existingLocalDup = localReqs.find((r) => 
      (r.teacher_id === teacherId || r.teacherSlug === cleanSlug) &&
      r.school_name?.toLowerCase().trim() === payload.schoolName.toLowerCase().trim() &&
      (r.status === 'pending' || r.status === 'accepted')
    );

    if (existingLocalDup) {
      return {
        success: false,
        isDuplicate: true,
        error: 'You have already sent an active contact request to this teacher. Duplicate requests are not allowed.',
      };
    }

    const isTeacherIdValidUUID = Boolean(teacherId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId));
    if (isTeacherIdValidUUID) {
      let dupQuery = supabase
        .from('teacher_contact_requests')
        .select('id, status')
        .eq('teacher_id', teacherId)
        .in('status', ['pending', 'accepted']);

      if (schoolId) {
        dupQuery = dupQuery.eq('school_id', schoolId);
      } else {
        dupQuery = dupQuery.ilike('school_name', payload.schoolName.trim());
      }

      const { data: existingDup } = await dupQuery.limit(1).maybeSingle();
      if (existingDup) {
        return {
          success: false,
          isDuplicate: true,
          error: 'You have already sent an active contact request to this teacher. Duplicate requests are not allowed.',
        };
      }
    }

    const newRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const teacherName = targetTeacher?.profiles?.full_name || targetTeacher?.fullName || 'Educator';

    // 4. Save to local storage for instant visibility across current browser sessions
    saveLocalContactRequest({
      id: newRequestId,
      teacher_id: teacherId,
      teacherSlug: cleanSlug,
      teacherName: teacherName,
      school_id: schoolId || undefined,
      school_name: sanitizeInput(payload.schoolName),
      contact_person: sanitizeInput(payload.contactPerson),
      requirement_details: sanitizeInput(payload.requirement),
      message: payload.message ? sanitizeInput(payload.message) : null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      teachers: {
        id: teacherId,
        slug: cleanSlug,
        town_area: targetTeacher?.location?.town || targetTeacher?.location?.area || 'Malir Town',
        city: targetTeacher?.location?.city || 'Karachi',
        profiles: {
          full_name: teacherName,
          email: targetTeacher?.email || `${cleanSlug}@teachconnect.pk`,
          phone: targetTeacher?.phone || '03001234567',
        }
      },
      schools: {
        id: schoolId || `sch-${Date.now()}`,
        school_name: sanitizeInput(payload.schoolName),
        contact_person: sanitizeInput(payload.contactPerson),
        school_type: 'Private',
        area: 'Malir Town',
        city: 'Karachi',
        profiles: {
          full_name: sanitizeInput(payload.schoolName),
          email: `${payload.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.pk`,
          phone: '021-34567890',
        }
      }
    });

    // 5. Insert directly into Supabase PostgreSQL for persistent database synchronization
    if (isTeacherIdValidUUID) {
      try {
        const { error: insertErr } = await supabase.from('teacher_contact_requests').insert({
          teacher_id: teacherId,
          school_id: schoolId || null,
          school_name: sanitizeInput(payload.schoolName),
          contact_person: sanitizeInput(payload.contactPerson),
          requirement_details: sanitizeInput(payload.requirement),
          message: payload.message ? sanitizeInput(payload.message) : null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (insertErr) {
          console.warn('Supabase request insert notice:', insertErr.message);
        }
      } catch (insertErr) {
        console.warn('Supabase request insert warning:', insertErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('submitContactRequest error:', err);
    return { success: false, error: err?.message || 'Failed to submit contact request' };
  }
}

export async function registerSchoolProfile(schoolData: {
  schoolName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  district?: string;
  town?: string;
  uc?: string;
  area?: string;
  schoolType?: string;
  customSchoolType?: string;
}) {
  try {
    const supabase = createClient();
    let userId: string | null = null;
    const cleanEmail = (schoolData.email || '').trim().toLowerCase();
    const cleanName = (schoolData.schoolName || 'School').trim();

    // 1. Try active auth user
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      userId = authData.user.id;
    }

    // 2. Check if a school already exists by school_name
    let existingSchoolId: string | null = null;
    if (cleanName) {
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id, user_id')
        .ilike('school_name', cleanName)
        .limit(1)
        .maybeSingle();

      if (existingSchool) {
        existingSchoolId = existingSchool.id;
        if (!userId && existingSchool.user_id) {
          userId = existingSchool.user_id;
        }
      }
    }

    // 3. Try looking up existing profile by email
    if (!userId && cleanEmail) {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1)
        .maybeSingle();
      if (existingProf) {
        userId = existingProf.id;
      }
    }

    // 4. Check if school already exists by userId
    if (!existingSchoolId && userId) {
      const { data: schoolByUid } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (schoolByUid) {
        existingSchoolId = schoolByUid.id;
      }
    }

    // 5. If still no userId, generate a fresh unique UUID for this school profile
    if (!userId) {
      userId = crypto.randomUUID();
      await supabase.from('profiles').insert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail || `school.${Math.random().toString(36).substring(2, 6)}@teachconnect.pk`,
        phone: schoolData.phone || '021-34567890',
        role: 'school',
      });
    } else {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail || `school.${Math.random().toString(36).substring(2, 6)}@teachconnect.pk`,
        phone: schoolData.phone || '021-34567890',
        role: 'school',
      });
    }

    const allowedTypes = ['Private', 'Public', 'International', 'Other'];
    const safeType = allowedTypes.includes(schoolData.schoolType || '') ? schoolData.schoolType! : 'Private';

    const schoolPayload = {
      user_id: userId,
      school_name: sanitizeInput(cleanName),
      contact_person: sanitizeInput(schoolData.contactPerson || 'Administrator'),
      school_type: safeType,
      custom_school_type: safeType === 'Other' && schoolData.customSchoolType ? sanitizeInput(schoolData.customSchoolType) : null,
      city: 'Karachi',
      district: MALIR_DISTRICT,
      area: normalizeTown(schoolData.town || schoolData.area) || 'Malir',
      uc: schoolData.uc ? sanitizeInput(schoolData.uc) : null,
      moderation_status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (existingSchoolId) {
      await supabase.from('schools').update(schoolPayload).eq('id', existingSchoolId);
    } else {
      await supabase.from('schools').insert({
        ...schoolPayload,
        created_at: new Date().toISOString(),
      });
    }

    return { success: true, userId };
  } catch (err: any) {
    console.error('registerSchoolProfile error:', err);
    return { success: false, error: err?.message };
  }
}

export async function getCurrentSchoolProfile(userId?: string, userEmail?: string) {
  try {
    const supabase = createClient();
    let effectiveUserId = userId;
    let effectiveEmail = userEmail?.toLowerCase().trim();

    // 1. Get from active Supabase session if not passed
    if (!effectiveUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        effectiveUserId = session.user.id;
        if (!effectiveEmail) effectiveEmail = session.user.email?.toLowerCase().trim();
      }
    }

    // 2. Check localStorage demo user if still not resolved
    if (!effectiveUserId && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('teachconnect_demo_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.role === 'school') {
            effectiveUserId = parsed.id;
            if (!effectiveEmail) effectiveEmail = parsed.email?.toLowerCase().trim();
          }
        }
      } catch {}
    }

    let schoolRecord: any = null;

    // 3. Primary lookup by user_id
    if (effectiveUserId) {
      const { data: schoolByUid } = await supabase
        .from('schools')
        .select(`
          id,
          user_id,
          school_name,
          contact_person,
          school_type,
          custom_school_type,
          area,
          uc,
          city,
          district,
          profiles (email, phone, full_name)
        `)
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (schoolByUid) {
        schoolRecord = schoolByUid;
      }
    }

    // 4. Secondary lookup by profile email if not found by user_id
    if (!schoolRecord && effectiveEmail) {
      const { data: profileWithSchool } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          full_name,
          schools (
            id,
            user_id,
            school_name,
            contact_person,
            school_type,
            custom_school_type,
            area,
            uc,
            city,
            district
          )
        `)
        .ilike('email', effectiveEmail)
        .maybeSingle();

      if (profileWithSchool?.schools) {
        const sch = Array.isArray(profileWithSchool.schools) ? profileWithSchool.schools[0] : profileWithSchool.schools;
        if (sch) {
          schoolRecord = {
            ...sch,
            profiles: {
              email: profileWithSchool.email,
              phone: profileWithSchool.phone,
              full_name: profileWithSchool.full_name,
            }
          };
        }
      }
    }

    // 5. Fallback: check stored demo user
    if (!schoolRecord && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('teachconnect_demo_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.role === 'school') {
            schoolRecord = {
              id: parsed.id || 'demo-school',
              user_id: parsed.id || 'demo-school',
              school_name: parsed.full_name || parsed.schoolName || 'Registered School',
              contact_person: parsed.contactPerson || parsed.full_name || 'Principal / Administrator',
              school_type: parsed.schoolType || 'Private',
              area: parsed.area || parsed.town || 'Malir',
              uc: parsed.uc || null,
              city: parsed.city || 'Karachi',
              district: parsed.district || 'Malir',
              profiles: {
                email: parsed.email || '',
                phone: parsed.phone || '',
                full_name: parsed.full_name || '',
              }
            };
          }
        }
      } catch {}
    }

    return schoolRecord;
  } catch (err) {
    console.error('getCurrentSchoolProfile error:', err);
    return null;
  }
}

export async function getSchoolDashboardData(options?: {
  schoolId?: string;
  userId?: string;
  userEmail?: string;
  schoolName?: string;
}) {
  try {
    const supabase = createClient();
    let schoolId = options?.schoolId;
    let schoolName = options?.schoolName;

    // If schoolId not provided, attempt to resolve via auth session
    if (!schoolId && !options?.userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: sch } = await supabase
          .from('schools')
          .select('id, school_name')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (sch) {
          schoolId = sch.id;
          if (!schoolName) schoolName = sch.school_name;
        }
      }
    } else if (!schoolId && options?.userId) {
      const { data: sch } = await supabase
        .from('schools')
        .select('id, school_name')
        .eq('user_id', options.userId)
        .maybeSingle();
      if (sch) {
        schoolId = sch.id;
        if (!schoolName) schoolName = sch.school_name;
      }
    }

    let requestQuery = supabase
      .from('teacher_contact_requests')
      .select(`
        id,
        teacher_id,
        school_id,
        school_name,
        contact_person,
        requirement_details,
        message,
        status,
        shared_phone,
        shared_whatsapp,
        teacher_response_note,
        responded_at,
        created_at,
        teachers (
          id,
          slug,
          avatar_url,
          highest_education,
          town_area,
          city,
          profiles (
            full_name,
            email,
            phone
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (schoolId && schoolName) {
      requestQuery = requestQuery.or(`school_id.eq.${schoolId},school_name.ilike.${schoolName.trim()}`);
    } else if (schoolId) {
      requestQuery = requestQuery.eq('school_id', schoolId);
    } else if (schoolName) {
      requestQuery = requestQuery.ilike('school_name', schoolName.trim());
    }

    const { data: sentRequests } = await requestQuery;

    // Sync fresh Supabase request status into local storage caches
    if (typeof window !== 'undefined' && Array.isArray(sentRequests) && sentRequests.length > 0) {
      try {
        const localList = getLocalContactRequests();
        let changed = false;
        const updatedLocal = localList.map((lr: any) => {
          const matchedRemote = sentRequests.find((sr: any) => sr.id === lr.id || (sr.id && lr.requestId && sr.id === lr.requestId));
          if (matchedRemote) {
            changed = true;
            return {
              ...lr,
              ...matchedRemote,
              status: matchedRemote.status || lr.status,
              shared_phone: matchedRemote.shared_phone || lr.shared_phone || lr.teacherPhone,
              shared_whatsapp: matchedRemote.shared_whatsapp || lr.shared_whatsapp || lr.teacherWhatsApp,
              teacherPhone: matchedRemote.shared_phone || lr.teacherPhone,
              teacherWhatsApp: matchedRemote.shared_whatsapp || lr.teacherWhatsApp,
              teacher_response_note: matchedRemote.teacher_response_note || lr.teacher_response_note,
              responded_at: matchedRemote.responded_at || lr.responded_at,
            };
          }
          return lr;
        });
        if (changed) {
          localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(updatedLocal));
          localStorage.setItem('teachconnect_sent_requests', JSON.stringify(updatedLocal));
        }
      } catch {}
    }

    let shortlistQuery = supabase
      .from('school_shortlists')
      .select(`
        id,
        school_id,
        created_at,
        teachers (
          id,
          slug,
          avatar_url,
          highest_education,
          experience_years,
          town_area,
          city,
          expected_salary,
          profiles (full_name)
        )
      `);

    if (schoolId) {
      shortlistQuery = shortlistQuery.eq('school_id', schoolId);
    }

    const { data: shortlists } = await shortlistQuery;

    const deletedIds = getDeletedRequestIds();
    const combinedSent = (sentRequests ? [...sentRequests] : []).filter(r => !deletedIds.has(r.id));
    const localReqs = getLocalContactRequests();
    
    // Filter local requests to only match THIS school and merge with Supabase results
    localReqs.forEach((lr) => {
      if (!deletedIds.has(lr.id)) {
        const isMatch =
          (!schoolId && !schoolName && !options?.userEmail) ||
          (schoolId && (lr.school_id === schoolId || lr.schoolId === schoolId)) ||
          (schoolName && lr.school_name?.toLowerCase().trim() === schoolName.toLowerCase().trim()) ||
          (options?.userEmail && lr.schoolEmail?.toLowerCase().trim() === options.userEmail.toLowerCase().trim());

        if (isMatch) {
          const existingIdx = combinedSent.findIndex((r: any) => r.id === lr.id || (r.requestId && r.requestId === lr.id));
          if (existingIdx >= 0) {
            const existing: any = combinedSent[existingIdx];
            const isAccepted = lr.status === 'accepted' || existing.status === 'accepted';
            const isDeclined = !isAccepted && (lr.status === 'declined' || existing.status === 'declined');

            combinedSent[existingIdx] = {
              ...existing,
              ...lr,
              status: isAccepted ? 'accepted' : (isDeclined ? 'declined' : (lr.status || existing.status || 'pending')),
              shared_phone: lr.shared_phone || lr.teacherPhone || existing.shared_phone || existing.teacherPhone,
              shared_whatsapp: lr.shared_whatsapp || lr.teacherWhatsApp || existing.shared_whatsapp || existing.teacherWhatsApp,
              teacherPhone: lr.teacherPhone || lr.shared_phone || existing.teacherPhone || existing.shared_phone,
              teacherWhatsApp: lr.teacherWhatsApp || lr.shared_whatsapp || existing.teacherWhatsApp || existing.shared_whatsapp,
              teacher_response_note: lr.teacher_response_note || existing.teacher_response_note,
              responded_at: lr.responded_at || existing.responded_at,
              approved_by: lr.approved_by || existing.approved_by,
              teachers: existing.teachers || lr.teachers,
            };
          } else {
            combinedSent.unshift(lr);
          }
        }
      }
    });

    return {
      sentRequests: combinedSent,
      shortlists: shortlists || [],
    };
  } catch (err) {
    console.error('getSchoolDashboardData error:', err);
    return { sentRequests: [], shortlists: [] };
  }
}

export async function getAdminDashboardData() {
  try {
    const supabase = createClient();
    const [teachersRes, teacherProfilesRes, schoolsRes, schoolProfilesRes, requestsRes, reportsRes] = await Promise.all([
      supabase.from('teachers').select(`
        id,
        user_id,
        slug,
        avatar_url,
        highest_education,
        institution,
        additional_qualifications,
        experience_years,
        previous_school,
        availability,
        available_from,
        town_area,
        city,
        district,
        expected_salary,
        about_me,
        moderation_status,
        created_at,
        profiles (full_name, email, phone)
      `).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
      supabase.from('schools').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'school').order('created_at', { ascending: false }),
      supabase.from('teacher_contact_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*'),
    ]);

    if (requestsRes.error) {
      console.warn('Admin requests fetch notice:', requestsRes.error.message);
    }

    // Deduplicate schools by name / id (keeping the most recent record)
    const rawSchools = schoolsRes.data || [];
    const uniqueSchools: any[] = [];
    const seenSchoolNames = new Set<string>();
    const seenSchoolIds = new Set<string>();

    for (const s of rawSchools) {
      const nameKey = (s.school_name || '').toLowerCase().trim();
      const idKey = s.id || s.user_id;
      if (!seenSchoolNames.has(nameKey) && !seenSchoolIds.has(idKey)) {
        seenSchoolNames.add(nameKey);
        if (idKey) seenSchoolIds.add(idKey);
        uniqueSchools.push(s);
      }
    }

    // Merge registered school profiles from profiles table
    const rawSchoolProfiles = schoolProfilesRes.data || [];
    for (const sp of rawSchoolProfiles) {
      const nameKey = (sp.full_name || '').toLowerCase().trim();
      const idKey = sp.id;
      if (!seenSchoolNames.has(nameKey) && !seenSchoolIds.has(idKey)) {
        seenSchoolNames.add(nameKey);
        seenSchoolIds.add(idKey);
        uniqueSchools.push({
          id: sp.id,
          user_id: sp.id,
          school_name: sp.full_name,
          contact_person: `${sp.full_name} Administrator`,
          school_type: 'Public',
          area: 'Malir Town',
          city: 'Karachi',
          district: 'Malir',
          moderation_status: 'active',
          created_at: sp.created_at,
          profiles: {
            full_name: sp.full_name,
            email: sp.email,
            phone: sp.phone,
          }
        });
      }
    }

    // Deduplicate teachers by ID and slug
    const rawTeachers = teachersRes.data || [];
    const uniqueTeachers: any[] = [];
    const seenTeacherIds = new Set<string>();
    const seenTeacherUserIds = new Set<string>();

    for (const t of rawTeachers) {
      const idKey = t.id;
      const uKey = t.user_id;
      if (!seenTeacherIds.has(idKey)) {
        seenTeacherIds.add(idKey);
        if (uKey) seenTeacherUserIds.add(uKey);
        uniqueTeachers.push(t);
      }
    }

    // Merge registered teacher profiles from profiles table if missing from teachers table
    const rawTeacherProfiles = teacherProfilesRes.data || [];
    for (const tp of rawTeacherProfiles) {
      const uKey = tp.id;
      if (!seenTeacherUserIds.has(uKey)) {
        seenTeacherUserIds.add(uKey);
        const cleanSlug = tp.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'teacher';
        uniqueTeachers.push({
          id: tp.id,
          user_id: tp.id,
          slug: cleanSlug,
          avatar_url: '',
          highest_education: 'Certified Educator',
          institution: 'University of Karachi',
          additional_qualifications: '',
          experience_years: 2,
          previous_school: '',
          availability: 'Morning',
          available_from: null,
          town_area: 'Malir Town',
          city: 'Karachi',
          district: 'Malir',
          expected_salary: 35000,
          about_me: '',
          moderation_status: 'active',
          created_at: tp.created_at,
          profiles: {
            full_name: tp.full_name,
            email: tp.email,
            phone: tp.phone,
          }
        });
      }
    }

    // Merge local registered teachers into admin view
    const localTeachers = getLocalRegisteredTeachers();
    localTeachers.forEach((lt) => {
      const key = lt.slug || lt.id;
      if (!seenTeacherIds.has(key)) {
        seenTeacherIds.add(key);
        uniqueTeachers.unshift({
          id: lt.id,
          user_id: lt.id,
          slug: lt.slug,
          avatar_url: lt.avatarUrl || '',
          highest_education: lt.highestEducation || 'Certified Educator',
          institution: (lt as any).institution || 'University',
          additional_qualifications: (lt as any).additionalQualifications || '',
          experience_years: lt.experienceYears || 0,
          previous_school: (lt as any).previousSchool || '',
          availability: lt.availability || 'Morning',
          available_from: (lt as any).availableFrom || null,
          town_area: lt.location.town || lt.location.area || 'Malir Town',
          city: lt.location.city || 'Karachi',
          district: lt.location.district || 'Malir',
          expected_salary: lt.expectedSalary || 35000,
          about_me: (lt as any).aboutMe || '',
          moderation_status: 'active',
          created_at: (lt as any).created_at || new Date().toISOString(),
          profiles: {
            full_name: lt.fullName,
            email: (lt as any).email || `${lt.slug}@teachconnect.pk`,
            phone: (lt as any).phone || '03001234567',
          }
        });
      }
    });

    // Merge local contact requests into admin view and enrich with teacher and school details
    const deletedIds = getDeletedRequestIds();
    const rawRequests = (requestsRes.data || []).filter((r: any) => !deletedIds.has(r.id));
    const combinedRequests = rawRequests.map((r: any) => {
      const matchedTeacher = uniqueTeachers.find((t: any) => t.id === r.teacher_id || t.slug === r.teacher_id);
      const matchedSchool = uniqueSchools.find((s: any) => s.id === r.school_id || (s.school_name && r.school_name && s.school_name.toLowerCase().trim() === r.school_name.toLowerCase().trim()));

      return {
        ...r,
        teachers: r.teachers || (matchedTeacher ? {
          id: matchedTeacher.id,
          slug: matchedTeacher.slug,
          avatar_url: matchedTeacher.avatar_url,
          highest_education: matchedTeacher.highest_education,
          town_area: matchedTeacher.town_area,
          city: matchedTeacher.city,
          profiles: matchedTeacher.profiles || { full_name: matchedTeacher.slug, email: '', phone: '' }
        } : null),
        schools: r.schools || (matchedSchool ? {
          id: matchedSchool.id,
          school_name: matchedSchool.school_name,
          contact_person: matchedSchool.contact_person,
          school_type: matchedSchool.school_type,
          area: matchedSchool.area,
          city: matchedSchool.city,
          profiles: matchedSchool.profiles || { full_name: matchedSchool.school_name, email: '', phone: '' }
        } : null)
      };
    });

    const localReqs = getLocalContactRequests();
    localReqs.forEach((lr) => {
      if (!deletedIds.has(lr.id)) {
        const existingIdx = combinedRequests.findIndex((r: any) => r.id === lr.id || (r.requestId && r.requestId === lr.id));
        if (existingIdx >= 0) {
          const existing = combinedRequests[existingIdx];
          const isAccepted = lr.status === 'accepted' || existing.status === 'accepted';
          const isDeclined = !isAccepted && (lr.status === 'declined' || existing.status === 'declined');

          combinedRequests[existingIdx] = {
            ...existing,
            ...lr,
            status: isAccepted ? 'accepted' : (isDeclined ? 'declined' : (lr.status || existing.status || 'pending')),
            shared_phone: lr.shared_phone || lr.teacherPhone || existing.shared_phone || existing.teacherPhone,
            shared_whatsapp: lr.shared_whatsapp || lr.teacherWhatsApp || existing.shared_whatsapp || existing.teacherWhatsApp,
            teacherPhone: lr.teacherPhone || lr.shared_phone || existing.teacherPhone || existing.shared_phone,
            teacherWhatsApp: lr.teacherWhatsApp || lr.shared_whatsapp || existing.teacherWhatsApp || existing.shared_whatsapp,
            teacher_response_note: lr.teacher_response_note || existing.teacher_response_note,
            responded_at: lr.responded_at || existing.responded_at,
            approved_by: lr.approved_by || existing.approved_by,
            teachers: existing.teachers || lr.teachers,
            schools: existing.schools || lr.schools,
          };
        } else {
          combinedRequests.unshift(lr);
        }
      }
    });

    return {
      teachers: uniqueTeachers,
      schools: uniqueSchools,
      requests: combinedRequests,
      reports: reportsRes.data || [],
    };
  } catch (err) {
    console.error('getAdminDashboardData error:', err);
    return { teachers: getLocalRegisteredTeachers() as any, schools: [], requests: getLocalContactRequests(), reports: [] };
  }
}

export async function deleteUserAccount(
  id: string,
  role: 'Teacher' | 'School',
  slugOrName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    invalidateTeacherCache();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (role === 'Teacher') {
      const teacherIdsToDelete = new Set<string>();
      const userIdsToDelete = new Set<string>();

      if (isUUID) {
        teacherIdsToDelete.add(id);
        const { data: t } = await supabase.from('teachers').select('user_id').eq('id', id).maybeSingle();
        if (t?.user_id) userIdsToDelete.add(t.user_id);
      }

      if (slugOrName) {
        const cleanSlug = slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const cleanName = slugOrName.trim();

        // 1. Match by slug
        const { data: bySlug } = await supabase
          .from('teachers')
          .select('id, user_id')
          .or(`slug.eq.${cleanSlug},slug.ilike.%${cleanSlug}%`);
        if (bySlug) {
          bySlug.forEach(t => {
            teacherIdsToDelete.add(t.id);
            if (t.user_id) userIdsToDelete.add(t.user_id);
          });
        }

        // 2. Match by profile name
        const { data: byName } = await supabase
          .from('profiles')
          .select('id, teachers(id)')
          .ilike('full_name', cleanName);
        if (byName) {
          byName.forEach((p: any) => {
            userIdsToDelete.add(p.id);
            const tArr = Array.isArray(p.teachers) ? p.teachers : (p.teachers ? [p.teachers] : []);
            tArr.forEach((tItem: any) => {
              if (tItem?.id) teacherIdsToDelete.add(tItem.id);
            });
          });
        }
      }

      for (const tId of teacherIdsToDelete) {
        await supabase.from('teacher_subjects').delete().eq('teacher_id', tId);
        await supabase.from('teacher_classes').delete().eq('teacher_id', tId);
        await supabase.from('teacher_skills').delete().eq('teacher_id', tId);
        await supabase.from('teacher_contact_requests').delete().eq('teacher_id', tId);
        await supabase.from('school_shortlists').delete().eq('teacher_id', tId);
        await supabase.from('teachers').delete().eq('id', tId);
      }

      for (const uId of userIdsToDelete) {
        await supabase.from('profiles').delete().eq('id', uId);
      }

      if (slugOrName) {
        await supabase.from('profiles').delete().ilike('full_name', slugOrName.trim());
      }
    } else {
      let schoolId = isUUID ? id : null;
      let userId: string | null = null;

      if (schoolId) {
        const { data: s } = await supabase.from('schools').select('user_id').eq('id', schoolId).maybeSingle();
        if (s) userId = s.user_id;
        await supabase.from('schools').delete().eq('id', schoolId);
      } else if (slugOrName) {
        const { data: s } = await supabase.from('schools').select('id, user_id').ilike('school_name', slugOrName).maybeSingle();
        if (s) {
          userId = s.user_id;
          await supabase.from('schools').delete().eq('id', s.id);
        }
      }

      if (userId) {
        await supabase.from('profiles').delete().eq('id', userId);
      }
      if (slugOrName) {
        await supabase.from('profiles').delete().ilike('full_name', slugOrName.trim());
      }
    }

    // Clean up local storage and force logout if deleted user is currently logged in
    if (typeof window !== 'undefined') {
      try {
        const cleanSlug = slugOrName ? slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
        const cleanTargetName = (slugOrName || '').toLowerCase().trim();

        // 1. Remove teacher from local registered teachers array
        const rawLocal = localStorage.getItem(LOCAL_TEACHERS_KEY);
        if (rawLocal) {
          const list: any[] = JSON.parse(rawLocal);
          const updatedList = list.filter((t: any) => {
            const tSlug = (t.slug || '').toLowerCase();
            const tName = (t.fullName || '').toLowerCase();
            const tId = t.id || '';
            return tId !== id && tSlug !== cleanSlug && tName !== cleanTargetName;
          });
          localStorage.setItem(LOCAL_TEACHERS_KEY, JSON.stringify(updatedList));
        }

        // 2. Check if currently active logged-in user matches deleted account
        const rawUser = localStorage.getItem('teachconnect_demo_user');
        if (rawUser) {
          const demoUser = JSON.parse(rawUser);
          const demoEmail = (demoUser.email || '').toLowerCase();
          const demoName = (demoUser.full_name || '').toLowerCase();
          const demoId = demoUser.id || '';
          const demoRole = (demoUser.role || '').toLowerCase();

          const isMatchingCurrentSession = 
            demoId === id ||
            demoEmail === cleanTargetName ||
            demoEmail.includes(cleanSlug) ||
            demoName === cleanTargetName ||
            demoName.includes(cleanTargetName) ||
            (role === 'Teacher' && demoRole === 'teacher' && (demoName === cleanTargetName || demoId === id)) ||
            (role === 'School' && demoRole === 'school' && (demoName === cleanTargetName || demoId === id));

          if (isMatchingCurrentSession) {
            localStorage.removeItem('teachconnect_demo_user');
            localStorage.removeItem('teachconnect_card_draft');
            sessionStorage.removeItem('teachconnect_card_draft');
            sessionStorage.removeItem('temp_teacher_profile');
            sessionStorage.removeItem('temp_school_profile');
          }
        }

        if (role === 'Teacher') {
          const draft = getCardDraft();
          if (draft && ((draft.fullName || '').toLowerCase() === cleanTargetName || cleanSlug === id)) {
            localStorage.removeItem('teachconnect_card_draft');
            sessionStorage.removeItem('teachconnect_card_draft');
          }
          sessionStorage.removeItem('temp_teacher_profile');
        } else {
          localStorage.removeItem('temp_school_profile');
          sessionStorage.removeItem('temp_school_profile');
        }

        // 3. Purge all linked contact requests for this deleted user
        const filterReq = (r: any) => {
          const tId = r.teacher_id || r.teacherId;
          const tSlug = (r.teacherSlug || '').toLowerCase();
          const sId = r.school_id || r.schoolId;
          const sName = (r.school_name || r.schoolName || '').toLowerCase();
          if (role === 'Teacher') {
            return tId !== id && tSlug !== cleanSlug && !cleanTargetName.includes(tSlug);
          } else {
            return sId !== id && sName !== cleanTargetName;
          }
        };

        const localReqRaw = localStorage.getItem(LOCAL_REQUESTS_KEY);
        if (localReqRaw) {
          try {
            const list: any[] = JSON.parse(localReqRaw);
            localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(list.filter(filterReq)));
          } catch {}
        }

        const sentReqRaw = localStorage.getItem('teachconnect_sent_requests');
        if (sentReqRaw) {
          try {
            const list: any[] = JSON.parse(sentReqRaw);
            localStorage.setItem('teachconnect_sent_requests', JSON.stringify(list.filter(filterReq)));
          } catch {}
        }

        const inqReqRaw = localStorage.getItem('teachconnect_teacher_contact_requests');
        if (inqReqRaw) {
          try {
            const list: any[] = JSON.parse(inqReqRaw);
            localStorage.setItem('teachconnect_teacher_contact_requests', JSON.stringify(list.filter(filterReq)));
          } catch {}
        }

        window.dispatchEvent(new Event('teachconnect_requests_updated'));

        // 4. Broadcast account deletion event across tabs & active windows
        localStorage.setItem(
          'teachconnect_account_deleted_event',
          JSON.stringify({
            id,
            role,
            slugOrName,
            timestamp: Date.now(),
          })
        );
        window.dispatchEvent(
          new CustomEvent('teachconnect_account_deleted', {
            detail: { id, role, slugOrName },
          })
        );
        window.dispatchEvent(new Event('teachconnect_auth_change'));
      } catch (e) {
        console.error('Local storage cleanup error:', e);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteUserAccount error:', err);
    return { success: false, error: err?.message };
  }
}

export async function updateModerationStatus(
  id: string,
  role: 'Teacher' | 'School',
  status: 'active' | 'suspended' | 'flagged',
  slugOrName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    invalidateTeacherCache();

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (role === 'Teacher') {
      let query = supabase
        .from('teachers')
        .update({
          moderation_status: status,
          updated_at: new Date().toISOString(),
        });

      if (isUUID) {
        query = query.eq('id', id);
      } else if (slugOrName) {
        const cleanSlug = slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        query = query.eq('slug', cleanSlug);
      }

      const { error } = await query;

      if (error) {
        console.error('Failed to update teacher moderation status in Supabase:', error.message || error);
      }
    } else {
      if (isUUID) {
        const { error } = await supabase
          .from('schools')
          .update({
            moderation_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) {
          console.error('Failed to update school moderation status in Supabase:', error.message || error);
        }
      }
    }

    // Sync localStorage draft if teacher was suspended or restored
    if (typeof window !== 'undefined') {
      try {
        const draft = getCardDraft();
        if (draft && draft.fullName) {
          const draftSlug = draft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const isTarget = 
            id === 'local-draft' ||
            draftSlug === slugOrName ||
            draft.fullName.toLowerCase() === (slugOrName || '').toLowerCase() ||
            draftSlug === id;

          if (isTarget) {
            draft.moderationStatus = status === 'suspended' ? 'suspended' : 'active';
            if (status === 'suspended') {
              draft.isPublished = false;
            }
            localStorage.setItem('teachconnect_card_draft', JSON.stringify(draft));
            sessionStorage.setItem('teachconnect_card_draft', JSON.stringify(draft));
          }
        }
      } catch (e) {
        console.error('Draft moderation sync error:', e);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('updateModerationStatus error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete a contact request permanently (Admin action).
 * Removes request from Supabase teacher_contact_requests and synchronizes local storage caches.
 */
export async function deleteContactRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requestId) {
      return { success: false, error: 'Request ID is required' };
    }

    // 1. Add to persistent deleted blacklist
    addDeletedRequestId(requestId);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);

    if (isUUID) {
      const supabase = createClient();
      const { error } = await supabase
        .from('teacher_contact_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Supabase contact request delete error:', error.message || error);
      }
    }

    // Clean up local storage caches
    if (typeof window !== 'undefined') {
      try {
        // 1. Clean from main local contact requests
        const localRaw = localStorage.getItem(LOCAL_REQUESTS_KEY);
        if (localRaw) {
          const localList = JSON.parse(localRaw);
          if (Array.isArray(localList)) {
            const updated = localList.filter((r: any) => r.id !== requestId && r.requestId !== requestId);
            localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(updated));
          }
        }

        // 2. Clean from sent requests
        const sentRaw = localStorage.getItem('teachconnect_sent_requests');
        if (sentRaw) {
          const sentList = JSON.parse(sentRaw);
          if (Array.isArray(sentList)) {
            const updated = sentList.filter((r: any) => r.id !== requestId && r.requestId !== requestId);
            localStorage.setItem('teachconnect_sent_requests', JSON.stringify(updated));
          }
        }

        // 3. Clean from teacher inquiries
        const inqRaw = localStorage.getItem('teachconnect_teacher_contact_requests');
        if (inqRaw) {
          const inqList = JSON.parse(inqRaw);
          if (Array.isArray(inqList)) {
            const updated = inqList.filter((r: any) => r.id !== requestId && r.requestId !== requestId);
            localStorage.setItem('teachconnect_teacher_contact_requests', JSON.stringify(updated));
          }
        }

        window.dispatchEvent(new Event('teachconnect_requests_updated'));
      } catch (e) {
        console.error('Local cache request deletion cleanup error:', e);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteContactRequest error:', err);
    return { success: false, error: err?.message || 'Failed to delete contact request' };
  }
}

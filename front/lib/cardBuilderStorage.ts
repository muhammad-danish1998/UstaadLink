export interface TeacherCardDraft {
  // Step 1: Basic Info
  fullName: string;
  fatherName: string;
  gender: 'Male' | 'Female' | '';
  profilePhotoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;

  // Step 2: Education
  highestEducation?: string;
  institution?: string;
  additionalQualifications?: string;

  // Step 3: Teaching Details
  subjects?: string[];
  classes?: string;
  experienceYears?: number;
  previousSchool?: string;
  teachingSkills?: string[];

  // Step 4: Location & Availability
  availability?: 'Morning' | 'Evening' | 'Both';
  availableFrom?: string;
  town?: string;
  uc?: string;
  area?: string;
  district?: string;
  city?: string;

  // Step 5: Salary & Bio
  expectedSalary?: number;
  aboutMe?: string;

  // Step 7: Publishing settings
  isPublished?: boolean;
  isSearchIndexable?: boolean;
  moderationStatus?: 'active' | 'suspended';
}

const STORAGE_KEY = 'teachconnect_card_draft';

export const getCardDraft = (): TeacherCardDraft => {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(STORAGE_KEY);
    }
    let parsedDraft: TeacherCardDraft | null = null;
    if (raw) {
      try {
        parsedDraft = JSON.parse(raw);
      } catch {
        parsedDraft = null;
      }
    }

    // Check active authenticated user to prevent cross-account data leakage
    const activeUserRaw = localStorage.getItem('teachconnect_demo_user');
    if (activeUserRaw) {
      try {
        const activeUser = JSON.parse(activeUserRaw);
        if (activeUser && activeUser.role === 'teacher') {
          if (parsedDraft) {
            const draftEmail = (parsedDraft.email || '').toLowerCase().trim();
            const activeEmail = (activeUser.email || '').toLowerCase().trim();
            const draftName = (parsedDraft.fullName || '').toLowerCase().trim();
            const activeName = (activeUser.full_name || '').toLowerCase().trim();

            const isMismatch =
              (draftEmail && activeEmail && draftEmail !== activeEmail) ||
              (draftName && activeName && draftName !== activeName);

            if (isMismatch) {
              // Discard stale draft belonging to another teacher
              return {
                ...defaultDraft,
                fullName: activeUser.full_name || '',
                email: activeUser.email || '',
              };
            }
          } else {
            return {
              ...defaultDraft,
              fullName: activeUser.full_name || '',
              email: activeUser.email || '',
            };
          }
        }
      } catch (err) {
        console.error('Error validating active user draft:', err);
      }
    }

    if (!parsedDraft) {
      // Check if registration stored temporary profile
      const tempReg = sessionStorage.getItem('temp_teacher_profile') || localStorage.getItem('temp_teacher_profile');
      if (tempReg) {
        const parsedReg = JSON.parse(tempReg);
        return {
          ...defaultDraft,
          fullName: parsedReg.fullName || '',
          fatherName: parsedReg.fatherName || '',
          email: parsedReg.email || '',
          phone: parsedReg.phone || '',
        };
      }
      return defaultDraft;
    }

    return parsedDraft;
  } catch {
    return defaultDraft;
  }
};

export const saveCardDraft = (patch: Partial<TeacherCardDraft>): TeacherCardDraft => {
  if (typeof window === 'undefined') return defaultDraft;
  const current = getCardDraft();
  const updated = { ...current, ...patch };
  try {
    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
  return updated;
};

export const defaultDraft: TeacherCardDraft = {
  fullName: '',
  fatherName: '',
  gender: '',
  profilePhotoUrl: '',
  highestEducation: '',
  institution: '',
  additionalQualifications: '',
  subjects: [],
  classes: '',
  experienceYears: 0,
  previousSchool: '',
  teachingSkills: [],
  availability: 'Morning',
  town: 'Malir Town',
  uc: 'Qaidabad',
  area: 'Malir Town',
  district: 'Malir',
  city: 'Karachi',
  expectedSalary: 35000,
  aboutMe: '',
  isPublished: true,
  isSearchIndexable: false,
};

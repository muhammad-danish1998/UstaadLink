export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'teacher' | 'school' | 'admin';
export type AvailabilityType = 'Morning' | 'Evening' | 'Both';
export type ModerationStatus = 'active' | 'suspended' | 'removed';
export type ContactRequestStatus = 'pending' | 'accepted' | 'declined' | 'closed';
export type SchoolType = 'Private' | 'Public' | 'International' | 'Other';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export type TeachingMode = 'onsite' | 'online' | 'both';

export interface Teacher {
  id: string;
  user_id: string;
  slug: string;
  father_name?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  whatsapp?: string | null;
  avatar_url?: string | null;
  highest_education: string;
  institution?: string | null;
  additional_qualifications?: string | null;
  experience_years: number;
  previous_school?: string | null;
  availability: AvailabilityType;
  available_from?: string | null;
  city: string;
  district: string;
  town_area: string;
  uc?: string | null;
  teaching_mode: TeachingMode;
  expected_salary: number;
  monthly_salary?: number | null;
  online_hourly_rate?: number | null;
  about_me?: string | null;
  published: boolean;
  search_indexable: boolean;
  moderation_status: ModerationStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  user_id: string;
  school_name: string;
  contact_person: string;
  school_type: SchoolType;
  custom_school_type?: string | null;
  city: string;
  district: string;
  area: string;
  uc?: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  category?: string | null;
  created_at: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  level_order: number;
  created_at: string;
}

export interface TeachingSkill {
  id: string;
  name: string;
  created_at: string;
}

export interface ContactRequest {
  id: string;
  school_id: string;
  teacher_id: string;
  school_name: string;
  contact_person: string;
  requirement_details?: string | null;
  message?: string | null;
  status: ContactRequestStatus;
  shared_phone?: string | null;
  shared_whatsapp?: string | null;
  teacher_response_note?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

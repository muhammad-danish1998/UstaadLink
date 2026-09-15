-- TeachConnect Initial Schema Migration
-- Project: TeachConnect (Recruitment Marketplace Prototype)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'school', 'admin')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Teachers Table (Teacher Profile Cards)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    father_name TEXT, -- Private / internal
    gender TEXT CHECK (gender IN ('male', 'female', 'other')), -- Private / internal
    whatsapp TEXT, -- Private / internal
    avatar_url TEXT,
    highest_education TEXT NOT NULL,
    institution TEXT,
    additional_qualifications TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    previous_school TEXT,
    availability TEXT NOT NULL CHECK (availability IN ('Morning', 'Evening', 'Both')),
    available_from DATE,
    city TEXT NOT NULL DEFAULT 'Karachi',
    district TEXT NOT NULL,
    town_area TEXT NOT NULL,
    expected_salary NUMERIC NOT NULL DEFAULT 0,
    about_me TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    search_indexable BOOLEAN NOT NULL DEFAULT false,
    moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'suspended', 'removed')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    school_type TEXT NOT NULL CHECK (school_type IN ('Private', 'Public', 'International', 'Other')),
    custom_school_type TEXT,
    city TEXT NOT NULL DEFAULT 'Karachi',
    district TEXT NOT NULL,
    area TEXT NOT NULL,
    moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'suspended', 'removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Taxonomy Tables: Subjects, Classes, Skills
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    level_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Junction Tables
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_classes (
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, class_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_skills (
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, skill_id)
);

-- 7. Teacher Contact Requests (In-Platform Contact Workflow)
CREATE TABLE IF NOT EXISTS public.teacher_contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    requirement_details TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'closed')),
    shared_phone TEXT,
    shared_whatsapp TEXT,
    teacher_response_note TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. School Shortlists (Private Bookmarking)
CREATE TABLE IF NOT EXISTS public.school_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, teacher_id)
);

-- 9. Profile Views (Deduplicated Analytics: 1 view per school per teacher per 24 hours)
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(teacher_id, school_id, view_date)
);

-- 10. Reports Queue
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('teacher', 'school')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_teachers_search ON public.teachers (published, moderation_status, district, availability);
CREATE INDEX IF NOT EXISTS idx_teachers_salary ON public.teachers (expected_salary);
CREATE INDEX IF NOT EXISTS idx_teachers_experience ON public.teachers (experience_years);
CREATE INDEX IF NOT EXISTS idx_teachers_slug ON public.teachers (slug);
CREATE INDEX IF NOT EXISTS idx_contact_requests_teacher ON public.teacher_contact_requests (teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_school ON public.teacher_contact_requests (school_id, status);
CREATE INDEX IF NOT EXISTS idx_shortlists_school ON public.school_shortlists (school_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_teacher ON public.profile_views (teacher_id);

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies

-- Public Read for Taxonomy
CREATE POLICY "Public read for subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public read for classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public read for skills" ON public.skills FOR SELECT USING (true);

-- Profiles Policies
CREATE POLICY "Allow select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teachers Policies
CREATE POLICY "Allow select teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow insert teachers" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update teachers" ON public.teachers FOR UPDATE USING (true) WITH CHECK (true);

-- Schools Policies
CREATE POLICY "Allow select schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Allow insert schools" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update schools" ON public.schools FOR UPDATE USING (true) WITH CHECK (true);

-- Contact Requests Policies
CREATE POLICY "Teachers view their received contact requests" ON public.teacher_contact_requests 
FOR SELECT USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers update response to contact requests" ON public.teacher_contact_requests 
FOR UPDATE USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

CREATE POLICY "Schools view their sent contact requests" ON public.teacher_contact_requests 
FOR SELECT USING (
    school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
);

CREATE POLICY "Schools can create contact requests" ON public.teacher_contact_requests 
FOR INSERT WITH CHECK (
    school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
);

-- Shortlists Policies
CREATE POLICY "Schools manage their shortlists" ON public.school_shortlists 
FOR ALL USING (
    school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
);

-- Profile Views Policies
CREATE POLICY "Schools can record profile views" ON public.profile_views 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can view own profile views count" ON public.profile_views 
FOR SELECT USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Reports Policies
CREATE POLICY "Authenticated users can submit reports" ON public.reports 
FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

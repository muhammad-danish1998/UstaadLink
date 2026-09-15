-- ==============================================================================
-- TeachConnect — Malir District & UC Location Hierarchy Migration 003
-- ==============================================================================

-- 1. Add UC column to teachers table if not exists and enforce Malir District
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS uc TEXT;
ALTER TABLE public.teachers ALTER COLUMN district SET DEFAULT 'Malir';

-- 2. Add UC column to schools table if not exists and enforce Malir District
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS uc TEXT;
ALTER TABLE public.schools ALTER COLUMN district SET DEFAULT 'Malir';

-- 3. Create performance index for location filtering (District, Town, UC)
CREATE INDEX IF NOT EXISTS idx_teachers_malir_location ON public.teachers (district, town_area, uc);
CREATE INDEX IF NOT EXISTS idx_schools_malir_location ON public.schools (district, area, uc);

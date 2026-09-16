-- ==============================================================================
-- TeachConnect / UstaadLink — Teaching Mode Migration 004
-- ==============================================================================

-- 1. Add teaching_mode, online_hourly_rate, and monthly_salary columns
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS teaching_mode TEXT NOT NULL DEFAULT 'onsite' 
CHECK (teaching_mode IN ('onsite', 'online', 'both'));

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS online_hourly_rate NUMERIC;

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC;

-- 2. Backfill existing records: set monthly_salary from expected_salary if null
UPDATE public.teachers 
SET monthly_salary = expected_salary 
WHERE monthly_salary IS NULL AND expected_salary IS NOT NULL;

-- 3. Create performance index for teaching mode filtering
CREATE INDEX IF NOT EXISTS idx_teachers_teaching_mode ON public.teachers (teaching_mode);
CREATE INDEX IF NOT EXISTS idx_teachers_online_hourly_rate ON public.teachers (online_hourly_rate);

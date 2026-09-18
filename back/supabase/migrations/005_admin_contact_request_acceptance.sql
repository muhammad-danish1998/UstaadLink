-- ==============================================================================
-- TeachConnect — Admin Contact Request Approval & Permissions Migration 005
-- ==============================================================================

-- 1. Add optional approved_by column to teacher_contact_requests if not exists
ALTER TABLE IF EXISTS public.teacher_contact_requests 
ADD COLUMN IF NOT EXISTS approved_by TEXT DEFAULT 'teacher' CHECK (approved_by IN ('teacher', 'admin', 'system'));

-- 2. Open Contact Requests Policies for Select, Insert, Update, Delete
DROP POLICY IF EXISTS "Teachers view their received contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Schools view their sent contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Admins view all contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Allow select contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Allow select contact requests" ON public.teacher_contact_requests
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers update response to contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Admins update contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Allow update contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Allow update contact requests" ON public.teacher_contact_requests
FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Schools can create contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Allow insert contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Allow insert contact requests" ON public.teacher_contact_requests
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins delete contact requests" ON public.teacher_contact_requests;
DROP POLICY IF EXISTS "Allow delete contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Allow delete contact requests" ON public.teacher_contact_requests
FOR DELETE USING (true);

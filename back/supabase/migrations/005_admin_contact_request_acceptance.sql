-- ==============================================================================
-- TeachConnect — Admin Contact Request Approval & Permissions Migration 005
-- ==============================================================================

-- 1. Add optional approved_by column to teacher_contact_requests if not exists
ALTER TABLE IF EXISTS public.teacher_contact_requests 
ADD COLUMN IF NOT EXISTS approved_by TEXT DEFAULT 'teacher' CHECK (approved_by IN ('teacher', 'admin', 'system'));

-- 2. Add Admin RLS Policies for teacher_contact_requests so Admins can inspect and approve
DROP POLICY IF EXISTS "Admins view all contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Admins view all contact requests" ON public.teacher_contact_requests
FOR SELECT USING (
    public.is_admin()
);

DROP POLICY IF EXISTS "Admins update contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Admins update contact requests" ON public.teacher_contact_requests
FOR UPDATE USING (
    public.is_admin()
);

DROP POLICY IF EXISTS "Admins delete contact requests" ON public.teacher_contact_requests;
CREATE POLICY "Admins delete contact requests" ON public.teacher_contact_requests
FOR DELETE USING (
    public.is_admin()
);

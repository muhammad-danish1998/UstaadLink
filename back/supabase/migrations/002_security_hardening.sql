-- ==============================================================================
-- TeachConnect — Security & Row Level Security (RLS) Hardening Migration 002
-- ==============================================================================

-- 1. Function to check if active user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent unauthorized role modification by users
CREATE OR REPLACE FUNCTION public.protect_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is modifying their own profile, do not allow changing their role to 'admin'
    IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role <> 'admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Only an existing admin can assign admin privileges.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_role ON public.profiles;
CREATE TRIGGER trg_protect_user_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_user_role_change();

-- 3. Ensure moderation_status can only be changed by Admin on Teachers & Schools
CREATE OR REPLACE FUNCTION public.protect_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) THEN
        IF NOT public.is_admin() AND auth.uid() IS NOT NULL THEN
            -- Preserve old moderation status if non-admin attempts modification
            NEW.moderation_status := OLD.moderation_status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_teacher_moderation ON public.teachers;
CREATE TRIGGER trg_protect_teacher_moderation
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.protect_moderation_status();

DROP TRIGGER IF EXISTS trg_protect_school_moderation ON public.schools;
CREATE TRIGGER trg_protect_school_moderation
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.protect_moderation_status();

-- 4. Secure Contact Request Rate-Limiting Function (Server-Side: Max 20 per 24 hours per school)
CREATE OR REPLACE FUNCTION public.check_contact_request_rate_limit(p_school_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_recent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.teacher_contact_requests
    WHERE school_id = p_school_id
      AND created_at >= (now() - INTERVAL '24 hours');

    IF v_recent_count >= 20 THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Contact Request Rate Limit Trigger
CREATE OR REPLACE FUNCTION public.enforce_contact_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.school_id IS NOT NULL THEN
        IF NOT public.check_contact_request_rate_limit(NEW.school_id) THEN
            RAISE EXCEPTION 'Rate limit exceeded: You have reached the maximum 20 contact requests per 24-hour window.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_contact_rate_limit ON public.teacher_contact_requests;
CREATE TRIGGER trg_enforce_contact_rate_limit
BEFORE INSERT ON public.teacher_contact_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_contact_rate_limit();

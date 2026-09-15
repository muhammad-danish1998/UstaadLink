import { createClient } from '@/lib/supabase/client';
import { sanitizeInput, isValidEmail } from '@/lib/security';

export interface AdminCredentials {
  email: string;
  username: string;
  passwordHash: string;
  updatedAt: string;
}

const ADMIN_CREDS_STORAGE_KEY = 'ustaadlink_admin_secure_creds';

/**
 * Get dynamic initial admin credentials from environment or defaults
 */
function getInitialAdminConfig(): AdminCredentials {
  const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@ustaadlink.pk';
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'UstaadLinkAdmin2026!';
  const envUsername = envEmail.includes('@') ? envEmail.split('@')[0] : 'admin';

  return {
    email: envEmail,
    username: envUsername,
    passwordHash: envPassword,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get current admin credentials from storage or dynamic config
 */
export function getAdminCredentials(): AdminCredentials {
  const initial = getInitialAdminConfig();
  if (typeof window === 'undefined') return initial;

  try {
    const raw = localStorage.getItem(ADMIN_CREDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || initial.email,
      username: parsed.username || initial.username,
      passwordHash: parsed.passwordHash || initial.passwordHash,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error('getAdminCredentials error:', err);
    return initial;
  }
}

/**
 * Verify whether given credentials match admin via Supabase Auth or Dynamic Credential store
 */
export async function verifyAdminCredentials(identifier: string, password: string): Promise<boolean> {
  if (!identifier || !password) return false;

  const cleanId = identifier.trim().toLowerCase();
  const creds = getAdminCredentials();

  // 1. Try Supabase Auth direct sign-in
  try {
    const supabase = createClient();
    if (cleanId.includes('@')) {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanId,
        password: password,
      });

      if (!authErr && authData?.user) {
        // Check if role is admin
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (prof?.role === 'admin') {
          return true;
        }
      }
    }
  } catch (sbErr) {
    // Continue to dynamic credential check
  }

  // 2. Check dynamic credentials configured via Admin Dashboard or Env
  const matchesIdentifier =
    cleanId === creds.email.toLowerCase() ||
    cleanId === creds.username.toLowerCase();

  const matchesPassword = password === creds.passwordHash;

  return Boolean(matchesIdentifier && matchesPassword);
}

/**
 * Update Admin Username/Email and/or Password directly from the Admin Dashboard
 */
export async function updateAdminCredentials(
  currentPassword: string,
  newIdentifier: string, // new email or username
  newPassword?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const currentCreds = getAdminCredentials();

    // 1. Verify current password
    if (currentPassword !== currentCreds.passwordHash) {
      return { 
        success: false, 
        error: 'Current password is incorrect. Please enter your existing password to authorize changes.' 
      };
    }

    const cleanIdentifier = sanitizeInput(newIdentifier.trim());
    if (!cleanIdentifier) {
      return { success: false, error: 'Admin Email or Username cannot be empty.' };
    }

    let updatedEmail = currentCreds.email;
    let updatedUsername = currentCreds.username;

    if (isValidEmail(cleanIdentifier)) {
      updatedEmail = cleanIdentifier.toLowerCase();
      updatedUsername = cleanIdentifier.split('@')[0];
    } else {
      if (cleanIdentifier.length < 3) {
        return { success: false, error: 'Admin Username must be at least 3 characters long.' };
      }
      updatedUsername = cleanIdentifier;
      if (!currentCreds.email.includes('@')) {
        updatedEmail = `${cleanIdentifier.toLowerCase()}@ustaadlink.pk`;
      }
    }

    let updatedPassword = currentCreds.passwordHash;
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long.' };
      }
      updatedPassword = newPassword;
    }

    const updatedCreds: AdminCredentials = {
      email: updatedEmail,
      username: updatedUsername,
      passwordHash: updatedPassword,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(updatedCreds));

      // Update active demo user session if logged in as admin
      const rawUser = localStorage.getItem('teachconnect_demo_user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed.role === 'admin') {
            parsed.email = updatedEmail;
            parsed.full_name = `Admin (${updatedUsername})`;
            localStorage.setItem('teachconnect_demo_user', JSON.stringify(parsed));
            window.dispatchEvent(new Event('teachconnect_auth_change'));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. Attempt to synchronize with Supabase Auth / profile
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const updatePayload: { email?: string; password?: string } = {};
        if (newPassword && newPassword.trim()) {
          updatePayload.password = newPassword;
        }
        if (updatedEmail !== authData.user.email && isValidEmail(updatedEmail)) {
          updatePayload.email = updatedEmail;
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase.auth.updateUser(updatePayload);
        }

        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: `Administrator (${updatedUsername})`,
          email: updatedEmail,
          role: 'admin',
          updated_at: new Date().toISOString(),
        });
      }
    } catch (sbErr) {
      console.warn('Supabase admin sync warning:', sbErr);
    }

    return { 
      success: true, 
      message: 'Admin credentials updated successfully! You can now log in with your new credentials.' 
    };
  } catch (err: any) {
    console.error('updateAdminCredentials error:', err);
    return { success: false, error: err?.message || 'Failed to update admin credentials.' };
  }
}

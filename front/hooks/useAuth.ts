'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/database';
import { User } from '@supabase/supabase-js';

export interface AuthProfile extends Profile {
  avatar_url?: string | null;
  teacher_slug?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // 1. Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const userRole = (profileData?.role || session.user.user_metadata?.role || 'teacher') as UserRole;
        setRole(userRole);

        let teacherAvatar: string | null = null;
        let teacherSlug: string | null = null;

        // 2. If teacher, fetch avatar from teachers table
        if (userRole === 'teacher') {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('avatar_url, slug')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (teacherData) {
            teacherAvatar = teacherData.avatar_url || null;
            teacherSlug = teacherData.slug || null;
          }
        }

        setAvatarUrl(teacherAvatar || (session.user.user_metadata?.avatar_url as string) || null);

        setProfile({
          id: session.user.id,
          role: userRole,
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: profileData?.email || session.user.email || '',
          phone: profileData?.phone || '',
          avatar_url: teacherAvatar,
          teacher_slug: teacherSlug,
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString(),
        });
        return;
      }

      // Check localStorage for demo/prototype active session
      if (typeof window !== 'undefined') {
        const savedDemoUser = localStorage.getItem('teachconnect_demo_user');
        if (savedDemoUser) {
          try {
            const parsed = JSON.parse(savedDemoUser);
            setUser({ id: parsed.id || 'demo-user', email: parsed.email } as any);
            setRole(parsed.role || 'teacher');
            setAvatarUrl(parsed.avatar_url || null);
            setProfile(parsed);
            return;
          } catch (e) {
            console.error('Error parsing demo user:', e);
          }
        }
      }

      // If no session found
      setUser(null);
      setProfile(null);
      setRole(null);
      setAvatarUrl(null);
    } catch (err) {
      console.error('Error in useAuth:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      await loadUserData();
    });

    // Listen to custom local storage and window events for mock auth sync & account deletion
    const handleStorageChange = () => {
      handleAccountDeletion();
      loadUserData();
    };

    const handleAccountDeletion = (e?: any) => {
      try {
        if (typeof window === 'undefined') return;
        let deletedDetail = e?.detail;
        if (!deletedDetail) {
          const raw = localStorage.getItem('teachconnect_account_deleted_event');
          if (raw) {
            deletedDetail = JSON.parse(raw);
          }
        }

        if (deletedDetail) {
          const savedDemo = localStorage.getItem('teachconnect_demo_user');
          const current = savedDemo ? JSON.parse(savedDemo) : null;

          if (current) {
            const cleanTarget = (deletedDetail.slugOrName || '').toLowerCase().trim();
            const isMatch =
              current.id === deletedDetail.id ||
              (current.email && (current.email.toLowerCase() === cleanTarget || current.email.toLowerCase().includes(cleanTarget))) ||
              (current.full_name && (current.full_name.toLowerCase() === cleanTarget || current.full_name.toLowerCase().includes(cleanTarget))) ||
              (current.role === 'teacher' && deletedDetail.role === 'Teacher' && (current.full_name?.toLowerCase() === cleanTarget || current.id === deletedDetail.id)) ||
              (current.role === 'school' && deletedDetail.role === 'School' && (current.full_name?.toLowerCase() === cleanTarget || current.id === deletedDetail.id));

            if (isMatch) {
              localStorage.removeItem('teachconnect_demo_user');
              localStorage.removeItem('teachconnect_card_draft');
              sessionStorage.removeItem('teachconnect_card_draft');
              sessionStorage.removeItem('temp_teacher_profile');
              sessionStorage.removeItem('temp_school_profile');
              setUser(null);
              setProfile(null);
              setRole(null);
              setAvatarUrl(null);
              createClient().auth.signOut().catch(() => {});
              if (window.location.pathname.startsWith('/teacher') || window.location.pathname.startsWith('/school') || window.location.pathname.startsWith('/create-card')) {
                window.location.href = '/';
              }
            }
          }
        }
      } catch (err) {
        console.error('handleAccountDeletion error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('teachconnect_auth_change', handleStorageChange);
    window.addEventListener('teachconnect_account_deleted', handleAccountDeletion);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('teachconnect_auth_change', handleStorageChange);
      window.removeEventListener('teachconnect_account_deleted', handleAccountDeletion);
    };
  }, [loadUserData]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('teachconnect_demo_user');
        localStorage.removeItem('teachconnect_card_draft');
        sessionStorage.removeItem('teachconnect_card_draft');
        sessionStorage.removeItem('temp_teacher_profile');
        sessionStorage.removeItem('temp_school_profile');
        window.dispatchEvent(new Event('teachconnect_auth_change'));
      }
      setUser(null);
      setProfile(null);
      setRole(null);
      setAvatarUrl(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return {
    user,
    profile,
    role,
    avatarUrl,
    loading,
    isAuthenticated: !!user,
    signOut,
    refreshAuth: loadUserData,
  };
}

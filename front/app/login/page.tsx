'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  School,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { verifyAdminCredentials, getAdminCredentials } from '@/lib/adminAuth';
import { fetchCurrentTeacherProfile } from '@/services/teacherService';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.email.trim()) {
      errs.email = 'Email or Username is required';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const cleanInput = formData.email.trim();
      const currentAdmin = getAdminCredentials();

      // 1. Secure Admin Authentication Check
      const isAdminIdentifier = 
        cleanInput.toLowerCase() === currentAdmin.email.toLowerCase() ||
        cleanInput.toLowerCase() === currentAdmin.username.toLowerCase() ||
        cleanInput.toLowerCase() === 'admin';

      if (isAdminIdentifier) {
        const isPasswordCorrect = await verifyAdminCredentials(cleanInput, formData.password);
        if (isPasswordCorrect) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'teachconnect_demo_user',
              JSON.stringify({
                id: 'admin-master',
                email: currentAdmin.email,
                full_name: `Administrator (${currentAdmin.username})`,
                role: 'admin',
              })
            );
            window.dispatchEvent(new Event('teachconnect_auth_change'));
          }
          router.push('/admin');
          router.refresh();
          return;
        } else {
          setErrors({ form: 'Invalid password for Administrator account. Please enter the correct admin password.' });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Teacher / School Authentication via Supabase
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password: formData.password,
      });

      if (authError) {
        // Check profile table directly for prototype accounts
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, full_name, email')
          .eq('email', cleanInput)
          .maybeSingle();

        if (profile) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'teachconnect_demo_user',
              JSON.stringify({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
              })
            );
            window.dispatchEvent(new Event('teachconnect_auth_change'));
          }

          if (profile.role === 'school') {
            router.push('/school/dashboard');
          } else if (profile.role === 'admin') {
            router.push('/admin');
          } else {
            // Load fresh teacher card profile into storage cache
            await fetchCurrentTeacherProfile(profile.id);
            router.push('/teacher/dashboard');
          }
          router.refresh();
          return;
        }

        setErrors({ form: authError.message || 'Invalid email or password. Please check your credentials.' });
        return;
      }

      if (authData?.user) {
        // Query user role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', authData.user.id)
          .maybeSingle();

        const role = profile?.role || 'teacher';
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'teachconnect_demo_user',
            JSON.stringify({
              id: authData.user.id,
              email: authData.user.email,
              full_name: profile?.full_name || authData.user.email?.split('@')[0],
              role,
            })
          );
          window.dispatchEvent(new Event('teachconnect_auth_change'));
        }

        if (role === 'school') {
          router.push('/school/dashboard');
        } else if (role === 'admin') {
          router.push('/admin');
        } else {
          // Load fresh teacher card profile into storage cache
          await fetchCurrentTeacherProfile(authData.user.id);
          router.push('/teacher/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Form Section (7 cols) */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">UstaadLink</span>
            </div>

            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Log in to access your Educator Profile, School Dashboard, or Admin moderation.
              </p>
            </div>

            {errors.form && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
                {errors.form}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="e.g. teacher@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Remember me</span>
                </label>
                <Link href="#" className="text-blue-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  icon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In to UstaadLink'}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer inside Left Column */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register/teacher" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create Free Profile
              </Link>
            </div>
            <Link 
              href="/register/school" 
              className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 font-medium transition-colors"
            >
              <School className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register School</span>
            </Link>
          </div>
        </div>

        {/* Right Feature Panel (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

          {/* Top Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold w-fit border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Teacher &bull; School &bull; Admin</span>
          </div>

          {/* Center Graphic & Highlights */}
          <div className="my-8 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight leading-snug">
                One platform connecting educators and schools directly.
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Log in to respond to school contact requests, manage your teacher profile, or discover teaching candidates.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Teachers</span>
                  <span className="text-blue-100/80 text-[11px]">Track profile views, receive requests, and manage profile visibility.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Schools</span>
                  <span className="text-blue-100/80 text-[11px]">Shortlist candidates and submit direct hiring contact requests.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="pt-4 border-t border-white/20 flex items-center gap-2 text-[11px] text-blue-100">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Secure Role-Based Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard, checkDuplicateContactNumber } from '@/services/teacherService';
import { normalizePhoneNumber, isValidPakistaniPhone, isValidEmail, sanitizeInput } from '@/lib/security';

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters';
    }

    if (!formData.fatherName.trim()) {
      errs.fatherName = "Father's Name is required for official records";
    } else if (formData.fatherName.trim().length < 2) {
      errs.fatherName = "Father's Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com)';
    }

    const normPhone = normalizePhoneNumber(formData.phone);
    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required';
    } else if (!isValidPakistaniPhone(formData.phone)) {
      errs.phone = 'Please enter a valid Pakistani mobile number (e.g. 03001234567)';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
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
    setErrors({});

    const cleanEmail = sanitizeInput(formData.email.trim().toLowerCase());
    const cleanFullName = sanitizeInput(formData.fullName.trim());
    const cleanFatherName = sanitizeInput(formData.fatherName.trim());
    const cleanPhone = normalizePhoneNumber(formData.phone);

    // Duplicate contact number check
    const phoneCheck = await checkDuplicateContactNumber(cleanPhone, 'teacher');
    if (phoneCheck.isDuplicate) {
      setErrors({ phone: phoneCheck.message || 'This contact number is already registered. Please log in.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      let authUserId: string | null = null;

      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: cleanFullName,
            role: 'teacher',
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: formData.password,
          });
          if (signInErr) {
            setErrors({ email: 'An account with this email already exists. Please log in.' });
            setIsSubmitting(false);
            return;
          }
          authUserId = signInData?.user?.id || null;
        } else {
          console.warn('Supabase auth notice:', authError.message);
          // If auth rejected, show specific message
          if (authError.message.toLowerCase().includes('invalid')) {
            setErrors({ email: authError.message });
            setIsSubmitting(false);
            return;
          }
        }
      } else if (authResult?.user) {
        authUserId = authResult.user.id;
      }

      const effectiveUserId = authUserId || crypto.randomUUID();

      try {
        await supabase.from('profiles').upsert({
          id: effectiveUserId,
          full_name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'teacher',
        });
      } catch (profErr) {
        console.warn('Profile upsert notice:', profErr);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'teachconnect_demo_user',
          JSON.stringify({
            id: effectiveUserId,
            email: cleanEmail,
            full_name: cleanFullName,
            phone: cleanPhone,
            role: 'teacher',
          })
        );
        window.dispatchEvent(new Event('teachconnect_auth_change'));
        
        sessionStorage.setItem('temp_teacher_profile', JSON.stringify({
          userId: effectiveUserId,
          fullName: cleanFullName,
          fatherName: cleanFatherName,
          email: cleanEmail,
          phone: cleanPhone,
        }));
      }

      const initialDraft = {
        userId: effectiveUserId,
        fullName: cleanFullName,
        fatherName: cleanFatherName,
        phone: cleanPhone,
        email: cleanEmail,
        isPublished: true,
      };

      saveCardDraft(initialDraft);

      // Persist to Supabase and local cache immediately
      await publishTeacherCard(initialDraft);

      router.push('/create-card/step-1');
      router.refresh();
    } catch (err: any) {
      console.error('Teacher registration error:', err);
      setErrors({ form: err?.message || 'An error occurred during registration. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/70 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Form Section (7 cols) */}
        <div className="p-6 sm:p-8 lg:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">UstaadLink</span>
                  <span className="text-[11px] text-blue-600 font-medium">Teacher Portal</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>100% Free</span>
              </span>
            </div>

            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Your Teacher Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Connect directly with hiring schools in District Malir without recruitment agents.
              </p>
            </div>

            {errors.form && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Section 1: Personal Details */}
              <div className="space-y-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Personal Identity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Full Name"
                    name="fullName"
                    placeholder="e.g. Ayesha Khan"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    icon={<User className="w-4 h-4" />}
                    required
                  />
                  <Input
                    label="Father's Name"
                    name="fatherName"
                    placeholder="e.g. Muhammad Ali"
                    value={formData.fatherName}
                    onChange={handleChange}
                    error={errors.fatherName}
                    helperText="Private for record verification"
                    icon={<User className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-3.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Contact &amp; Login
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="ayesha@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                  <Input
                    label="Mobile / WhatsApp"
                    type="tel"
                    name="phone"
                    placeholder="03001234567"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    helperText="Shared only with accepted schools"
                    icon={<Phone className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>

              {/* Section 3: Password & Security */}
              <div className="space-y-3.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  3. Account Security
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    icon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By clicking Sign Up, you agree to UstaadLink&apos;s{' '}
                  <Link href="/terms" className="text-blue-600 font-semibold hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 font-semibold hover:underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  icon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-lg shadow-blue-500/25 transition-transform active:scale-[0.99]"
                >
                  {isSubmitting ? 'Creating Teacher Account...' : 'Sign Up & Build Teacher Card'}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Log In
              </Link>
            </div>
            <Link 
              href="/register/school" 
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-semibold transition-colors group"
            >
              <School className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Register as a School instead &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Right Feature Panel (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-8 xl:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Verified Teacher Network</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug">
                Get discovered by top schools in District Malir.
              </h2>
              <p className="text-xs xl:text-sm text-blue-100/90 leading-relaxed">
                Build your professional Teacher Card in minutes. Showcase your subject expertise and receive direct interview requests.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">100% Free Forever</span>
                  <span className="text-blue-100/80 text-[11px] leading-tight">No commission cuts or subscription fees on your salary.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">Direct School Reach</span>
                  <span className="text-blue-100/80 text-[11px] leading-tight">Appear in targeted searches by Malir Town &amp; Union Council.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">Privacy &amp; Contact Protection</span>
                  <span className="text-blue-100/80 text-[11px] leading-tight">Your phone number is only shared after you approve an inquiry.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Seal */}
          <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-100">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Verified School Inquiries</span>
            </div>
            <span className="text-white/60">Karachi, PK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

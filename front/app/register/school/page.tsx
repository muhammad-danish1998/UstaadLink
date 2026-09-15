'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  School, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  GraduationCap,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { registerSchoolProfile, checkDuplicateContactNumber } from '@/services/teacherService';
import { normalizePhoneNumber, isValidPakistaniPhone, isValidEmail, sanitizeInput } from '@/lib/security';
import { 
  MALIR_DISTRICT, 
  MALIR_LOCATIONS,
  MALIR_TOWNS,
  CUSTOM_LOCATION_VALUE,
  getTownOptions, 
  getUcOptionsForTown, 
  isValidMalirLocation 
} from '@/lib/malirLocations';

const schoolTypeOptions = [
  { value: 'Private', label: 'Private School' },
  { value: 'Public', label: 'Public / Government School' },
  { value: 'International', label: 'International / Cambridge (O/A Levels)' },
  { value: 'Other', label: 'Other Educational Institution' },
];

function SchoolRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Karachi',
    district: MALIR_DISTRICT,
    town: 'Malir Town',
    customTown: '',
    uc: 'Qaidabad',
    customUc: '',
    isCustomTown: false,
    isCustomUc: false,
    schoolType: 'Private',
    customSchoolType: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const townOptions = [
    { value: '', label: 'Select Town' },
    ...getTownOptions()
  ];

  const currentTownName = formData.isCustomTown 
    ? formData.customTown 
    : (formData.town === CUSTOM_LOCATION_VALUE ? '' : formData.town);

  const ucOptions = currentTownName && MALIR_LOCATIONS[currentTownName]
    ? [
        { value: '', label: 'Select Union Council (UC)' },
        ...getUcOptionsForTown(currentTownName)
      ]
    : [
        { value: '', label: 'Select Union Council (UC)' },
        { value: CUSTOM_LOCATION_VALUE, label: '✏️ Other / Custom UC (Write your own)' }
      ];

  const handleTownChange = (selectedTown: string) => {
    if (selectedTown === CUSTOM_LOCATION_VALUE) {
      setFormData((prev) => ({
        ...prev,
        town: CUSTOM_LOCATION_VALUE,
        isCustomTown: true,
        uc: CUSTOM_LOCATION_VALUE,
        isCustomUc: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        town: selectedTown,
        isCustomTown: false,
        customTown: '',
        uc: '',
        customUc: '',
        isCustomUc: false,
      }));
    }
    if (errors.town) setErrors((prev) => ({ ...prev, town: '' }));
    if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
  };

  const handleUcChange = (selectedUc: string) => {
    if (selectedUc === CUSTOM_LOCATION_VALUE) {
      setFormData((prev) => ({
        ...prev,
        uc: CUSTOM_LOCATION_VALUE,
        isCustomUc: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        uc: selectedUc,
        isCustomUc: false,
        customUc: '',
      }));
    }
    if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.schoolName.trim()) {
      errs.schoolName = 'School Name is required';
    } else if (formData.schoolName.trim().length < 2) {
      errs.schoolName = 'School Name must be at least 2 characters';
    }

    if (!formData.contactPerson.trim()) {
      errs.contactPerson = 'Contact Person Name is required';
    } else if (formData.contactPerson.trim().length < 2) {
      errs.contactPerson = 'Contact Person Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Official School Email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Please enter a valid official email address (e.g. info@school.edu.pk)';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required';
    } else if (!isValidPakistaniPhone(formData.phone)) {
      errs.phone = 'Please enter a valid contact number (e.g. 03001234567 or 02134567890)';
    }

    const effectiveTown = formData.isCustomTown ? formData.customTown.trim() : formData.town;
    const effectiveUc = formData.isCustomUc ? formData.customUc.trim() : formData.uc;

    if (!effectiveTown || effectiveTown === CUSTOM_LOCATION_VALUE) {
      errs.town = 'Please specify or select your Town in District Malir';
    }

    if (!effectiveUc || effectiveUc === CUSTOM_LOCATION_VALUE) {
      errs.uc = 'Please specify or select your Union Council / Area';
    } else if (!isValidMalirLocation(effectiveTown, effectiveUc)) {
      errs.uc = 'Please enter a valid Union Council / Area name (min. 2 characters)';
    }

    if (!formData.schoolType) {
      errs.schoolType = 'Please select a school type';
    }

    if (formData.schoolType === 'Other' && !formData.customSchoolType.trim()) {
      errs.customSchoolType = 'Please specify school type';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const cleanSchoolName = sanitizeInput(formData.schoolName.trim());
    const cleanContactPerson = sanitizeInput(formData.contactPerson.trim());
    const cleanPhone = normalizePhoneNumber(formData.phone);

    // Duplicate contact number check
    const phoneCheck = await checkDuplicateContactNumber(cleanPhone, 'school');
    if (phoneCheck.isDuplicate) {
      setErrors({ phone: phoneCheck.message || 'This contact number is already registered. Please log in.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: cleanSchoolName,
            role: 'school',
          },
        },
      });

      if (authError && !authError.message.toLowerCase().includes('already registered')) {
        console.warn('Supabase auth signup notice:', authError.message);
      }

      if (authResult?.user) {
        await supabase.from('profiles').upsert({
          id: authResult.user.id,
          full_name: cleanSchoolName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'school',
        });
      }

      const effectiveTown = formData.isCustomTown ? formData.customTown.trim() : formData.town;
      const effectiveUc = formData.isCustomUc ? formData.customUc.trim() : formData.uc;

      const schoolPayload = {
        schoolName: cleanSchoolName,
        contactPerson: cleanContactPerson,
        email: cleanEmail,
        phone: cleanPhone,
        city: 'Karachi',
        district: MALIR_DISTRICT,
        town: effectiveTown,
        uc: effectiveUc,
        area: `${effectiveUc}, ${effectiveTown}`,
        schoolType: formData.schoolType,
        customSchoolType: sanitizeInput(formData.customSchoolType.trim()),
      };

      const userId = authResult?.user?.id || `school-${Date.now()}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'teachconnect_demo_user',
          JSON.stringify({
            id: userId,
            email: formData.email,
            full_name: formData.schoolName,
            phone: formData.phone,
            role: 'school',
            district: MALIR_DISTRICT,
            town: effectiveTown,
            uc: effectiveUc,
            area: `${effectiveUc}, ${effectiveTown}`,
          })
        );
        window.dispatchEvent(new Event('teachconnect_auth_change'));
      }

      await registerSchoolProfile(schoolPayload);

      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push('/school/dashboard');
      }
    } catch (err: any) {
      console.error('School registration error:', err);
      setErrors({ form: err?.message || 'Failed to complete school registration' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/70 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Col: Registration Form (7 cols) */}
        <div className="p-6 sm:p-8 lg:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">UstaadLink</span>
                  <span className="text-[11px] text-emerald-600 font-medium">School Portal</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>District Malir</span>
              </span>
            </div>

            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Register School Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Connect with qualified teachers in District Malir and send direct hiring inquiries.
              </p>
            </div>

            {errors.form && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Section 1: Institution Details */}
              <div className="space-y-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Institution Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="School Name"
                    name="schoolName"
                    placeholder="e.g. City Grammar School"
                    icon={<School className="w-4 h-4" />}
                    value={formData.schoolName}
                    onChange={handleChange}
                    error={errors.schoolName}
                    required
                  />

                  <Input
                    label="Contact Person / Title"
                    name="contactPerson"
                    placeholder="e.g. Mrs. Farhana (Principal)"
                    icon={<User className="w-4 h-4" />}
                    value={formData.contactPerson}
                    onChange={handleChange}
                    error={errors.contactPerson}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Official Contact Information */}
              <div className="space-y-3.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Official Contact Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Official Email Address"
                    name="email"
                    type="email"
                    placeholder="admin@school.edu.pk"
                    icon={<Mail className="w-4 h-4" />}
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />

                  <Input
                    label="School Contact Phone"
                    name="phone"
                    placeholder="03001234567"
                    icon={<Phone className="w-4 h-4" />}
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    helperText="Official school phone or WhatsApp"
                    required
                  />
                </div>
              </div>

              {/* Section 3: Campus Location (District Malir) */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  3. Campus Location
                </div>
                
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Location in District Malir
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> District Malir Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Fixed District */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                        District
                      </label>
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>{MALIR_DISTRICT}</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* 2. Town Dropdown/Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                          Town <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextIsCustom = !formData.isCustomTown;
                            setFormData((prev) => ({
                              ...prev,
                              isCustomTown: nextIsCustom,
                              town: nextIsCustom ? CUSTOM_LOCATION_VALUE : (MALIR_TOWNS[0] || ''),
                              customTown: nextIsCustom ? prev.customTown : '',
                              isCustomUc: nextIsCustom ? true : prev.isCustomUc,
                              uc: nextIsCustom ? CUSTOM_LOCATION_VALUE : prev.uc,
                            }));
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          {formData.isCustomTown ? 'Select list' : 'Type custom'}
                        </button>
                      </div>

                      {formData.isCustomTown ? (
                        <Input
                          placeholder="e.g. Model Colony"
                          value={formData.customTown}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, customTown: e.target.value }));
                            if (errors.town) setErrors((prev) => ({ ...prev, town: '' }));
                          }}
                          error={errors.town}
                          required
                        />
                      ) : (
                        <Select
                          name="town"
                          options={townOptions}
                          value={formData.town}
                          onChange={(e) => handleTownChange(e.target.value)}
                          error={errors.town}
                          required
                        />
                      )}
                    </div>

                    {/* 3. UC Dependent Dropdown/Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                          UC / Area <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextIsCustom = !formData.isCustomUc;
                            setFormData((prev) => ({
                              ...prev,
                              isCustomUc: nextIsCustom,
                              uc: nextIsCustom ? CUSTOM_LOCATION_VALUE : (MALIR_LOCATIONS[formData.town]?.[0] || ''),
                              customUc: nextIsCustom ? prev.customUc : '',
                            }));
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          {formData.isCustomUc ? 'Select list' : 'Type custom'}
                        </button>
                      </div>

                      {formData.isCustomUc ? (
                        <Input
                          placeholder="e.g. Saadi Town"
                          value={formData.customUc}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, customUc: e.target.value }));
                            if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
                          }}
                          error={errors.uc}
                          required
                        />
                      ) : (
                        <Select
                          name="uc"
                          options={ucOptions}
                          value={formData.uc}
                          onChange={(e) => handleUcChange(e.target.value)}
                          error={errors.uc}
                          disabled={!currentTownName}
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Institution Type & Security */}
              <div className="space-y-3.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  4. Institution Type &amp; Security
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Select
                    label="School Type"
                    name="schoolType"
                    options={schoolTypeOptions}
                    value={formData.schoolType}
                    onChange={handleChange}
                    error={errors.schoolType}
                  />

                  {formData.schoolType === 'Other' && (
                    <Input
                      label="Specify Institution Type"
                      name="customSchoolType"
                      placeholder="e.g. Coaching Center, Academy"
                      value={formData.customSchoolType}
                      onChange={handleChange}
                      error={errors.customSchoolType}
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
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
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
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
                  By registering, you agree to UstaadLink&apos;s{' '}
                  <Link href="/terms" className="text-emerald-700 font-semibold hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-emerald-700 font-semibold hover:underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  icon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-lg shadow-emerald-600/25 transition-transform active:scale-[0.99]"
                >
                  {isSubmitting ? 'Registering School...' : 'Register School Account'}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Already registered?{' '}
              <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                Log In
              </Link>
            </div>
            <Link 
              href="/register/teacher" 
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-700 font-semibold transition-colors group"
            >
              <GraduationCap className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Register as a Teacher instead &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Right Col: Benefits Panel (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-8 xl:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20 shadow-xs">
              <Building className="w-3.5 h-3.5 text-emerald-300" />
              <span>Recruiter Portal</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug">
                Hire Qualified Teachers in District Malir.
              </h2>
              <p className="text-xs xl:text-sm text-emerald-100/90 leading-relaxed">
                UstaadLink provides direct access to educator profiles across Malir Town, Gadap Town, and Ibrahim Hyderi without agency fees.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">Precise Location Search</span>
                  <span className="text-emerald-100/80 text-[11px] leading-tight">Filter by Subject, Class Grade, Malir Town &amp; Union Council.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">Direct Contact Inquiries</span>
                  <span className="text-emerald-100/80 text-[11px] leading-tight">Send interview requests directly to teachers with 0% commission.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white text-xs">Private Candidate Shortlisting</span>
                  <span className="text-emerald-100/80 text-[11px] leading-tight">Bookmark promising candidate cards for current and upcoming terms.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Seal */}
          <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-emerald-100">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Verified Educator Database</span>
            </div>
            <span className="text-white/60">District Malir, PK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchoolRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SchoolRegisterContent />
    </Suspense>
  );
}

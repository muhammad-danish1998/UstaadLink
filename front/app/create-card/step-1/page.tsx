'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ArrowRight, 
  ArrowLeft,
  Upload, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { uploadTeacherAvatar } from '@/lib/uploadImage';
import { publishTeacherCard, fetchCurrentTeacherProfile } from '@/services/teacherService';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function CreateCardStep1Page() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    gender: 'Female' as 'Male' | 'Female' | '',
    profilePhotoUrl: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string>('');

  useEffect(() => {
    async function initStep1() {
      let draft = getCardDraft();
      const currentUserId = user?.id || profile?.id;
      if (currentUserId) {
        const fetched = await fetchCurrentTeacherProfile(currentUserId);
        if (fetched) {
          draft = fetched;
        }
      }
      setFormData({
        fullName: draft.fullName || profile?.full_name || '',
        fatherName: draft.fatherName || '',
        gender: (draft.gender as 'Male' | 'Female') || 'Female',
        profilePhotoUrl: draft.profilePhotoUrl || '',
      });
      if (draft.profilePhotoUrl) {
        setPhotoPreview(draft.profilePhotoUrl);
      }
    }
    initStep1();
  }, [user?.id, profile?.id, profile?.full_name]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5 MB limit');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Compress and upload directly to Supabase CDN Storage bucket
      const uploadedUrl = await uploadTeacherAvatar(file, formData.fullName ? formData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'teacher');
      if (uploadedUrl) {
        setPhotoPreview(uploadedUrl);
        setFormData((prev) => ({ ...prev, profilePhotoUrl: uploadedUrl }));
        const updated = saveCardDraft({ 
          fullName: formData.fullName,
          fatherName: formData.fatherName,
          gender: formData.gender,
          profilePhotoUrl: uploadedUrl 
        });
        // Immediately persist to Supabase PostgreSQL database
        await publishTeacherCard(updated);
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setPhotoError('Failed to process image. Please try another image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    }

    if (!formData.fatherName.trim()) {
      errs.fatherName = "Father's Name is required for profile records";
    }

    if (!formData.gender) {
      errs.gender = 'Please select a gender';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Save step data to draft
    const updated = saveCardDraft({
      fullName: formData.fullName,
      fatherName: formData.fatherName,
      gender: formData.gender,
      profilePhotoUrl: photoPreview,
      isPublished: true,
    });

    // Write to Supabase PostgreSQL database
    await publishTeacherCard(updated);

    router.push('/create-card/step-2');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Title & Subtitle */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              href="/teacher/dashboard"
              icon={<ArrowLeft className="w-4 h-4" />}
              className="text-slate-600 hover:text-slate-900 -ml-2 text-xs font-semibold"
            >
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create / Edit Your Educator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fill in your details to create or update your professional profile on TeachConnect.
          </p>
        </div>

        {/* Main Wizard Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Stepper Sidebar (4 cols) */}
          <aside className="p-5 sm:p-6 lg:col-span-4 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Step 1 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={1} />
          </aside>

          {/* Right Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section Header */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Basic Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your identity details as they appear on your card and record.
                </p>
              </div>

              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="e.g. Ayesha Khan"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                error={errors.fullName}
                icon={<User className="w-4 h-4" />}
                required
              />

              {/* Father's Name */}
              <div>
                <Input
                  label="Father's Name"
                  placeholder="e.g. Muhammad Ali"
                  value={formData.fatherName}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, fatherName: e.target.value }));
                    if (errors.fatherName) setErrors((prev) => ({ ...prev, fatherName: '' }));
                  }}
                  error={errors.fatherName}
                  icon={<User className="w-4 h-4" />}
                  required
                />
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Privacy rule: Father&apos;s name is kept private and never shown publicly on your searchable card.</span>
                </div>
              </div>

              {/* Gender Radio Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === 'Female'}
                      onChange={() => setFormData((prev) => ({ ...prev, gender: 'Female' }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Female</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === 'Male'}
                      onChange={() => setFormData((prev) => ({ ...prev, gender: 'Male' }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Male</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
                )}
              </div>

              {/* Profile Photo Upload */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-blue-50 border-2 border-blue-200 shrink-0 shadow-xs">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.step1-initials-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="step1-initials-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-xl"
                      style={{ display: photoPreview ? 'none' : 'flex' }}
                    >
                      {formData.fullName ? formData.fullName.slice(0, 2).toUpperCase() : 'TC'}
                    </div>
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        icon={isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      >
                        {isUploadingPhoto ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setFormData((prev) => ({ ...prev, profilePhotoUrl: '' }));
                            saveCardDraft({ profilePhotoUrl: '' });
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {photoPreview ? 'Profile photo is automatically compressed and optimized (< 25 KB)' : 'Optional. Photos are automatically compressed to under 25 KB.'}
                    </p>
                    {photoError && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {photoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="px-6 font-semibold shadow-md shadow-blue-500/20"
                >
                  Next: Education
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

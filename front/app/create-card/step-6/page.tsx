'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Banknote, 
  Edit3, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Phone,
  ShieldCheck,
  Building2,
  Building,
  FileCheck2,
  Laptop,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, TeacherCardDraft } from '@/lib/cardBuilderStorage';
import { formatLocation } from '@/lib/malirLocations';

export default function CreateCardStep6ReviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<TeacherCardDraft | null>(null);

  useEffect(() => {
    const data = getCardDraft();
    setDraft(data);
  }, []);

  if (!draft) return null;

  const mode = draft.teachingMode || 'onsite';

  const formattedSalary = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(draft.monthlySalary || draft.expectedSalary || 35000);

  const formattedHourlyRate = draft.onlineHourlyRate
    ? new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
      }).format(draft.onlineHourlyRate)
    : 'Rs. 800';

  const displayLocation = formatLocation(
    draft.uc,
    draft.town || draft.area,
    draft.district || 'Malir'
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Educator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your profile preview exactly as schools and students will see it before publishing.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Stepper Sidebar (4 cols) */}
          <aside className="p-5 sm:p-6 lg:col-span-4 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Step 6 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={6} />
          </aside>

          {/* Review Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Live Profile Preview
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This profile will appear in recruitment search results.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/70">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Preview</span>
                </div>
              </div>

              {/* Big Style Teacher Card Preview */}
              <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-blue-500/40 p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden">
                {/* Top Gradient Hover Accent */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

                {/* Header: Status Pills + Mode Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {mode === 'online' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                      <Laptop className="w-3.5 h-3.5 text-purple-600" />
                      <span>Online Only</span>
                    </span>
                  ) : mode === 'both' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                      <span>On-site + Online</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>On-site School</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Available for Hire</span>
                  </span>
                </div>

                {/* Profile Info: Avatar + Name + Degree */}
                <div className="flex items-center gap-4 sm:gap-5 pt-1">
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200/90 shadow-md shrink-0">
                    {draft.profilePhotoUrl ? (
                      <img
                        src={draft.profilePhotoUrl}
                        alt={draft.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.step6-initials-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="step6-initials-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-black text-2xl sm:text-3xl tracking-tight"
                      style={{ display: draft.profilePhotoUrl ? 'none' : 'flex' }}
                    >
                      {draft.fullName ? draft.fullName.slice(0, 2).toUpperCase() : 'TC'}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-xl sm:text-2xl tracking-tight truncate block">
                        {draft.fullName || 'Teacher Name'}
                      </h4>
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-semibold">
                      <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate block">{draft.highestEducation || 'Education Degree'}</span>
                    </div>
                  </div>
                </div>

                {/* Subjects & Class Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(draft.subjects || ['English', 'Urdu']).map((subj) => (
                    <span
                      key={subj}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                    >
                      {subj}
                    </span>
                  ))}
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
                    Class {draft.classes || '6 - 10'}
                  </span>
                </div>

                {/* Details list */}
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
                      <Briefcase className="w-4 h-4 text-blue-600/80 shrink-0" />
                      <span>Experience:</span>
                    </span>
                    <span className="font-extrabold text-slate-900 text-right">
                      {draft.experienceYears} {draft.experienceYears === 1 ? 'Year' : 'Years'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
                      <Clock className="w-4 h-4 text-blue-600/80 shrink-0" />
                      <span>Availability:</span>
                    </span>
                    <span className="font-extrabold text-slate-900 text-right">{draft.availability || 'Morning'} Shift</span>
                  </div>

                  {mode !== 'online' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600/80 shrink-0" />
                        <span>On-site Location:</span>
                      </span>
                      <span className="font-extrabold text-slate-900 text-right truncate max-w-[190px] sm:max-w-[240px]">
                        {displayLocation}
                      </span>
                    </div>
                  )}

                  {mode === 'onsite' && (
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
                      <span className="flex items-center gap-2 text-slate-700 font-bold shrink-0">
                        <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Expected Monthly:</span>
                      </span>
                      <span className="font-black text-blue-700 text-base sm:text-lg text-right">{formattedSalary} / mo</span>
                    </div>
                  )}

                  {mode === 'online' && (
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
                      <span className="flex items-center gap-2 text-slate-700 font-bold shrink-0">
                        <Laptop className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Online Rate:</span>
                      </span>
                      <span className="font-black text-purple-700 text-base sm:text-lg text-right">{formattedHourlyRate} / hr</span>
                    </div>
                  )}

                  {mode === 'both' && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Building className="w-3.5 h-3.5 text-blue-600" />
                          <span>On-site Monthly:</span>
                        </span>
                        <span className="font-black text-blue-700 text-sm sm:text-base">
                          {formattedSalary} / mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Laptop className="w-3.5 h-3.5 text-purple-600" />
                          <span>Online Hourly:</span>
                        </span>
                        <span className="font-black text-purple-700 text-sm sm:text-base">
                          {formattedHourlyRate} / hr
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Button actions preview */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 pt-2 pointer-events-none opacity-85">
                  <Button variant="outline" size="lg" className="w-full text-xs sm:text-sm font-bold rounded-2xl h-12 border-2 border-slate-200">
                    View Profile
                  </Button>
                  <Button variant="primary" size="lg" className="w-full text-xs sm:text-sm font-black rounded-2xl h-12 shadow-lg shadow-blue-500/20">
                    Contact Teacher
                  </Button>
                </div>
              </div>

              {/* Edit Quick links breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Card Section Breakdown:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-600 truncate"><strong>Name:</strong> {draft.fullName}</span>
                    <Button variant="ghost" size="sm" href="/create-card/step-1" className="h-6 px-2 text-[11px]">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-600 truncate"><strong>Degree:</strong> {draft.highestEducation}</span>
                    <Button variant="ghost" size="sm" href="/create-card/step-2" className="h-6 px-2 text-[11px]">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-600 truncate"><strong>Mode:</strong> {mode === 'online' ? 'Online' : mode === 'both' ? 'Both' : 'On-site'}</span>
                    <Button variant="ghost" size="sm" href="/create-card/step-4" className="h-6 px-2 text-[11px]">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-600 truncate"><strong>Pricing:</strong> {mode === 'online' ? `${formattedHourlyRate}/hr` : `${formattedSalary}/mo`}</span>
                    <Button variant="ghost" size="sm" href="/create-card/step-5" className="h-6 px-2 text-[11px]">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                href="/create-card/step-5"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back: Salary
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                href="/create-card/step-7"
                icon={<ArrowRight className="w-4 h-4" />}
                className="px-6 font-semibold shadow-md shadow-blue-500/20"
              >
                Next: Publish Settings
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

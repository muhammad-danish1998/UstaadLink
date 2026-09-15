'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  School
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard } from '@/services/teacherService';

export default function CreateCardStep7PublishPage() {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    const draft = getCardDraft();
    setIsPublished(draft.isPublished !== undefined ? draft.isPublished : true);
  }, []);

  const handlePublish = async () => {
    setIsSubmitting(true);

    try {
      const draft = getCardDraft();
      const updatedDraft = {
        ...draft,
        isPublished,
      };

      saveCardDraft(updatedDraft);

      // Persist to Supabase
      await publishTeacherCard(updatedDraft);

      setPublishedSuccess(true);

      // Short delay before directing to Teacher Dashboard
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Educator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose your visibility preferences and publish your profile to the platform.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Stepper Sidebar (4 cols) */}
          <aside className="p-5 sm:p-6 lg:col-span-4 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Step 7 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={7} />
          </aside>

          {/* Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Visibility &amp; Publishing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control how schools and search engines discover your profile.
                </p>
              </div>

              {/* Setting 1: Published on UstaadLink */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        Publish to UstaadLink Marketplace
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        Makes your teacher profile card visible in verified school search results across District Malir.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-xl w-fit flex items-center gap-1.5 border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Status: {isPublished ? 'Active & Searchable by Schools' : 'Unpublished (Draft Mode)'}</span>
                </div>
              </div>

              {/* Privacy Assurance Box */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-900 space-y-1">
                  <span className="font-bold block text-sm">Privacy &amp; Contact Protection:</span>
                  <p className="text-blue-800/90 leading-relaxed text-xs">
                    Your phone number, WhatsApp, and father&apos;s name remain private. Schools can only view your educational details and subject expertise to send an interview contact request.
                  </p>
                </div>
              </div>

              {publishedSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">Profile Published Successfully!</span>
                    <span className="text-xs text-emerald-700">Redirecting to your Teacher Dashboard...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                href="/create-card/step-6"
                icon={<ArrowLeft className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                Back: Review
              </Button>

              <Button
                type="button"
                variant="success"
                size="lg"
                onClick={handlePublish}
                disabled={isSubmitting || publishedSuccess}
                icon={!isSubmitting && <Sparkles className="w-5 h-5" />}
                className="px-8 font-bold shadow-md shadow-emerald-500/20"
              >
                {isSubmitting ? 'Publishing Profile...' : 'Publish My Profile'}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

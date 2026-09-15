'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Building2, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard } from '@/services/teacherService';

const degreeOptions = [
  { value: 'B.Ed | M.A English', label: 'B.Ed | M.A English' },
  { value: 'M.Sc Mathematics', label: 'M.Sc Mathematics' },
  { value: 'B.Ed Science', label: 'B.Ed Science' },
  { value: 'BS Computer Science', label: 'BS Computer Science' },
  { value: 'M.A / M.Sc (Masters)', label: 'M.A / M.Sc (Masters Degree)' },
  { value: 'BS / B.Sc (4-Year Bachelors)', label: 'BS / B.Sc (4-Year Bachelors)' },
  { value: 'B.Ed / M.Ed (Education)', label: 'B.Ed / M.Ed (Education)' },
  { value: 'B.A / B.Com (2-Year Bachelors)', label: 'B.A / B.Com (2-Year Bachelors)' },
  { value: 'M.Phil / MS', label: 'M.Phil / MS' },
  { value: 'Intermediate / A-Levels', label: 'Intermediate / A-Levels' },
  { value: 'Other', label: 'Other Degree / Qualification' },
];

export default function CreateCardStep2Page() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    highestEducation: 'B.Ed | M.A English',
    institution: 'University of Karachi',
    additionalQualifications: 'Montessori Teaching Diploma',
    customDegree: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft = getCardDraft();
    if (draft.highestEducation) {
      const isKnown = degreeOptions.some((d) => d.value === draft.highestEducation);
      if (isKnown) {
        setFormData({
          highestEducation: draft.highestEducation,
          institution: draft.institution || '',
          additionalQualifications: draft.additionalQualifications || '',
          customDegree: '',
        });
      } else {
        setFormData({
          highestEducation: 'Other',
          customDegree: draft.highestEducation,
          institution: draft.institution || '',
          additionalQualifications: draft.additionalQualifications || '',
        });
      }
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.highestEducation) {
      errs.highestEducation = 'Please select your highest education';
    }

    if (formData.highestEducation === 'Other' && !formData.customDegree.trim()) {
      errs.customDegree = 'Please specify your degree / qualification';
    }

    if (!formData.institution.trim()) {
      errs.institution = 'Institution / University is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalDegree = formData.highestEducation === 'Other' 
      ? formData.customDegree.trim() 
      : formData.highestEducation;

    const updated = saveCardDraft({
      highestEducation: finalDegree,
      institution: formData.institution.trim(),
      additionalQualifications: formData.additionalQualifications.trim(),
    });

    await publishTeacherCard(updated);

    router.push('/create-card/step-3');
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
            Fill in your details to create your professional profile on TeachConnect.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Stepper Sidebar (4 cols) */}
          <aside className="p-5 sm:p-6 lg:col-span-4 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Step 2 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={2} />
          </aside>

          {/* Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Education &amp; Qualifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schools view your highest degree prominently on your public profile.
                </p>
              </div>

              {/* Highest Degree Select */}
              <Select
                label="Highest Education Degree"
                options={degreeOptions}
                value={formData.highestEducation}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, highestEducation: e.target.value }));
                  if (errors.highestEducation) setErrors((prev) => ({ ...prev, highestEducation: '' }));
                }}
                error={errors.highestEducation}
                icon={<GraduationCap className="w-4 h-4" />}
                required
              />

              {/* Custom Degree Input if 'Other' selected */}
              {formData.highestEducation === 'Other' && (
                <Input
                  label="Specify Your Degree / Qualification"
                  placeholder="e.g. M.Sc Statistics, Diploma in Early Childhood"
                  value={formData.customDegree}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, customDegree: e.target.value }));
                    if (errors.customDegree) setErrors((prev) => ({ ...prev, customDegree: '' }));
                  }}
                  error={errors.customDegree}
                  icon={<GraduationCap className="w-4 h-4" />}
                  required
                />
              )}

              {/* Institution / University */}
              <Input
                label="Institution / University"
                placeholder="e.g. University of Karachi, NED University"
                value={formData.institution}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, institution: e.target.value }));
                  if (errors.institution) setErrors((prev) => ({ ...prev, institution: '' }));
                }}
                error={errors.institution}
                icon={<Building2 className="w-4 h-4" />}
                required
              />

              {/* Additional Qualifications */}
              <Input
                label="Additional Qualifications / Certifications (Optional)"
                placeholder="e.g. Montessori Diploma, B.Ed Certified, IELTS 7.5"
                value={formData.additionalQualifications}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalQualifications: e.target.value }))}
                helperText="Mention teaching diplomas, language proficiency, or pedagogy certifications."
                icon={<Award className="w-4 h-4" />}
              />

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  href="/create-card/step-1"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="px-6 font-semibold shadow-md shadow-blue-500/20"
                >
                  Next: Teaching Details
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

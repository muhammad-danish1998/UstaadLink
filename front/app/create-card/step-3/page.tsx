'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Layers, 
  Briefcase, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard } from '@/services/teacherService';

const availableSubjects = [
  'Mathematics',
  'English',
  'Urdu',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'General Science',
  'Islamiyat',
  'Pakistan Studies',
  'Social Studies',
  'Economics',
  'Accounting',
  'Art / Drawing',
];

const classRangeOptions = [
  { value: '1 - 5', label: 'Classes: 1 - 5 (Primary)' },
  { value: '6 - 8', label: 'Classes: 6 - 8 (Middle)' },
  { value: '6 - 10', label: 'Classes: 6 - 10 (Secondary)' },
  { value: '9 - 10', label: 'Classes: 9 - 10 (Matric)' },
  { value: '11 - 12', label: 'Classes: 11 - 12 (Intermediate / HSSC)' },
  { value: 'O / A Levels', label: 'O / A Levels (Cambridge System)' },
  { value: '1 - 10', label: 'All Levels (Classes 1 - 10)' },
];

function normalizeClassSelection(val?: string): string {
  if (!val) return '6 - 10';
  const clean = val.trim();
  const lower = clean.toLowerCase();
  if (clean.includes('9 - 10') || clean.includes('9-10') || lower.includes('matric')) return '9 - 10';
  if (clean.includes('1 - 5') || clean.includes('1-5') || lower.includes('primary')) return '1 - 5';
  if (clean.includes('6 - 8') || clean.includes('6-8') || lower.includes('middle')) return '6 - 8';
  if (clean.includes('11 - 12') || clean.includes('11-12') || lower.includes('inter') || lower.includes('hssc')) return '11 - 12';
  if (clean.includes('1 - 10') || clean.includes('1-10') || lower.includes('all')) return '1 - 10';
  if (lower.includes('o-level') || lower.includes('a-level') || lower.includes('cambridge') || clean.includes('O / A') || lower.includes('o / a')) return 'O / A Levels';
  if (clean.includes('6 - 10') || clean.includes('6-10') || lower.includes('secondary')) return '6 - 10';
  return clean;
}

const availableTeachingSkills = [
  'Classroom Management',
  'Lesson Planning',
  'Student Assessment',
  'Board Exam Preparation',
  'Activity-Based Learning',
  'Interactive Teaching',
  'Curriculum Design',
  'Multimedia / Smartboard Tools',
  'Student Mentoring',
];

export default function CreateCardStep3Page() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    subjects: ['English', 'Urdu'] as string[],
    classes: '6 - 10',
    experienceYears: 3,
    previousSchool: 'City Grammar School',
    teachingSkills: ['Classroom Management', 'Lesson Planning', 'Board Exam Preparation'] as string[],
  });

  const [customSubject, setCustomSubject] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft = getCardDraft();
    setFormData({
      subjects: draft.subjects && draft.subjects.length > 0 ? draft.subjects : ['English', 'Urdu'],
      classes: normalizeClassSelection(draft.classes),
      experienceYears: draft.experienceYears !== undefined ? draft.experienceYears : 3,
      previousSchool: draft.previousSchool || '',
      teachingSkills: draft.teachingSkills && draft.teachingSkills.length > 0 ? draft.teachingSkills : ['Classroom Management', 'Lesson Planning', 'Board Exam Preparation'],
    });
  }, []);

  const toggleSubject = (subject: string) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subject);
      const updated = exists 
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects: updated };
    });
    if (errors.subjects) setErrors((prev) => ({ ...prev, subjects: '' }));
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!formData.subjects.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    }
    setCustomSubject('');
    if (errors.subjects) setErrors((prev) => ({ ...prev, subjects: '' }));
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.teachingSkills.includes(skill);
      const updated = exists 
        ? prev.teachingSkills.filter((s) => s !== skill)
        : [...prev.teachingSkills, skill];
      return { ...prev, teachingSkills: updated };
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (formData.subjects.length === 0) {
      errs.subjects = 'Please select at least one teaching subject';
    }

    if (!formData.classes) {
      errs.classes = 'Please select class levels';
    }

    if (formData.experienceYears < 0) {
      errs.experienceYears = 'Experience cannot be negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated = saveCardDraft({
      subjects: formData.subjects,
      classes: formData.classes,
      experienceYears: Number(formData.experienceYears),
      previousSchool: formData.previousSchool.trim(),
      teachingSkills: formData.teachingSkills,
    });

    await publishTeacherCard(updated);

    router.push('/create-card/step-4');
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
                Step 3 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={3} />
          </aside>

          {/* Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Teaching Details &amp; Expertise
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the subjects, grades, and experience schools will search by.
                </p>
              </div>

              {/* Subjects Tag Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2">
                  Teaching Subjects <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableSubjects.map((subject) => {
                    const isSelected = formData.subjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer
                          ${isSelected 
                            ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                          }
                        `.trim()}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{subject}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Subject */}
                <div className="flex items-center gap-2 max-w-sm mt-2">
                  <Input
                    placeholder="Other subject (e.g. French, Statistics)"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSubject();
                      }
                    }}
                    className="py-1.5 text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addCustomSubject}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>

                {errors.subjects && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.subjects}</p>
                )}
              </div>

              {/* Class Range & Experience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Target Class Levels"
                  options={classRangeOptions}
                  value={formData.classes}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, classes: e.target.value }));
                    if (errors.classes) setErrors((prev) => ({ ...prev, classes: '' }));
                  }}
                  error={errors.classes}
                  icon={<Layers className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Teaching Experience (Years)"
                  type="number"
                  min="0"
                  max="40"
                  placeholder="e.g. 3"
                  value={formData.experienceYears}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }));
                    if (errors.experienceYears) setErrors((prev) => ({ ...prev, experienceYears: '' }));
                  }}
                  error={errors.experienceYears}
                  helperText="Enter 0 if you are a fresh teacher."
                  icon={<Briefcase className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Previous School */}
              <Input
                label="Previous School / Current Institution (Optional)"
                placeholder="e.g. Beaconhouse, Army Public School, City School"
                value={formData.previousSchool}
                onChange={(e) => setFormData((prev) => ({ ...prev, previousSchool: e.target.value }))}
                helperText="Leave empty if not currently or previously associated."
                icon={<Building2 className="w-4 h-4" />}
              />

              {/* Teaching Skills Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2">
                  Key Teaching Skills (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTeachingSkills.map((skill) => {
                    const isSelected = formData.teachingSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer
                          ${isSelected 
                            ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/70'
                          }
                        `.trim()}
                      >
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  href="/create-card/step-2"
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
                  Next: Location &amp; Availability
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

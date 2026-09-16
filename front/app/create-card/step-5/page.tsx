'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Banknote, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Info,
  CheckCircle2,
  Laptop,
  Building,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard } from '@/services/teacherService';

const monthlySalaryPresets = [
  25000,
  35000,
  45000,
  55000,
  70000,
  90000,
];

const hourlyRatePresets = [
  500,
  800,
  1000,
  1500,
  2000,
  2500,
];

export default function CreateCardStep5Page() {
  const router = useRouter();

  const [teachingMode, setTeachingMode] = useState<'onsite' | 'online' | 'both'>('onsite');
  const [formData, setFormData] = useState({
    expectedSalary: 35000,
    onlineHourlyRate: 800,
    aboutMe: 'Dedicated and passionate teacher with 3 years of experience in teaching English and Urdu. I believe in creating a positive and interactive learning environment for students.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft = getCardDraft();
    const mode = draft.teachingMode || 'onsite';
    setTeachingMode(mode);
    setFormData({
      expectedSalary: draft.monthlySalary || draft.expectedSalary || 35000,
      onlineHourlyRate: draft.onlineHourlyRate || 800,
      aboutMe: draft.aboutMe || 'Dedicated and passionate teacher committed to fostering student success and academic excellence.',
    });
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (teachingMode !== 'online') {
      if (!formData.expectedSalary || formData.expectedSalary < 10000) {
        errs.expectedSalary = 'Please enter a valid monthly expected salary (minimum Rs. 10,000)';
      }
    }

    if (teachingMode !== 'onsite') {
      if (!formData.onlineHourlyRate || formData.onlineHourlyRate < 100) {
        errs.onlineHourlyRate = 'Please enter a valid online hourly rate (minimum Rs. 100/hr)';
      }
    }

    if (!formData.aboutMe.trim()) {
      errs.aboutMe = 'Please provide a short introduction / about me statement';
    } else if (formData.aboutMe.trim().length < 20) {
      errs.aboutMe = 'Introduction should be at least 20 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated = saveCardDraft({
      expectedSalary: teachingMode === 'online' ? (formData.onlineHourlyRate * 40) : Number(formData.expectedSalary),
      monthlySalary: teachingMode === 'online' ? undefined : Number(formData.expectedSalary),
      onlineHourlyRate: teachingMode === 'onsite' ? undefined : Number(formData.onlineHourlyRate),
      aboutMe: formData.aboutMe.trim(),
    });

    await publishTeacherCard(updated);

    router.push('/create-card/step-6');
  };

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
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
                Step 5 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={5} />
          </aside>

          {/* Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  {teachingMode === 'online' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Laptop className="w-3.5 h-3.5" /> Online Tutoring Rate
                    </span>
                  ) : teachingMode === 'both' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      <RefreshCw className="w-3.5 h-3.5" /> On-site &amp; Online Rates
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Building className="w-3.5 h-3.5" /> School Monthly Salary
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {teachingMode === 'online' ? 'Online Tutoring Rate & Bio' : 'Expected Salary & Introduction'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set transparent pricing expectations and introduce yourself to hiring schools and students.
                </p>
              </div>

              {/* Monthly Salary Input & Presets (For On-site & Both) */}
              {teachingMode !== 'online' && (
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-blue-50/30 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-sm">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>On-site Monthly Salary</span>
                  </div>
                  <Input
                    label="Expected Monthly Salary (PKR)"
                    type="number"
                    min="10000"
                    step="1000"
                    placeholder="e.g. 35000"
                    value={formData.expectedSalary}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData((prev) => ({ ...prev, expectedSalary: val }));
                      if (errors.expectedSalary) setErrors((prev) => ({ ...prev, expectedSalary: '' }));
                    }}
                    error={errors.expectedSalary}
                    helperText={formData.expectedSalary > 0 ? `Display on card: ${formatPKR(formData.expectedSalary)} / month` : undefined}
                    icon={<Banknote className="w-4 h-4" />}
                    required
                  />

                  {/* Quick Salary Pills */}
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                      Quick Select Monthly Ranges:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {monthlySalaryPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, expectedSalary: preset }));
                            if (errors.expectedSalary) setErrors((prev) => ({ ...prev, expectedSalary: '' }));
                          }}
                          className={`
                            text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer
                            ${formData.expectedSalary === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                            }
                          `.trim()}
                        >
                          {formatPKR(preset)} / mo
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Online Hourly Rate Input & Presets (For Online & Both) */}
              {teachingMode !== 'onsite' && (
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-purple-50/30 border border-purple-100">
                  <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-sm">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    <span>Online Hourly Rate</span>
                  </div>
                  <Input
                    label="Expected Online Tutoring Rate (PKR / Hour)"
                    type="number"
                    min="100"
                    step="100"
                    placeholder="e.g. 800"
                    value={formData.onlineHourlyRate}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData((prev) => ({ ...prev, onlineHourlyRate: val }));
                      if (errors.onlineHourlyRate) setErrors((prev) => ({ ...prev, onlineHourlyRate: '' }));
                    }}
                    error={errors.onlineHourlyRate}
                    helperText={formData.onlineHourlyRate > 0 ? `Display on card: ${formatPKR(formData.onlineHourlyRate)} / hour` : undefined}
                    icon={<Banknote className="w-4 h-4" />}
                    required
                  />

                  {/* Quick Hourly Rate Pills */}
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                      Quick Select Hourly Rates:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {hourlyRatePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, onlineHourlyRate: preset }));
                            if (errors.onlineHourlyRate) setErrors((prev) => ({ ...prev, onlineHourlyRate: '' }));
                          }}
                          className={`
                            text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer
                            ${formData.onlineHourlyRate === preset
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                            }
                          `.trim()}
                        >
                          {formatPKR(preset)} / hr
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* About Me / Bio Textarea */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                  About Me / Short Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.aboutMe}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, aboutMe: e.target.value }));
                    if (errors.aboutMe) setErrors((prev) => ({ ...prev, aboutMe: '' }));
                  }}
                  placeholder="Introduce yourself, your teaching philosophy, and key strengths..."
                  className={`
                    w-full rounded-2xl border bg-white p-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none
                    ${errors.aboutMe ? 'border-red-500 bg-red-50/20' : 'border-slate-200'}
                  `.trim()}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{formData.aboutMe.length} characters (min. 20)</span>
                  {errors.aboutMe && <span className="text-red-500 font-semibold">{errors.aboutMe}</span>}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  href="/create-card/step-4"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back: Mode &amp; Location
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="px-6 font-semibold shadow-md shadow-blue-500/20"
                >
                  Next: Review Profile
                </Button>
              </div>

            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

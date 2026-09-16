'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Sunset, 
  Building, 
  CheckCircle2, 
  Lock,
  Laptop,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepSidebar } from '@/components/teacher/StepSidebar';
import { getCardDraft, saveCardDraft } from '@/lib/cardBuilderStorage';
import { publishTeacherCard } from '@/services/teacherService';
import { 
  MALIR_DISTRICT, 
  MALIR_LOCATIONS,
  MALIR_TOWNS,
  MalirTownName,
  getTownOptions, 
  getUcOptionsForTown, 
  isValidMalirLocation,
  normalizeTown,
  normalizeUc
} from '@/lib/malirLocations';

export default function CreateCardStep4Page() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    teachingMode: 'onsite' as 'onsite' | 'online' | 'both',
    availability: 'Morning' as 'Morning' | 'Evening' | 'Both',
    availableFrom: '',
    availableImmediately: true,
    city: 'Karachi',
    district: MALIR_DISTRICT,
    town: '' as MalirTownName | '',
    uc: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft = getCardDraft();
    const rawTown = normalizeTown(draft.town || draft.area) || '';
    let rawUc = draft.uc || '';

    if (rawTown && rawUc) {
      rawUc = normalizeUc(rawTown, rawUc);
    }

    setFormData({
      teachingMode: draft.teachingMode || 'onsite',
      availability: draft.availability || 'Morning',
      availableFrom: draft.availableFrom || '',
      availableImmediately: !draft.availableFrom,
      city: 'Karachi',
      district: MALIR_DISTRICT,
      town: rawTown,
      uc: rawTown && MALIR_LOCATIONS[rawTown]?.includes(rawUc) ? rawUc : '',
    });
  }, []);

  const townOptions = [
    { value: '', label: 'Select Town' },
    ...getTownOptions()
  ];

  const ucOptions = formData.town && MALIR_LOCATIONS[formData.town]
    ? [
        { value: '', label: 'Select UC' },
        ...getUcOptionsForTown(formData.town)
      ]
    : [
        { value: '', label: 'Select Town First' }
      ];

  const handleModeChange = (mode: 'onsite' | 'online' | 'both') => {
    setFormData((prev) => ({
      ...prev,
      teachingMode: mode,
    }));
    if (errors.town) setErrors((prev) => ({ ...prev, town: '' }));
    if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
  };

  const handleTownChange = (selectedTown: string) => {
    const normTown = normalizeTown(selectedTown);
    setFormData((prev) => ({
      ...prev,
      town: normTown,
      uc: '', // Immediately reset UC on town change
    }));
    if (errors.town) setErrors((prev) => ({ ...prev, town: '' }));
    if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
  };

  const handleUcChange = (selectedUc: string) => {
    setFormData((prev) => ({
      ...prev,
      uc: selectedUc,
    }));
    if (errors.uc) setErrors((prev) => ({ ...prev, uc: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    // For on-site and both, location is strictly required
    if (formData.teachingMode !== 'online') {
      if (!formData.town) {
        errs.town = 'Please select your Town / TMC in District Malir';
      }

      if (!formData.uc) {
        errs.uc = 'Please select your Union Council (UC)';
      } else if (!isValidMalirLocation(formData.town, formData.uc)) {
        errs.uc = 'Selected Union Council does not belong to the chosen Town';
      }
    }

    if (!formData.availableImmediately && !formData.availableFrom) {
      errs.availableFrom = 'Please specify your available from date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated = saveCardDraft({
      teachingMode: formData.teachingMode,
      availability: formData.availability,
      availableFrom: formData.availableImmediately ? '' : formData.availableFrom,
      city: 'Karachi',
      district: MALIR_DISTRICT,
      town: formData.teachingMode === 'online' && !formData.town ? 'Malir' : formData.town,
      uc: formData.teachingMode === 'online' && !formData.uc ? '' : formData.uc,
      area: formData.teachingMode === 'online' && !formData.uc 
        ? 'Online Teaching' 
        : `${formData.uc}, ${formData.town}`,
    });

    await publishTeacherCard(updated);

    router.push('/create-card/step-5');
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
                Step 4 of 7
              </span>
              <h2 className="text-sm font-bold text-slate-900">Profile Setup Flow</h2>
            </div>
            <StepSidebar currentStep={4} />
          </aside>

          {/* Form Content (8 cols) */}
          <main className="p-6 sm:p-10 lg:col-span-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Teaching Mode &amp; Availability
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose how and where you want to offer your teaching services.
                </p>
              </div>

              {/* Teaching Mode Selection (On-site / Online / Both) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                  Select Teaching Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { 
                      value: 'onsite', 
                      label: 'On-site', 
                      icon: Building, 
                      desc: 'School & academy teaching in District Malir' 
                    },
                    { 
                      value: 'online', 
                      label: 'Online', 
                      icon: Laptop, 
                      desc: 'Remote teaching via Zoom/Meet anywhere' 
                    },
                    { 
                      value: 'both', 
                      label: 'Both (On-site + Online)', 
                      icon: RefreshCw, 
                      desc: 'Open to physical schools and online tutoring' 
                    },
                  ].map((modeItem) => {
                    const isSelected = formData.teachingMode === modeItem.value;
                    const Icon = modeItem.icon;
                    return (
                      <button
                        key={modeItem.value}
                        type="button"
                        onClick={() => handleModeChange(modeItem.value as any)}
                        className={`
                          p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }
                        `.trim()}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm block">{modeItem.label}</span>
                          <span className="text-[11px] text-slate-500 block mt-1 leading-tight">{modeItem.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Shift Selection (Morning / Evening / Both) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                  Preferred Availability Shift <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'Morning', label: 'Morning Shift', icon: Sun, desc: 'School hours (e.g. 7:30 AM - 1:30 PM)' },
                    { value: 'Evening', label: 'Evening Shift', icon: Moon, desc: 'Coaching / Afternoon classes' },
                    { value: 'Both', label: 'Both / Flexible', icon: Sunset, desc: 'Open to morning or evening' },
                  ].map((shift) => {
                    const isSelected = formData.availability === shift.value;
                    const Icon = shift.icon;
                    return (
                      <button
                        key={shift.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, availability: shift.value as any }))}
                        className={`
                          p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }
                        `.trim()}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-xs sm:text-sm block">{shift.label}</span>
                          <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">{shift.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-2">
                  Joining Availability
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availableImmediately}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          availableImmediately: e.target.checked,
                          availableFrom: e.target.checked ? '' : prev.availableFrom,
                        }));
                        if (errors.availableFrom) setErrors((prev) => ({ ...prev, availableFrom: '' }));
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="font-medium text-xs sm:text-sm">Available Immediately</span>
                  </label>

                  {!formData.availableImmediately && (
                    <div className="max-w-xs pt-1">
                      <Input
                        label="Available From Date"
                        type="date"
                        value={formData.availableFrom}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, availableFrom: e.target.value }));
                          if (errors.availableFrom) setErrors((prev) => ({ ...prev, availableFrom: '' }));
                        }}
                        error={errors.availableFrom}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* On-site Location Hierarchy (Shown for On-site and Both) */}
              {formData.teachingMode !== 'online' ? (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>On-site Location (District Malir)</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                      <Lock className="w-3 h-3" />
                      Malir Only
                    </span>
                  </div>

                  {/* Location Hierarchy Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* 1. District (Fixed/Read-only: Malir) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                        District <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full rounded-2xl border border-slate-200 bg-slate-100/90 px-3.5 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs">
                          <span>{MALIR_DISTRICT}</span>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Fixed launch district</span>
                    </div>

                    {/* 2. Town / TMC Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                        Town / TMC <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={townOptions}
                        value={formData.town}
                        onChange={(e) => handleTownChange(e.target.value)}
                        error={errors.town}
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Choose TMC</span>
                    </div>

                    {/* 3. UC Dependent Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                        Union Council (UC) <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={ucOptions}
                        value={formData.uc}
                        onChange={(e) => handleUcChange(e.target.value)}
                        error={errors.uc}
                        disabled={!formData.town}
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formData.town ? `Filtered for ${formData.town}` : 'Select Town first'}
                      </span>
                    </div>

                  </div>

                  {/* Quick Select UC Pills for selected town */}
                  {formData.town && MALIR_LOCATIONS[formData.town] && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-600" />
                          <span>Union Councils in {formData.town} ({MALIR_LOCATIONS[formData.town].length} UCs):</span>
                        </span>
                        {formData.uc && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selected: {formData.uc}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {MALIR_LOCATIONS[formData.town].map((ucName) => {
                          const isUcSelected = formData.uc === ucName;
                          return (
                            <button
                              key={ucName}
                              type="button"
                              onClick={() => handleUcChange(ucName)}
                              className={`
                                px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border
                                ${isUcSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                }
                              `.trim()}
                            >
                              {ucName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Online Teaching Notice Banner */
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3.5 text-xs text-purple-950">
                    <Laptop className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block text-sm text-purple-900">
                        Online Teaching Profile
                      </span>
                      <p className="text-purple-800/90 text-xs leading-relaxed">
                        Physical location and UC are not required for online teaching. In the next step, you can set your expected <strong>hourly tutoring rate (Rs. / hour)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Privacy Guaranteed</span>
                  <p className="text-blue-700 text-[11px] mt-0.5">
                    Your exact street address is never requested or displayed. Only your broad area and shift preferences are shown on your published card.
                  </p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  href="/create-card/step-3"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back: Teaching
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="px-6 font-semibold shadow-md shadow-blue-500/20"
                >
                  Next: Salary &amp; Bio
                </Button>
              </div>

            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  GraduationCap, 
  MapPin, 
  Clock, 
  Briefcase, 
  Banknote, 
  Layers, 
  CheckCircle2, 
  X,
  Sparkles,
  UserPlus,
  Lock,
  Building,
  Laptop,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TeacherCard, TeacherCardData } from '@/components/teacher/TeacherCard';
import { ContactRequestModal } from '@/components/contact/ContactRequestModal';
import { getPublishedTeachers } from '@/services/teacherService';
import { useAuth } from '@/hooks/useAuth';
import { 
  MALIR_DISTRICT, 
  getTownOptions, 
  getUcOptionsForTown,
  normalizeTown
} from '@/lib/malirLocations';

const teachingModeOptions = [
  { value: '', label: 'All Modes (On-site & Online)' },
  { value: 'onsite', label: '🏫 On-site School Only' },
  { value: 'online', label: '💻 Online Tutoring Only' },
  { value: 'both', label: '🔄 Both (On-site + Online)' },
];

const subjectOptions = [
  { value: '', label: 'All Subjects' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'English Language', label: 'English Language' },
  { value: 'English Literature', label: 'English Literature' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'General Science', label: 'General Science' },
  { value: 'Islamiat', label: 'Islamiat' },
  { value: 'Pakistan Studies', label: 'Pakistan Studies' },
  { value: 'Commerce', label: 'Commerce' },
];

const classOptions = [
  { value: '', label: 'All Classes' },
  { value: '1 - 5', label: 'Primary (Class 1-5)' },
  { value: '6 - 8', label: 'Middle (Class 6-8)' },
  { value: '6 - 10', label: 'Secondary (Class 6-10)' },
  { value: '9 - 10', label: 'Matric (Class 9-10)' },
  { value: '11 - 12', label: 'Intermediate (Class 11-12)' },
  { value: 'O / A Levels', label: 'O / A Levels (Cambridge)' },
  { value: '1 - 10', label: 'All Levels (Class 1-10)' },
];

const availabilityOptions = [
  { value: '', label: 'Any Shift' },
  { value: 'Morning', label: 'Morning Shift' },
  { value: 'Evening', label: 'Evening Shift' },
  { value: 'Both', label: 'Both / Flexible' },
];

const experienceOptions = [
  { value: '', label: 'Any Experience' },
  { value: '1', label: '1+ Years' },
  { value: '2', label: '2+ Years' },
  { value: '3', label: '3+ Years' },
  { value: '5', label: '5+ Years' },
];

function FindTeachersContent() {
  const { user, profile, role } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialSubject = searchParams.get('subject') || '';
  const initialTown = searchParams.get('town') || '';
  const initialUc = searchParams.get('uc') || '';
  const initialMode = searchParams.get('mode') || '';

  const [teachers, setTeachers] = useState<TeacherCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedTeachingMode, setSelectedTeachingMode] = useState(initialMode);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTown, setSelectedTown] = useState(initialTown);
  const [selectedUc, setSelectedUc] = useState(initialUc);
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [maxSalary, setMaxSalary] = useState<number>(90000);
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<'relevance' | 'salaryAsc' | 'experienceDesc'>('relevance');

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedTeacherForContact, setSelectedTeacherForContact] = useState<TeacherCardData | null>(null);

  // Fetch live published teachers from Supabase
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const liveTeachers = await getPublishedTeachers({
          district: MALIR_DISTRICT,
        });
        setTeachers(liveTeachers || []);
      } catch (e) {
        console.error('Failed to load teachers from Supabase', e);
        setTeachers([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const townOptions = [
    { value: '', label: 'All Towns in Malir' },
    ...getTownOptions()
  ];

  const ucOptions = selectedTown
    ? [
        { value: '', label: `All UCs in ${selectedTown}` },
        ...getUcOptionsForTown(selectedTown)
      ]
    : [{ value: '', label: 'Select Town first' }];

  const handleTownChange = (town: string) => {
    setSelectedTown(town);
    setSelectedUc(''); // Reset UC when town changes
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTeachingMode('');
    setSelectedSubject('');
    setSelectedClass('');
    setSelectedTown('');
    setSelectedUc('');
    setSelectedAvailability('');
    setSelectedExperience('');
    setMaxSalary(90000);
    setMaxHourlyRate(3000);
    setSortBy('relevance');
  };

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter((t) => {
        const mode = t.teachingMode || 'onsite';

        // Teaching Mode Filter
        if (selectedTeachingMode) {
          if (selectedTeachingMode === 'onsite') {
            if (mode !== 'onsite' && mode !== 'both') return false;
          } else if (selectedTeachingMode === 'online') {
            if (mode !== 'online' && mode !== 'both') return false;
          } else if (selectedTeachingMode === 'both') {
            if (mode !== 'both') return false;
          }
        }

        // Search Term Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = t.fullName.toLowerCase().includes(term);
          const matchSubj = t.subjects.some((s) => s.toLowerCase().includes(term));
          const matchArea = t.location.area.toLowerCase().includes(term);
          const matchEdu = t.highestEducation.toLowerCase().includes(term);
          if (!matchName && !matchSubj && !matchArea && !matchEdu) return false;
        }

        // Subject Filter
        if (selectedSubject) {
          if (!t.subjects.includes(selectedSubject)) return false;
        }

        // Class Level Filter
        if (selectedClass) {
          const tClasses = t.classes || '';
          const matchClass =
            tClasses === selectedClass ||
            tClasses.includes(selectedClass) ||
            (selectedClass === '9 - 10' && (tClasses.includes('9 - 10') || tClasses.includes('6 - 10') || tClasses.includes('1 - 10') || tClasses.toLowerCase().includes('matric'))) ||
            (selectedClass === '6 - 8' && (tClasses.includes('6 - 8') || tClasses.includes('6 - 10') || tClasses.includes('1 - 10') || tClasses.toLowerCase().includes('middle'))) ||
            (selectedClass === '1 - 5' && (tClasses.includes('1 - 5') || tClasses.includes('1 - 10') || tClasses.toLowerCase().includes('primary'))) ||
            (selectedClass === '6 - 10' && (tClasses.includes('6 - 10') || tClasses.includes('1 - 10')));
          if (!matchClass) return false;
        }

        // Town Filter (Only for teachers with physical location)
        if (selectedTown) {
          if (mode === 'online') return false; // online-only teachers don't match specific physical town
          const normSelected = normalizeTown(selectedTown);
          const townMatch = 
            normalizeTown(t.location.town) === normSelected ||
            normalizeTown(t.location.area) === normSelected ||
            t.location.area.toLowerCase().includes(selectedTown.toLowerCase());
          if (!townMatch) return false;
        }

        // UC Filter (Only for teachers with physical location)
        if (selectedUc) {
          if (mode === 'online') return false;
          const ucMatch = 
            (t.location.uc && t.location.uc.toLowerCase() === selectedUc.toLowerCase()) ||
            t.location.area.toLowerCase().includes(selectedUc.toLowerCase());
          if (!ucMatch) return false;
        }

        // Availability Shift Filter
        if (selectedAvailability) {
          if (t.availability !== selectedAvailability && t.availability !== 'Both') return false;
        }

        // Experience Filter
        if (selectedExperience) {
          const expThreshold = parseInt(selectedExperience);
          if (t.experienceYears < expThreshold) return false;
        }

        // Monthly Salary Filter (Only for on-site or both teachers)
        if (mode !== 'online' && maxSalary && maxSalary < 90000) {
          const salary = t.monthlySalary ?? t.expectedSalary;
          if (salary > maxSalary) return false;
        }

        // Hourly Rate Filter (Only for online or both teachers)
        if (mode !== 'onsite' && maxHourlyRate && maxHourlyRate < 3000) {
          const rate = t.onlineHourlyRate ?? 800;
          if (rate > maxHourlyRate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salaryAsc') {
          const salA = a.monthlySalary ?? a.expectedSalary;
          const salB = b.monthlySalary ?? b.expectedSalary;
          return salA - salB;
        }
        if (sortBy === 'experienceDesc') return b.experienceYears - a.experienceYears;
        // Default relevance
        return (b.matchPercentage || 90) - (a.matchPercentage || 90);
      });
  }, [
    teachers,
    searchTerm,
    selectedTeachingMode,
    selectedSubject,
    selectedClass,
    selectedTown,
    selectedUc,
    selectedAvailability,
    selectedExperience,
    maxSalary,
    maxHourlyRate,
    sortBy,
  ]);

  const formatPKR = (amt: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200/80">
              <MapPin className="w-3.5 h-3.5" />
              <span>District Malir &amp; Online Educator Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find Verified Teachers
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hire educators for on-site school positions in District Malir or online classes across Pakistan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(true)}
              icon={<SlidersHorizontal className="w-4 h-4" />}
              className="lg:hidden"
            >
              Filters {(searchTerm || selectedTeachingMode || selectedSubject || selectedClass || selectedTown || selectedUc || selectedAvailability || selectedExperience) ? '(Active)' : ''}
            </Button>

            <Button
              variant="primary"
              size="sm"
              href="/register/teacher"
              icon={<UserPlus className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              I&apos;m a Teacher
            </Button>
          </div>
        </div>

        {/* Search & Results Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Desktop Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl border border-slate-200/90 shadow-soft p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Search Filters</span>
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Keyword Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Subject, teacher name, UC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Teaching Mode Filter */}
            <Select
              label="Teaching Mode"
              options={teachingModeOptions}
              value={selectedTeachingMode}
              onChange={(e) => setSelectedTeachingMode(e.target.value)}
            />

            {/* Location Section (Only shown when not strictly filtered for Online) */}
            {selectedTeachingMode !== 'online' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Fixed District Indicator */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District (On-site)
                  </label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>District Malir</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Town Dropdown */}
                <Select
                  label="Town / TMC"
                  options={townOptions}
                  value={selectedTown}
                  onChange={(e) => handleTownChange(e.target.value)}
                />

                {/* UC Dependent Dropdown */}
                <Select
                  label="Union Council (UC)"
                  options={ucOptions}
                  value={selectedUc}
                  onChange={(e) => setSelectedUc(e.target.value)}
                  disabled={!selectedTown}
                />
              </div>
            )}

            {/* Subject Dropdown */}
            <Select
              label="Subject"
              options={subjectOptions}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            />

            {/* Class Dropdown */}
            <Select
              label="Class Level"
              options={classOptions}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            />

            {/* Availability Shift */}
            <Select
              label="Availability Shift"
              options={availabilityOptions}
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            />

            {/* Experience */}
            <Select
              label="Experience"
              options={experienceOptions}
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
            />

            {/* Monthly Salary Range Slider (For On-site & Both) */}
            {selectedTeachingMode !== 'online' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Max Monthly Salary</span>
                  <span className="font-bold text-blue-700">{formatPKR(maxSalary)}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="90000"
                  step="5000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Rs. 20,000</span>
                  <span>Rs. 90,000+</span>
                </div>
              </div>
            )}

            {/* Online Hourly Rate Slider (For Online & Both) */}
            {selectedTeachingMode !== 'onsite' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-900">Max Online Rate / Hr</span>
                  <span className="font-bold text-purple-700">{formatPKR(maxHourlyRate)}/hr</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={maxHourlyRate}
                  onChange={(e) => setMaxHourlyRate(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Rs. 500/hr</span>
                  <span>Rs. 3,000+/hr</span>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => {}}
              icon={<Search className="w-3.5 h-3.5" />}
              className="mt-2 font-semibold"
            >
              Apply Filters
            </Button>
          </aside>

          {/* Main Results Content (9 cols) */}
          <main className="lg:col-span-9 space-y-5">
            
            {/* Results bar & Sorting header */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-slate-600">
                Showing <strong className="text-slate-900 font-bold">{filteredTeachers.length}</strong> verified teachers 
                {selectedTeachingMode === 'online' ? (
                  <span className="font-semibold text-purple-700"> (Online Tutoring)</span>
                ) : (
                  <> in <span className="font-semibold text-blue-700">{selectedTown || 'District Malir'}</span></>
                )}
                {selectedUc && <span> &bull; UC: {selectedUc}</span>}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="relevance">Relevance / Match Score</option>
                  <option value="salaryAsc">Expected Salary: Low to High</option>
                  <option value="experienceDesc">Experience: High to Low</option>
                </select>
              </div>
            </div>

            {/* Teachers Card Grid */}
            {filteredTeachers.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                {filteredTeachers.map((teacher) => {
                  const isOwn = Boolean(
                    role === 'teacher' && (
                      teacher.id === user?.id ||
                      teacher.slug === profile?.teacher_slug ||
                      (profile?.full_name && teacher.fullName.toLowerCase().trim() === profile.full_name.toLowerCase().trim())
                    )
                  );
                  return (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      showMatch
                      isOwnCard={isOwn}
                      onContactClick={isOwn ? undefined : (t) => setSelectedTeacherForContact(t)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-soft">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {teachers.length === 0 ? 'No Teacher Cards Published Yet' : 'No Teachers Matched Your Filters'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Try adjusting your filters, selecting a different teaching mode, or clearing search criteria.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={resetFilters} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xs sm:max-w-sm min-h-screen p-6 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filter Teachers</span>
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Keyword Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Subject, teacher name, UC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Teaching Mode Filter */}
            <Select
              label="Teaching Mode"
              options={teachingModeOptions}
              value={selectedTeachingMode}
              onChange={(e) => setSelectedTeachingMode(e.target.value)}
            />

            {/* Location Section */}
            {selectedTeachingMode !== 'online' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District (On-site)
                  </label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>District Malir</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <Select
                  label="Town / TMC"
                  options={townOptions}
                  value={selectedTown}
                  onChange={(e) => handleTownChange(e.target.value)}
                />

                <Select
                  label="Union Council (UC)"
                  options={ucOptions}
                  value={selectedUc}
                  onChange={(e) => setSelectedUc(e.target.value)}
                  disabled={!selectedTown}
                />
              </div>
            )}

            {/* Subject Dropdown */}
            <Select
              label="Subject"
              options={subjectOptions}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            />

            {/* Class Dropdown */}
            <Select
              label="Class Level"
              options={classOptions}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            />

            {/* Availability Shift */}
            <Select
              label="Availability Shift"
              options={availabilityOptions}
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            />

            {/* Experience */}
            <Select
              label="Experience"
              options={experienceOptions}
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
            />

            {/* Monthly Salary Range Slider */}
            {selectedTeachingMode !== 'online' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Max Monthly Salary</span>
                  <span className="font-bold text-blue-700">{formatPKR(maxSalary)}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="90000"
                  step="5000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Rs. 20k</span>
                  <span>Rs. 90k+</span>
                </div>
              </div>
            )}

            {/* Online Hourly Rate Range Slider */}
            {selectedTeachingMode !== 'onsite' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Max Online Rate</span>
                  <span className="font-bold text-blue-700">{formatPKR(maxHourlyRate)} / hr</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={maxHourlyRate}
                  onChange={(e) => setMaxHourlyRate(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Rs. 500/hr</span>
                  <span>Rs. 5,000+/hr</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-1/2"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-1/2 font-semibold"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Request Modal */}
      {selectedTeacherForContact && (
        <ContactRequestModal
          isOpen={!!selectedTeacherForContact}
          onClose={() => setSelectedTeacherForContact(null)}
          teacherSlug={selectedTeacherForContact.slug}
          teacherName={selectedTeacherForContact.fullName}
        />
      )}

    </div>
  );
}

export default function FindTeachersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FindTeachersContent />
    </Suspense>
  );
}

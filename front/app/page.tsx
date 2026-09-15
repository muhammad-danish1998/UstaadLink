import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  UserPlus, 
  School, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  PhoneCall,
  FileCheck2,
  SendHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HeroSearch } from '@/components/home/HeroSearch';
import { FeaturedTeachersSection } from '@/components/home/FeaturedTeachersSection';
import { getPublishedTeachers } from '@/services/teacherService';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialTeachers = await getPublishedTeachers();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs sm:text-sm font-semibold border border-blue-200/80 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>100% Free Teacher–School Recruitment Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Find the Right Teacher. <br className="hidden sm:inline" />
              <span className="text-blue-600">Build a Brighter Future.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              UstaadLink connects qualified teachers with schools directly. Teachers create a free professional <strong>Educator Profile</strong>, and schools send targeted contact requests with zero recruiter commissions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                href="/register/teacher"
                icon={<UserPlus className="w-5 h-5" />}
                className="w-full sm:w-auto shadow-md shadow-blue-500/20"
              >
                I&apos;m a Teacher — Create Free Profile
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/teachers"
                icon={<Search className="w-5 h-5" />}
                className="w-full sm:w-auto bg-white"
              >
                I&apos;m a School — Find Teachers
              </Button>
            </div>

            {/* Interactive Hero Search Form */}
            <HeroSearch />

            {/* Value Trust Points */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Privacy-Protected Contact</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-purple-600" />
                <span>Direct School Phone Calling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Simple Recruitment Flow
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            How UstaadLink Works
          </p>
          <p className="text-slate-600 text-sm mt-2">
            A frictionless, direct connection designed specifically for teachers and school administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* For Teachers Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10" />
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">For Teachers</h3>
                  <p className="text-xs text-slate-500">Get discovered by schools near you</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Register &amp; Create Your Profile</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add your education, subjects, teaching experience, preferred timing, and expected salary in a quick wizard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Publish Profile to Dashboard</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Publish your profile so verified schools searching for your subject can view your qualifications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Receive Inquiries &amp; Call School Directly</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When a school sends a contact request, view their official details and phone number on your dashboard to call them directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button variant="primary" size="md" fullWidth href="/register/teacher">
                Create Free Profile
              </Button>
            </div>
          </div>

          {/* For Schools Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10" />
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">For Schools</h3>
                  <p className="text-xs text-slate-500">Hire qualified educators without recruitment fees</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Register Your School Profile</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create an official school profile with your area and contact details to get full access to verified teachers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Search &amp; Filter Teachers</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filter by subject, class levels, experience years, location, and salary expectations to find ideal teachers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800">Send Contact Requests</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send your hiring requirements and contact number directly to candidate teachers to arrange interviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button variant="outline" size="md" fullWidth href="/teachers">
                Find &amp; Search Teachers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED EDUCATOR PROFILES SECTION */}
      <FeaturedTeachersSection initialTeachers={initialTeachers} />

      {/* 4. WHY TEACHCONNECT SECTION */}
      <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-card">
          <div className="max-w-2xl space-y-4 mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Why UstaadLink
            </h2>
            <p className="text-2xl sm:text-4xl font-bold tracking-tight">
              Designed to solve teacher hiring without commission middlemen
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Traditional job portals are cluttered with outdated resumes and expensive recruitment agencies. UstaadLink provides a direct, transparent marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white">Verified Educator Profiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standardized profiles give schools all key information (education, subjects, experience, salary) in seconds.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white">Privacy by Default</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Teacher phone numbers are never scraped or spammed. Schools send contact requests with their phone number for direct calling.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <SendHorizontal className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white">Direct School Requests</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Schools send targeted contact requests directly to teachers, eliminating third-party recruiter commissions completely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-card">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Connect?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join UstaadLink today. Create your free Educator Profile or find qualified teaching talent for your school.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              href="/register/teacher"
              icon={<UserPlus className="w-5 h-5" />}
              className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold"
            >
              Create Free Profile
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/register/school"
              icon={<School className="w-5 h-5" />}
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              Register as School
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

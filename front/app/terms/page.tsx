import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  School,
  UserCheck,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Terms of Service | UstaadLink',
  description: 'Terms of Service and Marketplace Rules for UstaadLink prototype.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            href="/"
            icon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-600 hover:text-slate-900"
          >
            Back to Home
          </Button>

          <span className="text-xs text-slate-400 font-medium">
            Effective Date: September 2026
          </span>
        </div>

        {/* Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-8 sm:p-12 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service &amp; Marketplace Guidelines
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            UstaadLink is a teacher–school recruitment marketplace prototype. By registering, creating an Educator Profile, or searching candidates, you agree to these Terms.
          </p>
        </div>

        {/* Key Guarantees Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">100% Free Platform</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              UstaadLink V1 charges zero recruitment commissions, zero contact fees, and zero paid listing subscriptions.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Direct Recruitment</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schools connect directly with teachers without third-party recruitment agencies or middleman interference.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Active Moderation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform administration monitors, reviews reports, and moderates or suspends non-compliant accounts.
            </p>
          </div>
        </div>

        {/* Detailed Terms Content */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-8 sm:p-12 space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
              <span>Platform Purpose &amp; Validation Prototype</span>
            </h2>
            <p className="text-slate-600">
              UstaadLink V1 is an early validation prototype designed to test if teachers and schools can recruit directly through standardized <strong>Educator Profiles</strong>. UstaadLink is not an employer, recruitment agency, or contractual intermediary.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
              <span>Teacher Responsibilities &amp; Profile Integrity</span>
            </h2>
            <p className="text-slate-600">
              As a Teacher on UstaadLink:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>You agree to provide accurate information regarding your highest education, qualifications, subjects, and teaching experience.</li>
              <li>You retain ownership of your profile and can edit, publish, or unpublish your profile at any time from your Teacher Dashboard.</li>
              <li>You understand that accepting a contact request allows the hiring school to view the contact number you choose to share.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">3</span>
              <span>School Responsibilities &amp; Contact Requests</span>
            </h2>
            <p className="text-slate-600">
              As a School Administrator on UstaadLink:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>You agree to send contact requests only for legitimate teaching employment or interview opportunities.</li>
              <li>You agree to abide by the rolling contact rate limit (maximum 20 contact requests per 24 hours).</li>
              <li>Unsolicited commercial marketing, spam, or harvesting teacher profiles is strictly prohibited.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">4</span>
              <span>Account Suspension &amp; Moderation</span>
            </h2>
            <p className="text-slate-600">
              UstaadLink administration reserves the right to suspend, moderate, or remove profiles that provide fraudulent credentials, engage in harassment, or violate platform safety standards. Suspended accounts are immediately hidden from all search results.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">5</span>
              <span>Limitation of Liability</span>
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed">
              UstaadLink provides the marketplace platform &ldquo;as is&rdquo;. Hiring decisions, interview scheduling, employment contracts, and salary negotiations are conducted solely between schools and teachers. UstaadLink is not liable for employment outcomes or contractual disputes.
            </p>
          </section>
        </div>

        {/* Action Footer */}
        <div className="text-center pt-4">
          <Link href="/privacy" className="text-xs text-blue-600 hover:underline font-semibold mr-6">
            View Privacy Policy
          </Link>
          <Link href="/register/teacher" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
            Create Free Profile &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  UserCheck, 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Privacy Policy | UstaadLink',
  description: 'Privacy Policy and data protection standards for UstaadLink marketplace.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            UstaadLink is built on privacy-first principles. We protect educators and schools from unsolicited marketing, public phone scraping, and unverified data exposure.
          </p>
        </div>

        {/* Core Principles Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Zero Public Numbers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Teacher phone numbers and WhatsApp details are never exposed to public web scrapers or anonymous visitors.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Opt-In Contact Sharing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contact details are only shared with a school after the teacher reviews and accepts their formal recruitment request.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5 shadow-soft">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Town-Level Location</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We collect town and district areas only. Exact residential street addresses are never collected or stored.
            </p>
          </div>
        </div>

        {/* Detailed Policy Content */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-8 sm:p-12 space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-slate-600">
              When creating an <strong>Educator Profile</strong> or registering a <strong>School Account</strong>, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>Educator Profile Data:</strong> Full Name, Highest Education, Institution, Teaching Subjects, Class Levels, Experience Years, Preferred Shifts, Town / Area, District, and Expected Salary.</li>
              <li><strong>Private Profile Records:</strong> Father&apos;s Name, Gender, Phone Number, WhatsApp Number, and Account Email address.</li>
              <li><strong>School Data:</strong> Official School Name, Contact Person, School Type, City, and District.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
              <span>Private Fields &amp; Non-Public Scope</span>
            </h2>
            <p className="text-slate-600">
              The following fields are strictly categorized as <strong>internal/private records</strong> in UstaadLink V1:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Father&apos;s Name &amp; Gender:</strong> Kept confidential for verification records; not rendered on public cards.</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Phone &amp; WhatsApp Numbers:</strong> Exchanged only upon mutual agreement during the contact request flow.</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>CNIC / B-Form &amp; Documents:</strong> UstaadLink V1 does not publicly display sensitive government identity documents.</span>
              </p>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">3</span>
              <span>Search Engine Indexing Control</span>
            </h2>
            <p className="text-slate-600">
              Teachers retain granular control over external search visibility. By default, external search indexing is disabled (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">search_indexable = false</code>). Teachers can choose to opt into search engine discovery directly from their publishing settings.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">4</span>
              <span>Contact Us</span>
            </h2>
            <p className="text-slate-600">
              For privacy inquiries, profile deletion requests, or moderation concerns, contact our privacy team at:
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
              <Mail className="w-4 h-4" />
              <span>privacy@ustaadlink.pk</span>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="text-center pt-4">
          <Link href="/terms" className="text-xs text-blue-600 hover:underline font-semibold mr-6">
            View Terms of Service
          </Link>
          <Link href="/teachers" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
            Browse Educator Profiles &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

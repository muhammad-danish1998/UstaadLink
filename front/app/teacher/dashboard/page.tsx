'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  User, 
  Edit3, 
  Inbox, 
  Settings, 
  LogOut, 
  Eye, 
  Send, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  PhoneCall,
  School,
  Copy,
  Check,
  MapPin,
  GraduationCap,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getCardDraft, saveCardDraft, TeacherCardDraft } from '@/lib/cardBuilderStorage';
import { getTeacherDashboardData, respondToContactRequest, fetchCurrentTeacherProfile } from '@/services/teacherService';
import { useAuth } from '@/hooks/useAuth';

interface ContactRequestItem {
  id: string;
  schoolName: string;
  contactPerson: string;
  email: string;
  phone: string;
  hiringSubject: string;
  message: string;
  date: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function TeacherDashboardPage() {
  const { user, profile, signOut } = useAuth();
  const [draft, setDraft] = useState<TeacherCardDraft | null>(null);
  const [requests, setRequests] = useState<ContactRequestItem[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const publicSlug = draft?.fullName 
    ? draft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : 'preview';

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        // 1. Fetch the authenticated teacher's actual profile from Supabase
        const targetId = user?.id || (profile?.id ? profile.id : undefined);
        const liveProfile = await fetchCurrentTeacherProfile(targetId);
        
        let activeDraft = liveProfile;
        if (!activeDraft) {
          activeDraft = getCardDraft();
        }

        // Ensure active draft belongs to the currently logged in user
        if (profile?.full_name && (!activeDraft.fullName || (user && activeDraft.fullName !== profile.full_name))) {
          activeDraft = {
            ...activeDraft,
            fullName: profile.full_name,
            email: profile.email || activeDraft.email,
            phone: profile.phone || activeDraft.phone,
          };
          saveCardDraft(activeDraft);
        }

        setDraft(activeDraft);
        setIsPublished(activeDraft.isPublished !== undefined ? activeDraft.isPublished : true);

        // 2. Fetch requests matching this specific teacher
        const slugToQuery = targetId || (activeDraft.fullName ? activeDraft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined);

        const { requests: liveRequests } = await getTeacherDashboardData(slugToQuery);
        if (liveRequests && liveRequests.length > 0) {
          const mapped: ContactRequestItem[] = liveRequests.map((r: any) => {
            let email = 'school@teachconnect.pk';
            let phone = '03001234567';
            let hiringSubject = r.requirement_details || 'Secondary Teaching Faculty';

            if (r.requirement_details) {
              const emailMatch = r.requirement_details.match(/Email:\s*([^\s\),]+)/i);
              if (emailMatch) email = emailMatch[1];
              const phoneMatch = r.requirement_details.match(/Contact:\s*([^\s\),]+)/i);
              if (phoneMatch) phone = phoneMatch[1];
              hiringSubject = r.requirement_details.replace(/\s*\(Contact:[^\)]+\)/i, '').trim();
            }

            const sch = Array.isArray(r.schools) ? r.schools[0] : r.schools;
            const schProf = Array.isArray(sch?.profiles) ? sch.profiles[0] : sch?.profiles;
            if (schProf?.email) email = schProf.email;
            if (schProf?.phone) phone = schProf.phone;

            return {
              id: r.id,
              schoolName: r.school_name || sch?.school_name || 'Academic School',
              contactPerson: r.contact_person || 'Principal / HR',
              email,
              phone,
              hiringSubject,
              message: r.message || 'We reviewed your Educator Profile and would like to invite you for an interview at our school campus.',
              date: new Date(r.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: r.status,
            };
          });
          setRequests(mapped);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error('Error loading teacher dashboard from Supabase:', err);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();

    const handleReqUpdate = () => loadDashboard();
    window.addEventListener('teachconnect_requests_updated', handleReqUpdate);
    return () => {
      window.removeEventListener('teachconnect_requests_updated', handleReqUpdate);
    };
  }, [user, profile]);

  const togglePublish = () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    saveCardDraft({ isPublished: nextState });
    showToast(nextState ? '🎉 Your Educator Profile is now Published & visible to schools!' : 'Your Educator Profile is now hidden from search.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyPhoneNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast(`Phone number (${phone}) copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAcceptRequest = async (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r))
    );
    await respondToContactRequest(id, 'accepted', draft?.phone || '03001234567', draft?.whatsapp || '03001234567');
    showToast('Contact request accepted! You can now call the school directly.');
  };

  const handleDeclineRequest = async (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r))
    );
    await respondToContactRequest(id, 'declined');
    showToast('Contact request declined.');
  };

  if (!draft) return null;

  const formattedSalary = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(draft.expectedSalary || 35000);

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-2 duration-200 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header & Overview Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Teacher Dashboard
                </h1>
                <Badge variant={isPublished ? 'success' : 'neutral'} size="sm">
                  {isPublished ? 'Profile Live' : 'Profile Hidden'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage your educator profile, view school inquiries, and call school administrators directly.
              </p>
            </div>

            {/* Visibility Toggle Action */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shrink-0">
              <span className="text-xs font-semibold text-slate-700 pl-2">
                Profile Status:
              </span>
              <button
                type="button"
                onClick={togglePublish}
                className={`
                  px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer
                  ${isPublished 
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }
                `.trim()}
              >
                <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                <span>{isPublished ? 'Published' : 'Unpublished'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-1">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Contact Requests</span>
                <Inbox className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {requests.length}
              </span>
              <span className="text-xs text-blue-700 font-medium block">
                {pendingRequestsCount > 0 ? `${pendingRequestsCount} new request awaiting your call` : 'All requests responded'}
              </span>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Expected Salary</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block truncate">
                {formattedSalary}
              </span>
              <span className="text-xs text-emerald-700 font-medium block">
                PKR / month &bull; Shift: {draft.availability || 'Morning'}
              </span>
            </div>

            <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 space-y-1">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Preferred Location</span>
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block truncate">
                {draft.area || 'Malir'}, {draft.city || 'Karachi'}
              </span>
              <span className="text-xs text-purple-700 font-medium block">
                {draft.district || 'Malir District'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Left Profile Preview & Right Contact Inquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: My Educator Profile Box (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>My Educator Profile</span>
              </h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isPublished ? 'Live' : 'Draft'}
              </span>
            </div>

            {/* Compact Profile Visual */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-blue-50 border-2 border-blue-200 shrink-0">
                  {draft.profilePhotoUrl ? (
                    <img
                      src={draft.profilePhotoUrl}
                      alt={draft.fullName || 'Teacher Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.dash-initials-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="dash-initials-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg"
                    style={{ display: draft.profilePhotoUrl ? 'none' : 'flex' }}
                  >
                    {draft.fullName ? draft.fullName.slice(0, 2).toUpperCase() : 'TC'}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-base truncate">
                    {draft.fullName || 'Educator'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {draft.highestEducation || 'Certified Teacher'}
                  </p>
                </div>
              </div>

              {/* Subject Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(draft.subjects && draft.subjects.length > 0 ? draft.subjects : ['General Science', 'Mathematics']).map((s) => (
                  <Badge key={s} variant="primary" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Details List */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Classes:</span>
                  <span className="font-semibold text-slate-800">{draft.classes || '6 - 10'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Experience:</span>
                  <span className="font-semibold text-slate-800">{draft.experienceYears || 3} Years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shift:</span>
                  <span className="font-semibold text-slate-800">{draft.availability || 'Morning'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-bold text-blue-700">{formattedSalary}</span>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="md"
                fullWidth
                href="/create-card/step-1"
                icon={<Edit3 className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                href={`/teacher/${publicSlug}`}
                icon={<Eye className="w-4 h-4" />}
              >
                View Public Profile
              </Button>
            </div>
          </div>

          {/* Right Column: Contact Requests & Calling Center (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-blue-600" />
                    <span>School Contact Requests</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schools interested in hiring you. View school contact details below and connect or call on WhatsApp to schedule an interview.
                  </p>
                </div>

                <Badge variant="primary" size="sm" className="self-start sm:self-auto">
                  {requests.length} Requests
                </Badge>
              </div>

              {/* Requests List */}
              {requests.length > 0 ? (
                <div className="space-y-5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className={`
                        p-5 sm:p-6 rounded-2xl border transition-all space-y-4
                        ${req.status === 'pending' 
                          ? 'border-blue-200 bg-blue-50/25 shadow-xs' 
                          : req.status === 'accepted' 
                          ? 'border-emerald-200 bg-emerald-50/20' 
                          : 'border-slate-200 bg-slate-50/40 opacity-70'
                        }
                      `.trim()}
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                              {req.schoolName}
                            </h3>
                            <Badge
                              variant={req.status === 'pending' ? 'info' : req.status === 'accepted' ? 'success' : 'neutral'}
                              size="sm"
                            >
                              {req.status === 'pending' ? 'Pending' : req.status === 'accepted' ? 'Connected' : 'Declined'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            Contact Person: <strong className="text-slate-700">{req.contactPerson}</strong> &bull; Received on {req.date}
                          </p>
                        </div>

                        <div className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-3 py-1.5 rounded-xl self-start">
                          {req.hiringSubject}
                        </div>
                      </div>

                      {/* School Note / Message */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/90 text-xs text-slate-700 leading-relaxed space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          School Requirement Note:
                        </span>
                        <p>&ldquo;{req.message}&rdquo;</p>
                      </div>

                      {/* Direct Phone & Calling Box */}
                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            Official School Phone / WhatsApp:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {req.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyPhoneNumber(req.phone, req.id)}
                              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Copy Phone Number"
                            >
                              {copiedId === req.id ? (
                                <Check className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Copy className="w-4 h-4 text-emerald-700" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-emerald-700">
                            Email: {req.email}
                          </p>
                        </div>

                        {/* Call on WhatsApp Button */}
                        {(() => {
                          let cleaned = req.phone.replace(/[^0-9]/g, '');
                          if (cleaned.startsWith('03')) {
                            cleaned = '92' + cleaned.slice(1);
                          } else if (cleaned.startsWith('3') && cleaned.length === 10) {
                            cleaned = '92' + cleaned;
                          }
                          const text = encodeURIComponent(`Assalam-o-Alaikum, I received your contact request on TeachConnect regarding the ${req.hiringSubject} position.`);
                          const waUrl = `https://wa.me/${cleaned}?text=${text}`;

                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                            >
                              <PhoneCall className="w-4 h-4" />
                              <span>Call on WhatsApp</span>
                            </a>
                          );
                        })()}
                      </div>

                      {/* Action response buttons */}
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-3 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeclineRequest(req.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Decline Request
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(req.id)}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Mark as Contacted / Accepted
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No Contact Requests Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When schools search for teachers and submit an interview request, their school details and phone number will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

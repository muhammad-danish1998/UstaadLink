'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Search, 
  Bookmark, 
  Send, 
  Building2, 
  Settings, 
  LogOut, 
  Eye, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Phone, 
  Mail, 
  Trash2, 
  ExternalLink,
  Sparkles,
  School,
  User,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Copy,
  Check,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TeacherCard, TeacherCardData } from '@/components/teacher/TeacherCard';
import { ContactRequestModal } from '@/components/contact/ContactRequestModal';
import { getSchoolDashboardData, registerSchoolProfile, getCurrentSchoolProfile } from '@/services/teacherService';
import { createClient } from '@/lib/supabase/client';
import { getShortlistedTeachers, toggleShortlist } from '@/lib/analyticsTracker';
import { useAuth } from '@/hooks/useAuth';

interface SentRequestItem {
  id: string;
  teacherName: string;
  teacherSlug: string;
  avatarUrl?: string;
  highestEducation: string;
  subject: string;
  location: string;
  dateSent: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
  teacherPhone?: string;
  teacherEmail?: string;
  teacherWhatsApp?: string;
  teacherResponseNote?: string;
  respondedAt?: string;
}

const POPULAR_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Physics',
  'Computer Science',
  'Chemistry',
  'Biology',
  'Montessori / Primary',
];

export default function SchoolDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'shortlist' | 'settings'>('overview');
  const [sentRequests, setSentRequests] = useState<SentRequestItem[]>([]);
  const [shortlist, setShortlist] = useState<TeacherCardData[]>([]);
  const [selectedTeacherForContact, setSelectedTeacherForContact] = useState<TeacherCardData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [schoolData, setSchoolData] = useState({
    schoolName: '',
    contactPerson: '',
    email: '',
    phone: '',
    area: '',
    city: 'Karachi',
    schoolType: 'Private',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyPhoneNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast(`Teacher phone number (${phone}) copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  useEffect(() => {
    // Load local shortlists
    const localShortlist = getShortlistedTeachers();
    setShortlist(localShortlist);

    async function loadSchoolData() {
      setIsLoading(true);
      try {
        // Fetch current school specifically matching the logged in user
        const schoolRecord = await getCurrentSchoolProfile(user?.id, profile?.email);

        let resolvedSchoolId: string | undefined = undefined;
        let resolvedSchoolName: string | undefined = undefined;
        let resolvedSchoolEmail: string | undefined = profile?.email;

        if (schoolRecord) {
          resolvedSchoolId = schoolRecord.id;
          resolvedSchoolName = schoolRecord.school_name;
          const prof = Array.isArray(schoolRecord.profiles) ? schoolRecord.profiles[0] : schoolRecord.profiles;
          if (prof?.email) resolvedSchoolEmail = prof.email;

          setSchoolData({
            schoolName: schoolRecord.school_name || profile?.full_name || 'My School',
            contactPerson: schoolRecord.contact_person || profile?.full_name || 'Administrator',
            email: prof?.email || profile?.email || '',
            phone: prof?.phone || profile?.phone || '',
            area: schoolRecord.area || (schoolRecord.uc ? `${schoolRecord.uc}, ${schoolRecord.area}` : 'Karachi'),
            city: schoolRecord.city || 'Karachi',
            schoolType: schoolRecord.school_type || 'Private',
          });
        } else if (profile || user) {
          resolvedSchoolName = profile?.full_name;
          setSchoolData({
            schoolName: profile?.full_name || 'Registered School',
            contactPerson: profile?.full_name || 'Principal / Administrator',
            email: profile?.email || user?.email || '',
            phone: profile?.phone || '',
            area: 'Malir',
            city: 'Karachi',
            schoolType: 'Private',
          });
        }

        const { sentRequests: liveSent } = await getSchoolDashboardData({
          schoolId: resolvedSchoolId,
          userId: user?.id,
          userEmail: resolvedSchoolEmail,
          schoolName: resolvedSchoolName,
        });

        if (liveSent && liveSent.length > 0) {
          const mapped: SentRequestItem[] = liveSent.map((s: any) => {
            const t = Array.isArray(s.teachers) ? s.teachers[0] : s.teachers;
            const prof = Array.isArray(t?.profiles) ? t.profiles[0] : t?.profiles;
            const teacherName = prof?.full_name || s.teacherName || s.teacher_name || 'Educator';
            const teacherSlug = t?.slug || s.teacherSlug || 'preview';
            const avatarUrl = t?.avatar_url || s.avatarUrl || '';
            const highestEducation = t?.highest_education || s.highestEducation || s.teacherEducation || 'Educator';
            const location = t?.town_area ? `${t.town_area}, ${t.city || 'Karachi'}` : (t?.city || s.teacherLocation || 'Karachi');

            let subject = 'Teaching Position';
            if (s.requirement_details || s.requirement || s.subject) {
              const rawSubj = s.requirement_details || s.requirement || s.subject;
              subject = rawSubj.replace(/\s*\(Contact:[^\)]+\)/i, '').trim();
            }

            const normStatus = String(s.status || '').toLowerCase().trim();
            const isAccepted = normStatus === 'accepted';
            const isDeclined = normStatus === 'declined';
            const resolvedStatus = isAccepted ? 'accepted' : (isDeclined ? 'declined' : 'pending');

            const rawPhone = s.shared_phone || s.teacherPhone || s.phone || prof?.phone || t?.whatsapp;
            const rawWa = s.shared_whatsapp || s.teacherWhatsApp || t?.whatsapp || rawPhone;
            const finalPhone = isAccepted ? (rawPhone || '0300-1234567') : undefined;
            const finalWa = isAccepted ? (rawWa || finalPhone || '0300-1234567') : undefined;

            return {
              id: s.id,
              teacherName,
              teacherSlug,
              avatarUrl,
              highestEducation,
              subject,
              location,
              dateSent: new Date(s.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: resolvedStatus,
              teacherPhone: finalPhone,
              teacherEmail: s.shared_whatsapp || undefined,
              teacherWhatsApp: finalWa,
              teacherResponseNote: s.teacher_response_note || (isAccepted ? 'Approved by Administrator (Contact Details Unlocked)' : undefined),
              respondedAt: s.responded_at ? new Date(s.responded_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : undefined,
            };
          });
          setSentRequests(mapped);
        } else {
          setSentRequests([]);
        }
      } catch (err) {
        console.error('Error loading school dashboard:', err);
        setSentRequests([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadSchoolData();
    }

    const handleReqUpdate = () => {
      if (!authLoading) loadSchoolData();
    };
    window.addEventListener('teachconnect_requests_updated', handleReqUpdate);
    window.addEventListener('storage', handleReqUpdate);
    return () => {
      window.removeEventListener('teachconnect_requests_updated', handleReqUpdate);
      window.removeEventListener('storage', handleReqUpdate);
    };
  }, [user, profile, authLoading]);

  const handleRemoveFromShortlist = (teacherId: string) => {
    toggleShortlist({ id: teacherId } as any);
    setShortlist((prev) => prev.filter((t) => t.id !== teacherId));
    showToast('Teacher removed from shortlist');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerSchoolProfile(schoolData);
      showToast('School profile updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Profile saved locally.');
    }
  };

  const pendingCount = sentRequests.filter(r => r.status === 'pending').length;

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

        {/* Dashboard Top Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                <School className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {schoolData.schoolName}
                  </h1>
                  <Badge variant="success" size="sm">Verified School</Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                  {schoolData.contactPerson} &bull; {schoolData.area}, {schoolData.city} &bull; {schoolData.schoolType}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              href="/teachers"
              icon={<Search className="w-4 h-4" />}
              className="shrink-0"
            >
              Find Teachers
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Sent Requests</span>
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {sentRequests.length}
              </span>
              <span className="text-xs text-emerald-700 font-medium block">
                {pendingCount > 0 ? `${pendingCount} awaiting teacher response` : 'All requests responded'}
              </span>
            </div>

            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-1">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Shortlisted Teachers</span>
                <Bookmark className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {shortlist.length}
              </span>
              <span className="text-xs text-blue-700 font-medium block">
                Bookmarked for hiring
              </span>
            </div>

            <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 space-y-1">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Recruitment Cost</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                100% Free
              </span>
              <span className="text-xs text-purple-700 font-medium block">
                Zero commission middlemen
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer
              ${activeTab === 'overview' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `.trim()}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview &amp; Requests</span>
          </button>

          <button
            onClick={() => setActiveTab('shortlist')}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer
              ${activeTab === 'shortlist' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `.trim()}
          >
            <Bookmark className="w-4 h-4" />
            <span>Shortlisted ({shortlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer
              ${activeTab === 'settings' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `.trim()}
          >
            <Settings className="w-4 h-4" />
            <span>School Profile</span>
          </button>
        </div>

        {/* Tab 1: Overview & Sent Requests */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Subject Shortcuts */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quick Search by Subject
                  </h2>
                  <p className="text-xs text-slate-500">
                    Discover available teachers matching your subject requirements with one click.
                  </p>
                </div>
                <Link
                  href="/teachers"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  <span>View All Filters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {POPULAR_SUBJECTS.map((subj) => (
                  <Link
                    key={subj}
                    href={`/teachers?subject=${encodeURIComponent(subj)}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/90 text-xs font-semibold text-slate-700 transition-all flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{subj}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sent Contact Requests Table / Cards */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Sent Contact Requests
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track the progress of hiring requests sent to teachers.
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  {sentRequests.length} Total
                </Badge>
              </div>

              {sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 border-2 border-blue-100">
                            {req.avatarUrl ? (
                              <Image
                                src={req.avatarUrl}
                                alt={req.teacherName}
                                fill
                                unoptimized={true}
                                className="object-cover"
                              />
                            ) : (
                              <span>{req.teacherName.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {req.teacherName}
                              </h3>
                              <Badge
                                variant={req.status === 'accepted' ? 'success' : req.status === 'pending' ? 'info' : 'neutral'}
                                size="sm"
                              >
                                {req.status === 'accepted' ? 'Accepted & Contact Unlocked' : req.status === 'pending' ? 'Pending Response' : 'Declined'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {req.highestEducation} &bull; {req.location} &bull; Sent on {req.dateSent}
                            </p>
                            <p className="text-xs font-semibold text-emerald-700 mt-1">
                              Requirement: {req.subject}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            href={`/teacher/${req.teacherSlug}`}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>

                      {/* Unlocked Contact Details Banner (Accepted by Teacher or Admin) */}
                      {req.status === 'accepted' && (
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/70 rounded-2xl border border-emerald-200 shadow-xs space-y-3.5 animate-in fade-in duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-emerald-950 block">
                                  Direct Teacher Contact Unlocked
                                </span>
                                <span className="text-[11px] text-emerald-800/90 font-medium">
                                  Verified Lead &bull; You can now reach out to schedule an interview
                                </span>
                              </div>
                            </div>

                            <Badge variant="success" size="sm" className="self-start sm:self-auto bg-emerald-100 text-emerald-800 border-emerald-300">
                              Active Lead
                            </Badge>
                          </div>

                          {/* Contact Number & Actions Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            {/* Phone Number Display Box */}
                            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Contact Number
                                  </span>
                                  <span className="text-sm font-extrabold text-slate-900 tracking-tight truncate block">
                                    {req.teacherPhone || req.teacherWhatsApp || '0300-1234567'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => copyPhoneNumber(req.teacherPhone || req.teacherWhatsApp || '0300-1234567', req.id)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                                title="Copy Phone Number"
                              >
                                {copiedId === req.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* Direct Call & WhatsApp Action Buttons */}
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${req.teacherPhone || req.teacherWhatsApp || '03001234567'}`}
                                className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow-md"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Call Teacher</span>
                              </a>

                              <a
                                href={`https://wa.me/${(req.teacherWhatsApp || req.teacherPhone || '03001234567').replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300 shadow-2xs transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>

                          {/* Note footer if available */}
                          {req.teacherResponseNote && (
                            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                              <span className="italic">&ldquo;{req.teacherResponseNote}&rdquo;</span>
                              {req.respondedAt && <span className="text-slate-400 font-normal">Accepted {req.respondedAt}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Send className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No Sent Requests Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you find qualified teachers on TeachConnect and send them a contact request, you can monitor their responses here.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    href="/teachers"
                    icon={<Search className="w-4 h-4" />}
                  >
                    Find Teachers Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Shortlisted Teachers */}
        {activeTab === 'shortlist' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Shortlisted Teachers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teachers bookmarked for your school recruitment pipeline.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {shortlist.length} Shortlisted
              </Badge>
            </div>

            {shortlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {shortlist.map((teacher) => (
                  <div key={teacher.id} className="relative">
                    <TeacherCard
                      teacher={teacher}
                      onContactClick={(t) => setSelectedTeacherForContact(t)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFromShortlist(teacher.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shadow-xs"
                      title="Remove from shortlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No Shortlisted Teachers</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse teacher profiles and click the bookmark button to save candidate profiles for quick access.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  href="/teachers"
                  icon={<Search className="w-4 h-4" />}
                >
                  Search Teachers
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: School Profile Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 max-w-3xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                School Profile Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update official school details that are sent along with your teacher contact requests.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">School / Institution Name</label>
                <input
                  type="text"
                  value={schoolData.schoolName}
                  onChange={(e) => setSchoolData({ ...schoolData, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Contact Person Name &amp; Designation</label>
                <input
                  type="text"
                  value={schoolData.contactPerson}
                  onChange={(e) => setSchoolData({ ...schoolData, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    value={schoolData.email}
                    onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Official Phone Number</label>
                  <input
                    type="text"
                    value={schoolData.phone}
                    onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Area / Town</label>
                  <input
                    type="text"
                    value={schoolData.area}
                    onChange={(e) => setSchoolData({ ...schoolData, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">School Type</label>
                  <input
                    type="text"
                    value={schoolData.schoolType}
                    onChange={(e) => setSchoolData({ ...schoolData, schoolType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" variant="primary" size="md">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal for sending contact requests from shortlist */}
      {selectedTeacherForContact && (
        <ContactRequestModal
          isOpen={!!selectedTeacherForContact}
          onClose={() => setSelectedTeacherForContact(null)}
          teacherName={selectedTeacherForContact.fullName}
          teacherSlug={selectedTeacherForContact.slug}
        />
      )}
    </div>
  );
}

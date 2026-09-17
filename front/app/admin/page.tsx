'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  School, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  RotateCcw, 
  Search, 
  Eye, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Clock, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  Filter,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Banknote,
  X,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  PhoneCall,
  Lock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Save,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAdminDashboardData, updateModerationStatus, deleteUserAccount, deleteContactRequest, parseTeacherMetadata } from '@/services/teacherService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAdminCredentials, updateAdminCredentials, verifyAdminCredentials, AdminCredentials } from '@/lib/adminAuth';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Teacher' | 'School';
  detail: string;
  date: string;
  status: 'active' | 'suspended' | 'flagged';
  slug?: string;
  avatarUrl?: string;
  contactPerson?: string;
  schoolType?: string;
  city?: string;
  district?: string;
  area?: string;
  highestEducation?: string;
  institution?: string;
  additionalQualifications?: string;
  experienceYears?: number;
  previousSchool?: string;
  availability?: string;
  availableFrom?: string;
  expectedSalary?: number;
  aboutMe?: string;
}

interface ContactRequestRecord {
  id: string;
  teacherId: string;
  schoolId?: string;
  schoolName: string;
  contactPerson: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolLocation?: string;
  schoolType?: string;
  teacherName: string;
  teacherSlug?: string;
  teacherAvatarUrl?: string;
  teacherEducation?: string;
  teacherLocation?: string;
  teacherPhone?: string;
  teacherEmail?: string;
  requirement: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
  date: string;
  createdAt: string;
  sharedPhone?: string;
  sharedWhatsApp?: string;
  teacherResponseNote?: string;
  respondedAt?: string;
}

interface ReportItem {
  id: string;
  reportedName: string;
  reporterType: 'School' | 'Teacher';
  reason: string;
  date: string;
  status: 'open' | 'resolved';
}

export default function AdminPanelPage() {
  const { user, profile, role, loading, signOut, refreshAuth } = useAuth();
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'teachers' | 'schools' | 'requests' | 'reports' | 'settings'>('dashboard');
  const [userTab, setUserTab] = useState<'all' | 'teachers' | 'schools'>('teachers');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [requests, setRequests] = useState<ContactRequestRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deletingRequest, setDeletingRequest] = useState<ContactRequestRecord | null>(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState<boolean>(false);

  // Admin inline login state when not authenticated
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Settings (Change username/email & password)
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(() => getAdminCredentials());
  const [settingsForm, setSettingsForm] = useState({
    usernameOrEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    const creds = getAdminCredentials();
    setAdminCreds(creds);
    setSettingsForm((prev) => ({
      ...prev,
      usernameOrEmail: creds.email,
    }));
  }, []);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { teachers, schools, requests: dbRequests, reports: dbReports } = await getAdminDashboardData();
        const records: UserRecord[] = [];

        // 1. Map real teachers from Supabase
        teachers.forEach((t: any) => {
          const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
          const meta = parseTeacherMetadata(t.about_me, t.town_area);
          records.push({
            id: t.id,
            name: prof?.full_name || 'Educator',
            email: prof?.email || 'teacher@teachconnect.pk',
            phone: prof?.phone || '03001234567',
            role: 'Teacher',
            detail: `${t.highest_education || 'Teacher'} • ${t.town_area || 'Karachi'}, ${t.city || 'Karachi'}`,
            date: new Date(t.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
            status: t.moderation_status === 'suspended' ? 'suspended' : 'active',
            slug: t.slug,
            avatarUrl: t.avatar_url,
            highestEducation: t.highest_education,
            institution: t.institution,
            additionalQualifications: t.additional_qualifications,
            experienceYears: t.experience_years,
            previousSchool: t.previous_school,
            availability: t.availability,
            availableFrom: t.available_from,
            city: t.city,
            district: t.district,
            area: t.town_area,
            expectedSalary: t.expected_salary,
            aboutMe: meta.cleanAboutMe || 'Dedicated educator passionate about student success.',
          });
        });

        // 2. Map real schools from Supabase
        schools.forEach((s: any) => {
          const prof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          records.push({
            id: s.id,
            name: s.school_name,
            email: prof?.email || 'school@teachconnect.pk',
            phone: prof?.phone || '021-34567890',
            role: 'School',
            detail: `${s.school_type || 'Private'} • ${s.area || 'Karachi'}, ${s.city || 'Karachi'}`,
            date: new Date(s.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
            status: s.moderation_status === 'suspended' ? 'suspended' : 'active',
            contactPerson: s.contact_person,
            schoolType: s.school_type === 'Other' ? (s.custom_school_type || 'Other') : s.school_type,
            city: s.city,
            district: s.district,
            area: s.area,
          });
        });

        // Deduplicate records strictly by unique ID and unique email
        const seenIds = new Set<string>();
        const seenEmails = new Set<string>();
        const uniqueRecords: UserRecord[] = [];

        for (const rec of records) {
          const emailKey = (rec.email || '').toLowerCase().trim();
          const hasSeenId = rec.id && seenIds.has(rec.id);
          const hasSeenEmail = emailKey && seenEmails.has(emailKey);

          if (!hasSeenId && !hasSeenEmail) {
            if (rec.id) seenIds.add(rec.id);
            if (emailKey) seenEmails.add(emailKey);
            uniqueRecords.push(rec);
          }
        }

        // 3. Map Contact Requests with both School (Sender) and Teacher (Recipient) details
        const mappedRequests: ContactRequestRecord[] = (dbRequests || []).map((r: any) => {
          const tObj = Array.isArray(r.teachers) ? r.teachers[0] : r.teachers;
          const tProf = tObj?.profiles ? (Array.isArray(tObj.profiles) ? tObj.profiles[0] : tObj.profiles) : null;
          
          const sObj = Array.isArray(r.schools) ? r.schools[0] : r.schools;
          const sProf = sObj?.profiles ? (Array.isArray(sObj.profiles) ? sObj.profiles[0] : sObj.profiles) : null;

          // Fallback search in teachers array if relation was unresolved
          const matchedTeacher = !tProf ? uniqueRecords.find(u => u.role === 'Teacher' && (u.id === r.teacher_id || u.slug === r.teacher_id)) : null;
          const matchedSchool = !sProf ? uniqueRecords.find(u => u.role === 'School' && (u.id === r.school_id || u.name.toLowerCase() === (r.school_name || '').toLowerCase())) : null;

          const teacherFullName = tProf?.full_name || matchedTeacher?.name || 'Educator Profile';
          const teacherSlug = tObj?.slug || matchedTeacher?.slug;
          const teacherEdu = tObj?.highest_education || matchedTeacher?.highestEducation || 'Certified Teacher';
          const teacherLoc = tObj ? `${tObj.town_area || ''}${tObj.town_area && tObj.city ? ', ' : ''}${tObj.city || ''}` : (matchedTeacher?.detail || 'Karachi');

          const schoolName = r.school_name || sObj?.school_name || matchedSchool?.name || 'Registered School';
          const contactPerson = r.contact_person || sObj?.contact_person || matchedSchool?.contactPerson || 'School Administrator';
          const schoolEmail = sProf?.email || matchedSchool?.email || '';
          const schoolPhone = sProf?.phone || matchedSchool?.phone || '';
          const schoolLoc = sObj ? `${sObj.area || ''}${sObj.area && sObj.city ? ', ' : ''}${sObj.city || ''}` : (matchedSchool?.area || 'Karachi');

          return {
            id: r.id,
            teacherId: r.teacher_id,
            schoolId: r.school_id,
            schoolName,
            contactPerson,
            schoolEmail,
            schoolPhone,
            schoolLocation: schoolLoc,
            schoolType: sObj?.school_type || matchedSchool?.schoolType || 'Private',
            teacherName: teacherFullName,
            teacherSlug,
            teacherAvatarUrl: tObj?.avatar_url || matchedTeacher?.avatarUrl,
            teacherEducation: teacherEdu,
            teacherLocation: teacherLoc,
            teacherPhone: tProf?.phone || matchedTeacher?.phone || '',
            teacherEmail: tProf?.email || matchedTeacher?.email || '',
            requirement: r.requirement_details || 'Teaching Position',
            message: r.message || '',
            status: r.status || 'pending',
            date: new Date(r.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }),
            createdAt: r.created_at,
            sharedPhone: r.shared_phone,
            sharedWhatsApp: r.shared_whatsapp,
            teacherResponseNote: r.teacher_response_note,
            respondedAt: r.responded_at ? new Date(r.responded_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : undefined,
          };
        });

        setUsers(uniqueRecords);
        setRequests(mappedRequests);
        if (dbReports && dbReports.length > 0) {
          setReports(dbReports.map((r: any) => ({
            id: r.id,
            reportedName: r.reported_name || 'Reported Entity',
            reporterType: r.reporter_type || 'School',
            reason: r.reason || 'Flagged for moderation',
            date: new Date(r.created_at).toLocaleDateString(),
            status: r.status,
          })));
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadAdminData();

    const handleUpdate = () => loadAdminData();
    window.addEventListener('teachconnect_requests_updated', handleUpdate);
    return () => {
      window.removeEventListener('teachconnect_requests_updated', handleUpdate);
    };
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const toggleSuspendUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
    );
    if (viewingUser?.id === id) {
      setViewingUser({ ...viewingUser, status: nextStatus });
    }
    showNotice(`${target.name} has been ${nextStatus === 'suspended' ? 'suspended / blocked' : 'restored to active'}.`);

    // Persist moderation status to Supabase & local storage
    await updateModerationStatus(target.id, target.role, nextStatus, target.slug || target.name);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAccount(deletingUser.id, deletingUser.role, deletingUser.slug || deletingUser.name);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        showNotice(`${deletingUser.name} (${deletingUser.role}) has been permanently deleted.`);
        if (viewingUser?.id === deletingUser.id) {
          setViewingUser(null);
        }
      } else {
        showNotice(`Failed to delete: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Delete error:', e);
      showNotice('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  const confirmDeleteRequest = async () => {
    if (!deletingRequest) return;
    setIsDeletingRequest(true);
    try {
      const res = await deleteContactRequest(deletingRequest.id);
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== deletingRequest.id));
        showNotice(`Contact request from ${deletingRequest.schoolName} to ${deletingRequest.teacherName} deleted.`);
        if (selectedRequest?.id === deletingRequest.id) {
          setSelectedRequest(null);
        }
      } else {
        showNotice(`Failed to delete request: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Delete request error:', e);
      showNotice('An error occurred while deleting the contact request.');
    } finally {
      setIsDeletingRequest(false);
      setDeletingRequest(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userTab === 'teachers' && u.role !== 'Teacher') return false;
    if (userTab === 'schools' && u.role !== 'School') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.detail.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) return false;
    if (requestSearchQuery.trim()) {
      const q = requestSearchQuery.toLowerCase();
      return (
        r.schoolName.toLowerCase().includes(q) ||
        r.teacherName.toLowerCase().includes(q) ||
        r.contactPerson.toLowerCase().includes(q) ||
        r.requirement.toLowerCase().includes(q) ||
        (r.schoolLocation && r.schoolLocation.toLowerCase().includes(q)) ||
        (r.teacherLocation && r.teacherLocation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleInlineAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter both Admin username/email and password.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const cleanId = loginIdentifier.trim();
      const isCorrect = await verifyAdminCredentials(cleanId, loginPassword);
      if (isCorrect) {
        const creds = getAdminCredentials();
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'teachconnect_demo_user',
            JSON.stringify({
              id: 'admin-master',
              email: creds.email,
              full_name: `Administrator (${creds.username})`,
              role: 'admin',
            })
          );
          window.dispatchEvent(new Event('teachconnect_auth_change'));
        }
        await refreshAuth();
        showNotice('Successfully authenticated as Administrator.');
      } else {
        setLoginError('Invalid Administrator credentials. Please verify your username and password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    if (!settingsForm.currentPassword) {
      setSettingsError('Please enter your Current Password to authorize changes.');
      return;
    }

    if (!settingsForm.usernameOrEmail.trim()) {
      setSettingsError('Admin Email or Username cannot be empty.');
      return;
    }

    if (settingsForm.newPassword) {
      if (settingsForm.newPassword.length < 8) {
        setSettingsError('New Password must be at least 8 characters long.');
        return;
      }
      if (settingsForm.newPassword !== settingsForm.confirmPassword) {
        setSettingsError('New Password and Confirmation do not match.');
        return;
      }
    }

    setIsUpdatingSettings(true);
    try {
      const res = await updateAdminCredentials(
        settingsForm.currentPassword,
        settingsForm.usernameOrEmail,
        settingsForm.newPassword || undefined
      );

      if (res.success) {
        setSettingsSuccess(res.message || 'Admin credentials updated successfully!');
        const fresh = getAdminCredentials();
        setAdminCreds(fresh);
        setSettingsForm({
          usernameOrEmail: fresh.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        showNotice('Admin credentials updated successfully.');
        await refreshAuth();
      } else {
        setSettingsError(res.error || 'Failed to update credentials.');
      }
    } catch (err: any) {
      setSettingsError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // 1. Loading State Guard
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center animate-pulse shadow-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-bold text-slate-800">Verifying Administrator Access...</p>
          <p className="text-xs text-slate-500">Checking credentials &amp; security permissions</p>
        </div>
      </div>
    );
  }

  // 2. Strict Auth Guard: Access Denied if not logged in as admin
  if (!user || role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Admin Authentication Required
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                This dashboard is strictly restricted to UstaadLink administrators. Please log in with authorized admin credentials to proceed.
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleInlineAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Admin Username or Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin@ustaadlink.pk or admin"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoggingIn}
              className="w-full text-xs font-bold py-2.5 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
            >
              {isLoggingIn ? 'Authenticating...' : 'Authorize Admin Access'}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/" className="text-slate-500 hover:text-slate-900 font-medium">
              &larr; Back to Homepage
            </Link>
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Standard User Login
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-2 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Admin Left Sidebar (3 cols) */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-4 sm:p-5 space-y-6">
              
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">UstaadLink Admin</span>
                  <span className="text-xs text-slate-500 block">Moderation Panel</span>
                </div>
              </div>

              {/* Sidebar Navigation */}
              <nav className="space-y-1 text-sm font-medium">
                <button
                  onClick={() => { setActiveMenu('dashboard'); setUserTab('all'); }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'dashboard' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveMenu('teachers'); setUserTab('teachers'); }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'teachers' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Teachers</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {users.filter(u => u.role === 'Teacher').length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveMenu('schools'); setUserTab('schools'); }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'schools' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <div className="flex items-center gap-3">
                    <School className="w-4 h-4" />
                    <span>Schools</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {users.filter(u => u.role === 'School').length}
                  </span>
                </button>

                {/* Contact Requests Sidebar Navigation Item */}
                <button
                  onClick={() => setActiveMenu('requests')}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'requests' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4" />
                    <span>Contact Requests</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeMenu === 'requests' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {requests.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveMenu('reports')}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'reports' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reports</span>
                  </div>
                  {reports.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {reports.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveMenu('settings')}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer
                    ${activeMenu === 'settings' 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `.trim()}
                >
                  <Settings className="w-4 h-4" />
                  <span>Platform Settings</span>
                </button>
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Admin Content (9 cols) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* 1. Admin Header & Top Stats */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Platform metrics, user management, profile moderation, and school-teacher contact requests.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>System Healthy &bull; V1 Validation Live</span>
                </div>
              </div>

              {/* Statistics Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => { setActiveMenu('teachers'); setUserTab('teachers'); }}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-left space-y-1 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Teachers
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                    {users.filter(u => u.role === 'Teacher').length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium block">
                    {users.filter(u => u.role === 'Teacher' && u.status === 'active').length} Published Cards
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu('schools'); setUserTab('schools'); }}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-left space-y-1 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Schools
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                    {users.filter(u => u.role === 'School').length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Registered Schools
                  </span>
                </button>

                {/* Interactive Contact Requests Stat Card (Clickable to view details) */}
                <button
                  type="button"
                  onClick={() => setActiveMenu('requests')}
                  className={`
                    p-4 sm:p-5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer group relative overflow-hidden
                    ${activeMenu === 'requests' 
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs' 
                      : 'bg-slate-50 hover:bg-blue-50/40 border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                    }
                  `.trim()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block group-hover:text-blue-600 transition-colors">
                      Contact Requests
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 block">
                    {requests.length}
                  </span>
                  <span className="text-[10px] text-blue-600/80 font-semibold block flex items-center gap-1">
                    Click to inspect requests &rarr;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMenu('reports')}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-left space-y-1 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Open Reports
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                    {reports.length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Moderation Queue
                  </span>
                </button>
              </div>
            </div>

            {/* 2. DEDICATED VIEW: Contact Requests Directory (Active when activeMenu === 'requests') */}
            {activeMenu === 'requests' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        School &rarr; Teacher Contact Requests
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Monitor which schools have sent contact requests, the recipient teachers, hiring requirements, and communication statuses.
                    </p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold shrink-0">
                    <button
                      onClick={() => setRequestStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${requestStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      All ({requests.length})
                    </button>
                    <button
                      onClick={() => setRequestStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${requestStatusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Pending ({requests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setRequestStatusFilter('accepted')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${requestStatusFilter === 'accepted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Accepted ({requests.filter(r => r.status === 'accepted').length})
                    </button>
                    <button
                      onClick={() => setRequestStatusFilter('declined')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${requestStatusFilter === 'declined' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Declined ({requests.filter(r => r.status === 'declined').length})
                    </button>
                  </div>
                </div>

                {/* Request Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by school name, teacher name, contact person, requirement, or city..."
                    value={requestSearchQuery}
                    onChange={(e) => setRequestSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Contact Requests List / Table */}
                {filteredRequests.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-4"
                      >
                        {/* Header Row: School (Sender) & Teacher (Recipient) overview */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-4 border-b border-slate-100">
                          
                          {/* Sender School (5 cols) */}
                          <div className="md:col-span-5 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                              <School className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  Sender School
                                </span>
                                <span className="text-xs text-slate-400">&bull; {req.schoolType}</span>
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm truncate">
                                {req.schoolName}
                              </h3>
                              <p className="text-xs text-slate-600 font-medium">
                                Contact Person: <strong className="text-slate-800">{req.contactPerson}</strong>
                              </p>
                              {req.schoolLocation && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {req.schoolLocation}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Arrow Connector (1 col) */}
                          <div className="hidden md:flex md:col-span-1 justify-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Recipient Teacher (6 cols) */}
                          <div className="md:col-span-6 flex items-start justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                            <div className="flex items-start gap-3 min-w-0">
                              {req.teacherAvatarUrl ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
                                  <Image src={req.teacherAvatarUrl} alt={req.teacherName} fill unoptimized={true} className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                  {req.teacherName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Recipient Teacher
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm truncate">
                                  {req.teacherName}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {req.teacherEducation} &bull; {req.teacherLocation}
                                </p>
                              </div>
                            </div>

                            {req.teacherSlug && (
                              <Link
                                href={`/teacher/${req.teacherSlug}`}
                                target="_blank"
                                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <span>Profile Card</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Request Details & Requirement Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-500">Subject / Vacancy:</span>
                              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {req.requirement}
                              </span>
                              <span className="text-slate-400">&bull; Sent on {req.date}</span>
                            </div>
                            {req.message && (
                              <p className="text-slate-600 italic line-clamp-1">
                                &ldquo;{req.message}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                            <Badge
                              variant={
                                req.status === 'accepted' ? 'success' : 
                                req.status === 'declined' ? 'neutral' : 'warning'
                              }
                              size="sm"
                            >
                              {req.status === 'accepted' ? 'Accepted by Teacher' :
                               req.status === 'declined' ? 'Declined' : 'Pending Response'}
                            </Badge>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(req)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                              className="text-xs px-3"
                            >
                              Inspect Details
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRequest(req)}
                              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                              className="text-xs px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Delete Contact Request"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* If Accepted: Show Teacher's Shared WhatsApp & Contact info */}
                        {req.status === 'accepted' && (req.sharedWhatsApp || req.sharedPhone) && (
                          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-emerald-900 font-medium">
                                Teacher accepted request and shared direct contact:
                              </span>
                              <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                                {req.sharedWhatsApp || req.sharedPhone}
                              </span>
                            </div>
                            {req.teacherResponseNote && (
                              <span className="text-emerald-700 italic text-[11px]">
                                Note: &ldquo;{req.teacherResponseNote}&rdquo;
                              </span>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Send className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No Contact Requests Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {requestSearchQuery 
                        ? `No contact requests matched your search query "${requestSearchQuery}".`
                        : 'When registered schools find teacher profile cards and submit contact requests, they will appear here.'
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : activeMenu === 'settings' ? (
              /* 3. DEDICATED VIEW: Platform & Admin Credentials Settings */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                      <KeyRound className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Admin Security &amp; Credentials
                      </h2>
                      <p className="text-xs text-slate-500">
                        Manage master administrator username, login email, and authentication password.
                      </p>
                    </div>
                  </div>

                  <Badge variant="success" size="sm" className="self-start sm:self-auto">
                    Master Administrator Active
                  </Badge>
                </div>

                {/* Status Banners */}
                {settingsSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{settingsSuccess}</span>
                  </div>
                )}

                {settingsError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{settingsError}</span>
                  </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Admin Email
                    </span>
                    <span className="font-bold text-slate-900 text-sm block">
                      {adminCreds.email}
                    </span>
                    <span className="text-[11px] text-slate-500">Used for signing in and password recovery</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Admin Username
                    </span>
                    <span className="font-bold text-slate-900 text-sm block">
                      {adminCreds.username}
                    </span>
                    <span className="text-[11px] text-slate-500">Short identifier for quick admin authentication</span>
                  </div>
                </div>

                {/* Form to change admin username and password */}
                <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-200 space-y-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Update Username &amp; Password
                    </h3>
                  </div>

                  <form onSubmit={handleUpdateAdminSettings} className="space-y-4 max-w-xl">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        New Admin Username or Email
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.usernameOrEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, usernameOrEmail: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="e.g. admin@teachconnect.pk or new_admin_user"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Current Master Password <span className="text-red-500">* (Required to authorize change)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                          placeholder="Enter your existing admin password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={settingsForm.newPassword}
                            onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            placeholder="Min. 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Confirm New Password
                        </label>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isUpdatingSettings}
                        icon={<Save className="w-3.5 h-3.5" />}
                        className="text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
                      >
                        {isUpdatingSettings ? 'Saving Changes...' : 'Save Updated Credentials'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Platform Rules & Guardrail Settings Info */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">V1 Platform Architecture &amp; Security Rules</h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                    <li><strong>District Limitation:</strong> Strictly limited to District Malir, Karachi (Malir Town, Gadap Town, Ibrahim Hyderi Town, and custom areas).</li>
                    <li><strong>Contact Privacy:</strong> Direct teacher contact details are private until accepted by the teacher.</li>
                    <li><strong>Contact Rate Limiting:</strong> Maximum 20 contact requests per school per 24-hour rolling window.</li>
                  </ul>
                </div>

              </div>
            ) : (
              /* 3. Regular Moderation & Users Table */
              <>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Recent Platform Registrations
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Inspect profile cards, view full contact details, or manage active moderation statuses.
                      </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
                      <button
                        onClick={() => setUserTab('teachers')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${userTab === 'teachers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Teachers
                      </button>
                      <button
                        onClick={() => setUserTab('schools')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${userTab === 'schools' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Schools
                      </button>
                    </div>
                  </div>

                  {/* Search filter in table */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, contact person, or area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  {/* User Records List */}
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            {user.avatarUrl ? (
                              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <Image
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  fill
                                  unoptimized={true}
                                  className="object-cover"
                                />
                              </div>
                            ) : user.role === 'Teacher' ? (
                              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                <School className="w-5 h-5" />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 text-sm">
                                  {user.name}
                                </h3>
                                <Badge
                                  variant={user.status === 'active' ? 'success' : 'neutral'}
                                  size="sm"
                                >
                                  {user.role} &bull; {user.status === 'active' ? 'Active' : 'Suspended'}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {user.detail} &bull; <span className="text-slate-400">Registered {user.date}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                            {user.slug && (
                              <Button
                                variant="outline"
                                size="sm"
                                href={`/teacher/${user.slug}`}
                                className="text-xs px-3"
                              >
                                View Card
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingUser(user)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                              className="text-xs px-3"
                            >
                              View Details
                            </Button>

                            <button
                              type="button"
                              onClick={() => toggleSuspendUser(user.id)}
                              className={`
                                text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer
                                ${user.status === 'active' 
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                }
                              `.trim()}
                            >
                              {user.status === 'active' ? 'Block / Suspend' : 'Restore'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                              title={`Delete ${user.role}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">No {userTab === 'teachers' ? 'Teachers' : 'Schools'} Registered Yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        When new {userTab === 'teachers' ? 'teachers create profile cards' : 'schools register accounts'}, they will appear in this moderation table.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Open Moderation Reports Queue */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                      Moderation &amp; Reports Queue
                    </h2>
                    <Badge variant="neutral" size="sm">
                      {reports.length} Open
                    </Badge>
                  </div>

                  {reports.length > 0 ? (
                    reports.map((rep) => (
                      <div key={rep.id} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">Report against: {rep.reportedName}</span>
                          <span className="text-slate-600">Reason: {rep.reason} &bull; Filed by {rep.reporterType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => showNotice('Report dismissed.')} className="text-xs">
                            Dismiss
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => showNotice('Profile action taken.')} className="text-xs">
                            Take Action
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Moderation Queue Clear</p>
                      <p className="text-[11px] text-slate-500">No open user or school reports to review.</p>
                    </div>
                  )}
                </div>
              </>
            )}

          </main>
        </div>
      </div>

      {/* 1. View User / School Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                {viewingUser.avatarUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <Image src={viewingUser.avatarUrl} alt={viewingUser.name} fill unoptimized={true} className="object-cover" />
                  </div>
                ) : viewingUser.role === 'Teacher' ? (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {viewingUser.name.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                    <School className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {viewingUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={viewingUser.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {viewingUser.role} &bull; {viewingUser.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                    <span className="text-xs text-slate-400">Registered {viewingUser.date}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Attributes List */}
            <div className="space-y-3.5 text-xs">
              {viewingUser.role === 'School' ? (
                <>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Contact Person / Principal</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      {viewingUser.contactPerson || viewingUser.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Official Email</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {viewingUser.email}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {viewingUser.phone || '021-34567890'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">School Type</span>
                      <span className="font-semibold text-slate-800">{viewingUser.schoolType || 'Private School'}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Campus Location</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {viewingUser.area || 'Karachi'}, {viewingUser.city || 'Karachi'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Highest Education</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        {viewingUser.highestEducation || 'Certified Educator'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Institution</span>
                      <span className="font-semibold text-slate-800">{viewingUser.institution || 'University'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Experience</span>
                      <span className="font-bold text-slate-800">{viewingUser.experienceYears || 0} Years</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Shift</span>
                      <span className="font-bold text-slate-800">{viewingUser.availability || 'Morning'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Expected Salary</span>
                      <span className="font-bold text-blue-600">Rs. {Number(viewingUser.expectedSalary || 35000).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Email Address (Admin view)</span>
                      <span className="font-semibold text-slate-800 truncate block">{viewingUser.email}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Phone Number (Admin view)</span>
                      <span className="font-semibold text-slate-800">{viewingUser.phone || '03001234567'}</span>
                    </div>
                  </div>

                  {viewingUser.aboutMe && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">About Me</span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {viewingUser.aboutMe.replace(/<!--TC_META:[\s\S]*?-->/g, '').trim() || 'Dedicated educator passionate about student success.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  setDeletingUser(target);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSuspendUser(viewingUser.id)}
                  className={`
                    text-xs px-3.5 py-2 rounded-xl border font-semibold transition-colors cursor-pointer
                    ${viewingUser.status === 'active' 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }
                  `.trim()}
                >
                  {viewingUser.status === 'active' ? 'Suspend' : 'Restore'}
                </button>

                <Button variant="outline" size="sm" onClick={() => setViewingUser(null)} className="text-xs px-4">
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. Detailed Contact Request Inspector Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      selectedRequest.status === 'accepted' ? 'success' : 
                      selectedRequest.status === 'declined' ? 'neutral' : 'warning'
                    }
                    size="sm"
                  >
                    {selectedRequest.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">Request Sent {selectedRequest.date}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                  Contact Request Inspection
                </h3>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* School & Teacher Side-by-side Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sender School Box */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Sender School</span>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedRequest.schoolName}</h4>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Person: <strong>{selectedRequest.contactPerson}</strong></span>
                  </div>
                  {selectedRequest.schoolPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone: <strong>{selectedRequest.schoolPhone}</strong></span>
                    </div>
                  )}
                  {selectedRequest.schoolEmail && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Email: {selectedRequest.schoolEmail}</span>
                    </div>
                  )}
                  {selectedRequest.schoolLocation && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRequest.schoolLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Teacher Box */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Recipient Teacher</span>
                      <h4 className="font-bold text-slate-900 text-sm">{selectedRequest.teacherName}</h4>
                    </div>
                  </div>

                  {selectedRequest.teacherSlug && (
                    <Link
                      href={`/teacher/${selectedRequest.teacherSlug}`}
                      target="_blank"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200"
                    >
                      <span>Card</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Education: <strong>{selectedRequest.teacherEducation}</strong></span>
                  </div>
                  {selectedRequest.teacherLocation && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Location: {selectedRequest.teacherLocation}</span>
                    </div>
                  )}
                  {selectedRequest.teacherPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Registered Phone: {selectedRequest.teacherPhone}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Requirement Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Hiring Vacancy &amp; Message
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Subject / Requirement:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedRequest.requirement}
                </span>
              </div>
              {selectedRequest.message ? (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block text-[11px] mb-0.5">School&apos;s Message:</span>
                  <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedRequest.message}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No additional note provided by the school.</p>
              )}
            </div>

            {/* Teacher Response Status */}
            {selectedRequest.status === 'accepted' ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900">
                    Teacher Accepted Contact Request {selectedRequest.respondedAt ? `on ${selectedRequest.respondedAt}` : ''}
                  </span>
                </div>
                {(selectedRequest.sharedWhatsApp || selectedRequest.sharedPhone) && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Shared Contact Number:</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {selectedRequest.sharedWhatsApp || selectedRequest.sharedPhone}
                    </span>
                  </div>
                )}
                {selectedRequest.teacherResponseNote && (
                  <p className="text-emerald-800 text-xs italic">
                    Teacher&apos;s Note: &ldquo;{selectedRequest.teacherResponseNote}&rdquo;
                  </p>
                )}
              </div>
            ) : selectedRequest.status === 'declined' ? (
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Request Declined</span>
                <span>The teacher chose to decline this recruitment contact opportunity.</span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Pending teacher review. The teacher has received notification on their dashboard.
                </span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingRequest(selectedRequest)}
                icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
              >
                Delete Request
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedRequest(null)}
                className="text-xs px-5"
              >
                Close Inspector
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete {deletingUser.role}?
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900">{deletingUser.name}</strong>? This will remove all associated database records, relations, and profile cards permanently.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white border-none shadow-md shadow-red-500/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Contact Request Confirmation Modal */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete Contact Request?
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Are you sure you want to permanently delete the contact request from <strong className="text-slate-900">{deletingRequest.schoolName}</strong> to <strong className="text-slate-900">{deletingRequest.teacherName}</strong>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Permanent Removal:</span>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                This request will be permanently removed from both the school&apos;s sent requests dashboard and the teacher&apos;s inquiry list.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeletingRequest(null)}
                disabled={isDeletingRequest}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={confirmDeleteRequest}
                disabled={isDeletingRequest}
                className="text-xs bg-red-600 hover:bg-red-700 text-white border-none shadow-md shadow-red-500/20"
              >
                {isDeletingRequest ? 'Deleting...' : 'Delete Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

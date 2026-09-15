'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Banknote, 
  ArrowLeft, 
  Send, 
  Bookmark, 
  BookmarkCheck,
  ShieldCheck, 
  Building2, 
  Award, 
  Share2,
  Calendar,
  Sparkles,
  BookOpen,
  Edit3,
  LayoutDashboard,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ContactRequestModal } from '@/components/contact/ContactRequestModal';
import { getCardDraft } from '@/lib/cardBuilderStorage';
import { useAuth } from '@/hooks/useAuth';

import { getTeacherBySlug } from '@/services/teacherService';
import { recordProfileView, toggleShortlist, isTeacherShortlisted } from '@/lib/analyticsTracker';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { user, profile, role } = useAuth();

  const [teacher, setTeacher] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTeacher() {
      setIsLoading(true);
      try {
        const liveTeacher = await getTeacherBySlug(slug);
        if (liveTeacher) {
          if (liveTeacher.isSuspended) {
            setTeacher({
              fullName: liveTeacher.fullName,
              isSuspended: true,
            });
            return;
          }
          const teacherObj = {
            ...liveTeacher,
            area: liveTeacher.location?.area || 'Malir',
            city: liveTeacher.location?.city || 'Karachi',
            district: liveTeacher.location?.district || 'Malir',
            teachingSkills: liveTeacher.skills && liveTeacher.skills.length > 0 
              ? liveTeacher.skills 
              : ['Classroom Management', 'Lesson Planning', 'Student Assessment', 'Board Exam Preparation'],
          };
          setTeacher(teacherObj);
          setIsShortlisted(isTeacherShortlisted(liveTeacher.id || slug));
          recordProfileView(slug);
          return;
        }
      } catch (e) {
        console.error('Failed to load live teacher by slug:', e);
      } finally {
        setIsLoading(false);
      }

      // Check local draft preview fallback
      const draft = getCardDraft();
      if (draft && draft.fullName && (draft.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(slug.split('-')[0]) || slug === 'preview')) {
        if (draft.moderationStatus === 'suspended') {
          setTeacher({
            fullName: draft.fullName,
            isSuspended: true,
          });
          return;
        }
        const draftObj = {
          fullName: draft.fullName,
          avatarUrl: draft.profilePhotoUrl || '',
          highestEducation: draft.highestEducation || 'B.Ed | M.A English',
          institution: draft.institution || 'University of Karachi',
          additionalQualifications: draft.additionalQualifications || 'Certified Educator',
          subjects: draft.subjects && draft.subjects.length > 0 ? draft.subjects : ['English', 'Urdu'],
          classes: draft.classes || '6 - 10',
          experienceYears: draft.experienceYears || 3,
          availability: draft.availability || 'Morning',
          availableFrom: draft.availableFrom || 'Immediately',
          city: draft.city || 'Karachi',
          district: draft.district || 'Malir',
          area: draft.area || 'Malir',
          expectedSalary: draft.expectedSalary || 35000,
          aboutMe: draft.aboutMe || 'Dedicated and passionate teacher creating an engaging and interactive learning environment for students.',
          teachingSkills: draft.teachingSkills && draft.teachingSkills.length > 0 ? draft.teachingSkills : ['Classroom Management', 'Lesson Planning', 'Board Exam Preparation'],
          isVerified: true,
        };
        setTeacher(draftObj);
        setIsShortlisted(isTeacherShortlisted(slug));
        recordProfileView(slug);
      } else {
        setTeacher(null);
      }
    }
    loadTeacher();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading Teacher Profile...</p>
        </div>
      </div>
    );
  }

  if (teacher?.isSuspended) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Profile Suspended</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This teacher profile ({teacher.fullName}) has been suspended by platform administration and is not available for contact or recruitment.
          </p>
          <Button variant="primary" size="sm" href="/teachers" fullWidth>
            Browse Active Teachers
          </Button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Educator Profile Not Found</h2>
          <p className="text-xs text-slate-500">
            The educator profile you are looking for is either not published, suspended, or does not exist.
          </p>
          <Button variant="primary" size="sm" href="/teachers" fullWidth>
            Browse Available Teachers
          </Button>
        </div>
      </div>
    );
  }

  const formattedSalary = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(teacher.expectedSalary);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const cleanTeacherSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const userFullSlug = profile?.full_name ? profile.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const draft = typeof window !== 'undefined' ? getCardDraft() : null;
  const draftSlug = draft?.fullName ? draft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';

  const isOwnProfile = Boolean(
    slug === 'preview' ||
    (role === 'teacher' && (
      (profile?.teacher_slug && profile.teacher_slug === slug) ||
      (userFullSlug && (cleanTeacherSlug.includes(userFullSlug) || userFullSlug.includes(cleanTeacherSlug))) ||
      (teacher?.fullName && profile?.full_name && teacher.fullName.toLowerCase().trim() === profile.full_name.toLowerCase().trim()) ||
      (teacher?.email && profile?.email && teacher.email.toLowerCase().trim() === profile.email.toLowerCase().trim()) ||
      (teacher?.user_id && user?.id && teacher.user_id === user.id)
    )) ||
    (draftSlug && (cleanTeacherSlug.includes(draftSlug) || draftSlug.includes(cleanTeacherSlug))) ||
    (teacher?.fullName && draft?.fullName && teacher.fullName.toLowerCase().trim() === draft.fullName.toLowerCase().trim())
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation / Back Bar */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-600 hover:text-slate-900"
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              icon={<Share2 className="w-4 h-4" />}
            >
              {copiedLink ? 'Link Copied!' : 'Share Profile'}
            </Button>
            
            {!isOwnProfile && role !== 'teacher' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsContactModalOpen(true)}
                icon={<Send className="w-4 h-4" />}
                className="shadow-sm font-semibold"
              >
                Contact Teacher
              </Button>
            )}
          </div>
        </div>

        {/* Main Profile Card Container (Matching Wireframe 4 & 8) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          
          {/* Header Hero Section */}
          <div className="p-6 sm:p-10 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative bg-gradient-to-b from-blue-50/40 via-white to-white">
            
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-blue-50 border-4 border-white shadow-md shrink-0">
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.profile-initials-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="profile-initials-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-3xl"
                style={{ display: teacher.avatarUrl ? 'none' : 'flex' }}
              >
                {teacher.fullName ? teacher.fullName.slice(0, 2).toUpperCase() : 'TC'}
              </div>
            </div>

            {/* Teacher Header Information */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {teacher.fullName}
                  </h1>
                  {teacher.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" aria-label="Verified Profile" />
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 mx-auto sm:mx-0 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available for Hire
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{teacher.highestEducation}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {teacher.experienceYears} Years Experience
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {teacher.area}, {teacher.city}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/60 border-b border-slate-100 p-4 sm:p-6 text-center">
            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Teaching Subjects
              </span>
              <span className="text-sm font-bold text-slate-800">
                {teacher.subjects?.join(', ')}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Class Levels
              </span>
              <span className="text-sm font-bold text-slate-800">
                {teacher.classes}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Availability
              </span>
              <span className="text-sm font-bold text-slate-800">
                {teacher.availability}
              </span>
            </div>

            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Expected Salary
              </span>
              <span className="text-sm font-bold text-blue-700">
                {formattedSalary}
              </span>
            </div>
          </div>

          {/* Body Information Sections */}
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* About Me Section */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>About Me</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
                {teacher.aboutMe}
              </p>
            </div>

            {/* Education & Qualifications */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Education &amp; Qualifications</span>
              </h2>
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{teacher.highestEducation}</span>
                  <Badge variant="primary" size="sm">Completed</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{teacher.institution}</span>
                </div>
                {teacher.additionalQualifications && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Additional: {teacher.additionalQualifications}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teaching Skills */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Key Teaching Skills</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {(teacher.teachingSkills || []).map((skill: string) => (
                  <Badge key={skill} variant="neutral" size="md" className="py-1.5 px-3 text-xs bg-slate-100 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Availability & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Teaching Shifts
                </span>
                <p className="text-slate-600">Preferred Shift: <strong>{teacher.availability}</strong></p>
                <p className="text-slate-500 text-[11px]">Joining: Available {teacher.availableFrom}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Preferred Location
                </span>
                <p className="text-slate-600">Area: <strong>{teacher.area}, {teacher.city}</strong></p>
                <p className="text-slate-500 text-[11px]">District: {teacher.district}</p>
              </div>
            </div>

            {/* Privacy callout banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">
                  {isOwnProfile ? 'Your Contact Privacy is Protected' : 'Contact Privacy Notice'}
                </span>
                <p className="text-blue-800/90 text-[11px] leading-relaxed">
                  {isOwnProfile 
                    ? 'Your phone and WhatsApp numbers are never exposed publicly. Schools must submit an official recruitment request, and you decide whether to accept and connect directly.'
                    : 'Teacher contact numbers are protected. Sending a contact request notifies the teacher directly. Once accepted, both parties can communicate and arrange recruitment interviews.'
                  }
                </p>
              </div>
            </div>

            {/* Action Bar for Schools */}
            {!isOwnProfile && role !== 'teacher' && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = toggleShortlist(teacher);
                    setIsShortlisted(nextState);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all w-full sm:w-auto justify-center cursor-pointer
                    ${isShortlisted 
                      ? 'bg-amber-50 text-amber-800 border-amber-300' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }
                  `.trim()}
                >
                  {isShortlisted ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span>Shortlisted for School</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      <span>Shortlist Teacher</span>
                    </>
                  )}
                </button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsContactModalOpen(true)}
                  icon={<Send className="w-4 h-4" />}
                  className="w-full sm:w-auto px-8 font-bold shadow-md shadow-blue-500/20"
                >
                  Contact Teacher
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Platform Contact Request Modal (Only rendered when open for schools) */}
      {!isOwnProfile && (
        <ContactRequestModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          teacherName={teacher.fullName}
          teacherSlug={slug}
        />
      )}
    </div>
  );
}

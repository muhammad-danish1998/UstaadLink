'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Banknote,
  Send,
  Eye,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatLocation } from '@/lib/malirLocations';

export interface TeacherCardData {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl?: string;
  highestEducation: string;
  subjects: string[];
  classes: string;
  experienceYears: number;
  availability: 'Morning' | 'Evening' | 'Both';
  location: {
    area: string;
    district: string;
    city: string;
    town?: string;
    uc?: string;
  };
  expectedSalary: number;
  isVerified?: boolean;
  matchPercentage?: number;
}

interface TeacherCardProps {
  teacher: TeacherCardData;
  onContactClick?: (teacher: TeacherCardData) => void;
  showMatch?: boolean;
  isOwnCard?: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  onContactClick,
  showMatch = false,
  isOwnCard = false,
}) => {
  const formattedSalary = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(teacher.expectedSalary);

  const displayLocation = formatLocation(
    teacher.location.uc,
    teacher.location.town || teacher.location.area,
    teacher.location.district || 'Malir'
  );

  return (
    <article className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md hover:shadow-2xl hover:border-blue-400/80 hover:-translate-y-1.5 transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden h-full">
      {/* Top Gradient Hover Accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Main Content Section */}
      <div className="space-y-5">
        
        {/* Header: Status Pills */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Available for Hire</span>
          </span>

          {showMatch && teacher.matchPercentage && (
            <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-xl">
              {teacher.matchPercentage}% Match
            </span>
          )}
        </div>

        {/* Profile Info: Avatar + Name + Degree */}
        <div className="flex items-center gap-4 sm:gap-5 pt-1">
          {/* Large Avatar */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200/90 shadow-md shrink-0">
            {teacher.avatarUrl ? (
              <img
                src={teacher.avatarUrl}
                alt={teacher.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.initials-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div 
              className="initials-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-black text-2xl sm:text-3xl tracking-tight"
              style={{ display: teacher.avatarUrl ? 'none' : 'flex' }}
            >
              {teacher.fullName ? teacher.fullName.slice(0, 2).toUpperCase() : 'TC'}
            </div>
          </div>

          {/* Teacher Name & Education */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Link 
                href={`/teacher/${teacher.slug}`}
                className="font-black text-slate-900 text-xl sm:text-2xl group-hover:text-blue-600 transition-colors tracking-tight truncate block"
                title={teacher.fullName}
              >
                {teacher.fullName}
              </Link>
              {teacher.isVerified && (
                <span title="Verified Profile">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                </span>
              )}
            </div>

            <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-semibold">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate block" title={teacher.highestEducation}>
                {teacher.highestEducation}
              </span>
            </div>
          </div>
        </div>

        {/* Subjects & Class Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {teacher.subjects.map((subj) => (
            <span
              key={subj}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
            >
              {subj}
            </span>
          ))}
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
            Class {teacher.classes}
          </span>
        </div>

        {/* Structured Details Matrix */}
        <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
          
          {/* Experience */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
              <Briefcase className="w-4 h-4 text-blue-600/80 shrink-0" />
              <span>Teaching Experience:</span>
            </span>
            <span className="font-extrabold text-slate-900 text-right">
              {teacher.experienceYears} {teacher.experienceYears === 1 ? 'Year' : 'Years'}
            </span>
          </div>

          {/* Shift */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
              <Clock className="w-4 h-4 text-blue-600/80 shrink-0" />
              <span>Availability / Shift:</span>
            </span>
            <span className="font-extrabold text-slate-900 text-right">
              {teacher.availability} Shift
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
              <MapPin className="w-4 h-4 text-blue-600/80 shrink-0" />
              <span>Location:</span>
            </span>
            <span className="font-extrabold text-slate-900 text-right truncate max-w-[190px] sm:max-w-[240px]" title={displayLocation}>
              {displayLocation}
            </span>
          </div>

          {/* Expected Salary Banner */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
            <span className="flex items-center gap-2 text-slate-700 font-bold shrink-0">
              <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Expected Salary:</span>
            </span>
            <span className="font-black text-blue-700 text-base sm:text-lg text-right">
              {formattedSalary}
            </span>
          </div>

        </div>

      </div>

      {/* Action Buttons Footer */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 pt-2">
        <Button
          variant="outline"
          size="lg"
          href={`/teacher/${teacher.slug}`}
          className="w-full text-xs sm:text-sm font-bold rounded-2xl h-12 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          View Profile
        </Button>

        {isOwnCard ? (
          <Button
            variant="primary"
            size="lg"
            href="/create-card/step-1"
            className="w-full text-xs sm:text-sm font-black rounded-2xl h-12 shadow-lg shadow-blue-500/20"
          >
            Edit Profile
          </Button>
        ) : onContactClick ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => onContactClick(teacher)}
            icon={<Send className="w-4 h-4" />}
            className="w-full text-xs sm:text-sm font-black rounded-2xl h-12 shadow-lg shadow-blue-500/20"
          >
            Contact Teacher
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            href={`/teacher/${teacher.slug}`}
            icon={<Send className="w-4 h-4" />}
            className="w-full text-xs sm:text-sm font-black rounded-2xl h-12 shadow-lg shadow-blue-500/20"
          >
            Contact Teacher
          </Button>
        )}
      </div>
    </article>
  );
};

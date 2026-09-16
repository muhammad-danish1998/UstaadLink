'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TeacherCard, TeacherCardData } from '@/components/teacher/TeacherCard';
import { ContactRequestModal } from '@/components/contact/ContactRequestModal';
import { getPublishedTeachers } from '@/services/teacherService';
import { useAuth } from '@/hooks/useAuth';

interface FeaturedTeachersSectionProps {
  initialTeachers?: TeacherCardData[];
}

export const FeaturedTeachersSection: React.FC<FeaturedTeachersSectionProps> = ({
  initialTeachers = [],
}) => {
  const { user, profile, role } = useAuth();
  const [teachers, setTeachers] = useState<TeacherCardData[]>(initialTeachers);
  const [isLoading, setIsLoading] = useState<boolean>(initialTeachers.length === 0);
  const [selectedTeacherForContact, setSelectedTeacherForContact] = useState<TeacherCardData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTeachers() {
      try {
        const liveTeachers = await getPublishedTeachers();
        if (isMounted && liveTeachers) {
          setTeachers(liveTeachers);
        }
      } catch (err) {
        console.error('Failed to load featured teachers:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            Featured Educator Profiles
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            Explore Available Teachers
          </p>
          <p className="text-slate-600 text-sm mt-1">
            Browse verified profiles of educators ready for new teaching positions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          href="/teachers"
          icon={<ArrowRight className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          View All Teachers
        </Button>
      </div>

      {/* Teacher Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 animate-pulse space-y-5 shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
              <div className="space-y-3 py-4 border-y border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-11 bg-slate-200 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.slice(0, 4).map((teacher) => {
            const isOwnCard = Boolean(
              user &&
              role === 'teacher' &&
              ((profile?.full_name && teacher.fullName?.toLowerCase() === profile.full_name.toLowerCase()) ||
                teacher.id === user.id ||
                teacher.slug === user.id)
            );

            return (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                showMatch
                isOwnCard={isOwnCard}
                onContactClick={(t) => setSelectedTeacherForContact(t)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Educator Profiles Published Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Be the first educator to create and publish a profile on UstaadLink.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            href="/register/teacher"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Your Profile
          </Button>
        </div>
      )}

      {/* Contact Request Modal */}
      {selectedTeacherForContact && (
        <ContactRequestModal
          isOpen={!!selectedTeacherForContact}
          onClose={() => setSelectedTeacherForContact(null)}
          teacherName={selectedTeacherForContact.fullName}
          teacherSlug={selectedTeacherForContact.slug}
        />
      )}
    </section>
  );
};

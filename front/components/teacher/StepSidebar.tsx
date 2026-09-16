'use client';

import React from 'react';
import Link from 'next/link';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  MapPin, 
  Banknote, 
  FileCheck, 
  CheckCircle2,
  Edit3,
  ChevronRight
} from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  href: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const cardSteps: StepItem[] = [
  { id: 1, label: 'Basic Info', desc: 'Name, photo & contact', href: '/create-card/step-1', icon: User },
  { id: 2, label: 'Education', desc: 'Degrees & institutions', href: '/create-card/step-2', icon: GraduationCap },
  { id: 3, label: 'Teaching Details', desc: 'Subjects, classes & experience', href: '/create-card/step-3', icon: BookOpen },
  { id: 4, label: 'Mode & Location', desc: 'District, area & shifts', href: '/create-card/step-4', icon: MapPin },
  { id: 5, label: 'Expected Salary', desc: 'Monthly salary & hourly fees', href: '/create-card/step-5', icon: Banknote },
  { id: 6, label: 'Review Profile', desc: 'Live card preview', href: '/create-card/step-6', icon: FileCheck },
  { id: 7, label: 'Finish & Publish', desc: 'Publish to directory', href: '/create-card/step-7', icon: CheckCircle2 },
];

interface StepSidebarProps {
  currentStep: number;
}

export const StepSidebar: React.FC<StepSidebarProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Profile Creation Progress" className="w-full">
      <ul className="space-y-1.5 sm:space-y-2">
        {cardSteps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const Icon = step.icon;

          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all group cursor-pointer border
                  ${isCurrent 
                    ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-sm shadow-blue-500/20' 
                    : isCompleted 
                    ? 'text-slate-800 bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/80 hover:border-emerald-300' 
                    : 'text-slate-600 bg-white border-slate-200/70 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-200'
                  }
                `.trim()}
                title={`Click to open and edit Step ${step.id}: ${step.label}`}
              >
                <div
                  className={`
                    w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs transition-colors
                    ${isCurrent 
                      ? 'bg-white/20 text-white' 
                      : isCompleted 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }
                  `.trim()}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-bold">
                      {step.id}. {step.label}
                    </span>
                    {!isCurrent && (
                      <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                  <span className={`text-[10px] block truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    {step.desc}
                  </span>
                </div>

                {isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

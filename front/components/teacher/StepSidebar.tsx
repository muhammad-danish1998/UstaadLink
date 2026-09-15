import React from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  MapPin, 
  Banknote, 
  FileCheck, 
  CheckCircle2 
} from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const cardSteps: StepItem[] = [
  { id: 1, label: 'Basic Info', href: '/create-card/step-1', icon: User },
  { id: 2, label: 'Education', href: '/create-card/step-2', icon: GraduationCap },
  { id: 3, label: 'Teaching Details', href: '/create-card/step-3', icon: BookOpen },
  { id: 4, label: 'Location & Availability', href: '/create-card/step-4', icon: MapPin },
  { id: 5, label: 'Expected Salary', href: '/create-card/step-5', icon: Banknote },
  { id: 6, label: 'Review Profile', href: '/create-card/step-6', icon: FileCheck },
  { id: 7, label: 'Finish & Publish', href: '/create-card/step-7', icon: CheckCircle2 },
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
              <div
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all
                  ${isCurrent 
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-xs' 
                    : isCompleted 
                    ? 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }
                `.trim()}
              >
                <div
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs
                    ${isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 text-slate-500'
                    }
                  `.trim()}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <span className="truncate">{step.label}</span>

                {isCurrent && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

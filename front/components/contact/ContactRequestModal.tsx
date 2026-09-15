'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  Send, 
  School, 
  User, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Phone, 
  Mail, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Clock, 
  ExternalLink,
  Layers,
  Plus,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { submitContactRequest, checkExistingContactRequest } from '@/services/teacherService';
import { isValidEmail, isValidPakistaniPhone, sanitizeInput, normalizePhoneNumber } from '@/lib/security';

interface ContactRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  teacherSlug: string;
}

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English Language',
  'English Literature',
  'Urdu',
  'General Science',
  'Islamiat',
  'Pakistan Studies',
  'Commerce',
  'Accounting',
  'Economics',
  'Social Studies',
  'Sindhi',
];

const GRADE_OPTIONS = [
  { value: 'Pre-Primary / Kindergarten (Nursery - KG)', label: 'Pre-Primary / Kindergarten (Nursery - KG)' },
  { value: 'Primary (Class 1 - 5)', label: 'Primary (Class 1 - 5)' },
  { value: 'Middle (Class 6 - 8)', label: 'Middle (Class 6 - 8)' },
  { value: 'Secondary (Class 9 - 10 / Matric)', label: 'Secondary (Class 9 - 10 / Matric)' },
  { value: 'Higher Secondary (Class 11 - 12 / Inter)', label: 'Higher Secondary (Class 11 - 12 / Inter)' },
  { value: 'O-Level (Cambridge)', label: 'O-Level (Cambridge)' },
  { value: 'A-Level (Cambridge)', label: 'A-Level (Cambridge)' },
  { value: 'All Grades / Multiple Grades', label: 'All Grades / Flexible' },
];

export const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  teacherSlug,
}) => {
  const { user, profile, role } = useAuth();
  
  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    email: '',
    phone: '',
    selectedGrade: 'Secondary (Class 9 - 10 / Matric)',
    message: '',
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string>('pending');
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSchool = user && role === 'school';

  useEffect(() => {
    if (isSchool) {
      const sName = profile?.full_name || '';
      setFormData((prev) => ({
        ...prev,
        schoolName: prev.schoolName || sName,
        contactPerson: prev.contactPerson || sName,
        email: prev.email || profile?.email || user?.email || '',
        phone: prev.phone || profile?.phone || '',
      }));

      // Check for duplicate request
      async function checkDuplicate() {
        setIsCheckingDuplicate(true);
        try {
          const res = await checkExistingContactRequest(teacherSlug, sName);
          if (res.hasActiveRequest) {
            setHasExistingRequest(true);
            setExistingStatus(res.existingStatus || 'pending');
          } else {
            setHasExistingRequest(false);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }
      checkDuplicate();
    }
  }, [user, profile, role, isSchool, teacherSlug]);

  if (!isOpen) return null;

  const toggleSubject = (subj: string) => {
    setSelectedSubjects((prev) => {
      const exists = prev.includes(subj);
      const updated = exists ? prev.filter((s) => s !== subj) : [...prev, subj];
      if (errors.subjects && updated.length > 0) {
        setErrors((errs) => ({ ...errs, subjects: '' }));
      }
      return updated;
    });
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
      setCustomSubjectInput('');
      setShowCustomInput(false);
      if (errors.subjects) {
        setErrors((errs) => ({ ...errs, subjects: '' }));
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.schoolName.trim()) {
      errs.schoolName = 'School Name is required';
    } else if (formData.schoolName.trim().length < 2) {
      errs.schoolName = 'School Name must be at least 2 characters';
    }

    if (!formData.contactPerson.trim()) {
      errs.contactPerson = 'Contact Person Name is required';
    } else if (formData.contactPerson.trim().length < 2) {
      errs.contactPerson = 'Contact Person Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Official School Email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'School Contact / WhatsApp number is required';
    } else if (!isValidPakistaniPhone(formData.phone)) {
      errs.phone = 'Please enter a valid Pakistani phone number (e.g. 03001234567 or 02134567890)';
    }

    if (selectedSubjects.length === 0) {
      errs.subjects = 'Please select at least one required subject';
    }

    if (!formData.selectedGrade.trim()) {
      errs.selectedGrade = 'Please select target grade level';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanSchoolName = sanitizeInput(formData.schoolName.trim());
      const cleanContactPerson = sanitizeInput(formData.contactPerson.trim());
      const cleanEmail = sanitizeInput(formData.email.trim().toLowerCase());
      const cleanPhone = normalizePhoneNumber(formData.phone);
      const subjectsFormatted = selectedSubjects.join(', ');
      const gradeFormatted = formData.selectedGrade;
      const cleanMessage = formData.message ? sanitizeInput(formData.message.trim()) : '';

      const requirementString = `Subjects: ${subjectsFormatted} | Grade: ${gradeFormatted} (Contact: ${cleanPhone}, Email: ${cleanEmail})`;

      const res = await submitContactRequest({
        teacherSlug,
        schoolName: cleanSchoolName,
        contactPerson: cleanContactPerson,
        requirement: requirementString,
        message: cleanMessage,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        if (res.isDuplicate) {
          setHasExistingRequest(true);
        }
        setErrors({ form: res.error || 'Failed to send contact request' });
      }
    } catch (err: any) {
      console.error(err);
      setErrors({ form: 'An error occurred while sending your request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              !isSchool ? 'bg-emerald-100 text-emerald-700' : hasExistingRequest ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {!isSchool ? <School className="w-5 h-5" /> : hasExistingRequest ? <Clock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {!isSchool 
                  ? 'School Registration Required' 
                  : hasExistingRequest 
                  ? 'Request Already Sent' 
                  : 'Send Contact Request'
                }
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-xs">
                To: <span className="font-semibold text-blue-600">{teacherName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1">
          {!isSchool ? (
            /* 1. GUEST / UNREGISTERED USER PROMPT */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900">
                  Register Your School to Contact Teachers
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  To protect teacher safety and ensure genuine recruitment opportunities, contact requests can only be sent by registered school administrators.
                </p>
              </div>

              {/* Value Points */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100% Free Platform:</strong> Zero commission or hiring fees</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Direct Calling:</strong> Teachers view your official phone number to call you directly</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>School Dashboard:</strong> Track candidate status and shortlisted teachers</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  href={`/register/school?redirect=/teacher/${teacherSlug}`}
                  icon={<UserPlus className="w-4 h-4" />}
                  className="shadow-md shadow-emerald-600/20"
                >
                  Register Free School Account (1 min)
                </Button>

                <div className="text-center pt-1">
                  <span className="text-xs text-slate-500">
                    Already have an official school account?{' '}
                    <Link
                      href={`/login?redirect=/teacher/${teacherSlug}`}
                      className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Log in here</span>
                      <LogIn className="w-3.5 h-3.5" />
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          ) : hasExistingRequest ? (
            /* 2. DUPLICATE PREVENTION STATE: REQUEST ALREADY SENT */
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">
                  You Have Already Contacted This Teacher
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  An active recruitment request has already been sent to <strong>{teacherName}</strong> (Status: <span className="font-bold capitalize text-amber-700">{existingStatus}</span>). Duplicate requests cannot be sent to the same teacher.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 text-left space-y-1">
                <p className="font-bold">What happens next?</p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  The teacher has received your school contact details on their dashboard and can review your requirements and phone number to call you directly.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  fullWidth
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  href="/school/dashboard"
                  icon={<ExternalLink className="w-4 h-4" />}
                  fullWidth
                >
                  View in Dashboard
                </Button>
              </div>
            </div>
          ) : isSuccess ? (
            /* 3. SUCCESS STATE */
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">Request Sent Successfully!</h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your recruitment inquiry has been forwarded to <strong>{teacherName}</strong>. The teacher can review your subject/grade requirements on their dashboard and call your official number directly.
                </p>
              </div>
              <div className="pt-3">
                <Button variant="primary" size="md" onClick={onClose} fullWidth>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* 4. ACTIVE FORM FOR REGISTERED SCHOOL */
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Sending as registered school: <strong>{profile?.full_name || formData.schoolName || 'Verified School'}</strong></span>
              </div>

              {errors.form && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* School Name */}
              <Input
                label="School / Campus Name"
                placeholder="e.g. City Grammar School"
                icon={<School className="w-4 h-4" />}
                value={formData.schoolName}
                onChange={(e) => {
                  setFormData({ ...formData, schoolName: e.target.value });
                  if (errors.schoolName) setErrors({ ...errors, schoolName: '' });
                }}
                error={errors.schoolName}
                required
              />

              {/* Contact Person */}
              <Input
                label="Contact Person &amp; Designation"
                placeholder="e.g. Mrs. Farhana (Principal / Administrator)"
                icon={<User className="w-4 h-4" />}
                value={formData.contactPerson}
                onChange={(e) => {
                  setFormData({ ...formData, contactPerson: e.target.value });
                  if (errors.contactPerson) setErrors({ ...errors, contactPerson: '' });
                }}
                error={errors.contactPerson}
                required
              />

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Official School Email"
                  type="email"
                  placeholder="admin@school.edu.pk"
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  error={errors.email}
                  required
                />

                <Input
                  label="School Contact / WhatsApp"
                  placeholder="03001234567"
                  icon={<Phone className="w-4 h-4" />}
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  error={errors.phone}
                  required
                />
              </div>

              {/* SEPARATE SUBJECTS SELECTION (MULTI-SELECT) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Required Subjects <span className="text-red-500">*</span>{' '}
                    <span className="text-slate-400 font-normal">
                      (Select one or multiple)
                    </span>
                  </label>
                  {selectedSubjects.length > 0 && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {selectedSubjects.length} selected
                    </span>
                  )}
                </div>

                {/* Subject Selection Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                  {AVAILABLE_SUBJECTS.map((subj) => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer
                          ${isSelected
                            ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                  
                  {/* Any custom subjects added */}
                  {selectedSubjects
                    .filter((s) => !AVAILABLE_SUBJECTS.includes(s))
                    .map((custom) => (
                      <button
                        key={custom}
                        type="button"
                        onClick={() => toggleSubject(custom)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{custom}</span>
                        <X className="w-3 h-3 hover:text-red-200" />
                      </button>
                    ))}
                </div>

                {/* Add Custom Subject Option */}
                {showCustomInput ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Type custom subject name..."
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSubject();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddCustomSubject}
                      className="text-xs"
                    >
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors pt-0.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add other subject</span>
                  </button>
                )}

                {errors.subjects && (
                  <p className="text-xs text-red-600 font-medium">{errors.subjects}</p>
                )}
              </div>

              {/* SEPARATE GRADE / CLASS LEVEL DROPDOWN */}
              <div className="pt-1">
                <Select
                  label="Target Grade / Class Level"
                  options={GRADE_OPTIONS}
                  value={formData.selectedGrade}
                  onChange={(e) => {
                    setFormData({ ...formData, selectedGrade: e.target.value });
                    if (errors.selectedGrade) setErrors({ ...errors, selectedGrade: '' });
                  }}
                  icon={<Layers className="w-4 h-4" />}
                  error={errors.selectedGrade}
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Message / Interview Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Include shift timings, campus location, or interview details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  fullWidth
                  className="font-bold shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Contact Request'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

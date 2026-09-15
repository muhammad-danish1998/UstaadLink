'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LogOut, ChevronDown } from 'lucide-react';
import { AuthProfile } from '@/hooks/useAuth';
import { UserRole } from '@/types/database';

interface UserDropdownProps {
  profile: AuthProfile | null;
  role: UserRole | null;
  avatarUrl: string | null;
  email?: string;
  onSignOut: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  profile,
  role,
  avatarUrl,
  email,
  onSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullName = profile?.full_name || email?.split('@')[0] || 'User';
  const displayRole = role || 'teacher';
  const initials = fullName.slice(0, 2).toUpperCase();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'teacher':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Teacher</span>;
      case 'school':
        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">School</span>;
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">User</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Avatar + Name + Dropdown Arrow */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/90 transition-all border border-slate-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
        aria-expanded={isOpen}
        aria-label="User profile menu"
      >
        {/* Avatar / Profile Icon */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              sizes="32px"
              unoptimized={true}
              className="object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* User Name & Chevron */}
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[110px] truncate">
            {fullName}
          </span>
          <span className="text-[10px] font-medium text-slate-500 capitalize">
            {displayRole}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Card inside Dropdown */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-sm flex items-center justify-center border-2 border-blue-100 shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  fill
                  sizes="40px"
                  unoptimized={true}
                  className="object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {fullName}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {email || profile?.email}
              </p>
              <div className="mt-1">
                {getRoleBadge(displayRole as UserRole)}
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2 mt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-sm font-semibold text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

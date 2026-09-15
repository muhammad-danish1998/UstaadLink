'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  Menu, 
  X, 
  Search, 
  UserPlus, 
  LogIn, 
  LogOut, 
  School, 
  LayoutDashboard, 
  UserCheck, 
  User,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { UserDropdown } from '@/components/layout/UserDropdown';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, role, avatarUrl, loading, signOut } = useAuth();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Slogan */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Image 
                src="/favicon.svg" 
                alt="UstaadLink Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                UstaadLink
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-slate-500 tracking-normal">
                Connecting Teachers with Schools
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/teachers"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-400" />
              Find Teachers
            </Link>
            <Link
              href="/#how-it-works"
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  const el = document.getElementById('how-it-works');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#how-it-works');
                  }
                }
              }}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              How It Works
            </Link>
            <Link
              href="/#why-us"
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  const el = document.getElementById('why-us');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#why-us');
                  }
                }
              }}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Why UstaadLink
            </Link>
          </nav>

          {/* Desktop Auth & Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {loading ? (
              <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
            ) : user ? (
              /* LOGGED IN USER STATE */
              <div className="flex items-center gap-3">
                {role === 'teacher' && (
                  <Button
                    variant="outline"
                    size="sm"
                    href="/teacher/dashboard"
                    icon={<LayoutDashboard className="w-4 h-4 text-blue-600" />}
                  >
                    Dashboard
                  </Button>
                )}

                {role === 'school' && (
                  <Button
                    variant="outline"
                    size="sm"
                    href="/school/dashboard"
                    icon={<LayoutDashboard className="w-4 h-4 text-emerald-600" />}
                  >
                    School Dashboard
                  </Button>
                )}

                {role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    href="/admin"
                    icon={<ShieldAlert className="w-4 h-4 text-purple-600" />}
                  >
                    Admin Panel
                  </Button>
                )}

                {/* Profile Icon with Dropdown Menu & Logout */}
                <UserDropdown
                  profile={profile}
                  role={role}
                  avatarUrl={avatarUrl}
                  email={user.email}
                  onSignOut={handleLogout}
                />
              </div>
            ) : (
              /* GUEST / LOGGED OUT ACTIONS */
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  href="/login"
                  icon={<LogIn className="w-4 h-4" />}
                >
                  Log In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  href="/register/school"
                  icon={<School className="w-4 h-4" />}
                >
                  For Schools
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  href="/register/teacher"
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  I&apos;m a Teacher
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/teachers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
              <Search className="w-5 h-5 text-blue-500" />
              Find Teachers
            </Link>
            <Link
              href="/#how-it-works"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  const el = document.getElementById('how-it-works');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#how-it-works');
                  }
                }
              }}
              className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
            >
              How It Works
            </Link>
            <Link
              href="/#why-us"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  const el = document.getElementById('why-us');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#why-us');
                  }
                }
              }}
              className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
            >
              Why UstaadLink
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={profile?.full_name || 'User'}
                        fill
                        sizes="36px"
                        unoptimized={true}
                        className="object-cover"
                      />
                    ) : (
                      <span>{(profile?.full_name || user.email || 'U').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {profile?.full_name || user.email}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-blue-600">
                      {role || 'Teacher'}
                    </span>
                  </div>
                </div>

                {role === 'teacher' && (
                  <>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      href="/teacher/dashboard"
                      icon={<LayoutDashboard className="w-4 h-4" />}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Teacher Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      href="/teacher/dashboard"
                      icon={<UserCheck className="w-4 h-4" />}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Educator Profile
                    </Button>
                  </>
                )}

                {role === 'school' && (
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    href="/school/dashboard"
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    School Dashboard
                  </Button>
                )}

                {role === 'admin' && (
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    href="/admin"
                    icon={<ShieldAlert className="w-4 h-4" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={handleLogout}
                  icon={<LogOut className="w-4 h-4 text-rose-600" />}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  href="/register/school"
                  icon={<School className="w-4 h-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  href="/register/teacher"
                  icon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Free Profile
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  href="/login"
                  icon={<LogIn className="w-4 h-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShieldCheck, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
                <Image 
                  src="/favicon.svg" 
                  alt="UstaadLink Logo" 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">UstaadLink</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              UstaadLink is a transparent, free marketplace connecting qualified teachers directly with schools. Find opportunities or hire dedicated educators without recruitment intermediaries.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Free Validation Prototype &bull; Privacy First</span>
            </div>
          </div>

          {/* For Teachers */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              For Teachers
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/register/teacher" className="hover:text-white transition-colors">
                  Create Free Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Teacher Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy & Contact Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* For Schools */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              For Schools
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/teachers" className="hover:text-white transition-colors">
                  Find Teachers
                </Link>
              </li>
              <li>
                <Link href="/register/school" className="hover:text-white transition-colors">
                  Register School
                </Link>
              </li>
              <li>
                <Link href="/teachers?subject=Mathematics" className="hover:text-white transition-colors">
                  Math Teachers
                </Link>
              </li>
              <li>
                <Link href="/teachers?subject=Science" className="hover:text-white transition-colors">
                  Science Teachers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#why-us" className="hover:text-white transition-colors">
                  About UstaadLink
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-400 text-slate-400 transition-colors font-medium">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} UstaadLink. Built for teacher–school empowerment.</p>
          <p className="flex items-center gap-1">
            Empowering education with transparency
          </p>
        </div>
      </div>
    </footer>
  );
};

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const POPULAR_TAGS = [
  { label: 'Mathematics', param: 'subject', value: 'Mathematics' },
  { label: 'English', param: 'subject', value: 'English Language' },
  { label: 'Physics', param: 'subject', value: 'Physics' },
  { label: 'Malir', param: 'town', value: 'Malir' },
  { label: 'Gadap', param: 'town', value: 'Gadap' },
  { label: 'Ibrahim Hyderi', param: 'town', value: 'Ibrahim Hyderi' },
];

export const HeroSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/teachers?query=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/teachers');
    }
  };

  const handlePillClick = (param: string, value: string) => {
    router.push(`/teachers?${param}=${encodeURIComponent(value)}`);
  };

  return (
    <div className="mt-8 pt-2 max-w-2xl mx-auto space-y-3.5">
      {/* Search Bar Form */}
      <form onSubmit={handleSearch} className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center gap-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="pl-3 text-slate-400">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by subject, skill, or UC (e.g. Mathematics, Qaidabad)..."
          className="flex-1 bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="shrink-0 font-medium px-5"
        >
          Search Teachers
        </Button>
      </form>

      {/* Popular Subject & Malir Town Quick Tags */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium mr-1">Popular in Malir:</span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handlePillClick(tag.param, tag.value)}
            className="px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium border border-slate-200/60 cursor-pointer"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};

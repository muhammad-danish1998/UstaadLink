import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Teachers in District Malir, Karachi | UstaadLink',
  description: 'Search & filter verified school teachers and tutors across Malir Town, Gadap Town, and Ibrahim Hyderi. Filter by subject, class levels (Matric, Inter, O/A Levels), shift, and salary.',
  keywords: [
    'teachers in Malir',
    'hire teachers Karachi',
    'mathematics teacher Malir',
    'science teacher Gadap',
    'school faculty recruitment Karachi',
    'private tutor Malir',
    'teacher profiles Karachi',
    'UstaadLink teachers',
  ],
  alternates: {
    canonical: '/teachers',
  },
  openGraph: {
    title: 'Find & Hire Qualified Teachers in District Malir | UstaadLink',
    description: 'Browse verified educator profiles across Malir, Gadap & Ibrahim Hyderi. Send contact requests directly.',
    url: '/teachers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Qualified Teachers in District Malir | UstaadLink',
    description: 'Search educator profiles in Malir, Karachi. Zero commission recruitment platform.',
  },
};

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

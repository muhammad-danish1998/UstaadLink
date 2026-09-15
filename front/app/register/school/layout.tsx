import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Registration — Hire Qualified Teachers Faster',
  description: 'Register your school on UstaadLink to search verified teachers, filter candidates by subject and shift, and send direct contact requests without recruitment commissions.',
  alternates: {
    canonical: '/register/school',
  },
  openGraph: {
    title: 'Register Your School | UstaadLink',
    description: 'Find, filter, and contact verified teachers in District Malir and Karachi with zero commission.',
  },
};

export default function RegisterSchoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Registration — Create Your Free Educator Profile',
  description: 'Join UstaadLink as a teacher in Karachi. Create your free professional Teacher Profile Card to get discovered by schools across Malir, Gadap, and Ibrahim Hyderi.',
  alternates: {
    canonical: '/register/teacher',
  },
  openGraph: {
    title: 'Register as a Teacher | UstaadLink',
    description: 'Publish your free educator card and connect directly with hiring schools without middlemen.',
  },
};

export default function RegisterTeacherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

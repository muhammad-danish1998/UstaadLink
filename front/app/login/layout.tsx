import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account',
  description: 'Log in to your UstaadLink teacher, school, or administrator account to manage your profile and contact requests.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

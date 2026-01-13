import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Navo',
  description: 'Sign in to your Navo account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't use the main app shell
  return <>{children}</>;
}

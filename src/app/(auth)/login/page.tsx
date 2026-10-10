import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'Sign In — Student Management System',
  description: 'Sign in to the Registry Administration Portal and Student Management System',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-full py-12">
        <LoginForm />
      </div>
    </main>
  );
}

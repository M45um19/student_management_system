import type { Metadata } from 'next';
import { StudentDashboard } from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Student Hub — Student Management System',
  description: 'Student self-service dashboard',
};

export default function StudentDashboardPage() {
  return <StudentDashboard />;
}

import type { Metadata } from 'next';
import { StaffDashboard } from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Registry Dashboard — Student Management System',
  description: 'Registry Administrator workspace overview',
};

export default function StaffDashboardPage() {
  return <StaffDashboard />;
}

import type { Metadata } from 'next';
import { MarksheetDashboard } from '@/features/marksheet';

export const metadata: Metadata = {
  title: 'Marksheet & Results — Student Management System',
  description:
    'Award numeric grades (0–100), compute UK university classifications, manage publish/withhold gating, and generate official electronic marksheets.',
};

export default function StaffMarksheetPage() {
  return <MarksheetDashboard />;
}

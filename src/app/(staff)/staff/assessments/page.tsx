import type { Metadata } from 'next';
import { AssessmentsDashboard } from '@/features/assessments';

export const metadata: Metadata = {
  title: 'Coursework & Assessments — Student Management System',
  description: 'Manage module coursework deliverables, set submission deadlines, inspect student uploads, and review late submission flags.',
};

export default function StaffAssessmentsPage() {
  return <AssessmentsDashboard />;
}

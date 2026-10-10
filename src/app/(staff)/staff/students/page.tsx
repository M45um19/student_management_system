import type { Metadata } from 'next';
import { EnrolmentDashboard } from '@/features/enrolment';

export const metadata: Metadata = {
  title: 'Student Enrolment & Programmes — Student Management System',
  description: 'Manage admissions, student directories, degree programmes, and enrolment statuses.',
};

export default function StudentsPage() {
  return <EnrolmentDashboard />;
}

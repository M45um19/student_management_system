import React from 'react';
import type { Metadata } from 'next';
import { AssessmentDetailView } from '@/features/assessments';

export const metadata: Metadata = {
  title: 'Assessment Submissions Roster — Student Management System',
  description: 'Inspect class submission status, download deliverables, and review late tags.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffAssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentDetailView assessmentId={id} />;
}

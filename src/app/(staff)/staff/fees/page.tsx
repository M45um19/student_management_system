import type { Metadata } from 'next';
import { FeesDashboard } from '@/features/fees';

export const metadata: Metadata = {
  title: 'Fees & Payments Ledger — Student Management System',
  description: 'Manage programme tuition fees, record payments, track real-time balances, and monitor overdue student accounts.',
};

export default function StaffFeesPage() {
  return <FeesDashboard />;
}

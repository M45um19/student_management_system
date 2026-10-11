# Fees & Payments Ledger — UI Component Architecture

This document describes the component tree, state management patterns, and interactive workflows of the **Fees & Payments Ledger** module (`src/features/fees/components/`).

---

## 1. Component Hierarchy

```text
src/features/fees/components/
├── FeesDashboard.tsx               # Main staff ledger landing page & tab controller
│   ├── PageHeader (shared)         # Dynamic banner with module metadata
│   ├── StatCard (shared)           # 4 Financial KPI summary widgets
│   ├── Collection Rate Banner      # Visual progress bar of tuition collected
│   ├── PaymentLedgerTable.tsx      # Comprehensive institutional transactions ledger
│   ├── OverdueAccountsTable.tsx    # Debt monitoring view with urgency tags & actions
│   └── StudentFeeLedgerView.tsx    # Student statement lookup & breakdown view
├── RecordPaymentModal.tsx          # Payment recording modal with real-time balance feedback
├── PaymentReceiptModal.tsx         # Official printable transaction voucher
└── StudentFeeLedgerView.tsx        # Reusable statement view for student & staff portals
```

---

## 2. Component Specifications

### 2.1. `FeesDashboard.tsx`
The primary staff dashboard for institutional finance administration.
* **Tabs:**
  1. `ledger` — All historical payment transactions.
  2. `overdue` — Students with outstanding unpaid balances with urgency alerts.
  3. `lookup` — Single-student statement explorer with interactive candidate search.
* **KPI Metrics:**
  * Total Tuition Invoiced (£)
  * Total Fees Collected (£)
  * Total Outstanding Debt (£)
  * Overdue Accounts Count (with live badge)
  * Collection Efficiency Rate (%)

### 2.2. `RecordPaymentModal.tsx`
Interactive payment recording dialog with reference verification and balance calculation.
* **Props:**
  * `isOpen: boolean`
  * `onClose: () => void`
  * `preselectedStudent?: { id, studentId, fullName, balance, tuitionFee } | null`
  * `onSuccess?: (payment: any) => void`
* **Features:**
  * Real-time student directory search with auto-suggest.
  * Real-time balance inspection: fetches the candidate's active balance dynamically.
  * One-click amount preset buttons: "Full Balance", "50% Installment", "£1,000", "£500".
  * Automated reference number generator (`generateReferenceNumber`) with one-click refresh.
  * Transaction date selector defaulting to current day.
  * Client-side Zod validation with server error feedback (e.g. duplicate reference warning).

### 2.3. `PaymentReceiptModal.tsx`
Official electronic confirmation voucher for payment transactions.
* **Features:**
  * Institution header with logo and bursar stamp.
  * Receipt voucher number & unique reference code.
  * Student identification: Full Name, Student ID, Email, Degree Programme.
  * Formatted payment amount in GBP.
  * Authorizing staff member signature line.
  * Native print support (`window.print()`) with print-optimized styling (`print:hidden`, `print:p-0`).

### 2.4. `PaymentLedgerTable.tsx`
Central table displaying all verified transactions across the institution.
* **Features:**
  * Real-time search across reference numbers, student names, and student IDs.
  * Columns: Reference No, Student Profile, Degree Programme, Date, Amount, Authorized By, Action.
  * Pagination controls with total record count and page navigator.
  * Action button to open `PaymentReceiptModal` for any transaction.

### 2.5. `OverdueAccountsTable.tsx`
Registry alert view highlighting students with active outstanding tuition balances.
* **Features:**
  * Urgency tier indicators (`Critical • 100% Unpaid`, `Elevated • >50% Remaining`, `Moderate • <50% Remaining`).
  * Shows Programme, Tuition Fee, Amount Settled, and Total Outstanding Debt in bold rose text.
  * Direct "Record Payment" button per row that opens `RecordPaymentModal` pre-populated with that student.
  * Sort controls: Highest Balance First, Student Name, Student ID.

### 2.6. `StudentFeeLedgerView.tsx`
Shared statement of account view utilized both in the Student Portal (`/student/fees`) and Staff Portal (`/staff/fees` statement lookup).
* **Features:**
  * Financial Hero: Tuition Liability, Total Settled, Current Outstanding Balance.
  * Status Badge: `Paid in Full` (Emerald), `Partially Paid` (Amber), `Unpaid / Overdue` (Rose).
  * Animated progress bar displaying settlement percentage.
  * Audit trail table of all payments credited to this student with individual electronic receipt viewers.
  * Print statement button.

---

## 3. React Query Integration (`useFees.ts`)

| Query / Mutation Hook | Query Key | Functionality | Cache Invalidation |
| :--- | :--- | :--- | :--- |
| `useStudentFees(id)` | `['fees', 'student', id]` | Fetches single student fee breakdown & payments | Invalidated on `useRecordPayment` |
| `useOverdueFees(params)`| `['fees', 'overdue', params]`| Fetches students with debt & institutional KPIs | Invalidated on `useRecordPayment` |
| `usePayments(params)` | `['fees', 'payments', params]` | Queries paginated transactions ledger | Invalidated on `useRecordPayment` |
| `useRecordPayment()` | Mutation | Submits `POST /api/payments` payload | Invalidates `['fees']` and `['students']` |

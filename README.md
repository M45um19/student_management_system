# Student Management System — Registry Module

A focused, production-grade web application built for **Registry Administrators** to handle the core day-to-day administrative workflows of higher education: **Student Enrolment**, **Fees & Payments**, **Assessment Submissions**, and **Marksheets & Results**.

Built with a modular, **feature-driven architecture** using **Next.js 16 (App Router, Turbopack)**, **React 19**, **PostgreSQL**, **Prisma ORM**, **Tailwind CSS v4**, **TanStack Query**, and **JWT Authentication (Access & Refresh Tokens)**.

---

## Table of Contents
- [Architecture & Core Modules](#architecture--core-modules)
  - [Module 0: Authentication & Role Authorization](#module-0-authentication--role-authorization)
  - [Module 1: Student Enrolment & Programmes](#module-1-student-enrolment--programmes)
  - [Module 2: Fees & Payments Ledger](#module-2-fees--payments-ledger)
  - [Module 3: Assessment Submission](#module-3-assessment-submission)
  - [Module 4: Marksheet & Results](#module-4-marksheet--results)
- [Database Schema](#database-schema)
- [Edge Cases & Product Decisions](#edge-cases--product-decisions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Environment Variables](#environment-variables)
- [Seed Data & Demo Credentials](#seed-data--demo-credentials)
- [AI Usage Reflection](#ai-usage-reflection)

---

## Architecture & Core Modules

The project is structured into feature modules that follow a strict dependency sequence:

```mermaid
flowchart LR
    M0["Module 0: Auth & Roles\n(JWT Access/Refresh, httpOnly)"] --> M1["Module 1: Enrolment & Programmes\n(Programmes, Students, SMS-YYYY-XXXX)"]
    M1 --> M2["Module 2: Fees & Payments\n(Programme Tuition, Ledger, Overdue)"]
    M1 --> M3["Module 3: Assessment Submissions\n(Coursework, File Uploads, Late Flags)"]
    M3 --> M4["Module 4: Marksheets & Results\n(Grades 0-100, Classifications, Publish Gating)"]
```

---

### Module 0: Authentication & Role Authorization

* **Dependency:** Prerequisite for all features — establishes user identity and role separation (`STAFF` vs. `STUDENT`).
* **Strategy:** Dual-token JWT (15-min Access Token + 7-day Refresh Token with database-backed rotation) delivered via `httpOnly` cookies. Protected by Next.js edge middleware.
* **API Endpoints:**
  * `POST /api/auth/login` — Authenticates credentials, issues access & refresh tokens.
  * `POST /api/auth/refresh` — Validates refresh token against database, rotates token pair.
  * `POST /api/auth/logout` — Revokes refresh token in database, clears auth cookies.
  * `GET /api/auth/me` — Returns active user session, assigned role, and linked profile.

---

### Module 1: Student Enrolment & Programmes

* **Dependency:** Prerequisite for Fees, Submissions, and Grades — students and programmes are root domain entities.
* **Features:**
  * Auto-generates unique Student IDs in `SMS-YYYY-XXXX` format (e.g., `SMS-2025-0001`) dynamically resolved from any free-form Academic Intake Year string (e.g. `2024/2025` or `2025`).
  * Captures full name, email, date of birth, programme, academic intake year string, and enrolment status.
  * Enrolment statuses: `Enrolled`, `Deferred`, `Withdrawn`, `Completed`.
  * Real-time search and multi-filtering (Name, Student ID, Email, Degree Programme, Enrolment Status).
  * High-performance $O(1)$ UUIDv7 cursor-based pagination with bidirectional forward/backward history navigation.
* **API Endpoints:**
  * `GET /api/programmes` — Lists programmes, baseline tuition fees, and enrolment counts.
  * `POST /api/programmes` — Configures a new degree programme and tuition fee (Staff only).
  * `GET /api/programmes/[id]` — Retrieves single programme details by UUID.
  * `POST /api/students` — Enrols a student, auto-generates ID, and creates linked account.
  * `GET /api/students` — Queries student directory with search, filter, and UUIDv7 cursor pagination.
  * `GET /api/students/[id]` — Retrieves full student profile, curriculum, and financial ledger.
  * `PATCH /api/students/[id]/status` — Updates student enrolment lifecycle status.

---

### Module 2: Fees & Payments Ledger

* **Dependency:** Depends on Module 1 — tuition fees are bound to the student's enrolled programme.
* **Features:**
  * Automatically assigns programme tuition fee to each enrolled student.
  * Records payment transactions: amount, date, and external reference number.
  * Computes real-time outstanding balance: $\text{Balance} = \text{Fee} - \sum(\text{Payments})$.
  * Visually flags students with overdue outstanding balances on the Registry dashboard.
* **API Endpoints:**
  * `GET /api/students/[id]/fees` — Returns programme fee, payment ledger, and current balance.
  * `POST /api/payments` — Records payment transaction with reference verification.
  * `GET /api/fees/overdue` — Returns students with unpaid overdue balances for Registry alerts.

---

### Module 3: Assessment Submission

* **Dependency:** Depends on Module 1 — coursework is created per programme/module for enrolled students.
* **Features:**
  * Staff creates assessments: title, module, and submission deadline.
  * Students submit coursework deliverables (`.pdf`, `.docx`).
  * One submission per student per assessment, with resubmission allowed prior to deadline.
  * Late submissions accepted past deadline but permanently tagged with `isLate = true`.
* **API Endpoints:**
  * `GET /api/assessments` — Lists assessments filtered by module/programme.
  * `POST /api/assessments` — Staff creates an assessment with deadline.
  * `POST /api/assessments/[id]/submit` — Student submits coursework file (with resubmission & late detection).
  * `GET /api/assessments/[id]/submissions` — Staff reviews submissions with timestamps and late tags.

---

### Module 4: Marksheet & Results

* **Dependency:** Depends on Module 3 — grades are awarded against submitted student coursework.
* **Features:**
  * Staff enters numeric grades ($0–100$) per student per assessment.
  * Automatic UK university classification:
    * **Distinction:** $\ge 70$
    * **Merit:** $60 - 69$
    * **Pass:** $40 - 59$
    * **Fail:** $< 40$
  * Granular publish/withhold control per student.
  * Student marksheet strictly gated: unpublished grades remain hidden until published.
* **API Endpoints:**
  * `POST /api/grades` — Staff records/updates numeric grade (computes classification).
  * `PATCH /api/grades/[id]/publish` — Staff toggles publication status (`isPublished: true | false`).
  * `GET /api/students/[id]/marksheet` — Student marksheet (returns only published results).
  * `GET /api/assessments/[id]/grades` — Staff grade overview for the assessment.

---

## Database Schema

```mermaid
classDiagram
    direction TB

    class User {
        +String id PK
        +String email UK, INDEX
        +String passwordHash
        +Role role
        +DateTime createdAt
    }

    class RefreshToken {
        +String id PK
        +String tokenHash UK, INDEX
        +String userId FK, INDEX
        +DateTime expiresAt INDEX
        +Boolean isRevoked
    }

    class Staff {
        +String id PK
        +String staffId UK, INDEX
        +String fullName
        +String department
        +String userId FK, INDEX
    }

    class Programme {
        +String id PK
        +String code UK, INDEX
        +String name
        +Float tuitionFee
        +String createdById FK, INDEX
    }

    class Student {
        +String id PK
        +String studentId UK, INDEX
        +String fullName INDEX
        +String email UK, INDEX
        +DateTime dateOfBirth
        +String academicYear
        +EnrolmentStatus status INDEX
        +String programmeId FK, INDEX
        +String userId FK, INDEX
    }

    class Payment {
        +String id PK
        +String studentId FK, INDEX
        +String recordedById FK, INDEX
        +Float amount
        +DateTime paymentDate INDEX
        +String referenceNo UK, INDEX
    }

    class Assessment {
        +String id PK
        +String title
        +String module
        +DateTime deadline INDEX
        +String programmeId FK, INDEX
        +String createdById FK, INDEX
    }

    class Submission {
        +String id PK
        +String assessmentId FK, INDEX
        +String studentId FK, INDEX
        +String fileUrl
        +String fileName
        +DateTime submittedAt
        +Boolean isLate INDEX
    }

    class Grade {
        +String id PK
        +String assessmentId FK, INDEX
        +String studentId FK, INDEX
        +String submissionId FK, INDEX
        +String gradedById FK, INDEX
        +Float numericGrade
        +String classification
        +Boolean isPublished INDEX
        +DateTime publishedAt
    }

    %% Authentication & Identity
    User "1" --> "*" RefreshToken : maintains session
    User "1" --> "0..1" Staff : staff profile
    User "1" --> "0..1" Student : student profile

    %% Staff Governance & Registry Actions
    Staff "1" --> "*" Programme : creates & configures
    Staff "1" --> "*" Payment : records transaction
    Staff "1" --> "*" Assessment : creates coursework
    Staff "1" --> "*" Grade : grades & publishes

    %% Student Academic & Financial Lifecycle
    Programme "1" --> "*" Student : defines curriculum & fee
    Programme "1" --> "*" Assessment : offers module
    Student "1" --> "*" Payment : makes payment
    Student "1" --> "*" Submission : submits work
    Assessment "1" --> "*" Submission : collects
    Submission "0..1" --> "1" Grade : evaluated as
    Student "1" --> "*" Grade : receives result
    Assessment "1" --> "*" Grade : evaluated under
```

---

## Edge Cases & Product Decisions

| Workflow | Edge Case / Scenario | Architectural Decision |
| :--- | :--- | :--- |
| **Auth** | Refresh token reuse / stolen token | Token rotation with DB invalidation; reusing an old token revokes all user sessions. |
| **Auth** | Server route handler protection | `auth-guard.ts` extracts session users from HTTP-only cookies, checking access token first and refresh token fallback with DB verification. |
| **Enrolment** | Flexible intake year formats | Academic Intake Year is an open string; `resolveTargetYear()` parses 4-digit years for ID prefixing. |
| **Enrolment** | Concurrent ID generation collision | Atomic, zero-padded sequence generation per academic year (`SMS-YYYY-XXXX`) inside Prisma transactions. |
| **Enrolment** | Student withdrawal (`Withdrawn`) | Preserves payment ledger and submission history without cascading deletes. |
| **Enrolment** | Large cohort query latency | UUIDv7 time-ordered primary keys enable $O(1)$ B-Tree index seeking (`WHERE id < cursor`) instead of degrading $O(N)$ table offsets. |
| **Fees** | Overdue debt detection | Flags any student with an outstanding balance $> 0$ past the payment schedule. |
| **Assessments** | Resubmission before deadline | Overwrites previous upload, updates timestamp, and maintains single submission constraint. |
| **Assessments** | Submissions past deadline | Accepted but tagged with `isLate = true` and highlighted in staff dashboard. |
| **Results** | Withheld marksheet | Database query for student marksheet filters `isPublished: true`, hiding draft marks. |

---

## Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack, Edge Proxy Middleware)
* **Library:** React 19
* **Language:** TypeScript
* **State & Query Cache:** TanStack React Query v5
* **Database & ORM:** PostgreSQL + Prisma ORM (v6) with time-ordered **UUIDv7** primary keys
* **Authentication:** Dual-token JWT (`jose`) with Access + DB-backed Refresh Token rotation in `httpOnly` cookies
* **HTTP Client:** Axios (with automated 401 refresh token interceptor)
* **Styling:** Tailwind CSS v4
* **Icons:** Lucide React
* **Validation:** Zod schemas

---

## Project Structure

The codebase follows a **Scalable Feature-Driven Architecture**. Regardless of whether the system contains 2 features or 100 features, every domain boundary adheres to a standardized, modular blueprint:

```text
src/
├── app/                        # ROUTING LAYER (Next.js App Router)
│   ├── (route-groups)/         # Route groups for isolated layouts & role access
│   ├── api/                    # Backend API route handlers (REST endpoints)
│   │   └── [resource]/         # Resource endpoints (collection GET/POST, item dynamic routes)
│   ├── layout.tsx              # Root HTML shell & global providers
│   ├── page.tsx                # Application root / landing entry point
│   └── globals.css             # Global styling & Tailwind directives
│
├── components/                 # APPLICATION UI LAYER (Pure presentation & application shell)
│   ├── dashboard/              # Role/portal overview landing views & summary widgets
│   ├── layout/                 # Application shell (responsive sidebars, headers, navigations)
│   ├── shared/                 # Reusable UI primitives (buttons, modals, badges, cards, tables)
│   └── providers/              # Global React context & client-side state providers
│
├── features/                   # FEATURE MODULES (Self-contained domain boundaries)
│   └── [feature-name]/         # Standardized domain module (repeatable for N features)
│       ├── components/         # UI components localized strictly to this feature
│       ├── hooks/              # Custom React / query hooks managing feature state
│       ├── services/           # API contracts, fetchers & network communication
│       ├── types/              # Domain TypeScript interfaces & Zod validation schemas
│       ├── utils/              # Feature-specific business rules & calculation helpers
│       └── index.ts            # Public barrel export for clean inter-feature imports
│
├── lib/                        # SHARED INFRASTRUCTURE (Global singletons & utilities)
│   ├── api-response.ts         # Standardized API response contract { success, message, data, meta }
│   ├── auth-guard.ts           # Server-side route handler session & role barrier guards
│   ├── axios.ts                # Axios client with automated 401 token refresh interceptor
│   ├── jwt.ts                  # Access/Refresh token signing, verification & SHA-256 hashing
│   ├── prisma.ts               # Global Prisma Client singleton instance
│   └── constants.ts            # Cookie names, token expiration lifetimes & routes
│
└── proxy.ts                    # Edge route guard proxy / middleware (authentication & RBAC)

prisma/
├── schema.prisma               # Database models, relations & indexes
└── seed.ts                     # Database seeding script & evaluation fixtures

docs/                           # TECHNICAL DOCUMENTATION HUB
├── index.md                    # Architecture blueprint & master documentation index
├── components/                 # Application UI specifications & design guidelines
└── features/                   # Modular domain technical specifications
    └── [feature-name]/         # Universal 3-file specification per feature:
        ├── overview.md         # Domain business rules, permissions & sequence workflows
        ├── api.md              # REST contracts, payload schemas & response codes
        └── components.md       # UI component hierarchy, local state & hook integrations
```

---

## Getting Started (Local Development)

### Prerequisites
* **Node.js**: v18.17.0+
* **PostgreSQL**: Local instance or hosted service (e.g., Supabase / Neon / Docker)

### Installation & Run Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/M45um19/student_management_system.git
   cd student_management_system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Update `DATABASE_URL` with your PostgreSQL connection string).*

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev --name init
   # OR for quick schema sync:
   npx prisma db push
   ```

5. **Seed Demo Data:**
   ```bash
   npx prisma db seed
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sms_db?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for 15-min Access Tokens | `your-secure-access-token-secret-32-chars-min` |
| `JWT_REFRESH_SECRET` | Secret key for 7-day Refresh Tokens | `your-secure-refresh-token-secret-32-chars-min` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `UPLOAD_DIR` | Local directory for coursework file uploads | `./uploads` |

---

## Seed Data & Demo Credentials

The seed script (`prisma/seed.ts`) populates the system with 2 programmes, 5 students, fees, assessments, and grades:

| Role | Email | Password | Context |
| :--- | :--- | :--- | :--- |
| **Registry Staff** | `admin@sms.ac.uk` | `Staff@12345` | Registry Administrator |
| **Student** | `alice@sms.ac.uk` | `Student@12345` | `SMS-2025-0001` (BSc CS, Fees paid in full) |
| **Student** | `brian@sms.ac.uk` | `Student@12345` | `SMS-2025-0002` (BA Bus, **Overdue fee balance**) |
| **Student** | `clara@sms.ac.uk` | `Student@12345` | `SMS-2025-0003` (BSc CS, **Deferred** status) |
| **Student** | `david@sms.ac.uk` | `Student@12345` | `SMS-2025-0004` (BSc CS, Coursework submitted **Late**) |
| **Student** | `emma@sms.ac.uk` | `Student@12345` | `SMS-2025-0005` (BA Bus, Results **Published**) |

---

## AI Usage Reflection

This project used AI pair programming tools as an accelerator while maintaining strict human ownership over core architecture, data integrity, and business logic:

1. **Where AI Accelerated Development:**
   * **Schema & Model Scaffolding:** AI drafted initial Prisma schemas, including relation definitions and the `RefreshToken` rotation model.
   * **Realistic Seed Datasets:** Generated diverse sample records with realistic dates, edge cases (overdue fees, late submissions, withheld grades), and boundary classifications.
   * **Edge-Case Brainstorming:** Used AI to review potential race conditions in sequential student ID generation and test classification boundaries against UK university standards.

2. **Where Human Engineering & Ownership Took Precedence:**
   * **Enterprise Auth Architecture:** Opted for a secure dual-token JWT model with database-backed refresh rotation and `httpOnly` cookies rather than naive client-side storage.
   * **Data Normalization:** Designed `Programme` as an independent entity with its own fee schedule rather than an arbitrary text field, ensuring financial consistency.
   * **Privacy & Security Boundaries:** Manually enforced that student marksheet endpoints filter unpublished results at the database query level.
   * **Code Quality & Validation:** All routes and models are strictly typed with TypeScript and validated with Zod schemas.
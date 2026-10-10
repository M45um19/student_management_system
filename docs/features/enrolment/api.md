# Student Enrolment & Programmes — API Contracts

This document specifies the REST API contracts, request payloads, response structures, and error codes for endpoints under `/api/programmes/*` and `/api/students/*`.

---

## 1. Programmes Endpoints

### 1.1. GET `/api/programmes`
Lists all accredited degree programmes with tuition fee schedules and enrolment counts.

* **Authentication:** Authenticated user session (Staff or Student).
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Academic programmes retrieved successfully",
  "data": [
    {
      "id": "01a1253d-b858-7120-8688-92f7a79ce6db",
      "code": "CS-BSC",
      "name": "BSc Computer Science",
      "tuitionFee": 9250,
      "createdById": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
      "createdAt": "2026-10-10T09:56:04.312Z",
      "updatedAt": "2026-10-10T09:56:04.312Z",
      "createdBy": {
        "id": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
        "fullName": "Registry Administrator",
        "staffId": "STF-2025-001"
      },
      "_count": {
        "students": 4,
        "assessments": 1
      }
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### 1.2. POST `/api/programmes`
Staff-only endpoint to configure a new degree programme and baseline annual tuition fee.

* **Authentication:** Requires `Role === 'STAFF'`.
* **Request Body:**
```json
{
  "code": "SWE-BSC",
  "name": "BSc Software Engineering",
  "tuitionFee": 9250
}
```
* **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Programme successfully established.",
  "data": {
    "id": "01a1264e-3df7-7de2-a333-888e3080056c",
    "code": "SWE-BSC",
    "name": "BSc Software Engineering",
    "tuitionFee": 9250,
    "createdById": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
    "createdAt": "2026-10-10T14:53:44.311Z",
    "updatedAt": "2026-10-10T14:53:44.311Z",
    "_count": {
      "students": 0,
      "assessments": 0
    }
  }
}
```
* **Error `409 Conflict`:**
```json
{
  "success": false,
  "message": "Programme code 'SWE-BSC' is already registered.",
  "data": null
}
```

---

### 1.3. GET `/api/programmes/[id]`
Retrieves details for a specific degree programme by its UUID.

* **Response `200 OK`:** Returns `{ "success": true, "message": "Programme retrieved successfully", "data": { ... } }`.
* **Error `404 Not Found`:** If programme UUID is not found.

---

## 2. Student Directory & Enrolment Endpoints

### 2.1. GET `/api/students`
Queries the institutional student registry with multi-filtering, search, and pagination.

* **Authentication:** Authenticated user session.
* **Query Parameters (Validated via `studentQuerySchema`):**
  | Parameter | Type | Description | Constraints & Allowed Values | Default |
  | :--- | :--- | :--- | :--- | :--- |
  | `search` / `q` | `string` | Matches `fullName`, `studentId`, or `email` (case-insensitive) | Max 100 characters | `""` |
  | `programmeId` | `string` | Filter by degree programme UUID | Optional string | `""` |
  | `status` | `string` | Filter by enrolment status | `ENROLLED`, `DEFERRED`, `WITHDRAWN`, `COMPLETED` | Optional |
  | `academicYear`| `string` | Filter by intake year string | Max 50 characters | `""` |
  | `page` | `number` | Offset page number (fallback when cursor is omitted) | Integer $\ge 1$ | `1` |
  | `limit` | `number` | Number of records to return | Integer between `1` and `100` | `10` |
  | `cursor` | `string` | UUIDv7 primary key anchor for $O(1)$ cursor seeking | Optional UUIDv7 string | `null` |
  | `sortBy` | `string` | Sort field (Strictly whitelisted) | `createdAt`, `studentId`, `fullName`, `academicYear`, `status`, `id` | `'createdAt'` |
  | `sortOrder` | `string` | Sort direction | `asc` or `desc` | `'desc'` |

* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Student directory retrieved successfully",
  "data": [
    {
      "id": "01a1264d-8df2-7481-a684-67552b0b1b79",
      "studentId": "SMS-2025-0006",
      "fullName": "Oliver Queen",
      "email": "oliver@sms.ac.uk",
      "dateOfBirth": "2003-08-14T00:00:00.000Z",
      "academicYear": "2024/2025",
      "status": "ENROLLED",
      "programmeId": "01a1253d-b858-7120-8688-92f7a79ce6db",
      "userId": "01a1264d-8bde-7383-8511-dfe87e1eb7c8",
      "createdAt": "2026-10-10T14:52:59.250Z",
      "updatedAt": "2026-10-10T14:52:59.250Z",
      "programme": {
        "id": "01a1253d-b858-7120-8688-92f7a79ce6db",
        "code": "CS-BSC",
        "name": "BSc Computer Science",
        "tuitionFee": 9250
      },
      "user": {
        "id": "01a1264d-8bde-7383-8511-dfe87e1eb7c8",
        "email": "oliver@sms.ac.uk",
        "role": "STUDENT"
      },
      "_count": {
        "payments": 0,
        "submissions": 0,
        "grades": 0
      },
      "financialSummary": {
        "tuitionFee": 9250,
        "totalPaid": 0,
        "balance": 9250,
        "isOverdue": false
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "cursor": null,
      "nextCursor": "01a1253d-c1b6-7e90-aec4-7078c5f18960",
      "prevCursor": null,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "stats": {
      "total": 6,
      "enrolled": 4,
      "deferred": 1,
      "withdrawn": 0,
      "completed": 1,
      "programmesCount": 3
    }
  }
}
```

* **Error `400 Bad Request` (Invalid Query Parameters):**
Returned if parameters violate validation rules (e.g. unwhitelisted `sortBy`, non-integer `limit` / `page`, unknown `status`).
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "data": null
}
```

---

### 2.2. POST `/api/students`
Staff-only endpoint to enrol a new student. Atomically generates an `SMS-YYYY-XXXX` student ID, associates the programme, and creates a student user login.

* **Authentication:** Requires `Role === 'STAFF'`.
* **Request Body:**
```json
{
  "fullName": "Oliver Queen",
  "email": "oliver@sms.ac.uk",
  "dateOfBirth": "2003-08-14",
  "academicYear": "2024/2025",
  "programmeId": "01a1253d-b858-7120-8688-92f7a79ce6db",
  "status": "ENROLLED",
  "createAccount": true
}
```
* **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Student successfully enrolled with ID SMS-2025-0006.",
  "data": {
    "id": "01a1264d-8df2-7481-a684-67552b0b1b79",
    "studentId": "SMS-2025-0006",
    "fullName": "Oliver Queen",
    "email": "oliver@sms.ac.uk",
    "dateOfBirth": "2003-08-14T00:00:00.000Z",
    "academicYear": "2024/2025",
    "status": "ENROLLED",
    "programmeId": "01a1253d-b858-7120-8688-92f7a79ce6db",
    "financialSummary": {
      "tuitionFee": 9250,
      "totalPaid": 0,
      "balance": 9250,
      "isOverdue": false
    }
  },
  "meta": {
    "accountCreated": true,
    "defaultPasswordNote": "Default temporary password set to Student@12345"
  }
}
```
* **Error `409 Conflict`:**
```json
{
  "success": false,
  "message": "A student with email 'oliver@sms.ac.uk' is already enrolled.",
  "data": null
}
```

---

### 2.3. GET `/api/students/[id]`
Retrieves full student profile details, academic records, payment history, and coursework submissions.

* **Authentication:** Staff or the student owning this profile.
* **Response `200 OK`:** Returns `{ "success": true, "message": "Student profile retrieved successfully.", "data": { ... } }`.

---

### 2.4. PATCH `/api/students/[id]/status`
Staff-only endpoint to transition a student's enrolment lifecycle status.

* **Authentication:** Requires `Role === 'STAFF'`.
* **Request Body:**
```json
{
  "status": "DEFERRED"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Enrolment status updated to 'Deferred' for Oliver Queen (SMS-2025-0006).",
  "data": {
    "id": "01a1264d-8df2-7481-a684-67552b0b1b79",
    "studentId": "SMS-2025-0006",
    "fullName": "Oliver Queen",
    "status": "DEFERRED"
  }
}
```

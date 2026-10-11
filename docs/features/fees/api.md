# Fees & Payments Ledger — API Contracts

This document specifies the REST API contracts, request payloads, response structures, and HTTP error codes for endpoints under `/api/students/[id]/fees`, `/api/payments`, and `/api/fees/overdue`.

---

## 1. Student Fee Ledger Endpoints

### 1.1. GET `/api/students/[id]/fees`
Returns assigned programme tuition fee, payment ledger transactions, and current outstanding balance for a specific student.

* **Authentication:** Authenticated user session.
* **Access Control:**
  * Staff: Allowed to query any student.
  * Student: Can only query their own account (where `[id]` matches `session.studentProfileId` or `[id] === 'me'`).
* **Path Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Student UUID, studentId code (e.g. `SMS-2025-0001`), or `'me'`. |

* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Fee ledger retrieved successfully for student SMS-2025-0002.",
  "data": {
    "student": {
      "id": "01a1253d-af78-75e1-8890-ec89d6b2c892",
      "studentId": "SMS-2025-0002",
      "fullName": "Brian Smith",
      "email": "brian@sms.ac.uk",
      "academicYear": "2024/2025",
      "status": "ENROLLED"
    },
    "programme": {
      "id": "01a1253d-ba12-7009-8812-ad91b92c813a",
      "code": "BA-BUS",
      "name": "BA Business Administration",
      "tuitionFee": 8500
    },
    "tuitionFee": 8500,
    "totalPaid": 4000,
    "balance": 4500,
    "isOverdue": true,
    "paymentStatus": "PARTIAL",
    "paymentsCount": 1,
    "payments": [
      {
        "id": "01a1253d-e019-7412-a190-be9812cc9011",
        "amount": 4000,
        "paymentDate": "2024-09-20T00:00:00.000Z",
        "referenceNo": "PAY-2025-BRIAN-01",
        "createdAt": "2026-10-10T09:56:04.450Z",
        "recordedBy": {
          "id": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
          "fullName": "Registry Administrator",
          "staffId": "STF-2025-001"
        }
      }
    ]
  }
}
```

* **Error `403 Forbidden`:**
Returned if a logged-in student attempts to access another student's financial ledger.
```json
{
  "success": false,
  "message": "Access denied. You can only inspect your own fee ledger.",
  "data": null
}
```

* **Error `404 Not Found`:**
```json
{
  "success": false,
  "message": "Student record not found.",
  "data": null
}
```

---

## 2. Institutional Payments Endpoints

### 2.1. GET `/api/payments`
Lists payment transactions across the institution with search, student filtering, and pagination.

* **Authentication:** Authenticated user session.
* **Access Control:**
  * Staff: Can view all transactions and filter by any student.
  * Student: Automatically restricted to their own payment records.
* **Query Parameters:**
  | Parameter | Type | Description | Default |
  | :--- | :--- | :--- | :--- |
  | `search` | `string` | Search reference number, student name, or email | `""` |
  | `studentId` | `string` | Filter by student UUID or studentId | Optional |
  | `cursor` | `string` | UUIDv7 cursor ID of last item from prior page ($O(1)$ B-tree seek) | Optional |
  | `page` | `number` | Page number (fallback offset navigation) | `1` |
  | `limit` | `number` | Records per page (max 100) | `10` |

* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Payment transactions retrieved successfully.",
  "data": [
    {
      "id": "01a1253d-e019-7412-a190-be9812cc9011",
      "studentId": "01a1253d-af78-75e1-8890-ec89d6b2c892",
      "amount": 4000,
      "paymentDate": "2024-09-20T00:00:00.000Z",
      "referenceNo": "PAY-2025-BRIAN-01",
      "createdAt": "2026-10-10T09:56:04.450Z",
      "student": {
        "id": "01a1253d-af78-75e1-8890-ec89d6b2c892",
        "studentId": "SMS-2025-0002",
        "fullName": "Brian Smith",
        "email": "brian@sms.ac.uk",
        "programme": {
          "id": "01a1253d-ba12-7009-8812-ad91b92c813a",
          "code": "BA-BUS",
          "name": "BA Business Administration",
          "tuitionFee": 8500
        }
      },
      "recordedBy": {
        "id": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
        "staffId": "STF-2025-001",
        "fullName": "Registry Administrator"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 4,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "cursor": null,
      "nextCursor": "01a1253d-e019-7412-a190-be9812cc9011",
      "prevCursor": null,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "totalAmount": 31000
  }
}
```

---

### 2.2. POST `/api/payments`
Staff-only endpoint to post a payment transaction into the student's ledger with atomic reference verification.

* **Authentication:** Requires `Role === 'STAFF'`.
* **Request Payload (Validated via `recordPaymentSchema`):**
```json
{
  "studentId": "01a1253d-af78-75e1-8890-ec89d6b2c892",
  "amount": 2500,
  "referenceNo": "PAY-2025-BRIAN-02",
  "paymentDate": "2026-10-11T12:00:00.000Z"
}
```

* **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Payment of £2,500.00 successfully recorded with reference PAY-2025-BRIAN-02.",
  "data": {
    "payment": {
      "id": "01a1268f-91a0-7112-a102-cb91882cf091",
      "studentId": "01a1253d-af78-75e1-8890-ec89d6b2c892",
      "amount": 2500,
      "paymentDate": "2026-10-11T12:00:00.000Z",
      "referenceNo": "PAY-2025-BRIAN-02",
      "createdAt": "2026-10-11T12:00:00.000Z",
      "student": {
        "id": "01a1253d-af78-75e1-8890-ec89d6b2c892",
        "studentId": "SMS-2025-0002",
        "fullName": "Brian Smith",
        "email": "brian@sms.ac.uk",
        "programme": {
          "id": "01a1253d-ba12-7009-8812-ad91b92c813a",
          "code": "BA-BUS",
          "name": "BA Business Administration",
          "tuitionFee": 8500
        }
      },
      "recordedBy": {
        "id": "01a1253d-ad1d-76d3-b6ab-fc996dcc83fa",
        "staffId": "STF-2025-001",
        "fullName": "Registry Administrator"
      }
    },
    "ledgerSummary": {
      "tuitionFee": 8500,
      "previousPaid": 4000,
      "amountPaid": 2500,
      "newTotalPaid": 6500,
      "previousBalance": 4500,
      "newBalance": 2000,
      "isOverdue": true,
      "status": "PARTIAL"
    }
  }
}
```

* **Error `409 Conflict` (Duplicate Reference):**
```json
{
  "success": false,
  "message": "Payment reference 'PAY-2025-BRIAN-02' is already registered in the ledger. Please provide a unique reference number.",
  "data": null
}
```

* **Error `400 Bad Request` (Invalid Amount or Missing Fields):**
```json
{
  "success": false,
  "message": "Payment amount must be greater than zero",
  "data": null
}
```

---

## 3. Registry Overdue Debt Alerts Endpoints

### 3.1. GET `/api/fees/overdue`
Staff-only endpoint to retrieve all students with unpaid tuition balances along with institutional finance KPIs.

* **Authentication:** Requires `Role === 'STAFF'`.
* **Query Parameters:**
  | Parameter | Type | Description | Default |
  | :--- | :--- | :--- | :--- |
  | `search` | `string` | Search student name, ID, or email | `""` |
  | `programmeId` | `string` | Filter by degree programme UUID | Optional |
  | `sortBy` | `string` | Sort field (`balance`, `name`, `studentId`) | `'balance'` |
  | `sortOrder` | `string` | Sort order (`asc`, `desc`) | `'desc'` |
  | `cursor` | `string` | UUID cursor of the student from prior page | Optional |
  | `page` | `number` | Page number (fallback offset navigation) | `1` |
  | `limit` | `number` | Records per page (max 100) | `10` |

* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Retrieved 1 students with overdue fee balances.",
  "data": [
    {
      "id": "01a1253d-af78-75e1-8890-ec89d6b2c892",
      "studentId": "SMS-2025-0002",
      "fullName": "Brian Smith",
      "email": "brian@sms.ac.uk",
      "academicYear": "2024/2025",
      "status": "ENROLLED",
      "programme": {
        "id": "01a1253d-ba12-7009-8812-ad91b92c813a",
        "code": "BA-BUS",
        "name": "BA Business Administration",
        "tuitionFee": 8500
      },
      "tuitionFee": 8500,
      "totalPaid": 4000,
      "balance": 4500,
      "paymentsCount": 1,
      "lastPaymentDate": "2024-09-20T00:00:00.000Z",
      "lastPaymentRef": "PAY-2025-BRIAN-01",
      "urgency": "MEDIUM"
    }
  ],
  "meta": {
    "stats": {
      "totalStudents": 5,
      "totalOverdueStudents": 1,
      "totalExpectedTuition": 44750,
      "totalFeesCollected": 31000,
      "totalOutstanding": 13750,
      "collectionRate": 69.3
    },
    "totalCount": 1,
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "cursor": null,
      "nextCursor": null,
      "prevCursor": null,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

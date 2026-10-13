# Marksheet & Results — API Specification

All endpoints strictly conform to the Standard API Response shell:
```typescript
interface StandardApiResponse<T = unknown, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}
```

---

## 1. `POST /api/grades`

Staff records or updates a numeric coursework mark ($0–100$) for an enrolled student.
Automatically computes UK degree classification, links to coursework deliverable if present, and upserts atomically.

* **Method:** `POST`
* **Access:** Registry Staff only (`Role === 'STAFF'`)
* **Request Body:**
  ```json
  {
    "assessmentId": "018d9f10-1234-7000-8000-000000000001",
    "studentId": "018d9f10-2345-7000-8000-000000000002",
    "numericGrade": 84.5,
    "isPublished": false
  }
  ```

### Response `200 OK`
```json
{
  "success": true,
  "message": "Grade of 84.5/100 (Distinction) successfully recorded as draft for Alice Johnson.",
  "data": {
    "id": "018d9f10-3456-7000-8000-000000000003",
    "assessmentId": "018d9f10-1234-7000-8000-000000000001",
    "studentId": "018d9f10-2345-7000-8000-000000000002",
    "submissionId": "018d9f10-4567-7000-8000-000000000004",
    "gradedById": "018d9f10-5678-7000-8000-000000000005",
    "numericGrade": 84.5,
    "classification": "Distinction",
    "isPublished": false,
    "publishedAt": null,
    "createdAt": "2025-05-25T14:30:00.000Z",
    "updatedAt": "2025-05-25T14:30:00.000Z",
    "student": {
      "id": "018d9f10-2345-7000-8000-000000000002",
      "studentId": "SMS-2025-0001",
      "fullName": "Alice Johnson",
      "email": "alice@sms.ac.uk"
    },
    "assessment": {
      "id": "018d9f10-1234-7000-8000-000000000001",
      "title": "Coursework 1: Data Structures & Algorithms",
      "module": "CS101 - Algorithms",
      "deadline": "2025-05-20T23:59:00.000Z"
    }
  }
}
```

---

## 2. `PATCH /api/grades/[id]/publish`

Staff toggles or explicitly sets publication status (`isPublished: true | false`).
When published, sets `publishedAt = now()` and releases grade to the student marksheet.

* **Method:** `PATCH`
* **Access:** Registry Staff only (`Role === 'STAFF'`)
* **URL Parameters:** `id` *(Grade UUID)*
* **Request Body (Optional):**
  ```json
  {
    "isPublished": true
  }
  ```

### Response `200 OK`
```json
{
  "success": true,
  "message": "Grade for Alice Johnson has been published to their marksheet.",
  "data": {
    "id": "018d9f10-3456-7000-8000-000000000003",
    "numericGrade": 84.5,
    "classification": "Distinction",
    "isPublished": true,
    "publishedAt": "2025-05-25T15:00:00.000Z"
  }
}
```

---

## 3. `POST /api/grades/bulk-publish`

Staff bulk publishes or withholds all awarded marks for an entire coursework assessment class.

* **Method:** `POST`
* **Access:** Registry Staff only (`Role === 'STAFF'`)
* **Request Body:**
  ```json
  {
    "assessmentId": "018d9f10-1234-7000-8000-000000000001",
    "isPublished": true
  }
  ```

### Response `200 OK`
```json
{
  "success": true,
  "message": "15 grades successfully published to student marksheets for assessment \"Coursework 1: Data Structures & Algorithms\".",
  "data": {
    "updatedCount": 15,
    "isPublished": true
  }
}
```

---

## 4. `GET /api/assessments/[id]/grades`

Retrieves enrolled class grading roster and performance metrics for a specific assessment.

* **Method:** `GET`
* **Access:** Registry Staff only (`Role === 'STAFF'`)
* **URL Parameters:** `id` *(Assessment UUID)*
* **Query Parameters:**
  * `search` *(string, optional)*: Student name, studentId, or email.
  * `status` *(string, optional)*: `'all' | 'graded' | 'ungraded' | 'published' | 'draft'`.
  * `classification` *(string, optional)*: `'all' | 'Distinction' | 'Merit' | 'Pass' | 'Fail'`.
  * `page`, `limit`, `cursor`.

### Response `200 OK`
```json
{
  "success": true,
  "message": "Assessment grades roster retrieved successfully.",
  "data": [
    {
      "student": {
        "id": "018d9f10-2345-7000-8000-000000000002",
        "studentId": "SMS-2025-0001",
        "fullName": "Alice Johnson",
        "email": "alice@sms.ac.uk",
        "academicYear": "2024/2025",
        "status": "ENROLLED"
      },
      "hasSubmitted": true,
      "submission": {
        "id": "018d9f10-4567-7000-8000-000000000004",
        "fileName": "alice_coursework.pdf",
        "fileUrl": "/uploads/alice_coursework.pdf",
        "submittedAt": "2025-05-18T10:00:00.000Z",
        "isLate": false
      },
      "grade": {
        "id": "018d9f10-3456-7000-8000-000000000003",
        "numericGrade": 84.5,
        "classification": "Distinction",
        "isPublished": true,
        "publishedAt": "2025-05-25T15:00:00.000Z"
      },
      "status": "GRADED"
    }
  ],
  "meta": {
    "metrics": {
      "totalEnrolled": 20,
      "totalSubmitted": 18,
      "totalGraded": 15,
      "pendingGrading": 5,
      "publishedCount": 15,
      "draftCount": 0,
      "averageScore": 72.4,
      "passRate": 93,
      "classificationDistribution": {
        "distinction": 8,
        "merit": 4,
        "pass": 2,
        "fail": 1
      }
    }
  }
}
```

---

## 5. `GET /api/students/[id]/marksheet`

Retrieves official student academic transcript and marksheet.
* **Strict Gating:** For students, unpublished results are strictly filtered out at the SQL query level (`isPublished: true`).
* For staff: Both published and draft results are accessible with audit metrics.

* **Method:** `GET`
* **Access:** Student (self-only via `'me'` or own ID) or Registry Staff (any student).
* **URL Parameters:** `id` *(Student UUID, Student ID string, or `'me'`)*

### Response `200 OK`
```json
{
  "success": true,
  "message": "Official marksheet retrieved successfully for student SMS-2025-0001.",
  "data": {
    "student": {
      "id": "018d9f10-2345-7000-8000-000000000002",
      "studentId": "SMS-2025-0001",
      "fullName": "Alice Johnson",
      "email": "alice@sms.ac.uk",
      "academicYear": "2024/2025",
      "status": "ENROLLED"
    },
    "programme": {
      "id": "018d9f10-0000-7000-8000-000000000001",
      "code": "BSC-CS",
      "name": "BSc Computer Science",
      "tuitionFee": 9250.0
    },
    "gpa": 84.5,
    "overallClassification": "Distinction",
    "totalAssessed": 1,
    "modulesPassed": 1,
    "distinctionCount": 1,
    "meritCount": 0,
    "passCount": 0,
    "failCount": 0,
    "results": [
      {
        "gradeId": "018d9f10-3456-7000-8000-000000000003",
        "assessmentId": "018d9f10-1234-7000-8000-000000000001",
        "module": "CS101 - Algorithms",
        "title": "Coursework 1: Data Structures & Algorithms",
        "deadline": "2025-05-20T23:59:00.000Z",
        "numericGrade": 84.5,
        "classification": "Distinction",
        "isPublished": true,
        "publishedAt": "2025-05-25T15:00:00.000Z",
        "submittedAt": "2025-05-18T10:00:00.000Z",
        "isLate": false
      }
    ],
    "hasUnpublishedGrades": false,
    "generatedAt": "2025-05-25T16:00:00.000Z"
  }
}
```

---

## 6. `GET /api/grades`

Staff master query across all institutional grades with search, module filtering, classification filtering, and summary statistics.

* **Method:** `GET`
* **Access:** Registry Staff only (`Role === 'STAFF'`)
* **Query Parameters:** `search`, `programmeId`, `assessmentId`, `classification`, `status`, `page`, `limit`, `cursor`.

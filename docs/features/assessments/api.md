# Assessment Submission — API Specification

All endpoints conform to the Standard API Response shell:
```typescript
interface StandardApiResponse<T = unknown, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}
```

---

## 1. `GET /api/assessments`

Lists assessments with programme filtering, search, status filtering, and role-based student context.
Utilizes high-performance $O(1)$ UUIDv7 cursor-based pagination seek.

* **Method:** `GET`
* **Access:** Authenticated Users (`STAFF` or `STUDENT`)
* **Query Parameters:**
  * `search` *(string, optional)*: Filter by title, module, or programme name/code.
  * `programmeId` *(string, optional)*: Filter by degree programme UUID (Staff only).
  * `status` *(string, optional)*: `'all' | 'active' | 'passed' | 'archived'` (Default: `'all'`).
    * When `status === 'archived'` (Staff only): Returns solely inactive/archived assessments (`isActive: false`).
    * When `status === 'all' | 'active' | 'passed'`: Returns active assessments (`isActive: true`).
    * For Students: Strictly scoped to active assessments (`isActive: true`) regardless of status query.
  * `page` *(number, optional)*: Page number (Default: `1`).
  * `limit` *(number, optional)*: Page limit (Default: `10`, Max: `100`).
  * `cursor` *(string, optional)*: UUIDv7 primary key cursor for $O(1)$ seek pagination.

### Response `200 OK` (Staff View)
```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": [
    {
      "id": "018d9f10-1234-7000-8000-000000000001",
      "title": "Coursework 1: Data Structures & Algorithms",
      "module": "CS101 - Algorithms",
      "deadline": "2025-05-20T23:59:00.000Z",
      "programmeId": "018d9f10-0000-7000-8000-000000000001",
      "isActive": true,
      "programme": {
        "id": "018d9f10-0000-7000-8000-000000000001",
        "code": "BSC-CS",
        "name": "BSc Computer Science",
        "tuitionFee": 9250.0
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      "_count": { "submissions": 12 },
      "metrics": {
        "totalEnrolled": 15,
        "totalSubmitted": 12,
        "onTimeCount": 11,
        "lateCount": 1,
        "missingCount": 3,
        "submissionRate": 80
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 9,
      "totalPages": 5,
      "cursor": null,
      "nextCursor": "018d9f10-1234-7000-8000-000000000009",
      "prevCursor": null,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "stats": {
      "totalAssessments": 45,
      "activeDeadlines": 30,
      "passedDeadlines": 15,
      "totalSubmissions": 350,
      "onTimeSubmissions": 320,
      "lateSubmissions": 30,
      "archivedAssessments": 4
    }
  }
}
```

---

## 2. `POST /api/assessments`

Creates a new coursework deliverable for a degree programme.

* **Method:** `POST`
* **Access:** Staff Only (`Role === 'STAFF'`)
* **Payload:**
```json
{
  "title": "Coursework 2: Binary Search Trees Implementation",
  "module": "CS102 - Data Structures",
  "deadline": "2025-06-15T23:59:00.000Z",
  "programmeId": "018d9f10-0000-7000-8000-000000000001"
}
```

---

## 3. `GET /api/assessments/[id]`

Retrieves single assessment specifications and cohort completion metrics.
Students receive a `404 Not Found` if the assessment is archived (`isActive: false`).

* **Method:** `GET`
* **Access:** Authenticated Users (`STAFF` or enrolled `STUDENT`)

---

## 4. `POST /api/assessments/[id]/submit`

Enrolled student submits coursework deliverables (.pdf, .docx, .doc).

* **Method:** `POST`
* **Access:** Student Only (`Role === 'STUDENT'`)
* **Payload:** `multipart/form-data` with `file: File` OR `application/json` with `{ fileName, fileUrl }`.

---

## 5. `GET /api/assessments/[id]/submissions`

Staff reviews cohort submission status, download links, timestamps, and late tags.
Supports $O(1)$ UUIDv7 cursor-based pagination.

* **Method:** `GET`
* **Access:** Staff Only (`Role === 'STAFF'`)

---

## 6. `DELETE /api/assessments/[id]` (Soft Delete / Archive)

Archives an assessment by setting `isActive: false` instead of hard deleting records. Preserves all student submissions, timestamps, and grading records for academic integrity.

* **Method:** `DELETE`
* **Access:** Staff Only (`Role === 'STAFF'`)
* **Safety Verification:** Rejects if finalized/published examination grades exist.

### Response `200 OK`
```json
{
  "success": true,
  "message": "Assessment archived successfully. Submissions preserved.",
  "data": {
    "id": "018d9f10-1234-7000-8000-000000000001",
    "isActive": false
  }
}
```

---

## 7. `PATCH /api/assessments/[id]` (Archive / Restore)

Toggles the active or archived status of an assessment.

* **Method:** `PATCH`
* **Access:** Staff Only (`Role === 'STAFF'`)
* **Payload:**
```json
{
  "isActive": true
}
```

### Response `200 OK`
```json
{
  "success": true,
  "message": "Assessment restored to active roster successfully.",
  "data": {
    "id": "018d9f10-1234-7000-8000-000000000001",
    "isActive": true
  }
}
```

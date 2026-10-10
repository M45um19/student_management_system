# Auth Module — API Contracts

This document describes the request and response contracts for all endpoints under `/api/auth/*`.

---

## 1. POST `/api/auth/login`

Authenticates credentials, generates dual tokens, persists the refresh token hash, and sets `httpOnly` session cookies.

### Request Body
```json
{
  "email": "admin@sms.ac.uk",
  "password": "Staff@12345"
}
```

### Responses

* **`200 OK` — Authentication Successful**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "01a1253d-ad1d-76d3-b6ab-fc8190f88a2f",
      "email": "admin@sms.ac.uk",
      "role": "STAFF",
      "name": "Registry Administrator",
      "staffId": "STF-2025-001",
      "department": "Academic Registry & Admissions"
    }
  }
  ```
  *Set-Cookie Headers:*
  - `sms_access_token=<jwt>; HttpOnly; SameSite=Lax; Max-Age=900; Path=/`
  - `sms_refresh_token=<jwt>; HttpOnly; SameSite=Lax; Max-Age=604800; Path=/`

* **`401 Unauthorized` — Invalid Credentials**
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

---

## 2. POST `/api/auth/refresh`

Validates the incoming `sms_refresh_token` cookie against the database whitelist, rotates the token pair, and issues new cookies.

### Headers / Cookies
Requires cookie `sms_refresh_token`.

### Responses

* **`200 OK` — Token Pair Rotated**
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "user": {
      "id": "01a1253d-ad1d-76d3-b6ab-fc8190f88a2f",
      "email": "admin@sms.ac.uk",
      "role": "STAFF",
      "name": "Registry Administrator",
      "staffId": "STF-2025-001"
    }
  }
  ```

* **`401 Unauthorized` — Expired or Reused Token**
  ```json
  {
    "success": false,
    "message": "Refresh token is no longer valid"
  }
  ```

---

## 3. POST `/api/auth/logout`

Revokes the refresh token record in the database and explicitly clears both `sms_access_token` and `sms_refresh_token` cookies.

### Responses
* **`200 OK`**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 4. GET `/api/auth/me`

Returns the active session state and user identity from the verified access token.

### Responses
* **`200 OK` (Authenticated)**
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "01a1253d-ad1d-76d3-b6ab-fc8190f88a2f",
      "email": "admin@sms.ac.uk",
      "role": "STAFF",
      "name": "Registry Administrator",
      "staffId": "STF-2025-001"
    }
  }
  ```
* **`401 Unauthorized` (Unauthenticated)**
  ```json
  {
    "authenticated": false,
    "user": null
  }
  ```

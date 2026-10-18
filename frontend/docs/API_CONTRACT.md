# Strategic CRM — REST API Contract (Handoff Specification)

> **Document Status**: Active Frontend Specification & Backend Handoff Contract  
> **Base Path**: `/api`  
> **Content-Type**: `application/json`  

---

## Table of Contents
1. [Accounts Module Endpoints](#1-accounts-module-endpoints)
   - [1.1 GET /api/accounts (Paginated List)](#11-get-apiaccounts)
   - [1.2 GET /api/accounts/{id} (Account Detail)](#12-get-apiaccountsid)
   - [1.3 POST /api/accounts (Create Account)](#13-post-apiaccounts)
   - [1.4 PUT /api/accounts/{id} (Update Account)](#14-put-apiaccountsid)
   - [1.5 GET /api/accounts/{id}/contacts (Account Contacts)](#15-get-apiaccountsidcontacts)
   - [1.6 GET & POST /api/accounts/{id}/notes (Account Notes)](#16-get--post-apiaccountsidnotes)
   - [1.7 GET /api/accounts/{id}/deals (Account Deals - Placeholder)](#17-get-apiaccountsiddeals)
   - [1.8 GET /api/accounts/lookups (Lookup Options)](#18-get-apiaccountslookups)
2. [Data Model & ER Mapping](#2-data-model--er-mapping)
3. [Standard Validation Error Structure](#3-standard-validation-error-structure)

---

## 1. Accounts Module Endpoints

### 1.1 GET `/api/accounts`
Retrieves a paginated list of accounts with comprehensive filtering, text searching, and sorting.

* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `q` | `string` | No | `""` | Case-insensitive search on `name`, `websiteUrl`, and `country`. |
  | `businessLine`| `string` | No | — | Filter by business line (`Healthcare`, `Financial Advisory`, `Networking & Partnerships`). |
  | `categoryId` | `string` | No | — | Filter by Category ID. |
  | `subCategoryId` | `string` | No | — | Filter by Sub-Category ID. |
  | `serviceId` | `string` | No | — | Filter by Service ID. |
  | `tier` | `string` | No | — | Filter by Tier (`TIER_1`, `TIER_2`, `TIER_3`). |
  | `dealSide` | `string` | No | — | Filter by Deal Side (`BUY_SIDE`, `SELL_SIDE`). |
  | `ownerId` | `string` | No | — | Filter by Owner / User ID. |
  | `country` | `string` | No | — | Filter by Country. |
  | `status` | `string` | No | — | Filter by Status (`ACTIVE`, `INACTIVE`). |
  | `page` | `integer` | No | `0` | **0-based** page index. |
  | `sort` | `string` | No | `updatedDate,desc` | Format: `field,asc` or `field,desc`. Allowed fields: `name`, `tier`, `nextFollowUpDate`, `updatedDate`. `nextFollowUpDate` sorts soonest first with accounts without a date last (nulls last). Any other sort field returns HTTP 400 validation error. |

* **Response JSON (`200 OK`)**:
```json
{
  "content": [
    {
      "id": "acc-001",
      "name": "Siam Care",
      "businessLine": "Healthcare",
      "categoryName": "Hospitals / Providers",
      "subCategoryName": "Listed group",
      "tier": "TIER_1",
      "dealSide": "BUY_SIDE",
      "ownerId": "usr-ploy",
      "ownerName": "Ploy S.",
      "country": "Thailand",
      "status": "ACTIVE",
      "nextFollowUpDate": "2026-10-18",
      "updatedDate": "2026-10-14"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 134,
  "totalPages": 14
}
```

---

### 1.2 GET `/api/accounts/{id}`
Retrieves full account details enriched with lookup names, relational entity counts, and next action summary.

* **Path Parameters**: `id` (string) — The unique Account ID.
* **Response JSON (`200 OK`)**:
```json
{
  "id": "acc-001",
  "name": "Siam Care",
  "businessLine": "Healthcare",
  "country": "Thailand",
  "websiteUrl": "https://siamcare.example.com",
  "categoryId": "cat-hosp",
  "categoryName": "Hospitals / Providers",
  "subCategoryId": "sub-listed",
  "subCategoryName": "Listed group",
  "serviceId": "srv-partnerships",
  "serviceName": "Strategic Partnerships",
  "tier": "TIER_1",
  "ownerId": "usr-ploy",
  "ownerName": "Ploy S.",
  "status": "ACTIVE",
  "dealSide": "BUY_SIDE",
  "sourceRef": "APAC Healthcare Leadership Summit 2026",
  "note": "Premier private hospital network in Southeast Asia exploring digital health and cross-border M&A partnerships.",
  "createdBy": "usr-ploy",
  "createdByName": "Ploy S.",
  "createdDate": "2026-08-15",
  "updatedBy": "usr-ploy",
  "updatedByName": "Ploy S.",
  "updatedDate": "2026-10-14",
  "contactCount": 3,
  "noteCount": 5,
  "dealCount": 1,
  "nextAction": {
    "action": "Send revised pilot proposal",
    "dueDate": "2026-10-18",
    "contactName": "Dr. Somchai Prasert"
  }
}
```

---

### 1.3 POST `/api/accounts`
Creates a new account from writable fields.

* **Validation Rules**:
  * `name`: string, required, max 200 characters.
  * `businessLine`: enum (`Healthcare` | `Financial Advisory` | `Networking & Partnerships`), required.
  * `categoryId`: string, required.
  * `serviceId`: string, required.
  * `tier`: enum (`TIER_1` | `TIER_2` | `TIER_3`), required.
  * `ownerId`: string, required.
  * `websiteUrl`: string, optional, must be a valid HTTP or HTTPS URL if provided.
  * `note`: string, optional, max 2000 characters.
  * `subCategoryId`, `dealSide`, `country`, `sourceRef`, `status`: optional.

* **Request JSON**:
```json
{
  "name": "Bangkok General Health",
  "businessLine": "Healthcare",
  "country": "Thailand",
  "websiteUrl": "https://bgh.example.com",
  "categoryId": "cat-hosp",
  "subCategoryId": "sub-listed",
  "tier": "TIER_1",
  "ownerId": "usr-ploy",
  "status": "ACTIVE",
  "dealSide": "BUY_SIDE",
  "serviceId": "srv-partnerships",
  "sourceRef": "Regional Healthcare Summit",
  "note": "Leading healthcare network expanding specialized oncology centers."
}
```

* **Response JSON (`201 Created`)**: Returns the saved Account object with generated `id`, `createdBy`, `createdDate`, `updatedBy`, `updatedDate`.

---

### 1.4 PUT `/api/accounts/{id}`
Updates existing account details.

* **Path Parameters**: `id` (string) — The unique Account ID.
* **Request JSON**: Partial or complete writable fields payload.
* **Response JSON (`200 OK`)**: Returns the updated Account object with refreshed `updatedBy` and `updatedDate`.

---

### 1.5 GET `/api/accounts/{id}/contacts`
Retrieves all decision-makers and contacts associated with the given account (`companyId = id`).

* **Response JSON (`200 OK`)**:
```json
[
  {
    "id": "cnt-001",
    "companyId": "acc-001",
    "name": "Dr. Somchai Prasert",
    "targetRole": "Chief Medical Officer",
    "tier": "TIER_1",
    "relationshipStatus": "HOT",
    "nextStep": "Finalize terms for telehealth pilot across 3 flagship hospitals",
    "nextFollowUpDate": "2026-10-18",
    "email": "somchai.p@siamcare.th",
    "isClosed": false
  }
]
```

---

### 1.6 GET & POST `/api/accounts/{id}/notes`
Retrieves and creates activity notes for the specified account (sorted newest first).

* **GET Response JSON (`200 OK`)**:
```json
[
  {
    "id": "note-001",
    "accountId": "acc-001",
    "authorName": "Ploy S.",
    "createdDate": "2026-10-14",
    "text": "Executive steering committee agreed on revised governance structure. Final term sheet pending partner sign-off."
  }
]
```

* **POST Request JSON**:
```json
{
  "text": "Client CFO confirmed board approval on initial feasibility scope."
}
```
* **POST Response JSON (`201 Created`)**: Returns the newly appended `AccountNote` object.

---

### 1.7 GET `/api/accounts/{id}/deals`
*Note: Placeholder shape pending official backend deal pipeline data model.*

* **Response JSON (`200 OK`)**:
```json
[
  {
    "id": "deal-001",
    "accountId": "acc-001",
    "name": "APAC Telehealth & Diagnostic Alliance",
    "stage": "PROPOSAL",
    "value": 3500000
  }
]
```

---

### 1.8 GET `/api/accounts/lookups`
Retrieves all reference metadata needed for populating search filters and form dropdowns in a single round-trip.

* **Response JSON (`200 OK`)**:
```json
{
  "businessLines": [
    "Healthcare",
    "Financial Advisory",
    "Networking & Partnerships"
  ],
  "categories": [
    { "id": "cat-hosp", "name": "Hospitals / Providers" },
    { "id": "cat-pharma", "name": "Pharmaceuticals & Biotech" },
    { "id": "cat-pe", "name": "Private Equity & Funds" },
    { "id": "cat-medtech", "name": "MedTech & Devices" }
  ],
  "subCategories": [
    { "id": "sub-listed", "categoryId": "cat-hosp", "name": "Listed group" },
    { "id": "sub-single", "categoryId": "cat-hosp", "name": "Single hospital system" },
    { "id": "sub-specialty", "categoryId": "cat-hosp", "name": "Specialty medical center" }
  ],
  "services": [
    { "id": "srv-ma", "name": "M&A Advisory" },
    { "id": "srv-cdd", "name": "Commercial Due Diligence" },
    { "id": "srv-partnerships", "name": "Strategic Partnerships" },
    { "id": "srv-market-entry", "name": "Cross-Border Market Entry" }
  ],
  "owners": [
    { "id": "usr-ploy", "name": "Ploy S.", "code": "PS", "username": "ploy_admin", "photoUrl": null },
    { "id": "usr-1", "name": "Sarah Jenkins", "code": "SJ", "username": "sarah_j", "photoUrl": null }
  ],
  "tiers": ["TIER_1", "TIER_2", "TIER_3"],
  "dealSides": ["BUY_SIDE", "SELL_SIDE"],
  "countries": [
    "Thailand", "Singapore", "United States", "United Kingdom",
    "Switzerland", "Germany", "Japan", "France", "Australia", "Canada"
  ],
  "statuses": ["ACTIVE", "INACTIVE"]
}
```

* **Role-Based Owner Visibility Rules**:
  * **ADMIN**: The `owners` array returns all active users, including their `username` (needed for Excel import template generation and account owner reassignment).
  * **MEMBER**: The `owners` array returns **only the authenticated member themselves** (without `username`), ensuring colleagues' user data is not leaked.
  * **VIEWER**: The `owners` array returns active users with `id`, `name`, `code`, and `photoUrl` only (never `username`, `email`, or `phone`).
  * **Dropdowns & Filters**: The standalone `/api/users/options` endpoint strictly returns `{ id, name, code, photoUrl }` for all roles.

---

## 2. Data Model & ER Mapping

| Frontend Property | DB Column (ER Entity) | Data Type | Constraints / Notes |
| :--- | :--- | :--- | :--- |
| `id` | `ACCOUNT.id` | VARCHAR(64) | Primary Key. |
| `name` | `ACCOUNT.name` | VARCHAR(200) | Required. Indexed. |
| `businessLine` | `ACCOUNT.business_line` | VARCHAR(50) | Healthcare / Financial Advisory / Networking & Partnerships. |
| `country` | `ACCOUNT.country` | VARCHAR(100) | Optional. |
| `websiteUrl` | `ACCOUNT.website_url` | VARCHAR(500) | Valid URL format. |
| `categoryId` | `ACCOUNT.category_id` | VARCHAR(64) | Foreign Key -> `CATEGORY.id`. Required. |
| `subCategoryId` | `ACCOUNT.sub_category_id` | VARCHAR(64) | Foreign Key -> `SUB_CATEGORY.id`. Optional. |
| `tier` | `ACCOUNT.tier` | VARCHAR(20) | Enum: `TIER_1`, `TIER_2`, `TIER_3`. Required. |
| `ownerId` | `ACCOUNT.owner_id` | VARCHAR(64) | Foreign Key -> `USER.id`. Required. |
| `status` | `ACCOUNT.status` | VARCHAR(20) | Enum: `ACTIVE`, `INACTIVE` (TBD). Required. |
| `dealSide` | `ACCOUNT.deal_side` | VARCHAR(20) | Enum: `BUY_SIDE`, `SELL_SIDE`. Optional. |
| `serviceId` | `ACCOUNT.service_id` | VARCHAR(64) | Foreign Key -> `SERVICE.id`. Required. |
| `sourceRef` | `ACCOUNT.source_ref` | VARCHAR(255) | Optional. |
| `note` | `ACCOUNT.note` | TEXT | Optional, max 2000 chars. |
| `createdBy` | `ACCOUNT.created_by` | VARCHAR(64) | Foreign Key -> `USER.id`. |
| `createdDate` | `ACCOUNT.created_date` | DATE | `YYYY-MM-DD`. |
| `updatedBy` | `ACCOUNT.updated_by` | VARCHAR(64) | Foreign Key -> `USER.id`. |
| `updatedDate` | `ACCOUNT.updated_date` | DATE | `YYYY-MM-DD`. |

> **Security Note on USER table**: The database `USER` entity contains `username` and `password_hash`. These are strictly prohibited from being returned by any lookups, account detail queries, or error messages in this module.

---

## 3. Standard Validation Error Structure

Whenever a request fails client-side or server-side schema constraints (HTTP 400 Bad Request):
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for account payload",
  "errors": [
    {
      "field": "name",
      "message": "Account name is required"
    },
    {
      "field": "websiteUrl",
      "message": "Must be a valid HTTP or HTTPS URL"
    }
  ]
}
```
The React frontend maps each error item directly beneath its respective field input.

---

## 4. Users and Permissions Endpoints

### 4.1 GET `/api/me`
Retrieves the currently authenticated user's profile, contact details, and account status.

* **Response JSON (`200 OK`)**:
```json
{
  "id": "usr-ploy",
  "name": "Ploy S.",
  "username": "ploy.s",
  "code": "PS",
  "role": "ADMIN",
  "status": "ACTIVE",
  "email": "ploy.s@saga-consulting.com",
  "phone": "+66 81 234 5678",
  "photoUrl": "https://saga-storage.blob.core.windows.net/avatars/usr-ploy.jpg"
}
```

---

### 4.2 PUT `/api/me`
Self-service profile update allowed for all authenticated roles (`ADMIN`, `MEMBER`, `VIEWER`). Allows updating display name, email, and phone only.

* **Security & Business Rules**:
  * Request body contains **ONLY** `{ name, email, phone }` (`UpdateMyProfileDTO`).
  * The server strictly ignores or rejects `username`, `code`, `role`, and `status`: a user can never alter their own credentials, initials code, or role (preventing privilege escalation) or status (preventing unauthorized self-reactivation) through this endpoint. Role and status management is strictly reserved for administrators via `/api/users/{id}`.
  * Validation:
    * `name`: required, maximum 100 characters.
    * `email`: optional, valid email format, maximum 254 characters, stored lower-case. An empty string is stored as `null`.
    * `phone`: optional, maximum 20 characters, digits, spaces, `+`, `-`, `(`, `)` allowed, minimum 7 digits. An empty string is stored as `null`.

* **Request JSON**:
```json
{
  "name": "Ploy Suvarnaprathip",
  "email": "ploy.s@saga-consulting.com",
  "phone": "+66 81 234 5678"
}
```

* **Response JSON (`200 OK`)**: Returns updated `/api/me` user object.
```json
{
  "id": "usr-ploy",
  "name": "Ploy Suvarnaprathip",
  "username": "ploy.s",
  "code": "PS",
  "role": "ADMIN",
  "status": "ACTIVE",
  "email": "ploy.s@saga-consulting.com",
  "phone": "+66 81 234 5678",
  "photoUrl": "https://saga-storage.blob.core.windows.net/avatars/usr-ploy.jpg"
}
```

* **Error Response (`400 Bad Request`)**:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for profile payload",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

---

### 4.3 POST `/api/me/photo`
Self-service profile photo upload (`multipart/form-data`, form field name: `"file"`).

* **Validation Rules**:
  * Content-Type: `image/jpeg`, `image/png`, or `image/webp`.
  * Max size: 2 MB (2,097,152 bytes).
  * Aspect ratio: Square image (width equals height).
  * Backend storage: In production, the file is saved to cloud object storage (e.g., Azure Blob Storage) and a permanent URL is stored in the database. `photoUrl` is ALWAYS a URL string, NEVER raw base64 inside JSON responses.

* **Response JSON (`200 OK`)**:
```json
{
  "photoUrl": "https://saga-storage.blob.core.windows.net/avatars/usr-ploy.jpg"
}
```

* **Error Response (`400 Bad Request`)**:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Image must be square",
  "errors": [
    {
      "field": "file",
      "message": "Image must be square (width equals height)"
    }
  ]
}
```

---

### 4.4 DELETE `/api/me/photo`
Self-service profile photo removal for the authenticated user. Sets `photoUrl` to `null`.

* **Response**: `204 No Content`.

---

### 4.5 GET `/api/users`
Paginated search and filter across users (requires `user.manage` permission). User items include `email`, `phone`, and `photoUrl`.

* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `q` | `string` | No | `""` | Search on `name`, `username`, and `code`. |
  | `role` | `string` | No | — | Filter by Role (`ADMIN`, `MEMBER`, `VIEWER`). |
  | `status` | `string` | No | — | Filter by Status (`ACTIVE`, `INACTIVE`). |
  | `page` | `integer` | No | `0` | 0-based page index. |
  | `size` | `integer` | No | `10` | Page size (10, 20, 50). |
  | `sort` | `string` | No | `name,asc` | Format `field,asc` or `field,desc`. Allowed fields: `name`, `updatedDate`. |

* **Response JSON (`200 OK`)**:
```json
{
  "content": [
    {
      "id": "usr-ploy",
      "name": "Ploy S.",
      "code": "PS",
      "username": "ploy.s",
      "role": "ADMIN",
      "status": "ACTIVE",
      "email": "ploy.s@saga-consulting.com",
      "phone": "+66 81 234 5678",
      "photoUrl": null,
      "permissions": [
        "dashboard.view",
        "accounts.view",
        "account.create",
        "account.edit",
        "account.reassignOwner",
        "contacts.view",
        "lookup.manage",
        "user.manage"
      ],
      "accountCount": 1,
      "contactCount": 3,
      "updatedDate": "2026-10-14"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 7,
  "totalPages": 1
}
```

---

### 4.6 GET `/api/users/options`
Retrieves ACTIVE users for populating ownership dropdowns. Exposes `id`, `name`, `code`, and `photoUrl` ONLY. Never exposes `email` or `phone`.

* **Response JSON (`200 OK`)**:
```json
[
  { "id": "usr-ploy", "name": "Ploy S.", "code": "PS", "photoUrl": null },
  { "id": "usr-1", "name": "Sarah Jenkins", "code": "SJ", "photoUrl": null }
]
```

---

### 4.7 GET `/api/users/{id}`
Retrieves full user detail by ID (requires `user.manage` permission).

* **Response JSON (`200 OK`)**:
```json
{
  "id": "usr-1",
  "name": "Sarah Jenkins",
  "code": "SJ",
  "username": "sarah.j",
  "role": "MEMBER",
  "status": "ACTIVE",
  "email": "sarah.j@saga-consulting.com",
  "phone": "+66 82 345 6789",
  "photoUrl": null,
  "permissions": [
    "dashboard.view",
    "accounts.view",
    "account.create",
    "account.edit",
    "contacts.view"
  ],
  "accountCount": 27,
  "contactCount": 14,
  "createdDate": "2026-06-01",
  "updatedDate": "2026-10-12"
}
```

---

### 4.8 POST `/api/users`
Creates a new user profile with password, optional contact details, and role (requires `user.manage` permission). An administrator cannot upload or set another user's profile photo.

* **Validation Rules**:
  * `name`: required, max 100 characters.
  * `code`: optional, max 20 characters, unique if provided.
  * `username`: required, 3-50 characters, letters, numbers, dots, and underscores only, unique (case-insensitive).
  * `password`: required, minimum 8 characters with at least one letter and one number.
  * `email`: optional, max 254 characters, valid email format.
  * `phone`: optional, max 20 characters, digits, spaces, `+`, `-`, `(`, `)` allowed, minimum 7 digits.
  * `role`: required (`ADMIN`, `MEMBER`, `VIEWER`).
  * `status`: default `ACTIVE`.
  * `permissions`: array of permission action strings.

* **Request JSON**:
```json
{
  "name": "Daniel Thorne",
  "code": "DT",
  "username": "daniel.t",
  "password": "Password123!",
  "email": "daniel.t@saga-consulting.com",
  "phone": "+66 89 123 4567",
  "role": "MEMBER",
  "status": "ACTIVE",
  "permissions": [
    "dashboard.view",
    "accounts.view",
    "account.create",
    "account.edit",
    "contacts.view"
  ]
}
```
* **Response JSON (`201 Created`)**: Returns created User object (without password).

---

### 4.9 PUT `/api/users/{id}`
Full update of an existing user's profile, contact info, and assigned role (requires `user.manage` permission). An administrator cannot upload or change another user's profile photo.

* **Validation Rules**:
  * `name`: required, 1-100 characters.
  * `code`: optional, max 20 characters, unique if provided.
  * `username`: required, 3-50 characters, letters, numbers, dots, and underscores only, unique (case-insensitive).
  * `email`: optional, max 254 characters, valid email format.
  * `phone`: optional, max 20 characters, digits, spaces, `+`, `-`, `(`, `)` allowed, minimum 7 digits.
  * `role`: required (`ADMIN`, `MEMBER`, `VIEWER`).
  * `status`: required (`ACTIVE`, `INACTIVE`).

* **Request JSON**:
```json
{
  "name": "Daniel Thorne",
  "code": "DT",
  "username": "daniel.t",
  "email": "daniel.t@saga-consulting.com",
  "phone": "+66 89 123 4567",
  "role": "MEMBER",
  "status": "ACTIVE"
}
```
* **Response JSON (`200 OK`)**: Returns updated User object.

---

### 4.10 PATCH `/api/users/{id}/status`
Quick Activate / Deactivate status toggle action (requires `user.manage` permission).

* **Validation Rules**:
  * `status`: required, must be either `ACTIVE` or `INACTIVE`.
  * Cannot deactivate your own active user account (returns `409 Conflict`).
  * Cannot deactivate the last remaining active Administrator in the system (returns `409 Conflict`).

* **Request JSON**:
```json
{
  "status": "INACTIVE"
}
```
* **Response JSON (`200 OK`)**: Returns updated User object with new status and updatedDate.

---

### 4.11 POST `/api/users/{id}/reset-password`
Admin action to set a new password for a user without seeing the current password (requires `user.manage` permission).

* **Request JSON**:
```json
{
  "newPassword": "NewSecurePassword123!"
}
```
* **Response**: `204 No Content`.

---

### 4.12 POST `/api/me/change-password`
Self-service password update for any authenticated user.

* **Request JSON**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "MyBrandNewPassword2026!"
}
```
* **Response**: `204 No Content` or `400 Bad Request` with field error on `currentPassword` if incorrect.

---

### 4.13 Error Codes & Business Conflict Rules

| Status | Code / Error | Condition | Example Response |
|---|---|---|---|
| `400` | Bad Request | Validation failures (e.g. invalid username regex, short password) | `{ "status": 400, "error": "Bad Request", "errors": [{ "field": "password", "message": "Password must be at least 8 characters long" }] }` |
| `403` | Forbidden | User role lacks `user.manage` permission | `{ "status": 403, "error": "Forbidden", "message": "Access denied. You do not have permission to manage users." }` |
| `409` | Conflict | Attempting to deactivate oneself (via PUT or PATCH status) | `{ "status": 409, "error": "Conflict", "message": "You cannot deactivate your own active account." }` |
| `409` | Conflict | Attempting to deactivate or demote the last remaining active Admin (via PUT or PATCH status) | `{ "status": 409, "error": "Conflict", "message": "Cannot deactivate or demote the only active Administrator in the system." }` |

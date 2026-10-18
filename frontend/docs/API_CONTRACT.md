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
   - [1.9 GET /api/accounts/export (Export Accounts)](#19-get-apiaccountsexport)
   - [1.10 POST /api/accounts/import (Validate & Commit Spreadsheet Rows)](#110-post-apiaccountsimport)
   - [1.11 Import File Format Specification](#111-import-file-format-specification)
2. [Data Model & ER Mapping](#2-data-model--er-mapping)
3. [Standard Validation Error Structure](#3-standard-validation-error-structure)
4. [Users & Permissions Endpoints](#4-users--permissions-endpoints)
   - [4.1 GET /api/me (Current Authenticated User)](#41-get-apime)
   - [4.2 PUT /api/me (Self-Service Profile Update)](#42-put-apime)
   - [4.3 POST /api/me/photo (Upload Profile Photo)](#43-post-apimephoto)
   - [4.4 DELETE /api/me/photo (Remove Profile Photo)](#44-delete-apimephoto)
   - [4.5 GET /api/users (Paginated List - Scoped by Role)](#45-get-apiusers)
   - [4.6 GET /api/users/options (Lookup Dropdowns)](#46-get-apiusersoptions)
   - [4.7 GET /api/users/{id} (User Detail)](#47-get-apiusersid)
   - [4.8 POST /api/users (Create User)](#48-post-apiusers)
   - [4.9 PUT /api/users/{id} (Update User Profile & Role)](#49-put-apiusersid)
   - [4.10 PATCH /api/users/{id}/status (Status Toggle)](#410-patch-apiusersidstatus)
   - [4.11 POST /api/users/{id}/reset-password (Admin Password Reset)](#411-post-apiusersidreset-password)
   - [4.12 POST /api/me/change-password (Self Password Change)](#412-post-apimechange-password)
   - [4.13 Error Codes & Business Conflict Rules](#413-error-codes--business-conflict-rules)

---

## 1. Accounts Module Endpoints

### 1.1 GET `/api/accounts`
Retrieves a paginated list of accounts with comprehensive filtering, text searching, and sorting.

* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `q` | `string` | No | `""` | Case-insensitive search on `name`, `websiteUrl`, and `country`. |
  | `businessLine`| `string` | No | — | Filter by business line (`Healthcare`, `Financial Advisory`, `Networking & Partnerships`). |
  | `categoryId` | `string` | No | — | Filter by Category ID. When changed or cleared, `subCategoryId` must be reset. |
  | `subCategoryId` | `string` | No | — | Filter by Sub-Category ID. **Dependent on `categoryId`**: Cannot be filtered without `categoryId`. Must belong to the chosen `categoryId`. |
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
Retrieves and creates history notes for the specified account (sorted newest first). In the UI, this is labeled **"Add History Note"** and is dedicated to logging records and outcomes of past activities and interactions.

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

### 1.9 GET `/api/accounts/export`
Exports all accounts matching current query and filter parameters (ignoring pagination `page` and `size`) up to a hard ceiling of 10,000 accounts.

* **Permissions**: Requires `account.export` (`ADMIN` or `MEMBER`). Calls without permission return HTTP `403 Forbidden`.
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `format` | `string` | **Yes** | `xlsx` | Target file format: `xlsx` (Excel workbook) or `csv` (Comma-separated values). |
  | `q` | `string` | No | `""` | Search query for name, country, or website. |
  | `businessLine` | `string` | No | — | Filter by business line. |
  | `categoryId` | `string` | No | — | Filter by category ID. |
  | `subCategoryId` | `string` | No | — | Filter by sub-category ID. |
  | `serviceId` | `string` | No | — | Filter by service ID. |
  | `tier` | `string` | No | — | Filter by tier. |
  | `dealSide` | `string` | No | — | Filter by deal side. |
  | `ownerId` | `string` | No | — | Filter by owner ID. |
  | `country` | `string` | No | — | Filter by country. |
  | `status` | `string` | No | — | Filter by status (`ACTIVE`, `INACTIVE`). |
  | `sort` | `string` | No | `updatedDate,desc` | Sort field and order (`name`, `tier`, `nextFollowUpDate`, `updatedDate`). |

* **Limits & Errors**:
  * Exceeding 10,000 matching rows returns HTTP `400 Bad Request`:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Export limit exceeded. Maximum 10,000 accounts can be exported at once. Please narrow your filters."
    }
    ```
* **Security & Formatting**:
  * **CSV Formula-Injection Protection**: In CSV exports, any cell beginning with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`). This prevents dynamic data exchange (DDE) and code execution in spreadsheet software.
  * **XLSX Cell Types**: In XLSX exports, all text cells are explicitly typed as string (`t: 's'`), preventing spreadsheet applications from executing formulas.
  * **UTF-8 with BOM**: CSV exports begin with the UTF-8 Byte Order Mark (`0xEF, 0xBB, 0xBF`) to ensure characters in non-Latin scripts (e.g. Thai, Japanese, Burmese) render correctly in Microsoft Excel on Windows.
  * **Headers**:
    * `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (for `xlsx`) or `text/csv; charset=utf-8` (for `csv`).
    * `Content-Disposition`: `attachment; filename="accounts-YYYY-MM-DD.xlsx"` (or `.csv`).

---

### 1.10 POST `/api/accounts/import`
Processes and commits a validated batch of account rows extracted from a spreadsheet upload.

* **Permissions**: Requires `account.import` (`ADMIN` or `MEMBER`). Calls without permission return HTTP `403 Forbidden`.
* **Limits**: Maximum **500 rows** per import request (excluding header row). Larger files must be split.
* **Execution Modes**:
  * `mode: "VALIDATE"`: Runs all business rules and duplicate checks without committing any data to the database. Returns per-row validation statuses.
  * `mode: "COMMIT"`: Commits all valid and non-skipped rows to the database. Valid accounts are created; erroneous or skipped rows do not block valid rows (partial import model).
* **Duplicate Handling**:
  * `duplicatePolicy: "SKIP"` (Default): If an account with the same name (case-insensitive, trimmed) already exists in CRM or appears earlier in the current batch, the row is skipped (`status: "SKIPPED"`).
  * `duplicatePolicy: "ALLOW"`: Imports duplicate accounts regardless of name collision.
* **MEMBER Role Security**:
  * When called by a user with role `MEMBER`, the `ownerId` must match the caller's own user ID or be omitted (which defaults to the caller). If a `MEMBER` submits a row assigned to another owner, the row fails with: `"Only an admin can assign other owners"`.
* **Request JSON**:
```json
{
  "mode": "COMMIT",
  "duplicatePolicy": "SKIP",
  "rows": [
    {
      "rowNumber": 2,
      "name": "Bangkok General Health",
      "businessLine": "Healthcare",
      "categoryId": "cat-hosp",
      "subCategoryId": "sub-listed",
      "serviceId": "srv-partnerships",
      "tier": "TIER_1",
      "ownerId": "usr-ploy",
      "dealSide": "BUY_SIDE",
      "country": "Thailand",
      "websiteUrl": "https://bgh.example.com",
      "sourceRef": "Healthcare Summit 2026",
      "note": "Leading private hospital network.",
      "status": "ACTIVE"
    }
  ]
}
```
* **Response JSON (`200 OK`)**:
```json
{
  "total": 50,
  "created": 47,
  "skipped": 2,
  "failed": 1,
  "results": [
    {
      "rowNumber": 2,
      "status": "CREATED",
      "accountId": "acc-imp-1729250000000-2"
    },
    {
      "rowNumber": 3,
      "status": "SKIPPED"
    },
    {
      "rowNumber": 4,
      "status": "ERROR",
      "errors": [
        {
          "field": "serviceId",
          "message": "Service not found"
        }
      ]
    }
  ]
}
```

---

### 1.11 Import File Format Specification

The frontend import wizard parses spreadsheets client-side via SheetJS and validates them against CRM metadata before calling `POST /api/accounts/import`.

* **Supported File Extensions**: `.xlsx`, `.xlsm`, `.xlsb`, `.xls`, `.ods`, `.csv`, `.tsv`
* **File Size Ceiling**: Maximum **5 MB** (5,242,880 bytes).
* **Row Ceiling**: Maximum **500 data rows** per file (excluding header row).
* **Multi-Sheet Workbooks**: Users select which sheet to import via a dropdown (defaults to sheet named `"Accounts"` or the first sheet).
* **Password-Protected Files**: Detected during parsing; prompts: *"This file is password-protected. Remove the password and try again."*
* **Formula Handling**: Formulas are preserved as literal text without evaluation.
* **Column Definitions (13 standard columns + 3 export-only columns)**:

| # | Column Name | Required | Lookup / Normalization | Accepted Formats / Aliases | Constraints |
|---|---|---|---|---|---|
| 1 | `Name*` | **Yes** | — | `Account Name`, `Company`, `Company Name` | Max 200 chars. |
| 2 | `Business line*` | **Yes** | Exact | `Business Line`, `Line of Business` | Must match: `Healthcare`, `Financial Advisory`, `Networking & Partnerships`. |
| 3 | `Category*` | **Yes** | Case-insensitive lookup | `Category`, `Industry` | Must match an existing Category name. |
| 4 | `Sub-category` | No | Case-insensitive lookup | `Sub Category`, `Subcategory` | If provided, must belong to the matched Category. |
| 5 | `Service*` | **Yes** | Case-insensitive lookup | `Service`, `Practice` | Must match an existing Service name. |
| 6 | `Tier*` | **Yes** | Case-insensitive | `Tier`, `Priority Tier` | `TIER_1`, `TIER_2`, `TIER_3`, `Tier 1`, `T1`, `1`. |
| 7 | `Owner username` | No | Case-insensitive lookup | `Owner`, `Account Owner`, `Owner Username` | Matched by username or name. For `MEMBER`, must be self or empty. |
| 8 | `Deal side` | No | Case-insensitive | `Deal Side`, `Side` | `BUY_SIDE`, `SELL_SIDE`, `Buy-Side`, `Sell-Side`, `Buy`, `Sell`. |
| 9 | `Country` | No | String | `Country`, `Nation` | Max 100 chars. Defaults to Thailand if blank. |
| 10 | `Website` | No | URL | `Website`, `Website URL`, `URL` | Max 500 chars. Must begin with `http://` or `https://`. |
| 11 | `Source reference` | No | String | `Source Reference`, `Source`, `Lead Source` | Max 255 chars. |
| 12 | `Note` | No | String | `Note`, `Notes`, `Remarks`, `Description` | Max 2000 chars. |
| 13 | `Status` | No | Case-insensitive | `Status`, `Account Status` | `ACTIVE`, `INACTIVE`. Defaults to `ACTIVE` if blank. |
| 14 | `Next follow-up` | *Export only* | Date | — | Formatted as `YYYY-MM-DD` or empty. |
| 15 | `Created date` | *Export only* | Date | — | Formatted as `YYYY-MM-DD`. |
| 16 | `Updated date` | *Export only* | Date | — | Formatted as `YYYY-MM-DD`. |

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

### 2.2 Users Entity Mapping (`users` Table)

| Frontend Property | DB Column (`users` Entity) | Data Type | Constraints / Notes |
| :--- | :--- | :--- | :--- |
| `id` | `id` | VARCHAR(36) | Primary Key (`usr-super`, `usr-ploy`, `usr-1` etc.). |
| `name` | `name` | VARCHAR(100) | Required. |
| `code` | `code` | VARCHAR(20) | Optional, unique initials code. |
| `username` | `username` | VARCHAR(50) | Required, unique, case-insensitive. |
| `email` | `email` | VARCHAR(254) | Required, unique, valid email format. |
| `phone` | `phone` | VARCHAR(20) | Optional. |
| `photoUrl` | `photo_url` | VARCHAR(500) | Permanent storage URL, square image. |
| `role` | `role` | VARCHAR(20) | Enum: `SUPER_ADMIN`, `ADMIN`, `MEMBER`. Exactly one `SUPER_ADMIN`. |
| `status` | `status` | VARCHAR(20) | Enum: `ACTIVE`, `INACTIVE`. |
| `managerId` | `manager_id` | VARCHAR(36) | Foreign Key -> `users(id)`. NULL for `SUPER_ADMIN` and `ADMIN`. Required for `MEMBER`. |
| `createdDate` | `created_date` | TIMESTAMP | ISO 8601 UTC timestamp. |
| `updatedDate` | `updated_date` | TIMESTAMP | ISO 8601 UTC timestamp. |

> **Security Note on USER table**: The database `users` entity contains `password_hash`. This is strictly prohibited from being returned by any lookups, account detail queries, or user detail queries. Passwords are exchanged exclusively during login, initial creation, and password reset/change.

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

## 4. Users & Permissions Endpoints

> **Note on Authentication**: Authentication and the login flow are owned and managed by the dedicated authentication module. The endpoints below govern user profile retrieval (`/api/me`), self-service profile updates, and role-based user administration (`/api/users`).

---

### 4.1 GET `/api/me`
Retrieves the currently authenticated user's profile, contact details, account status, and parent manager info.

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
  "photoUrl": "https://saga-storage.blob.core.windows.net/avatars/usr-ploy.jpg",
  "managerId": null,
  "managerName": null,
  "permissions": [
    "dashboard.view",
    "accounts.view",
    "account.create",
    "account.edit",
    "account.reassignOwner",
    "account.template",
    "account.import",
    "account.export",
    "contacts.view",
    "lookup.manage",
    "user.manage"
  ]
}
```

---

### 4.2 PUT `/api/me`
Self-service profile update allowed for all authenticated roles (`SUPER_ADMIN`, `ADMIN`, `MEMBER`). Allows updating display name, email, and phone only.

* **Security & Business Rules**:
  * Request body contains **ONLY** `{ name, email, phone }` (`UpdateMyProfileDTO`).
  * `email` is strictly **required** (cannot be empty or null), must be valid format, max 254 chars, and unique across all users.
  * The server strictly ignores or rejects `username`, `code`, `role`, `managerId`, and `status`.
  * If the updated email conflicts with another user's email, returns `409 Conflict`.

* **Request JSON**:
```json
{
  "name": "Ploy Suvarnaprathip",
  "email": "ploy.s@saga-consulting.com",
  "phone": "+66 81 234 5678"
}
```

* **Response JSON (`200 OK`)**: Returns updated `/api/me` user object.

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

---

### 4.4 DELETE `/api/me/photo`
Self-service profile photo removal for the authenticated user. Sets `photoUrl` to `null`.

* **Response**: `204 No Content`.

---

### 4.5 GET `/api/users`
Paginated search and filter across users (requires `user.manage` permission).

* **Role-Scoped Visibility**:
  * `SUPER_ADMIN`: Can see all users in the system. Can filter by `managerId` to inspect members belonging to a specific Admin.
  * `ADMIN`: Can see **self** PLUS all `MEMBER` users whose `managerId` equals the requesting Admin's ID (`managerId == currentAdmin.id`). Cannot see other Admins or other Admins' members.
  * `MEMBER`: Access denied (HTTP 403 Forbidden).

* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `q` | `string` | No | `""` | Search on `name`, `username`, and `code`. |
  | `role` | `string` | No | — | Filter by Role (`SUPER_ADMIN`, `ADMIN`, `MEMBER`). |
  | `status` | `string` | No | — | Filter by Status (`ACTIVE`, `INACTIVE`). |
  | `managerId`| `string` | No | — | Available to `SUPER_ADMIN` to filter members by their parent Admin. |
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
      "email": "ploy.s@saga-consulting.com",
      "phone": "+66 81 234 5678",
      "role": "ADMIN",
      "status": "ACTIVE",
      "managerId": null,
      "managerName": null,
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
    },
    {
      "id": "usr-1",
      "name": "Sarah Jenkins",
      "code": "SJ",
      "username": "sarah.j",
      "email": "sarah.j@saga-consulting.com",
      "phone": "+66 82 345 6789",
      "role": "MEMBER",
      "status": "ACTIVE",
      "managerId": "usr-ploy",
      "managerName": "Ploy S.",
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
      "updatedDate": "2026-10-12"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1
}
```

---

### 4.6 GET `/api/users/options`
Retrieves ACTIVE users for populating ownership dropdowns. Exposes `id`, `name`, `code`, and `photoUrl` ONLY. Never exposes `email` or `phone`.

* **Response JSON (`200 OK`)**:
```json
[
  { "id": "usr-super", "name": "Alex Mercer", "code": "AM", "photoUrl": null },
  { "id": "usr-ploy", "name": "Ploy S.", "code": "PS", "photoUrl": null },
  { "id": "usr-1", "name": "Sarah Jenkins", "code": "SJ", "photoUrl": null }
]
```

---

### 4.7 GET `/api/users/{id}`
Retrieves full user detail by ID (requires `user.manage` permission). Scoped so Admins can inspect only self or their assigned members.

* **Response JSON (`200 OK`)**:
```json
{
  "id": "usr-1",
  "name": "Sarah Jenkins",
  "code": "SJ",
  "username": "sarah.j",
  "email": "sarah.j@saga-consulting.com",
  "phone": "+66 82 345 6789",
  "role": "MEMBER",
  "status": "ACTIVE",
  "managerId": "usr-ploy",
  "managerName": "Ploy S.",
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
Creates a new user profile with password, mandatory email, and role assignment.

* **Operational Rules**:
  * `SUPER_ADMIN` can create `ADMIN` or `MEMBER` users. When creating a `MEMBER`, `managerId` must specify an active `ADMIN`. When creating an `ADMIN`, `managerId` is `null`.
  * `ADMIN` can create **only** `MEMBER` users. `managerId` is automatically assigned to the creating Admin (`currentAdmin.id`).
  * `SUPER_ADMIN` accounts **cannot** be created through this endpoint (exactly one Super Admin exists).
* **Validation Rules**:
  * `name`: required, 1-100 characters.
  * `code`: optional, max 20 characters, unique (returns `409 Conflict` if duplicated).
  * `username`: required, 3-50 characters, letters, numbers, dots, and underscores only, unique (returns `409 Conflict` if duplicated).
  * `email`: **required**, max 254 characters, valid email regex, unique (returns `409 Conflict` if duplicated).
  * `password`: required, minimum 8 characters with at least one letter and one number.
  * `phone`: optional, max 20 characters, minimum 7 digits.
  * `role`: required, must be either `ADMIN` or `MEMBER`.
  * `managerId`: required for `MEMBER` when created by `SUPER_ADMIN`; ignored or defaulted to `currentAdmin.id` when created by `ADMIN`.

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
  "managerId": "usr-ploy",
  "status": "ACTIVE"
}
```
* **Response JSON (`201 Created`)**: Returns created User object (without password).

---

### 4.9 PUT `/api/users/{id}`
Full update of an existing user's profile, contact info, and assigned role.

* **Operational Rules**:
  * Admins can update only their own assigned members.
  * Super Admin can update any Admin or Member, including reassigning a Member's `managerId` to another Admin.
  * The `SUPER_ADMIN` account cannot have its role changed or be demoted (returns `409 Conflict`).
* **Validation Rules**:
  * `name`: required, 1-100 characters.
  * `code`: optional, unique.
  * `username`: required, 3-50 characters, unique.
  * `email`: **required**, valid format, unique.
  * `phone`: optional.
  * `role`: required (`ADMIN`, `MEMBER`).
  * `status`: required (`ACTIVE`, `INACTIVE`).
  * `managerId`: optional / required for members.

* **Request JSON**:
```json
{
  "name": "Daniel Thorne",
  "code": "DT",
  "username": "daniel.t",
  "email": "daniel.t@saga-consulting.com",
  "phone": "+66 89 123 4567",
  "role": "MEMBER",
  "managerId": "usr-ploy",
  "status": "ACTIVE"
}
```
* **Response JSON (`200 OK`)**: Returns updated User object.

---

### 4.10 PATCH `/api/users/{id}/status`
Quick Activate / Deactivate status toggle action (requires `user.manage` permission).

* **Validation & Conflict Rules**:
  * `status`: required, must be either `ACTIVE` or `INACTIVE`.
  * Cannot deactivate your own active user account (returns `409 Conflict`).
  * Cannot deactivate the root `SUPER_ADMIN` account (returns `409 Conflict`).
  * Admins can only toggle status of their assigned members (returns `403 Forbidden` if targeting other users).

* **Request JSON**:
```json
{
  "status": "INACTIVE"
}
```
* **Response JSON (`200 OK`)**: Returns updated User object with new status and updatedDate.

---

### 4.11 POST `/api/users/{id}/reset-password`
Admin action to set a new password for a managed user without seeing the current password (requires `user.manage` permission).

* **Validation Rules**:
  * `newPassword`: required, minimum 8 characters.
  * Admins can only reset passwords for their assigned members. Super Admin can reset for any Admin or Member.

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
| `400` | Bad Request | Validation failures (e.g. invalid email format, short password) | `{ "status": 400, "error": "Bad Request", "errors": [{ "field": "email", "message": "Email is required" }] }` |
| `401` | Unauthorized | Missing/expired JWT token, or inactive account credentials | `{ "status": 401, "error": "Unauthorized", "message": "Invalid username/email or password." }` |
| `403` | Forbidden | Member accessing `/api/users`, or Admin managing another Admin's user | `{ "status": 403, "error": "Forbidden", "message": "Access denied. You do not have permission to manage this user." }` |
| `409` | Conflict | Attempting to deactivate oneself (via PUT or PATCH status) | `{ "status": 409, "error": "Conflict", "message": "You cannot deactivate your own active account." }` |
| `409` | Conflict | Attempting to deactivate or demote the root `SUPER_ADMIN` | `{ "status": 409, "error": "Conflict", "message": "The Super Admin account cannot be deactivated or demoted." }` |
| `409` | Conflict | Email already registered to another user | `{ "status": 409, "error": "Conflict", "message": "Email 'sarah.j@saga-consulting.com' is already registered to another user." }` |
| `409` | Conflict | Username already taken | `{ "status": 409, "error": "Conflict", "message": "Username 'sarah.j' is already taken." }` |
| `409` | Conflict | Initials Code already in use | `{ "status": 409, "error": "Conflict", "message": "Initials Code 'SJ' is already in use." }` |


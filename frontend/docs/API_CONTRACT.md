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
5. [Contacts & Follow-Ups Module Endpoints](#5-contacts--follow-ups-module-endpoints)
   - [5.1 GET /api/contacts (Paginated List)](#51-get-apicontacts)
   - [5.2 GET /api/contacts/{id} (Contact Detail)](#52-get-apicontactsid)
   - [5.3 POST /api/contacts (Create Contact)](#53-post-apicontacts)
   - [5.4 PUT /api/contacts/{id} (Update Contact)](#54-put-apicontactsid)
   - [5.5 PATCH /api/contacts/{id}/close (Toggle Closed Engagement)](#55-patch-apicontactsidclose)
   - [5.6 DELETE /api/contacts/{id} (Delete Contact)](#56-delete-apicontactsid)
   - [5.7 GET /api/contacts/{id}/follow-ups (List Follow-Up Tasks)](#57-get-apicontactsidfollow-ups)
   - [5.8 POST /api/contacts/{id}/follow-ups (Create Follow-Up Task)](#58-post-apicontactsidfollow-ups)
   - [5.9 PUT /api/contacts/{id}/follow-ups/{followUpId} (Update Follow-Up Task)](#59-put-apicontactsidfollow-upsfollowupid)
   - [5.10 PATCH /api/contacts/{id}/follow-ups/{followUpId}/done (Mark Follow-Up Completed)](#510-patch-apicontactsidfollow-upsfollowupiddone)
   - [5.11 DELETE /api/contacts/{id}/follow-ups/{followUpId} (Delete Follow-Up Task)](#511-delete-apicontactsidfollow-upsfollowupid)
   - [5.12 POST /api/contacts/import (Validate & Commit Spreadsheet Rows)](#512-post-apicontactsimport)
   - [5.13 GET /api/contacts/export (Export Contacts Spreadsheet)](#513-get-apicontactsexport)
   - [5.14 Contact 18-Column Spreadsheet Format Specification](#514-contact-18-column-spreadsheet-format-specification)
   - [5.15 Error Codes & Business Conflict Rules](#515-error-codes--business-conflict-rules)

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

---

## 5. Contacts & Follow-Ups Module Endpoints

### 5.1 GET `/api/contacts`
Retrieves a paginated list of contacts with text search, relational filtering, and sorting.

* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `q` | `string` | No | `""` | Case-insensitive search across contact `name`, `targetRole`, and `email`. |
  | `companyId` | `string` | No | — | Filter by parent Account / Company ID. |
  | `tier` | `string` | No | — | Filter by Tier (`TIER_1`, `TIER_2`, `TIER_3`). |
  | `relationshipStatus` | `string` | No | — | Filter by Relationship Status (`HOT`, `WARM`, `COLD`). |
  | `status` | `string` | No | — | Filter by Status (`ACTIVE`, `INACTIVE`). |
  | `ownerId` | `string` | No | — | Filter by assigned Owner User ID. |
  | `isClosed` | `string` | No | `ALL` | Engagement filter: `ALL`, `OPEN` (`isClosed=false`), `CLOSED` (`isClosed=true`). |
  | `followUpSchedule` | `string` | No | — | Follow-up due urgency: `OVERDUE`, `DUE_TODAY`, `UPCOMING`, `NONE`. |
  | `page` | `integer` | No | `0` | **0-based** page index. |
  | `size` | `integer` | No | `10` | Page size (10, 20, 50). |
  | `sort` | `string` | No | `updatedDate,desc` | Format: `field,asc` or `field,desc`. Allowed fields: `name`, `tier`, `nextFollowUpDate`, `updatedDate`. |

* **Response JSON (`200 OK`)**:
```json
{
  "content": [
    {
      "id": "ct-001",
      "name": "Dr. Somchai Prasert",
      "companyId": "acc-001",
      "companyName": "Bangkok International Hospital",
      "targetRole": "Chief Medical Officer",
      "personaCategory": "C-Suite",
      "roleKeyword": "Medical Officer",
      "tier": "TIER_1",
      "email": "somchai.p@bih.co.th",
      "phone": "+66 2 123 4567",
      "linkedinSearchName": "somchai-prasert",
      "linkedinUrl": "https://www.linkedin.com/in/somchai-prasert",
      "targetAngle": "Digital telehealth transformation across 3 flagship hospitals",
      "status": "ACTIVE",
      "relationshipStatus": "HOT",
      "isClosed": false,
      "ownerId": "usr-ploy",
      "ownerName": "Ploy S.",
      "nextStep": "Finalize terms for telehealth pilot across 3 flagship hospitals",
      "nextFollowUpDate": "2026-10-22",
      "lastContactedDate": "2026-10-08",
      "updatedDate": "2026-10-18"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 25,
  "totalPages": 3,
  "last": false
}
```

---

### 5.2 GET `/api/contacts/{id}`
Retrieves complete profile details for a single contact, including strategic angles, LinkedIn metadata, and follow-up aggregation.

* **Response JSON (`200 OK`)**:
```json
{
  "id": "ct-001",
  "name": "Dr. Somchai Prasert",
  "companyId": "acc-001",
  "companyName": "Bangkok International Hospital",
  "targetRole": "Chief Medical Officer",
  "personaCategory": "C-Suite",
  "roleKeyword": "Medical Officer",
  "tier": "TIER_1",
  "email": "somchai.p@bih.co.th",
  "phone": "+66 2 123 4567",
  "linkedinSearchName": "somchai-prasert",
  "linkedinUrl": "https://www.linkedin.com/in/somchai-prasert",
  "targetAngle": "Digital telehealth transformation across 3 flagship hospitals",
  "status": "ACTIVE",
  "relationshipStatus": "HOT",
  "isClosed": false,
  "ownerId": "usr-ploy",
  "ownerName": "Ploy S.",
  "nextStep": "Finalize terms for telehealth pilot across 3 flagship hospitals",
  "nextFollowUpDate": "2026-10-22",
  "lastContactedDate": "2026-10-08",
  "notes": "Highly receptive to international clinical advisory partnerships.",
  "remarks": "Key decision-maker for health-tech vendor selection.",
  "followUpCount": 3,
  "createdDate": "2026-09-01",
  "updatedDate": "2026-10-18"
}
```

---

### 5.3 POST `/api/contacts`
Creates a new contact linked to an existing account.

* **Validation Rules**:
  * `name`: required, 1–100 characters.
  * `companyId`: required, must exist in `accounts`.
  * `tier`: required, one of `TIER_1`, `TIER_2`, `TIER_3`.
  * `email`: optional, valid email format.
  * `linkedinUrl`: optional, must begin with `https://`.
  * `ownerId`: required. Non-admins can only assign to themselves.
  * **Duplicate Prevention**: Return `409 Conflict` if email is already registered, or if a contact with the same name exists under the target account.

* **Request JSON**:
```json
{
  "name": "Dr. Somchai Prasert",
  "companyId": "acc-001",
  "targetRole": "Chief Medical Officer",
  "personaCategory": "C-Suite",
  "roleKeyword": "Medical Officer",
  "tier": "TIER_1",
  "email": "somchai.p@bih.co.th",
  "phone": "+66 2 123 4567",
  "linkedinSearchName": "somchai-prasert",
  "linkedinUrl": "https://www.linkedin.com/in/somchai-prasert",
  "targetAngle": "Digital telehealth transformation across 3 flagship hospitals",
  "status": "ACTIVE",
  "relationshipStatus": "HOT",
  "isClosed": false,
  "ownerId": "usr-ploy",
  "notes": "Highly receptive to international clinical advisory partnerships.",
  "remarks": "Key decision-maker for health-tech vendor selection."
}
```
* **Response JSON (`201 Created`)**: Returns newly created Contact object with generated ID and timestamps.

---

### 5.4 PUT `/api/contacts/{id}`
Updates an existing contact profile.

* **Authorization Rules**:
  * `SUPER_ADMIN`: Can edit any contact.
  * `ADMIN`: Can edit contacts owned by themselves or their managed team members.
  * `MEMBER`: Can only edit contacts they personally own.
* **Duplicate Prevention**: Returns `409 Conflict` if updated email clashes with another contact or duplicate name exists under the same company.

* **Request JSON**: Same schema as POST `/api/contacts`.
* **Response JSON (`200 OK`)**: Returns updated Contact object.

---

### 5.5 PATCH `/api/contacts/{id}/close`
Toggles the `isClosed` engagement flag of a contact. Closing marks outreach concluded without deleting records.

* **Request JSON**:
```json
{
  "isClosed": true
}
```
* **Response JSON (`200 OK`)**: Returns updated Contact with `isClosed: true`.

---

### 5.6 DELETE `/api/contacts/{id}`
Deletes a contact and all linked follow-ups.

* **Authorization Rules**: Subject to ownership checks (`contact.delete`).
* **Response**: `204 No Content`.

---

### 5.7 GET `/api/contacts/{id}/follow-ups`
Retrieves all follow-up action items for a contact, ordered with pending tasks first by due date ascending, followed by completed tasks.

* **Response JSON (`200 OK`)**:
```json
[
  {
    "id": "fu-001",
    "contactId": "ct-001",
    "contactName": "Dr. Somchai Prasert",
    "companyId": "acc-001",
    "action": "Finalize terms for telehealth pilot across 3 flagship hospitals",
    "dueDate": "2026-10-22",
    "period": 14,
    "lastContactedDate": "2026-10-08",
    "descriptionRemark": "Prepare draft terms covering clinician data-privacy indemnity.",
    "ownerId": "usr-ploy",
    "ownerName": "Ploy S.",
    "isDone": false,
    "completedDate": null,
    "resultNote": null,
    "createdDate": "2026-10-08",
    "updatedDate": "2026-10-08"
  }
]
```

---

### 5.8 POST `/api/contacts/{id}/follow-ups`
Schedules a new follow-up task. The system recalculates the contact's and account's `nextFollowUpDate` automatically.

* **Validation Rules**:
  * `action`: required, 1–255 characters.
  * `dueDate`: required, `YYYY-MM-DD`.
  * `period`: integer between 1 and 365 (default 7).
  * `ownerId`: required.

* **Request JSON**:
```json
{
  "action": "Send revised clinical advisory proposal",
  "dueDate": "2026-10-28",
  "period": 7,
  "lastContactedDate": "2026-10-21",
  "descriptionRemark": "Include hospital case studies from Singapore.",
  "ownerId": "usr-ploy"
}
```
* **Response JSON (`201 Created`)**: Returns created FollowUp object.

---

### 5.9 PUT `/api/contacts/{id}/follow-ups/{followUpId}`
Updates an existing follow-up task details.

* **Request JSON**: Same schema as POST `/api/contacts/{id}/follow-ups`.
* **Response JSON (`200 OK`)**: Returns updated FollowUp object.

---

### 5.10 PATCH `/api/contacts/{id}/follow-ups/{followUpId}/done`
Marks a follow-up task completed, records the outcome result note, updates `lastContactedDate`, and optionally schedules the subsequent follow-up.

* **Request JSON**:
```json
{
  "completedDate": "2026-10-22",
  "resultNote": "Meeting held with Dr. Somchai. Agreed to proceed with pilot draft.",
  "nextAction": {
    "action": "Submit pilot legal agreement to compliance committee",
    "dueDate": "2026-11-05",
    "period": 14,
    "descriptionRemark": "Follow up after internal compliance review meeting."
  }
}
```
* **Response JSON (`200 OK`)**: Returns completed FollowUp object.

---

### 5.11 DELETE `/api/contacts/{id}/follow-ups/{followUpId}`
Deletes a follow-up task and recalculates `nextFollowUpDate`.

* **Response**: `204 No Content`.

---

### 5.12 POST `/api/contacts/import`
Validates and commits a batch of contacts parsed from an Excel or CSV spreadsheet.

* **Request JSON**:
```json
{
  "duplicatePolicy": "SKIP",
  "rows": [
    {
      "name": "Dr. Somchai Prasert",
      "company": "Bangkok International Hospital",
      "targetRole": "Chief Medical Officer",
      "personaCategory": "C-Suite",
      "roleKeyword": "Medical Officer",
      "tier": "TIER_1",
      "linkedinSearchName": "somchai-prasert",
      "linkedinUrl": "https://www.linkedin.com/in/somchai-prasert",
      "email": "somchai.p@bih.co.th",
      "phone": "+66 2 123 4567",
      "targetAngle": "Digital telehealth transformation",
      "status": "ACTIVE",
      "nextStep": "Finalize pilot terms",
      "ownerUsername": "ploy.s",
      "relationshipStatus": "HOT",
      "isClosed": "No",
      "notes": "Highly receptive to clinical advisory.",
      "remarks": "Vendor selection chair."
    }
  ]
}
```
* **Response JSON (`200 OK`)**:
```json
{
  "totalRows": 25,
  "importedCount": 24,
  "skippedCount": 1,
  "errors": []
}
```

---

### 5.13 GET `/api/contacts/export`
Exports contacts matching the active filters as a `.xlsx` or `.csv` file.

* **Query Parameters**: Same filter parameters as `GET /api/contacts`, plus `format=xlsx|csv`.
* **Response**: Binary stream (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` or `text/csv; charset=utf-8`) with `Content-Disposition: attachment; filename="crm-contacts-export-2026-10-19.xlsx"`.

---

### 5.14 Contact 18-Column Spreadsheet Format Specification

| # | Column Header | Required | Accepted Values | Max Length | Notes |
|:---|:---|:---:|:---|:---:|:---|
| 1 | `Name` | **Yes** | String | 100 | Contact's full name. |
| 2 | `Company` | **Yes** | Existing Account name | 120 | Must match an existing Account name (case-insensitive). |
| 3 | `Target Role` | No | String | 100 | Official corporate position (e.g. `Chief Medical Officer`). |
| 4 | `Persona Category` | No | String | 60 | Executive grouping (e.g. `C-Suite`, `M&A / Strategy`). |
| 5 | `Role Keyword` | No | String | 60 | Search tag keyword (e.g. `Medical Officer`). |
| 6 | `Tier` | **Yes** | `TIER_1`, `TIER_2`, `TIER_3` | — | Strategic priority tier. |
| 7 | `LinkedIn Search Name` | No | String | 100 | Identifier slug used in LinkedIn searches. |
| 8 | `LinkedIn Profile URL` | No | URL beginning with `https://` | 255 | Must be a secure HTTPS web address. |
| 9 | `Email` | No | Valid email format | 100 | Business email address. Unique across contacts. |
| 10 | `Phone` | No | Phone string | 40 | Contact phone number with international dial code. |
| 11 | `Target Angle` | No | String | 1000 | Strategic advisory angle or conversation hook. |
| 12 | `Status` | No | `ACTIVE`, `INACTIVE` | — | Defaults to `ACTIVE` if omitted. |
| 13 | `Next Step` | No | String | 255 | Scheduled action item or next engagement step. |
| 14 | `Owner Username` | No | Valid user `username` | 50 | Defaults to current importing user if omitted. Members must use their own username. |
| 15 | `Relationship Status` | No | `HOT`, `WARM`, `COLD` | — | Defaults to `WARM` if omitted. |
| 16 | `Closed Engagement` | No | `Yes`, `No`, `true`, `false` | — | Flags contact as closed engagement. Defaults to `No`. |
| 17 | `Notes` | No | String | 1000 | Internal background notes and qualitative context. |
| 18 | `Remarks` | No | String | 1000 | Additional advisory remarks. |

---

### 5.15 Error Codes & Business Conflict Rules

| Status | Code / Error | Condition | Example Response |
|---|---|---|---|
| `400` | Bad Request | Validation errors (invalid email format, invalid LinkedIn URL, missing required fields) | `{ "status": 400, "error": "Bad Request", "errors": [{ "field": "email", "message": "Email is invalid" }] }` |
| `401` | Unauthorized | Missing or expired authentication token | `{ "status": 401, "error": "Unauthorized", "message": "Authentication required." }` |
| `403` | Forbidden | Member editing/deleting a contact owned by another user | `{ "status": 403, "error": "Forbidden", "message": "Access denied. You may only modify contacts you own." }` |
| `404` | Not Found | Contact ID or FollowUp ID does not exist | `{ "status": 404, "error": "Not Found", "message": "Contact with id 'ct-999' was not found." }` |
| `409` | Conflict | Duplicate email registered to another contact | `{ "status": 409, "error": "Conflict", "message": "A contact with email 'somchai.p@bih.co.th' already exists." }` |
| `409` | Conflict | Duplicate name under the same company | `{ "status": 409, "error": "Conflict", "message": "A contact named 'Dr. Somchai Prasert' already exists under 'Bangkok International Hospital'." }` |

---

### 5.16 Contact Module Open Questions for Backend Alignment

The following architectural and domain design points remain open questions for backend and stakeholder confirmation:

1. **Contact Status Enum is a Placeholder**:
   - The status is currently modeled in frontend types as `['ACTIVE', 'INACTIVE']`.
   - In the database ER diagram, Contact Status is marked as **TBD**.
   - *Question for Backend*: What is the finalized enum definition? Will it include pipeline or qualification stages (e.g. `LEAD`, `PROSPECT`, `ENGAGED`, `DORMANT`, `CHURNED`), or remain a simple boolean-like active/inactive flag?

2. **Contact Visibility Scope**:
   - Currently, users with role `MEMBER` have read visibility across all team contacts, but write permissions (edit, delete, close) are strictly limited to contacts they own (`ownerId === currentUser.id`) or where their manager oversees the owner.
   - *Question for Backend*: Should `MEMBER` role users have broad organization-wide visibility into all contacts, or should contact queries be strictly filtered on the server to only return contacts assigned to the current user (or contacts belonging to accounts owned by the user)?

3. **Duplicate Rule Constraints**:
   - The frontend and import validation engine currently enforces a compound duplicate rule:
     - Rule A: Same email address across any contact (`email === existing.email`).
     - Rule B: Same contact name within the same associated company (`companyId === existing.companyId && name.toLowerCase() === existing.name.toLowerCase()`).
   - *Question for Backend*: Will the database schema enforce a unique index on `email` (excluding nulls) AND a composite unique constraint on `(company_id, LOWER(name))`? Or should duplicate name within a company generate a warning rather than a blocking HTTP 409 Conflict error?

4. **Follow-Up Ownership & Delegation**:
   - Follow-up tasks currently have their own `ownerId` separate from the parent contact's `ownerId`.
   - In the current frontend implementation, `ADMIN` and `SUPER_ADMIN` users can assign follow-up tasks to any active user, while `MEMBER` users can only assign follow-up tasks to themselves.
   - *Question for Backend*: Is peer-to-peer delegation supported where a Member can assign a task to a colleague, or should task ownership strictly follow the parent contact's owner?




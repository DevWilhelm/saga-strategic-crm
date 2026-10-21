# Strategic CRM — Frontend Architecture & Module Specifications

> **Modules**: Users Management & RBAC, Accounts Management, Excel Import / Export & Template  
> **Environment**: React 18, TypeScript, Tailwind CSS, TanStack Query v5, MSW (Mock Service Worker), Zod, SheetJS (0.20.3)  
> **Backend Integration Ready**: Pure RESTful API contract with zero hardcoded UI state  

---

## 1. Architectural Structure & Directory Layout

The application follows a feature-driven, domain-modular architecture. All security, user management, permissions, and spreadsheet import/export logic are decoupled into dedicated layers:

```
frontend/
├── .npmrc                           # Configures allow-remote=all for official SheetJS CDN URL dependency
├── docs/
│   └── API_CONTRACT.md              # Full REST API specification and Spring Boot handoff contract
├── src/
│   ├── api/
│   │   ├── client.ts                # Axios client with base URL and error interceptors
│   │   ├── accountsApi.ts           # Accounts module API client (paginated list, export, import)
│   │   └── usersApi.ts              # Users module API client (fully typed)
│   ├── auth/
│   │   ├── Can.tsx                  # Declarative <Can perform="action"> guard component
│   │   └── permissions.ts           # Pure role-to-permission mapping and can() evaluation helper
│   ├── components/
│   │   ├── common/
│   │   │   ├── ConfirmDialog.tsx    # Styled inline confirmation modal (Activate/Deactivate, discard edits)
│   │   │   ├── NoAccessPage.tsx     # 403 Forbidden access denial page
│   │   │   ├── PermissionRoute.tsx  # React Router route guard evaluating user permissions
│   │   │   └── WidgetState.tsx      # Consolidated loading skeletons, empty states, and retry banners
│   │   └── layout/
│   │       ├── DashboardLayout.tsx  # Application shell layout
│   │       ├── Sidebar.tsx          # Dynamic sidebar hiding unauthorized navigation items
│   │       └── Topbar.tsx           # Header with role badge, profile link, and Dev Role Switcher
│   ├── constants/
│   │   └── users.ts                 # UserRole, UserStatus, PermissionAction, and preset role definitions
│   ├── context/
│   │   └── AuthContext.tsx          # React Context managing authenticated user profile and persona switching
│   ├── features/
│   │   ├── accounts/                # Accounts domain module
│   │   │   ├── components/
│   │   │   │   ├── AccountFiltersBar.tsx    # Multi-field filter toolbar
│   │   │   │   ├── AccountImportDialog.tsx  # 3-step import wizard dialog (File, Review & Validate, Result)
│   │   │   │   └── AccountTable.tsx         # Responsive accounts list table
│   │   │   └── pages/
│   │   │       └── AccountListPage.tsx      # Accounts list with template, import, and split export menu
│   │   ├── contacts/                # Contacts domain module (with Follow-Ups)
│   │   │   ├── components/
│   │   │   │   ├── ContactExportMenu.tsx    # Excel & CSV export split menu
│   │   │   │   ├── ContactFiltersBar.tsx   # Multi-field filter toolbar (company, tier, relationship, schedule)
│   │   │   │   ├── ContactFollowUpsTab.tsx  # Follow-up tasks tab (pending & completed)
│   │   │   │   ├── ContactForm.tsx          # 7-section contact form with company lock
│   │   │   │   ├── ContactImportDialog.tsx  # 3-step spreadsheet import wizard
│   │   │   │   ├── ContactOverviewCard.tsx  # Strategic angle, targeting, and LinkedIn overview
│   │   │   │   ├── ContactTable.tsx         # Responsive contact table with sorting & close action
│   │   │   │   ├── FollowUpModalDialog.tsx  # Follow-up schedule dialog with period auto-calc
│   │   │   │   ├── MarkFollowUpDoneDialog.tsx # Completion dialog with outcome notes & next task
│   │   │   │   └── RelationshipBadge.tsx    # HOT, WARM, COLD status badges
│   │   │   ├── hooks/
│   │   │   │   └── useContacts.ts           # TanStack Query hooks for contacts & follow-ups
│   │   │   ├── pages/
│   │   │   │   ├── ContactDetailPage.tsx    # Contact detail with Overview, Follow-ups, History
│   │   │   │   ├── ContactFormPage.tsx      # Create and edit contact pages
│   │   │   │   └── ContactListPage.tsx      # Contacts list with filters, table, import, export
│   │   │   ├── schemas/
│   │   │   │   ├── contactSchema.ts         # Zod schemas for contact creation & updates
│   │   │   │   └── followUpSchema.ts        # Zod schemas for follow-up scheduling & completion
│   │   │   └── utils/
│   │   │       └── followUpHelpers.ts       # Urgency evaluator & due date auto-calculators
│   │   ├── import-export/           # Generic spreadsheet engine (SheetJS lazy-loaded)
│   │   │   ├── constants/
│   │   │   │   ├── accountColumns.ts        # 13 standard + 3 export column definitions & aliases
│   │   │   │   └── contactColumns.ts        # 18 standard Contact column definitions & aliases
│   │   │   ├── utils/
│   │   │   │   ├── downloadHelper.ts        # Safe Blob & ArrayBuffer download triggers
│   │   │   │   ├── exportHelper.ts          # CSV formula-injection defense & XLSX string type generator
│   │   │   │   ├── fileReader.ts            # Delimiter detection, UTF-8 BOM strip, password check
│   │   │   │   ├── headerNormalization.ts   # Case/punctuation-insensitive header matching
│   │   │   │   ├── rowValidator.ts          # Client-side validation, duplicate detection & error report
│   │   │   │   └── templateBuilder.ts       # 3-sheet template generator with Instructions & Lists
│   │   │   └── types.ts                     # Core column, config, and row validation interfaces
│   │   └── users/                   # Users domain module
│   │       ├── components/
│   │       │   ├── ConflictModalDialog.tsx  # Styled 409 conflict modal (self-deactivate, last admin)
│   │       │   ├── ResetPasswordDialog.tsx  # Admin password reset modal
│   │       │   ├── UserFiltersBar.tsx       # Search query, role, and status filter toolbar
│   │       │   ├── UserForm.tsx             # Shared user create/edit form with server error display
│   │       │   ├── UserRoleBadge.tsx        # Styled role pill badges (ADMIN, MEMBER, VIEWER)
│   │       │   ├── UserStatusBadge.tsx      # Active / Inactive status pill badges
│   │       │   └── UserTable.tsx            # Users list table with Name & Updated sorting
│   │       ├── hooks/
│   │       │   └── useUsers.ts              # TanStack Query queries and mutations
│   │       ├── pages/
│   │       │   ├── ProfilePage.tsx          # /profile self-service profile & change password page
│   │       │   ├── UserFormPage.tsx         # /users/new and /users/:id/edit pages
│   │       │   └── UserListPage.tsx         # /users list page with URL search params synchronization
│   │       └── schemas/
│   │           └── userSchema.ts            # Zod validation schemas for users and password changes
│   ├── mocks/
│   │   ├── handlers/
│   │   │   ├── accounts.ts          # MSW handlers for accounts, export, import, lookups
│   │   │   └── users.ts             # MSW handlers for /api/me, /api/users, password endpoints
│   │   └── store.ts                 # Unified in-memory store shared across all modules
│   ├── pages/
│   │   ├── NotFoundPage.tsx         # Styled 404 page for unmatched URLs
│   │   └── PlaceholderPage.tsx      # Stub component for features under development
│   ├── types/
│   │   ├── account.ts               # Account, lookup, import payload & response interfaces
│   │   ├── lookup.ts                # Lookup reference models (with role-secured owner usernames)
│   │   └── user.ts                  # User, request DTOs, and paginated response models
│   └── App.tsx                      # Root route configuration with route guards
```

---

## 2. Complete REST Endpoint Table

All endpoints communicate using JSON payloads over HTTP with standard status codes.

| Method | Endpoint URL | Description | Required Role / Permission | Request Body DTO | Response Body | HTTP Codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/me` | Retrieves current authenticated user profile & granted permissions | Authenticated (`*`) | — | `CurrentUser` | `200` |
| `PUT` | `/api/me` | Self-service profile update (name, email, phone) | Authenticated (`*`) | `UpdateMyProfileDTO` | `CurrentUser` | `200`, `400`, `409` |
| `POST` | `/api/me/change-password` | Self-service password change for currently authenticated user | Authenticated (`*`) | `ChangePasswordDTO` | Empty (`204`) | `204`, `400` |
| `GET` | `/api/users` | Paginated search, role/status/manager filtering, and sorting (`name`, `updatedDate`) | `SUPER_ADMIN`, `ADMIN` | — | `PaginatedUsersResponse` | `200`, `400`, `403` |
| `GET` | `/api/users/options` | Retrieves active users for owner dropdowns | Authenticated (`*`) | — | `UserOption[]` | `200` |
| `GET` | `/api/users/{id}` | Retrieves full user detail by ID with associated account/contact counts | `SUPER_ADMIN`, `ADMIN` | — | `UserListItem` | `200`, `403`, `404` |
| `POST` | `/api/users` | Creates a new user profile with initial password and role | `SUPER_ADMIN`, `ADMIN` | `CreateUserDTO` | `User` (no password) | `201`, `400`, `403`, `409` |
| `PUT` | `/api/users/{id}` | Full update of user (name, code, username, email, role, managerId, status) | `SUPER_ADMIN`, `ADMIN` | `UpdateUserDTO` | `User` | `200`, `400`, `403`, `404`, `409` |
| `PATCH` | `/api/users/{id}/status` | Quick Activate / Deactivate status toggle action | `SUPER_ADMIN`, `ADMIN` | `UpdateUserStatusDTO` | `User` | `200`, `400`, `403`, `404`, `409` |
| `POST` | `/api/users/{id}/reset-password` | Admin resets password for specified user | `SUPER_ADMIN`, `ADMIN` | `ResetPasswordDTO` | Empty (`204`) | `204`, `400`, `403`, `404` |
| `GET` | `/api/contacts` | Paginated search, company/tier/relationship/owner/schedule filtering, and sorting | Authenticated (`*`) | — | `PaginatedContactsResponse` | `200`, `400` |
| `GET` | `/api/contacts/{id}` | Detailed contact profile with aggregated follow-ups | Authenticated (`*`) | — | `ContactDetail` | `200`, `404` |
| `POST` | `/api/contacts` | Create contact profile linked to parent Account | `contact.create` | `CreateContactDTO` | `Contact` | `201`, `400`, `409` |
| `PUT` | `/api/contacts/{id}` | Update contact coordinates, persona, angles, and ownership | `contact.edit` | `UpdateContactDTO` | `Contact` | `200`, `400`, `403`, `404`, `409` |
| `PATCH` | `/api/contacts/{id}/close` | Toggle contact closed engagement status | `contact.close` | `{ isClosed: boolean }` | `Contact` | `200`, `403`, `404` |
| `DELETE` | `/api/contacts/{id}` | Delete contact and associated follow-up tasks | `contact.delete` | — | Empty (`204`) | `204`, `403`, `404` |
| `GET` | `/api/contacts/{id}/follow-ups` | List scheduled & completed follow-ups for contact | Authenticated (`*`) | — | `FollowUp[]` | `200`, `404` |
| `POST` | `/api/contacts/{id}/follow-ups` | Schedule new follow-up and auto-recalculate due date | `followup.manage` | `CreateFollowUpDTO` | `FollowUp` | `201`, `400`, `404` |
| `PUT` | `/api/contacts/{id}/follow-ups/{fId}` | Update follow-up task details | `followup.manage` | `UpdateFollowUpDTO` | `FollowUp` | `200`, `400`, `404` |
| `PATCH` | `/api/contacts/{id}/follow-ups/{fId}/done` | Complete follow-up, record outcome notes, schedule next | `followup.manage` | `MarkFollowUpDoneDTO` | `FollowUp` | `200`, `400`, `404` |
| `DELETE` | `/api/contacts/{id}/follow-ups/{fId}` | Delete follow-up task | `followup.manage` | — | Empty (`204`) | `204`, `404` |
| `POST` | `/api/contacts/import` | Validate & commit spreadsheet rows (SKIP or ALLOW dups) | `contact.import` | `ContactImportRequest` | `ContactImportResponse` | `200`, `400` |
| `GET` | `/api/contacts/export` | Export contacts to Excel (.xlsx) or CSV (.csv) | `contact.export` | — | Binary (`.xlsx`/`.csv`) | `200` |

### Key Business Conflict Rules (HTTP 409 Conflict)
1. **Self-Deactivation Protection**: An administrator cannot deactivate their own active user account via `PUT /api/users/{id}` or `PATCH /api/users/{id}/status`.
2. **Super Admin Protection**: Exactly one `SUPER_ADMIN` account exists (`usr-super`, Alex Mercer). It cannot be deactivated, deleted, or demoted.
3. **Unique Email, Username, & Code**: Re-registration of an already taken email, username, or initials code returns an HTTP `409 Conflict` modal dialog with friendly guidance.
4. **Duplicate Contact Prevention**: Attempting to register an email address already assigned to an existing contact or creating a contact with identical name under the same company returns an HTTP `409 Conflict` error.

---

## 3. Permissions Matrix by Role

Permissions are derived **strictly** from the assigned `UserRole`. Custom per-user permission overrides are prohibited in adherence to the relational ER model.

| Permission Action | Description | SUPER_ADMIN | ADMIN | MEMBER |
|---|---|:---:|:---:|:---:|
| `dashboard.view` | Access executive dashboard, KPI cards, and charts | ✅ | ✅ | ✅ |
| `accounts.view` | View accounts list, search, filter, and inspect account details | ✅ | ✅ | ✅ |
| `account.create` | Create new client accounts | ✅ | ✅ | ✅ |
| `account.edit` | Update writable account fields and log history notes | ✅ | ✅ | ✅ (Own) |
| `account.reassignOwner` | Reassign account ownership to another active team member | ✅ | ✅ | ❌ |
| `account.template` | Download Excel import template with live lookup values | ✅ | ✅ | ✅ (Self-Owner) |
| `account.import` | Upload spreadsheets, run validation, and batch import accounts | ✅ | ✅ | ✅ |
| `account.export` | Export filtered account lists to Excel (.xlsx) or CSV (.csv) | ✅ | ✅ | ✅ |
| `contacts.view` | View contacts and relationship intelligence | ✅ | ✅ | ✅ |
| `contact.create` | Create new contact profile | ✅ | ✅ | ✅ |
| `contact.edit` | Update contact profile and coordinates | ✅ | ✅ | ✅ (Own) |
| `contact.close` | Toggle contact closed engagement status | ✅ | ✅ | ✅ (Own) |
| `contact.delete` | Delete contact record and associated tasks | ✅ | ✅ | ✅ (Own) |
| `contact.reassignOwner` | Reassign contact owner to another team member | ✅ | ✅ | ❌ |
| `contact.template` | Download 18-column Excel import template | ✅ | ✅ | ✅ (Self-Owner) |
| `contact.import` | Upload and batch import contact spreadsheets | ✅ | ✅ | ✅ |
| `contact.export` | Export contacts to Excel (.xlsx) or CSV (.csv) | ✅ | ✅ | ✅ |
| `followup.manage` | Schedule, edit, complete, and delete follow-up tasks | ✅ | ✅ | ✅ (Own Contact) |
| `lookup.manage` | Add or modify business lines, categories, sub-categories, and services | ✅ | ✅ | ❌ |
| `user.manage` | Access user list, create users, edit profiles, toggle status, reset passwords | ✅ (All) | ✅ (Own Members) | ❌ |

### Security Guarantees
- **Zero Stored Passwords in UI**: Password fields exist exclusively in `CreateUserDTO`, `ResetPasswordDTO`, and `ChangePasswordDTO`. They are never returned by any endpoint, never stored in client state, never logged, and cleared immediately after submission.
- **Foreign Key Integrity**: User records are deactivated (`ACTIVE` / `INACTIVE`) and **never deleted**, preserving referential integrity across accounts, contacts, and audit trails.
- **Hierarchical Management**: `SUPER_ADMIN` can assign and reassign `MEMBER` users to any `ADMIN`. `ADMIN` users manage only their directly assigned team members.
- **Backend Handoff Documentation**: Complete Spring Boot implementation architecture, Flyway PostgreSQL scripts, specifications, and Entra ID SSO roadmap are available in [`docs/BACKEND_INTEGRATION_GUIDE.md`](docs/BACKEND_INTEGRATION_GUIDE.md) and [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

---

## 4. Excel Import, Export & Template System (Accounts Module)

The Accounts module provides an enterprise spreadsheet pipeline supporting bulk data onboarding, live lookups, and reporting.

### 4.1 Dependency & `.npmrc` Configuration
- **Library**: SheetJS Community Edition pinned to the official CDN distribution: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. Outdated and vulnerable npm registry tarballs (`xlsx`) are strictly prohibited.
- **`.npmrc` Configuration**: In npm v12+, remote tarball dependencies require explicit authorization. The repository contains `frontend/.npmrc` with:
  ```ini
  # Needed for SheetJS official CDN URL dependency (https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz)
  # In npm v12+, remote tarball dependencies require allow-remote=all.
  allow-remote=all
  ```
- **Code Splitting**: SheetJS is loaded dynamically via `await import('xlsx')` within helper utilities (`templateBuilder`, `exportHelper`, `fileReader`, `rowValidator`). This isolates the library into an on-demand Vite chunk (`xlsx-*.js`), ensuring zero impact on initial page load latency.

### 4.2 Import Template Generation
- Downloadable directly from the Accounts list via the **Template** button.
- Generates a formatted `.xlsx` workbook containing 3 sheets:
  1. `Accounts`: Header row with 13 standard columns (required columns marked with `*`), plus 2 sample demonstration rows.
  2. `Instructions`: Step-by-step guidance, column requirements, character limits, accepted formats, and role constraints.
  3. `Lists`: Reference lists populated dynamically from live CRM lookups (`Business Lines`, `Categories`, `Sub-categories`, `Services`, `Tiers`, `Deal Sides`, `Countries`, and `Owners`).
- **Owner Security**: When downloaded by `ADMIN`, the `Lists` sheet includes all active system owners with their usernames. When downloaded by `MEMBER`, the list contains **only the member themselves**.

### 4.3 3-Step Import Wizard (`AccountImportDialog`)
- **Step 1: Upload**:
  - Accepts `.xlsx`, `.xlsm`, `.xlsb`, `.xls`, `.ods`, `.csv`, `.tsv` up to **5 MB** and **500 rows**.
  - Automatically strips UTF-8 BOM, detects CSV delimiters (`,`, `;`, `\t`, `|`), and extracts available workbook sheets.
  - Multi-sheet selector allows choosing which sheet to import (defaults to `"Accounts"` or first sheet).
  - Password-protected files are cleanly caught, alerting: *"This file is password-protected. Remove the password and try again."*
  - Formulas are preserved as literal text without evaluation.
- **Step 2: Review & Validate**:
  - Missing required headers block import progression, providing an inline button to download the official template.
  - Unknown columns are highlighted and safely ignored.
  - Duplicate handling: User chooses between **"Skip it (default)"** (skips duplicates in CRM or current batch) or **"Import anyway"**.
  - Client-side validation table displays the first 100 rows with tab filters (**All**, **Errors**, **Duplicates**) and exact cell-level error tooltips.
- **Step 3: Result**:
  - Executes `POST /api/accounts/import` with `mode: "COMMIT"`.
  - Displays summary statistics: **Created**, **Skipped**, and **Failed**.
  - Partial Import Model: Valid accounts are committed even if other rows have errors.
  - Downloadable Error Report: If any rows fail or are skipped, users can download an annotated `.xlsx` error report containing original row values alongside exact validation messages.
- **Unsaved Changes Blocker**: Intercepts dialog close / backdrop click if a file is loaded, displaying a styled `ConfirmDialog` to prevent accidental progress loss.

### 4.4 Account Export System
- **Split Button UI**:
  - Primary button triggers one-click Excel (`.xlsx`) export.
  - Split dropdown chevron allows selecting between **Excel (.xlsx)** and **CSV (.csv)**.
  - Button tooltip displays live matching account count: `"Export 134 accounts"`.
- **CSV Formula-Injection Protection (DDE Defense)**:
  - Any exported cell starting with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`), preventing spreadsheet applications from executing formulas.
- **Encoding & Compatibility**:
  - CSV exports prepend the UTF-8 Byte Order Mark (`0xEF, 0xBB, 0xBF`), guaranteeing non-Latin characters (Thai, Burmese, Japanese) open properly in Windows Excel.
  - XLSX exports enforce string type (`t: 's'`) for all text cells.
- **Ceiling**: Supports up to 10,000 accounts matching active filters (exceeding 10,000 returns HTTP 400).

---

## 5. Open Questions for Backend Alignment

### 5.1 Excel Import, Export & Template Module (7 Core Questions)

1. **Partial Import vs. Atomic All-or-Nothing Transaction**:
   - *Question*: When an uploaded file contains 100 rows with 95 valid accounts and 5 invalid rows, should the backend commit the 95 valid accounts (partial import with downloadable error report, as currently implemented) or rollback the entire batch inside a database transaction (`@Transactional`) requiring 100% validity before committing?
   - *Considerations*: Partial import improves user experience by avoiding re-uploading large valid datasets, but requires clear auditing. Atomic import ensures strict batch idempotency.

2. **Account Duplication Rule (Name Only vs. Name + Country)**:
   - *Question*: How should account uniqueness be defined? Currently, duplication is evaluated strictly on account `name` (case-insensitive, trimmed). Should uniqueness instead evaluate a composite key: `(LOWER(name), LOWER(country))` or `(LOWER(name), website_url)`?
   - *Considerations*: Multinational groups (e.g., "Siam Care" operating independently in Thailand vs. Singapore) may represent distinct corporate accounts. Adopting composite uniqueness would require updating backend database constraints and client duplicate checks.

3. **"Update Existing Accounts" Mode (Upsert Pipeline)**:
   - *Question*: Should the import wizard introduce an "Upsert / Update existing accounts" mode to update existing CRM accounts rather than skipping or creating duplicate records?
   - *Considerations*: Upserts require defining field overwrite semantics (e.g., whether blank spreadsheet cells overwrite existing CRM fields with null or leave them unchanged), conflict resolution, and a stable identifier column (e.g., `Account ID` or external ERP code).

4. **Export Authorization & Audit Logging**:
   - *Question*: Which roles should be permitted to export data, and should export activities be logged in an immutable compliance audit table?
   - *Considerations*: Bulk customer extraction presents corporate data exfiltration risks. Currently, `account.export` is permitted for `ADMIN` and `MEMBER`. The backend team should determine if `MEMBER` exports should be scoped strictly to owned accounts, or if exports must log user ID, timestamp, filter criteria, IP address, and row count.

5. **Row and File Size Limits Scalability**:
   - *Question*: Are the current limits (5 MB file size, 500 rows per import, 10,000 rows per export) sufficient for production scale, or should asynchronous background processing be introduced?
   - *Considerations*: The browser client parses 500 rows in <200ms. If enterprise migrations require importing 10,000+ accounts at once, an asynchronous background job queue (e.g., Spring Batch / Celery / Redis) with progress polling and email completion notifications will be necessary.

6. **CSV Encoding & Delimiter Standardization Across Locales**:
   - *Question*: How should CSV encoding and delimiter variations be standardized across international operating environments?
   - *Considerations*: Windows Excel defaults to regional ANSI code pages unless a UTF-8 BOM is present. European systems commonly use semicolon (`;`) delimiters. The frontend import reader auto-detects `,`, `;`, `\t`, `|`, and exports with UTF-8 BOM, but backend export endpoints must mirror these behaviors.

7. **Extending Generic Import/Export Architecture to Contacts**:
   - *Question*: Should the domain-agnostic spreadsheet engine in `src/features/import-export/` be adopted as the standard pipeline for Contacts, Deals, and Activities?
   - *Considerations*: The engine uses generic interfaces (`ColumnDefinition<T>`, `ImportExportConfig<T>`). Extending this to Contacts will require resolving relational foreign key lookups (e.g., resolving parent account names to `companyId`).

---

### 5.2 Users Management & Security Module Questions

8. **Authentication Architecture (SSO vs Local Passwords)**:
   - *Question*: Will production rely on local credentials via Spring Security (JWT / OAuth2 Resource Server) or enterprise Single Sign-On (SSO) via Microsoft Entra ID (Azure AD), Google Workspace, or Okta?
   - *Considerations*: If SSO is used, password reset and change flows are delegated to the identity provider.

9. **Password Complexity & Expiration Policies**:
   - *Question*: Does the organization require enhanced password policies (e.g. minimum 10–12 characters, mandatory special characters, non-reusable history)?
   - *Considerations*: The frontend Zod schemas and backend validators must align on regex constraints.

10. **User Invitation & Email Notification Lifecycle**:
    - *Question*: Should creating a user via `POST /api/users` send an automated onboarding email with an activation link rather than requiring administrators to assign initial passwords manually?

11. **User Profile Photo Storage & Signed URLs**:
    - *Question*: Where will profile photos be stored in production (e.g. Azure Blob Storage, AWS S3), and should image URLs require signed SAS tokens or be public via CDN?

12. **Email Uniqueness Constraint**:
    - *Question*: Should user `email` enforce a strict database-level unique constraint (`UNIQUE`), or can multiple test/service accounts share an email address?

13. **Contact Information Privacy**:
    - *Question*: Who is authorized to view colleagues' email and phone numbers? Should this be restricted strictly to `ADMIN`?

14. **Granular Row-Level Ownership (RLS)**:
    - *Question*: For `MEMBER` users, should edit permissions apply to all accounts or strictly to accounts where `ownerId == currentUserId`?

---

### 5.3 Contacts & Follow-Ups Module Questions (New)

15. **Contact Duplicate Evaluation Scope**:
    - *Question*: Should contact name uniqueness be enforced globally across the CRM, or scoped strictly to `(company_id, LOWER(name))`?
    - *Resolution in Frontend*: Scoped to `(company_id, LOWER(name))` because different accounts (e.g. two separate healthcare systems) can legitimately employ individuals who happen to share the same name. Email uniqueness remains globally unique across all contacts.

16. **Closed Contact Engagement Retention & Lifecycle**:
    - *Question*: What is the business impact when a contact is flagged as `isClosed=true`?
    - *Resolution in Frontend*: Closing a contact does NOT delete any historical data, notes, or past follow-up tasks. It flags the contact as "Closed Engagement" so outreach teams know not to schedule active new business calls, but all past interaction records remain intact. Reopening is available at any time.

17. **Follow-Up Date Propagation & Priority**:
    - *Question*: How does a newly scheduled follow-up affect the parent Contact and Account?
    - *Resolution in Frontend*: The earliest pending (non-completed) follow-up date automatically propagates to both `contact.nextFollowUpDate` and `account.nextFollowUpDate`. When a follow-up is marked done, the calculator immediately re-evaluates all remaining pending tasks to locate the next earliest due date.

18. **Auto-Calculating Follow-up Due Dates from Period**:
    - *Question*: When scheduling a follow-up, how should `dueDate` interact with `period` (cadence days) and `lastContactedDate`?
    - *Resolution in Frontend*: Changing `period` (e.g., 7, 14, 30 days) automatically computes `dueDate = lastContactedDate + period days`. Users can also freely pick any custom `dueDate` in the calendar picker. If a selected date is in the past, an amber warning banner is presented to alert the user without blocking submission.

19. **Contact Spreadsheet 18-Column Import & Foreign Key Resolution**:
    - *Question*: How are company and owner values in uploaded spreadsheets resolved?
    - *Resolution in Frontend*: The spreadsheet engine normalizes the `Company` column against all existing active accounts (case-insensitive string matching). If the company name is not found, the row fails validation with a clear message: `"Company '[Name]' not found in registered accounts"`. The `Owner Username` is similarly matched against active users; if omitted or blank, it defaults automatically to the currently importing user.

---

## 6. Contacts & Follow-Ups Module Architecture & Specifications

### 6.1 Relational Integrity & Schema
- **Mandatory Parent Account**: Every contact is linked to a valid `companyId` (foreign key to `accounts.id`). The Contacts list table displays `companyName` with a direct link to the account detail page.
- **Account Detail Integration**: The `AccountContactsTab` within `/accounts/:id` displays all linked contacts, their executive tiers, relationship statuses, next steps, and follow-up deadlines, alongside a direct "+ New Contact" button pre-populating `?companyId={accountId}`.

### 6.2 Follow-Up Workflow & Urgency Engine
- **Three Urgency Levels**:
  - `OVERDUE` (due date < today): Red highlight badge with warning icon.
  - `DUE_TODAY` (due date == today): Amber highlight badge.
  - `UPCOMING` (due date > today): Neutral/cool theme badge.
- **Marking Follow-Up as Completed**:
  - Prompts for completion date and mandatory `resultNote` documenting meeting notes or conversation outcomes.
  - Offers a seamless inline option to schedule the next follow-up action with calculated due date.

### 6.3 18-Column Excel Import & Export Pipeline
- Pinned to the official SheetJS CDN distribution via `.npmrc`.
- Provides an official 18-column `.xlsx` template download with pre-filled demonstration rows, instructions, and lookup reference lists.
- Client-side pre-validation parses up to 500 rows, checking email formats, HTTPS LinkedIn URLs, required fields, and duplicate records with a toggleable duplicate policy (`SKIP` or `ALLOW`).

### 6.4 Contact Module Open Questions for Backend Alignment

The following architectural decisions are documented as open questions for final backend schema finalization:

1. **Contact Status Enum is a Placeholder**:
   - Status is currently defined as `['ACTIVE', 'INACTIVE']` and marked as TBD in the ER diagram.
   - *Confirmation needed*: What is the complete lifecycle enum definition (e.g. `LEAD`, `PROSPECT`, `ENGAGED`, `DORMANT`, `CHURNED`), or will it remain a simple active/inactive flag?
2. **Contact Visibility Scope**:
   - Currently, `MEMBER` users can view all contacts across accounts, but may only edit/close contacts they own.
   - *Confirmation needed*: Should Member visibility remain team-wide (read-all), or should contact list queries be strictly restricted to assigned contacts/accounts owned by the user?
3. **Duplicate Rule Constraints**:
   - The frontend enforces: (a) unique email address globally, OR (b) unique name within the same company (`companyId` + `name`).
   - *Confirmation needed*: Will the database enforce both as hard constraints (HTTP 409 Conflict), or should duplicate name within a company generate an informational warning?
4. **Follow-Up Ownership & Delegation**:
   - Follow-up tasks have their own `ownerId` separate from the contact's `ownerId`. Admins can assign any active user; Members can only assign themselves.
   - *Confirmation needed*: Is peer-to-peer delegation permitted where a Member can assign tasks to other colleagues, or should follow-up ownership strictly follow the contact owner?




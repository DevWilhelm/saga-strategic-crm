# Strategic CRM — Frontend Architecture & Users Module Specification

> **Module**: Users Management & Role-Based Access Control (RBAC)  
> **Environment**: React 18, TypeScript, Tailwind CSS, TanStack Query v5, MSW (Mock Service Worker), Zod  
> **Backend Integration Ready**: Pure RESTful API contract with zero hardcoded UI state  

---

## 1. Architectural Structure & Directory Layout

The application follows a feature-driven, domain-modular architecture. All security, user management, and permissions logic are decoupled into dedicated layers:

```
frontend/
├── docs/
│   └── API_CONTRACT.md              # Full REST API specification and Spring Boot handoff contract
├── src/
│   ├── api/
│   │   ├── client.ts                # Axios client with base URL and error interceptors
│   │   ├── accountsApi.ts           # Accounts module API client
│   │   └── usersApi.ts              # Users module API client (fully typed)
│   ├── auth/
│   │   ├── Can.tsx                  # Declarative <Can perform="action"> guard component
│   │   └── permissions.ts           # Pure role-to-permission mapping and can() evaluation helper
│   ├── components/
│   │   ├── common/
│   │   │   ├── ConfirmDialog.tsx    # Styled inline confirmation modal (Activate/Deactivate)
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
│   │   │   ├── accounts.ts          # MSW handlers for accounts, contacts, notes, lookups
│   │   │   └── users.ts             # MSW handlers for /api/me, /api/users, password endpoints
│   │   └── store.ts                 # Unified in-memory store shared across all modules
│   ├── pages/
│   │   ├── NotFoundPage.tsx         # Styled 404 page for unmatched URLs
│   │   └── PlaceholderPage.tsx      # Stub component for features under development
│   ├── types/
│   │   ├── account.ts               # Account and lookup TypeScript interfaces
│   │   └── user.ts                  # User, request DTOs, and paginated response models
│   └── App.tsx                      # Root route configuration with route guards
```

---

## 2. Complete REST Endpoint Table

All endpoints communicate using JSON payloads over HTTP with standard status codes.

| Method | Endpoint URL | Description | Required Permission | Request Body DTO | Response Body | HTTP Codes |
|---|---|---|---|---|---|---|
| `GET` | `/api/me` | Retrieves current authenticated user profile & granted permissions | Authenticated (`*`) | — | `CurrentUser` | `200` |
| `POST` | `/api/me/change-password` | Self-service password change for currently authenticated user | Authenticated (`*`) | `ChangePasswordDTO` | Empty (`204`) | `204`, `400` |
| `GET` | `/api/users` | Paginated search, role/status filtering, and sorting (`name`, `updatedDate`) | `user.manage` (`ADMIN`) | — | `PaginatedUsersResponse` | `200`, `400`, `403` |
| `GET` | `/api/users/options` | Retrieves active users for owner dropdowns | Authenticated (`*`) | — | `UserOption[]` | `200` |
| `GET` | `/api/users/{id}` | Retrieves full user detail by ID with associated account/contact counts | `user.manage` (`ADMIN`) | — | `UserListItem` | `200`, `403`, `404` |
| `POST` | `/api/users` | Creates a new user profile with initial password and role | `user.manage` (`ADMIN`) | `CreateUserDTO` | `User` (no password) | `201`, `400`, `403` |
| `PUT` | `/api/users/{id}` | Full update of user (name, code, username, role, status) with full validation | `user.manage` (`ADMIN`) | `UpdateUserDTO` | `User` | `200`, `400`, `403`, `404`, `409` |
| `PATCH` | `/api/users/{id}/status` | Quick Activate / Deactivate status toggle action | `user.manage` (`ADMIN`) | `UpdateUserStatusDTO` | `User` | `200`, `400`, `403`, `404`, `409` |
| `POST` | `/api/users/{id}/reset-password` | Admin resets password for specified user | `user.manage` (`ADMIN`) | `ResetPasswordDTO` | Empty (`204`) | `204`, `400`, `403`, `404` |

### Key Business Conflict Rules (HTTP 409 Conflict)
1. **Self-Deactivation Protection**: An administrator cannot deactivate their own active user account via `PUT /api/users/{id}` or `PATCH /api/users/{id}/status`.
2. **Last Active Admin Protection**: The system will prevent deactivating or demoting the only remaining active `ADMIN` in the system, preventing administrative lockout.

---

## 3. Permissions Matrix by Role

Permissions are derived **strictly** from the assigned `UserRole`. Custom per-user permission overrides are prohibited in adherence to the relational ER model.

| Permission Action | Description | ADMIN | MEMBER | VIEWER |
|---|---|:---:|:---:|:---:|
| `dashboard.view` | Access executive dashboard, KPI cards, and charts | ✅ | ✅ | ✅ |
| `accounts.view` | View accounts list, search, filter, and inspect account details | ✅ | ✅ | ✅ |
| `account.create` | Create new client accounts | ✅ | ✅ | ❌ |
| `account.edit` | Update writable account fields and log follow-ups | ✅ | ✅ | ❌ |
| `account.reassignOwner` | Reassign account ownership to another active team member | ✅ | ❌ | ❌ |
| `contacts.view` | View contacts and relationship intelligence | ✅ | ✅ | ✅ |
| `lookup.manage` | Add or modify business lines, categories, sub-categories, and services | ✅ | ❌ | ❌ |
| `user.manage` | Access user list, create users, edit profiles, toggle status, reset passwords | ✅ | ❌ | ❌ |

### Security Guarantees
- **Zero Stored Passwords in UI**: Password fields exist exclusively in `CreateUserDTO`, `ResetPasswordDTO`, and `ChangePasswordDTO`. They are never returned by any endpoint, never stored in client state, never logged, and cleared immediately after submission.
- **Foreign Key Integrity**: User records are deactivated (`ACTIVE` / `INACTIVE`) and **never deleted**, preserving referential integrity across accounts, contacts, and audit trails.

---

## 4. Open Questions & Future Considerations

During the implementation of the Users and Permissions module, the following design decisions and questions were identified for team alignment prior to backend integration:

1. **Authentication Architecture & Identity Provider (SSO vs Local Passwords)**:
   - *Question*: Will production authentication rely solely on local username/password credentials via Spring Security (JWT / OAuth2 Resource Server), or will enterprise Single Sign-On (SSO) via Microsoft Entra ID (Azure AD), Google Workspace, or Okta be required?
   - *Impact*: If SSO is used, password management (reset/change) will be delegated to the identity provider, and local password fields on the frontend will become unnecessary or secondary.

2. **Password Complexity & Expiration Policies**:
   - *Question*: Does the organization require enhanced password policies (e.g., minimum 10–12 characters, mandatory special characters, non-reusable password history of 3–5 iterations, or 90-day expiration)?
   - *Impact*: The frontend Zod schemas and backend validator should align on the exact regex constraints.

3. **User Invitation & Email Notification Lifecycle**:
   - *Question*: When an admin creates a new user via `POST /api/users`, should the system automatically send an onboarding invitation email with an activation link and temporary token, rather than requiring the admin to manually specify and communicate an initial password?
   - *Impact*: Would introduce an invitation status (`INVITED`, `ACTIVE`, `INACTIVE`) and an invite token verification flow.

4. **User Profile Photo Storage & URL Access (Signed vs Public URLs)**:
   - *Question*: Where will user profile photos be stored in production (e.g., Azure Blob Storage, AWS S3)? Who may open the image URL—should photo URLs be publicly accessible on a CDN or require temporary signed URLs (SAS tokens)?
   - *Impact*: Affects backend image upload pipeline, URL expiry handling in frontend cache, and CORS configuration.

5. **Email Uniqueness Constraint**:
   - *Question*: Should the user `email` field enforce a strict database-level unique constraint (`UNIQUE`), or can multiple test/service accounts share an email address?
   - *Impact*: Backend database migration and 409 Conflict validation on create/update endpoints.

6. **Email Provisioning & Microsoft Entra ID Integration**:
   - *Question*: Will user emails be manually editable by users and administrators, or will email addresses be synchronized automatically from Microsoft Entra ID (Azure AD) via SCIM / OIDC claims as read-only fields?
   - *Impact*: If synced via SSO, email inputs in the personal info and user management forms should be rendered read-only.

7. **Contact Information Visibility & Privacy**:
   - *Question*: Who is authorized to see a colleague's email address and phone number? Should phone and email be visible to all authenticated users (`MEMBER`, `VIEWER`), or restricted strictly to administrators (`ADMIN`) and assigned account teams?
   - *Impact*: Backend serialization filters for `/api/users` and `/api/users/options` (currently `/api/users/options` exposes only `id`, `name`, `code`, and `photoUrl`, suppressing `email` and `phone`).

8. **Relational ER Diagram Schema Updates**:
   - *Question*: The core `USER` table in the relational ER diagram requires schema extensions: `email` (VARCHAR 254), `phone_no` (VARCHAR 20), and a photo reference/URL (`photo_url` VARCHAR 500).
   - *Impact*: Database migration script (Flyway / Liquibase) needs to add these nullable columns to ensure foreign-key and audit-trail compatibility.

9. **Granular Account Ownership Access Controls (Row-Level Security)**:
   - *Question*: For `MEMBER` users, should they have permission to edit *any* account, or strictly accounts where `ownerId == currentUserId`?
   - *Impact*: If row-level security is enforced, the frontend and backend permissions check must evaluate record-level ownership in addition to the static role-based permission map.

# Final Implementation Plan: Frontend Updates & Backend Teammate Integration Guide

> **Document Status**: Final Approved Plan  
> **Development Boundary (Strict Rule)**:  
> - **Backend**: **ZERO backend code development**. Deliver a comprehensive, ready-to-implement **Backend Integration Guide** (`docs/BACKEND_INTEGRATION_GUIDE.md`) and updated `docs/API_CONTRACT.md` for the Java + Spring Boot backend teammate.  
> - **Frontend**: Focused UI enhancements in React + TypeScript + Tailwind CSS with local MSW mock synchronization.

---

## 1. Mandated Tech Stack Matrix

| Area | Mandated Technology | Project Application |
|---|---|---|
| **Frontend** | **React + TypeScript** | Strict types, zero `any`, clean component architecture. |
| **UI Framework** | **Tailwind CSS** | Styling strictly with `theme.css` tokens (no ad-hoc hex values). |
| **Backend (Teammate)** | **Java + Spring Boot** | Documented in `docs/BACKEND_INTEGRATION_GUIDE.md` (no Java code created). |
| **API Specification** | **REST + OpenAPI** | OpenAPI 3 (Springdoc) specifications in docs. |
| **Database (Teammate)**| **PostgreSQL** | DDL migration scripts provided in the integration guide. |
| **Sign-in** | **Microsoft Entra ID** | Architecture guide for future SSO + local Username/Email auth. |
| **Hosting** | **Microsoft Azure** | Target environment considerations documented. |
| **Testing & Tools** | **Git, IntelliJ, VS Code, Vitest, Postman, JUnit** | Tooling standards for both teams. |

---

## 2. Work Breakdown: Frontend Development vs. Backend Documentation

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PROJECT BOUNDARY                              │
├──────────────────────────────────┬─────────────────────────────────────┤
│   FRONTEND CODE DEVELOPMENT      │   BACKEND TEAMMATE DELIVERABLE      │
│   (React + TypeScript + Tailwind)│   (Documentation Only - No Code)    │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 1. Account Filter Dependency     │ 1. docs/BACKEND_INTEGRATION_GUIDE.md│
│ 2. Account Detail Field Split    │    - PostgreSQL Flyway DDL Script   │
│ 3. Notes Tab -> History Note     │    - Spring Boot Controller Specs   │
│ 4. Roles: SUPER_ADMIN, ADMIN,    │    - Role Scoping JPA Query logic   │
│    MEMBER (drop VIEWER)          │    - 409 Conflict Rules & Responses │
│ 5. User Creation Scoping         │    - Microsoft Entra ID Roadmap     │
│ 6. Login Screen (/login)         │ 2. docs/API_CONTRACT.md Updates     │
│ 7. Essential (Required) Email    │    - POST /api/auth/login contract  │
│ 8. Topbar Persona Switcher       │    - User DTOs with managerId & role│
│ 9. Local MSW Mock Sync           │                                     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Detailed Frontend Implementation Plan

### A. Account Module
1. **Sub-Category Filter Dependency (`AccountFiltersBar.tsx`)**:
   - The Sub-Category dropdown is disabled with `disabled={!filters.categoryId}`.
   - Visible disabled styling: `opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800`.
   - First option placeholder: `!filters.categoryId ? 'Select a category first' : 'All Sub-Categories'`.
   - `availableSubCategories`: strictly filtered by `s.categoryId === filters.categoryId` (empty array when no category is selected).
   - Auto-reset: Changing or clearing Category resets Sub-Category to `undefined`.
2. **URL Query Parameter Sanitation (`AccountListPage.tsx`)**:
   - If `categoryId` is missing in URL query params, `subCategoryId` is automatically stripped/ignored.
3. **Account Details Field Separation (`AccountOverviewCard.tsx`)**:
   - Remove composite `"Industry Classification"` field.
   - Render two separate labeled grid cells:
     - **Category**: displays `{account.categoryName}`.
     - **Sub-Category**: displays `{account.subCategoryName || '—'}`.
4. **History Notes Tab (`AccountNotesTab.tsx`)**:
   - Rename section header from `"ADD ACTIVITY NOTE"` to `"ADD HISTORY NOTE"` (past activities records).
   - Update textarea placeholder to: *"Record past meetings, calls, or outcomes..."*.
   - Update empty state to: *"No history notes recorded yet"*, with description *"Use the box above to log past meetings, partner discussions, or completed calls."*.
   - Update button label to `"Post History Note"`.

---

### B. User Module & RBAC
1. **Role Model Overhaul**:
   - System roles: **`SUPER_ADMIN`**, **`ADMIN`**, **`MEMBER`**.
   - **`VIEWER`** is completely removed from types, Zod schemas, filters, badges, Topbar, permissions, and mock data.
   - Hierarchy:
     - Exactly ONE `SUPER_ADMIN` in the entire system (`usr-super`, Alex Mercer).
     - Under `SUPER_ADMIN`: multiple `ADMIN` accounts (`managerId: null`).
     - Under each `ADMIN`: multiple `MEMBER` accounts assigned via `managerId: string`.
2. **Creation Permissions & Form Scoping (`UserForm.tsx`)**:
   - `SUPER_ADMIN` can create `ADMIN` and `MEMBER`. When creating `MEMBER`, an **Admin / Manager** dropdown is required to choose which admin the member reports to.
   - `ADMIN` can create only `MEMBER`. The new member is auto-assigned to the current admin (`managerId = currentAdmin.id`), and the Admin dropdown is hidden.
   - `SUPER_ADMIN` is never displayed in the Role dropdown (cannot create a second super admin or change anyone to/from super admin).
   - `MEMBER` accounts cannot access `/users` (blocked with HTTP 403 Forbidden).
3. **User Table & Filter Scoping (`UserTable.tsx`, `UserFiltersBar.tsx`)**:
   - **"Manager / Admin"** column and filter are rendered **only for `SUPER_ADMIN`**.
   - `ADMIN` users see only themselves and their own assigned members in the table.
   - `ADMIN` can edit or reset passwords only for their assigned members.
4. **Login Screen (`src/pages/LoginPage.tsx`)**:
   - Clean, responsive login page at `/login` matching `theme.css`.
   - Single input field: **"Username or Email"**, plus password. Accepts either credential.
5. **Essential (Required) Email**:
   - `email` is made required in `src/types/user.ts`, `userSchema.ts`, `UserForm.tsx`, and `ProfilePage.tsx`.
   - Enforce email format validation and 409 conflict checks on duplicate username or email.
6. **Conflict Handling (`ConflictModalDialog.tsx`)**:
   - Self-deactivation blocker: *"You cannot deactivate your own active account."*
   - Super admin protection: *"The Super Admin account cannot be deactivated or changed."*
7. **Topbar Dev Personas (`Topbar.tsx`)**:
   - `SUPER_ADMIN`: `usr-super` (Alex Mercer)
   - `ADMIN`: `usr-ploy` (Ploy S.)
   - `MEMBER`: `usr-1` (Danai K., reports to Ploy S.)
8. **Local Mock Service Worker (`src/mocks/handlers/users.ts`, `src/mocks/store.ts`)**:
   - Seed hierarchy (`usr-super`, `usr-ploy`, members).
   - Mock `POST /api/auth/login` checking both username and email.
   - Enforce scoping and 409 checks locally for flawless frontend testing.

---

## 4. Backend Teammate Deliverables (Documentation Only)

### 4.1 Standalone Guide: `docs/BACKEND_INTEGRATION_GUIDE.md`
Delivered specifically for the Java + Spring Boot, PostgreSQL, and OpenAPI backend:
1. **PostgreSQL Relational Schema Migration (Flyway/Liquibase)**:
   - DDL statements for `manager_id` foreign key, NOT NULL unique `email`, and role check constraints (`'SUPER_ADMIN', 'ADMIN', 'MEMBER'`).
2. **Spring Boot Architecture Specifications**:
   - Controller signatures (`@RestController`, `@RequestMapping("/api/...")`).
   - Spring Security configuration accepting `usernameOrEmail`.
   - Spring Data JPA Specifications for role-based user query scoping.
   - Custom `@ExceptionHandler` mapping for HTTP 409 Conflict.
3. **Microsoft Entra ID Roadmap**:
   - Integration guidance for `spring-boot-starter-oauth2-resource-server` and JWT claim mapping.

### 4.2 Updated Contract: `docs/API_CONTRACT.md`
- Synchronize all user and account endpoints with new DTO fields (`email` required, `managerId`, role enum, `POST /api/auth/login`).
- Document Category/Sub-Category query parameter rules and History Notes.

---

## 5. Execution Steps & Verification Checklist

1. **Step 1**: Execute Account module frontend updates (filter dependency, field split, history notes).
2. **Step 2**: Update User types, Zod schemas, remove `VIEWER`, add `SUPER_ADMIN` and `managerId`.
3. **Step 3**: Update User UI (`UserForm`, `UserTable`, `UserFiltersBar`, `ProfilePage`, `ConflictModalDialog`).
4. **Step 4**: Implement `LoginPage.tsx` and register route in `App.tsx`.
5. **Step 5**: Update local MSW mock store, handlers, and Topbar personas.
6. **Step 6**: Author `docs/BACKEND_INTEGRATION_GUIDE.md` and update `docs/API_CONTRACT.md` and `README.md`.
7. **Step 7**: Run `npm run build` and `npm run lint` to guarantee 0 errors and zero `any`.

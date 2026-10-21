# Saga Strategic CRM

## Structure

- `frontend/` — Client application (React 18, TypeScript, Tailwind CSS, TanStack Query v5, MSW mock backend, Zod, SheetJS)
- `backend/` — API and server code (Spring Boot 3, Java 21, PostgreSQL, Flyway)
- `docs/` — Project documentation and architecture guides

## Active Feature Branches
- `feature/fe-accounts-contacts`: Complete frontend development of Accounts Module, Contacts & Follow-Ups Module, Users & RBAC Security Layer, and Spreadsheet Engine (Import/Export/Templates). Mock Service Worker (`msw`) powers local simulation with zero external dependencies.

## Key Frontend Modules
- **Accounts**: Corporate profiles, multi-tier classification, deal side, follow-up deadlines, notes, and 13-column Excel import/export.
- **Contacts & Follow-Ups**: Key decision-makers, target angles, persona roles, LinkedIn integration, interactive follow-up urgency engine (`OVERDUE`, `DUE_TODAY`, `UPCOMING`), outcome logs, and 18-column Excel import/export.
- **Users & Permissions**: Centralized RBAC (`SUPER_ADMIN`, `ADMIN`, `MEMBER`), manager hierarchies, profile photo management, and password reset flows.


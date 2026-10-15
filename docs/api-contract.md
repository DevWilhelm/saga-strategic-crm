# API Contract (Draft)

> **Status: DRAFT — needs agreement from frontend and backend before implementation.**
> Change this file only through a pull request that both sides review.

## Conventions

| Topic | Rule |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON request and response bodies, `Content-Type: application/json` |
| Field naming | `camelCase` |
| IDs | Strings (UUID) |
| Timestamps | ISO 8601 UTC strings, e.g. `2026-10-15T09:30:00Z` |
| Auth | `Authorization: Bearer <accessToken>` on every endpoint except `POST /auth/login` and `POST /auth/refresh` |

### Pagination

List endpoints accept `?page=1&pageSize=20` (max `pageSize` 100) and return:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0 }
}
```

### Errors

Every non-2xx response uses this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [{ "field": "email", "message": "Must be a valid email" }]
  }
}
```

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input; `details` lists the fields |
| 401 | `UNAUTHENTICATED` | Missing, invalid, or expired token |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate, e.g. email already in use |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

## Auth — `feature/be-auth`

### `POST /auth/login`

Request:

```json
{ "email": "user@example.com", "password": "secret" }
```

Response `200`:

```json
{
  "accessToken": "jwt...",
  "refreshToken": "opaque...",
  "expiresIn": 900,
  "user": { "id": "uuid", "email": "user@example.com", "name": "Jane Doe", "role": "admin" }
}
```

Errors: `400`, `401` (wrong credentials).

### `POST /auth/refresh`

Request: `{ "refreshToken": "opaque..." }`
Response `200`: same shape as login, without `user`.

### `POST /auth/logout`

Invalidates the refresh token. Request: `{ "refreshToken": "opaque..." }`. Response `204`.

### `GET /auth/me`

Response `200`: the `user` object from login.

## Dashboard — `feature/fe-login-dashboard`

### `GET /dashboard/summary`

Response `200`:

```json
{
  "totals": { "accounts": 0, "contacts": 0 },
  "recentAccounts": [{ "id": "uuid", "name": "Acme Corp", "createdAt": "2026-10-15T09:30:00Z" }],
  "recentContacts": [{ "id": "uuid", "firstName": "Jane", "lastName": "Doe", "createdAt": "2026-10-15T09:30:00Z" }]
}
```

`recentAccounts` and `recentContacts` return at most 5 items, newest first.

## Accounts — `feature/fe-accounts-contacts`

### Account object

```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "industry": "Manufacturing",
  "website": "https://acme.example",
  "phone": "+1 555 0100",
  "ownerId": "uuid",
  "createdAt": "2026-10-15T09:30:00Z",
  "updatedAt": "2026-10-15T09:30:00Z"
}
```

Required on create: `name`. All other fields are optional and may be `null`.

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/accounts?search=&page=&pageSize=` | — | `200` paginated list |
| `POST` | `/accounts` | Account fields without `id`, timestamps | `201` Account |
| `GET` | `/accounts/:id` | — | `200` Account |
| `PATCH` | `/accounts/:id` | Any subset of editable fields | `200` Account |
| `DELETE` | `/accounts/:id` | — | `204` |
| `GET` | `/accounts/:id/contacts` | — | `200` paginated Contact list |

`search` matches `name` case-insensitively.

## Contacts — `feature/fe-accounts-contacts`

### Contact object

```json
{
  "id": "uuid",
  "accountId": "uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@acme.example",
  "phone": "+1 555 0101",
  "title": "CTO",
  "createdAt": "2026-10-15T09:30:00Z",
  "updatedAt": "2026-10-15T09:30:00Z"
}
```

Required on create: `firstName`, `lastName`. `accountId` is optional. `email` must be unique (`409` otherwise).

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/contacts?search=&accountId=&page=&pageSize=` | — | `200` paginated list |
| `POST` | `/contacts` | Contact fields without `id`, timestamps | `201` Contact |
| `GET` | `/contacts/:id` | — | `200` Contact |
| `PATCH` | `/contacts/:id` | Any subset of editable fields | `200` Contact |
| `DELETE` | `/contacts/:id` | — | `204` |

`search` matches first name, last name, and email case-insensitively.

## Open questions

- [ ] Roles: is `admin` / `user` enough, and what can each role do?
- [ ] Deleting an account: delete its contacts, unlink them, or block the delete?
- [ ] Store tokens in httpOnly cookies instead of returning them in the body?
- [ ] Should the backend publish an OpenAPI spec generated from this contract?
- [ ] Mock server for frontend work before the backend is ready (e.g. MSW or json-server)?

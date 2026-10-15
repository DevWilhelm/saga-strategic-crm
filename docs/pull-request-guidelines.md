# Pull Request Guidelines (Draft)

> **Status: DRAFT — agree as a team, then remove this note.**

## Branches

| Branch | Purpose | Merges into |
|---|---|---|
| `main` | Released, stable code | — |
| `develop` | Integration branch for finished features | `main` (release PRs) |
| `feature/fe-*` | Frontend work | `develop` |
| `feature/be-*` | Backend work | `develop` |
| `docs/*`, `fix/*`, `chore/*` | Docs, bug fixes, maintenance | `develop` |

`main` and `develop` are protected: no direct pushes, no force-pushes, no deletion. Every change needs a pull request with at least 1 approval, and all review conversations must be resolved before merging.

## Opening a PR

1. Branch from the latest `develop`.
2. Keep PRs small and focused on one feature or fix (aim for under ~400 changed lines).
3. Fill in the pull request template.
4. If the PR changes an endpoint, update [api-contract.md](api-contract.md) in the same PR and ask someone from the other side (frontend or backend) to review.
5. Rebase on or merge `develop` if your branch falls behind.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.

Example: `feat(accounts): add account list page`

## Reviewing

- Review within 1 working day of being requested.
- Check: does it match the API contract, does it work, is it readable, are there tests where it matters.
- Use **Request changes** only for blocking problems; prefix optional suggestions with `nit:`.
- The author resolves feedback; the reviewer approves once satisfied.

## Merging

- The author merges after approval.
- Use **Squash and merge** into `develop` so each feature is one commit.
- Delete the feature branch after merging.

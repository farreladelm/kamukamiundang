# ADR-0004: Enforce lifecycle rules in PostgreSQL and manage assets explicitly

## Status

Accepted

## Date

2026-08-03

## Context

Manual order activation, concurrent workspace saves, public publishing, and filesystem assets can produce corrupted or unauthorized states unless enforced below application UI. MVP needs reliable cleanup and a fixed invitation storage quota.

## Decision

Enforce critical lifecycle and identity invariants in both application policies and PostgreSQL constraints or triggers.

Order transitions are `pending -> paid -> activated`, `pending -> cancelled`, `paid -> refunded`, and `activated -> refunded`. Invitation transitions are `draft -> published`, `published -> published` for republish, `published -> draft` for unpublish, and `draft|published -> archived`.

Database protection includes unique invitation order relation, unique normalized slug, state constraints, paid-only activation, optimistic draft versioning, and invitation-scoped idempotency keys. Activation locks a paid order, creates at most one invitation, and reaches `activated` atomically. Publishing replaces current snapshot and locks editing atomically.

Store assets on filesystem outside public application directories. Asset rows follow `pending -> processing -> ready`, `pending|processing -> failed`, and `ready|failed -> deleted`. Only ready assets may enter draft or snapshots. Current snapshot references prevent deletion. Each invitation has a 250 MB total ready-asset quota.

Uploads use temporary paths, streaming size limits, magic-byte validation, media validation, temporary normalized variants, atomic final move, and idempotent cleanup of stale temporary or failed assets.

## Alternatives Considered

### Enforce lifecycle only in route or UI code

Rejected. Concurrent requests, direct action calls, or future integrations could bypass UI checks.

### Store uploaded files under `public/`

Rejected. Draft assets and filesystem paths could become accessible without authorization.

### External object storage for MVP

Rejected. Filesystem storage on target VPS is sufficient before public-launch operational requirements.

## Consequences

- Migrations contain triggers and constraints in addition to Prisma model declarations.
- Integration tests must exercise constraints directly against an empty PostgreSQL database.
- Asset service owns filesystem transitions and cleanup; routes never expose storage paths.

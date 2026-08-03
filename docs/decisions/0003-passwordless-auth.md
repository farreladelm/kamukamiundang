# ADR-0003: Separate customer magic-link and admin password sessions

## Status

Accepted

## Date

2026-08-03

## Context

Customers need low-friction private workspace access after manual WhatsApp order handling. Admins need a dashboard identity with stronger credential controls. Customer access must not grant admin capability, and raw authentication tokens must not persist outside browser cookies.

## Decision

Use two distinct authentication paths backed by revocable opaque database sessions with a 24-hour lifetime.

Customer access uses a 256-bit, single-use magic token. The database stores only a token hash, scope, expiry, consumed time, and revoked time. A GET route displays confirmation without consuming the token. A rate-limited POST atomically consumes it and creates a customer session. Admin generates the link and delivers it manually through WhatsApp.

Admin access uses a normalized unique email and an Argon2id password hash. Passwords must be 12-128 characters. Login responses are generic and limited to five failures per 15 minutes per account/network key. Public admin registration and password recovery are excluded from MVP.

Sessions store hashed opaque tokens, actor type and ID, expiry, revocation time, and last-used time. Browser cookies are `HttpOnly`, `Secure` outside localhost, `SameSite=Lax`, and `Path=/`.

## Alternatives Considered

### One session type for customers and admins

Rejected. Actor confusion would make authorization errors more likely.

### JWT sessions

Rejected. Revocation and role changes require denylist infrastructure or short expiries that do not match MVP needs.

### Email-delivered customer magic links

Deferred. MVP operations use admin-generated WhatsApp links and need no email provider.

## Consequences

- Every protected read and write revalidates session and actor authorization through the data access layer.
- Raw magic and session tokens never enter logs, analytics, audit payloads, or database records.
- Customer sessions cannot authorize dashboard operations; admin sessions cannot authorize customer workspace routes.

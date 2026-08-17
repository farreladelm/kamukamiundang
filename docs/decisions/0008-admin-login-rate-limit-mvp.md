# ADR-0008: Use Account-Only Admin Login Throttling for MVP

## Status

Accepted; temporary MVP decision

## Date

2026-08-17

## Context

ADR-0003 defines the long-term admin login protection as five failures per fifteen minutes per account/network key. MVP deployment does not yet provide a documented trusted proxy contract or shared rate-limit store. Reading client IP headers without that contract would allow spoofing, while an in-memory limiter would not behave consistently across multiple application instances.

## Decision

For MVP, rate-limit admin login failures by normalized admin email only:

- Five failed attempts are allowed within a fifteen-minute window.
- The sixth attempt returns the same generic login error, including when the password is correct.
- A successful login clears the account failure counter.
- After fifteen minutes, the failure window expires.
- The limiter remains in application memory.
- The login action does not read or trust client IP headers.

This decision narrows implementation temporarily. It does not replace or amend ADR-0003's long-term account/network target.

## Consequences

- The limiter behaves consistently for one process without trusting spoofable request headers.
- Restarting the process clears failure counters.
- Multiple application instances do not share counters, so this limiter is suitable only for the MVP deployment model.
- All failed attempts for one normalized account share one counter regardless of network.

## Revisit Criteria

Before enabling multiple application instances or treating admin authentication as production-ready:

1. Select and document the trusted proxy/platform client-IP header.
2. Define behavior when the client IP is unavailable or malformed.
3. Move counters to shared durable storage with atomic increments and expiry.
4. Change the key to normalized account plus trusted network identity.
5. Add integration and end-to-end coverage for cross-network behavior.
6. Mark this ADR superseded and implement ADR-0003's account/network policy.

# Task List: Undango

**Status:** Approved scope - execution paused by product owner  
**Specification:** [`docs/PRD.md`](../docs/PRD.md) v0.4 Approved  
**Plan:** [`tasks/plan.md`](./plan.md) v0.3 Approved  

Task prefix menunjukkan delivery gate:

- `MVP-*`: wajib untuk memvalidasi core flow pada development/staging.
- `PR-*`: dikerjakan setelah MVP Gate untuk membuat aplikasi layak public launch.

Plan dan task list sudah disetujui. Tidak ada task implementation yang boleh dimulai sampai product owner memberikan instruksi start development secara eksplisit.

## Definition of Done

- Acceptance criteria task terpenuhi dan focused tests ditulis lebih dulu.
- Authorization, validation, ownership, state transition, dan error handling diverifikasi server-side.
- Perubahan maksimal sekitar lima file/path; task dipecah jika scope nyata lebih besar.
- Focused tests, lint, typecheck, dan build tetap lulus.
- PRD/plan/ADR diperbarui lebih dulu jika keputusan berubah.

# Phase 1: MVP Core Flow

## MVP Foundation

### MVP-01: Record MVP architecture ADRs

**Acceptance:** ADR merekam application boundaries, versioned templates/snapshot, customer magic-link auth, admin password auth, lifecycle constraints, dan asset lifecycle; seluruhnya konsisten dengan PRD v0.4.  
**Verify:** `git diff --check`; human ADR review.  
**Dependencies:** Plan approved  
**Likely files:** `docs/decisions/0001-application-boundaries.md`, `docs/decisions/0002-template-snapshot.md`, `docs/decisions/0003-passwordless-auth.md`, `docs/decisions/0004-lifecycle-and-assets.md`  
**Scope:** Medium, 4 files

### MVP-02: Establish test harness

**Acceptance:** Vitest, Testing Library, Playwright, `test`, `test:integration`, `test:e2e`, dan `typecheck` scripts tersedia non-watch; unit dan browser smoke test berjalan.  
**Verify:** `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`.  
**Dependencies:** `MVP-01`  
**Likely files:** `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `playwright.config.ts`, `tests/setup.ts`  
**Scope:** Medium, 5 files

### MVP-03: Bootstrap Prisma and PostgreSQL runtime

**Acceptance:** Prisma 7.6 memakai `@prisma/adapter-pg`, singleton server-only pool, generated client output, dan validated `DATABASE_URL`; server module tidak dapat masuk client bundle.  
**Verify:** `pnpm exec prisma validate`; focused DB test; `pnpm build`.  
**Dependencies:** `MVP-02`  
**Likely files:** `package.json`, `pnpm-lock.yaml`, `prisma.config.ts`, `prisma/schema.prisma`, `src/lib/server/db.ts`  
**Scope:** Medium, 5 files

### MVP-04: Define constrained core schema

**Acceptance:** Initial migration mencakup customers, admins/password hashes, orders, invitations, drafts, snapshots, assets, sessions/magic tokens, RSVP, wishes, analytics, dan audit; DB protects unique slug/order relation, allowed transitions, paid-only activation, optimistic version, and idempotency.  
**Verify:** Empty database migration test; policy/trigger integration tests; `pnpm exec prisma validate`.  
**Dependencies:** `MVP-03`  
**Likely files:** `prisma/schema.prisma`, `prisma/migrations/*/migration.sql`, `prisma/seed.ts`, `tests/integration/schema-constraints.test.ts`, `src/features/shared/idempotency.ts`  
**Scope:** Medium, 5 paths

### Checkpoint MVP-A: Foundation

- [ ] `MVP-01` - `MVP-04` reviewed.
- [ ] Empty DB migrates successfully.
- [ ] Invalid state transitions and duplicate activation fail at database boundary.
- [ ] Full local quality commands pass.

## MVP Showroom

### MVP-05: Approve launch collection and template version contract

**Acceptance:** Product owner approves three concepts/licenses; registry contract requires `templateKey`, `templateVersion`, `contentSchemaVersion`, stable palettes, capabilities, schema, and renderer; referenced versions cannot disappear.  
**Verify:** Registry contract tests and manual license review.  
**Dependencies:** Checkpoint `MVP-A`  
**Likely files:** `docs/templates/launch-collection.md`, `docs/templates/licenses.md`, `src/features/templates/types.ts`, `src/features/templates/registry.ts`, `src/features/templates/registry.test.ts`  
**Scope:** Medium, 5 files

### MVP-06: Build shared renderer and Template 1 v1

**Acceptance:** Renderer consumes safe view model plus pinned template version; Template 1 v1 renders realistic core sections on mobile/desktop; no database access exists inside template.  
**Verify:** Renderer tests and manual 360 px/desktop review.  
**Dependencies:** `MVP-05`  
**Likely files:** `src/features/invitations/view-model.ts`, `src/features/templates/render-template.tsx`, `src/features/templates/template-1/v1/definition.ts`, `src/features/templates/template-1/v1/renderer.tsx`, `src/features/templates/render-template.test.tsx`  
**Scope:** Medium, 5 files

### MVP-07: Deliver catalog browsing

**Acceptance:** Public catalog lists only visible template versions with category/price/thumbnail; filter/reset works keyboard/mobile; hidden versions are absent.  
**Verify:** Catalog component tests; `pnpm test:e2e -- --grep "catalog"`.  
**Dependencies:** `MVP-06`  
**Likely files:** `src/app/(showroom)/page.tsx`, `src/features/showroom/catalog.tsx`, `src/features/showroom/category-filter.tsx`, `src/features/showroom/catalog.test.tsx`, `src/app/globals.css`  
**Scope:** Medium, 5 files

### MVP-08: Deliver detail and palette preview

**Acceptance:** Detail renders exact template version/demo, offers only compatible palettes, updates semantic colors without layout mutation, and returns not found for unknown/hidden version.  
**Verify:** Detail tests; `pnpm test:e2e -- --grep "template detail"`.  
**Dependencies:** `MVP-07`  
**Likely files:** `src/app/(showroom)/templates/[slug]/page.tsx`, `src/features/showroom/template-detail.tsx`, `src/features/showroom/palette-selector.tsx`, `src/features/showroom/template-detail.test.tsx`  
**Scope:** Medium, 4 files

### MVP-09: Add Template 2 v1

**Acceptance:** Template 2 has distinct visual language, realistic demo, 3-6 palettes, immutable version identity, responsive tests, and complete license record.  
**Verify:** Template-focused tests and human visual review.  
**Dependencies:** `MVP-06`  
**Likely files:** `src/features/templates/template-2/v1/definition.ts`, `src/features/templates/template-2/v1/renderer.tsx`, `src/features/templates/template-2/v1/renderer.test.tsx`, `src/features/templates/registry.ts`, `docs/templates/licenses.md`  
**Scope:** Medium, 5 files

### MVP-10: Add Template 3 v1

**Acceptance:** Template 3 has distinct visual language, realistic demo, 3-6 palettes, immutable version identity, responsive tests, and complete license record.  
**Verify:** Template-focused tests and human visual review.  
**Dependencies:** `MVP-06`  
**Likely files:** `src/features/templates/template-3/v1/definition.ts`, `src/features/templates/template-3/v1/renderer.tsx`, `src/features/templates/template-3/v1/renderer.test.tsx`, `src/features/templates/registry.ts`, `docs/templates/licenses.md`  
**Scope:** Medium, 5 files

### MVP-11: Connect WhatsApp CTA and basic events

**Acceptance:** CTA carries template/version, current price, palette, and canonical URL; catalog/detail/palette/CTA events store allowlisted non-PII properties with basic rate limit; analytics failure never blocks CTA.  
**Verify:** WhatsApp/event tests; mobile deep-link manual check; CTA E2E.  
**Dependencies:** `MVP-08`, `MVP-09`, `MVP-10`  
**Likely files:** `src/features/showroom/whatsapp.ts`, `src/features/showroom/whatsapp-cta.tsx`, `src/features/analytics/basic-events.ts`, `src/app/api/analytics/events/route.ts`, `src/features/analytics/basic-events.test.ts`  
**Scope:** Medium, 5 files

### Checkpoint MVP-B: Showroom

- [ ] `MVP-05` - `MVP-11` reviewed.
- [ ] Three versioned templates pass visual/license review.
- [ ] Catalog -> detail -> palette -> WhatsApp works without login.
- [ ] Basic events contain no PII and cannot block conversion.

## MVP Admin Operations and Access

### MVP-12: Bootstrap admin credentials and password hashing

**Acceptance:** Argon2id helper accepts password length 12-128, verifies hashes without exposing timing/error detail, and operator bootstrap/reset stores only hash for unique normalized admin email without logging plaintext.  
**Verify:** Password hashing/verification tests; bootstrap/reset integration test confirms no plaintext persistence or output.  
**Dependencies:** `MVP-04`; initial admin credential available through operator-only input  
**Likely files:** `package.json`, `pnpm-lock.yaml`, `src/features/auth/password.ts`, `scripts/admin-credential.ts`, `src/features/auth/password.test.ts`  
**Scope:** Medium, 5 files

### MVP-13: Implement admin dashboard login and session

**Acceptance:** Email/password login creates revocable 24-hour opaque session only for active admin; generic errors and 5 failures/15-minute limit apply; admin session authorizes dashboard routes but is rejected as customer workspace identity.  
**Verify:** Admin login/session integration and E2E tests including invalid password, expiry, revoke, brute force, dashboard access, and workspace rejection.  
**Dependencies:** `MVP-04`, `MVP-12`  
**Likely files:** `src/features/auth/session.ts`, `src/features/auth/admin-auth.ts`, `src/features/auth/policies.ts`, `src/app/auth/admin/actions.ts`, `tests/integration/admin-auth.test.ts`  
**Scope:** Medium, 5 files

### MVP-14: Build admin shell and template visibility

**Acceptance:** Admin routes reveal no data to unauthenticated/non-admin actors; admin can hide/unhide registry entries but cannot alter source-controlled design/version/price.  
**Verify:** Visibility integration test and admin E2E.  
**Dependencies:** `MVP-08`, `MVP-13`  
**Likely files:** `src/app/admin/layout.tsx`, `src/app/admin/templates/page.tsx`, `src/features/admin/admin-nav.tsx`, `src/features/templates/visibility.ts`, `src/features/templates/visibility.test.ts`  
**Scope:** Medium, 5 files

### MVP-15: Deliver customer and pending order intake

**Acceptance:** Admin can create/find customer and record `pending` order with immutable template key/version, schema version, palette, price, photo-count, and storage quota snapshots.  
**Verify:** Order-intake integration test including multiple orders per customer and invalid registry version.  
**Dependencies:** `MVP-04`, `MVP-13`, `MVP-14`  
**Likely files:** `src/app/admin/orders/page.tsx`, `src/app/admin/orders/new/page.tsx`, `src/features/orders/actions.ts`, `src/features/orders/data.ts`, `tests/integration/order-intake.test.ts`  
**Scope:** Medium, 5 files

### MVP-16: Enforce order transitions and atomic activation

**Acceptance:** Only allowed Order transitions succeed; paid-only activation transaction creates exactly one draft Invitation pinned to snapshots and sets Order activated; duplicate/replayed activation returns same result.  
**Verify:** Policy and DB trigger tests; activation E2E.  
**Dependencies:** `MVP-06`, `MVP-15`  
**Likely files:** `src/features/orders/policies.ts`, `src/features/invitations/activation.ts`, `src/app/admin/orders/[orderId]/actions.ts`, `tests/integration/order-transitions.test.ts`, `tests/integration/invitation-activation.test.ts`  
**Scope:** Medium, 5 files

### MVP-17: Issue single-use customer magic links

**Acceptance:** Admin generates 256-bit single-use link with 24-hour TTL; DB stores hash only; revoke/replace invalidates unused link; dashboard reveals raw link once for manual WhatsApp delivery and never logs/persists it.  
**Verify:** Magic-link issue/copy tests including no raw-token persistence, analytics, audit payload, or logs.  
**Dependencies:** `MVP-13`, `MVP-16`  
**Likely files:** `src/features/auth/magic-link.ts`, `src/features/auth/magic-link-panel.tsx`, `src/app/admin/invitations/[invitationId]/actions.ts`, `src/app/admin/invitations/[invitationId]/page.tsx`, `tests/integration/magic-link-issue.test.ts`  
**Scope:** Medium, 5 files

### MVP-18: Consume magic link into customer session

**Acceptance:** GET confirmation has no side effect; rate-limited atomic POST consume creates one session and rejects replay/expiry/revoke; token disappears from URL/referrer/log; session accesses only owned invitation with active editing access.  
**Verify:** Concurrent consume, replay, ownership, and customer-auth E2E tests.  
**Dependencies:** `MVP-17`  
**Likely files:** `src/app/auth/magic/[token]/page.tsx`, `src/app/auth/magic/[token]/actions.ts`, `src/features/auth/customer-session.ts`, `src/features/auth/customer-policy.ts`, `tests/integration/customer-magic-link.test.ts`  
**Scope:** Medium, 5 files

### Checkpoint MVP-C: Operations

- [ ] `MVP-12` - `MVP-18` reviewed.
- [ ] Admin email/password dashboard auth, workspace rejection, order transitions, activation, and single-use replay defense pass.
- [ ] Order snapshots contain exact template/schema/palette versions.
- [ ] Customer cannot access another invitation.

## MVP Workspace and Assets

### MVP-19: Build versioned draft workspace core

**Acceptance:** Workspace reads/writes mutable draft pinned to template/schema version; compare-and-swap rejects stale saves and preserves local input; locked editing rejects customer writes server-side.  
**Verify:** Workspace-save integration and editor component tests.  
**Dependencies:** `MVP-06`, `MVP-18`  
**Likely files:** `src/app/workspace/invitations/[invitationId]/page.tsx`, `src/features/workspace/workspace-editor.tsx`, `src/features/workspace/actions.ts`, `src/features/invitations/workspace-dto.ts`, `tests/integration/workspace-save.test.ts`  
**Scope:** Medium, 5 files

### MVP-20: Add identity and copy fields

**Acceptance:** Couple/parent names, quote, opening, and closing use shared server/client schema; errors retain draft; optional omissions render without broken layout.  
**Verify:** Section tests and manual mobile focus/keyboard check.  
**Dependencies:** `MVP-19`  
**Likely files:** `src/features/invitations/content-schema.ts`, `src/features/workspace/identity-section.tsx`, `src/features/workspace/copy-section.tsx`, `src/features/workspace/identity-section.test.tsx`  
**Scope:** Medium, 4 files

### MVP-21: Add events, location, and countdown

**Acceptance:** Event date/time stores explicit IANA timezone, Maps URL uses allowlist, and countdown handles browser timezone/past events consistently.  
**Verify:** Timezone/Maps unit tests and manual timezone matrix.  
**Dependencies:** `MVP-19`  
**Likely files:** `src/features/invitations/events.ts`, `src/features/workspace/event-section.tsx`, `src/features/invitations/countdown.tsx`, `src/features/invitations/events.test.ts`, `src/features/workspace/event-section.test.tsx`  
**Scope:** Medium, 5 files

### MVP-22: Add story, gift, and section controls

**Acceptance:** Gift remains informational, unsupported capabilities cannot be enabled, and empty/disabled sections collapse cleanly across three pinned template versions.  
**Verify:** Optional-section tests and three-template preview review.  
**Dependencies:** `MVP-19`, `MVP-20`  
**Likely files:** `src/features/workspace/story-section.tsx`, `src/features/workspace/gift-section.tsx`, `src/features/workspace/section-controls.tsx`, `src/features/invitations/content-schema.ts`, `src/features/workspace/optional-sections.test.tsx`  
**Scope:** Medium, 5 files

### MVP-23: Implement image asset lifecycle

**Acceptance:** Rate-limited image upload follows pending/processing/ready/failed/deleted, validates magic bytes/10 MB/2560 px/photo cap/250 MB quota, atomically writes variants, cleans partial files, and prevents deleting published references.  
**Verify:** Malicious upload, failure cleanup, quota, reconciliation, and protected-delivery integration tests.  
**Dependencies:** `MVP-04`, `MVP-19`  
**Likely files:** `src/features/assets/image-service.ts`, `src/features/assets/lifecycle.ts`, `src/app/api/assets/images/route.ts`, `src/app/api/assets/[assetId]/route.ts`, `tests/integration/image-assets.test.ts`  
**Scope:** Medium, 5 files

### MVP-24: Implement music asset lifecycle

**Acceptance:** MP3/M4A upload follows shared lifecycle, validates magic bytes/15 MB/10 minutes/quota, cleans failure paths, protects delivery, and audio remains optional with user-controlled playback.  
**Verify:** Music lifecycle integration tests and Safari/Chrome mobile manual check.  
**Dependencies:** `MVP-19`, `MVP-23`  
**Likely files:** `src/features/assets/music-service.ts`, `src/features/invitations/audio-player.tsx`, `src/app/api/assets/music/route.ts`, `tests/integration/music-assets.test.ts`, `src/features/invitations/audio-player.test.tsx`  
**Scope:** Medium, 5 files

### Checkpoint MVP-D: Workspace

- [ ] `MVP-19` - `MVP-24` reviewed.
- [ ] Stale write and locked-workspace writes fail.
- [ ] Asset lifecycle, cleanup, published-reference protection, and quota pass.
- [ ] Workspace preview works at 360 px.

## MVP Publish and Guest Flow

### MVP-25: Publish current snapshot and control editing lock

**Acceptance:** Initial publish atomically creates current snapshot and locks editing; reopening editing keeps old snapshot live; republish atomically replaces it; unpublish/archive follow allowed transitions; only admin can perform actions.  
**Verify:** Snapshot isolation, atomic failure, lock, republish, unpublish, archive, and authorization integration/E2E tests.  
**Dependencies:** `MVP-19` - `MVP-24`  
**Likely files:** `src/features/invitations/publication.ts`, `src/features/invitations/snapshot.ts`, `src/app/admin/invitations/[invitationId]/actions.ts`, `src/app/admin/invitations/[invitationId]/page.tsx`, `tests/integration/publication.test.ts`  
**Scope:** Medium, 5 files

### MVP-26: Deliver public invitation route

**Acceptance:** `/i/[slug]` reads only current snapshot and exact pinned renderer; draft edits never leak; unknown/draft/archived are indistinguishable not-found; all core sections remain readable without enhancements.  
**Verify:** Public route E2E across Chromium/WebKit/Firefox and manual WhatsApp WebView/reduced-motion check.  
**Dependencies:** `MVP-25`  
**Likely files:** `src/app/i/[slug]/page.tsx`, `src/app/i/[slug]/not-found.tsx`, `src/app/i/[slug]/opengraph-image.tsx`, `src/features/invitations/public-data.ts`, `e2e/public-invitation.spec.ts`  
**Scope:** Medium, 5 files

### MVP-27: Add idempotent RSVP

**Acceptance:** Published invitation accepts name/attendance/guest count/event with server validation, basic rate limit and honeypot; contact data is absent; scoped idempotency prevents duplicate retry.  
**Verify:** RSVP integration/E2E including invalid status, duplicate key, over-limit, and abuse basics.  
**Dependencies:** `MVP-26`  
**Likely files:** `src/features/guests/rsvp-form.tsx`, `src/features/guests/rsvp-schema.ts`, `src/features/guests/rsvp-service.ts`, `src/app/api/invitations/[slug]/rsvp/route.ts`, `tests/integration/rsvp.test.ts`  
**Scope:** Medium, 5 files

### MVP-28: Add idempotent wishes

**Acceptance:** Published invitation accepts plain-text name/message limits with server validation, basic rate/honeypot, scoped idempotency, no stored XSS; hide/delete semantics follow approved decision.  
**Verify:** Wish integration/E2E including XSS, duplicate key, hidden/deleted, and invalid status.  
**Dependencies:** `MVP-26`; delete semantics approved  
**Likely files:** `src/features/guests/wish-form.tsx`, `src/features/guests/wish-schema.ts`, `src/features/guests/wish-service.ts`, `src/app/api/invitations/[slug]/wishes/route.ts`, `tests/integration/wishes.test.ts`  
**Scope:** Medium, 5 files

### MVP-29: Add owner/admin response management

**Acceptance:** Customer sees only owned invitation responses, admin can select any invitation, pagination is bounded/deterministic, and hide/unhide/delete re-check authorization.  
**Verify:** Response-management integration/E2E including IDOR attempts.  
**Dependencies:** `MVP-27`, `MVP-28`  
**Likely files:** `src/app/workspace/invitations/[invitationId]/responses/page.tsx`, `src/app/admin/invitations/[invitationId]/responses/page.tsx`, `src/features/guests/response-data.ts`, `src/features/guests/response-actions.ts`, `tests/integration/response-management.test.ts`  
**Scope:** Medium, 5 files

### MVP-30: Verify complete MVP core flow

**Acceptance:** E2E covers showroom -> WhatsApp -> admin pending/paid/activation -> single-use access -> draft edit -> publish -> reopen/republish snapshot isolation -> RSVP/wish; all PRD MVP criteria map to evidence.  
**Verify:** `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm build && pnpm test:e2e -- --grep "MVP core"`.  
**Dependencies:** `MVP-01` - `MVP-29`  
**Likely files:** `e2e/mvp-core-flow.spec.ts`, `e2e/mvp-security.spec.ts`, `docs/mvp-validation-checklist.md`, `docs/mvp-validation-report.md`  
**Scope:** Medium, 4 files

## MVP Gate

- [ ] `MVP-01` - `MVP-30` complete and reviewed.
- [ ] Core flow and security/data-integrity invariants pass.
- [ ] Human marks MVP validated on development/staging.
- [ ] Public launch remains blocked.

# Phase 2: Production Readiness

Production Readiness starts only after MVP Gate. These tasks do not block MVP validation.

## Production Product Operations

### PR-01: Build advanced analytics dashboard

**Acceptance:** Admin sees bounded aggregate funnel/date ranges for templates, WhatsApp, activation, publish duration, views, RSVP, and wishes; raw PII never enters events/client; required indexes handle representative volume.  
**Verify:** Aggregate integration tests and fixture reconciliation/query-plan review.  
**Dependencies:** MVP Gate  
**Likely files:** `src/app/admin/metrics/page.tsx`, `src/features/analytics/aggregates.ts`, `src/features/analytics/dashboard.tsx`, `src/features/analytics/range.ts`, `tests/integration/analytics-aggregates.test.ts`  
**Scope:** Medium, 5 files

### PR-02: Add customer PIN recovery if evidence requires it

**Acceptance:** Task starts only after documented support need and approved email provider; PIN is hashed, 10-minute TTL, 5 attempts/15 minutes, generic response, and successful consume creates revocable session. If evidence absent, decision to defer is documented and admin-issued WhatsApp magic link remains support path.  
**Verify:** Product decision record; if built, recovery integration/E2E tests.  
**Dependencies:** MVP Gate and explicit product approval  
**Likely files:** `docs/decisions/0006-customer-recovery.md`, `src/app/auth/recover/actions.ts`, `src/features/auth/customer-pin.ts`, `src/features/auth/customer-pin-email.ts`, `tests/integration/customer-recovery.test.ts`  
**Scope:** Conditional, up to 5 files

## Production Security

### PR-03: Add adaptive abuse protection

**Acceptance:** Production auth/guest/upload/analytics limits use pseudonymous keys; suspicious traffic requires Turnstile; raw IP/token/content is not logged; provider failure follows explicit fail-safe policy.  
**Verify:** Abuse integration tests and staging Turnstile test-key check.  
**Dependencies:** MVP Gate; Turnstile approved  
**Likely files:** `src/features/security/rate-limit.ts`, `src/features/security/turnstile.ts`, `src/features/security/events.ts`, `src/features/security/abuse-policy.ts`, `tests/integration/abuse-protection.test.ts`  
**Scope:** Medium, 5 files

### PR-04: Complete security and privacy hardening

**Acceptance:** CSP/HSTS/frame/content-type/referrer/permissions policies match resources; every protected boundary appears in authorization matrix; dependency audit/threat review has no unmitigated reachable critical/high risk.  
**Verify:** Authorization matrix, security headers, audit triage, full lint/type/test/build.  
**Dependencies:** `PR-03`; `PR-02` if implemented  
**Likely files:** `next.config.ts`, `src/lib/server/env.ts`, `src/lib/server/errors.ts`, `tests/integration/authorization-matrix.test.ts`, `docs/security-review.md`  
**Scope:** Medium, 5 files

## Production Deployment

### PR-05: Containerize app and PostgreSQL

**Acceptance:** Node 22 app and PostgreSQL 18 run on private Compose network; DB/assets persist across recreation; secrets are external; migration is one-off job; image is immutable/commit-tagged.  
**Verify:** `docker compose config`; clean-host migration/restart/persistence smoke test.  
**Dependencies:** MVP Gate; VPS baseline approved  
**Likely files:** `Dockerfile`, `.dockerignore`, `compose.yaml`, `compose.production.yaml`, `docs/deployment.md`  
**Scope:** Medium, 5 files

### PR-06: Add CI and release pipeline

**Acceptance:** CI uses frozen pnpm install, lint, typecheck, tests, build, and E2E; deployment requires approved commit, applies migrations before app switch, verifies readiness, and retains prior image for rollback.  
**Verify:** CI run and staging deploy/rollback drill.  
**Dependencies:** `PR-05`; Git remote approved  
**Likely files:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `scripts/deploy.sh`, `scripts/rollback.sh`, `docs/deployment.md`  
**Scope:** Medium, 5 files

### PR-07: Add Nginx and TLS

**Acceptance:** HTTPS-only public ingress, private app/DB ports, upload/proxy/rate limits, streaming support, secure forwarded headers, and no magic-token access logs; Certbot renewal works.  
**Verify:** `nginx -t`, TLS renewal dry-run, upload/429/streaming/token-log smoke tests.  
**Dependencies:** `PR-03`, `PR-05`; DNS ready  
**Likely files:** `infra/nginx/undango.conf`, `infra/nginx/rate-limits.conf`, `compose.production.yaml`, `docs/deployment.md`, `docs/rollback.md`  
**Scope:** Medium, 5 files

## Production Reliability

### PR-08: Add backup and restore automation

**Acceptance:** Nightly DB/assets backup keeps seven local copies; weekly encrypted off-host copy has owner; checksums and success/failure records exist; fresh host restores known invitation.  
**Verify:** Backup dry-run, checksum, full restore drill.  
**Dependencies:** `PR-05`; off-host target approved  
**Likely files:** `infra/backup/backup.sh`, `infra/backup/restore.sh`, `infra/backup/verify.sh`, `compose.production.yaml`, `docs/disaster-recovery.md`  
**Scope:** Medium, 5 files

### PR-09: Add monitoring and operational alerts

**Acceptance:** Liveness/readiness separated; disk warns 70%, critical 85%, blocks new uploads 90%; backup/deploy/process failures alert named owner; no PII/secrets in telemetry.  
**Verify:** Health, threshold, process-failure, and alert-delivery simulations.  
**Dependencies:** `PR-05`, `PR-08`  
**Likely files:** `src/app/api/health/live/route.ts`, `src/app/api/health/ready/route.ts`, `infra/monitoring/disk-check.sh`, `infra/monitoring/health-check.sh`, `docs/operations.md`  
**Scope:** Medium, 5 files

## Production Launch

### PR-10: Run browser, device, accessibility, and performance verification

**Acceptance:** Core public/admin/workspace journeys pass supported browsers and physical mobile/WhatsApp WebView; reduced motion/audio/Maps/failure states work; agreed minimum accessibility/performance findings are resolved or accepted.  
**Verify:** Production-like Playwright matrix, Lighthouse/manual evidence, device checklist.  
**Dependencies:** `PR-04`, `PR-07`, `PR-09`  
**Likely files:** `e2e/production-browser-matrix.spec.ts`, `e2e/production-security.spec.ts`, `docs/device-checklist.md`, `docs/accessibility-review.md`, `docs/performance-review.md`  
**Scope:** Medium, 5 files

### PR-11: Run public-launch gate

**Acceptance:** Full suites pass; production smoke, adaptive abuse, TLS renewal, backup restore, monitoring, deployment rollback, and PRD traceability have evidence; no critical/high unresolved risk; human launch approval recorded.  
**Verify:** Full repository commands, production drills, signed launch report.  
**Dependencies:** `PR-01`, `PR-02` decision, `PR-03` - `PR-10`  
**Likely files:** `docs/release-checklist.md`, `docs/security-review.md`, `docs/disaster-recovery.md`, `docs/launch-report.md`, `e2e/public-launch.spec.ts`  
**Scope:** Medium, 5 files

## Production Readiness Gate

- [ ] `PR-01` and `PR-03` - `PR-11` complete; `PR-02` completed or explicitly deferred with evidence.
- [ ] Security, TLS, deployment, rollback, backup/restore, monitoring, and browser/device gates pass.
- [ ] Product owner explicitly approves public launch.

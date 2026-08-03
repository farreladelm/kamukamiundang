# Task List: MVP Undango

**Status:** Blocked - menunggu approval `tasks/plan.md`  
**Specification:** [`docs/PRD.md`](../docs/PRD.md) v0.2 Approved  
**Plan:** [`tasks/plan.md`](./plan.md) Draft  

Tidak ada task implementasi yang boleh dimulai sebelum plan dan task list disetujui. Checklist ini mendefinisikan Phase 3, bukan memberikan authorization untuk mengubah kode.

## Definition of Done

Setiap task implementasi dianggap selesai hanya jika:

- Acceptance criteria task terpenuhi.
- Focused test ditulis lebih dulu dan lulus.
- `pnpm lint`, `pnpm test`, dan `pnpm build` tetap lulus; `pnpm test:e2e` dijalankan pada checkpoint terkait.
- Tidak ada authorization, validation, secret, PII, atau error detail yang hanya dilindungi client-side.
- Perubahan maksimal sekitar lima file; task dipecah lagi bila scope nyata lebih besar.
- PRD, plan, dan ADR diperbarui lebih dulu jika keputusan berubah.

## Phase A: Architecture and Foundation

### Task 1: Record approved architecture decisions

**Description:** Setelah plan disetujui, tulis ADR untuk modular monolith/DAL, passwordless database sessions, source-controlled templates plus filesystem assets, serta single-VPS deployment.

**Acceptance criteria:**
- [ ] Empat ADR berstatus Accepted dan merekam context, decision, alternatives, consequences, serta risk.
- [ ] ADR tidak mengubah keputusan PRD atau plan tanpa approval baru.
- [ ] Setiap keputusan implementation yang mahal dibalik memiliki owner jelas.

**Verification:**
- [ ] `git diff --check` lulus.
- [ ] Manual review: ADR konsisten dengan `docs/PRD.md` dan `tasks/plan.md`.

**Dependencies:** Plan approved  
**Files likely touched:** `docs/decisions/0001-application-boundaries.md`, `docs/decisions/0002-passwordless-auth.md`, `docs/decisions/0003-template-and-asset-storage.md`, `docs/decisions/0004-vps-deployment.md`  
**Estimated scope:** Medium, 4 files

### Task 2: Establish quality harness

**Description:** Pasang Vitest, Testing Library, Playwright, typecheck, dan scripts reproducible sebelum behavior baru dibuat.

**Acceptance criteria:**
- [ ] `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, dan `pnpm typecheck` tersedia dengan mode non-watch untuk automation.
- [ ] Satu unit test dan satu browser smoke test membuktikan harness berjalan.
- [ ] Playwright menjalankan production build melalui `webServer` dan menyimpan artifact hanya saat gagal.

**Verification:**
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` lulus.

**Dependencies:** Task 1  
**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `vitest.config.mts`, `playwright.config.ts`, `tests/setup.ts`  
**Estimated scope:** Medium, 5 files

### Task 3: Bootstrap Prisma runtime

**Description:** Pasang Prisma 7.6, PostgreSQL driver adapter, generated client output, environment validation, dan singleton server-only connection.

**Acceptance criteria:**
- [ ] Prisma client memakai `@prisma/adapter-pg` dan satu reusable pool per process.
- [ ] Missing atau invalid `DATABASE_URL` gagal saat server initialization dengan error non-secret.
- [ ] Browser bundle tidak dapat mengimpor database module.

**Verification:**
- [ ] `pnpm exec prisma validate` lulus.
- [ ] `pnpm test -- src/lib/server/db.test.ts` lulus.
- [ ] `pnpm build` lulus tanpa database secret di client output.

**Dependencies:** Task 2  
**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `prisma.config.ts`, `prisma/schema.prisma`, `src/lib/server/db.ts`  
**Estimated scope:** Medium, 5 files

### Task 4: Define core schema and domain policies

**Description:** Bentuk initial migration untuk customer, order, invitation, content version, asset, auth artifacts, guest responses, analytics, audit, dan template visibility; implementasikan lifecycle allowlists sebagai pure policies.

**Acceptance criteria:**
- [ ] Schema menegakkan unique slug, order/invitation relations, token hashes, timestamps, dan price/gallery snapshots.
- [ ] Lifecycle policy menolak invalid transition dan activation dari order selain `paid`.
- [ ] Empty PostgreSQL database dapat menerima migration dan seed minimum secara reproducible.

**Verification:**
- [ ] `pnpm exec prisma validate` dan `pnpm test:integration -- schema` lulus.
- [ ] `pnpm test -- src/features/orders/policies.test.ts src/features/invitations/policies.test.ts` lulus.

**Dependencies:** Task 3  
**Files likely touched:** `prisma/schema.prisma`, `prisma/migrations/*/migration.sql`, `prisma/seed.ts`, `src/features/orders/policies.ts`, `src/features/invitations/policies.ts`  
**Estimated scope:** Medium, 5 paths

## Checkpoint A: Foundation

- [ ] Tasks 1-4 reviewed.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm build` lulus.
- [ ] Migration diuji pada database kosong.
- [ ] Human confirms schema, auth threat model, dan dependency list sebelum showroom work.

## Phase B: Showroom Vertical Slice

### Task 5: Approve launch collection and template contract

**Description:** Tetapkan tiga konsep template launch, visual references, font/image licenses, stable keys, content schema, palette token contract, dan capability matrix.

**Acceptance criteria:**
- [ ] Product owner menyetujui tiga template concept dan minimum tiga palette per template.
- [ ] Semua font, image, ornament, dan music demo memiliki license record.
- [ ] Type contract melarang arbitrary color, CSS, font, atau layout input.

**Verification:**
- [ ] `pnpm test -- src/features/templates/registry.test.ts` lulus.
- [ ] Manual review: design brief dan license inventory disetujui.

**Dependencies:** Checkpoint A  
**Files likely touched:** `docs/templates/launch-collection.md`, `docs/templates/licenses.md`, `src/features/templates/types.ts`, `src/features/templates/registry.ts`, `src/features/templates/registry.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 6: Build shared renderer with Template 1

**Description:** Buat normalized `InvitationViewModel`, renderer context, dan template pertama memakai realistic demo content serta responsive mobile-first layout.

**Acceptance criteria:**
- [ ] Renderer menerima safe view model tanpa database access.
- [ ] Template 1 menampilkan semua core section yang disetujui dan tetap readable tanpa client JavaScript tambahan.
- [ ] Demo, workspace, dan public modes memakai contract sama tanpa mode-specific data leak.

**Verification:**
- [ ] `pnpm test -- src/features/templates/template-renderer.test.tsx` lulus.
- [ ] Manual visual check pada viewport 360 px dan desktop.

**Dependencies:** Task 5  
**Files likely touched:** `src/features/invitations/view-model.ts`, `src/features/templates/template-renderer.tsx`, `src/features/templates/template-1/definition.ts`, `src/features/templates/template-1/renderer.tsx`, `src/features/templates/template-renderer.test.tsx`  
**Estimated scope:** Medium, 5 files

### Task 7: Deliver catalog browsing

**Description:** Ganti starter page dengan catalog public yang mengambil active registry entries, menampilkan harga Rupiah, dan memfilter kategori tanpa login.

**Acceptance criteria:**
- [ ] Hanya template visible yang tampil dengan nama, category, thumbnail, dan consistent price.
- [ ] Category filter dapat dipakai dan direset pada mobile/desktop tanpa kehilangan keyboard access.
- [ ] Empty dan error state sengaja dirancang.

**Verification:**
- [ ] `pnpm test -- src/features/showroom/catalog.test.tsx` lulus.
- [ ] `pnpm test:e2e -- --grep "catalog"` lulus.

**Dependencies:** Task 6  
**Files likely touched:** `src/app/(showroom)/page.tsx`, `src/features/showroom/catalog.tsx`, `src/features/showroom/category-filter.tsx`, `src/features/showroom/catalog.test.tsx`, `src/app/globals.css`  
**Estimated scope:** Medium, 5 files

### Task 8: Deliver template detail and palette preview

**Description:** Tambahkan dynamic detail route, full demo renderer, palette selector, URL-safe selection, dan not-found untuk template hidden/unknown.

**Acceptance criteria:**
- [ ] Detail menunjukkan template, price, demo content, dan hanya palette milik template.
- [ ] Palette change memperbarui semantic tokens tanpa mengganti content/layout.
- [ ] Unknown atau hidden template menghasilkan not found tanpa internal detail.

**Verification:**
- [ ] `pnpm test -- src/features/showroom/template-detail.test.tsx` lulus.
- [ ] `pnpm test:e2e -- --grep "template detail"` lulus.

**Dependencies:** Task 7  
**Files likely touched:** `src/app/(showroom)/templates/[slug]/page.tsx`, `src/features/showroom/template-detail.tsx`, `src/features/showroom/palette-selector.tsx`, `src/features/showroom/template-detail.test.tsx`  
**Estimated scope:** Medium, 4 files

### Task 9: Add Template 2

**Description:** Implementasikan template kedua menggunakan renderer contract tanpa memperluas unrestricted customization surface.

**Acceptance criteria:**
- [ ] Template 2 memiliki distinct visual language, realistic demo, 3-6 palettes, dan complete content capabilities.
- [ ] Registry validation dan responsive rendering lulus.
- [ ] Asset dan font license record diperbarui.

**Verification:**
- [ ] `pnpm test -- src/features/templates/template-2` lulus.
- [ ] Manual visual review pada mobile dan desktop disetujui.

**Dependencies:** Task 6  
**Files likely touched:** `src/features/templates/template-2/definition.ts`, `src/features/templates/template-2/renderer.tsx`, `src/features/templates/template-2/renderer.test.tsx`, `src/features/templates/registry.ts`, `docs/templates/licenses.md`  
**Estimated scope:** Medium, 5 files

### Task 10: Add Template 3

**Description:** Implementasikan template ketiga memakai contract sama dan memenuhi minimum launch collection.

**Acceptance criteria:**
- [ ] Template 3 memiliki distinct visual language, realistic demo, 3-6 palettes, dan complete content capabilities.
- [ ] Registry validation dan responsive rendering lulus.
- [ ] Asset dan font license record diperbarui.

**Verification:**
- [ ] `pnpm test -- src/features/templates/template-3` lulus.
- [ ] Manual visual review pada mobile dan desktop disetujui.

**Dependencies:** Task 6  
**Files likely touched:** `src/features/templates/template-3/definition.ts`, `src/features/templates/template-3/renderer.tsx`, `src/features/templates/template-3/renderer.test.tsx`, `src/features/templates/registry.ts`, `docs/templates/licenses.md`  
**Estimated scope:** Medium, 5 files

### Task 11: Connect WhatsApp conversion and first-party events

**Description:** Tambahkan contextual WhatsApp CTA dan same-origin allowlisted analytics intake untuk showroom funnel.

**Acceptance criteria:**
- [ ] Message memuat template, current price, selected palette, dan canonical detail URL pada mobile/desktop.
- [ ] Detail view, palette selection, dan CTA click tersimpan sebagai compact non-PII events.
- [ ] Unknown event/property ditolak dan analytics failure tidak memblokir CTA.

**Verification:**
- [ ] `pnpm test -- src/features/showroom/whatsapp.test.ts src/features/analytics/events.test.ts` lulus.
- [ ] `pnpm test:e2e -- --grep "WhatsApp"` lulus.

**Dependencies:** Tasks 8-10  
**Files likely touched:** `src/features/showroom/whatsapp-cta.tsx`, `src/features/showroom/whatsapp.ts`, `src/features/analytics/events.ts`, `src/app/api/analytics/events/route.ts`, `src/features/analytics/events.test.ts`  
**Estimated scope:** Medium, 5 files

## Checkpoint B: Showroom

- [ ] Tasks 5-11 reviewed.
- [ ] Three-template catalog and detail journey pass Playwright on mobile and desktop.
- [ ] WhatsApp deep link tested on physical mobile and desktop WhatsApp Web.
- [ ] Analytics records verified free of PII.

## Phase C: Admin Operations and Activation

### Task 12: Integrate transactional mailer

**Description:** Tambahkan server-only Resend mailer untuk PIN dan access messages with verified-domain configuration, idempotency, provider response validation, dan test double.

**Acceptance criteria:**
- [ ] API key hanya dibaca server-side; production sender wajib memakai verified domain.
- [ ] Duplicate retry memakai idempotency key dan failure menghasilkan safe operational state.
- [ ] Free quota assumption serta provider replacement trigger terdokumentasi.

**Verification:**
- [ ] `pnpm test -- src/features/email/mailer.test.ts` lulus dengan mocked provider.
- [ ] Resend test-address smoke check dilakukan pada staging credential.

**Dependencies:** Checkpoint A dan production sender input  
**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `src/features/email/mailer.ts`, `src/features/email/mailer.test.ts`, `.env.example`  
**Estimated scope:** Medium, 5 files

### Task 13: Implement database sessions and admin PIN login

**Description:** Implementasikan opaque session cookie, hashed database token, admin email PIN login, logout, expiry, revoke, dan server-side role policy.

**Acceptance criteria:**
- [ ] Admin login hanya berhasil untuk seeded admin email; generic response mencegah email enumeration.
- [ ] Cookie memakai HttpOnly, Secure production, SameSite=Lax, Path=/, TTL 24 jam.
- [ ] Expired/revoked session dan non-admin direct requests ditolak di DAL/action.

**Verification:**
- [ ] `pnpm test:integration -- admin-auth` lulus termasuk brute-force dan revoke cases.
- [ ] `pnpm test:e2e -- --grep "admin login"` lulus.

**Dependencies:** Tasks 4 and 12  
**Files likely touched:** `src/features/auth/session.ts`, `src/features/auth/admin-auth.ts`, `src/features/auth/policies.ts`, `src/app/auth/admin/actions.ts`, `tests/integration/admin-auth.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 14: Build admin shell and template visibility

**Description:** Buat protected admin layout, navigation, current actor UI, serta hide/unhide template backed by visibility override.

**Acceptance criteria:**
- [ ] Unauthenticated/non-admin users tidak menerima protected data atau UI.
- [ ] Admin dapat hide/unhide; layout/palette/demo/price tidak editable melalui dashboard.
- [ ] Visibility change segera tercermin pada catalog dan direct detail route.

**Verification:**
- [ ] `pnpm test:integration -- template-visibility` lulus.
- [ ] `pnpm test:e2e -- --grep "template visibility"` lulus.

**Dependencies:** Tasks 8 and 13  
**Files likely touched:** `src/app/admin/layout.tsx`, `src/app/admin/templates/page.tsx`, `src/features/admin/admin-nav.tsx`, `src/features/templates/visibility.ts`, `src/features/templates/visibility.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 15: Deliver customer and order intake

**Description:** Tambahkan admin flow untuk create/find customer dan record manual WhatsApp order dengan template/palette/price/gallery snapshots.

**Acceptance criteria:**
- [ ] Existing customer dapat dipakai ulang dan memiliki banyak orders/invitations.
- [ ] Order creation memvalidasi registry keys dan menyimpan immutable snapshots.
- [ ] List/detail hanya menampilkan minimum operational DTO.

**Verification:**
- [ ] `pnpm test:integration -- order-intake` lulus.
- [ ] Manual check: create two orders for one customer.

**Dependencies:** Tasks 4, 13, and 14  
**Files likely touched:** `src/app/admin/orders/page.tsx`, `src/app/admin/orders/new/page.tsx`, `src/features/orders/actions.ts`, `src/features/orders/data.ts`, `tests/integration/order-intake.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 16: Enforce order lifecycle and snapshots

**Description:** Tambahkan order detail actions untuk requested, payment_pending, paid, cancelled, dan refunded menggunakan transition allowlist dan audit event.

**Acceptance criteria:**
- [ ] Invalid transition ditolak walau action dipanggil langsung.
- [ ] Price/gallery/template/palette snapshots tidak berubah saat registry berubah.
- [ ] Actor, from/to status, dan timestamp tercatat tanpa secret/PII berlebih.

**Verification:**
- [ ] `pnpm test -- src/features/orders/policies.test.ts` lulus.
- [ ] `pnpm test:integration -- order-transitions` lulus.

**Dependencies:** Task 15  
**Files likely touched:** `src/app/admin/orders/[orderId]/page.tsx`, `src/features/orders/actions.ts`, `src/features/orders/policies.ts`, `src/features/audit/events.ts`, `tests/integration/order-transitions.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 17: Activate invitation from paid order

**Description:** Implementasikan idempotent activation yang membuat invitation, unique slug, default content, selected template/palette, dan workspace access hanya dari paid order.

**Acceptance criteria:**
- [ ] Non-paid order tidak dapat diaktivasi melalui UI atau direct action.
- [ ] Repeated activation tidak membuat duplicate invitation.
- [ ] Initial content valid terhadap selected template schema dan snapshots order.

**Verification:**
- [ ] `pnpm test:integration -- invitation-activation` lulus.
- [ ] `pnpm test:e2e -- --grep "activate paid order"` lulus.

**Dependencies:** Tasks 6 and 16  
**Files likely touched:** `src/features/invitations/activation.ts`, `src/features/invitations/slug.ts`, `src/features/invitations/default-content.ts`, `src/app/admin/orders/[orderId]/actions.ts`, `tests/integration/invitation-activation.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 18: Issue and manage customer magic links

**Description:** Tambahkan admin action untuk generate, send, revoke, dan rotate reusable 24-hour customer magic link using hashed token storage.

**Acceptance criteria:**
- [ ] Raw token ditampilkan/dikirim sekali dan tidak masuk database, log, analytics, atau error.
- [ ] Link reusable hanya sampai expiry/revoke; rotation invalidates prior link.
- [ ] Admin UI menunjukkan expiry/status tanpa menunjukkan token.

**Verification:**
- [ ] `pnpm test:integration -- magic-link-admin` lulus termasuk replay, expiry, revoke, dan rotate.

**Dependencies:** Tasks 12, 13, and 17  
**Files likely touched:** `src/features/auth/magic-link.ts`, `src/features/auth/magic-link-email.ts`, `src/app/admin/invitations/[invitationId]/actions.ts`, `src/app/admin/invitations/[invitationId]/page.tsx`, `tests/integration/magic-link-admin.test.ts`  
**Estimated scope:** Medium, 5 files

## Checkpoint C: Operations

- [ ] Tasks 12-18 reviewed.
- [ ] Unauthorized and cross-role requests fail server-side.
- [ ] Order snapshot and paid-to-activation paths pass integration/E2E.
- [ ] Magic link secret handling reviewed before customer auth work.

## Phase D: Customer Workspace

### Task 19: Exchange customer magic link for session

**Description:** Implementasikan public magic-link confirmation tanpa side effect, explicit POST exchange, safe redirect, customer session, workspace ownership checks, dan logout.

**Acceptance criteria:**
- [ ] GET confirmation tidak membuat session; explicit POST pada valid reusable link creates 24-hour customer session; expired/revoked/unknown links fail generically.
- [ ] Customer dapat mengakses hanya owned invitations dengan active workspace access.
- [ ] Token dihilangkan dari browser URL setelah exchange, referrer dinonaktifkan, dan token tidak masuk application/proxy logs.

**Verification:**
- [ ] `pnpm test:integration -- customer-magic-link` lulus.
- [ ] `pnpm test:e2e -- --grep "customer magic link"` lulus.

**Dependencies:** Task 18  
**Files likely touched:** `src/app/auth/magic/[token]/page.tsx`, `src/app/auth/magic/[token]/actions.ts`, `src/features/auth/customer-session.ts`, `src/features/auth/customer-policy.ts`, `tests/integration/customer-magic-link.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 20: Add email PIN recovery

**Description:** Implementasikan request PIN, email delivery, verify PIN, attempt budget, expiry, resend invalidation, dan generic responses.

**Acceptance criteria:**
- [ ] PIN berlaku 10 menit, maksimal 5 failed attempts per 15 minutes, dan new PIN invalidates old PIN.
- [ ] Registered/unregistered email menghasilkan externally indistinguishable request response.
- [ ] Verification sukses consumes PIN dan creates 24-hour customer session.

**Verification:**
- [ ] `pnpm test:integration -- pin-recovery` lulus termasuk timing-independent public result checks.
- [ ] `pnpm test:e2e -- --grep "PIN recovery"` lulus dengan fake mailer.

**Dependencies:** Tasks 12 and 19  
**Files likely touched:** `src/app/auth/recover/page.tsx`, `src/app/auth/recover/actions.ts`, `src/features/auth/email-pin.ts`, `src/features/auth/pin-email.ts`, `tests/integration/pin-recovery.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 21: Build versioned workspace core

**Description:** Buat workspace invitation selector, server-safe DTO, form state boundary, live preview bridge, explicit save, dan optimistic version conflict handling.

**Acceptance criteria:**
- [ ] Save persists valid content and refresh restores latest successful version.
- [ ] Stale version returns conflict and preserves local form input instead of overwriting newer data.
- [ ] Client receives no customer/order/auth fields outside workspace need.

**Verification:**
- [ ] `pnpm test:integration -- workspace-save` lulus.
- [ ] `pnpm test -- src/features/workspace/workspace-editor.test.tsx` lulus.

**Dependencies:** Tasks 6, 19, and 20  
**Files likely touched:** `src/app/workspace/invitations/[invitationId]/page.tsx`, `src/features/workspace/workspace-editor.tsx`, `src/features/workspace/actions.ts`, `src/features/invitations/workspace-dto.ts`, `tests/integration/workspace-save.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 22: Add identity and copy fields

**Description:** Tambahkan form schema dan controls untuk pasangan, orang tua, quote, opening, dan closing copy dengan live preview.

**Acceptance criteria:**
- [ ] Required/optional limits divalidasi client dan server memakai schema sama.
- [ ] Invalid input mempertahankan draft dan menunjukkan field-level errors.
- [ ] Template renderer handles omitted optional copy without broken gaps.

**Verification:**
- [ ] `pnpm test -- src/features/workspace/identity-section.test.tsx` lulus.
- [ ] Manual mobile keyboard/focus check.

**Dependencies:** Task 21  
**Files likely touched:** `src/features/invitations/content-schema.ts`, `src/features/workspace/identity-section.tsx`, `src/features/workspace/copy-section.tsx`, `src/features/workspace/identity-section.test.tsx`  
**Estimated scope:** Medium, 4 files

### Task 23: Add events, location, and countdown

**Description:** Tambahkan multi-event details, local date/time with explicit IANA timezone, address, allowlisted Google Maps URL, dan countdown preview.

**Acceptance criteria:**
- [ ] Event timestamps round-trip tanpa implicit WIB assumption.
- [ ] Maps URL validation rejects unsupported schemes/hosts while preserving written address.
- [ ] Countdown remains correct across browser timezone and handles past event gracefully.

**Verification:**
- [ ] `pnpm test -- src/features/invitations/events.test.ts src/features/workspace/event-section.test.tsx` lulus.
- [ ] Manual timezone matrix check.

**Dependencies:** Task 21  
**Files likely touched:** `src/features/invitations/events.ts`, `src/features/workspace/event-section.tsx`, `src/features/invitations/countdown.tsx`, `src/features/invitations/events.test.ts`, `src/features/workspace/event-section.test.tsx`  
**Estimated scope:** Medium, 5 files

### Task 24: Add story, gift, and section controls

**Description:** Tambahkan story, gift account data, optional section toggles, dan safe template capability checks.

**Acceptance criteria:**
- [ ] Gift displays information only and never collects guest payment data.
- [ ] Unsupported section cannot be enabled for selected template.
- [ ] Empty/disabled sections leave no broken spacing in preview.

**Verification:**
- [ ] `pnpm test -- src/features/workspace/optional-sections.test.tsx` lulus.
- [ ] Manual preview check across three templates.

**Dependencies:** Tasks 21 and 22  
**Files likely touched:** `src/features/workspace/story-section.tsx`, `src/features/workspace/gift-section.tsx`, `src/features/workspace/section-controls.tsx`, `src/features/invitations/content-schema.ts`, `src/features/workspace/optional-sections.test.tsx`  
**Estimated scope:** Medium, 5 files

### Task 25: Add image asset pipeline

**Description:** Implementasikan invitation-scoped JPEG/PNG/WebP upload, magic-byte validation, 10 MB limit, max 2560 px normalization, gallery cap, variants, dan protected delivery.

**Acceptance criteria:**
- [ ] Invalid type, spoofed MIME, oversize, over-cap, dan cross-invitation access ditolak.
- [ ] DB/file operation cleans partial state on failure and creates display/thumbnail variants atomically.
- [ ] Draft/public delivery follows ownership/publication status and safe headers.

**Verification:**
- [ ] `pnpm test:integration -- image-assets` lulus with malicious fixtures.
- [ ] `pnpm test:e2e -- --grep "gallery upload"` lulus.

**Dependencies:** Tasks 4 and 21  
**Files likely touched:** `src/features/assets/image-service.ts`, `src/features/assets/policy.ts`, `src/app/api/assets/images/route.ts`, `src/app/api/assets/[assetId]/route.ts`, `tests/integration/image-assets.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 26: Add music asset and controls

**Description:** Implementasikan MP3/M4A upload, magic-byte/duration/15 MB validation, protected delivery, dan accessible play/pause behavior after user interaction.

**Acceptance criteria:**
- [ ] Invalid/spoofed/oversize/over-10-minute audio ditolak dan partial files dibersihkan.
- [ ] Audio tidak mencoba autoplay sebelum browser-permitted interaction dan selalu memiliki pause control.
- [ ] Invitation remains readable and functional when audio fails.

**Verification:**
- [ ] `pnpm test:integration -- music-assets` lulus.
- [ ] Manual Safari mobile and Chrome mobile audio check.

**Dependencies:** Tasks 21 and 25  
**Files likely touched:** `src/features/assets/music-service.ts`, `src/features/invitations/audio-player.tsx`, `src/app/api/assets/music/route.ts`, `tests/integration/music-assets.test.ts`, `src/features/invitations/audio-player.test.tsx`  
**Estimated scope:** Medium, 5 files

### Task 27: Warn and apply direct-live published edits

**Description:** Tambahkan first-save warning per workspace visit, atomic published content update, public revalidation, audit event, dan admin emergency archive path.

**Acceptance criteria:**
- [ ] Published save cannot proceed until customer explicitly confirms public impact.
- [ ] Confirmed save atomically updates content/version and public route; failed save leaves old public version intact.
- [ ] Warning does not grant publish/unpublish/archive capability.

**Verification:**
- [ ] `pnpm test:integration -- published-edit` lulus including stale/failed writes.
- [ ] `pnpm test:e2e -- --grep "published edit warning"` lulus.

**Dependencies:** Tasks 21-26  
**Files likely touched:** `src/features/workspace/published-warning.tsx`, `src/features/workspace/actions.ts`, `src/features/invitations/public-cache.ts`, `src/features/audit/events.ts`, `tests/integration/published-edit.test.ts`  
**Estimated scope:** Medium, 5 files

## Checkpoint D: Workspace

- [ ] Tasks 19-27 reviewed.
- [ ] Cross-customer, expired session, stale write, and upload attack tests pass.
- [ ] Workspace save/refresh/live-preview journey passes on 360 px viewport.
- [ ] Physical-device image and audio checks pass.

## Phase E: Publish and Guest Experience

### Task 28: Add admin publish, unpublish, and archive

**Description:** Implementasikan admin-only visibility transitions, readiness validation, timestamps, audit events, dan public cache invalidation.

**Acceptance criteria:**
- [ ] Customer/direct non-admin requests cannot change visibility.
- [ ] Publish rejects missing required template content and exposes route only after commit succeeds.
- [ ] Unpublish/archive closes route without deleting invitation data.

**Verification:**
- [ ] `pnpm test:integration -- publication-lifecycle` lulus.
- [ ] `pnpm test:e2e -- --grep "admin publish"` lulus.

**Dependencies:** Tasks 17 and 27  
**Files likely touched:** `src/features/invitations/publication.ts`, `src/app/admin/invitations/[invitationId]/actions.ts`, `src/app/admin/invitations/[invitationId]/page.tsx`, `src/features/audit/events.ts`, `tests/integration/publication-lifecycle.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 29: Complete public invitation route

**Description:** Buat `/i/[slug]` memakai public DTO/shared renderer, metadata, not-found privacy, animation reduction, Maps, gallery, gift, story, dan audio integration.

**Acceptance criteria:**
- [ ] Hanya published slug renders; unknown/non-published responses indistinguishable.
- [ ] All populated standard sections render mobile-first and optional sections collapse cleanly.
- [ ] Core information remains readable when JS, animation, image, or audio enhancement fails.

**Verification:**
- [ ] `pnpm test:e2e -- --grep "public invitation"` lulus across Chromium, WebKit, and Firefox.
- [ ] Manual WhatsApp WebView and reduced-motion check.

**Dependencies:** Tasks 6, 23-26, and 28  
**Files likely touched:** `src/app/i/[slug]/page.tsx`, `src/app/i/[slug]/not-found.tsx`, `src/app/i/[slug]/opengraph-image.tsx`, `src/features/invitations/public-data.ts`, `e2e/public-invitation.spec.ts`  
**Estimated scope:** Medium, 5 files

### Task 30: Add public RSVP

**Description:** Tambahkan RSVP form dan endpoint untuk name, attendance, guest count, dan event selection only when relevant.

**Acceptance criteria:**
- [ ] Only published invitation accepts RSVP; name max 100 and guest count respects invitation limit.
- [ ] Contact data tidak diminta/disimpan dan duplicate pending submit diblokir.
- [ ] Server rejects unknown fields and returns consistent safe errors.

**Verification:**
- [ ] `pnpm test:integration -- rsvp` lulus.
- [ ] `pnpm test:e2e -- --grep "RSVP"` lulus.

**Dependencies:** Task 29  
**Files likely touched:** `src/features/guests/rsvp-form.tsx`, `src/features/guests/rsvp-schema.ts`, `src/features/guests/rsvp-service.ts`, `src/app/api/invitations/[slug]/rsvp/route.ts`, `tests/integration/rsvp.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 31: Add public wishes

**Description:** Tambahkan wish form, server sanitization, 100-character name, 1.000-character message, visibility state, delete confirmation contract, dan public list.

**Acceptance criteria:**
- [ ] Only published invitation accepts valid plain-text wishes and React rendering never interprets user HTML.
- [ ] Hidden/deleted wishes do not appear publicly.
- [ ] Delete removes content as approved while retaining content-free audit event.

**Verification:**
- [ ] `pnpm test:integration -- wishes` lulus with stored-XSS fixtures.
- [ ] `pnpm test:e2e -- --grep "wishes"` lulus.

**Dependencies:** Task 29 and approval of delete semantics  
**Files likely touched:** `src/features/guests/wish-form.tsx`, `src/features/guests/wish-schema.ts`, `src/features/guests/wish-service.ts`, `src/app/api/invitations/[slug]/wishes/route.ts`, `tests/integration/wishes.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 32: Add owner/admin response management

**Description:** Buat paginated RSVP/wish views scoped to invitation owner/admin plus hide, unhide, and delete actions.

**Acceptance criteria:**
- [ ] Customer sees only owned invitation responses; admin can select any invitation.
- [ ] List pagination has deterministic ordering and no unbounded query.
- [ ] Hide/unhide/delete actions re-check ownership/role and update public output.

**Verification:**
- [ ] `pnpm test:integration -- response-management` lulus including IDOR cases.
- [ ] `pnpm test:e2e -- --grep "manage responses"` lulus.

**Dependencies:** Tasks 30 and 31  
**Files likely touched:** `src/app/workspace/invitations/[invitationId]/responses/page.tsx`, `src/app/admin/invitations/[invitationId]/responses/page.tsx`, `src/features/guests/response-data.ts`, `src/features/guests/response-actions.ts`, `tests/integration/response-management.test.ts`  
**Estimated scope:** Medium, 5 files

## Checkpoint E: Guest Experience

- [ ] Tasks 28-32 reviewed.
- [ ] Draft/privacy and admin-only publish tests pass.
- [ ] Public invitation works across target browsers and mobile viewport.
- [ ] RSVP/wish validation, XSS, ownership, and pagination tests pass.

## Phase F: Metrics, Hardening, and Deployment

### Task 33: Build admin metrics dashboard

**Description:** Tambahkan aggregate queries dan dashboard untuk template/palette interest, detail-to-WhatsApp ratio, activation rate, delivery duration, workspace save actor, views, RSVP, dan wishes.

**Acceptance criteria:**
- [ ] Metrics derive only from allowlisted events and operational timestamps.
- [ ] Date range and empty state work without loading raw event payload into browser.
- [ ] Query plan remains bounded with required indexes and representative test volume.

**Verification:**
- [ ] `pnpm test:integration -- analytics-aggregates` lulus.
- [ ] Manual reconcile dashboard counts against fixture data.

**Dependencies:** Tasks 11, 16, 27, 30, and 31  
**Files likely touched:** `src/app/admin/metrics/page.tsx`, `src/features/analytics/aggregates.ts`, `src/features/analytics/metrics-dashboard.tsx`, `src/features/analytics/range.ts`, `tests/integration/analytics-aggregates.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 34: Add adaptive abuse protection

**Description:** Implementasikan application rate buckets, HMAC pseudonymous keys, honeypot/min-fill checks, Turnstile escalation/verification, dan security event logging.

**Acceptance criteria:**
- [ ] Auth, RSVP, wish, analytics, dan upload routes have explicit limits and generic 429/error semantics.
- [ ] Raw IP, PIN, token, guest content, dan Turnstile secret tidak disimpan/logged.
- [ ] Suspicious requests require valid Turnstile while normal requests remain friction-light.

**Verification:**
- [ ] `pnpm test:integration -- abuse-protection` lulus including replay/provider failure.
- [ ] Manual staging check with Turnstile test keys.

**Dependencies:** Tasks 20, 25, 30, and 31; Turnstile account approved  
**Files likely touched:** `src/features/security/rate-limit.ts`, `src/features/security/honeypot.ts`, `src/features/security/turnstile.ts`, `src/features/security/events.ts`, `tests/integration/abuse-protection.test.ts`  
**Estimated scope:** Medium, 5 files

### Task 35: Complete security and privacy hardening

**Description:** Tambahkan security headers/CSP, environment allowlist, upload/path audit, structured safe errors, dependency audit, authorization matrix test, dan production threat-model review.

**Acceptance criteria:**
- [ ] CSP, HSTS production, frame, content-type, referrer, and permissions policies match used resources.
- [ ] Every protected action/route has server authorization and IDOR regression coverage.
- [ ] Native dependency audit has no unmitigated reachable critical/high finding.

**Verification:**
- [ ] `pnpm test:integration -- authorization-matrix` lulus.
- [ ] `pnpm audit` triaged; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` lulus.
- [ ] Browser security-header inspection passes on production-like server.

**Dependencies:** Tasks 13-34  
**Files likely touched:** `next.config.ts`, `src/lib/server/env.ts`, `src/lib/server/errors.ts`, `tests/integration/authorization-matrix.test.ts`, `docs/security-review.md`  
**Estimated scope:** Medium, 5 files

### Task 36: Containerize app and PostgreSQL

**Description:** Buat reproducible Node 22 application image, PostgreSQL 18 Compose service, private network, persistent volumes, healthchecks, and one-off migration job.

**Acceptance criteria:**
- [ ] App and database start from clean host using documented commands; PostgreSQL has no public port.
- [ ] Asset/database volumes survive app recreation and secrets are not baked into image.
- [ ] Release image is immutable and tagged by commit SHA.

**Verification:**
- [ ] `docker compose config` lulus.
- [ ] Clean-volume staging deploy, migration, restart, and persistence smoke tests pass.

**Dependencies:** Tasks 3, 4, and 35; VPS baseline approved  
**Files likely touched:** `Dockerfile`, `.dockerignore`, `compose.yaml`, `compose.production.yaml`, `docs/deployment.md`  
**Estimated scope:** Medium, 5 files

### Task 37: Add Nginx, TLS, and release runbook

**Description:** Konfigurasi Nginx reverse proxy, Certbot TLS, upload/body/rate limits, streaming behavior, forwarded headers, readiness routing, and manual release/rollback sequence.

**Acceptance criteria:**
- [ ] Only HTTPS ingress is public; HTTP redirects; database and app ports remain private.
- [ ] Proxy limits match upload requirements and do not buffer intended streaming responses.
- [ ] Magic-link token path tidak masuk access log; release/rollback runbook references immutable image dan forward-only migrations.

**Verification:**
- [ ] `nginx -t` lulus pada staging container/host.
- [ ] TLS renewal dry-run and upload/429/streaming smoke tests pass.

**Dependencies:** Tasks 34 and 36; domain DNS ready  
**Files likely touched:** `infra/nginx/undango.conf`, `infra/nginx/rate-limits.conf`, `compose.production.yaml`, `docs/deployment.md`, `docs/rollback.md`  
**Estimated scope:** Medium, 5 files

### Task 38: Add backup, restore, and disk monitoring

**Description:** Implementasikan nightly PostgreSQL/asset backups, seven-day local rotation, weekly encrypted off-host copy, disk thresholds, upload block, and restore drill.

**Acceptance criteria:**
- [ ] Automated local backup records success/failure; off-host encrypted copy procedure has named owner.
- [ ] 70/85/90 percent disk thresholds alert, escalate, and block only new uploads as planned.
- [ ] Fresh staging host can restore database/assets and serve known invitation from backup.

**Verification:**
- [ ] Backup script dry-run and checksum verification pass.
- [ ] Documented restore drill and disk-threshold simulation pass.

**Dependencies:** Tasks 25, 36, and off-host target approval  
**Files likely touched:** `infra/backup/backup.sh`, `infra/backup/restore.sh`, `infra/monitoring/disk-check.sh`, `compose.production.yaml`, `docs/disaster-recovery.md`  
**Estimated scope:** Medium, 5 files

### Task 39: Run full release verification

**Description:** Lengkapi E2E suite seluruh journey, physical-device checks, performance/accessibility minimum review, production smoke test, rollback drill, dan final launch report. Task ini memverifikasi; tidak menambah scope baru.

**Acceptance criteria:**
- [ ] Discovery, WhatsApp, admin order/activation, customer auth/workspace, publish, live edit, RSVP, wish, and metrics journeys pass.
- [ ] Security, backup restore, rollback, mobile, browser, asset, audio, Maps, and reduced-motion checks have evidence.
- [ ] Semua PRD success criteria mapped ke passing test atau signed manual check.

**Verification:**
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm build && pnpm test:e2e` lulus.
- [ ] `pnpm audit` findings triaged and release checklist signed.
- [ ] Human production launch approval recorded separately.

**Dependencies:** Tasks 1-38  
**Files likely touched:** `e2e/mvp-journeys.spec.ts`, `e2e/security.spec.ts`, `docs/release-checklist.md`, `docs/security-review.md`, `docs/launch-report.md`  
**Estimated scope:** Medium, 5 files

## Final Checkpoint

- [ ] Tasks 1-39 completed and reviewed.
- [ ] PRD success criteria traceability complete.
- [ ] Production backup restore and image rollback demonstrated.
- [ ] No unresolved critical/high security or data-loss risk.
- [ ] Product owner explicitly approves launch.

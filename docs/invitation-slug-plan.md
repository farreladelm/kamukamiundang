# Invitation Slug Plan

## Status

Implemented MVP-26 amendment tracked by #36. Completes public invitation URL ownership before public route publication can be considered finished.

## Decision

- Slug is optional during pending-order creation.
- Invitation may activate without slug.
- Publish is blocked until slug exists.
- Admin can set or change slug only while invitation is `DRAFT`.
- To change published URL, admin unpublishes, changes slug, then republishes.
- MVP does not retain invitation slug aliases. Shared published URLs never silently change.

## Problem

Current activation generates an order-derived slug automatically. Admin cannot choose customer-facing URL during order intake or invitation operations. This prevents intended URLs such as `/i/farrel-kinan-wedding` and makes auto-generated IDs public.

## Slug Contract

Use shared Zod validation for both order intake and admin invitation detail.

```ts
/^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

Rules:

- Blank value is valid only during order intake and before publish.
- Publish requires a non-empty slug.
- Slugs use lowercase letters, numbers, and single hyphens only.
- Spaces, uppercase characters, punctuation, repeated hyphens, and edge hyphens are invalid.
- Length is 3 to 80 characters.
- Example: `farrel-kinan-wedding`.

## Data Model

1. Add nullable `requestedInvitationSlug` to `Order`.
2. Change `Invitation.slug` from required to nullable.
3. Keep unique indexes for non-null values.
4. Preserve all existing invitation slugs during migration.
5. Retain existing lowercase database check; PostgreSQL check constraints permit `NULL`.
6. Remove activation fallback `undangan-<order-id>`.
7. Copy `Order.requestedInvitationSlug` to `Invitation.slug` atomically at activation.

## Uniqueness and Concurrency

Slug claims must be serialized across pending orders and invitations.

1. Start transaction.
2. Acquire PostgreSQL advisory lock using candidate slug.
3. Check `Order.requestedInvitationSlug` and `Invitation.slug` for existing claim.
4. Reject conflict with field-specific validation error.
5. On draft invitation slug edit, update order reservation and invitation slug in same transaction.
6. Preserve table-level unique indexes as database backstops.

This prevents concurrent pending orders or invitations claiming same public URL.

## Order Intake

1. Extend `orderIntakeSchema` with optional slug field.
2. Add `/i/` slug input to manual order form.
3. Pass validated value through order action and creation service.
4. Store requested slug with pending order.
5. Show inline format and uniqueness errors.

## Activation

1. Update paid-order activation service.
2. Create invitation with reserved slug when present, otherwise `NULL`.
3. Preserve current idempotent activation behavior.
4. Do not generate fallback public URL.

## Admin Invitation Detail

1. Add compact inline slug form on invitation detail page.
2. Show current public URL or `URL publik belum diatur`.
3. Permit save only for draft invitations.
4. Require admin session at server action boundary.
5. Record audit event for successful change.
6. Revalidate invitation admin page and affected public route.

## Publish Gate

1. `publishInvitation()` rejects missing slug before creating/replacing snapshot or changing invitation status.
2. Publication controls disable Publish while slug is empty.
3. Detail page shows clear reason: `Atur URL publik sebelum publish.`
4. Server-side gate prevents direct action requests from bypassing UI.

## Tests

- Zod accepts blank order slug and valid kebab-case slug.
- Zod rejects spaces, uppercase, invalid punctuation, repeated/edge hyphens, and over-limit values.
- Order intake persists requested slug.
- Duplicate slug claim returns field error.
- Activation copies reserved slug; empty reservation yields `Invitation.slug = null`.
- Concurrent claims allow only one winner.
- Draft admin slug edit updates order reservation and invitation atomically.
- Published and archived slug edits reject.
- Publish without slug fails without snapshot or status mutation.
- Publish with valid slug succeeds.
- Order and admin forms display inline validation errors.

## Expected Files

- `prisma/schema.prisma`
- New migration under `prisma/migrations/`
- `src/features/forms/schemas.ts`
- `src/features/orders/order-form.tsx`
- `src/app/admin/orders/actions.ts`
- `src/features/orders/data.ts`
- `src/features/orders/activation.ts`
- `src/features/invitations/publication.ts`
- `src/app/admin/invitations/[invitationId]/actions.ts`
- `src/app/admin/invitations/[invitationId]/page.tsx`
- New invitation-slug component/service/tests
- `tests/integration/order-intake.test.ts`
- `tests/integration/publication.test.ts`

## Non-Goals

- Invitation slug aliases or redirects.
- Catalog-template slug changes.
- Public invitation rendering/layout changes.
- RSVP, wishes, response management, or MVP validation evidence.

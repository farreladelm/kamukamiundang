# Project Instructions

## Next.js Documentation

Before Next.js work, read relevant documentation in
`node_modules/next/dist/docs/`. Treat installed documentation as source of
truth.

## Project Stack

- Next.js 16.2.12 with App Router
- React 19.2.4
- TypeScript 5.x in strict mode
- Tailwind CSS 4.x
- PostgreSQL with Prisma 7.6 and `@prisma/adapter-pg`
- Zod for boundary validation
- Argon2 for password hashing
- Framer Motion for animation
- Vitest and Testing Library for unit/component tests
- Playwright for end-to-end tests
- pnpm for package management

## Code Standards

- Follow current best practices for Next.js, React, Tailwind CSS, and
  TypeScript.
- Prefer Server Components. Add `"use client"` only when component needs
  browser APIs, event handlers, or client state.
- Validate untrusted input at server boundaries. Keep authorization and
  business rules on server.
- Use TypeScript types deliberately. Do not use `any` or weaken strictness to
  bypass an error.
- Write readable, maintainable code. Prefer clear names and small focused
  functions over terse code.
- Add concise comments when non-obvious code, business rules, or security
  decisions need explanation.
- Use Tailwind utility classes for styling. Add or change vanilla CSS only when
  Tailwind cannot express requirement cleanly, such as global base styles,
  keyframes, or unavoidable complex selectors.
- Preserve existing design language and responsive behavior. Main flows must
  work from 360px mobile widths through modern desktop.

## Design/UI Direction

This is a customer-facing wedding-invitation SaaS — the showroom, template
previews, and published invitations are the product. "Look modern and
premium" is a standing requirement on that surface, not optional flair to
skip under Scope Discipline below.

- Before touching CSS or markup for looks on `(showroom)`, `templates/[slug]`,
  or `i/[slug]` routes, load `ui-ux-pro-max:ui-ux-pro-max` first (styles,
  palettes, font pairings, motion presets) to pick a deliberate direction,
  then `impeccable` or `design-taste-frontend` for the critique/polish pass —
  don't freehand style choices.
- Use Framer Motion deliberately for entrance/scroll/hover motion on
  public-facing pages — it's an installed dependency for exactly this, not
  dead weight.
- Admin/dashboard screens (`/admin/*`, `/workspace/*`) can stay plainer and
  utilitarian; the design bar above applies to what a customer or guest sees.
- Preserve one coherent design system per surface — consolidate/refactor
  styles you touch instead of only appending one-off tweaks.

## Routing Map

Routes use Next.js App Router under `src/app/`. Folders in parentheses are
route groups and do not appear in URL.

- `src/app/(showroom)/page.tsx` -> `/`: public marketing showroom and catalog.
- `src/app/(showroom)/templates/[slug]/page.tsx` -> `/templates/[slug]`:
  public template detail and preview.
- `src/app/auth/admin/page.tsx` -> `/auth/admin`: admin login.
- `src/app/auth/magic/[token]/page.tsx` -> `/auth/magic/[token]`: customer
  magic-link exchange.
- `src/app/admin/*` -> `/admin/*`: admin dashboard, template catalog, orders,
  and invitation operations. `src/app/admin/layout.tsx` guards this area.
- `src/app/workspace/invitations/[invitationId]/page.tsx` ->
  `/workspace/invitations/[invitationId]`: customer-owned invitation workspace.
- `src/app/api/*/route.ts` -> `/api/*`: route handlers. Current handlers are
  `/api/ai-match` and `/api/analytics/events`.
- Keep route-specific server actions beside their route in `actions.ts`. Keep
  reusable domain logic under `src/features/<domain>/` and shared server
  utilities under `src/lib/server/`.
- Public invitation route defined by PRD is `/i/[slug]`; add it under
  `src/app/i/[slug]/page.tsx` when implementing publication flow.

## Scope Discipline

- Change only requested or approved work.
- Cleanup is allowed only when directly supporting requested work.
- Do not change unrelated behavior merely because it appears in edited file.

## Git Safety

- Never overwrite, revert, or discard others' changes without explicit
  instruction.
- Inspect `git status` before branching, committing, creating an issue or pull
  request, or cleanup.
- Never commit secrets, `.env` files, build output, or generated artifacts not
  tracked by project conventions.
- Run relevant lint, typecheck, tests, and build before declaring feature
  complete.

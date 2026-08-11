<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated; docs are source of truth.

<!-- END:nextjs-agent-rules -->

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

- Follow current best practices for Next.js, React, Tailwind CSS, and TypeScript.
- Prefer Server Components. Add `"use client"` only when component needs browser APIs, event handlers, or client state.
- Validate untrusted input at server boundaries. Keep authorization and business rules on server.
- Use TypeScript types deliberately. Do not use `any` or weaken strictness to bypass an error.
- Write readable, maintainable code. Prefer clear names and small focused functions over terse code.
- Add concise comments when non-obvious code, business rules, or security decisions need explanation. Do not avoid comments merely to shorten code.
- Use Tailwind utility classes for styling. Add or change vanilla CSS only when Tailwind cannot express requirement cleanly, such as global base styles, keyframes, or unavoidable complex selectors.
- Preserve existing design language and responsive behavior. Main flows must work from 360px mobile widths through modern desktop.

## Routing Map

Routes use Next.js App Router under `src/app/`. Folders in parentheses are route groups and do not appear in URL.

- `src/app/(showroom)/page.tsx` -> `/`: public marketing showroom and catalog.
- `src/app/(showroom)/templates/[slug]/page.tsx` -> `/templates/[slug]`: public template detail and preview.
- `src/app/auth/admin/page.tsx` -> `/auth/admin`: admin login.
- `src/app/auth/magic/[token]/page.tsx` -> `/auth/magic/[token]`: customer magic-link exchange.
- `src/app/admin/*` -> `/admin/*`: admin dashboard, template catalog, orders, and invitation operations. `src/app/admin/layout.tsx` guards this area.
- `src/app/workspace/invitations/[invitationId]/page.tsx` -> `/workspace/invitations/[invitationId]`: customer-owned invitation workspace.
- `src/app/api/*/route.ts` -> `/api/*`: route handlers. Current handlers are `/api/ai-match` and `/api/analytics/events`.
- Keep route-specific server actions beside their route in `actions.ts`. Keep reusable domain logic under `src/features/<domain>/` and shared server utilities under `src/lib/server/`.
- Public invitation route defined by PRD is `/i/[slug]`; add it under `src/app/i/[slug]/page.tsx` when implementing publication flow.

## Required Skills

Load and follow the relevant skill before performing its action. Do not substitute its workflow with assumptions.

| Skill | Required when |
|---|---|
| `delivery-workflow` | Planning or implementing a non-trivial feature, bug fix, or change. |
| `github-issue` | Creating a GitHub issue. |
| `branch-name` | Creating a Git branch. |
| `commit-message` | Creating or reorganizing commits. |
| `changelog` | Creating or updating `CHANGELOG.md`. |
| `pull-request` | Preparing or opening a pull request. |

## Workflow Trigger

- For a feature, bug fix, or non-trivial change: explore relevant code and requirements, present an implementation plan, and wait for explicit approval before editing.
- After plan approval, load `delivery-workflow` and follow it through issue creation, branching, implementation, verification, review, and cleanup.
- A trivial, explicitly requested one-phase change may proceed without a plan. Still load any required skill before its specific action.

## Scope Discipline

- Change only work requested by the user or approved in the active plan.
- Cleanup is allowed only when it directly supports the requested work and is within its scope.
- Do not change unrelated behavior merely because it appears in a file already being edited. Report it and ask for approval first.

## Git Safety

- Never overwrite, revert, or discard user changes without explicit instruction.
- Inspect `git status` before branching, committing, creating issue/PR, or cleanup.
- Never commit secrets, `.env` files, build output, or generated artifacts not tracked by project conventions.
- Run relevant lint, typecheck, tests, and build before declaring feature complete.

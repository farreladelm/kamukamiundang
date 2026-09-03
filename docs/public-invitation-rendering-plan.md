# Public Invitation Rendering Plan

## Status

Superseded by `docs/invitation-presentation-model.md` for ownership and surface behavior. Retained as implementation history.

## Problem

Current showroom detail owns desktop split layout while template renderer owns only narrow invitation column. Public `/i/[slug]` therefore loses the full presentation. The full layout belongs to the template runtime and must render identically for demo, draft, and published snapshot content.

## Goal

One versioned template runtime owns invitation presentation at every surface:

- Public invitation renders exact pinned runtime with published snapshot content.
- Showroom preview renders same runtime with demo content and palette selection.
- Workspace preview renders same runtime with local draft content in a mobile-width container.
- Preview-only controls and editor form remain outside invitation runtime.

## Product Decisions

- Public desktop invitation uses each template's own left invitation panel and fixed invitation scroll column, matching preview exactly.
- Mobile invitation remains one full-width column.
- Every invitation surface starts at cover with `Buka undangan` interaction.
- Core invitation HTML remains readable when JavaScript, animation, or enhancement fails.
- Showroom and workspace previews use same cover behavior as published invitations.
- Template layout, type, ornament, and palette remain source-controlled runtime behavior. Customer draft/snapshot only supplies allowed content.
- Desktop invitation panel displays invitation content, not template catalog or marketing metadata.
- Admin-customizable invitation slug is separate follow-up after rendering parity completes.

## Architecture

### Runtime Presentation

Move exact responsive desktop composition from `src/features/showroom/template-detail.tsx` into template rendering pipeline. `renderTemplate()` receives only pinned runtime, palette, and content view model; no surface-specific presentation mode may select a different layout.

Shared presentation owns:

- Template-specific desktop invitation panel using rendered couple names, event date, and other allowed invitation content.
- Right-side invitation scroll column.
- Mobile single-column fallback.
- Public cover lifecycle and progressive-enhancement fallback.

### Surface Responsibilities

| Surface | Owns | Does not own |
|---|---|---|
| Public `/i/[slug]` | Snapshot-only data lookup, not-found policy | Invitation desktop layout |
| Showroom detail | Palette selector, analytics, demo data | Invitation desktop layout/frame |
| Workspace | Editor form, local draft state, save state | Invitation desktop layout/frame |
| Template runtime | Responsive invitation presentation, template visual language | Database reads, catalog metadata, mutation controls |

### Cover and No-JavaScript Behavior

Public mode renders cover initially. Cover unlocks normal scroll after `Buka undangan`.

Core content remains in server HTML and must not rely on JavaScript to become readable. If JavaScript does not execute, CSS/no-script fallback removes visual cover obstruction and content remains accessible. Reduced-motion users receive same readable content without animation dependency.

## Implementation Phases

### Phase 1: Define shared presentation contract

- Keep `TemplateRendererProps` and `renderTemplate()` limited to content and palette inputs.
- Preserve runtime identity and existing renderer/palette validation.

### Phase 2: Move desktop composition into runtime

- Extract exact showroom desktop split layout into shared invitation presentation without redesigning it.
- Build left invitation panel from template-rendered content and palette, not showroom-only catalog fields.
- Keep right invitation column and responsive mobile behavior inside shared presentation.
- Remove duplicate composition/frame ownership from showroom detail.

### Phase 3: Implement cover progressive enhancement

- Every surface starts covered.
- Preserve readable core HTML without JavaScript and with reduced motion.
- Retain keyboard focus and scroll behavior after opening.

### Phase 4: Integrate public snapshot route

- Update `/i/[slug]` to render exact snapshot runtime with no public layout mode.
- Keep current fail-closed snapshot resolver, metadata, and Open Graph image behavior.
- Do not introduce draft reads or catalog fallback.

### Phase 5: Update preview surfaces

- Simplify showroom detail to preview controls and runtime invocation.
- Update workspace preview to invoke same runtime inside a centered mobile-width container while preserving editor layout.
- Keep palette selector available only in showroom preview.

### Phase 6: Verify

- Renderer/component tests prove public, showroom, and workspace use same template presentation structure.
- Public route tests prove pinned snapshot isolation and not-found behavior remain intact.
- Manual desktop check: public and showroom share desktop composition at selected palette.
- Manual mobile check at 360 px: public and preview collapse cleanly to one column.
- Manual public-flow check: cover opens, keyboard focus moves to invitation, and no-JavaScript/reduced-motion content remains readable.
- Run focused tests during each phase; run lint, typecheck, unit, integration, and build after rendering task completes. No E2E execution.

## Expected Files

- `src/features/templates/types.ts`
- `src/features/templates/render-template.tsx`
- `src/features/templates/shared/invitation-experience.tsx`
- `src/features/templates/template-*/v1/renderer.tsx`
- `src/features/showroom/template-detail.tsx`
- `src/features/workspace/workspace-editor.tsx`
- `src/app/i/[slug]/page.tsx`
- Related renderer, showroom, workspace, and public-route tests

## Non-Goals

- Admin-managed invitation slugs.
- New photo placement/content model.
- RSVP, wishes, response management, or MVP validation evidence.
- Template visual redesign, catalog metadata changes, or runtime contract changes.

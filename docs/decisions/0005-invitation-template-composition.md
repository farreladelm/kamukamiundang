# ADR-0005: Standardize Invitation Composition Around Shared Sections

## Status
Accepted

## Date
2026-08-03

## Context

The showroom contained three short demo renderers with unrelated structures. They lacked cover opening, recipient display, profiles, countdown, gallery, gift, wishes, and clean optional-section behavior. Their responsive breakpoints also described viewport width rather than the narrow invitation rail rendered on desktop.

The product needs invitation templates that follow common Indonesian digital-wedding patterns while allowing couples to omit sections such as RSVP or love story.

## Decision

Use one shared invitation experience for cover state, scroll lock, section order, countdown, forms, gallery placeholders, gift copy feedback, and footer. Each template keeps its own renderer entry point and visual variant, but delegates common composition to `InvitationExperience`.

Extend `TemplateContentViewModel` with typed core and optional sections. Optional sections render only when corresponding data exists. Use CSS placeholder media until customer-owned or licensed assets are supplied.

Current source definitions keep template version `1` and move content to schema version `2` because this repository has no published invitation snapshots yet. Once published snapshots exist, breaking content or visual interpretation must use a new template/schema version and retain the old renderer.

Desktop uses a persistent left preview/photo panel and a right rail capped around 30rem. Mobile hides the left panel and expands the invitation rail to viewport width. Cover content uses a client island because opening, focus, scroll lock, countdown, and demo form feedback require browser state.

## Alternatives Considered

### Independent complete renderer per template

- Pros: Maximum local control.
- Cons: Repeats accessibility, cover, optional-section, and countdown behavior.
- Rejected: Existing duplication caused structural drift between templates.

### Generic section registry with arbitrary order everywhere

- Pros: Maximum configurability.
- Cons: More schema complexity and weak editorial control for a design system.
- Rejected: Standard order with optional data covers current product needs; arbitrary ordering can be added when workspace requirements prove it necessary.

### Copy the reference invitation's visual design and assets

- Pros: Fast visual similarity.
- Cons: Copyright/license risk and loss of Undango template identity.
- Rejected: Use reference only as structural and interaction benchmark.

## Consequences

- New templates inherit correct cover and section behavior by default.
- Shared component is client-rendered in the current showroom path; the future public route should isolate stateful controls while keeping snapshot data server-owned.
- Demo RSVP and wishes are intentionally local UI until `MVP-27` and `MVP-28` deliver validated persistence.
- Placeholder photos must be replaced or documented before production asset launch.

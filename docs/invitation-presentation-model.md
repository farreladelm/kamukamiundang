# Invitation Presentation Model

## Status

Accepted product decision.

## Definitions

### Template Runtime

A versioned, source-controlled template runtime owns the complete invitation presentation:

- Desktop invitation panel on the left.
- Invitation rail on the right.
- Mobile single-column layout.
- Cover, `Buka undangan` interaction, typography, ornaments, section order, and palette styling.

Each template may design its desktop invitation panel differently. The panel is part of the invitation, not catalog marketing.

### Invitation

An invitation is a customer-owned instance pinned to one template version and one palette. It supplies allowed editable content to its runtime, including couple nicknames, wedding date, opening copy, events, photos, and optional sections. It does not supply or choose layout.

### Preview

A preview renders the exact template runtime with demo content. It may place a palette selector outside the runtime, then rerender the runtime with selected compatible palette. The selector is preview-only and never changes the runtime layout.

### Published Invitation

A published invitation renders the exact pinned template runtime with published snapshot content and pinned palette. It has no palette selector, catalog fallback, draft read, or public layout variant.

### Workspace Preview

A workspace preview renders the exact template runtime with local draft content and the invitation's pinned palette inside a centered mobile-width container. Template responsiveness follows container width, so desktop panel remains hidden while the invitation rail fills the preview width. Editor, save, and access controls remain outside the runtime.

## Invariants

```text
same template version + same palette = same presentation structure

showroom preview: demo content
workspace preview: draft content in a mobile-width container
published invitation: published snapshot content
```

- Every surface starts with `Buka undangan`.
- Desktop invitation panel displays invitation data, never template catalog category, description, or other marketing data.
- Desktop panel and fixed rail activate only when runtime container reaches `64rem`; otherwise invitation rail fills available width.
- Public content must remain readable if JavaScript, music, or animation enhancement fails.
- Template runtime identity and palette remain pinned; content may change only through allowed invitation editing and publication.

## Surface Boundaries

| Surface | Supplies | May add outside runtime | Must not own |
| --- | --- | --- | --- |
| Showroom | Demo content, selected compatible palette | Palette selector, analytics, catalog navigation | Invitation frame, desktop panel, cover, rail |
| Workspace | Local draft content, pinned palette | Editor, save state, access messaging, mobile-width preview container | Invitation frame, desktop panel, cover, rail |
| Public `/i/[slug]` | Published snapshot content, pinned palette | Snapshot lookup, generic not-found policy, metadata | Invitation frame, desktop panel, cover, rail |
| Template runtime | Presentation for its content and palette | None | Database reads, catalog lookup, mutation controls |

## Implementation Rule

`renderTemplate()` receives one pinned runtime, palette, and content view model. It must not select a separate layout for preview, workspace, or public surfaces. If a showroom shell exists outside the renderer, move that exact shell into the template runtime before changing its design.

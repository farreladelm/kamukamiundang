# ADR-0002: Pin template versions and publish immutable current snapshots

## Status

Accepted

## Date

2026-08-03

## Context

An invitation must keep rendering after template code evolves. Customers need mutable drafts, but public visitors must never see incomplete edits. MVP does not require revision history or rollback UI.

## Decision

Keep templates source-controlled in a version registry. Every template version provides `templateKey`, `templateVersion`, `contentSchemaVersion`, stable palette keys, capabilities, validation schema, demo content, and an exact renderer.

Orders, invitations, and published snapshots persist `templateKey`, `templateVersion`, `contentSchemaVersion`, and `paletteKey`. A referenced version cannot be removed. Breaking template or content-schema changes create a new version.

Store one mutable invitation draft and one immutable current published snapshot.

- Workspace reads and writes draft content with optimistic content versioning.
- Initial publish atomically replaces the current snapshot and locks editing.
- Reopening editing retains current public snapshot while draft changes resume.
- Republish atomically replaces current snapshot and locks editing again.
- Unpublish changes invitation state to `draft` and removes public access.
- Current snapshot stores referenced asset IDs; referenced assets cannot be deleted.

## Alternatives Considered

### Render public invitations directly from draft content

Rejected. Unfinished edits could become publicly visible.

### Mutable template definitions stored in database

Rejected. Admin template changes could silently alter existing invitation output.

### Full snapshot revision history

Deferred. Current snapshot isolation meets MVP needs with lower schema and UI complexity.

## Consequences

- Renderer versions remain in source while invitations reference them.
- Publish and republish require atomic database operations.
- Public routes read snapshots only, never drafts.

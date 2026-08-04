# ADR-0007: Split Template Runtime Contracts from Database Catalog Metadata

## Status
Accepted

## Date
2026-08-04

## Context

Undango needs two different kinds of template data. Renderer compatibility, content interpretation, capabilities, and curated palette tokens change with application code and must remain versioned with that code. Name, description, current price, category, merchandising thumbnail, display order, visibility, and public slug are business metadata that operators need to change without deploying the application.

The initial MVP implementation placed both groups in one source-controlled `TemplateDefinition` and stored only visibility overrides in PostgreSQL. This created two visibility authorities and made ordinary catalog edits require a code change. Moving everything into the database would create the opposite problem: arbitrary database content could drift away from the TypeScript renderer and content contracts.

## Decision

Use a hybrid versioned catalog with explicit field ownership and one immutable join contract.

### Runtime manifest ownership

Source code owns:

- `templateKey`
- `templateVersion`
- `contentSchemaVersion`
- renderer implementation
- content validation schema
- capability set
- palette keys and semantic color tokens
- demo content
- renderer-specific preview style when it selects code or CSS behavior

`(templateKey, templateVersion)` is immutable. Breaking output or content interpretation creates a new version. Runtime versions remain shipped while any order, invitation, or published snapshot references them.

### Catalog metadata ownership

PostgreSQL owns:

- public name
- public slug and slug aliases
- category
- marketing description
- current price in Rupiah
- marketing thumbnail reference
- display order
- lifecycle status (`DRAFT`, `VISIBLE`, `HIDDEN`, `RETIRED`)
- last updating admin and timestamps

Only `VISIBLE` metadata may appear in the showroom or be selected for a new order. `HIDDEN` and `RETIRED` records remain readable for historical operations. Hard deletion is forbidden while referenced.

The marketing thumbnail reference is nullable. Resolved DTOs preserve `null`; showroom cards may then render the source-controlled runtime preview selected by `previewStyle`. This is presentation-only behavior and must not synthesize, persist, sort, price, identify, or determine visibility from source metadata.

### Resolution contract

A server-only catalog resolver joins one database metadata record with one exact source runtime manifest using `(templateKey, templateVersion)`. Public catalog, detail, WhatsApp CTA, admin order intake, and new-order pricing consume this resolved DTO instead of reading either source independently.

There is no silent metadata fallback from source code. Runtime without metadata remains unavailable until reconciliation creates a draft record. Visible metadata without runtime support is a configuration error, is excluded from public/order surfaces, and fails deployment verification. Active order, invitation, or published snapshot references to missing runtime are deployment blockers.

### Price snapshots

Current catalog and WhatsApp price come from database metadata. Order creation copies that value into immutable `Order.priceInRupiah`. Historical order views never read current catalog price.

### Slug lifecycle

Slug may change freely while metadata has never been visible. Once a slug has been exposed publicly, changing it creates a permanent alias redirect. Retired slugs are never reused for another template identity. Slug changes do not alter `templateKey` or `templateVersion`.

### Registration and deployment

Database migrations change structure only. An idempotent reconciliation command inserts missing metadata as `DRAFT`, validates existing rows, preserves admin-edited fields, and reports drift. Release order is additive:

1. Deploy runtime support.
2. Reconcile metadata.
3. Complete and validate metadata.
4. Make the template visible.
5. Hide or retire before considering runtime removal.
6. Remove runtime only after a reference scan proves no remaining use.

## Alternatives Considered

### Keep all template fields in source code

Rejected. Compile-time safety is strong, but changing price, description, category, ordering, or visibility requires deployment and prevents practical catalog operations.

### Move all template fields into PostgreSQL

Rejected. Renderer, schema, capabilities, demo interpretation, and palette tokens could drift from code. Database constraints cannot prove a matching renderer implementation exists in a deployed binary.

### Continue using sparse database overrides

Rejected. Sparse overrides retain two authorities and make fallback behavior ambiguous. Missing metadata cannot be distinguished from an intentional source default.

## Consequences

- Catalog metadata becomes an operational database concern; renderer compatibility remains a code-release concern.
- `TemplateVisibility` is replaced by versioned catalog metadata while preserving existing visibility values.
- Admin template UI expands from visibility-only control to validated metadata management with audit records.
- Existing showroom, detail, WhatsApp, and order-intake paths require remediation even though their original MVP tasks were completed and approved.
- Runtime manifest and catalog metadata must be tested together before deployment and rollback.
- Existing order price and identity snapshots remain unchanged.
- ADR-0006 remains accepted for admin authentication, transactions, and order activation, but its visibility-only/source-price template ownership decision is superseded by this ADR.

# ADR-0006: Persist Admin Operations as Narrow Overrides and Transactions

## Status
Accepted; template catalog ownership superseded by ADR-0007

## Date
2026-08-03

## Context
Admin needs to hide or restore source-controlled template versions and record manual customer orders. Template design, version, palette, and price must remain immutable for orders already recorded. Paid activation must not create duplicate invitations under retries or concurrent requests.

## Decision
The original decision stored only template visibility overrides in `TemplateVisibility` and treated the source registry as authority for template identity, design, palette, and price. ADR-0007 supersedes that portion with a hybrid versioned catalog: database-owned business metadata plus source-controlled runtime contracts. Admin operations continue to re-read active admin sessions at Server Action boundaries.

Record order snapshots from the exact resolved catalog at intake: current database price plus immutable `templateKey`, `templateVersion`, `contentSchemaVersion`, and `paletteKey`. Activate paid orders in a transaction that locks the order, creates one invitation and draft content, then transitions the order to `ACTIVATED`. The unique order relation and database lifecycle trigger remain final integrity guards.

## Consequences
- Catalog lifecycle changes do not alter existing order or invitation snapshots.
- Restoring a catalog version does not change its source-controlled runtime contract.
- Activation retries return the existing invitation rather than creating another one.
- Operators need the catalog migration and reconciliation before admin template routes are available.

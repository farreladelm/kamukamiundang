# Launch Collection

MVP showroom starts with three versioned runtime concepts. Source code owns immutable identity, curated palette keys/tokens, content-schema version, demo content, capabilities, and renderer contract. PostgreSQL catalog metadata owns public name, category, description, current price, slug, marketing thumbnail, display order, and lifecycle status under [ADR-0007](../decisions/0007-hybrid-versioned-template-catalog.md). Their current demo content follows the standard invitation composition documented in [`authoring-guide.md`](./authoring-guide.md).

The table records approved launch bootstrap values. After `MVP-CAT-02`, current category and price are read from database metadata rather than this document or runtime definitions.

| Template | Pinned version | Initial category | Initial price | Direction |
| --- | --- | --- | --- | --- |
| Larasati | `template-1` v1 / schema v2 | Klasik | Rp650.000 | Quiet Javanese editorial framing, ivory, soga, and night palettes. Full core flow without RSVP demo. |
| Pesisir Senja | `template-2` v1 / schema v2 | Modern | Rp700.000 | Spacious coastal composition with warm sunset color studies. RSVP enabled; story omitted. |
| Taman Aksara | `template-3` v1 / schema v2 | Botanical | Rp750.000 | Contemporary botanical invitation with gentle typography and organic color. RSVP and story enabled. |

### Initial Database Metadata

This table is authoritative bootstrap input for `MVP-CAT-02`. A `null` marketing thumbnail deliberately uses the source-controlled runtime preview selected by `previewStyle`; this is an explicit presentation state, not source metadata fallback. Admin may later attach a database-owned marketing asset.

| Runtime pair | Slug | Description | Marketing thumbnail | Display order | Initial lifecycle |
| --- | --- | --- | --- | --- | --- |
| `template-1` v1 | `larasati` | Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai. | `null` | 10 | `VISIBLE` |
| `template-2` v1 | `pesisir-senja` | Modern hangat dengan garis horison, ruang lega, dan warna matahari sore. | `null` | 20 | `VISIBLE` |
| `template-3` v1 | `taman-aksara` | Botanical kontemporer untuk perayaan intim dengan aksara yang lembut. | `null` | 30 | `VISIBLE` |

| Category key | Name | Display order | Initial status |
| --- | --- | --- | --- |
| `klasik` | Klasik | 10 | `ACTIVE` |
| `modern` | Modern | 20 | `ACTIVE` |
| `botanical` | Botanical | 30 | `ACTIVE` |

## Version Contract

- `templateKey`, `templateVersion`, `contentSchemaVersion`, and `paletteKey` identify a render exactly.
- Palette keys and token semantics are stable within a template version.
- A breaking content or visual interpretation needs a new version; do not repurpose existing versions.
- Registry entries expose one runtime renderer each. Persisted invitations resolve their exact pinned entry.
- Catalog metadata must pair with an exact registry entry through `(templateKey, templateVersion)`; missing or incompatible pairs fail closed.
- Catalog lifecycle and visibility are database-owned. Source definitions do not provide runtime fallback metadata.

## MVP-05..07 Boundary

All three templates now share a production-shaped invitation experience with cover lock, mobile-width rail, optional sections, countdown, gallery placeholders, gift cards, and demo RSVP/wishes UI. Persistence, asset upload, and public snapshot rendering remain covered by the later MVP tasks.

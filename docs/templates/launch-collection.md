# Launch Collection

MVP showroom starts with three source-controlled, versioned concepts. Each entry owns immutable identity, curated palette keys, a content-schema version, demo content, capabilities, price, and renderer contract in `src/features/templates/registry.tsx`. Their current demo content follows the standard invitation composition documented in [`authoring-guide.md`](./authoring-guide.md).

| Template | Pinned version | Category | Price | Direction |
| --- | --- | --- | --- | --- |
| Larasati | `template-1` v1 / schema v2 | Klasik | Rp650.000 | Quiet Javanese editorial framing, ivory, soga, and night palettes. Full core flow without RSVP demo. |
| Pesisir Senja | `template-2` v1 / schema v2 | Modern | Rp700.000 | Spacious coastal composition with warm sunset color studies. RSVP enabled; story omitted. |
| Taman Aksara | `template-3` v1 / schema v2 | Botanical | Rp750.000 | Contemporary botanical invitation with gentle typography and organic color. RSVP and story enabled. |

## Version Contract

- `templateKey`, `templateVersion`, `contentSchemaVersion`, and `paletteKey` identify a render exactly.
- Palette keys and token semantics are stable within a template version.
- A breaking content or visual interpretation needs a new version; do not repurpose existing versions.
- Registry entries expose one renderer each. Persisted invitations will resolve their exact pinned entry in later MVP tasks.
- Catalog visibility is separate from source definition. Hidden entries must not be returned by `getVisibleTemplateCatalog`.

## MVP-05..07 Boundary

All three templates now share a production-shaped invitation experience with cover lock, mobile-width rail, optional sections, countdown, gallery placeholders, gift cards, and demo RSVP/wishes UI. Persistence, asset upload, and public snapshot rendering remain covered by the later MVP tasks.

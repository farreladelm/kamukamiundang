# Launch Collection

MVP showroom starts with three source-controlled, versioned concepts. Each entry owns immutable identity, curated palette keys, a content-schema version, demo content, capabilities, price, and renderer contract in `src/features/templates/registry.ts`.

| Template | Pinned version | Category | Price | Direction |
| --- | --- | --- | --- | --- |
| Larasati | `template-1` v1 / schema v1 | Klasik | Rp650.000 | Quiet Javanese editorial framing, ivory, soga, and night palettes. |
| Pesisir Senja | `template-2` v1 / schema v1 | Modern | Rp700.000 | Spacious coastal composition with warm sunset color studies. |
| Taman Aksara | `template-3` v1 / schema v1 | Botanical | Rp750.000 | Contemporary botanical invitation with gentle typography and organic color. |

## Version Contract

- `templateKey`, `templateVersion`, `contentSchemaVersion`, and `paletteKey` identify a render exactly.
- Palette keys and token semantics are stable within a template version.
- A breaking content or visual interpretation needs a new version; do not repurpose existing versions.
- Registry entries expose one renderer each. Persisted invitations will resolve their exact pinned entry in later MVP tasks.
- Catalog visibility is separate from source definition. Hidden entries must not be returned by `getVisibleTemplateCatalog`.

## MVP-05..07 Boundary

`Larasati` v1 has full visual invitation rendering in this increment. `Pesisir Senja` and `Taman Aksara` establish approved collection direction, identity, palettes, demo data, and renderer contract; their dedicated production visual renderers remain MVP-09 and MVP-10.

# Changelog

All notable user-facing changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Formatted Rupiah price in admin order intake template selection dropdown options.
- Customer workspace now loads and saves versioned drafts with pinned runtime checks and stale-save protection.
- Customer workspace now provides bride/groom identity fields and curated invitation quote choices.

### Changed
- Catalog cards now display administrator-configured marketing thumbnails while preserving runtime previews when no thumbnail is set.
- Admin order rows now expose payment confirmation and activation actions before linking to invitation operations.
- Admin logout now revokes its database session before clearing the browser cookie.
- Order intake now re-resolves current catalog price into immutable order snapshot and fails server-side if selected template status is non-visible.

### Security
- Admin login failures are throttled per normalized account for the MVP, with the long-term account/network policy documented for a later deployment upgrade.

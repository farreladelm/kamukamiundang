# Changelog

All notable user-facing changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Formatted Rupiah price in admin order intake template selection dropdown options.
- Customer workspace now loads and saves versioned drafts with pinned runtime checks and stale-save protection.
- Customer workspace now provides bride/groom identity fields and curated invitation quote choices.
- Customer workspace now supports Akad Nikah and Resepsi schedules with timezone-aware countdowns and Google Maps validation.
- Customer workspace now supports optional Love Story chapters and informational gift details.
- Added secure invitation image upload, delivery, cleanup, and storage-quota safeguards.
- Added an admin-managed curated music library with validated MP3/M4A uploads and optional playback controls.
- Added admin controls to publish, unpublish, lock, and irreversibly archive invitation snapshots.
- Added public invitation pages that render only current published snapshots.

### Changed
- Catalog cards now display administrator-configured marketing thumbnails while preserving runtime previews when no thumbnail is set.
- Admin order rows now expose payment confirmation and activation actions before linking to invitation operations.
- Admin logout now revokes its database session before clearing the browser cookie.
- Order intake now re-resolves current catalog price into immutable order snapshot and fails server-side if selected template status is non-visible.

### Security
- Admin login failures are throttled per normalized account for the MVP, with the long-term account/network policy documented for a later deployment upgrade.

# Template-7 "Neon Vow" — Design Spec

Date: 2026-08-13
Status: Approved for planning

## Background

The user asked for a new invitation template inspired by
`https://wedding20251012-ny.studio.site/` (a Studio.site-built Japanese
wedding invitation), with the explicit request that the open/browse
experience feel as close as possible to the reference on both desktop and
mobile, using stock photography already in the repo.

The reference site is a heavily animated, single-purpose scrollytelling page:
a solid neon-lime cover with oversized script typography, a pinned/sticky
giant ghost-text section with a paragraph scrolling in front of it, thin
circular line ornaments and 4-point sparkle icons, high-contrast
black-and-white couple photography, and bold oversized serif numerals for
the date/venue sections.

`kamukamiundang-clone`'s 6 existing templates (`template-1`..`template-6`)
all share one component, `InvitationExperience`
(`src/features/templates/shared/invitation-experience.tsx`), which owns the
cover-lock, section order, RSVP/wishes forms, and interaction rules
documented in `docs/templates/authoring-guide.md`. That guide explicitly
prohibits building a new cover-lock/scroll-behavior implementation per
template — variation is meant to come only through palette, variant CSS,
ornament, and section composition.

The user was shown this tension directly and chose the "literal clone"
option: template-7 gets its own renderer, not a thin wrapper around
`InvitationExperience`, so its visual language can diverge sharply (giant
sticky typography, neon color block, bespoke section layout) from the other
six templates. This is a deliberate, informed exception to the guide's reuse
convention, not an oversight.

Non-negotiable baseline behavior is preserved regardless of that exception,
because it is a product-quality/accessibility floor rather than a style
convention:

- Cover uses `min-height: 100dvh`, content stays locked until the open
  button is activated, and focus moves to the main content on open.
- The open button and all interactive elements are keyboard-operable.
- No `wheel`/`touchmove` hijacking (`preventDefault`) anywhere, including
  the pinned/sticky section — native scroll must keep working.
- `prefers-reduced-motion` is respected; content is fully readable with all
  animation and transitions disabled.
- No horizontal overflow at 360px viewport width.
- No autoplay audio or video.
- External links (Maps, Instagram) use `target="_blank" rel="noreferrer"`.
- Renderer takes only `{ content, palette }` — no DB/env/request access.

## Goal

Add `template-7` ("Neon Vow") to the template catalog: a new
`TemplateRuntimeManifest` registered in `registry.tsx`, with its own
renderer that visually evokes the reference site (neon-lime block cover,
oversized serif/script headline type, sticky ghost-text reveal section,
thin orbit-line + sparkle ornaments, high-contrast photography) while
rendering the same fixed `TemplateContentViewModel` every other template
renders, and reusing the existing stock photo set `cahaya` (no new image
assets).

Out of scope: literal `wheel`/`touchmove` scroll-jacking, embedded video
backgrounds, changes to `TemplateContentViewModel`'s shape, changes to the
other 6 templates, and any catalog/business-metadata work beyond the
`DRAFT` reconciliation step the authoring guide requires for a new template.

## Visual design

Three palettes (all templates ship 2–3 palette choices):

| key | name | canvas | ink | accent | notes |
|---|---|---|---|---|---|
| `lumen` | Lumen | `#E4FA1F` (neon lime) | `#15150F` (near-black) | `#15150F` | default/demo palette, matches reference |
| `kelam` | Kelam | `#15150F` | `#E4FA1F` | `#E4FA1F` | inverted — black canvas, lime ink/accent |
| `kertas` | Kertas | `#F3F1E4` (soft cream) | `#1B1B14` | `#5B5C3F` | muted daytime option for lime-averse customers |

Typography: an oversized serif/script display face (system serif stack,
`clamp()`-sized, matching the project's existing "no downloaded font files"
constraint) for couple names and section numerals; a small-caps, wide
tracking sans-serif for eyebrows/labels — consistent with the type contrast
in the reference.

Ornament: two small inline SVGs (a thin ellipse/orbit line, a 4-point
sparkle) reused across sections as lightweight decoration, not raster
images.

Photography: the existing `cahaya` stock set
(`/images/stock/cahaya-1.jpg` … `cahaya-4.jpg`), reused from `template-4`.
Reuse across templates already exists in this repo (no set is exclusive to
one template) and needs no new licensing entry beyond noting the reuse in
`docs/templates/licenses.md`.

## Section-to-content mapping

Section order follows the authoring guide's default structure. All content
comes from the unchanged `TemplateContentViewModel`:

1. **Cover** — `cover.title`, `couple.firstName`/`secondName`,
   `cover.recipientLabel`/`recipientName`, open button. Solid `canvas`
   background, giant type, orbit + sparkle ornament, small eyebrow label.
2. **Hero** — `couple`, `opening`, `eventDate`.
3. **Sticky ghost-text reveal** — `quote`. Implemented as a tall
   (`~180dvh`) section containing a `position: sticky; top: 0` layer with
   large low-opacity outline text, while the quote paragraph scrolls in
   through normal document flow in front of it. No scroll interception;
   this is the mechanism that reproduces the reference's pinned-text feel
   without trapping the scroll.
4. **Profiles** — `profiles[0]`/`profiles[1]`, laid out as numbered
   (01/02) editorial bio blocks: name as giant type, `parents` field
   carries the longer bio paragraph, `instagram` as a text link.
5. **Save the date** — `eventDate`/`eventDateIso` and a large-numeral
   countdown (client-side interval, matching the pattern already used in
   `InvitationExperience`'s `Countdown`, reimplemented locally since the
   renderer doesn't import the shared component).
6. **Rangkaian acara** — `events[]`, populated with two entries
   (Pemberkatan 10.00 WIB, Resepsi 11.00 WIB) sharing date/venue, mirroring
   the reference's "Wedding / Reception" time split.
7. **RSVP** — `rsvp`, accessible form (labeled inputs, radio attendance,
   `aria-invalid`/error text, success status message) restyled to the
   palette; no server persistence, matching the documented demo-only rule.
8. **Gallery** ("Special Thanks" style) — `gallery.photos`, `cahaya-1..4`,
   shown as an offset photo card with a caption line and arrow-link accent
   echoing the reference's "Here are some photos from the wedding day →".
9. **Wedding gift** — `gift`, bank account cards with an accessible
   copy-to-clipboard button (feedback text, not just a visual change).
10. **Wishes** — `wishes`, quoted entries plus an accessible submit form,
    matching the RSVP form's validation/error/success pattern.
11. **Closing + footer** — `closing`, `couple`, `branding`.

## Demo content

New Indonesian demo copy (not a translation of the reference's Japanese/
English copy) sized to this section list — couple names, parents, opening/
closing lines, one venue, RSVP/gift/wishes copy — authored directly in
`template-7/v1/definition.ts`, consistent with how `template-1`..`6` each
invent their own demo couple.

## Files touched

- `src/features/templates/types.ts` — widen `previewStyle` union with a new
  literal (`"editorial"`) for template-7's runtime manifest.
- `src/features/templates/template-7/v1/definition.ts` — manifest: key,
  version, `contentSchemaVersion: 2`, `previewStyle: "editorial"`,
  capabilities (`gallery`, `gift`, `map`, `rsvp`, `wishes`), 3 palettes,
  demo content, renderer import.
- `src/features/templates/template-7/v1/renderer.tsx` — the custom
  renderer described above (cover-lock state, sticky reveal, all sections).
  May extract a small local `Countdown` helper co-located in this folder
  rather than importing the shared one, since the renderer is intentionally
  not coupled to `InvitationExperience`.
- `src/features/templates/template-7/v1/renderer.test.tsx` — renderer test
  covering demo name/date/event/Maps-link rendering and optional-section
  omission, matching the pattern in `template-6/v1/renderer.test.tsx`.
- `src/features/templates/registry.tsx` — import and add `templateSevenV1`
  to `templateRegistry`.
- `docs/templates/licenses.md` — add a row documenting `template-7`'s reuse
  of the `cahaya` stock set and its original CSS/SVG ornament + copy.

## Testing & rollout

Following the authoring guide's checklist:

- Renderer test asserts demo couple names, formatted date, event details,
  a Maps link with correct `href`/`target`/`rel`, and that optional
  sections (gift/rsvp/wishes/gallery) are absent when their content field
  is `undefined`.
- Manual check at 360px width for horizontal overflow and readability with
  `prefers-reduced-motion: reduce` simulated.
- Run catalog reconciliation so a `DRAFT` catalog entry is created for
  `template-7:1` (requires local Postgres; if unavailable in this
  environment, this step is deferred and called out explicitly rather than
  skipped silently).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` must all pass
  before the branch is considered done.

## Risks / open questions

- The sticky ghost-text section is the one piece of genuine visual
  invention (the reference's exact pinned/video mechanism can't be ported
  as-is under the no-scroll-jack constraint). It's a reasonable-fidelity
  substitute, not a pixel clone of that one section.
- Catalog reconciliation needs a running Postgres instance; if the dev
  environment doesn't have one up, the runtime manifest/registry work can
  still be completed, built, and tested — only the `DRAFT` catalog-row step
  would be left for a follow-up with DB access.

## Revision — v2 (2026-08-13, same day)

v1 shipped (all 4 plan tasks + final review clean, merged into this spec's
history) but the user reviewed it live and rejected it: it read as a
reskin of the existing 6-template interaction pattern (click-to-open gate,
static CSS-only "sticky" substitute) rather than a real clone of the
reference's continuously-scrollable, motion-driven experience. Two
decisions from the user resolve the ambiguity v1 guessed wrong on:

1. **No cover-lock gate.** The reference has no "click to open" gesture —
   it's one continuously scrollable page from the very top. Template-7
   drops the click-gate, body-scroll-lock, `aria-hidden`/`inert` main-content
   gating, and the pre-open `wheel`/`touchmove` `preventDefault` entirely.
   The cover becomes the first panel (still `min-height: 100dvh`, still
   shows the couple names and guest recipient name) but the page is
   scrollable into it immediately on load. This changes the "Cover and
   interaction" non-negotiable from the Background section above: "content
   stays locked until the open button is activated, focus moves to main on
   open" **no longer applies to template-7** — there is no lock and no
   button. Every other non-negotiable (no scroll hijacking, reduced-motion
   respected, 360px-safe, no autoplay, external link attributes, renderer
   purity) still applies unchanged.
2. **Framer Motion for real scroll-driven motion**, not static CSS. Framer
   Motion is already an installed dependency and is the project's stated
   convention for entrance/scroll/hover motion on public-facing pages
   (`docs/AGENTS.md`). Replaces v1's CSS-only `position: sticky` substitute
   with real scroll-linked transforms (`useScroll` + `useTransform`) and
   viewport-triggered reveals (`whileInView`). Every transform must be
   gated behind `useReducedMotion()` so `prefers-reduced-motion: reduce`
   collapses it to a static, fully-readable state — this is a new explicit
   requirement added in v2, since v1's Tailwind `motion-safe:` trick doesn't
   translate directly to JS-driven Framer Motion values.

### Revised section-to-content mapping

Same 11 content sections, same `TemplateContentViewModel` fields, same demo
content/palettes/photos as the original section above — only the
interaction model and motion implementation change:

1. **Cover panel** (no gate) — `cover.title`, `couple`, `cover.recipientLabel`/
   `recipientName`. 100dvh neon panel, oversized italic serif couple name,
   orbit/spark ornament. Scrolls directly into the next panel — no button,
   no lock.
2. **Photo + recurring neon title motif** — a new panel not present in v1:
   a full-bleed `cahaya-1.jpg` panel with the oversized eyebrow/title
   treatment repeated over the photo (echoing how the reference reuses its
   cover typography as a recurring motif across sections), driven by
   `useScroll`-based parallax (photo `translateY`/`scale` transform tied to
   scroll progress within the panel, gated behind `useReducedMotion()`).
3. **Sticky ghost-text quote** — same content as v1 (`quote`), but the pin
   effect is now real: a local `useScroll({ target: sectionRef })` drives
   opacity/scale on the ghost text and the quote paragraph instead of the
   CSS negative-margin overlap trick.
4. **Profiles** — same as v1, with `whileInView` fade/slide-in per profile
   block (`viewport={{ once: true }}`, gated behind `useReducedMotion()`).
5. **Save the date** — oversized serif event-date/venue typography (a
   stylistic homage to the reference's giant venue-name treatment, not a
   literal reproduction of its line-break rendering, which reads as a
   rendering artifact rather than an intentional effect worth cloning) plus
   the countdown, `whileInView` reveal.
6. **Rangkaian acara** — same as v1 (`events[]`, Maps link), `whileInView`
   reveal.
7. **RSVP** — same accessible form as v1. The reference shows a
   past-deadline RSVP message with a strikethrough; template-7's demo date
   is in the future, so no strikethrough state is needed — normal copy only.
8. **Gallery** ("Special Thanks" style) — same `gallery.photos` as v1, now
   with a staggered `whileInView` grid reveal instead of a static grid.
9. **Wedding gift** — unchanged from v1.
10. **Wishes** — unchanged from v1.
11. **Closing + footer** — unchanged from v1.

### Files touched (v2 delta on top of v1)

- `src/features/templates/template-7/v1/renderer.tsx` — rewritten: remove
  all cover-lock state/effects/handlers (`isOpen`, body-scroll-lock effect,
  `openInvitation`, `aria-hidden`/`inert` on main, pre-open wheel/touch
  handlers); add Framer Motion (`motion`, `useScroll`, `useTransform`,
  `useReducedMotion` from `framer-motion`) for the panels described above;
  add the new photo+title-motif panel.
- `src/features/templates/template-7/v1/renderer.test.tsx` — rewritten:
  drop the "click open, then assert" pattern (nothing to click); assert
  content is present on initial render; drop the rail-lock test added in
  the v1 final-review fix wave (no lock exists to test); keep the
  demo-content/palette/optional-section-omission assertions.
- `docs/templates/licenses.md` — no new row needed (still just `cahaya`
  reuse + original CSS/SVG/Framer Motion composition), but update the
  existing template-7 row's description if it references the removed
  sticky-reveal-via-CSS mechanism by name.
- No changes needed to `types.ts`, `definition.ts`'s content/palette
  values, `registry.tsx`, or `catalog-schema.ts` — those are interaction-
  model-independent and already correct from v1.

### Testing & rollout (v2 delta)

- Renderer test no longer simulates opening a gate; it asserts the same
  demo-content/event/Maps-link/optional-section requirements against the
  initial render.
- Manual 360px / reduced-motion check must now specifically verify: (a) no
  content requires JavaScript to be visible (Framer Motion's `initial`
  states must not hide content that CSS/no-JS users need to read — use
  `initial` states that are visually offset/faded but never `display:
  none` or unmounted), and (b) toggling reduced-motion in devtools leaves
  every panel fully readable with no transform applied.
- Same lint/typecheck/test/build/reconciliation gates as v1.

### Risks / open questions (v2 additions)

- Framer Motion's `useScroll`/`useTransform` values don't execute in
  jsdom's test environment the same way real browser scroll does; the
  renderer test suite verifies content presence and structure, not the
  actual motion curves — same limitation v1 had for its CSS sticky math,
  now shifted to JS. A manual browser check remains the only way to verify
  the motion actually feels right, and is explicitly recommended before
  this template is shown to real users.
- Removing the cover-lock means template-7 no longer demonstrates the
  "personalized locked invitation" product moment the other 6 templates
  share. This was an explicit, informed trade-off the user made to prioritize
  fidelity to the reference over that product consistency for this one
  template.

### Post-implementation decisions (final whole-branch review follow-up)

The v2 whole-branch review surfaced two issues that needed a human decision
rather than a unilateral code fix. Both are now resolved:

1. **Desktop preview scroll container.** `src/features/showroom/template-detail.tsx`
   (shared by all 7 templates) wrapped every preview in an independently
   -scrollable rail at desktop width — required by the other 6 templates'
   cover-lock effect, but incompatible with template-7's scroll-linked
   motion (Framer Motion's default scroll tracking, and CSS `sticky`, both
   need the real page to scroll). Resolved by gating that layout explicitly
   on `template.templateKey === "template-7"` in `template-detail.tsx`:
   template-7 gets real page scroll: every other template's markup and
   behavior is untouched (verified by the pre-existing template-1 tests
   passing unmodified).
2. **No-JS readability.** The "Testing & rollout (v2 delta)" section above
   asked that no content require JavaScript to be visible. Framer Motion's
   `whileInView`/`initial` states resolve into the server-rendered HTML's
   inline styles, so that requirement cannot actually be satisfied by the
   `Reveal` pattern as built — with JS disabled, sections render at
   `opacity: 0`. The human's decision: accept template-7 as a full-JS
   template (this is explicitly the one template on this catalog with a
   different bar, given its motion-first design brief) rather than
   reworking `Reveal` into a CSS-first reveal pattern. The "no content
   requires JavaScript to be visible" line in this spec's v2 Testing
   section is superseded for template-7 by this decision — it still
   applies to all 6 other templates via `InvitationExperience`, which was
   never changed.

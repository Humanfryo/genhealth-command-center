# Handoff: GenHealth Marketing Command Center — UI/UX Redesign

## Overview
A redesign of the GenHealth "Marketing Command Center" — an internal content-pipeline dashboard where AI-generated marketing drafts (LinkedIn posts, blog posts, email newsletters) move through a Draft → Scheduled → Published workflow, with a full draft editor. This handoff covers two views: the **Pipeline board** (home) and the **Piece editor**.

## About the Design Files
The file in this bundle (`Marketing Command Center.dc.html`) is a **design reference created in HTML** — a working prototype showing intended look and behavior, not production code to copy directly. Your task is to **recreate this design in the target codebase's existing environment** (e.g. the existing React/Next.js app behind the current dashboard) using its established patterns and libraries. If no environment exists yet, choose an appropriate stack (React + Tailwind is a natural fit) and implement the design there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, and interactions are final. Recreate pixel-perfectly using the codebase's existing conventions.

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--accent` | `#0f766e` (default teal; user may theme to `#4338ca` indigo, `#1d4ed8` blue, `#9333ea` purple) | Primary buttons, active states, links, focus rings, schedule date labels, logo mark |
| `--surface` | `#f6f5f1` (Warm; alternates: Cool `#f3f6f6`, Paper `#f7f3ea`) | Page background |
| `--card` | `#ffffff` | Cards, inputs, header pills |
| `--ink` | `#191b20` | Primary text |
| `--muted` | `#71757e` | Secondary text, labels, counts |
| `--line` | `#e8e7e2` | Borders, dividers |
| `--soft` | `#f2f1ec` | Column backgrounds, toolbar background, card footer divider |
| Danger | `#dc2626` text, `#f3c9c9` border | Delete button |

Implement accent as a CSS variable / theme token — the whole UI must re-theme from one value. Derived accent tints use `color-mix(in oklab, var(--accent) N%, transparent)`: 14% focus ring, ~30–40% button shadow, 40% mixed with `--line` for hover borders, 22% text selection.

### Channel colors (chips)
| Channel | Text | Background |
|---|---|---|
| LinkedIn | `#0a66c2` | `#e7f0fb` |
| Blog post | `#0f766e` | `#d8efea` |
| Email newsletter | `#7c3aed` | `#efe7fd` |
| X / Twitter | `#1f2937` | `#eceef1` |

### Status colors
| Status | Accent/dot | Chip background |
|---|---|---|
| Draft | `#64748b` | `#eef1f4` |
| Scheduled | `#c07a00` | `#fbf0d7` |
| Published | `#0f9d63` | `#dcf3e6` |

### Typography
- **UI font**: `Hanken Grotesk` (Google Fonts, weights 400/500/600/700/800), fallback `ui-sans-serif, system-ui, sans-serif`. `-webkit-font-smoothing: antialiased`.
- **Mono font**: `JetBrains Mono` (weights 400/500) — used for: draft body textarea, card dates, schedule relative-time ("in 5d"), word/char counter, date input.
- Scale (size / weight / letter-spacing):
  - Page title (Pipeline): 30px / 800 / -0.03em
  - Section title (Upcoming schedule): 22px / 800 / -0.025em
  - Stat numbers: 19px / 800 / -0.02em
  - Editor title input: 19px / 700 / -0.02em
  - Column header: 14px / 700 / -0.01em
  - Card title: 14.5px / 700 / -0.01em, line-height 1.32, `text-wrap: pretty`
  - Schedule row title: 14px / 600
  - Body/controls: 13–13.5px / 500–600
  - Card excerpt: 12.5px / 400, line-height 1.5, muted, clamped to 2 lines (`-webkit-line-clamp: 2`)
  - Chips: 11px / 700; micro-labels (form labels, "Distribution"): 12px / 700 / +0.03–0.04em / uppercase
  - Footer note: 12px muted
- Logo wordmark: "GenHealth" 17px/800/-0.02em + "Marketing Command Center" 12.5px/500 muted, separated by a 1px left border.

### Spacing & shape
- Page container: max-width 1200px (pipeline) / 1040px (editor), padding 30–34px.
- Radii: 999px chips/pills, 16px large cards/columns, 12–14px cards/inputs/panels, 9–11px buttons, 8px small move buttons.
- Shadows: cards `0 1px 2px rgba(0,0,0,.03)`; card hover `0 8px 22px rgba(0,0,0,.08)`; accent buttons `0 2px 10px color-mix(accent 30-34%)`; schedule row hover `0 4px 14px rgba(0,0,0,.05)`.
- Focus ring (inputs): border-color accent + `0 0 0 3px color-mix(accent 14%, transparent)`.

## Screens / Views

### 1. Header (shared, sticky)
- Sticky top, z-30, padding 14px 30px, bottom border `--line`, background = surface at ~82% mixed with white + `backdrop-filter: blur(10px)`.
- Left (clickable → navigates home): logo mark 30×30, radius 9px, accent background, accent-tinted shadow, containing an 11×11 white rounded square (radius 3px); then wordmark group as above.
- Right nav (flex, gap 8px): "Library" ghost button (13.5px/600, padding 9px 12px, radius 9px) and "**+ New draft**" primary button (white on accent, 13.5px/700, padding 9px 16px, radius 10px, accent shadow, hover `brightness(1.06)`).

### 2. Pipeline board (home)
Vertical order: title row → filter chips → distribution card → kanban → upcoming schedule → footer note.

**Title row** — flex, space-between, bottom margin 22px. Left: "Pipeline" h1 + summary line ("3 pieces in the library · 1 in progress", 13.5px muted). Right: search input, width 230px, radius 10px, white, with a `⌕` glyph absolutely positioned left (12px inset), placeholder "Search titles & content". Live-filters cards by title+body.

**Filter chips** — flex gap 8px: All / LinkedIn / Blog / Email / X. Pill buttons 12.5px/600, padding 7px 13px. Inactive: transparent bg, `--line` border, muted text. Active: accent bg, accent border, white text. Filters kanban cards by channel.

**Distribution card** — white card, radius 16px, padding 20px 22px, margin-bottom 26px. Header row: "DISTRIBUTION" micro-label left, "{n} pieces" muted right. Below: a 10px-tall segmented bar (radius 999px, `--soft` track, 2px gaps) — one segment per non-empty status, width = share of total, colored with the status accent, `transition: width .4s ease`. Below (flex, gap 26px): one stat per status — 9×9 rounded-square swatch in status color + count (19px/800) + lowercase label (13px muted).

**Kanban** — `grid-template-columns: repeat(3, 1fr)`, gap 18px, `align-items: start`. Each column: `--soft` background, `--line` border, radius 16px, padding 6px 6px 12px, min-height 220px.
- Column header (flex, gap 9px, padding 13px 14px 12px): 8px status-color dot, label 14px/700, count pill pushed right (white bg, `--line` border, 12px/700 muted, radius 999px).
- Cards stack: flex column, gap 10px, side padding 8px.
- **Card** (white, radius 13px, padding 14px 14px 12px, pointer cursor): top row = channel chip + short date in mono 11.5px muted ("Thu, Jul 23", omitted if unscheduled); title; excerpt (first meaningful body line, 2-line clamp); footer row separated by 1px `--soft` top border — small move buttons, one per other status: "→ Scheduled", "→ Published", etc. Move buttons: 11.5px/600, `--soft` bg, `--line` border, radius 8px; hover: white bg with the target status color as border+text.
- Card hover: `translateY(-2px)`, big shadow, border mixes 40% accent; transition .14s ease on transform/shadow/border.
- Empty column state: dashed 1.5px `--line` border box, radius 12px, centered muted 12.5px text — "No drafts" / "Nothing scheduled" / "Nothing published yet".

**Upcoming schedule** — margin-top 44px. Header: "Upcoming schedule" + right-aligned "{n} pieces queued" (12.5px muted). Groups (gap 22px), one per date with scheduled pieces, sorted ascending:
- Group header: full date in accent 13px/700 ("Tuesday, July 21"), a 1px `--line` rule flexing to fill, relative time in mono 11.5px muted ("in 5d" / "today" / "3d ago").
- Rows (gap 8px): white card, radius 12px, padding 13px 16px, flex gap 14px — channel chip, single-line ellipsized title (14px/600), `→` glyph pushed right in muted. Hover: accent-mixed border + soft shadow. Click opens the editor.
- Empty state: dashed box, "Nothing scheduled. Move a draft to Scheduled to see it here."

**Footer note** — "Built as a 4-hour assessment. AI drafts, humans publish." 12px muted, margin-top 52px.

### 3. Piece editor
Opens when a card/schedule row is clicked ("edit" mode) or via New draft ("new" mode, blank piece defaulting to Blog post / Draft / no date).

- Top row: "← Back to library" ghost button left (13.5px/600, hover opacity .7); right: current channel chip + status chip (11.5px/700, padding 4px 11px).
- If the piece has a source topic: "Generated from topic: "{topic}"" — 12.5px muted, topic itself in ink color, quoted.
- Body: `grid-template-columns: 1fr 296px`, gap 24px.

**Main column** (flex column, gap 20px):
- Title field: uppercase micro-label "TITLE", then large input (19px/700, padding 14px 16px, radius 12px, white, placeholder "Untitled piece").
- Body panel: white card radius 14px, overflow hidden.
  - Toolbar (padding 11px 14px, `--soft` bg, bottom border): left = Write/Preview segmented control (white pill container with `--line` border, radius 9px, 2px padding; active segment = accent bg + white text, inactive = transparent + muted; 12.5px/600, padding 6px 14px, radius 7px). Right = "{words} words · {chars} chars" mono 12px muted, live.
  - Write mode: borderless textarea, min-height 480px, resize vertical, padding 20px, JetBrains Mono 13px, line-height 1.65, placeholder "Write your draft in Markdown…".
  - Preview mode: scrollable div (min 480 / max 640px, padding 24px 26px) rendering a minimal Markdown subset: `#` → h2 20px/800, `##` → h3 16px/800, `- ` lines → ul (flex column, gap 6px, 14px/1.6, `#33363d`), blank-line-separated paragraphs 14px/1.68 `#33363d`. Escape HTML. Empty → "Nothing to preview yet." muted.

**Sidebar** — sticky (top 82px), flex column gap 14px:
- Meta card (white, radius 14px, padding 18px, gap 15px): three labeled fields — Channel select (LinkedIn / Blog post / Email newsletter / X / Twitter), Status select (Draft / Scheduled / Published), Scheduled date (native date input, mono font). Controls: padding 10px 12px, radius 10px, 13.5px.
- Actions (gap 9px): primary full-width button — "**Save changes**" (edit) / "**Create piece**" (new) — accent, 14px/700, padding 12px, radius 11px. Secondary full-width — "**Delete**" (edit: `#dc2626` text, `#f3c9c9` border, hover faint red bg) / "**Discard**" (new: muted text, `--line` border).

## Interactions & Behavior
- Card click / schedule-row click → editor with that piece. Move buttons `stopPropagation` and change only status.
- Save/Create → upsert piece, return to pipeline. Untitled new pieces get title "Untitled piece". Delete/Discard → remove (or drop the unsaved draft) and return.
- Search + channel filter combine (AND); they filter board cards live, counts in column headers reflect visible cards; distribution bar/stats reflect all pieces.
- Distribution bar animates width changes (.4s ease) as pieces move.
- All hovers listed above; transitions .14s ease unless noted.
- No confirmation dialogs in the prototype — add a confirm on Delete in production.
- Date formatting: cards "Thu, Jul 23"; schedule groups "Tuesday, July 21" + relative "in Nd"/"today"/"Nd ago".

## State Management
- `view`: 'pipeline' | 'editor'; `editingId`: piece id or 'new'; `draft`: working copy of the piece being edited (mutations don't touch the library until Save).
- `search` string, channel `filter`, editor `preview` boolean.
- `pieces[]`: `{ id, title, channel, status: 'draft'|'scheduled'|'published', date: 'YYYY-MM-DD'|'', topic, body }`.
- In production: pieces come from the existing API; save/delete/move are mutations; schedule = scheduled pieces grouped by date ascending.

## Assets
- Fonts via Google Fonts: Hanken Grotesk (400–800), JetBrains Mono (400–500).
- No images or icon library — the logo mark is pure CSS (rounded square in a rounded square); glyphs `⌕ → ← +` are text characters (swap for the codebase's icon set if one exists).

## Files
- `Marketing Command Center.dc.html` — the full working prototype (markup, styles, seeded example content, and all interaction logic). Open it in a browser to inspect exact rendering and behavior.

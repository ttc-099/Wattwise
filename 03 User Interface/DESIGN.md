---
name: WattWise Plan
description: Monthly CREAM solar allocation, drawn as a transit line with five stations.
colors:
  line-amber: "#F7931E"
  ink: "#15120F"
  rust: "#A3410F"
  coral: "#EA6B3D"
  sun: "#F9B915"
  peach: "#FDE6BF"
  peach-rail: "#FFF4E2"
  hatch-light: "#FBC27E"
  burnt-ink: "#6B2C07"
  white: "#FFFFFF"
  muted: "#5E5048"
  qualifier: "#7A6B60"
  dimmed: "#8A7B6E"
  citation-grey: "#767676"
  series-grey: "#B7AA9C"
  rule: "#DCCFBF"
  hairline: "#ECE2D6"
  sand: "#F4EEE7"
  ink-hover: "#3A2F27"
typography:
  display:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 850
    lineHeight: 1.02
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 850
    lineHeight: 1.02
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 125"
  figure:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 850
    fontVariation: "'wdth' 118"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 850
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 112"
  body:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  station:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
  label:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.05em"
  code:
    fontFamily: "Consolas, Courier New, monospace"
    fontSize: "12.5px"
    lineHeight: 1.6
rounded:
  hairline: "2px"
  input: "10px"
  panel-sm: "12px"
  nav: "14px"
  panel: "16px"
  panel-lg: "18px"
  modal: "20px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "28px"
  page-x: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.peach-rail}"
  button-disabled:
    backgroundColor: "#F2ECE5"
    textColor: "#75675D"
    rounded: "{rounded.pill}"
  chip:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  chip-alert:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.burnt-ink}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  badge-settled:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.burnt-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
  badge-neutral:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.nav}"
    width: "64px"
    height: "60px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 12px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "16px 18px"
  here-card:
    backgroundColor: "{colors.peach-rail}"
    rounded: "{rounded.panel}"
    padding: "16px 18px"
  station-ring:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.pill}"
    size: "44px"
  station-done:
    backgroundColor: "{colors.line-amber}"
    rounded: "{rounded.pill}"
    size: "44px"
  allocation-track:
    rounded: "18px"
    height: "36px"
---

# Design System: WattWise Plan

## Overview

**Creative North Star: "The Line Map"**

Every month rides one line. The system draws the product's loop (Read, Estimate, Allocate, Send, Settle) the way a city transit map draws a route: a thick rounded line, ringed stations, one "you are here" marker with a halo, and a terminus. The operator console and the judges' evidence console share the same line; the console plots a month's route, the evidence pages plot claim, test, result and end at a verdict station.

The ground is white, warm and quiet: a peach rail and peach callouts, warm taupe hairlines, ink-black type. Colour is spent on the line itself. Line amber is the travelled track and the filled station; coral and sun appear where the line runs as a gradient (start to end) and at the end station. Headings are heavy capitals set in Source Sans 3; everything the operator reads or operates is Source Sans 3 at normal width with tabular figures. Density is operational: 44px targets, 52px table rows, numbers carry the argument.

The world rejects the grey sidebar dashboard of identical cards. Cards exist, but the page's structure is a line and a register, not a grid of tiles.

**Key Characteristics:**
- One route line per surface, 10px thick, rounded, amber where travelled and hairline where not.
- Stations are rings: white with ink border, amber when done, ink-ringed with a peach halo when "here", sun-filled at the terminus.
- Wide heavy uppercase headings; normal-width UI text; tabular numerals everywhere.
- Pill geometry for every control: buttons, chips, badges, search, segmented tabs.
- Held back energy is always a 45 degree amber hatch.
- Flat: depth comes from ink borders, peach halos and tonal fills, not shadows.

## Colors

A warm, single-hue world: amber line on white, ink type, peach tints for everything that is merely highlighted.

### Primary
- **Line Amber** (line-amber): the travelled line, filled stations, the WattWise Plan series in every chart, the selected map plot, the focus ring (3px outline, 2px offset), and the report rule.

### Secondary
- **Coral** (coral): the start of a gradient line (coral to amber to sun on the evidence console), the first appendix station, and the first allocation segment in the categorical palette.

### Tertiary
- **Sun** (sun): the terminus. Fills the verdict and end stations, the text-selection background, the active rail icon, and the operator avatar initials.
- **Rust** (rust): the only coloured text. Links, the "Wise" half of the wordmark, "good" figures, active sort arrows, highlighted code line numbers. Amber is never used as text.

### Neutral
- **Ink** (ink): all primary text, 2px button and track borders, active nav and segmented tab fills, the 2px rule over every table.
- **White** (white): page ground, cards, inputs, station interiors.
- **Peach Rail** (peach-rail): the left icon rail, hover fills, the here-card, selected rows, compose panels, tag pills.
- **Peach** (peach): the "here" halo, alert chip, settled/pending badges, flash on updated rows, highlighted code line.
- **Burnt Ink** (burnt-ink): text on peach chips and badges.
- **Muted** (muted): secondary text, labels, table headers, inactive stations.
- **Qualifier** (qualifier): the "(modelled)" and "(illustrative)" qualifiers that sit after numbers.
- **Dimmed** (dimmed): table rows and legend chips dimmed by the allocation highlight.
- **Series Grey** (series-grey): the fixed-split comparison series in charts.
- **Rule** (rule) and **Hairline** (hairline): rule is the stronger border for inputs and unfilled mini stations; hairline is for card borders, row dividers and the untravelled line.
- **Sand** (sand): neutral badges, disabled inputs, map placeholders.
- **Hatch Light** (hatch-light): the light stripe of the held-back hatch only.

### Named Rules
**The Line Owns the Colour Rule.** Amber, coral and sun belong to the line, its stations and its data. Surfaces stay white or peach; nothing else gets a saturated fill.

**The Rust Text Rule.** Coloured text is rust (#A3410F) and nothing else. Amber and sun fail as text on white and are never used for it.

**The Labelled Number Rule.** A modelled or illustrative figure carries its qualifier in the qualifier colour right beside it, never in a footnote.

## Typography

**Display Font:** Source Sans 3 800 (with Segoe UI, system-ui)
**Body Font:** Source Sans 3 400-600 (with Segoe UI, system-ui)
**Label/Mono Font:** Consolas (with Courier New) for code, file previews and paths only

**Character:** One variable family stretched to do two jobs: expanded heavy capitals read like station signage, normal width reads like a timetable.

### Hierarchy
- **Display** (850, 34px, 1.02, uppercase, 125% width): the evidence console page title, capped at 26ch. 25px under 760px.
- **Headline** (850, 30px, 1.02, uppercase, 125% width): operator section titles; route month names at 24px. 24px under 860px.
- **Figure** (850, 26px, 118% width, tabular): KPI values; the bench line uses 900 at 38px, 125% width.
- **Title** (850, 14.5–15px, uppercase, 0.02em, 112% width): section subheads; detail titles at 17px.
- **Body** (400, 14.5px admin / 15px evidence, 1.45–1.55, tabular figures): all reading text; long notes capped at 68–80ch.
- **Station** (800, 14px): station names under rings; 12px under 860px, 11px under 480px.
- **Label** (700, 12px, 0.05em, uppercase): table headers and stacked mobile cell labels (11.5px). Card labels are 12.5px 700 sentence case.

### Named Rules
**The Two Widths Rule.** Expanded width (112–125%) is for headings and headline figures only. Controls, tables and body copy stay at normal width.

**The Tabular Rule.** Every surface sets `font-variant-numeric: tabular-nums`; numbers in columns align right.

## Layout

The operator app is a fixed 84px icon rail on the left, a 64px translucent white top bar (94% white, 8px blur) and a main column padded 36px, capped at 1480px. The first viewport is a route box: the route line across the width with a 320px here-card beside it, collapsing to one column under 1100px. Below sit the register table and the allocation track. The evidence console is a single centred column (max 1180px) under a sticky top bar.

Spacing is a loose 6 / 10 / 14 / 18 / 28 / 36px rhythm; grids use 14px gaps with `auto-fit, minmax(200–260px, 1fr)` columns.

Responsive: under 860px the rail becomes a 72px bottom tab bar, page padding drops to 14px with 100px bottom clearance, station rings shrink to 34px (28px under 480px) and station captions hide. Wide tables restack under 860px (operator) and 760px (evidence) into grid rows, each cell gaining a small uppercase label of its column name.

## Elevation & Depth

Flat. Depth is carried by ink borders (2px on buttons, the track, open detail panels and the table top rule), peach halos around the "here" and terminus stations, and tonal peach fills for selection. The only true shadows are on overlays.

### Shadow Vocabulary
- **Station halo** (`box-shadow: 0 0 0 8px #FDE6BF`): the "here" ring and terminus; 5px on small rings, 3px on register mini stations.
- **Selected segment** (`box-shadow: inset 0 0 0 3px #15120F`): the picked allocation segment.
- **Drawer** (`box-shadow: -16px 0 40px -12px rgba(60,30,10,.22)`): the evidence code drawer, the only cast shadow.

### Named Rules
**The Halo Not Shadow Rule.** Emphasis is a flat peach ring around the thing, never a drop shadow under it.

## Shapes

Round everywhere the line goes. Lines have fully rounded ends (radius half their thickness), stations are circles, every control is a pill (999px). Containers use soft 16px corners (18px on evidence cards, 20px on modals, 12px on previews), inputs 10px, nav items 14px. The allocation track is a 36px pill with a 2px ink border, its segments separated by 2px white gaps. Borders are 1px hairline for containers and 2px ink for things you act on.

## Components

### Buttons
- **Shape:** full pill (999px), 44px minimum height, 2px ink border (1.5px on small).
- **Primary:** ink fill, white 700 14px text, 0 20px padding. One per view: the action that moves the month to its next station.
- **Hover / Focus:** primary darkens to ink-hover; secondary fills peach rail. Focus is a 3px amber outline with 2px offset.
- **Secondary:** white with ink border and ink text. Disabled: sand fill, rule border, muted text.
- **Round nav:** 44px circular ink-bordered buttons with stroked SVG chevrons step months and years.

### Chips
- **Style:** pills, 13px 600, white with hairline border and muted text. The alert chip (notice deadline) is peach with burnt ink 700 text and no border.
- **Badges:** 12.5px 700 pills; settled and pending are peach, urgent is pale coral (#FBE0D3 on #8A2E0E), noticed is ink.

### Cards / Containers
- **Corner Style:** 16px (18px on the evidence console).
- **Background:** white with a 1px hairline border; the here-card and context panels are peach rail with no border.
- **Shadow Strategy:** none; see Elevation.
- **Internal Padding:** 16px 18px (22px 24px on evidence cards).

### Inputs / Fields
- **Style:** white, 1.5px rule border, 10px radius, 40px tall; search and filters are 44px pills.
- **Focus:** border turns ink.
- **Disabled:** sand fill, muted text.

### Navigation
- **Rail:** 84px peach rail of 64x60px items, 22px stroked SVG icons over 11.5px 700 labels. Hover fills white; active fills ink with white label and sun icon. Becomes a bottom bar under 860px.
- **Segmented tabs:** List / Map toggle, a pill with 2px ink border; the on tab fills ink.

### Tables
- Top rule 2px ink; headers 12px uppercase muted; 52px rows (46px on evidence) on hairline dividers; clickable rows fill peach rail on hover. Updated rows flash peach for 1.6s. Register rows lead with a mini line: 13px stations joined by 3px links, amber when filled, a peach halo on "here", and a short end bar for a closed month.

### Route Line (signature)
Five stations on a 10px rounded line spanning 10% to 90% of the width. The track fills amber up to the current station. Stations are 44px rings: untravelled has a hairline border, done is amber with ink border, here is white with a 5px ink border and an 8px peach halo. Each station has a 14px 800 name and a 12.5px caption (max 16ch).

### Claim Line (signature, evidence console)
A vertical 8px line with a coral to amber to sun gradient. Each row (CLAIM, TEST, RESULT) hangs off a 22px white ink-ringed station; the last row is the verdict station, 28px, sun-filled with a peach halo, its label in rust. The home bench line runs the same gradient horizontally with 52px rings and a sun terminus.

### Allocation Track (signature)
A 36px pill track of buyer segments in the categorical palette, with held back energy hatched. Clicking a segment, row or legend chip selects that buyer: the segment gets a 3px inset ink ring, other segments drop to 35% opacity, other rows and chips turn dimmed with their dots at 45%, the selected row fills peach rail, and a caption line under the track names the match. Transitions run 0.25s on `cubic-bezier(.2,.8,.2,1)`.

### Held Back Hatch
A 45 degree repeating stripe of line amber and hatch light (6px bands on the track, 4px on legend dots). It always means energy deliberately held back for sale via NEDA.

## Do's and Don'ts

### Do:
- **Do** draw process as a line with stations: 10px rounded line, 44px rings, amber up to the current station.
- **Do** mark "you are here" with a 5px ink ring and an 8px peach halo, and the end of a line with a sun-filled station.
- **Do** set headings in Source Sans 3 800 uppercase, and everything operable at normal width.
- **Do** make every control a 44px-tall pill with a 2px ink border.
- **Do** colour text rust (#A3410F) when it must be coloured.
- **Do** hatch held back energy in amber and hatch light at 45 degrees.
- **Do** put "(modelled)" or "(illustrative)" next to the figure it qualifies, in the qualifier colour.

### Don't:
- **Don't** build a grey sidebar dashboard of identical cards; the page is a line, a register and a track.
- **Don't** use amber or sun for text on white.
- **Don't** add drop shadows to cards or buttons; use ink borders, halos and peach fills.
- **Don't** use square or slightly rounded buttons; controls are pills.
- **Don't** use the hatch for anything other than held back energy.

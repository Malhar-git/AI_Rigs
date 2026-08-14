# Handoff: AI Rig Overview Webpage

## Overview
A single-page product/spec page for an "AI Rigs" PC-build store. It presents one recommended workstation build (a Llama 3.1 70B inference rig), itemizes every component with Amazon affiliate buy links, shows a phased upgrade path, and keeps a running **total build cost** pinned to the bottom of the viewport as the user scrolls.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look, layout, and behavior. They are **not production code to copy directly**. The HTML uses a small in-house preview runtime (`support.js`, the `<x-dc>` / `<sc-for>` / `{{ }}` syntax); **do not port that runtime**.

Your task is to **recreate this design in the target codebase's existing environment** (React, Vue, Svelte, etc.) using its established component patterns, styling approach, and libraries. If no codebase/framework exists yet, pick the most appropriate one (a React + Vite or Next.js setup is a fine default for this static marketing page) and implement the design there.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, and interactions are final. Recreate the UI pixel-perfectly. All exact values are documented in the **Design Tokens** section below.

## Screens / Views

### Single view: AI Rig Overview page
**Purpose:** Let a buyer understand the recommended build, buy each part, see the upgrade roadmap, and track total cost while scrolling.

**Page-level layout (top → bottom):**
1. **Sticky header** (full-width, sticks to top)
2. **Main content** — centered column, `max-width: 1320px`, horizontal padding `32px`
   - Title block
   - Two-column grid: component manifest (left, fluid) + upgrade sidebar (right, fixed `326px`)
   - Footer
3. **Pinned total-cost bar** (fixed overlay at bottom of viewport)

---

#### 1. Header (sticky)
- `position: sticky; top: 0; z-index: 50`
- Background `rgba(255,255,255,0.85)` with `backdrop-filter: blur(10px)`; bottom border `1px solid #ececec`
- Flex row, space-between, padding `14px 32px`
- **Left:** wordmark `AI RIGS` — 18px, weight 700, letter-spacing `0.04em`
- **Right:** pill nav group — background `#f4f4f3`, `border-radius: 999px`, padding `4px`. Items: `About`, `Configurator`, `Top Grossing` (14px / weight 500 / color `#26251f`, padding `8px 14px`, `border-radius: 999px`, no underline) and `Contact` as a filled pill (weight 600, white text, background = accent `#d96a2c`).

#### 2. Title block
- Container padding `10px 0 4px`
- **H1:** `The 70B Inference Workhorse` — 64px, weight 600, `line-height: 0.98`, `letter-spacing: -0.035em`, `max-width: 14ch`, margin 0. The word **"Workhorse"** is colored with the accent (`#d96a2c`); the rest is `#26251f`.
- **Subtitle `<p>`:** "A single RTX 4090 that runs Llama 3.1 70B at Q4 today — every other part oversized on purpose, so the rig grows without a rebuild." — 17px, `line-height: 1.5`, color `#6b6b64`, `max-width: 52ch`, margin-top 18px. (Note: "Llama 3.1" uses a non-breaking space.)

#### 3. Two-column grid
- `display: grid; grid-template-columns: 1fr 326px; gap: 24px; margin-top: 30px; align-items: start`

##### Left column — Component Manifest
- **Section header row:** label `COMPONENT MANIFEST` (mono, 12px, letter-spacing `0.16em`, uppercase, weight 600, color `#5a5a54`) + a flexible `1px` divider line (`#e6e6e2`) + right label `8 PARTS` (mono, 11px, uppercase, color `#9a9a92`). Margin-bottom 14px.

- **Featured GPU card** (highlighted):
  - Border `1.5px solid` accent, background `#fffdfb`, `border-radius: 5px`, margin-bottom 10px
  - Inner flex row, gap 18px, padding `18px 20px`
  - **Icon tile:** `72×72`, `border-radius: 5px`, background `#f1f0ec`, border `1px solid #e6e6e2`, centered mono label `GPU` in accent color, 13px weight 600
  - **Body:** category eyebrow `Graphics · Centerpiece` (mono 10.5px, uppercase, letter-spacing `0.14em`, accent, weight 600); title `NVIDIA GeForce RTX 4090` (19px weight 600, `letter-spacing: -0.01em`); spec line `24 GB GDDR6X · 16,384 CUDA · 1008 GB/s` (mono 12px, `#6b6b64`)
  - **Price + CTA (right-aligned):** price `₹1,74,990` (mono 17px weight 600); **Buy on Amazon** button — background `#ffd814`, text `#0f1111`, 12.5px weight 600, padding `9px 14px`, `border-radius: 7px`, trailing `↗`. Hover: background `#f3c400`.
  - **VRAM pool bar:** label row (mono 10.5px, `#8a8a82`) "VRAM POOL" / "24 GB now → 48 w/ 2nd GPU"; below it a `10px`-tall track (background `#f0f0ec`, border `1px solid #e6e6e2`, `border-radius: 3px`) with a 50%-width accent fill on the left, a faint `#e2e1db` fill on the right half, and a `1px` `#c2c1ba` divider at the 50% mark.

- **Other parts list:** vertical flex, gap 8px. One row per part (7 parts, see data below):
  - Row: flex, gap 16px, align center, padding `14px 18px`, border `1px solid #e6e6e2`, `border-radius: 5px`, background `#fff`. Hover: border-color `#d2d2cc`.
  - **Code tile:** `52×52`, `border-radius: 5px`, background `#f4f3ef`, border `1px solid #e6e6e2`, mono code label (e.g. `CPU`) 11px weight 600 color `#5a5a54`
  - **Body:** category eyebrow (mono 10px uppercase letter-spacing `0.14em` `#9a9a92`); name (15.5px weight 600 `letter-spacing -0.01em`); spec (mono 11.5px `#7a7a72`)
  - **Price + CTA:** price (mono 15px weight 600); **Buy on Amazon** button (same yellow style as GPU, slightly smaller: padding `8px 13px`, 12px)

- **Affiliate disclosure `<p>`:** "As an Amazon Associate, AI Rigs earns from qualifying purchases. Prices indicative · Amazon.in." — mono 10.5px, color `#aaaaa2`, margin-top 14px.

##### Right column — Upgrade sidebar (sticky)
- `position: sticky; top: 84px`, border `1px solid #e6e6e2`, `border-radius: 6px`, background `#fff`, padding `22px`
- **Header:** label `UPGRADE PATH` (mono 11px uppercase letter-spacing `0.14em` weight 600 `#5a5a54`) + divider line
- **Vertical timeline:** a `2px` rail (`#e2e2dc`) runs down the left; each phase has a `16px` dot offset `-28px` left.
  - **Now · Live** — filled accent dot. "Single RTX 4090 · 24 GB" / "Runs 70B Q4 with smart CPU offload."
  - **Phase 02** — hollow accent dot (white fill, `2px` accent border) + badge `+24 GB` (accent text, background `#fbeee4`). "Add a 2nd RTX 4090" / "Drop into the free PCIe 5.0 slot → 48 GB unified pool. +₹1,74,990"
  - **Phase 03** — hollow grey dot (`2px #c8c8c2`) + badge `+64 GB` (`#6b6b64` on `#f0f0ec`). "Fill RAM to 128 GB" / "Two DIMM slots left open on day one. +₹18,500"
  - **Phase 04** — hollow grey dot + badge `+2 TB`. "NVMe RAID array" / "Second M.2 slot for fast dataset storage. +₹15,500"
  - Phase eyebrows: mono 9.5px uppercase letter-spacing `0.14em` weight 600. Titles 14px weight 600. Descriptions 12.5px `#7a7a72` `line-height 1.45`; inline price spans use the mono font in `#26251f`.
- **Button:** full-width `Plan an upgrade ↗` — height 42px, white background, border `1px solid #d6d6d0`, mono 11px uppercase letter-spacing `0.1em` weight 600. Hover background `#f6f6f4`.

#### 4. Footer
- Top border `1px solid #e6e6e2`, background `#faf9f7`
- Inner: `max-width: 1320px`, padding `28px 32px 132px` (the large bottom padding clears the pinned cost bar), flex space-between
- Left: `AI RIGS` (16px weight 700). Right: `© 2026 AI Rigs Analytics Engine · Data v2.6.11 Beta` (mono 10.5px uppercase letter-spacing `0.14em` `#9a9a92`).

#### 5. Pinned total-cost bar (fixed overlay) — KEY FEATURE
- `position: fixed; left: 0; right: 0; bottom: 0; z-index: 50`
- Background `rgba(250,249,247,0.92)` with `backdrop-filter: blur(12px)`; top border `1px solid #e0e0db`; shadow `0 -8px 24px rgba(38,37,31,0.07)`
- Inner: `max-width: 1320px` centered, padding `14px 32px`; flex row, `flex-wrap: wrap`, gap 28px, align center
- **Block A — total:** eyebrow `TOTAL BUILD COST` (mono 11px uppercase letter-spacing `0.14em` `#9a9a92`); value `₹3,20,490` (mono 38px weight 600 `letter-spacing -0.015em`) + `8 parts` (13px `#9a9a92`)
- **Block B — stat tiles** (`flex: 1; min-width: 280px`): a `repeat(4, 1fr)` grid, gap 10px. Each tile: white background, border `1px solid #ececE8`, `border-radius: 5px`, padding `12px 14px`. Big number (mono 20px weight 600) + caption (mono 9.5px uppercase letter-spacing `0.1em` `#9a9a92`). Tiles:
  - `24 GB` / `VRAM · → 48`
  - `64 GB` / `DDR5 MEMORY`
  - `760 W` / `PEAK DRAW`
  - `92 %` / `OF BUDGET` (number colored with accent)
- **Block C — status + CTA:** a green dot (`8px`, `#3a9d63`) + "All compatibility checks passed" (13px `#2f6b48`); below it an **Export build sheet** button — accent background, white text, height 46px, padding `0 28px`, 15px weight 600, `border-radius: 5px`. Hover: `opacity: 0.9`.

## Interactions & Behavior
- **Pinned cost bar:** stays fixed at the bottom of the viewport at all scroll positions, content scrolls behind its frosted-glass background. Ensure body/footer reserves ~132px bottom space so nothing is permanently hidden behind it.
- **Sticky header** and **sticky upgrade sidebar** (`top: 84px`) remain in view while scrolling their respective regions.
- **Buy on Amazon links:** open the part's Amazon URL in a new tab (`target="_blank" rel="noopener"`).
- **Hover states:** documented per-component above (Amazon buttons darken to `#f3c400`; part rows darken border to `#d2d2cc`; sidebar/export buttons as noted).
- No loading, error, or form-validation states. The page is static/presentational.
- **Responsive:** the prototype is built for desktop (~1320px content width). For narrower viewports, collapse the two-column grid to a single column and let the cost-bar's three blocks wrap (they already use `flex-wrap: wrap`). Confirm intended mobile behavior with the designer if it matters.

## State Management
Effectively static. The only data is the **parts list** (array of objects) used to render the manifest rows. No fetching, no client state beyond that. Total cost / stat-tile figures are currently hardcoded strings — if you want them derived, compute the total from the parts array instead.

### Parts data (left-column rows, in order)
```js
const parts = [
  { code: "CPU",  cat: "Processor",   name: "AMD Ryzen 9 7900X",            spec: "12C / 24T · 5.6 GHz · AM5",       price: "₹37,500", amazon: "https://www.amazon.in/dp/B0BBHHT8LT?tag=airigs-21" },
  { code: "MB",   cat: "Motherboard", name: "ASUS ROG Strix X670E-E",        spec: "2× PCIe 5.0 x16 · 4× DDR5",       price: "₹41,000", amazon: "https://www.amazon.in/dp/B0B5LG6HX9?tag=airigs-21" },
  { code: "RAM",  cat: "Memory",      name: "64 GB DDR5-6000 CL30",          spec: "2× 32 GB · up to 128 GB",         price: "₹18,500", amazon: "https://www.amazon.in/dp/B0BGHDX5HB?tag=airigs-21" },
  { code: "SSD",  cat: "Storage",     name: "Samsung 990 Pro 2 TB",          spec: "PCIe 4.0 NVMe · 7,450 MB/s",      price: "₹15,500", amazon: "https://www.amazon.in/dp/B0BHJJ9Y77?tag=airigs-21" },
  { code: "PSU",  cat: "Power",       name: "Corsair RM1000x 1000W",         spec: "80+ Gold · ATX 3.0 · modular",    price: "₹13,500", amazon: "https://www.amazon.in/dp/B0BR6HJG9W?tag=airigs-21" },
  { code: "COOL", cat: "Cooling",     name: "Arctic Liquid Freezer III 360", spec: "360 mm AIO · daily-load rated",   price: "₹10,500", amazon: "https://www.amazon.in/dp/B0CP72N5GH?tag=airigs-21" },
  { code: "CASE", cat: "Chassis",     name: "Lian Li Lancool III",           spec: "420 mm GPU clearance · airflow",  price: "₹9,000",  amazon: "https://www.amazon.in/dp/B0CKH9X3JC?tag=airigs-21" }
];
```
The **GPU** (NVIDIA GeForce RTX 4090, `₹1,74,990`, `https://www.amazon.in/dp/B0BGX5C8N6?tag=airigs-21`) is rendered separately as the featured card, not from this array.

## Design Tokens

### Colors
- **Accent (primary):** `#d96a2c` (themeable — the prototype exposes alternates `#2f7d5b`, `#3360c2`, `#9a5bc4`)
- **Text primary:** `#26251f`
- **Text secondary:** `#6b6b64`, `#7a7a72`
- **Text muted / mono labels:** `#9a9a92`, `#8a8a82`, `#aaaaa2`, `#5a5a54`
- **Page background:** `#ffffff`
- **Warm surfaces:** `#faf9f7` (footer, cost bar), `#fffdfb` (GPU card), `#f4f3ef` / `#f1f0ec` / `#f0f0ec` (tiles/tracks), `#f4f4f3` (nav pill group)
- **Borders:** `#e6e6e2` (default), `#ececec` / `#ececE8` (light), `#e0e0db` (cost bar top), `#d6d6d0` / `#d2d2cc` (button/hover), `#c8c8c2` / `#c2c1ba` (timeline dots/markers)
- **Amazon yellow:** `#ffd814`, hover `#f3c400`, text `#0f1111`
- **Success green:** dot `#3a9d63`, text `#2f6b48`
- **Phase 02 badge bg:** `#fbeee4`; **grey badge bg:** `#f0f0ec`

### Typography
- **Sans (UI/headings):** `DM Sans` (weights 400/500/600/700), fallback `system-ui, sans-serif`
- **Mono (labels, prices, specs):** `JetBrains Mono` (weights 400/500/600)
- Both loaded from Google Fonts.
- Key sizes: H1 64px/600; subtitle 17px; section labels 11–12px mono uppercase; part name 15.5px/600; GPU title 19px/600; total value 38px mono/600; stat numbers 20px mono/600.

### Spacing
- Page horizontal padding: `32px`; content `max-width: 1320px`
- Grid gap `24px`; sidebar width `326px`
- Card paddings: GPU `18px 20px`, part rows `14px 18px`, sidebar `22px`, cost bar `14px 32px`
- Footer bottom padding `132px` (reserves space for the pinned bar)

### Border radius
- Cards / tiles / tracks: `5px`
- Buttons: `4px` (sidebar/secondary), `5px` (export), `7px` (Amazon)
- Sidebar / cost-tiles container: `6px`
- Nav pills: `999px`
- Timeline dots: `50%`

### Shadows / effects
- Header backdrop blur `10px` over `rgba(255,255,255,0.85)`
- Cost-bar backdrop blur `12px` over `rgba(250,249,247,0.92)`, shadow `0 -8px 24px rgba(38,37,31,0.07)`

## Assets
No image or icon files — all visual elements are CSS (the GPU/part "icons" are mono text labels in tiles; arrows `↗` and bullets `·` are Unicode glyphs). Only external assets are the two Google Fonts. Amazon product images are not used. If you want real product thumbnails, source them separately and respect Amazon's affiliate image guidelines.

## Files
- `AI Rig Overview v2.dc.html` — the design reference (open in a browser to view; uses the bundled preview runtime).
- `support.js` — the preview runtime required only to render the `.dc.html` locally. **Do not port this to production.**

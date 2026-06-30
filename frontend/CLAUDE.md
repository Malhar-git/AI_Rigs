# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Frontend for **AI Rigs** — an AI workstation configurator for the Indian market. Users walk a multi-step wizard describing their AI workload (model, precision, budget in INR, etc.); the answers are meant to drive an AI-generated hardware build from the backend.

This is one half of a monorepo: the Spring Boot backend lives at `../backend` (separate app, its own `../backend/CLAUDE.md`, Gemini-powered build generation, runs on `:8080`). **The frontend is not yet wired to the backend** — there are no `fetch`/API calls. The wizard's "Generate" button currently just routes to `/product-specification`. When integrating, the wizard answers (`WizardAnswers`) map onto the backend's `WizardAnswersDTO`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Tremor (`@tremor/react`) for charts/UI · Remix icons. Package manager is **pnpm**.

## Commands

```bash
pnpm install
pnpm dev      # next dev — http://localhost:3000
pnpm build    # next build
pnpm start    # serve production build
pnpm lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test setup in the frontend. Lint is the only automated check — run `pnpm lint` before considering frontend work done.

## Conventions that aren't obvious

- **Path alias:** `@/*` → repo root (`./*`), per `tsconfig.json`.
- **UI primitives live in `app/ui components/`** — note the literal space in the folder name. Imports use the space: `import Button from "../ui components/Button"`. Shared primitives: `Button`, `Label`, `OptionCard`, `ProgressBar`.
- **Tailwind v4 is CSS-first.** No `tailwind.config.js`. Theme tokens and the Tremor content source are declared in `app/globals.css` via `@import "tailwindcss"`, `@plugin`, `@source`, and `@theme inline`. Add design tokens (colors, fonts) as CSS custom properties inside `@theme inline`, then use them as Tailwind utilities (e.g. `text-secondary`, `bg-muted`, `border-border`). Semantic color vars (`--color-primary`, `--color-accent`, `--color-danger`, etc.) are already defined there.
- **Fonts** are loaded in `app/layout.tsx` via `next/font/google` (DM Sans → `--font-dm-sans` / `font-primary`; JetBrains Mono → `--font-jetBrains-mono` / `font-secondary`).
- Interactive pages/components are Client Components (`"use client"`).

## App structure

Routes under `app/` (App Router): `/` (landing), `/grossing` (GPU leaderboard), `/guild-builder` (the wizard), `/product-comparison`, `/product-specification`. Shared layout chrome (`Header`, `Footer`, `Hero`, etc.) is in `app/components/`.

## The wizard (`app/guild-builder/`) — the core architecture

This is the most involved part of the codebase and spans several files. It is a **config-driven** wizard:

- **`types/wizard-steps.ts`** — the single source of truth. Exports `wizardConfig`, a static object describing all 9 steps (task → model → precision → budget → intensity → priorities → brand → expand → review), their options, and their `type` (`single_select` | `multi_select` | `review`). The `WizardStep`/`WizardOption` interfaces are also here. **To change wizard questions, options, models, VRAM floors, or budget tiers, edit this file** — not the components.
- **`use-builder-flow.ts`** — `useBuilderFlow()`, a single hook owning all wizard state (current step index, accumulated `answers`, navigation, validation, the review summary). Page components are thin; logic lives here. Key behaviors:
  - **Precision step is conditional.** It is skipped when no model is chosen or the model is in `conditional.skip_if_model_in` (image/video models, "not sure"). `visibleSteps` filters it out and all indexing is against `visibleSteps`, not the raw `steps`.
  - **VRAM floor is computed client-side** via `calculateVramFloor` (base model VRAM × precision multiplier, see `builder-utils.ts`: fp16 ×1, q8 ×0.5, q4 ×0.25, auto ×0.4), and surfaced in dynamic question text.
  - `answers` shape is `WizardAnswers` (`types/builder-types.ts`).
- **`page.tsx`** — renders the conversation-style stack of answered + current steps, sidebar, progress bar, and nav buttons; delegates per-step rendering to `BuilderStepContent`.
- **`blocks/BuilderStepContent.tsx`** — dispatches on `step.type` to `SingleSelectStep` / `MultiSelectStep` / `ReviewStep`. The `model` step is special-cased to render grouped model families.
- **`builder-utils.ts`** — pure helpers (option lookups, `interpolate` for `{placeholder}` substitution in dynamic question strings, VRAM math, display-name maps).

When adding a step: add it to `wizardConfig`, then extend the `switch` statements in `useBuilderFlow` (`isStepAnswered`, `setSingleAnswer`, `reviewValues`) and the `WizardAnswers` type. The rendering layer usually needs no changes unless the step uses a new control type.

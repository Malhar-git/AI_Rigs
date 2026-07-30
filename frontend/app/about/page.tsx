import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "../components/PageShell";

export const metadata: Metadata = {
  title: "About · AI Rigs",
  description:
    "What AI Rigs is, and the methodology behind every hardware build we generate.",
};

// ─── prose primitives ─────────────────────────────────────────────────────────
// The About page reads like a long-form post, so text sits in a single narrow
// column and shares the same tokens as the rest of the app.
function Section({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-28 first:mt-0">
      {kicker ? (
        <small className="font-secondary block text-[0.68rem] uppercase tracking-[0.1em] text-accent">
          {kicker}
        </small>
      ) : null}
      <h3 className="mt-2 leading-tight text-foreground">{title}</h3>
      <div className="mt-3 space-y-3 text-justify text-[0.95rem] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

// A monospaced callout — used for the formula and other "spec" moments.
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 border-l-2 border-accent bg-muted/50 px-5 py-3">
      <p className="font-secondary text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

const PRECISION_ROWS: { name: string; mult: string; note: string }[] = [
  { name: "fp16", mult: "×1.00", note: "Full precision — no quality loss, heaviest footprint" },
  { name: "q8", mult: "×0.50", note: "8-bit — near-lossless, roughly half the VRAM" },
  { name: "q4", mult: "×0.25", note: "4-bit — aggressive, fits big models on modest cards" },
  { name: "auto", mult: "×0.40", note: "We pick a sensible middle ground for you" },
];

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "You describe the workload",
    body: "A short, conversational wizard captures the task, the model, precision, budget in INR, how hard you'll push it, and what you care about most.",
  },
  {
    n: "02",
    title: "We compute a VRAM floor",
    body: "Before any part is chosen, we derive the minimum video memory your workload needs from the model size and precision — the single hardest constraint on an AI build.",
  },
  {
    n: "03",
    title: "AI assembles the build",
    body: "Your answers are handed to our generation engine, which selects a coherent, in-budget set of parts that clears the VRAM floor and balances the priorities you set.",
  },
  {
    n: "04",
    title: "You get a spec you can buy",
    body: "The result is a real, itemised workstation — every part links out so you can price it and purchase it in the Indian market.",
  },
];

// Real, public sources the platform syncs from or curates against.
const SOURCES: { name: string; href: string; body: string }[] = [
  {
    name: "LocalScore",
    href: "https://www.localscore.ai",
    body: "Open, real-world benchmarks for local LLM inference — the GPU throughput and latency numbers we lean on when ranking cards.",
  },
  {
    name: "Arena",
    href: "https://arena.ai",
    body: "A community leaderboard for language models. We sync rankings, scores, licenses, and context windows straight from it.",
  },
  {
    name: "Google Gemini",
    href: "https://ai.google.dev",
    body: "The generation engine that turns your answers into a coherent, in-budget parts list.",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-2xl py-16 sm:py-24">
        {/* ── Masthead ── */}
        <header>
          <small className="font-secondary block text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
            Field Notes
          </small>
          <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
            How AI Rigs builds a workstation
          </h1>
          <p className="mt-5 text-justify text-base leading-relaxed text-muted-foreground">
            AI Rigs is a hardware configurator for people who run AI locally. You tell it what
            you want to run; it returns a workstation that can actually run it — priced for the
            Indian market, and reasoned about the way an experienced builder would.
          </p>
        </header>

        <hr className="mt-8 border-border" />

        {/* ── Body ── */}
        <Section kicker="The problem" title="Buying for AI is not like buying a PC">
          <p>
            A gaming rig is judged on frames per second. An AI workstation is judged on whether
            the model you want to run fits in memory at all — and then on how fast it runs once it
            does. Those are different questions, and the parts that answer them are not the ones
            most buying guides push.
          </p>
          <p>
            The constraint that dominates almost every local-AI decision is{" "}
            <span className="font-medium text-foreground">VRAM</span>: the memory on your GPU. Too
            little and the model simply won&apos;t load. So that is where every AI Rigs build starts.
          </p>
        </Section>

        <Section kicker="The core idea" title="Everything hangs off a VRAM floor">
          <p>
            Before we suggest a single component, we calculate the minimum amount of video memory
            your workload needs. The estimate is deliberately transparent — it&apos;s the size of the
            model scaled by the numeric precision you choose to run it at:
          </p>
          <Callout>VRAM floor = base model size × precision multiplier</Callout>
          <p>
            Lower precision trades a little accuracy for a lot of memory. That single lever is
            often the difference between needing one GPU and needing three, so we make it explicit:
          </p>

          <div className="mt-4 overflow-hidden border border-border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/60">
                  <th className="font-secondary px-4 py-2 text-xs uppercase tracking-normal text-muted-foreground">
                    Precision
                  </th>
                  <th className="font-secondary px-4 py-2 text-xs uppercase tracking-normal text-muted-foreground">
                    Multiplier
                  </th>
                  <th className="font-secondary hidden px-4 py-2 text-xs uppercase tracking-normal text-muted-foreground sm:table-cell">
                    What it means
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRECISION_ROWS.map((row) => (
                  <tr key={row.name} className="border-t border-border">
                    <td className="font-secondary px-4 py-3 text-sm font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="font-secondary px-4 py-3 text-sm text-accent">{row.mult}</td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            For image and video models — where memory behaves differently — the precision step is
            skipped entirely and the floor is estimated from the model alone.
          </p>
        </Section>

        <Section kicker="The pipeline" title="From a few answers to a real spec">
          <p>
            The configurator is a short wizard, not a spreadsheet. Each answer narrows the search,
            and the whole thing resolves into a build in four moves:
          </p>
          <ol className="mt-4 space-y-5">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="font-secondary shrink-0 text-sm text-accent">{step.n}</span>
                <div>
                  <h4 className="text-base text-foreground">{step.title}</h4>
                  <p className="mt-1 text-justify text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section kicker="Honesty" title="What the numbers are, and aren't">
          <p>
            The VRAM floor is an <span className="font-medium text-foreground">estimate</span>, and
            we treat it as one. It&apos;s meant to keep you out of the failure case — recommending a
            card that can&apos;t hold your model — not to predict tokens-per-second to the decimal.
            Real throughput depends on batch size, context length, and the specific runtime you
            use, and no configurator can promise those blind.
          </p>
          <p>
            Prices are indicative and sourced for the Indian market. Where we link to a retailer,
            that link may be affiliated — it never changes which parts we recommend.
          </p>
        </Section>

        {/* ── Credits ── */}
        <Section kicker="Credits" title="Standing on open data">
          <p>
            AI Rigs doesn&apos;t invent its numbers. The rankings and benchmarks that inform a build
            are synced from public, open sources, and the hardware catalog is curated on top of
            manufacturer datasheets and community databases. We owe those projects a debt:
          </p>
          <ul className="mt-4 space-y-4 text-left">
            {SOURCES.map((s) => (
              <li key={s.name} className="flex gap-3">
                <span className="font-secondary shrink-0 text-accent">·</span>
                <span>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
                  >
                    {s.name}
                  </a>{" "}
                  — {s.body}
                </span>
              </li>
            ))}
          </ul>
          <p>
            If your project&apos;s data made it into a build and you&apos;d like different credit — or none
            — reach out and we&apos;ll fix it.
          </p>
        </Section>

        {/* ── Close ── */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-muted-foreground">
            That&apos;s the whole method. The best way to see it is to run it.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/guild-builder"
              className="font-primary inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background no-underline transition hover:opacity-90"
            >
              Build a rig
            </Link>
            <Link
              href="/contact"
              className="font-primary inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold text-foreground no-underline transition hover:bg-muted"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

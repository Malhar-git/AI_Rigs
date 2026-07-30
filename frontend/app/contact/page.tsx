import type { Metadata } from "next";
import Link from "next/link";
import { RiGithubFill, RiGoogleFill, type RemixiconComponentType } from "@remixicon/react";
import PageShell from "../components/PageShell";

export const metadata: Metadata = {
  title: "Contact · AI Rigs",
  description: "Reach the AI Rigs team, or contribute to the project on GitHub.",
};

const EMAIL = "malhar1080p@gmail.com";
const GITHUB_REPO = "https://github.com/Malhar-git/AI_Rigs";
const GITHUB_PROFILE = "https://github.com/Malhar-git";

// A single contact channel rendered as a bordered card with an outbound link.
function ContactCard({
  Icon,
  title,
  body,
  href,
  cta,
  external,
}: {
  Icon: RemixiconComponentType;
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <div className="flex flex-col justify-between border border-border bg-card p-6  transition-colors hover:border-foreground/30">
      <div>
        <div className="flex items-center justify-between">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
            <Icon aria-hidden="true" className="h-5 w-5 text-foreground" />
          </span>

        </div>
        <h4 className="mt-4 text-foreground">{title}</h4>
        <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <a
        href={href}
        {...linkProps}
        className="font-secondary mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground no-underline transition-colors hover:text-accent"
      >
        {cta}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl py-16 sm:py-24">
        {/* ── Header ── */}
        <header className="max-w-xl">
          <small className="font-secondary block text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
            Contact
          </small>
          <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">Get in touch</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            AI Rigs is an open project. Whether you&apos;ve found a bad recommendation, want a part
            added to the catalog, or just want to talk hardware — here&apos;s how to reach us.
          </p>
        </header>

        {/* ── Channels ── */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ContactCard
            Icon={RiGoogleFill}
            title="Say hello"
            body="Questions, corrections, and partnership enquiries all land in the same inbox. We read every one."
            href={`mailto:${EMAIL}`}
            cta={EMAIL}
          />
          <ContactCard
            Icon={RiGithubFill}
            title="Contribute"
            body="The whole thing is on GitHub. Open an issue, file a fix, or add hardware to the catalog — pull requests are welcome."
            href={GITHUB_REPO}
            cta="Malhar-git/AI_Rigs"
            external
          />
        </div>

        {/* ── Contribute detail ── */}
        <section className="mt-12 border-t border-border pt-10">
          <small className="font-secondary block text-[0.68rem] uppercase tracking-[0.1em] text-accent">
            Ways to help
          </small>
          <h3 className="mt-2 text-foreground">Good first contributions</h3>
          <ul className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-secondary shrink-0 text-accent">·</span>
              <span>
                <span className="font-medium text-foreground">Add or correct hardware.</span> Keep
                the parts catalog current with pricing and specs for the Indian market.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-secondary shrink-0 text-accent">·</span>
              <span>
                <span className="font-medium text-foreground">Sharpen the estimates.</span> Improve
                the VRAM and performance heuristics behind each generated build.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-secondary shrink-0 text-accent">·</span>
              <span>
                <span className="font-medium text-foreground">Report a bad build.</span> Open an
                issue with the workload you entered and what you expected — those reports are gold.
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="font-primary inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background no-underline transition hover:opacity-90"
            >
              View the repository
            </a>
            <a
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-primary inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold text-foreground no-underline transition hover:bg-muted"
            >
              Maintainer&apos;s profile
            </a>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          Curious how the builds are actually reasoned about?{" "}
          <Link href="/about" className="text-foreground underline underline-offset-2 hover:text-accent">
            Read the methodology
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}

"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ProgressBar } from "../ui components/ProgressBar";
import Label from "../ui components/Label";
import PageShell from "../components/PageShell";
import { getProduct, getProducts } from "@/lib/products";
import type { ProductDto } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────
const inr = (n?: number) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

const amazonSearch = (name: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(name)}&tag=airigs-21`;

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// scalar (string|number) out of the open-ended specs jsonb, if present
const specScalar = (specs: ProductDto["specs"], key: string): string | number | null => {
  const v = specs?.[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
};

const specObj = (specs: ProductDto["specs"], key: string): Record<string, unknown> | null => {
  const v = specs?.[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
};

const nestedStr = (obj: Record<string, unknown> | null, key: string): string | null => {
  const v = obj?.[key];
  return typeof v === "string" ? v : null;
};

// AI TOPS per ₹1,000 — a real value-for-money metric derived from catalog data
const topsPerK = (p: ProductDto): number =>
  p.aiTops != null && p.priceInr ? p.aiTops / (p.priceInr / 1000) : 0;

// ─── spec rows (each pulls a real field, "—" when the product lacks it) ───────
type SpecRow = { label: string; highlight?: boolean; get: (p: ProductDto) => string | null };

const SPEC_ROWS: SpecRow[] = [
  {
    label: "VRAM",
    highlight: true,
    get: (p) => (p.vramGb != null ? `${p.vramGb}GB${p.memoryType ? ` ${p.memoryType}` : ""}` : null),
  },
  {
    label: "Memory Bus",
    get: (p) => {
      const v = specScalar(p.specs, "memory_bus_bits");
      return v != null ? `${v}-bit` : null;
    },
  },
  {
    label: "Bandwidth",
    get: (p) => {
      const v = specScalar(p.specs, "memory_bandwidth_gbs");
      return v != null ? `${v} GB/s` : null;
    },
  },
  { label: "TDP", get: (p) => (p.tdpWatts ? `${p.tdpWatts}W` : null) },
  {
    label: "Boost Clock",
    get: (p) => {
      const v = specScalar(p.specs, "boost_clock_mhz");
      return v != null ? `${v} MHz` : null;
    },
  },
  {
    label: "Tensor Cores",
    get: (p) => {
      const v = specScalar(p.specs, "tensor_cores");
      return v != null ? String(v) : null;
    },
  },
];

// ─── presentational pieces ───────────────────────────────────────────────────
function RowLabel({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="space-y-1 p-4">
      {eyebrow ? (
        <small className="block font-secondary uppercase text-accent">{eyebrow}</small>
      ) : null}
      <h4 className="font-primary text-lg font-medium text-foreground">{title}</h4>
    </div>
  );
}

function CenteredMessage({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <PageShell>
      <div className={`py-24 text-center ${tone === "error" ? "text-red-500" : "text-muted-foreground"}`}>
        {children}
      </div>
    </PageShell>
  );
}

// ─── data-driven content ─────────────────────────────────────────────────────
function ProductComparisonContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids");

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async (): Promise<ProductDto[]> => {
      const idList = ids ? ids.split(",").map((s) => s.trim()).filter(Boolean) : [];
      if (idList.length) {
        // compare exactly what was asked for (cap at 4 so the grid stays readable)
        return Promise.all(idList.slice(0, 4).map(getProduct));
      }
      // no ids → fall back to the top few GPUs so the page is never empty
      const paged = await getProducts({ category: "gpu", size: 3, sortBy: "price_inr", sortDir: "desc" });
      return paged.content;
    };

    load()
      .then((ps) => {
        if (!cancelled) setProducts(ps);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (loading) return <CenteredMessage>Loading comparison…</CenteredMessage>;
  if (error) return <CenteredMessage tone="error">{error}</CenteredMessage>;
  if (products.length === 0) return <CenteredMessage>No products to compare.</CenteredMessage>;

  // group maxima for the normalized bars
  const maxTops = Math.max(1, ...products.map((p) => p.aiTops ?? 0));
  const maxValue = Math.max(0.0001, ...products.map(topsPerK));
  const pricedValues = products.filter((p) => p.priceInr != null).map((p) => p.priceInr as number);
  const minPrice = pricedValues.length ? Math.min(...pricedValues) : null;

  const cols = `210px repeat(${products.length}, minmax(0,1fr))`;

  return (
    <PageShell>
      <section className="min-w-0">
        <h2>GPU Technical Comparison</h2>
        <p className="mt-1 text-muted-foreground">
          Side-by-side analysis driven by the live catalog — specs, AI throughput and value for money.
        </p>

        <div className="mt-6 overflow-x-auto border border-border bg-background">
          <div className="grid min-w-[57.5rem]" style={{ gridTemplateColumns: cols }}>
            {/* header row */}
            <div className="border-b border-r border-border p-4" />
            {products.map((p) => (
              <div key={p.id} className="border-b border-r border-border p-4 last:border-r-0">
                <div className="relative h-24 overflow-hidden border border-border bg-card">
                  <Image src="/product/pexels-googledeepmind.jpg" alt={p.name} fill className="object-cover" />
                </div>
                <h4 className="mt-2">{p.name}</h4>
                {p.brand ? (
                  <small className="font-secondary uppercase tracking-wide text-muted-foreground">{cap(p.brand)}</small>
                ) : null}
                <a
                  href={amazonSearch(p.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-primary mt-2 flex h-10 w-full items-center justify-center rounded-sm bg-accent text-md font-semibold text-primary no-underline transition hover:bg-accent/90"
                >
                  Check on Amazon
                </a>
              </div>
            ))}

            {/* AI Performance — real Tensor TOPS */}
            <div className="border-b border-r border-border">
              <RowLabel eyebrow="Compute" title="AI Performance" />
            </div>
            {products.map((p) => (
              <div
                key={`${p.id}-tops`}
                className="flex flex-col justify-center border-b border-r border-border p-4 last:border-r-0"
              >
                {p.aiTops != null ? (
                  <>
                    <ProgressBar value={p.aiTops} max={maxTops} variant="default" />
                    <small className="mt-2 block font-secondary uppercase tracking-wide text-muted-foreground">
                      {p.aiTops} Tensor TOPS
                    </small>
                  </>
                ) : (
                  <span className="font-secondary text-sm text-muted-foreground">—</span>
                )}
              </div>
            ))}

            {/* Value — AI TOPS per ₹1,000 */}
            <div className="border-b border-r border-border">
              <RowLabel eyebrow="Value" title="TOPS per ₹1k" />
            </div>
            {products.map((p) => {
              const v = topsPerK(p);
              return (
                <div
                  key={`${p.id}-value`}
                  className="flex flex-col justify-center border-b border-r border-border p-4 last:border-r-0"
                >
                  {v > 0 ? (
                    <>
                      <ProgressBar value={v} max={maxValue} variant="neutral" />
                      <small className="mt-2 block font-secondary uppercase tracking-wide text-muted-foreground">
                        {v.toFixed(1)} TOPS / ₹1k
                      </small>
                    </>
                  ) : (
                    <span className="font-secondary text-sm text-muted-foreground">—</span>
                  )}
                </div>
              );
            })}

            {/* Price — cheapest highlighted */}
            <div className="border-b border-r border-border">
              <RowLabel title="Price" />
            </div>
            {products.map((p) => (
              <div
                key={`${p.id}-price`}
                className="flex items-center border-b border-r border-border p-4 last:border-r-0"
              >
                <span
                  className={`font-primary text-lg font-semibold ${
                    minPrice != null && p.priceInr === minPrice ? "text-accent" : "text-foreground"
                  }`}
                >
                  {inr(p.priceInr)}
                </span>
                {minPrice != null && p.priceInr === minPrice ? (
                  <Label variant="active" className="ml-2">
                    Best price
                  </Label>
                ) : null}
              </div>
            ))}

            {/* real spec rows */}
            {SPEC_ROWS.map((row) => (
              <Fragment key={row.label}>
                <div className="border-b border-r border-border p-4">
                  <h4 className="font-primary text-lg font-medium text-foreground">{row.label}</h4>
                </div>
                {products.map((p) => {
                  const value = row.get(p);
                  return (
                    <div key={`${p.id}-${row.label}`} className="border-b border-r border-border p-4 last:border-r-0">
                      <p
                        className={`font-secondary text-sm uppercase tracking-[0.12em] ${
                          row.highlight ? "font-semibold text-accent" : "text-muted-foreground"
                        }`}
                      >
                        {value ?? "—"}
                      </p>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* notes — real compatibility notes + editor badge */}
        <section
          className="mt-8 grid gap-5 border border-border bg-background p-5"
          style={{ gridTemplateColumns: cols }}
        >
          <h3 className="font-primary italic leading-tight text-foreground">Notes</h3>
          {products.map((p) => {
            const notes = nestedStr(specObj(p.specs, "compatibility"), "notes");
            return (
              <article key={`${p.id}-notes`} className="border border-border bg-card p-5">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                <h4 className="mt-3 font-bold text-foreground">{p.name}</h4>
                {notes ? (
                  <p className="mt-2 text-sm leading-normal text-muted-foreground">{notes}</p>
                ) : (
                  <p className="mt-2 text-sm leading-normal text-muted-foreground">
                    No compatibility notes on file.
                  </p>
                )}
                {p.badge ? (
                  <small className="mt-5 block font-secondary text-[0.62rem] uppercase tracking-[0.2em] text-accent">
                    {p.badge}
                  </small>
                ) : null}
              </article>
            );
          })}
        </section>
      </section>
    </PageShell>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function ProductComparison() {
  return (
    <Suspense fallback={<CenteredMessage>Loading…</CenteredMessage>}>
      <ProductComparisonContent />
    </Suspense>
  );
}

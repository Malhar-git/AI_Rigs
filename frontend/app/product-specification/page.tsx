"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Label from "../ui-components/Label";
import PageShell from "../components/PageShell";
import { getProduct } from "@/lib/products";
import type { ProductDto } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────
const inr = (n?: number) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

const amazonSearch = (name: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(name)}&tag=airigs-21`;

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// read a scalar (string|number) out of the open-ended specs jsonb, if present.
// Objects/arrays return null — those are handled explicitly where nested.
const specScalar = (specs: ProductDto["specs"], key: string): string | number | null => {
  const v = specs?.[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
};

// read a nested object out of specs (e.g. compatibility, ai_capabilities)
const specObj = (specs: ProductDto["specs"], key: string): Record<string, unknown> | null => {
  const v = specs?.[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
};

const nestedStr = (obj: Record<string, unknown> | null, key: string): string | null => {
  const v = obj?.[key];
  return typeof v === "string" ? v : null;
};

const nestedStrArr = (obj: Record<string, unknown> | null, key: string): string[] => {
  const v = obj?.[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
};

type SpecItem = { label: string; value: string };

// Extra jsonb spec keys worth surfacing (mostly GPU). Keys that a given product
// doesn't carry are simply skipped, so CPUs/racks stay clean.
const EXTRA_SPECS: { key: string; label: string; fmt: (v: string | number) => string }[] = [
  { key: "boost_clock_mhz", label: "BOOST CLOCK", fmt: (v) => `${v} MHz` },
  { key: "memory_bus_bits", label: "MEMORY BUS", fmt: (v) => `${v}-bit` },
  { key: "memory_bandwidth_gbs", label: "BANDWIDTH", fmt: (v) => `${v} GB/s` },
  { key: "tensor_cores", label: "TENSOR CORES", fmt: (v) => String(v) },
  { key: "rt_cores", label: "RT CORES", fmt: (v) => String(v) },
  { key: "process_node", label: "PROCESS", fmt: (v) => String(v) },
  { key: "recommended_psu_watts", label: "REC. PSU", fmt: (v) => `${v}W` },
];

// Build the technical matrix from the real product: convenience fields first,
// then the known jsonb spec keys this product happens to carry.
function buildSpecs(p: ProductDto): SpecItem[] {
  const items: (SpecItem | null)[] = [
    p.architecture ? { label: "ARCHITECTURE", value: p.architecture } : null,
    p.vramGb != null ? { label: "VRAM CAPACITY", value: `${p.vramGb} GB` } : null,
    p.memoryType ? { label: "MEMORY TYPE", value: p.memoryType } : null,
    p.coreCount != null
      ? { label: p.category?.toLowerCase() === "cpu" ? "CORES" : "CUDA CORES", value: p.coreCount.toLocaleString("en-IN") }
      : null,
    p.aiTops != null ? { label: "AI TOPS", value: String(p.aiTops) } : null,
    p.tdpWatts ? { label: "TDP", value: `${p.tdpWatts}W` } : null,
    p.socket ? { label: "SOCKET", value: p.socket } : null,
    p.tier ? { label: "TIER", value: cap(p.tier) } : null,
    p.series ? { label: "SERIES", value: p.series } : null,
    p.formFactor ? { label: "FORM FACTOR", value: p.formFactor } : null,
  ];

  for (const e of EXTRA_SPECS) {
    const v = specScalar(p.specs, e.key);
    if (v != null) items.push({ label: e.label, value: e.fmt(v) });
  }

  return items.filter((x): x is SpecItem => x !== null);
}

// ─── presentational pieces ──────────────────────────────────────────────────
function SpecCell({ label, value }: SpecItem) {
  return (
    <article className="flex min-h-24 flex-col justify-between border-primary border-2 px-2 py-4 sm:min-h-24">
      <small className="font-secondary text-xs tracking-[0.18em] text-muted-foreground">{label}</small>
      <h3 className="font-secondary mt-3 text-foreground">{value}</h3>
    </article>
  );
}

function TechnicalMatrix({ specs }: { specs: SpecItem[] }) {
  if (specs.length === 0) return null;
  return (
    <section className="mt-10 rounded-sm px-0 py-3">
      <h4 className="px-0 pb-4 font-secondary tracking-wide text-muted-foreground">TECHNICAL MATRIX</h4>
      <div className="grid gap-0 bg-muted/60 sm:grid-cols-2 md:grid-cols-4">
        {specs.map((spec) => (
          <SpecCell key={spec.label} label={spec.label} value={spec.value} />
        ))}
      </div>
    </section>
  );
}

// Real "why this part" — driven by the editor badge, the compatibility notes,
// and the list of AI models this card is known to run (from ai_capabilities).
function Highlights({ product }: { product: ProductDto }) {
  const notes = nestedStr(specObj(product.specs, "compatibility"), "notes");
  const models = nestedStrArr(specObj(product.specs, "ai_capabilities"), "compatible_ai_models");
  if (!product.badge && !notes && models.length === 0) return null;
  return (
    <section className="mt-10">
      <h3>Highlights</h3>
      <div className="mt-2 grid gap-8 p-10 md:grid-cols-2 divide-x-2 divide-primary bg-card">
        {product.badge ? (
          <div>
            <h4 className="font-bold text-accent">Editor&apos;s Pick</h4>
            <p className="mt-1 leading-[1.4] text-muted-foreground">{product.badge}</p>
          </div>
        ) : null}
        {notes ? (
          <div>
            <h4 className="font-bold text-accent">Best For</h4>
            <p className="mt-1 leading-[1.4] text-muted-foreground">{notes}</p>
          </div>
        ) : null}
      </div>
      {models.length ? (
        <div className="mt-4">
          <h4 className="font-bold text-accent">Known to run</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {models.map((m) => (
              <Label key={m}>{m}</Label>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PriceCard({ product }: { product: ProductDto }) {
  return (
    <aside className="m-2 min-w-96 rounded-lg border border-border bg-primary p-5">
      <small className="font-secondary uppercase tracking-wide text-muted-foreground">Pricing</small>

      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="leading-none">{inr(product.priceInr)}</h2>
        <span className="font-secondary text-sm text-muted-foreground">indicative</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {product.tier ? <Label>{cap(product.tier)}</Label> : null}
        {product.aiTops != null ? <Label>{product.aiTops} AI TOPS</Label> : null}
        <Label variant={product.inStock ? "active" : "specialCompact"}>
          {product.inStock ? "In stock" : "Out of stock"}
        </Label>
      </div>

      <div className="mt-6 space-y-2">
        <a
          href={amazonSearch(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-primary flex h-12 w-full items-center justify-center rounded-sm bg-accent text-md font-semibold text-primary no-underline transition hover:bg-accent/90"
        >
          Check on Amazon
        </a>
      </div>

      <p className="mt-3 font-secondary text-[10.5px] leading-relaxed text-muted-foreground/70">
        As an Amazon Associate, AI Rigs earns from qualifying purchases. Price indicative · Amazon.in.
      </p>
    </aside>
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
function ProductSpecificationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("No product id in the URL. Try /product-specification?id=<product-uuid>.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <CenteredMessage>Loading product…</CenteredMessage>;
  if (error) return <CenteredMessage tone="error">{error}</CenteredMessage>;
  if (!product) return null;

  const specs = buildSpecs(product);

  return (
    <PageShell>
      <div className="grid gap-4 lg:grid-cols-[5fr_2fr]">
        <div className="main_section">
          <h2>{product.name}</h2>

          <div className="mt-0 flex w-full flex-wrap items-center gap-1">
            {product.badge ? <Label variant="active">{product.badge}</Label> : null}
            {product.architecture ? <Label>{product.architecture}</Label> : null}
            {product.vramGb != null ? <Label>{product.vramGb}GB VRAM</Label> : null}
            {product.brand ? <Label>{cap(product.brand)}</Label> : null}
          </div>

          {/* Placeholder image — the catalog has no per-product image URL yet */}
          <div className="relative mt-6 h-64 w-full overflow-hidden rounded-sm">
            <Image src="/product/pexels-googledeepmind.jpg" alt={product.name} fill className="object-cover" />
          </div>

          <TechnicalMatrix specs={specs} />
          <Highlights product={product} />
        </div>

        <div className="sidebar lg:justify-self-end">
          <PriceCard product={product} />
        </div>
      </div>
    </PageShell>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function ProductSpecification() {
  return (
    <Suspense fallback={<CenteredMessage>Loading…</CenteredMessage>}>
      <ProductSpecificationContent />
    </Suspense>
  );
}

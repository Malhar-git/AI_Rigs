"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../components/PageShell";
import { getCategories, getProducts } from "@/lib/products";
import type { ProductDto } from "@/lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────
const inr = (n?: number) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const amazonSearch = (name: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(name)}&tag=airigs-21`;

// Category → short display code for the badge
const CATEGORY_CODE: Record<string, string> = {
  gpu: "GPU", cpu: "CPU", motherboard: "MB", ram: "RAM", memory: "RAM",
  storage: "SSD", ssd: "SSD", psu: "PSU", power: "PSU",
  cooling: "COOL", cooler: "COOL", case: "CASE", chassis: "CASE", rack: "RACK",
};
const codeFor = (cat?: string) =>
  CATEGORY_CODE[(cat ?? "").toLowerCase()] ?? (cat ?? "—").slice(0, 4).toUpperCase();

// Accent colour per category badge
const CATEGORY_ACCENT: Record<string, string> = {
  gpu: "text-accent border-accent/30 bg-accent/8",
  cpu: "text-highlight border-highlight/30 bg-highlight/8",
  motherboard: "text-warning border-warning/30 bg-warning/8",
  ram: "text-success border-success/30 bg-success/8",
  psu: "text-muted-foreground border-border bg-muted",
};
const accentFor = (cat?: string) =>
  CATEGORY_ACCENT[(cat ?? "").toLowerCase()] ?? "text-muted-foreground border-border bg-muted";

// ─── product card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  selected,
  onToggleCompare,
}: {
  product: ProductDto;
  selected: boolean;
  onToggleCompare: (id: string) => void;
}) {
  const router = useRouter();
  const catCode = codeFor(product.category);
  const catAccent = accentFor(product.category);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-md border-2 bg-background transition-all duration-200 hover:shadow-md ${
        selected
          ? "border-accent shadow-[0_0_0_1px_hsl(var(--color-accent)/0.2)]"
          : "border-border hover:border-accent/40"
      }`}
    >
      {/* Compare checkbox — top-right corner */}
      <button
        type="button"
        title={selected ? "Remove from compare" : "Add to compare"}
        onClick={() => onToggleCompare(product.id)}
        className={`absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
          selected
            ? "border-accent bg-accent text-white"
            : "border-border bg-background text-transparent hover:border-accent"
        }`}
        aria-pressed={selected}
        aria-label={selected ? "Remove from compare" : "Add to compare"}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4 pt-4">
        {/* Top row: category code + brand */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-secondary text-[9.5px] font-semibold uppercase tracking-[0.12em] ${catAccent}`}>
            {catCode}
          </span>
          {product.brand && (
            <span className="font-secondary text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {cap(product.brand)}
            </span>
          )}
          {product.inStock ? (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-success" title="In stock" />
          ) : (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-muted-foreground/40" title="Out of stock" />
          )}
        </div>

        {/* Product name */}
        <h6 className="mt-2.5 text-[14.5px] font-semibold leading-snug tracking-tight pr-2">
          {product.name}
        </h6>

        {/* Key spec pills */}
        <div className="mt-2 flex flex-wrap gap-1">
          {product.vramGb != null && (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 font-secondary text-[9.5px] font-medium text-accent">
              {product.vramGb} GB VRAM
            </span>
          )}
          {product.architecture && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-secondary text-[9.5px] font-medium text-muted-foreground">
              {product.architecture}
            </span>
          )}
          {product.tier && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-secondary text-[9.5px] font-medium text-muted-foreground capitalize">
              {product.tier}
            </span>
          )}
          {product.aiTops != null && (
            <span className="rounded bg-highlight/10 px-1.5 py-0.5 font-secondary text-[9.5px] font-medium text-highlight">
              {product.aiTops} AI TOPS
            </span>
          )}
          {product.badge && (
            <span className="rounded bg-warning/10 px-1.5 py-0.5 font-secondary text-[9px] font-semibold uppercase tracking-[0.08em] text-warning">
              {product.badge}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-secondary text-[17px] font-semibold tracking-tight">
            {inr(product.priceInr)}
          </span>
          {!product.inStock && (
            <span className="font-secondary text-[10px] text-muted-foreground/60">Out of stock</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/product-specification?id=${product.id}`)}
            className="flex-1 rounded-md border border-border bg-background py-2 font-secondary text-[11.5px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            View Specs →
          </button>
          <a
            href={amazonSearch(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-md bg-[#ffd814] px-3 py-2 font-secondary text-[10.5px] font-semibold text-[#0f1111] transition-colors hover:bg-[#f3c400]"
          >
            Buy ↗
          </a>
        </div>
      </div>
    </article>
  );
}

// ─── compare sticky bar ───────────────────────────────────────────────────────
function CompareBar({
  selectedIds,
  products,
  onClear,
}: {
  selectedIds: string[];
  products: ProductDto[];
  onClear: () => void;
}) {
  const router = useRouter();
  const count = selectedIds.length;
  if (count < 2) return null;

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const category = selectedProducts[0]?.category ?? "items";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Selected thumbnails */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1.5"
            >
              <span className="font-secondary text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                {codeFor(p.category)}
              </span>
              <span className="max-w-[120px] truncate font-secondary text-[11px] font-medium text-foreground">
                {p.name}
              </span>
            </div>
          ))}
          <span className="ml-1 font-secondary text-[11px] text-muted-foreground">
            {count} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onClear}
            className="font-secondary text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => router.push(`/product-comparison?ids=${selectedIds.join(",")}`)}
            className="rounded-md bg-accent px-5 py-2.5 font-secondary text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Compare {count} {cap(category)}s →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── skeleton loader ──────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-md border-2 border-border bg-muted"
        />
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  gpu: "GPU",
  cpu: "CPU",
  motherboard: "Motherboard",
  ram: "RAM",
  psu: "PSU",
  storage: "Storage",
  cooling: "Cooling",
  case: "Case",
  rack: "Rack",
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("gpu");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // ── fetch categories once ──────────────────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then((cats) => {
        const sorted = cats.sort((a, b) => {
          // GPU first, then alphabetical
          if (a === "gpu") return -1;
          if (b === "gpu") return 1;
          return a.localeCompare(b);
        });
        setCategories(sorted);
        setActiveCategory(sorted[0] ?? "gpu");
      })
      .catch(() => {
        // fallback category list if the endpoint fails
        setCategories(["gpu", "cpu", "motherboard", "ram", "psu"]);
      })
      .finally(() => setLoadingCats(false));
  }, []);

  // ── fetch products when category changes ──────────────────────────────────
  useEffect(() => {
    if (!activeCategory) return;
    let cancelled = false;
    setLoadingProducts(true);
    setError(null);
    setSearch(""); // clear search when switching categories
    setSelectedIds([]); // clear compare selection
    getProducts({ category: activeCategory, size: 50, sortBy: "price_inr", sortDir: "desc" })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.content);
          setTotalCount(page.totalElements);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => { cancelled = true; };
  }, [activeCategory]);

  // ── compare toggle ─────────────────────────────────────────────────────────
  const toggleCompare = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }, []);

  // ── client-side search filter ──────────────────────────────────────────────
  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  const hasCompareBar = selectedIds.length >= 2;

  return (
    <PageShell width="wide">
      {/* ── page header ──────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-secondary text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Hardware Catalog
          </p>
          <h2 className="mt-1 text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-(--text-primary)">
            Products
          </h2>
          <p className="mt-1 font-secondary text-sm text-muted-foreground">
            Browse AI hardware by category · Compare up to 3 products
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="14" height="14" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${CATEGORY_LABELS[activeCategory] ?? activeCategory}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-muted pl-8 pr-3 font-secondary text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* ── category tabs ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-border pb-0">
        {loadingCats
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-t-md bg-muted" />
            ))
          : categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-4 py-2 font-secondary text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors hover:cursor-pointer ${
                    isActive
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat] ?? cap(cat)}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-accent" />
                  )}
                </button>
              );
            })}
      </div>

      {/* ── compare hint ──────────────────────────────────────────────────── */}
      {selectedIds.length === 1 && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-accent/20 bg-accent/5 px-4 py-2.5">
          <span className="font-secondary text-[11px] text-accent">
            ✓ 1 selected — pick 1 or 2 more to compare
          </span>
        </div>
      )}

      {/* ── product count + sort hint ─────────────────────────────────────── */}
      {!loadingProducts && !error && (
        <div className="mt-4 flex items-center justify-between">
          <p className="font-secondary text-[11px] text-muted-foreground">
            {search
              ? `${filtered.length} of ${products.length} ${CATEGORY_LABELS[activeCategory] ?? activeCategory}s match`
              : `${totalCount} ${CATEGORY_LABELS[activeCategory] ?? activeCategory}${totalCount !== 1 ? "s" : ""} · sorted by price`}
          </p>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="font-secondary text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* ── grid ──────────────────────────────────────────────────────────── */}
      <div className={`mt-4 ${hasCompareBar ? "pb-24" : "pb-8"}`}>
        {loadingProducts ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-secondary text-sm text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-secondary text-sm text-muted-foreground">
              {search
                ? `No ${CATEGORY_LABELS[activeCategory] ?? activeCategory}s match "${search}".`
                : `No products found in this category.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedIds.includes(product.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── compare bar ───────────────────────────────────────────────────── */}
      <CompareBar
        selectedIds={selectedIds}
        products={products}
        onClear={() => setSelectedIds([])}
      />
    </PageShell>
  );
}

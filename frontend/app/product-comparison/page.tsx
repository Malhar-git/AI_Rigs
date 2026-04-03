"use client";

import Image from "next/image";
import { ProgressCircle } from "@tremor/react";
import { ProgressBar } from "../ui components/ProgressBar";
import { Fragment } from "react";
import Header from "../components/Header";
import Button from "../ui components/Button";
import Footer from "../components/Footer";

type ComparedGpu = {
  name: string;
  image: string;
  score: number;
  budgetAlignment: number;
  budgetTier: string;
  specs: {
    vram: string;
    memoryBus: string;
    bandwidth: string;
    tdp: string;
  };
  telemetry: {
    rayTracing: number;
    fp32Compute: number;
  };
  verdict: {
    title: string;
    body: string;
    tag: string;
  };
  recommendation: string;
};

const SIDE_NAV = ["Overview", "Specs", "Efficiency", "Thermal", "Value"];

const COMPARED_GPUS: ComparedGpu[] = [
  {
    name: "NVIDIA RTX 5090",
    image: "/product/pexels-googledeepmind.jpg",
    score: 95,
    budgetAlignment: 88,
    budgetTier: "Premium Tier",
    specs: {
      vram: "32GB GDDR7",
      memoryBus: "512-bit",
      bandwidth: "1.8 TB/s",
      tdp: "600W",
    },
    telemetry: {
      rayTracing: 92,
      fp32Compute: 96,
    },
    verdict: {
      title: "Absolute Titan",
      body: "Unrivaled throughput for large-scale local model training and full-context inference workloads.",
      tag: "Extends Power Req",
    },
    recommendation: "Large Model Training",
  },
  {
    name: "NVIDIA RTX 5080",
    image: "/featured/geforce-rtx-5080.png",
    score: 82,
    budgetAlignment: 72,
    budgetTier: "High Performance",
    specs: {
      vram: "16GB GDDR7",
      memoryBus: "256-bit",
      bandwidth: "0.9 TB/s",
      tdp: "320W",
    },
    telemetry: {
      rayTracing: 80,
      fp32Compute: 84,
    },
    verdict: {
      title: "Efficiency Lead",
      body: "Balanced compute profile for workstation tuning and sustained mixed AI development tasks.",
      tag: "Thermal Bottleneck",
    },
    recommendation: "Standard AI Dev",
  },
  {
    name: "RX 8900 XTX",
    image: "/featured/amd-radeon-rx-7900-xtx-product.png",
    score: 75,
    budgetAlignment: 58,
    budgetTier: "Enthusiast Value",
    specs: {
      vram: "24GB GDDR6X",
      memoryBus: "384-bit",
      bandwidth: "1.1 TB/s",
      tdp: "355W",
    },
    telemetry: {
      rayTracing: 68,
      fp32Compute: 70,
    },
    verdict: {
      title: "Value Vanguard",
      body: "Strong memory capacity at a favorable price, best suited for budget-sensitive model iteration.",
      tag: "ML Support Lags",
    },
    recommendation: "Hardware Value",
  },
];

type SpecKey = keyof ComparedGpu["specs"];

const SPEC_ROWS: { label: string; key: SpecKey }[] = [
  { label: "VRAM", key: "vram" },
  { label: "Memory Bus", key: "memoryBus" },
  { label: "Bandwidth", key: "bandwidth" },
  { label: "TDP", key: "tdp" },
];

function MetricLabel({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="space-y-2 p-4 sm:p-5">
      <small className="block font-secondary uppercase text-accent">
        {eyebrow}
      </small>
      <h4>{title}</h4>
    </div>
  );
}

function ScoreDial({ value }: { value: number }) {
  return (
    <ProgressCircle
      value={value}
      size="md"
      strokeWidth={4}
      className="rounded-full [&>svg>circle:first-child]:stroke-border [&>svg>circle:last-child]:stroke-accent"
    >
      <span className="text-lg font-semibold">{value}</span>
    </ProgressCircle>
  );
}

export default function ProductComparison() {
  return (
    <div className="product-comparison min-h-screen">
      <header className="header">
        <Header />
      </header>

      <main className="mx-auto flex w-full max-w-310 gap-5 px-3 py-8 sm:px-6 lg:gap-8 lg:px-8">
        <aside className="hidden w-52 mt-2 shrink-0 border-r border-border pr-5 lg:block">
          <h4 className="text-accent">COMPARE</h4>
          <small className="font-secondary mt-1 block uppercase text-secondary">
            Precision Hardware Analysis
          </small>
          <div className="mt-8 space-y-2">
            {SIDE_NAV.map((item) => (
              <Button
                variant="ghost"
                key={item}
                type="button"
                className={`flex w-full items-center gap-2 text-sm uppercase tracking-wide transition ${item === "Specs" ? "bg-background text-accent" : "text-secondary hover:bg-background hover:text-foreground"}`}
              >
                <span className={`h-2 w-2 border ${item === "Specs" ? "border-accent bg-accent" : "border-border bg-transparent"}`} />
                {item}
              </Button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <h2 className="sm:text-5xl">GPU Technical Comparison</h2>
          <p className="mt-1 text-secondary">
            Detailed analysis of top-tier silicon for LLM training and high-fidelity rendering.
          </p>

          <div className="mt-6 overflow-x-auto border border-border bg-background">
            <div className="grid min-w-230 grid-cols-[210px_repeat(3,minmax(0,1fr))]">
              <div className="border-b border-r border-border p-4" />
              {COMPARED_GPUS.map((gpu) => (
                <div key={gpu.name} className="border-b border-r border-border p-4 last:border-r-0">
                  <div className="relative h-24 overflow-hidden border border-border bg-card">
                    <Image src={gpu.image} alt={gpu.name} fill className="object-cover" />
                  </div>
                  <h4 className="mt-2">{gpu.name}</h4>
                  <Button
                    type="button"
                    variant="accent"
                    className="mt-2 w-full bg-accent text-md font-semibold transition hover:bg-accent/90"
                  >
                    Buy on Amazon
                  </Button>
                </div>
              ))}

              <div className="border-b border-r border-border">
                <MetricLabel eyebrow="Compute Metric" title="AI Performance Score" />
              </div>
              {COMPARED_GPUS.map((gpu) => (
                <div
                  key={`${gpu.name}-score`}
                  className="flex items-center justify-center border-b border-r border-border p-5 last:border-r-0"
                >
                  <ScoreDial value={gpu.score} />
                </div>
              ))}

              <div className="border-b border-r border-border">
                <MetricLabel title="Budget Alignment" />
              </div>
              {COMPARED_GPUS.map((gpu) => (
                <div key={`${gpu.name}-budget`} className="border-b border-r border-border p-5 last:border-r-0 flex flex-col justify-center">
                  <ProgressBar value={gpu.budgetAlignment} variant="default" />
                  <small className="mt-2 block font-secondary uppercase tracking-wide text-secondary">
                    {gpu.budgetTier}
                  </small>
                </div>
              ))}

              {SPEC_ROWS.map((specRow) => (
                <Fragment key={specRow.label}>
                  <div key={`${specRow.label}-label`} className="border-b border-r border-border p-4">
                    <h4 className="font-primary text-lg font-medium text-foreground">{specRow.label}</h4>
                  </div>
                  {COMPARED_GPUS.map((gpu) => (
                    <div
                      key={`${gpu.name}-${specRow.label}`}
                      className="border-b border-r border-border p-4 last:border-r-0"
                    >
                      <p className={`font-secondary text-sm uppercase tracking-[0.12em] ${specRow.key === "vram" ? "font-semibold text-accent" : "text-secondary"}`}>
                        {gpu.specs[specRow.key]}
                      </p>
                    </div>
                  ))}
                </Fragment>
              ))}

              <div className="border-r border-border">
                <MetricLabel eyebrow="Telemetry" title="Performance Diagnostics" />
              </div>
              {COMPARED_GPUS.map((gpu) => (
                <div key={`${gpu.name}-telemetry`} className="space-y-3 border-r border-border p-4 last:border-r-0">
                  <div>
                    <small className="font-secondary text-[0.62rem] uppercase tracking-[0.2em] text-secondary">Ray Tracing</small>
                    <ProgressBar value={gpu.telemetry.rayTracing} className="mt-2" variant="neutral" />
                  </div>
                  <div>
                    <small className="font-secondary text-[0.62rem] uppercase tracking-[0.2em] text-secondary">FP32 Compute</small>
                    <ProgressBar value={gpu.telemetry.fp32Compute} className="mt-2" variant="neutral" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section className="mt-8 grid gap-5 border border-border bg-background p-5 md:grid-cols-[210px_repeat(3,minmax(0,1fr))]">
            <h3 className="font-primary text-3xl italic leading-tight text-foreground">Architect&apos;s Verdict</h3>
            {COMPARED_GPUS.map((gpu) => (
              <article key={`${gpu.name}-verdict`} className="border border-border bg-card p-5">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                <h4 className="mt-3 text-xl font-bold text-foreground">{gpu.verdict.title}</h4>
                <p className="mt-2 text-sm leading-normal text-secondary">{gpu.verdict.body}</p>
                <small className="mt-5 block font-secondary text-[0.62rem] uppercase tracking-[0.2em] text-accent">
                  {gpu.verdict.tag}
                </small>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {COMPARED_GPUS.map((gpu) => (
              <article key={`${gpu.name}-recommendation`} className="border border-border bg-background p-6 text-center">
                <small className="font-secondary text-[0.62rem] uppercase tracking-[0.24em] text-accent">Recommended For</small>
                <h4 className="mt-3 text-2xl font-semibold text-foreground">{gpu.recommendation}</h4>
                <small className="mt-2 block font-secondary text-[0.62rem] uppercase tracking-[0.2em] text-secondary">
                  {gpu.name}
                </small>
              </article>
            ))}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
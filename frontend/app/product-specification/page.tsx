"use client";
import { ProgressCircle } from "@tremor/react";
import { ProgressBar } from "../ui components/ProgressBar";
import Label from "../ui components/Label";
import Image from "next/image";

type SpecItem = {
  label: string;
  value: string;
};

const TECHNICAL_SPECS: SpecItem[] = [
  { label: "CUDA CORES", value: "21,760" },
  { label: "BASE CLOCK", value: "2.23 GHz" },
  { label: "BOOST CLOCK", value: "2.52 GHz" },
  { label: "MEMORY TYPE", value: "GDDR7" },
  { label: "VRAM CAPACITY", value: "32 GB" },
  { label: "MEMORY BUS", value: "512-bit" },
  { label: "BANDWIDTH", value: "1.8 TB/s" },
  { label: "TDP", value: "600W" },
  { label: "TENSOR CORES", value: "680 (G5)" },
  { label: "RT CORES", value: "170 (G4)" },
  { label: "L2 CACHE", value: "128 MB" },
  { label: "PROCESS", value: "TSMC 4N" },
];

function SpecCell({ label, value }: SpecItem) {
  return (
    <article className="flex min-h-24 flex-col justify-between border-primary border-2 px-2 py-4 sm:min-h-24">
      <small className="font-secondary text-xs tracking-[0.18em] text-muted-foreground">{label}</small>
      <h3 className="font-secondary mt-3 text-foreground sm:text-5xl">{value}</h3>
    </article>
  );
}

function TechnicalMatrix() {
  return (
    <section className="mt-10 rounded-sm bg-muted/60 p-3 sm:p-4 ml-2">
      <h4 className="px-2 pb-4 font-secondary text-lg tracking-[0.25em] text-secondary sm:text-xl">
        TECHNICAL MATRIX
      </h4>
      <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-4">
        {TECHNICAL_SPECS.map((spec) => (
          <SpecCell key={spec.label} label={spec.label} value={spec.value} />
        ))}
      </div>
    </section>
  );
}

function PerformanceCard() {
  const performanceScore = 90;
  const budgetAlignment = 46;

  return (
    <aside className="m-2 min-w-90 rounded-lg border border-border bg-primary p-5 ">
      <div className="flex items-center justify-between">
        <small className="font-secondary uppercase tracking-wide text-secondary">
          System Score
        </small>
        <button><Image src="/info-icon-svgrepo-com.svg" alt="Info" width={16} height={16}></Image></button>
        {/* change the svg icon color to secondary */}
      </div>

      <div className="mt-7 flex flex-col items-center">
        <ProgressCircle
          value={performanceScore}
          size="xl"
          color="blue"
          strokeWidth={8}
          className="rounded-full shadow-sm [&>svg>circle:first-child]:stroke-[#dfe6f5] [&>svg>circle:last-child]:stroke-[#1254dc]"
        >
          <div className="text-center">
            <h4 className="leading-none">{performanceScore}</h4>
            <small className="font-secondary mt-1 block tracking-wide text-secondary">
              / 100
            </small>
          </div>
        </ProgressCircle>
        <span className="font-secondary mt-5 rounded-full bg-slate-300 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2d5ed9]">
          Rank #1 Global
        </span>
      </div>

      <div className="mt-7">
        <div className="flex justify-between gap-2">
          <p className="font-medium text-secondary">Budget Alignment</p>
          <div className="text-right flex justify-center align-middle">
            <p className="text-secondary">$1,599</p>
            <small className="font-secondary uppercase tracking-wider text-secondary">
              MSRP
            </small>
          </div>
        </div>

        <ProgressBar value={budgetAlignment} label="${budgetAlignment}75%" ></ProgressBar>

        <small className="mt-4 block text-center font-secondary text-secondary">
          Market price currently 12% above MSRP.
        </small>
      </div>

      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          className="font-primary flex h-12 w-full items-center justify-center rounded-sm bg-accent text-md font-semibold text-primary transition hover:bg-accent/90"
        >
          Check on Amazon
        </button>
        <button
          type="button"
          className="font-secondary h-12 w-full rounded-sm border border-accent bg-primary text-sm font-bold uppercase tracking-wide text-accent transition hover:bg-ca"
        >
          Add to Compare
        </button>
      </div>
    </aside>
  );
}

function ModelComaptibility(){
  interface CompatibiltyCard{
    model_name: string;
    model_state: string;
    vram_load: string;
    additonal_info: string;
  }

  const CompatibiltyProps : CompatibiltyCard = [
    {
      model_name: "Llama 3 70B",
      model_state: "Native",
      vram_load: "24.4",
      additonal_info:"Full 4-bit quantization support with zero offloading required",
    },
    {
      model_name: "Stable Cascade",
      model_state: "Active",
      vram_load: "16.0",
      additonal_info: "Full 4-bit quantization support with zero offloading required",
    },
  ];

  return(
    <div className="model-compatability w-full h-64">
      <h4>ML Compatibilty</h4>
      <div>
        {CompatibiltyProps.map((item)=>(
          <div className="flex flex-x"
        ))}
      </div>
    </div>
  )
}



export default function ProductSpecificatn() {
  return (
    <div className="product_specification-page px-4 py-6 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[5fr_2fr]">
        <div className="main_section">
          <h2>NVIDIA RTX 5090</h2>
          <div className="mt-0 flex w-full flex-wrap items-center gap-1">
            <Label variant="active" tooltip="Recommended by benchmark and thermals analysis.">
              AI RECOMMENDED
            </Label>
            <Label tooltip="NVIDIA Blackwell generation architecture.">BLACKWELL ARCH</Label>
            <Label tooltip="24 GB dedicated + 8 GB shared memory profile.">32GB VRAM</Label>
          </div>
          <div className="relative mt-6 h-64 w-full overflow-hidden rounded-sm">
            <Image
              src="/product/pexels-googledeepmind.jpg"
              alt="Product Image"
              fill
              className="object-cover"
            />
          </div>
          <TechnicalMatrix />
          <ModelComaptibility />
        </div>
        <div className="sidebar lg:justify-self-end">
          <PerformanceCard />
        </div>
      </div>
    </div>
  );
}
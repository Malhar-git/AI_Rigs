"use client";
import { ProgressCircle } from "@tremor/react";
import { ProgressBar } from "../ui components/ProgressBar";
import Label from "../ui components/Label";
import Image from "next/image";
import Header from "../components/Header";
import { useRouter } from "next/navigation";

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
    <section className="mt-10 rounded-sm px-0 py-3 ">
      <h4 className="px-0 pb-4 font-secondary tracking-wide text-secondary sm:text-xl">
        TECHNICAL MATRIX
      </h4>
      <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-4 bg-muted/60">
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
  const router = useRouter();

  return (
    <aside className="m-2 min-w-96 rounded-lg border border-border bg-primary p-5 ">
      <div className="flex items-center justify-between">
        <small className="font-secondary uppercase tracking-wide text-secondary">
          System Score
        </small>
        <button><Image src="/info-icon-svgrepo-com.svg" alt="Info" width={16} height={16}></Image></button>
        {/* TODO: change the svg icon color to secondary */}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <ProgressCircle
          value={performanceScore}
          size="xl"
          strokeWidth={8}
          className="rounded-full shadow-sm [&>svg>circle:first-child]:stroke-primary [&>svg>circle:last-child]:stroke-accent"
        >
          <div className="text-center">
            <h4 className="leading-none">{performanceScore}</h4>
            <small className="font-secondary mt-1 tracking-wide text-secondary">
              / 100
            </small>
          </div>
        </ProgressCircle>
        <span className="font-secondary mt-6 rounded-full bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent">
          Rank #1 Global
        </span>
      </div>

      <div className="mt-6">
        <div className="flex justify-between gap-2">
          <p className="font-medium text-secondary">Budget Alignment</p>
          <div className="text-right flex items-center justify-center">
            <p className="text-secondary p-0 m-0">$1,599 MSRP </p>
          </div>
        </div>

        <ProgressBar value={budgetAlignment} label={`${budgetAlignment}%`} className="mt-2"></ProgressBar>

        <small className="mt-6 block text-center font-secondary text-secondary">
          Market price currently 12% above MSRP.
        </small>
      </div>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          className="font-primary flex h-12 w-full items-center justify-center rounded-sm bg-accent text-md font-semibold text-primary transition hover:bg-accent/90"
        >
          Check on Amazon
        </button>
        <button
          type="button"
          onClick={() => router.push("/product-comparison")}
          className="font-secondary h-12 w-full rounded-sm border border-accent bg-primary text-sm font-bold uppercase tracking-wide text-accent transition hover:bg-ca"
        >
          Add to Compare
        </button>
      </div>
    </aside>
  );
}

function ModelComaptibility() {
  type CompatibiltyCard = {
    model_name: string;
    model_state: string;
    vram_load: string;
    additonal_info: string;
  };

  const GPU_VRAM_GB = 32;

  const getVramPercent = (load: string) => {
    const numericLoad = Number.parseFloat(load);

    if (!Number.isFinite(numericLoad) || GPU_VRAM_GB <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (numericLoad / GPU_VRAM_GB) * 100));
  };

  const CompatibiltyProps: CompatibiltyCard[] = [
    {
      model_name: "Llama 3 70B",
      model_state: "Native",
      vram_load: "24.4",
      additonal_info: "Full 4-bit quantization support with zero offloading required",
    },
    {
      model_name: "Stable Cascade",
      model_state: "Active",
      vram_load: "16.0",
      additonal_info: "Full 4-bit quantization support with zero offloading required",
    },
  ];

  return (
    <div className="model-compatability w-full h-64 mt-10">
      <h3>ML Compatibilty</h3>
      <div className="flex">
        {CompatibiltyProps.map((card, index) => (
          <div key={index} className="flex-[0_0_33%] flex-col bg-card px-8 py-6 ms-0 mr-2">
            <div className="flex flex-row justify-between">
              <h4>{card.model_name}</h4>
              <Label variant="specialCompact">{card.model_state}</Label>
            </div>
            <div className="flex flex-col mt-4">

              <div className="flex flex-row justify-between">
                <p className="font-secondary text-secondary">VRAM LOAD</p>
                <p className="font-secondary text-primary-foreground font-bold">{card.vram_load}</p>
              </div>

              <ProgressBar value={getVramPercent(card.vram_load)}></ProgressBar>

            </div>
            <div className="additonal-info mt-4">
              <span className="block text-sm leading-[1.3] text-secondary">
                {card.additonal_info}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClinicalVerdict() {
  type VerdictItem = {
    title: string;
    body: string;
  };

  const CLINICAL_VERDICT: VerdictItem[] = [
    {
      title: "Strength",
      body: "Unparalleled memory bandwidth and VRAM ceiling for local inference. The shift to GDDR7 ensures that large context window applications remain responsive under peak load.",
    },
    {
      title: "Caveat",
      body: "The 600W thermal envelope necessitates high-end cooling solutions. Diminishing returns on purely rasterized workloads compared to AI-accelerated workflows.",
    },
  ];

  return (
    <section className="mt-10">
      <h3>Clinical Verdict</h3>
      <div className="mt-2 grid gap-8 p-10 md:grid-cols-2 divide-x-2 divide-primary bg-card">
        {CLINICAL_VERDICT.map((item) => (
          <div key={item.title}>
            <h4 className="font-bold text-accent">
              {item.title}
            </h4>
            <p className="mt-1 leading-[1.4] text-secondary">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequiredInfrastructure() {
  type requiredHardware = {
    hardware_criteria: string;
  }

  const HardwareRequirement: requiredHardware[] = [
    {
      hardware_criteria: "12VHPWR Connector (Gen 5)",
    },
    {
      hardware_criteria: "1200W Gold PSU Minimum",
    },
    {
      hardware_criteria: "400MM Clearance Case",
    },
  ];

  return (
    <div className="required-infrastructure mt-10 flex w-full flex-col items-center rounded-md bg-muted px-6 py-5 text-center">
      <h4 className="font-secondary text-sm font-semibold uppercase tracking-wide text-secondary">
        Required Infrastructure
      </h4>
      <div className="required-infrastructure__hardware mt-4 flex w-full max-w-md flex-col items-center gap-2 font-secondary">
        {HardwareRequirement.map((requirement, index) => (
          <div
            key={index}
            className="w-full rounded-sm border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
          >
            {requirement.hardware_criteria}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductSpecification() {
  return (
    <div className="product-specification">
      <Header />
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
            <ClinicalVerdict />
          </div>
          <div className="sidebar lg:justify-self-end">
            <PerformanceCard />
            <RequiredInfrastructure />
          </div>
        </div>
      </div>
    </div>
  );
}
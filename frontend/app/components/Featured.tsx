"use client";

import Button from "../ui components/Button";
import { useRouter } from "next/navigation";

type CuratedBuild = {
  tier: "Low" | "Medium" | "High";
  budgetRange: string;
  targetUse: string;
  gpu: string;
  cpu: string;
  ram: string;
  storage: string;
  trainingCapability: string;
  buildCapability: string;
};

const featuredContent: CuratedBuild[] = [
  {
    tier: "Low",
    budgetRange: "$1,200 - $1,800",
    targetUse: "Entry local AI build for coding assistants and small image generation workflows.",
    gpu: "RTX 4060 Ti 16GB",
    cpu: "Ryzen 5 7600",
    ram: "32GB DDR5",
    storage: "1TB NVMe Gen4",
    trainingCapability: "Light LoRA and short fine-tuning runs on 7B class models.",
    buildCapability: "Reliable local inference for 7B models and fast dev-agent tasks.",
  },
  {
    tier: "Medium",
    budgetRange: "$2,200 - $3,200",
    targetUse: "Balanced workstation for product builders running multi-tool AI workflows.",
    gpu: "RTX 4080 Super 16GB",
    cpu: "Ryzen 9 7900",
    ram: "64GB DDR5",
    storage: "2TB NVMe Gen4",
    trainingCapability: "Regular adapter tuning and medium context experimentation on 7B to 14B models.",
    buildCapability: "Smooth local inference for 14B class models and parallel coding automation.",
  },
  {
    tier: "High",
    budgetRange: "$4,500 - $7,000",
    targetUse: "Power build for advanced RAG stacks, larger models, and serious local training.",
    gpu: "RTX 4090 24GB",
    cpu: "Ryzen 9 9950X",
    ram: "128GB DDR5",
    storage: "4TB NVMe Gen4",
    trainingCapability: "Longer fine-tuning sessions and higher batch experiments on 14B to 22B models.",
    buildCapability: "Strong local inference for 22B class models plus heavy multimodal pipelines.",
  },
];

export default function Featured() {
  const router = useRouter();

  return (
    <section className="featured w-full px-6 py-12">
      <div className="mb-7">
        <small className="uppercase tracking-[0.18em] text-muted-foreground">Curated AI Builds</small>
        <h3 className="mt-2 max-w-2xl tracking-tight">Three practical build paths by budget</h3>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Pick a low, medium, or high budget baseline with clear hardware targets and realistic AI training and build capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {featuredContent.map((card) => (
          <article key={card.tier} className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="font-semibold tracking-tight">{card.tier} Budget</h4>
              <small className="rounded-full font-secondary whitespace-nowrap border border-border bg-primary px-3 py-1 text-muted-foreground">{card.budgetRange}</small>
            </div>

            <p className="mb-4 text-muted-foreground">{card.targetUse}</p>

            <div className="font-secondary space-y-2 rounded-xl border border-border bg-primary p-2">
              <p>GPU: {card.gpu}</p>
              <p>CPU: {card.cpu}</p>
              <p>RAM: {card.ram}</p>
              <p>Storage: {card.storage}</p>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Training: {card.trainingCapability}</p>
              <p>Build capability: {card.buildCapability}</p>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 pt-5">
              <Button variant="secondary" className="bg-primary" onClick={() => router.push("/guild-builder")}>Tune This Build</Button>
              <Button variant="accent" onClick={() => router.push("/product-specification")}>View Spec</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export type WizardStepType = "single_select" | "multi_select" | "review";

export interface WizardOption {
  value: string;
  title?: string;
  name?: string;
  label?: string;
  sub?: string;
  badge?: string;
  note?: string;
  range?: string;
  range_min_inr?: number;
  range_max_inr?: number | null;
  vram_gb_min?: number;
  vram_label?: string;
  family?: string;
  recommended?: boolean;
  skip_precision?: boolean;
  hardware_implication?: string;
}

export interface WizardFamily {
  id: string;
  label: string;
  options: WizardOption[];
}

export interface WizardReviewField {
  key: string;
  label: string;
  highlight: boolean;
}

export interface WizardStep {
  step: number;
  id: string;
  label: string;
  question: string;
  question_dynamic?: string;
  question_note?: string;
  type: WizardStepType;
  required: boolean;
  skippable?: boolean;
  component: string;
  display_index?: string;
  hint?: string;
  max_selections?: number;
  default?: string;
  skip_precision_for?: string[];
  conditional?: {
    skip_if_model_in: Array<string | null>;
  };
  options?: WizardOption[];
  families?: WizardFamily[];
  review_fields?: WizardReviewField[];
  cta?: string;
}

export interface WizardConfig {
  wizard: {
    title: string;
    description: string;
    total_steps: number;
    steps: WizardStep[];
  };
}

export const wizardConfig: WizardConfig = {
  wizard: {
    title: "AI Rigs - Workstation Configurator",
    description: "AI-focused workstation configuration wizard",
    total_steps: 9,
    steps: [
      {
        step: 1,
        id: "task",
        label: "AI task",
        question: "What AI task are you building this workstation for?",
        type: "single_select",
        required: true,
        component: "OptionCard",
        options: [
          {
            value: "llm_inference",
            title: "Local LLM inference",
            sub: "Run Llama, Mistral, Qwen locally",
            badge: "VRAM-critical",
          },
          {
            value: "fine_tuning",
            title: "Fine-tuning",
            sub: "LoRA / QLoRA on your datasets",
            badge: "VRAM + NVMe",
          },
          {
            value: "training",
            title: "Training from scratch",
            sub: "Full model training runs",
            badge: "Multi-GPU",
          },
          {
            value: "image_gen",
            title: "Image & video gen",
            sub: "Stable Diffusion, FLUX, WAN",
            badge: "VRAM + storage",
          },
          {
            value: "ai_dev",
            title: "AI-assisted dev",
            sub: "Local coding models, Copilot",
            badge: "Balanced",
          },
          {
            value: "edge_deploy",
            title: "Edge deployment",
            sub: "Serving models, inference API",
            badge: "CPU + RAM",
          },
        ],
      },
      {
        step: 2,
        id: "model",
        label: "Target model",
        question:
          "Which model are you targeting? This sets the minimum VRAM floor.",
        question_dynamic:
          "You're building for {task_label}. Which model are you targeting?",
        type: "single_select",
        required: false,
        skippable: true,
        component: "ModelPicker",
        hint: "Select a model, or skip if unsure",
        skip_precision_for: ["sdxl", "flux", "wan", "custom"],
        families: [
          {
            id: "llama",
            label: "Meta Llama",
            options: [
              {
                value: "llama3-8b",
                name: "Llama 3.1 8B",
                vram_gb_min: 8,
                family: "llama",
              },
              {
                value: "llama3-13b",
                name: "Llama 3.1 13B",
                vram_gb_min: 16,
                family: "llama",
              },
              {
                value: "llama3-70b",
                name: "Llama 3.1 70B",
                vram_gb_min: 40,
                note: "Q4 quantized",
                family: "llama",
              },
            ],
          },
          {
            id: "mistral",
            label: "Mistral / Mixtral",
            options: [
              {
                value: "mistral-7b",
                name: "Mistral 7B",
                vram_gb_min: 8,
                family: "mistral",
              },
              {
                value: "mistral-22b",
                name: "Mistral 22B",
                vram_gb_min: 24,
                family: "mistral",
              },
              {
                value: "mixtral-8x7b",
                name: "Mixtral 8x7B",
                vram_gb_min: 48,
                family: "mistral",
              },
            ],
          },
          {
            id: "qwen",
            label: "Qwen 2.5",
            options: [
              {
                value: "qwen-7b",
                name: "Qwen 2.5 7B",
                vram_gb_min: 8,
                family: "qwen",
              },
              {
                value: "qwen-14b",
                name: "Qwen 2.5 14B",
                vram_gb_min: 16,
                family: "qwen",
              },
              {
                value: "qwen-72b",
                name: "Qwen 2.5 72B",
                vram_gb_min: 48,
                family: "qwen",
              },
            ],
          },
          {
            id: "image",
            label: "Image / video",
            options: [
              {
                value: "sdxl",
                name: "Stable Diffusion XL",
                vram_gb_min: 8,
                family: "image",
                skip_precision: true,
              },
              {
                value: "flux",
                name: "FLUX.1",
                vram_gb_min: 12,
                family: "image",
                skip_precision: true,
              },
              {
                value: "wan",
                name: "WAN 2.1 Video",
                vram_gb_min: 24,
                family: "image",
                skip_precision: true,
              },
            ],
          },
          {
            id: "other",
            label: "Other",
            options: [
              {
                value: "deepseek-33b",
                name: "DeepSeek 33B",
                vram_gb_min: 24,
                family: "other",
              },
              {
                value: "phi3",
                name: "Phi-3 Mini",
                vram_gb_min: 4,
                family: "other",
              },
              {
                value: "custom",
                name: "Not sure yet",
                vram_gb_min: 0,
                family: "other",
                skip_precision: true,
              },
            ],
          },
        ],
      },
      {
        step: 3,
        id: "precision",
        label: "Precision",
        display_index: "2b",
        question:
          "How will you run {model_name}? Precision level changes VRAM requirement dramatically.",
        type: "single_select",
        required: true,
        default: "q4",
        component: "PrecisionPicker",
        hint: "Q4 is recommended for most users",
        conditional: {
          skip_if_model_in: ["sdxl", "flux", "wan", "custom", null],
        },
        options: [
          {
            value: "fp16",
            name: "Full precision",
            vram_label: "FP16 / BF16",
            note: "Best quality, max VRAM",
            recommended: false,
          },
          {
            value: "q8",
            name: "Q8",
            vram_label: "~50% less VRAM",
            note: "Near-lossless",
            recommended: false,
          },
          {
            value: "q4",
            name: "Q4",
            vram_label: "~75% less VRAM",
            note: "Good balance for most",
            recommended: true,
          },
          {
            value: "auto",
            name: "Auto",
            vram_label: "-",
            note: "Build decides",
            recommended: false,
          },
        ],
      },
      {
        step: 4,
        id: "budget",
        label: "Investment range",
        display_index: "3",
        question: "What's your investment range?",
        question_dynamic:
          "What's your investment range? Your model needs >={vram_gb} GB VRAM minimum.",
        type: "single_select",
        required: true,
        component: "BudgetPicker",
        hint: "Select your budget range",
        options: [
          {
            value: "essentials",
            name: "Essentials",
            range: "INR 60K - INR 1L",
            range_min_inr: 60000,
            range_max_inr: 100000,
            note: "Entry VRAM, lighter models",
          },
          {
            value: "capable",
            name: "Capable",
            range: "INR 1L - INR 1.8L",
            range_min_inr: 100000,
            range_max_inr: 180000,
            note: "Mid-tier GPU, most 13B models",
          },
          {
            value: "serious",
            name: "Serious",
            range: "INR 1.8L - INR 3.5L",
            range_min_inr: 180000,
            range_max_inr: 350000,
            note: "RTX 4090, 70B Q4 territory",
          },
          {
            value: "unrestricted",
            name: "Unrestricted",
            range: "INR 3.5L+",
            range_min_inr: 350000,
            range_max_inr: null,
            note: "Multi-GPU, full precision",
          },
        ],
      },
      {
        step: 5,
        id: "intensity",
        label: "Usage intensity",
        display_index: "4",
        question: "How hard and how often will this machine run?",
        type: "single_select",
        required: true,
        component: "Pill",
        hint: "Select your usage pattern",
        options: [
          {
            value: "occasional",
            label: "Occasional",
            sub: "few hrs/week",
            hardware_implication: "Standard cooling",
          },
          {
            value: "daily",
            label: "Daily driver",
            sub: "regular research",
            hardware_implication: "Good airflow needed",
          },
          {
            value: "intensive",
            label: "Long training runs",
            sub: "hours of GPU load",
            hardware_implication: "Thermal headroom critical",
          },
          {
            value: "always_on",
            label: "Always-on server",
            sub: "24/7 inference",
            hardware_implication: "ECC RAM + oversized PSU",
          },
        ],
      },
      {
        step: 6,
        id: "priorities",
        label: "Priorities",
        display_index: "5",
        question: "What should the build optimise for?",
        type: "multi_select",
        required: true,
        max_selections: 3,
        component: "Pill",
        hint: "Select up to three priorities",
        options: [
          {
            value: "max_vram",
            label: "Max VRAM",
          },
          {
            value: "speed",
            label: "Fastest inference",
          },
          {
            value: "silent",
            label: "Silent operation",
          },
          {
            value: "future",
            label: "Future model upgrades",
          },
          {
            value: "value",
            label: "Value per rupee",
          },
          {
            value: "power",
            label: "Power efficiency",
          },
          {
            value: "multigpu",
            label: "Multi-GPU scalability",
          },
        ],
      },
      {
        step: 7,
        id: "brand",
        label: "GPU preference",
        display_index: "6",
        question: "Any GPU ecosystem preference?",
        question_note: "NVIDIA has the strongest CUDA support for AI.",
        type: "single_select",
        required: false,
        skippable: true,
        component: "Pill",
        hint: "Select preference, or skip",
        options: [
          {
            value: "nvidia",
            label: "NVIDIA",
            sub: "CUDA · recommended for AI",
            recommended: true,
          },
          {
            value: "amd",
            label: "AMD",
            sub: "ROCm · better VRAM/INR",
            recommended: false,
          },
          {
            value: "open",
            label: "No preference",
            sub: "optimise for budget",
            recommended: false,
          },
        ],
      },
      {
        step: 8,
        id: "expand",
        label: "Expandability",
        display_index: "7",
        question: "How much should the platform plan for the future?",
        type: "single_select",
        required: true,
        component: "Pill",
        hint: "Select your upgrade path",
        options: [
          {
            value: "fixed",
            label: "Fixed build",
            sub: "optimise for now",
            hardware_implication: "Standard ATX, 2 DIMM slots OK",
          },
          {
            value: "ram",
            label: "RAM headroom",
            sub: "free DIMM slots",
            hardware_implication: "Motherboard must have 4x DIMM minimum",
          },
          {
            value: "gpu2",
            label: "Second GPU later",
            sub: "PCIe + PSU room",
            hardware_implication: "Board needs 2x PCIe x16, PSU 1000W+",
          },
          {
            value: "hedt",
            label: "Maximum headroom",
            sub: "HEDT / Threadripper",
            hardware_implication:
              "Threadripper / EPYC platform, 8+ DIMM, multi PCIe",
          },
        ],
      },
      {
        step: 9,
        id: "review",
        label: "Review & generate",
        display_index: "9",
        question: "Everything looks good. Here's your configuration summary.",
        type: "review",
        required: false,
        component: "ReviewPanel",
        hint: "Review your configuration below",
        review_fields: [
          { key: "task", label: "AI task", highlight: false },
          { key: "modelName", label: "Target model", highlight: true },
          { key: "precision", label: "Precision", highlight: false },
          { key: "modelVram", label: "VRAM floor", highlight: true },
          { key: "budget", label: "Investment", highlight: false },
          { key: "intensity", label: "Usage intensity", highlight: false },
          { key: "priorities", label: "Priorities", highlight: false },
          { key: "brand", label: "GPU preference", highlight: false },
          { key: "expand", label: "Expandability", highlight: false },
        ],
        cta: "Generate my AI rig ->",
      },
    ],
  },
};

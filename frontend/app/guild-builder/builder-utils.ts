import type { WizardOption, WizardStep } from "./types/wizard-steps";

const precisionMultiplier: Record<string, number> = {
  fp16: 1,
  q8: 0.5,
  q4: 0.25,
  auto: 0.4,
};

const stepNameById: Record<string, string> = {
  task: "AI Task",
  model: "Target Model",
  precision: "Model Precision",
  budget: "Investment Range",
  intensity: "Usage Intensity",
  priorities: "Build Priorities",
  brand: "GPU Preference",
  expand: "Expandability Plan",
  review: "Review & Generate",
};

export function getOptionTitle(option: WizardOption) {
  return option.title ?? option.name ?? option.label ?? option.value;
}

export function interpolate(text: string, values: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function calculateVramFloor(
  baseVram: number,
  precision: string | undefined,
  skipPrecision: boolean,
) {
  if (skipPrecision) return Math.max(0, Math.ceil(baseVram));
  const multiplier =
    precisionMultiplier[precision ?? "q4"] ?? precisionMultiplier.q4;
  return Math.max(0, Math.ceil(baseVram * multiplier));
}

export function isSingleSelectStep(step: WizardStep) {
  return step.type === "single_select";
}

export function getStepById(steps: WizardStep[], stepId: string) {
  return steps.find((step) => step.id === stepId);
}

export function findStepOption(
  step: WizardStep | undefined,
  value?: string | null,
) {
  if (!step?.options || !value) return undefined;
  return step.options.find((option) => option.value === value);
}

export function findOption(options: WizardOption[], value?: string | null) {
  if (!value) return undefined;
  return options.find((option) => option.value === value);
}

export function getStepDisplayName(step: WizardStep) {
  return stepNameById[step.id] ?? step.label ?? step.id;
}

export function getSelectedValueForSingleStep(
  stepId: string,
  answers: {
    aiTask?: string;
    modelPrecision?: string;
    investmentRange?: string;
    usageIntensity?: string;
    gpuPreference?: string | null;
    expandabilityPlan?: string;
  },
) {
  switch (stepId) {
    case "task":
      return answers.aiTask;
    case "precision":
      return answers.modelPrecision;
    case "budget":
      return answers.investmentRange;
    case "intensity":
      return answers.usageIntensity;
    case "brand":
      return answers.gpuPreference;
    case "expand":
      return answers.expandabilityPlan;
    default:
      return undefined;
  }
}

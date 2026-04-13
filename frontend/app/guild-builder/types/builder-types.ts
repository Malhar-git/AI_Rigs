export type WizardAnswers = {
  aiTask?: string;
  targetModel?: string | null;
  modelPrecision?: string;
  investmentRange?: string;
  usageIntensity?: string;
  buildPriorities: string[];
  gpuPreference?: string | null;
  expandabilityPlan?: string;
};

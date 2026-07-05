import type { WizardAnswers } from "@/app/guild-builder/types/builder-types";
import type { WizardAnswersDTO } from "./types";

// Values the caller derives from useBuilderFlow (not present in the raw answers):
//   - modelName:   the readable model name, e.g. "Llama 3.1 70B" (answers only has the slug)
//   - modelVramGb: the VRAM floor after precision (flow's resolvedVramFloor)
//   - sessionId:   a client-generated id so a user's builds group together
export type BuildContext = {
  modelName?: string;
  modelVramGb?: number;
  sessionId?: string;
};

// Translates the wizard's frontend-shaped answers into the backend's WizardAnswersDTO.
// Every enum value already matches the backend (verified against BuildService's budget
// map + BuildPromptBuilder's label switches), so this is pure field renaming — no value
// transforms. budgetMin/budgetMax are intentionally omitted; the backend derives them
// from budgetTier.
export function mapAnswersToDTO(
  answers: WizardAnswers,
  ctx: BuildContext = {},
): WizardAnswersDTO {
  return {
    // required — the wizard's required steps guarantee these are set before Generate
    task: answers.aiTask ?? "",
    budgetTier: answers.investmentRange ?? "",
    intensity: answers.usageIntensity ?? "",
    expand: answers.expandabilityPlan ?? "",

    // optional — passed straight through
    precision: answers.modelPrecision,
    priorities: answers.buildPriorities,
    brand: answers.gpuPreference ?? undefined, // null = "skipped" → omit from JSON

    // derived — supplied by the page from useBuilderFlow
    modelName: ctx.modelName,
    modelVramGb: ctx.modelVramGb,
    sessionId: ctx.sessionId,
  };
}

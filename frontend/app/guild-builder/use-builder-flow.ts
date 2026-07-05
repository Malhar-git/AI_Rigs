"use client";

import { useMemo, useState } from "react";
import type { WizardStep } from "./types/wizard-steps";
import { wizardConfig } from "./types/wizard-steps";
import type { WizardAnswers } from "./types/builder-types";
import {
  calculateVramFloor,
  findOption,
  findStepOption,
  getOptionTitle,
  getStepById,
  interpolate,
} from "./builder-utils";

export function useBuilderFlow() {
  const steps = wizardConfig.wizard.steps;
  const taskStep = getStepById(steps, "task");
  const modelStep = getStepById(steps, "model");
  const precisionStep = getStepById(steps, "precision");
  const budgetStep = getStepById(steps, "budget");
  const intensityStep = getStepById(steps, "intensity");
  const prioritiesStep = getStepById(steps, "priorities");
  const brandStep = getStepById(steps, "brand");
  const expandStep = getStepById(steps, "expand");
  const reviewStep = getStepById(steps, "review");
  const defaultPrecision = precisionStep?.default ?? "q4";

  const [answers, setAnswers] = useState<WizardAnswers>({
    buildPriorities: [],
    modelPrecision: defaultPrecision,
  });
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const modelOptions = useMemo(
    () => modelStep?.families?.flatMap((family) => family.options) ?? [],
    [modelStep],
  );
  const selectedTask = findStepOption(taskStep, answers.aiTask);
  const selectedModel = findOption(modelOptions, answers.targetModel);
  const selectedBudget = findStepOption(budgetStep, answers.investmentRange);
  const selectedIntensity = findStepOption(
    intensityStep,
    answers.usageIntensity,
  );
  const selectedPrecision = findStepOption(
    precisionStep,
    answers.modelPrecision,
  );
  const selectedBrand = findStepOption(brandStep, answers.gpuPreference);
  const selectedExpand = findStepOption(expandStep, answers.expandabilityPlan);

  const precisionSkipSet = new Set(
    (precisionStep?.conditional?.skip_if_model_in ?? []).filter(
      (item): item is string => typeof item === "string",
    ),
  );

  const shouldSkipPrecision =
    !answers.targetModel || precisionSkipSet.has(answers.targetModel);
  const baseModelVram = selectedModel?.vram_gb_min ?? 0;
  const resolvedVramFloor = calculateVramFloor(
    baseModelVram,
    answers.modelPrecision,
    shouldSkipPrecision,
  );

  const visibleSteps = steps.filter(
    (step) => step.id !== "precision" || !shouldSkipPrecision,
  );
  const safeStepIndex = Math.min(
    activeStepIndex,
    Math.max(visibleSteps.length - 1, 0),
  );
  const currentStep = visibleSteps[safeStepIndex] ?? visibleSteps[0];
  const isReviewStep = currentStep?.type === "review";
  const progressPercent =
    visibleSteps.length > 0
      ? ((safeStepIndex + 1) / visibleSteps.length) * 100
      : 0;

  const resolveQuestion = (step: WizardStep) => {
    if (step.id === "model" && step.question_dynamic) {
      return interpolate(step.question_dynamic, {
        task_label: selectedTask
          ? getOptionTitle(selectedTask)
          : "your selected task",
      });
    }

    if (step.id === "precision") {
      return interpolate(step.question, {
        model_name: selectedModel
          ? getOptionTitle(selectedModel)
          : "this model",
      });
    }

    if (step.id === "budget" && step.question_dynamic) {
      return interpolate(step.question_dynamic, {
        vram_gb: String(resolvedVramFloor),
      });
    }

    return step.question;
  };

  const isStepAnswered = (step: WizardStep) => {
    if (step.id === "precision" && shouldSkipPrecision) return true;

    switch (step.id) {
      case "task":
        return Boolean(answers.aiTask);
      case "model":
        return Boolean(answers.targetModel);
      case "precision":
        return Boolean(answers.modelPrecision);
      case "budget":
        return Boolean(answers.investmentRange);
      case "intensity":
        return Boolean(answers.usageIntensity);
      case "priorities":
        return answers.buildPriorities.length > 0;
      case "brand":
        return Boolean(answers.gpuPreference);
      case "expand":
        return Boolean(answers.expandabilityPlan);
      case "review":
        return true;
      default:
        return false;
    }
  };

  const canProceed = !currentStep.required || isStepAnswered(currentStep);
  const isLastStep = safeStepIndex === visibleSteps.length - 1;

  const setSingleAnswer = (stepId: string, value: string) => {
    setAnswers((prev) => {
      switch (stepId) {
        case "task":
          return { ...prev, aiTask: value };
        case "model":
          return { ...prev, targetModel: value };
        case "precision":
          return { ...prev, modelPrecision: value };
        case "budget":
          return { ...prev, investmentRange: value };
        case "intensity":
          return { ...prev, usageIntensity: value };
        case "brand":
          return { ...prev, gpuPreference: value };
        case "expand":
          return { ...prev, expandabilityPlan: value };
        default:
          return prev;
      }
    });
  };

  const togglePriority = (value: string, maxSelections = 3) => {
    setAnswers((prev) => {
      const isSelected = prev.buildPriorities.includes(value);
      if (isSelected) {
        return {
          ...prev,
          buildPriorities: prev.buildPriorities.filter(
            (item) => item !== value,
          ),
        };
      }

      if (prev.buildPriorities.length >= maxSelections) {
        return prev;
      }

      return { ...prev, buildPriorities: [...prev.buildPriorities, value] };
    });
  };

  const onSkipCurrentStep = () => {
    if (!currentStep.skippable) return;

    if (currentStep.id === "model") {
      setAnswers((prev) => ({ ...prev, targetModel: null }));
    }

    if (currentStep.id === "brand") {
      setAnswers((prev) => ({ ...prev, gpuPreference: null }));
    }

    setActiveStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const goBack = () => setActiveStepIndex((prev) => Math.max(prev - 1, 0));

  const goNext = () => {
    if (!canProceed) return;
    setActiveStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const reviewValues: Record<string, string> = {
    task: selectedTask ? getOptionTitle(selectedTask) : "Not selected",
    modelName: selectedModel ? getOptionTitle(selectedModel) : "Not selected",
    precision: shouldSkipPrecision
      ? "Skipped"
      : selectedPrecision
        ? getOptionTitle(selectedPrecision)
        : "Not selected",
    modelVram: `${resolvedVramFloor} GB minimum`,
    budget: selectedBudget
      ? `${getOptionTitle(selectedBudget)}${selectedBudget.range ? ` (${selectedBudget.range})` : ""}`
      : "Not selected",
    intensity: selectedIntensity
      ? getOptionTitle(selectedIntensity)
      : "Not selected",
    priorities:
      answers.buildPriorities.length > 0
        ? answers.buildPriorities
            .map((value) => {
              const option = findStepOption(prioritiesStep, value);
              return option ? getOptionTitle(option) : value;
            })
            .join(", ")
        : "Not selected",
    brand: selectedBrand
      ? getOptionTitle(selectedBrand)
      : "No preference selected",
    expand: selectedExpand ? getOptionTitle(selectedExpand) : "Not selected",
  };

  return {
    steps,
    answers,
    currentStep,
    visibleSteps,
    safeStepIndex,
    isReviewStep,
    reviewStep,
    progressPercent,
    canProceed,
    isLastStep,
    reviewValues,
    // derived model info the page passes into the answers-mapper context
    selectedModel,
    resolvedVramFloor,
    resolveQuestion,
    setSingleAnswer,
    togglePriority,
    onSkipCurrentStep,
    goBack,
    goNext,
  };
}

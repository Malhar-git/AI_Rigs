import OptionCard from "../../ui components/OptionCard";
import type { WizardAnswers } from "../types/builder-types";
import { getOptionTitle, getSelectedValueForSingleStep } from "../builder-utils";
import type { WizardStep } from "../types/wizard-steps";

type BuilderStepContentProps = {
  step: WizardStep;
  answers: WizardAnswers;
  reviewStep?: WizardStep;
  reviewValues: Record<string, string>;
  onSetSingleAnswer: (stepId: string, value: string) => void;
  onTogglePriority: (value: string, maxSelections?: number) => void;
};

function SingleSelectStep({
  step,
  answers,
  onSetSingleAnswer,
}: Pick<BuilderStepContentProps, "step" | "answers" | "onSetSingleAnswer">) {
  if (step.id === "model" && step.families) {
    return (
      <div className="space-y-6">
        {step.families.map((family) => (
          <section key={family.id}>
            <p className="mb-2 font-secondary text-sm uppercase tracking-wide text-secondary">{family.label}</p>
            <div className="grid gap-2 md:grid-cols-3">
              {family.options.map((option) => {
                const selected = answers.targetModel === option.value;
                return (
                  <OptionCard
                    key={option.value}
                    title={getOptionTitle(option)}
                    sub={option.vram_gb_min ? `VRAM floor: ${option.vram_gb_min} GB` : option.sub}
                    badge={option.note}
                    selected={selected}
                    onClick={() => onSetSingleAnswer(step.id, option.value)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const selectedValue = getSelectedValueForSingleStep(step.id, answers);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {step.options?.map((option) => {
        const isSelected = selectedValue === option.value;
        const title = getOptionTitle(option);
        const sub =
          step.id === "budget"
            ? option.range
            : step.id === "precision"
              ? option.vram_label
              : option.sub;
        const badge =
          step.id === "budget"
            ? option.note
            : step.id === "precision"
              ? option.note
              : option.badge ?? option.hardware_implication;

        return (
          <OptionCard
            key={option.value}
            title={title}
            sub={sub}
            badge={badge}
            selected={isSelected}
            onClick={() => onSetSingleAnswer(step.id, option.value)}
          />
        );
      })}
    </div>
  );
}

function MultiSelectStep({
  step,
  answers,
  onTogglePriority,
}: Pick<BuilderStepContentProps, "step" | "answers" | "onTogglePriority">) {
  const maxSelections = step.max_selections ?? 3;
  const canSelectMore = answers.buildPriorities.length < maxSelections;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {step.options?.map((option) => {
          const selected = answers.buildPriorities.includes(option.value);
          const shouldDisable = !selected && !canSelectMore;

          return (
            <button
              key={option.value}
              type="button"
              disabled={shouldDisable}
              onClick={() => onTogglePriority(option.value, maxSelections)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition-colors",
                selected
                  ? "border-secondary bg-foreground text-background"
                  : "border-border bg-background text-secondary hover:bg-muted",
                shouldDisable ? "cursor-not-allowed opacity-40" : "cursor-pointer",
              ].join(" ")}
            >
              {getOptionTitle(option)}
            </button>
          );
        })}
      </div>
      <small className="text-secondary">
        {answers.buildPriorities.length}/{maxSelections} selected
      </small>
    </div>
  );
}

function ReviewStep({
  reviewStep,
  reviewValues,
}: Pick<BuilderStepContentProps, "reviewStep" | "reviewValues">) {
  if (!reviewStep?.review_fields) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/60 p-4">
      {reviewStep.review_fields.map((field) => (
        <div
          key={field.key}
          className={[
            "flex items-center justify-between rounded-lg border border-transparent px-3 py-2",
            field.highlight ? "bg-background border-border" : "bg-transparent",
          ].join(" ")}
        >
          <small className="uppercase tracking-wide text-secondary">{field.label}</small>
          <p className="text-right text-foreground">{reviewValues[field.key] ?? "-"}</p>
        </div>
      ))}
    </div>
  );
}

export default function BuilderStepContent({
  step,
  answers,
  reviewStep,
  reviewValues,
  onSetSingleAnswer,
  onTogglePriority,
}: BuilderStepContentProps) {
  if (step.type === "single_select") {
    return <SingleSelectStep step={step} answers={answers} onSetSingleAnswer={onSetSingleAnswer} />;
  }

  if (step.type === "multi_select") {
    return <MultiSelectStep step={step} answers={answers} onTogglePriority={onTogglePriority} />;
  }

  return <ReviewStep reviewStep={reviewStep} reviewValues={reviewValues} />;
}

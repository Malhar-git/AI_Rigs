"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui components/Button";
import PageShell from "../components/PageShell";
import { ProgressBar } from "../ui components/ProgressBar";
import BuilderSidebar from "./blocks/BuilderSidebar";
import BuilderStepContent from "./blocks/BuilderStepContent";
import ConversationStep from "./blocks/ConversationStep";
import { useBuilderFlow } from "./use-builder-flow";
import { wizardConfig } from "./types/wizard-steps";
import { createBuild } from "@/lib/builds";
import { mapAnswersToDTO } from "@/lib/answers-mapper";

// One session id per browser, reused across builds so a user's builds group together.
function getOrCreateSessionId(): string {
  const KEY = "airigs_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function Builder() {
  const router = useRouter();

  const {
    answers,
    currentStep,
    visibleSteps,
    safeStepIndex,
    reviewStep,
    reviewValues,
    progressPercent,
    canProceed,
    isLastStep,
    resolveQuestion,
    setSingleAnswer,
    togglePriority,
    onSkipCurrentStep,
    goBack,
    goNext,
    selectedModel,
    resolvedVramFloor,
  } = useBuilderFlow();
  const renderedSteps = visibleSteps.slice(0, safeStepIndex + 1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const dto = mapAnswersToDTO(answers, {
        modelName: selectedModel?.name,
        modelVramGb: resolvedVramFloor,
        sessionId: getOrCreateSessionId(),
      });
      const build = await createBuild(dto);
      // hand the result to the results page via the URL (shareable, refresh-safe)
      router.push(`/rig-overview?id=${build.buildId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating your build. Please try again.",
      );
      setIsGenerating(false); // on success we navigate away, so only reset on failure
    }
  };

  return (
    <PageShell width="wide">
      <div className="grid min-h-[72vh] grid-cols-1 divide-y md:grid-cols-[20%_80%] md:divide-x md:divide-y-0">
        <aside className="px-0 py-8 mt-14">
          <BuilderSidebar visibleSteps={visibleSteps} activeStepIndex={safeStepIndex} />
        </aside>

        <main className="px-4 pt-8 md:px-10">
          <section className="mx-auto mb-8 w-full">
            <small className="uppercase tracking-[0.18em] text-secondary">{wizardConfig.wizard.description}</small>
            <ProgressBar value={progressPercent} variant="neutral" showAnimation className="mt-3 max-w-md" />
          </section>

          <section className="mx-auto w-full space-y-5">
            {renderedSteps.map((step, index) => {
              const isCurrent = index === safeStepIndex;
              return (
                <ConversationStep
                  key={step.id}
                  question={resolveQuestion(step)}
                  questionNote={step.question_note}
                  hint={step.hint}
                  locked={!isCurrent}
                  scrollOnMount={isCurrent && safeStepIndex > 0}
                >
                  <BuilderStepContent
                    step={step}
                    answers={answers}
                    reviewStep={reviewStep}
                    reviewValues={reviewValues}
                    onSetSingleAnswer={setSingleAnswer}
                    onTogglePriority={togglePriority}
                  />
                </ConversationStep>
              );
            })}
          </section>

          <div className="mx-auto mt-12 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-border bg-muted/70 px-4 py-3 md:px-5">
              <Button variant="secondary" onClick={goBack} disabled={safeStepIndex === 0}>
                Back
              </Button>

              <div className="flex items-center gap-2">
                {currentStep.skippable ? (
                  <Button variant="ghost" onClick={onSkipCurrentStep}>
                    Skip
                  </Button>
                ) : null}

                {!isLastStep ? (
                  <Button onClick={goNext} disabled={!canProceed}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? "Generating…" : (reviewStep?.cta ?? "Generate")}
                  </Button>
                )}
              </div>
            </div>

            {error ? (
              <p className="mt-2 px-4 text-sm text-red-500 md:px-5">{error}</p>
            ) : null}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
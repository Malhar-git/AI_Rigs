"use client";

import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Button from "../ui components/Button";
import { ProgressBar } from "../ui components/ProgressBar";
import BuilderSidebar from "./blocks/BuilderSidebar";
import BuilderStepContent from "./blocks/BuilderStepContent";
import ConversationStep from "./blocks/ConversationStep";
import { useBuilderFlow } from "./use-builder-flow";
import { wizardConfig } from "./types/wizard-steps";

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
  } = useBuilderFlow();
  const renderedSteps = visibleSteps.slice(0, safeStepIndex + 1);

  return (
    <>
      <Header />
      <div className="grid min-h-[72vh] grid-cols-1 divide-y md:grid-cols-[20%_80%] md:divide-x md:divide-y-0">
        <aside className="px-0 py-8 mt-14">
          <BuilderSidebar visibleSteps={visibleSteps} activeStepIndex={safeStepIndex} />
        </aside>

        <main className="px-4 pt-8 md:px-10">
          <section className="mx-auto mb-8 w-full max-w-5xl">
            <small className="uppercase tracking-[0.18em] text-secondary">{wizardConfig.wizard.description}</small>
            <ProgressBar value={progressPercent} variant="neutral" showAnimation className="mt-3 max-w-md" />
          </section>

          <section className="mx-auto w-full max-w-5xl space-y-5">
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

          <div className="mx-auto mt-12 w-full max-w-4xl ml-2">
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
                  <Button onClick={() => router.push("/product-specification")}>{reviewStep?.cta ?? "Generate"}</Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
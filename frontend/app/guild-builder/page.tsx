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

        <main className="px-6 py-8 md:px-10">
          <section className="mb-8">
            <small className="uppercase tracking-[0.18em] text-secondary">{wizardConfig.wizard.description}</small>
            <ProgressBar value={progressPercent} variant="neutral" showAnimation className="mt-3 max-w-md" />
          </section>

          <section className="space-y-5">
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

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={goBack} disabled={safeStepIndex === 0}>
              Back
            </Button>

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
        </main>
      </div>
      <Footer />
    </>
  );
}
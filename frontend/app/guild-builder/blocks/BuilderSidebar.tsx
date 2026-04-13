import { getStepDisplayName } from "../builder-utils";
import type { WizardStep } from "../types/wizard-steps";

type BuilderSidebarProps = {
  visibleSteps: WizardStep[];
  activeStepIndex: number;
};

export default function BuilderSidebar({ visibleSteps, activeStepIndex }: BuilderSidebarProps) {
  return (
    <nav aria-label="Builder steps" className="space-y-2">
      {visibleSteps.map((step, index) => {
        const isActive = index === activeStepIndex;
        const isComplete = index < activeStepIndex;

        return (
          <div key={step.id} className={["flex p-1.5", isActive ? "bg-secondary" : ""].join(" ")}>
            <div className="ml-6 flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                  isActive
                    ? "border-black text-zinc-900"
                    : isComplete
                      ? "border-zinc-700 bg-zinc-700 text-white"
                      : "border-secondary/30 text-zinc-400",
                ].join(" ")}
              >
                {isComplete ? "✓" : step.display_index ?? String(step.step)}
              </div>
              <p className={["text-md leading-none tracking-tight", isActive ? "text-zinc-900" : "text-zinc-500"].join(" ")}>
                {getStepDisplayName(step)}
              </p>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

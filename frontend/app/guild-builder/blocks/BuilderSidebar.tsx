import { getStepDisplayName } from "../builder-utils";
import type { WizardStep } from "../types/wizard-steps";
import { CheckIcon } from "@/app/ui-components/OptionCard";

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
          <div key={step.id} className={["flex p-1.5", isActive ? "bg-secondary/15" : ""].join(" ")}>
            <div className="ml-6 flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs"
                ].join(" ")}
              >
                {isComplete ? <CheckIcon /> : step.display_index ?? String(step.step)}
              </div>
              <p className={["text-md leading-none tracking-tight", isActive ? "`text`-(--text-primary)" : "text-(--text-secondary)"].join(" ")}>
                {getStepDisplayName(step)}
              </p>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ConversationStepProps = {
  question: string;
  questionNote?: string;
  hint?: string;
  locked?: boolean;
  scrollOnMount?: boolean;
  children: ReactNode;
};

export default function ConversationStep({
  question,
  questionNote,
  hint,
  locked = false,
  scrollOnMount = false,
  children,
}: ConversationStepProps) {
  const stepRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!scrollOnMount || !stepRef.current) return;
    stepRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [scrollOnMount]);

  return (
    <article
      ref={stepRef}
      className={[
        "wizard-rise rounded-2xl border p-4 md:p-5",
        locked ? "border-border/70 bg-muted/50" : "border-border bg-card",
      ].join(" ")}
    >
      <div>
        <h4 className="mb-2">{question}</h4>
        {questionNote ? <small className="block text-secondary">{questionNote}</small> : null}
        {hint ? <small className="mt-1 block uppercase tracking-wide text-secondary">{hint}</small> : null}
      </div>

      <div className={locked ? "mt-4 pointer-events-none opacity-80" : "mt-4"}>{children}</div>
    </article>
  );
}

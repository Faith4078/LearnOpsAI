"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FailedStage, PipelineStage } from "@/lib/types";

type StepStatus = "complete" | "active" | "error" | "pending" | "disabled";

interface TimelineStep {
  label: string;
  status: StepStatus;
}

interface AgentTimelineProps {
  stage: PipelineStage;
  failedStage: FailedStage | null;
}

function buildSteps(
  stage: PipelineStage,
  failedStage: AgentTimelineProps["failedStage"],
): TimelineStep[] {
  const reviewed =
    stage === "done" ||
    stage === "publishing" ||
    stage === "published" ||
    (stage === "error" && failedStage === "publishing");

  const generator: StepStatus =
    stage === "generating"
      ? "active"
      : stage === "error" && failedStage === "generating"
        ? "error"
        : stage === "reviewing" || reviewed
          ? "complete"
          : "pending";

  const reviewer: StepStatus =
    stage === "reviewing"
      ? "active"
      : stage === "error" && failedStage === "reviewing"
        ? "error"
        : reviewed
          ? "complete"
          : "pending";

  const publishing: StepStatus =
    stage === "publishing"
      ? "active"
      : stage === "error" && failedStage === "publishing"
        ? "error"
        : stage === "published"
          ? "complete"
          : stage === "done"
            ? "pending"
            : "disabled";

  const helpCenter: StepStatus =
    stage === "published"
      ? "complete"
      : stage === "done" || stage === "publishing"
        ? "pending"
        : "disabled";

  return [
    { label: "Documentation Uploaded", status: "complete" },
    { label: "Generator Agent", status: generator },
    { label: "Review Agent", status: reviewer },
    { label: "Publishing", status: publishing },
    { label: "Help Center Updated", status: helpCenter },
  ];
}

const STATUS_TEXT: Record<StepStatus, string> = {
  complete: "Complete",
  active: "In progress",
  error: "Failed",
  pending: "Waiting",
  disabled: "Upcoming",
};

function StepIndicator({ status }: { status: StepStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
        status === "complete" && "border-foreground bg-foreground",
        status === "active" && "border-foreground bg-background",
        status === "error" && "border-destructive bg-background",
        (status === "pending" || status === "disabled") &&
          "border-border bg-background",
      )}
    >
      {status === "complete" && (
        <Check
          className="size-3.5 text-background animate-in zoom-in-50 fade-in duration-500"
          strokeWidth={2.5}
        />
      )}
      {status === "active" && (
        <LoaderCircle className="size-3.5 animate-spin text-foreground" />
      )}
      {status === "error" && (
        <CircleAlert className="size-3.5 text-destructive" />
      )}
      {(status === "pending" || status === "disabled") && (
        <span className="size-1.5 rounded-full bg-border" />
      )}
    </span>
  );
}

/**
 * The agent pipeline rendered as a horizontal timeline. Each step's
 * indicator and connector animate subtly as the run progresses —
 * restrained, enterprise-feel transitions, no celebration effects.
 */
export function AgentTimeline({ stage, failedStage }: AgentTimelineProps) {
  const steps = buildSteps(stage, failedStage);

  return (
    <section aria-label="Agent pipeline" className="rounded-lg border bg-card p-6">
      <ol className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.status === "active" ? "step" : undefined}
            className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
          >
            <div className="flex items-center gap-3 sm:w-full sm:gap-0">
              {/* Left connector (desktop) */}
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-px flex-1 transition-colors duration-700 sm:block",
                  index === 0
                    ? "bg-transparent"
                    : step.status === "complete" ||
                        step.status === "active" ||
                        step.status === "error"
                      ? "bg-foreground/60"
                      : "bg-border",
                )}
              />
              <StepIndicator status={step.status} />
              {/* Right connector (desktop) */}
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-px flex-1 transition-colors duration-700 sm:block",
                  index === steps.length - 1
                    ? "bg-transparent"
                    : step.status === "complete"
                      ? "bg-foreground/60"
                      : "bg-border",
                )}
              />
            </div>
            <div
              className={cn(
                "grid gap-0.5 transition-opacity duration-500",
                step.status === "disabled" && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  step.status === "pending" || step.status === "disabled"
                    ? "text-muted-foreground"
                    : step.status === "error"
                      ? "text-destructive"
                      : "text-foreground",
                )}
              >
                {step.label}
              </span>
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  step.status === "active" && "animate-pulse",
                )}
                role={step.status === "active" ? "status" : undefined}
              >
                {STATUS_TEXT[step.status]}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

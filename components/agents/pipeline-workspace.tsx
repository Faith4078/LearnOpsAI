"use client";

import { AgentTimeline } from "@/components/agents/agent-timeline";
import { PublishCard } from "@/components/agents/publish-card";
import { GenerationSkeleton } from "@/components/agents/generation-skeleton";
import { ResultCards } from "@/components/agents/result-cards";
import { DocumentationForm } from "@/components/upload/documentation-form";
import { useContentGeneration } from "@/hooks/use-content-generation";

const STAGE_MESSAGES = {
  generating: "Generator Agent is writing your article, FAQs, and quiz…",
  reviewing: "Review Agent is polishing the bundle for clarity and quality…",
} as const;

/**
 * Client workspace for the full content pipeline: paste form →
 * Generator Agent → Review Agent, with the Agent Timeline tracking
 * progress and result cards showing the reviewed bundle.
 */
export function PipelineWorkspace() {
  const {
    bundle,
    stage,
    failedStage,
    publishedSlug,
    isGenerating,
    generate,
    publish,
  } = useContentGeneration();

  const isPublishableStage =
    stage === "done" ||
    stage === "publishing" ||
    stage === "published" ||
    (stage === "error" && failedStage === "publishing");

  return (
    <div className="grid gap-10">
      <DocumentationForm
        isGenerating={isGenerating}
        onSubmitDocumentation={generate}
      />
      {stage !== "idle" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AgentTimeline stage={stage} failedStage={failedStage} />
        </div>
      )}
      {isGenerating && (
        <GenerationSkeleton
          message={
            stage === "reviewing"
              ? STAGE_MESSAGES.reviewing
              : STAGE_MESSAGES.generating
          }
        />
      )}
      {isPublishableStage && bundle !== null && (
        <div className="grid gap-10 animate-in fade-in duration-500">
          <PublishCard
            stage={stage}
            publishedSlug={publishedSlug}
            onPublish={publish}
          />
          <ResultCards bundle={bundle} />
        </div>
      )}
    </div>
  );
}

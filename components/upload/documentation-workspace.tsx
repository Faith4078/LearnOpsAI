"use client";

import { GenerationSkeleton } from "@/components/agents/generation-skeleton";
import { ResultCards } from "@/components/agents/result-cards";
import { DocumentationForm } from "@/components/upload/documentation-form";
import { useContentGeneration } from "@/hooks/use-content-generation";

/** Client workspace tying the paste form to the Generator Agent and its results. */
export function DocumentationWorkspace() {
  const { bundle, isGenerating, generate } = useContentGeneration();

  return (
    <div className="grid gap-10">
      <DocumentationForm
        isGenerating={isGenerating}
        onSubmitDocumentation={generate}
      />
      {isGenerating && <GenerationSkeleton />}
      {!isGenerating && bundle !== null && <ResultCards bundle={bundle} />}
    </div>
  );
}

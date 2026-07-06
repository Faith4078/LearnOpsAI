"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateContent } from "@/actions/generate-content";
import { publishToSanity } from "@/actions/publish-to-sanity";
import { reviewContent } from "@/actions/review-content";
import type { ContentBundle, FailedStage, PipelineStage } from "@/lib/types";

export interface ContentGeneration {
  /** The reviewed, publish-ready bundle. Null until a run completes. */
  bundle: ContentBundle | null;
  /** Which pipeline stage the current run is in. */
  stage: PipelineStage;
  /** When `stage` is "error", the stage that failed. Null otherwise. */
  failedStage: FailedStage | null;
  /** The published article's final slug. Null until published. */
  publishedSlug: string | null;
  /** True while either AI call is in flight. */
  isGenerating: boolean;
  /** Kick off a full run: Generator Agent, then Review Agent. */
  generate: (documentation: string) => void;
  /** Publish the reviewed bundle to Sanity. Only valid when stage is "done". */
  publish: () => void;
}

/**
 * Client-side orchestration of the content pipeline: exactly two
 * sequential AI calls per run (generate → review), then an operator-
 * triggered publish to Sanity. Stage tracking drives the Agent Timeline;
 * a review failure fails the run — the unreviewed draft is never
 * presented as final or published.
 */
export function useContentGeneration(): ContentGeneration {
  const [bundle, setBundle] = useState<ContentBundle | null>(null);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [failedStage, setFailedStage] = useState<FailedStage | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const generate = (documentation: string) => {
    setBundle(null);
    setFailedStage(null);
    setPublishedSlug(null);
    setStage("generating");
    startTransition(async () => {
      const generated = await generateContent(documentation);
      if (generated.status === "error") {
        setFailedStage("generating");
        setStage("error");
        toast.error(generated.message);
        return;
      }

      setStage("reviewing");
      const reviewed = await reviewContent(generated.bundle);
      if (reviewed.status === "error") {
        setFailedStage("reviewing");
        setStage("error");
        toast.error(reviewed.message);
        return;
      }

      setBundle(reviewed.bundle);
      setStage("done");
      toast.success("Content bundle generated and reviewed.");
    });
  };

  const publish = () => {
    if (bundle === null || (stage !== "done" && stage !== "error")) {
      return;
    }
    setFailedStage(null);
    setStage("publishing");
    startTransition(async () => {
      const published = await publishToSanity(bundle);
      if (published.status === "error") {
        setFailedStage("publishing");
        setStage("error");
        toast.error(published.message);
        return;
      }
      setPublishedSlug(published.slug);
      setStage("published");
      toast.success("Article published to the Help Center.");
    });
  };

  return {
    bundle,
    stage,
    failedStage,
    publishedSlug,
    isGenerating: stage === "generating" || stage === "reviewing",
    generate,
    publish,
  };
}

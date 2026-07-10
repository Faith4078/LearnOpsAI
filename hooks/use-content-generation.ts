"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateContent } from "@/actions/generate-content";
import { publishToSanity } from "@/actions/publish-to-sanity";
import { reviewContent } from "@/actions/review-content";
import { documentationName } from "@/lib/education/documentation-name";
import { fingerprintDocumentation } from "@/lib/education/fingerprint";
import type {
  ContentBundle,
  FailedStage,
  PipelineStage,
  ReviewReport,
  StageDurations,
} from "@/lib/types";

export interface ContentGeneration {
  /** The reviewed, publish-ready bundle. Null until a run completes. */
  bundle: ContentBundle | null;
  /** The Review Agent's Quality Assurance Report. Null until a run completes. */
  report: ReviewReport | null;
  /** Which pipeline stage the current run is in. */
  stage: PipelineStage;
  /** When `stage` is "error", the stage that failed. Null otherwise. */
  failedStage: FailedStage | null;
  /** Wall-clock duration (ms) of each completed stage in the current run. */
  stageDurations: StageDurations;
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
 * presented as final or published. Each stage is timed client-side so
 * the timeline can show per-stage durations.
 */
export function useContentGeneration(): ContentGeneration {
  const [bundle, setBundle] = useState<ContentBundle | null>(null);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [failedStage, setFailedStage] = useState<FailedStage | null>(null);
  const [stageDurations, setStageDurations] = useState<StageDurations>({});
  const [documentationVersion, setDocumentationVersion] = useState<
    string | null
  >(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const generate = (documentation: string) => {
    setBundle(null);
    setReport(null);
    setFailedStage(null);
    setStageDurations({});
    // Record the source Markdown's own name as the documentation identity,
    // falling back to a fingerprint when the docs have no discernible name.
    setDocumentationVersion(
      documentationName(documentation) ||
        fingerprintDocumentation(documentation),
    );
    setPublishedSlug(null);
    setStage("generating");
    startTransition(async () => {
      const generateStart = performance.now();
      const generated = await generateContent(documentation);
      if (generated.status === "error") {
        setFailedStage("generating");
        setStage("error");
        toast.error(generated.message);
        return;
      }
      setStageDurations((durations) => ({
        ...durations,
        generating: performance.now() - generateStart,
      }));

      setStage("reviewing");
      const reviewStart = performance.now();
      const reviewed = await reviewContent(generated.bundle);
      if (reviewed.status === "error") {
        setFailedStage("reviewing");
        setStage("error");
        toast.error(reviewed.message);
        return;
      }
      setStageDurations((durations) => ({
        ...durations,
        reviewing: performance.now() - reviewStart,
      }));

      setBundle(reviewed.bundle);
      setReport(reviewed.report);
      setStage("done");
      toast.success("Knowledge asset drafted and reviewed. Ready to publish.");
    });
  };

  const publish = () => {
    if (
      bundle === null ||
      report === null ||
      documentationVersion === null ||
      (stage !== "done" && stage !== "error")
    ) {
      return;
    }
    setFailedStage(null);
    setStage("publishing");
    startTransition(async () => {
      const publishStart = performance.now();
      // The asset's processing time is the two AI stages that produced it
      // (generation + review); publishing is I/O, not asset production.
      const processingSeconds = Math.max(
        0,
        Math.round(
          ((stageDurations.generating ?? 0) +
            (stageDurations.reviewing ?? 0)) /
            1000,
        ),
      );
      const published = await publishToSanity(bundle, {
        report,
        documentationVersion,
        processingSeconds,
      });
      if (published.status === "error") {
        setFailedStage("publishing");
        setStage("error");
        toast.error(published.message);
        return;
      }
      setStageDurations((durations) => ({
        ...durations,
        publishing: performance.now() - publishStart,
      }));
      setPublishedSlug(published.slug);
      setStage("published");
      toast.success("Knowledge asset published to the knowledge base.");
      // Take the operator to the Help Center, where the article they just
      // published now appears, rather than leaving them on the pipeline.
      router.push("/help-center");
    });
  };

  return {
    bundle,
    report,
    stage,
    failedStage,
    stageDurations,
    publishedSlug,
    isGenerating: stage === "generating" || stage === "reviewing",
    generate,
    publish,
  };
}

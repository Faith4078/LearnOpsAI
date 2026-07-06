"use client";

import Link from "next/link";
import { LoaderCircle, Rocket } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PipelineStage } from "@/lib/types";

interface PublishCardProps {
  stage: PipelineStage;
  publishedSlug: string | null;
  onPublish: () => void;
}

/**
 * The publish step of the pipeline: a single button that saves the
 * reviewed bundle to Sanity, then links to the live Help Center article.
 */
export function PublishCard({
  stage,
  publishedSlug,
  onPublish,
}: PublishCardProps) {
  const isPublishing = stage === "publishing";

  if (stage === "published" && publishedSlug !== null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Published</CardTitle>
          <CardDescription>
            The article is live in the Help Center.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/help-center/${publishedSlug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            View in Help Center
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish to Help Center</CardTitle>
        <CardDescription>
          Save the reviewed article, FAQs, and quiz to Sanity. It appears in
          the Help Center immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onPublish} disabled={isPublishing}>
          {isPublishing ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Rocket aria-hidden="true" />
          )}
          {isPublishing ? "Publishing…" : "Publish"}
        </Button>
      </CardContent>
    </Card>
  );
}

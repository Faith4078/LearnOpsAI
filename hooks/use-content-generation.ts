"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateContent } from "@/actions/generate-content";
import type { ContentBundle } from "@/lib/types";

export interface ContentGeneration {
  bundle: ContentBundle | null;
  isGenerating: boolean;
  generate: (documentation: string) => void;
}

/**
 * Client-side wrapper around the `generateContent` server action:
 * pending state, success/error toasts, and the latest bundle.
 */
export function useContentGeneration(): ContentGeneration {
  const [bundle, setBundle] = useState<ContentBundle | null>(null);
  const [isGenerating, startTransition] = useTransition();

  const generate = (documentation: string) => {
    startTransition(async () => {
      const result = await generateContent(documentation);
      if (result.status === "success") {
        setBundle(result.bundle);
        toast.success("Content bundle generated.");
      } else {
        toast.error(result.message);
      }
    });
  };

  return { bundle, isGenerating, generate };
}

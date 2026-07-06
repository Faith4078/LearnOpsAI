"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const documentationFormSchema = z.object({
  documentation: z
    .string()
    .trim()
    .min(1, "Paste some documentation to get started."),
});

type DocumentationFormValues = z.infer<typeof documentationFormSchema>;

interface DocumentationFormProps {
  isGenerating: boolean;
  onSubmitDocumentation: (documentation: string) => void;
}

/** Paste-documentation card: the entry point of the content pipeline. */
export function DocumentationForm({
  isGenerating,
  onSubmitDocumentation,
}: DocumentationFormProps) {
  const form = useForm<DocumentationFormValues>({
    resolver: zodResolver(documentationFormSchema),
    defaultValues: { documentation: "" },
  });

  const error = form.formState.errors.documentation;

  return (
    <Card>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmitDocumentation(values.documentation),
        )}
        noValidate
      >
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-normal tracking-tight">
            Paste documentation
          </CardTitle>
          <CardDescription>
            The Generator Agent turns raw product documentation into a help
            article, FAQs, and a knowledge-check quiz in one pass.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 pt-6">
          <Label htmlFor="documentation">Documentation</Label>
          <Textarea
            id="documentation"
            rows={12}
            placeholder="Paste Markdown or plain-text documentation here…"
            aria-invalid={error !== undefined}
            aria-describedby={error !== undefined ? "documentation-error" : undefined}
            disabled={isGenerating}
            className="min-h-56 resize-y font-mono text-sm"
            {...form.register("documentation")}
          />
          {error !== undefined && (
            <p id="documentation-error" className="text-sm text-destructive">
              {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="pt-6">
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? "Generating…" : "Generate content"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

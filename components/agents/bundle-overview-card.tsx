import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContentBundle } from "@/lib/types";

interface BundleOverviewCardProps {
  bundle: Pick<ContentBundle, "title" | "slug" | "summary">;
}

/** Publish-ready metadata: title, slug, and summary. */
export function BundleOverviewCard({ bundle }: BundleOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Generated article</CardDescription>
        <CardTitle className="font-serif text-3xl font-normal tracking-tight">
          {bundle.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Slug: </span>
          <code className="font-mono">{bundle.slug}</code>
        </p>
        <p className="text-base leading-relaxed">{bundle.summary}</p>
      </CardContent>
    </Card>
  );
}

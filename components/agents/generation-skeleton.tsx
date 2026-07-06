import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shown while the Generator Agent runs. */
export function GenerationSkeleton() {
  return (
    <section aria-label="Generating content" aria-busy="true" className="grid gap-6">
      <p className="text-sm text-muted-foreground" role="status">
        Generator Agent is writing your article, FAQs, and quiz…
      </p>
      {[0, 1].map((key) => (
        <Card key={key}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="grid gap-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

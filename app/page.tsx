import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DocumentationWorkspace } from "@/components/upload/documentation-workspace";

export default function HomePage() {
  return (
    <DashboardShell>
      <div className="grid gap-12">
        <div className="grid max-w-3xl gap-4">
          <h1 className="font-serif text-5xl font-normal leading-tight tracking-tight">
            Documentation, published as learning.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Paste raw product documentation and let the Generator Agent produce
            a publish-ready help article, FAQs, and knowledge-check quiz in a
            single pass.
          </p>
        </div>
        <DocumentationWorkspace />
      </div>
    </DashboardShell>
  );
}

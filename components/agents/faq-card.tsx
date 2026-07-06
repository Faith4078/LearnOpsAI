import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Faq } from "@/lib/types";

interface FaqCardProps {
  faqs: Faq[];
}

/** Frequently asked questions from the generated bundle. */
export function FaqCard({ faqs }: FaqCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently asked questions</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid gap-6">
          {faqs.map((faq) => (
            <div key={faq.question} className="grid gap-1.5">
              <dt className="font-medium">{faq.question}</dt>
              <dd className="leading-relaxed text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

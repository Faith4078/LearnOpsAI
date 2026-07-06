import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseArticleBlocks } from "@/utils/article";

interface ArticleCardProps {
  article: string;
}

const HEADING_CLASSES = {
  1: "font-serif text-2xl tracking-tight",
  2: "text-xl font-medium tracking-tight",
  3: "text-lg font-medium",
} as const;

/** Help-center article rendered as plain formatted text (Markdown renderer comes later). */
export function ArticleCard({ article }: ArticleCardProps) {
  const blocks = parseArticleBlocks(article);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Help article</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <p key={index} className={HEADING_CLASSES[block.level]}>
                {block.text}
              </p>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="grid list-disc gap-1.5 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="leading-relaxed text-muted-foreground">
              {block.text}
            </p>
          );
        })}
      </CardContent>
    </Card>
  );
}

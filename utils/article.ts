/**
 * Minimal article formatting: splits Markdown-ish text into typed blocks
 * for plain formatted rendering. A real Markdown renderer arrives in a
 * later slice; this keeps generated articles readable until then.
 */

export type ArticleBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;

export function parseArticleBlocks(article: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];

  for (const chunk of article.split(/\n{2,}/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    if (lines.length === 0) continue;

    for (const group of groupLines(lines)) {
      blocks.push(group);
    }
  }

  return blocks;
}

function groupLines(lines: string[]): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  for (const line of lines) {
    const heading = HEADING_PATTERN.exec(line);
    if (heading !== null) {
      flush();
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        text: heading[2],
      });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (paragraph.length > 0) flush();
      list.push(line.slice(2));
    } else {
      if (list.length > 0) flush();
      paragraph.push(line);
    }
  }
  flush();

  return blocks;
}

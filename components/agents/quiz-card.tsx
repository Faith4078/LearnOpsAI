import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuizQuestion } from "@/lib/types";

interface QuizCardProps {
  quiz: QuizQuestion[];
}

/** Static display of the knowledge-check quiz (interactivity comes in the Help Center slice). */
export function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge check</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 pt-4">
        {quiz.map((question, index) => (
          <div key={question.question} className="grid gap-3">
            <p className="font-medium">
              {index + 1}. {question.question}
            </p>
            <ul className="grid gap-1.5 pl-1">
              {question.options.map((option) => {
                const isCorrect = option === question.answer;
                return (
                  <li
                    key={option}
                    className={
                      isCorrect
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {option}
                    {isCorrect && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                        Correct answer
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

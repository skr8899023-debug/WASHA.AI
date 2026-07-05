import { useState } from "react";
import type { QuizQuestion } from "../../utils/astronomyTypes";

interface Props {
  question: QuizQuestion;
  onAnswered?: (correct: boolean) => void;
}

/** Single interactive question with immediate feedback + explanation. */
export function QuizInline({ question, onAnswered }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="quiz-inline">
      <div className="quiz-question">{question.question}</div>
      <div className="quiz-choices">
        {question.choices.map((choice, i) => {
          let cls = "quiz-choice";
          if (answered) {
            if (i === question.correctIndex) cls += " correct";
            else if (i === picked) cls += " wrong";
            else cls += " disabled";
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                onAnswered?.(i === question.correctIndex);
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback ${picked === question.correctIndex ? "ok" : "no"}`}>
          <strong>{picked === question.correctIndex ? "إجابة صحيحة ✔" : "ليست الإجابة الصحيحة"}</strong>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

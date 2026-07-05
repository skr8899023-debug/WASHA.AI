import { useMemo, useState } from "react";
import { buildQuizRound } from "../../data/quizzes";
import { formatArabicNumber } from "../../utils/formatArabicNumber";
import { QuizInline } from "./QuizInline";

const ROUND_SIZE = 8;

export function QuizPanel() {
  const [roundKey, setRoundKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const questions = useMemo(() => buildQuizRound(ROUND_SIZE), [roundKey]);
  const finished = index >= questions.length;

  const restart = () => {
    setRoundKey((k) => k + 1);
    setIndex(0);
    setScore(0);
    setAnswered(false);
  };

  return (
    <aside className="quiz-panel" aria-label="اختبر نفسك">
      <header className="quiz-header">
        <h2 className="panel-title">اختبر نفسك</h2>
        <div className="quiz-score">
          النتيجة: {formatArabicNumber(score)} / {formatArabicNumber(questions.length)}
        </div>
      </header>

      {finished ? (
        <div className="quiz-summary">
          <div className="quiz-summary-score">
            {formatArabicNumber(score)} من {formatArabicNumber(questions.length)}
          </div>
          <p className="quiz-summary-text">
            {score === questions.length
              ? "ممتاز! أجبت عن كل الأسئلة بشكل صحيح."
              : score >= questions.length / 2
                ? "أداء جيد — راجع البطاقات المعرفية للأجرام التي أخطأت فيها ثم أعد المحاولة."
                : "بداية طيبة — جرّب وضع «تعلّم» ثم عد للاختبار من جديد."}
          </p>
          <button type="button" className="btn primary" onClick={restart}>
            جولة جديدة
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-progress-text">
            السؤال {formatArabicNumber(index + 1)} من {formatArabicNumber(questions.length)}
          </div>
          <QuizInline
            key={questions[index].id}
            question={questions[index]}
            onAnswered={(correct) => {
              setAnswered(true);
              if (correct) setScore((s) => s + 1);
            }}
          />
          {answered && (
            <button
              type="button"
              className="btn primary quiz-next"
              onClick={() => {
                setIndex((i) => i + 1);
                setAnswered(false);
              }}
            >
              {index + 1 === questions.length ? "عرض النتيجة" : "السؤال التالي"}
            </button>
          )}
        </>
      )}
    </aside>
  );
}

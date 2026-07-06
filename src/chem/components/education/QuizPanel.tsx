import { useMemo, useState } from "react";
import { quizQuestions } from "../../data/quizzes";
import { formatArabicNumber } from "../../utils/formatArabicNumber";

const KEYS = ["أ", "ب", "ج", "د"];

/** اختبار قصير بتغذية راجعة فورية وشرح بعد كل إجابة */
export function QuizPanel() {
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10),
    [round],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const ratio = score / questions.length;
    const msg =
      ratio === 1
        ? "ممتاز! أنت كيميائي المستقبل بلا منازع 🏆"
        : ratio >= 0.7
          ? "أداء رائع! راجع الأسئلة التي أخطأت فيها وستتقنها كلها."
          : ratio >= 0.4
            ? "بداية جيدة — جرّب رحلات التعلّم ثم عُد للاختبار."
            : "لا بأس، التعلّم رحلة! ابدأ برحلة «داخل الذرة» ثم حاول مجددًا.";
    return (
      <div className="chem-page">
        <div className="chem-quiz">
          <div className="chem-quiz-result">
            <div className="chem-score-ring">
              {formatArabicNumber(score)} / {formatArabicNumber(questions.length)}
            </div>
            <p>{msg}</p>
            <button className="chem-btn primary" onClick={restart}>
              ↺ اختبار جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chem-page">
      <div className="chem-page-head">
        <h2>📝 اختبر نفسك</h2>
        <p>عشرة أسئلة عشوائية مع شرح فوري لكل إجابة. جاهز؟</p>
      </div>
      <div className="chem-quiz">
        <div className="chem-quiz-head">
          <span className="chem-quiz-topic">{q.topic}</span>
          <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 700 }}>
            سؤال {formatArabicNumber(index + 1)} من {formatArabicNumber(questions.length)}
          </span>
          <span className="chem-quiz-score">النقاط: {formatArabicNumber(score)}</span>
        </div>
        <div className="chem-quiz-body">
          <p className="chem-quiz-q">{q.question}</p>
          {q.choices.map((choice, i) => {
            let cls = "chem-choice";
            if (picked !== null) {
              if (i === q.correctIndex) cls += " correct";
              else if (i === picked) cls += " wrong";
              else cls += " dim";
            }
            return (
              <button key={i} className={cls} disabled={picked !== null} onClick={() => pick(i)}>
                <span className="chem-choice-key">{KEYS[i]}</span>
                {choice}
                {picked !== null && i === q.correctIndex && <span style={{ marginInlineStart: "auto" }}>✔</span>}
                {picked === i && i !== q.correctIndex && <span style={{ marginInlineStart: "auto" }}>✕</span>}
              </button>
            );
          })}
          {picked !== null && (
            <div className={`chem-callout chem-quiz-explain ${picked === q.correctIndex ? "think" : "warn"}`}>
              {picked === q.correctIndex ? "🎉 إجابة صحيحة! " : "💡 "}
              {q.explanation}
            </div>
          )}
        </div>
        <div className="chem-quiz-footer">
          <button className="chem-btn primary" disabled={picked === null} onClick={next}>
            {index < questions.length - 1 ? "السؤال التالي ←" : "أظهر النتيجة"}
          </button>
        </div>
      </div>
    </div>
  );
}

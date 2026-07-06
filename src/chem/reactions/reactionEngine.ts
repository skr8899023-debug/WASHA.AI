import { reactions } from "../data/reactions";
import { chemicalsById } from "../data/chemicals";
import type { Reaction, ReactionExplanation, ReactionVisual } from "../types";

export interface Conditions {
  heat: boolean;
  stir: boolean;
}

export interface ReactionResult {
  reaction: Reaction | null;
  outcome: Reaction["outcome"];
  title: string;
  visual: ReactionVisual;
  explanation: ReactionExplanation;
  conceptualOnly: boolean;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/** يمزج ألوان المواد الحالية لتقدير لون المحلول قبل حدوث تفاعل */
export function blendColors(ids: string[]): string {
  const cols = ids.map((id) => chemicalsById[id]?.color).filter(Boolean) as string[];
  if (cols.length === 0) return "#0f1a30";
  if (cols.length === 1) return cols[0];
  const acc = [0, 0, 0];
  for (const c of cols) {
    const n = c.replace("#", "");
    acc[0] += parseInt(n.slice(0, 2), 16);
    acc[1] += parseInt(n.slice(2, 4), 16);
    acc[2] += parseInt(n.slice(4, 6), 16);
  }
  const avg = acc.map((v) => Math.round(v / cols.length));
  return `#${avg.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * قلب المحرك: يطابق المواد الحالية والشروط مع قاعدة التفاعلات.
 * يفضّل التفاعل الأكثر تحديدًا (الذي يشترط ظرفًا مُفعّلًا حاليًا).
 */
export function evaluateReaction(ids: string[], cond: Conditions): ReactionResult {
  const specificity = (r: Reaction) => (r.requires?.heat ? 1 : 0) + (r.requires?.stir ? 1 : 0);

  const matched = reactions
    .filter((r) => sameSet(r.reactants, ids))
    .filter((r) => (r.requires?.heat ? cond.heat : true) && (r.requires?.stir ? cond.stir : true))
    .sort((a, b) => specificity(b) - specificity(a));

  if (matched.length > 0) {
    const r = matched[0];
    const level = r.visual.liquidLevel ?? Math.min(0.35 + ids.length * 0.15, 0.7);
    return {
      reaction: r,
      outcome: r.outcome,
      title: r.title,
      visual: { ...r.visual, liquidLevel: level },
      explanation: r.explanation,
      conceptualOnly: r.conceptualOnly ?? false,
    };
  }

  return noReactionResult(ids, cond);
}

/** ناتج افتراضي عندما لا توجد قاعدة مطابقة */
function noReactionResult(ids: string[], cond: Conditions): ReactionResult {
  const level = Math.min(0.35 + ids.length * 0.15, 0.7);
  const visual: ReactionVisual = { liquidColor: blendColors(ids), liquidLevel: ids.length ? level : 0, vapor: cond.heat };

  if (ids.length === 0) {
    return {
      reaction: null,
      outcome: "none",
      title: "الكأس فارغ",
      visual,
      explanation: {
        what: "لا يوجد شيء في الكأس بعد.",
        why: "اختر مادة من الرف واسكبها في الكأس لتبدأ.",
        type: "—",
        evidence: "—",
        equation: "—",
        safety: "ابدأ دائمًا بارتداء النظارات والقفازات.",
      },
      conceptualOnly: false,
    };
  }

  if (ids.length === 1) {
    return {
      reaction: null,
      outcome: "none",
      title: "مادة واحدة فقط",
      visual,
      explanation: {
        what: "المادة موجودة في الكأس لكن لا يوجد ما تتفاعل معه.",
        why: "التفاعل يحتاج غالبًا مادتين أو شرطًا مثل التسخين. جرّب إضافة مادة أخرى أو تشغيل الموقد.",
        type: "لا تفاعل بعد.",
        evidence: "لا تغيّر ملحوظ.",
        equation: "—",
        safety: "لا تخلط مواد عشوائيًا خارج قائمة التجارب.",
      },
      conceptualOnly: false,
    };
  }

  return {
    reaction: null,
    outcome: "none",
    title: "لا يتفاعلان",
    visual,
    explanation: {
      what: "امتزجت المواد ظاهريًا دون أي دليل على تفاعل كيميائي.",
      why: "هذه المواد لا تملك ميلًا للتفاعل تحت هذه الظروف؛ فبقيت كما هي.",
      type: "لا تفاعل (خلط فيزيائي).",
      evidence: "لا فقاعات ولا لون جديد ولا راسب ولا حرارة.",
      equation: "لا مادة جديدة",
      safety: "التوقّف عن التفاعل لا يعني الأمان دائمًا؛ التزم بالتجارب المعتمدة.",
    },
    conceptualOnly: false,
  };
}

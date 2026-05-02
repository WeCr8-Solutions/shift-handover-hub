/**
 * Deterministic per-attempt choice shuffler.
 *
 * Choices are stored as { key, label }. The grader matches on `key`, so we can
 * safely shuffle the visible order without breaking grading. We seed by
 * (questionId, attemptStartedAt) so the order is stable across re-renders
 * within one attempt and changes when the user starts a new attempt.
 */

export interface QuizChoice {
  key: string;
  label: string;
}

// Mulberry32: tiny deterministic PRNG.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleChoices(
  choices: QuizChoice[] | null | undefined,
  questionId: string,
  attemptSeed: string,
): QuizChoice[] {
  // Defensive: tolerate legacy bare-string choices in case any data slips through.
  const safe: QuizChoice[] = (choices ?? []).map((c, i) => {
    if (c && typeof c === "object" && typeof c.key === "string") {
      return { key: c.key, label: String(c.label ?? c.key) };
    }
    const fallbackKey = String.fromCharCode(97 + i); // a, b, c…
    return { key: fallbackKey, label: String(c ?? "") };
  });

  if (safe.length <= 1) return safe;

  const rng = mulberry32(hashString(`${questionId}::${attemptSeed}`));
  const out = [...safe];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

# Fix: OAP measurement learners can't view tool YouTube videos in lessons or quizzes

## Problem

The OAP "Measurement & Inspection" course (`/oap/learn/measurement-inspection/...`) and its final quiz both miss the same kind of inline tool tutorials we just embedded in GCA Measurement Tools tests:

- `OapCoursePlayer` only renders `TrainingMedia` rows attached directly to the lesson or course — none of the four canonical lessons currently has measurement-tool videos linked, so learners see text only.
- `QuizPlayer` (`src/components/oap/QuizPlayer.tsx`) renders no media at all, so a learner about to take the *Measurement & Inspection — Final Quiz* has no way to re-watch how to read a micrometer / caliper / bore gage / height gage / dial indicator without leaving the page (and losing answers).

Same root cause as the GCA fix: there was no link between an OAP course/quiz and the `inspection_tools` rows whose YouTube tutorials already live in `training_media`.

## Solution

Reuse the GCA tool-video card across OAP, then surface it in both the course player and the quiz player when the surface belongs to a measurement-related course.

### 1. Refactor: extract a shared `InspectionToolVideoCard`

- Create `src/components/training/InspectionToolVideoCard.tsx` — generalized version of the existing `GcaToolVideos` (slugs prop, optional title/subtitle/footer-links/new-tab toggle).
- Update `src/components/gca/GcaToolVideos.tsx` to thin-wrap the shared component (keeps the import path used by `GcaTestPage` working — no behavior change for GCA).

### 2. New OAP map

`src/lib/oapToolMap.ts` — keyed by `oap_courses.slug` (the only slug we have on hand inside the player without an extra fetch):

```ts
export const OAP_COURSE_TOOL_SLUGS: Record<string, string[]> = {
  "measurement-inspection": [
    "outside-micrometer",
    "vernier-caliper",
    "dial-caliper",
    "digital-caliper",
    "depth-micrometer",
    "dial-indicator",
    "test-indicator",
    "dial-bore-gauge",
    "telescoping-gauge",
    "height-gauge-digital",
    "height-gauge-vernier",
  ],
};

export function getOapCourseToolSlugs(courseSlug: string | null | undefined) {
  if (!courseSlug) return [];
  return OAP_COURSE_TOOL_SLUGS[courseSlug] ?? [];
}
```

### 3. Wire into `OapCoursePlayer`

In `src/pages/OapCoursePlayer.tsx`, render the card just below the lesson body when `getOapCourseToolSlugs(course.slug).length > 0`. This puts the videos on every lesson within the Measurement & Inspection course (overview, basic measurement, micrometers/bore gauges, GD&T) without authors needing to re-attach media per lesson.

### 4. Wire into `QuizPlayer`

`QuizPlayer` doesn't currently know its course slug. Two options, picking the smallest:

- Add an optional `toolSlugs?: string[]` prop and let the parent (`OapCoursePlayer`) pass `getOapCourseToolSlugs(course.slug)`. Render the card above the questions when non-empty, with `openLinksInNewTab=true` so the learner doesn't lose in-flight answers.

This keeps `QuizPlayer` decoupled from any course-specific logic.

### 5. (Optional, no new deps) per-question override

Same opt-in pattern as planned for GCA: parse a leading `[tool:slug]` marker out of the OAP question prompt at render time and lazy-mount a small `<TrainingMedia entityType="inspection_tool" .../>` disclosure under that question. Zero schema change, opt-in per question. Skip if not needed for this round.

## Files

**New**
- `src/components/training/InspectionToolVideoCard.tsx` — shared embedded video card
- `src/lib/oapToolMap.ts` — course-slug → inspection-tool-slug map

**Edited**
- `src/components/gca/GcaToolVideos.tsx` — re-export shared card (preserve API)
- `src/pages/OapCoursePlayer.tsx` — render card under each measurement lesson and pass `toolSlugs` into `QuizPlayer`
- `src/components/oap/QuizPlayer.tsx` — accept `toolSlugs?: string[]` prop, render card above questions when present

No DB migration needed — the YouTube rows for the relevant inspection tools are already in `training_media` (some backfilled in the prior GCA pass).

## Verification

1. `/oap/learn/measurement-inspection/basic-measurement-tape-rule-caliper` — tabbed YouTube tutorials for vernier/dial/digital calipers play inline below the lesson body.
2. `/oap/learn/measurement-inspection/micrometers-and-bore-gauges` — same card appears (course-level scope).
3. Open the course's final quiz — the tool video card sits at the top of the quiz with footer links opening in new tabs; submitting answers still works (no regression in `submit-quiz-attempt` RPC path).
4. Open a non-measurement course (e.g. `/oap/learn/safety-ehs/...`) — no card renders, behavior unchanged.
5. GCA Measurement Tools tests still embed videos exactly as before (refactor is a no-op for that surface).

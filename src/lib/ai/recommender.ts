import type { Course, Enrollment, LearningPath, User } from "@/lib/types";
import { jaccard, stemSet } from "./arabic";

/**
 * التوصية التعليمية — تصفية قائمة على المحتوى (content-based).
 *
 * لماذا ليست تصفية تعاونية؟ لأن التصفية التعاونية تحتاج تاريخ تسجيل واسعًا
 * لا يوجد في منصة جديدة (مشكلة البداية الباردة)، وتنتج توصيات لا يمكن شرحها.
 * هنا كل توصية تحمل سببها، وهو ما يجعلها مقنعة للمتدرب.
 */

const LEVEL_RANK: Record<Course["level"], number> = {
  beginner: 0, intermediate: 1, advanced: 2,
};

export interface Recommendation {
  course: Course;
  score: number;
  reasons: string[];
}

export function recommendCourses(args: {
  user: User;
  courses: Course[];
  enrollments: Enrollment[];
  paths: LearningPath[];
  limit?: number;
}): Recommendation[] {
  const { user, courses, enrollments, paths } = args;
  const enrolledSlugs = new Set(
    enrollments.filter((e) => e.status !== "cancelled").map((e) => e.courseSlug),
  );
  const enrolled = courses.filter((c) => enrolledSlugs.has(c.slug));

  // المستوى المكتسب = أعلى مستوى أتمّه المتدرب
  const attainedLevel = enrolled.reduce(
    (max, course) => Math.max(max, LEVEL_RANK[course.level]),
    -1,
  );

  const interestTokens = stemSet(user.interests.join(" "));
  const historyTokens = stemSet(
    enrolled.map((c) => `${c.title} ${c.category} ${c.tags.join(" ")}`).join(" "),
  );

  const results: Recommendation[] = [];

  for (const course of courses) {
    if (enrolledSlugs.has(course.slug)) continue;
    if (course.status === "closed") continue;

    const reasons: string[] = [];
    let score = 0;

    // ١. تطابق الاهتمامات المعلنة
    if (user.interests.includes(course.category)) {
      score += 4;
      reasons.push(`ضمن اهتماماتك: ${course.category}`);
    } else {
      const interestOverlap = jaccard(
        interestTokens,
        stemSet(`${course.title} ${course.category} ${course.tags.join(" ")}`),
      );
      if (interestOverlap > 0.08) {
        score += interestOverlap * 8;
        reasons.push("قريب من اهتماماتك");
      }
    }

    // ٢. الخطوة التالية في مسار بدأه المتدرب
    const path = paths.find((p) => p.slug === course.pathSlug);
    if (path) {
      const pathProgress = path.courseSlugs.filter((s) => enrolledSlugs.has(s)).length;
      if (pathProgress > 0) {
        const nextIndex = path.courseSlugs.findIndex((s) => !enrolledSlugs.has(s));
        if (path.courseSlugs[nextIndex] === course.slug) {
          score += 6;
          reasons.push(`الخطوة التالية في «${path.title}»`);
        } else {
          score += 2;
          reasons.push(`ضمن «${path.title}» الذي بدأته`);
        }
      }
    }

    // ٣. تدرّج المستوى — لا نقفز بالمتدرب فوق مستواه
    const gap = LEVEL_RANK[course.level] - attainedLevel;
    if (attainedLevel < 0) {
      if (course.level === "beginner") {
        score += 2.5;
        reasons.push("مناسب للبداية");
      }
    } else if (gap === 1) {
      score += 3;
      reasons.push("المستوى التالي المناسب لك");
    } else if (gap === 0) {
      score += 1.5;
    } else if (gap > 1) {
      score -= 3;
    }

    // ٤. تشابه المحتوى مع ما درسه سابقًا
    const contentOverlap = jaccard(
      historyTokens,
      stemSet(`${course.title} ${course.summary} ${course.tags.join(" ")}`),
    );
    if (contentOverlap > 0.06) {
      score += contentOverlap * 6;
      if (reasons.length < 2) reasons.push("مبني على ما درسته سابقًا");
    }

    // ٥. إشارات عملية: الإتاحة والقرب الزمني والتقييم
    const remaining = course.seatsTotal - course.seatsTaken;
    if (remaining > 0 && remaining <= 6) {
      score += 1;
      reasons.push(`متبقٍ ${remaining} مقاعد فقط`);
    }
    const daysToStart = (Date.parse(course.startsAt) - Date.now()) / 86_400_000;
    if (daysToStart > 0 && daysToStart <= 14) score += 1;
    score += (course.rating - 4) * 1.5;

    if (score <= 0) continue;
    if (reasons.length === 0) reasons.push("مقترح بناءً على تقييمه ومدى إتاحته");

    results.push({ course, score, reasons: reasons.slice(0, 2) });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, args.limit ?? 4);
}

/** المسار المقترح — المسار الذي تتقاطع اهتمامات المتدرب معه أكثر. */
export function suggestPath(args: {
  user: User;
  paths: LearningPath[];
  courses: Course[];
  enrollments: Enrollment[];
}): { path: LearningPath; completed: string[]; next: Course | null; reason: string } | null {
  const { user, paths, courses, enrollments } = args;
  const enrolledSlugs = new Set(
    enrollments.filter((e) => e.status !== "cancelled").map((e) => e.courseSlug),
  );
  const interestTokens = stemSet(user.interests.join(" "));

  let best: { path: LearningPath; score: number; reason: string } | null = null;

  for (const path of paths) {
    const pathCourses = path.courseSlugs
      .map((slug) => courses.find((c) => c.slug === slug))
      .filter((c): c is Course => Boolean(c));
    if (pathCourses.length === 0) continue;

    const started = path.courseSlugs.filter((s) => enrolledSlugs.has(s)).length;
    const interestScore = jaccard(
      interestTokens,
      stemSet(`${path.title} ${path.description} ${pathCourses.map((c) => c.category).join(" ")}`),
    );
    const categoryMatch = pathCourses.some((c) => user.interests.includes(c.category)) ? 1 : 0;

    const score = started * 5 + interestScore * 6 + categoryMatch * 3;
    if (score <= 0) continue;

    const reason =
      started > 0
        ? `بدأت ${started} من برامج هذا المسار`
        : categoryMatch
          ? `يتقاطع مع اهتمامك بـ${user.interests.find((i) => pathCourses.some((c) => c.category === i))}`
          : "الأقرب إلى اهتماماتك المسجّلة";

    if (!best || score > best.score) best = { path, score, reason };
  }

  if (!best) return null;

  const completed = best.path.courseSlugs.filter((s) => enrolledSlugs.has(s));
  const nextSlug = best.path.courseSlugs.find((s) => !enrolledSlugs.has(s)) ?? null;
  const next = nextSlug ? (courses.find((c) => c.slug === nextSlug) ?? null) : null;

  return { path: best.path, completed, next, reason: best.reason };
}

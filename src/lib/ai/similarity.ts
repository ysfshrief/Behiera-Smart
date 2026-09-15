import type { Complaint } from "@/lib/types";
import { haversineKm } from "@/data/geo";
import { jaccard, stemSet } from "./arabic";

/**
 * كشف التشابه والتجميع الجغرافي.
 *
 * ثلاث إشارات مستقلة تُجمع بأوزان: تشابه النص، القرب الجغرافي، تقارب الزمن.
 * كل نتيجة تحمل سبب اعتبارها مشابهة — لأن "تجاهل بلاغ لأنه مكرر" قرار
 * لا يجوز أن يُتخذ بلا تبرير ظاهر.
 */

export interface SimilarityHit {
  complaint: Complaint;
  score: number;
  distanceKm: number;
  hoursApart: number;
  reasons: string[];
}

export interface SimilarityInput {
  title: string;
  body: string;
  categoryId: string;
  lat: number;
  lng: number;
  createdAt?: string;
}

const RADIUS_KM = 1.5;
const WINDOW_HOURS = 72;

export function findSimilar(
  candidate: SimilarityInput,
  pool: Complaint[],
  options?: { radiusKm?: number; windowHours?: number; minScore?: number; limit?: number },
): SimilarityHit[] {
  const radiusKm = options?.radiusKm ?? RADIUS_KM;
  const windowHours = options?.windowHours ?? WINDOW_HOURS;
  const minScore = options?.minScore ?? 0.35;
  const at = candidate.createdAt ? Date.parse(candidate.createdAt) : Date.now();
  const candidateTokens = stemSet(`${candidate.title} ${candidate.body}`);

  const hits: SimilarityHit[] = [];

  for (const other of pool) {
    const hoursApart = Math.abs(at - Date.parse(other.createdAt)) / 3_600_000;
    if (hoursApart > windowHours) continue;

    const distanceKm = haversineKm(candidate, other);
    if (distanceKm > radiusKm * 2) continue;

    const textScore = jaccard(candidateTokens, stemSet(`${other.title} ${other.body}`));
    const geoScore = Math.max(0, 1 - distanceKm / radiusKm);
    const timeScore = Math.max(0, 1 - hoursApart / windowHours);
    const categoryScore = other.categoryId === candidate.categoryId ? 1 : 0;

    const score =
      textScore * 0.34 + geoScore * 0.3 + categoryScore * 0.26 + timeScore * 0.1;

    if (score < minScore) continue;

    const reasons: string[] = [];
    if (categoryScore === 1) reasons.push("نفس التصنيف");
    if (distanceKm < 0.35) reasons.push("نفس الموقع تقريبًا");
    else if (distanceKm <= radiusKm) reasons.push(`على بُعد ${distanceKm.toFixed(1)} كم`);
    if (textScore > 0.3) reasons.push("وصف متقارب");
    if (hoursApart < 24) reasons.push("خلال ٢٤ ساعة");

    hits.push({ complaint: other, score, distanceKm, hoursApart, reasons });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, options?.limit ?? 5);
}

export interface Cluster {
  id: string;
  categoryId: string;
  markaz: string;
  complaints: Complaint[];
  center: { lat: number; lng: number };
  radiusKm: number;
  firstAt: string;
  lastAt: string;
}

/**
 * تجميع بسيط بالنمو من البذرة (single-link) داخل نافذة زمنية.
 * اخترناه بدل خوارزميات أثقل لأن الحجم صغير، والنتيجة قابلة للشرح تمامًا
 * للموظف: "هذه البلاغات ضمن دائرة نصف قطرها كذا وخلال كذا ساعة".
 */
export function clusterComplaints(
  complaints: Complaint[],
  options?: { radiusKm?: number; windowHours?: number; minSize?: number },
): Cluster[] {
  const radiusKm = options?.radiusKm ?? 1.5;
  const windowHours = options?.windowHours ?? 72;
  const minSize = options?.minSize ?? 3;
  const cutoff = Date.now() - windowHours * 3_600_000;

  const recent = complaints
    .filter((c) => Date.parse(c.createdAt) >= cutoff)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const used = new Set<string>();
  const clusters: Cluster[] = [];

  for (const seed of recent) {
    if (used.has(seed.id)) continue;
    const members = [seed];
    used.add(seed.id);

    let changed = true;
    while (changed) {
      changed = false;
      for (const candidate of recent) {
        if (used.has(candidate.id)) continue;
        if (candidate.categoryId !== seed.categoryId) continue;
        const near = members.some((m) => haversineKm(m, candidate) <= radiusKm);
        if (!near) continue;
        members.push(candidate);
        used.add(candidate.id);
        changed = true;
      }
    }

    if (members.length < minSize) {
      if (members.length === 1) used.delete(seed.id);
      continue;
    }

    const center = {
      lat: members.reduce((s, m) => s + m.lat, 0) / members.length,
      lng: members.reduce((s, m) => s + m.lng, 0) / members.length,
    };
    const times = members.map((m) => Date.parse(m.createdAt)).sort((a, b) => a - b);

    clusters.push({
      id: `cl-${seed.categoryId}-${seed.id}`,
      categoryId: seed.categoryId,
      markaz: mostCommon(members.map((m) => m.markaz)),
      complaints: members.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      center,
      radiusKm: Math.max(
        0.2,
        Math.max(...members.map((m) => haversineKm(center, m))),
      ),
      firstAt: new Date(times[0]).toISOString(),
      lastAt: new Date(times[times.length - 1]).toISOString(),
    });
  }

  return clusters.sort((a, b) => b.complaints.length - a.complaints.length);
}

export function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

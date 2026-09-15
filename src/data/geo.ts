/**
 * جغرافيا محافظة البحيرة — مراكز ومدن حقيقية بإحداثيات تقريبية.
 * تُستخدم في التجميع الجغرافي للبلاغات وفي خريطة لوحة المحافظة.
 * التمثيل على الخريطة تخطيطي (schematic) وليس مسحًا جغرافيًا رسميًا.
 */
export interface Markaz {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** تقدير سكاني تقريبي — يُستخدم لتطبيع معدلات البلاغات فقط. */
  population: number;
}

export const MARKAZ_LIST: Markaz[] = [
  { id: "damanhour",    name: "دمنهور",           lat: 31.0341, lng: 30.4682, population: 470000 },
  { id: "kafr-eldawar", name: "كفر الدوار",        lat: 31.1349, lng: 30.1288, population: 380000 },
  { id: "rashid",       name: "رشيد",              lat: 31.4044, lng: 30.4164, population: 110000 },
  { id: "edku",         name: "إدكو",              lat: 31.3033, lng: 30.2961, population: 150000 },
  { id: "abu-hummus",   name: "أبو حمص",           lat: 31.0947, lng: 30.3167, population: 190000 },
  { id: "etay",         name: "إيتاي البارود",     lat: 30.8797, lng: 30.6692, population: 210000 },
  { id: "shubrakhit",   name: "شبراخيت",           lat: 31.0225, lng: 30.7047, population: 160000 },
  { id: "hosh-issa",    name: "حوش عيسى",          lat: 30.9000, lng: 30.2833, population: 175000 },
  { id: "kom-hamada",   name: "كوم حمادة",         lat: 30.7622, lng: 30.7003, population: 195000 },
  { id: "badr",         name: "بدر",               lat: 30.7333, lng: 30.1667, population: 85000 },
  { id: "wadi-natrun",  name: "وادي النطرون",      lat: 30.4000, lng: 30.2500, population: 95000 },
  { id: "rahmaniyah",   name: "الرحمانية",         lat: 31.1167, lng: 30.6333, population: 70000 },
  { id: "delengat",     name: "الدلنجات",          lat: 30.8333, lng: 30.5333, population: 165000 },
  { id: "mahmoudiyah",  name: "المحمودية",         lat: 31.1833, lng: 30.5167, population: 130000 },
  { id: "abu-matamir",  name: "أبو المطامير",      lat: 30.9000, lng: 30.1667, population: 140000 },
  { id: "nubaria",      name: "النوبارية الجديدة", lat: 30.6667, lng: 30.0667, population: 105000 },
];

export const MARKAZ_NAMES = MARKAZ_LIST.map((m) => m.name);

export function markazByName(name: string): Markaz | undefined {
  return MARKAZ_LIST.find((m) => m.name === name);
}

/** حدود الإطار الجغرافي للمحافظة — لإسقاط النقاط على الخريطة التخطيطية. */
export const BEHEIRA_BOUNDS = {
  minLat: 30.32,
  maxLat: 31.50,
  minLng: 29.98,
  maxLng: 30.80,
};

/** مسافة هافرساين بالكيلومتر — أساس كشف التكرار والتجميع. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

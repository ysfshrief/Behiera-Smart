"use client";

/**
 * ضغط الصور في المتصفح قبل الرفع.
 *
 * السبب واقعي: المواطن يصوّر بهاتفه بدقة عالية، وشبكات المحافظة ليست دائمًا
 * سريعة. ضغط الصورة إلى ١٢٨٠ بكسل يقلّل الحجم أضعافًا دون أن يفقد الموظف
 * القدرة على رؤية المشكلة.
 */
const MAX_DIMENSION = 1280;
const QUALITY = 0.72;

export async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, width, height);
  try {
    return canvas.toDataURL("image/jpeg", QUALITY);
  } catch {
    return dataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode_failed"));
    image.src = src;
  });
}

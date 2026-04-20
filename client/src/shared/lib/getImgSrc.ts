const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(
  '/api',
  '',
);

export function getImgSrc(filename: string | null): string | null {
  if (!filename) return null;
  return `${IMG_BASE}/uploads/processed/${filename}`;
}

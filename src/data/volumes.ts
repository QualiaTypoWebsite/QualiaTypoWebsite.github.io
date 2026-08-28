/**
 * Presentation metadata for each volume. What actually exists on disk comes
 * from public/magazines/index.json, which the page-build script regenerates —
 * so publishing volume 4 means dropping its PDF in and rebuilding, with no
 * code change here beyond an entry in this list.
 */
export type VolumeMeta = {
  volume: number;
  /** Full-saturation colour lifted from that volume's own cover. */
  accent: string;
  year: string;
};

export type Volume = VolumeMeta & {
  pages: number;
  width: number;
  height: number;
  pdf: string;
};

export const VOLUME_META: VolumeMeta[] = [
  { volume: 1, accent: '#e8018a', year: '2023' },
  { volume: 2, accent: '#2a3784', year: '2024' },
  { volume: 3, accent: '#9ac01b', year: '2024' },
  { volume: 4, accent: '#c8623b', year: '2025' },
];

/** How many volumes the site plans for, published or not. */
export const PLANNED_VOLUMES = VOLUME_META.length;

export const MAGAZINE_BASE = '/magazines';

export function volumeDir(volume: number): string {
  return `${MAGAZINE_BASE}/vol-${volume}`;
}

/** Page images are 1-indexed and zero-padded to three digits. */
export function pageImage(volume: number, page: number): string {
  return `${volumeDir(volume)}/page-${String(page).padStart(3, '0')}.webp`;
}

export function thumbImage(volume: number, page: number): string {
  return `${volumeDir(volume)}/thumb-${String(page).padStart(3, '0')}.webp`;
}

/** A volume's cover is simply its first page. */
export function coverImage(volume: number): string {
  return pageImage(volume, 1);
}

export function pdfHref(volume: Volume): string {
  return `${volumeDir(volume.volume)}/${volume.pdf}`;
}

export function accentFor(volume: number): string {
  return VOLUME_META.find((v) => v.volume === volume)?.accent ?? '#e8018a';
}

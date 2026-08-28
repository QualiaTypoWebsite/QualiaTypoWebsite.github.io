/**
 * Loads the list of volumes that actually exist.
 *
 * The build script writes public/magazines/index.json listing every volume it
 * rendered. Fetching that at runtime — rather than hard-coding the list — is
 * what lets volume 4 appear simply by adding its PDF and rebuilding, with no
 * code change.
 *
 * The generated entries (page counts, dimensions) are merged with the
 * hand-written presentation data in volumes.ts (colours, years).
 */
import { useEffect, useState } from 'react';
import { MAGAZINE_BASE, VOLUME_META, type Volume } from './volumes';

type Index = { volumes: Array<Omit<Volume, 'accent' | 'year'>> };

export type VolumesState = {
  volumes: Volume[];
  loading: boolean;
  error: string | null;
};

/** Merges the generated index with the static presentation metadata. */
export function mergeVolumes(index: Index): Volume[] {
  return index.volumes
    .map((entry) => {
      const meta = VOLUME_META.find((m) => m.volume === entry.volume);
      return meta ? { ...meta, ...entry } : null;
    })
    .filter((v): v is Volume => v !== null)
    .sort((a, b) => a.volume - b.volume);
}

export function useVolumes(): VolumesState {
  const [state, setState] = useState<VolumesState>({
    volumes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${MAGAZINE_BASE}/index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`index.json: ${res.status}`);
        return res.json() as Promise<Index>;
      })
      .then((index) => {
        if (!cancelled) setState({ volumes: mergeVolumes(index), loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ volumes: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

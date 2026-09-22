/**
 * Owns the one piece of audio the site ever plays.
 *
 * It sits above the route table in App.tsx rather than inside the audio page,
 * and that placement is the whole point: a provider mounted inside a route is
 * unmounted the moment the visitor navigates, taking its <audio> element and
 * the sound with it. Up here, someone can start a recording and then go and
 * read the magazine while it plays.
 *
 * The queue is a single volume. Finishing a recording advances to the next one
 * in the same volume; finishing the last one simply stops, because rolling on
 * into a different volume's recordings would be a surprise. Which volume is
 * playing also decides the player's colour.
 *
 * `playing` is driven by the element's own play/pause events, not set
 * optimistically when a button is clicked, so the button can never claim to be
 * playing something that a blocked autoplay or a network error has stopped.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { nextIndex, previousIndex, seekTarget } from './queue';
import { recordingsFor, recordingUrl, type Recording } from '../data/recordings';

/** The recording currently loaded into the element, and where it came from. */
export type Track = {
  volume: number;
  /** Position within that volume's list. */
  index: number;
  recording: Recording;
  src: string;
};

type AudioPlayerValue = {
  current: Track | null;
  playing: boolean;
  currentTime: number;
  /** NaN until the browser has read the file's metadata. */
  duration: number;
  /** True for the one recording loaded right now, playing or paused. */
  isCurrent: (volume: number, index: number) => boolean;
  /** Loads a recording and starts it. */
  play: (volume: number, index: number) => void;
  /** "Play from the start" — the first recording of a volume. */
  playVolume: (volume: number) => void;
  /** What a list's play button does: pause if it is already playing, else start it. */
  togglePlay: (volume: number, index: number) => void;
  /** Play/pause the recording already loaded. */
  toggle: () => void;
  /** Skip by an offset in seconds, clamped to the file. */
  skip: (offset: number) => void;
  seekTo: (time: number) => void;
  next: () => void;
  previous: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  /** Stops playback and dismisses the player. */
  close: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number.NaN);

  /**
   * Start whatever was just selected. `current` is a fresh object on every
   * call to play(), so choosing the same recording again restarts it.
   * play() rejects if the browser blocks autoplay or the load is interrupted;
   * neither is an error worth showing, and the paused state is already right.
   */
  useEffect(() => {
    if (!current) return;
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(0);
    setDuration(Number.NaN);
    void el.play()?.catch(() => undefined);
  }, [current]);

  const play = useCallback((volume: number, index: number) => {
    const recording = recordingsFor(volume)[index];
    if (!recording) return;
    setCurrent({ volume, index, recording, src: recordingUrl(volume, recording) });
  }, []);

  const value = useMemo<AudioPlayerValue>(() => {
    const count = current ? recordingsFor(current.volume).length : 0;
    const after = current ? nextIndex(current.index, count) : null;
    const before = current ? previousIndex(current.index) : null;

    return {
      current,
      playing,
      currentTime,
      duration,
      isCurrent: (volume, index) =>
        current !== null && current.volume === volume && current.index === index,
      play,
      playVolume: (volume) => play(volume, 0),
      togglePlay: (volume, index) => {
        if (current && current.volume === volume && current.index === index) {
          const el = audioRef.current;
          if (el) {
            if (el.paused) void el.play()?.catch(() => undefined);
            else el.pause();
          }
          return;
        }
        play(volume, index);
      },
      toggle: () => {
        const el = audioRef.current;
        if (!el || !current) return;
        if (el.paused) void el.play()?.catch(() => undefined);
        else el.pause();
      },
      skip: (offset) => {
        const el = audioRef.current;
        if (!el) return;
        el.currentTime = seekTarget(el.currentTime, offset, el.duration);
        setCurrentTime(el.currentTime);
      },
      seekTo: (time) => {
        const el = audioRef.current;
        if (!el) return;
        el.currentTime = time;
        setCurrentTime(time);
      },
      next: () => {
        if (current && after !== null) play(current.volume, after);
      },
      previous: () => {
        if (current && before !== null) play(current.volume, before);
      },
      hasNext: after !== null,
      hasPrevious: before !== null,
      close: () => {
        audioRef.current?.pause();
        setCurrent(null);
        setPlaying(false);
        setCurrentTime(0);
        setDuration(Number.NaN);
      },
    };
  }, [current, currentTime, duration, play, playing]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {/*
        One element for the whole site, kept out of the layout. It is rendered
        even with nothing loaded so that the ref is there the instant the first
        recording is chosen.
      */}
      <audio
        ref={audioRef}
        src={current?.src}
        preload="metadata"
        data-testid="audio-element"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (!current) return;
          const after = nextIndex(current.index, recordingsFor(current.volume).length);
          if (after === null) setPlaying(false);
          else play(current.volume, after);
        }}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used inside an AudioPlayerProvider');
  return ctx;
}

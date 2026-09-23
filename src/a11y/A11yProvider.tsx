/**
 * Holds the visitor's display preferences, and puts them on the document.
 *
 * The provider owns the settings object; settings.ts owns the rules about what
 * it may contain and what it means. Everything the panel does to the page
 * happens through one effect below, which writes data-* attributes on to
 * <html>. a11y.css then does the actual work, keyed off those attributes.
 *
 * Mounted above the route table in App.tsx, for the same reason the audio
 * player is: a provider inside a route is unmounted on navigation, and the
 * visitor's settings would reset the moment they opened a volume.
 *
 * Preferences are stored in this browser and nowhere else. Nothing is sent
 * anywhere — the site has no backend to send it to.
 */
import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import {
  DEFAULT_SETTINGS,
  documentStateFor,
  isDefault,
  parseSettings,
  serializeSettings,
  stepCursorScale,
  stepFontScale,
  type A11ySettings,
} from './settings';

const STORAGE_KEY = 'qualia-typo:accessibility';

type A11yContextValue = {
  settings: A11ySettings;
  /** Changes one setting, leaving the rest alone. */
  set: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  /** Flips one of the on/off settings. */
  toggle: (key: 'underlineLinks' | 'dyslexiaFont' | 'textSpacing' | 'readingMask' | 'readingGuide') => void;
  zoomText: (direction: 1 | -1) => void;
  zoomCursor: (direction: 1 | -1) => void;
  reset: () => void;
  /** True when nothing has been changed, so Reset can be disabled. */
  untouched: boolean;
};

const A11yContext = createContext<A11yContextValue | null>(null);

/**
 * Reading storage is wrapped because it throws outright in a browser with site
 * data blocked, and in some private modes. Remembering a preference is a
 * convenience; failing to remember it is not an error worth breaking a page
 * over. The same reasoning as recallLanguage() in LanguageProvider.
 */
function recallSettings(): A11ySettings {
  try {
    return parseSettings(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function rememberSettings(settings: A11ySettings): void {
  try {
    if (isDefault(settings)) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, serializeSettings(settings));
  } catch {
    /* private mode, or site data blocked — ignore */
  }
}

export function A11yProvider({ children }: { children: ReactNode }) {
  // Read once, on the first render, so the page is never painted with the
  // site's defaults and then visibly corrected a frame later.
  const [settings, setSettings] = useState<A11ySettings>(recallSettings);

  /* The one place the settings reach the page. Attributes and custom
     properties whose value is null are removed rather than set to "null", so a
     visitor who has changed nothing has a completely untouched <html>. */
  useEffect(() => {
    const root = document.documentElement;
    const { attributes, cssVariables } = documentStateFor(settings);

    for (const [name, value] of Object.entries(attributes)) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
    for (const [name, value] of Object.entries(cssVariables)) {
      if (value === null) root.style.removeProperty(name);
      else root.style.setProperty(name, value);
    }

    rememberSettings(settings);
  }, [settings]);

  const value = useMemo<A11yContextValue>(() => {
    const set: A11yContextValue['set'] = (key, next) =>
      setSettings((current) => ({ ...current, [key]: next }));

    return {
      settings,
      set,
      toggle: (key) => setSettings((current) => ({ ...current, [key]: !current[key] })),
      zoomText: (direction) =>
        setSettings((current) => ({ ...current, fontScale: stepFontScale(current.fontScale, direction) })),
      zoomCursor: (direction) =>
        setSettings((current) => ({
          ...current,
          cursorScale: stepCursorScale(current.cursorScale, direction),
        })),
      reset: () => setSettings(DEFAULT_SETTINGS),
      untouched: isDefault(settings),
    };
  }, [settings]);

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y(): A11yContextValue {
  const context = useContext(A11yContext);
  if (!context) throw new Error('useA11y must be used inside an A11yProvider');
  return context;
}

/** Exported for the tests, which need to clear the stored preferences. */
export const A11Y_STORAGE_KEY = STORAGE_KEY;

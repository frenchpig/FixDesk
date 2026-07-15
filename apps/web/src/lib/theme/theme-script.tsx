import { THEME_STORAGE_KEY } from '@/themes/types';

/**
 * Evita flash de tema incorrecto antes de que hidrate React.
 */
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var key = ${JSON.stringify(THEME_STORAGE_KEY)};
        var raw = localStorage.getItem(key);
        var fallback = { themeId: 'minimal-professional', mode: 'light' };
        var pref = raw ? JSON.parse(raw) : fallback;
        var perf = pref.performanceMode === true;
        if (perf && pref.themeId === 'glassmorphism') {
          pref.themeId = 'minimal-professional';
        }
        document.documentElement.setAttribute('data-theme', pref.themeId || fallback.themeId);
        document.documentElement.setAttribute('data-mode', pref.mode || fallback.mode);
        document.documentElement.setAttribute('data-performance-mode', perf ? 'true' : 'false');
        document.documentElement.style.colorScheme = pref.mode || fallback.mode;
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

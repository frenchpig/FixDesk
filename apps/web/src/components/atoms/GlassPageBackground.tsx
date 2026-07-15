'use client';

import { useTheme } from '@/lib/theme/theme-provider';
import type { ColorMode } from '@/themes/types';

function GlassBlobs() {
  return (
    <>
      <div className="glass-page-bg__blob glass-page-bg__blob--1" />
      <div className="glass-page-bg__blob glass-page-bg__blob--2" />
      <div className="glass-page-bg__blob glass-page-bg__blob--3" />
    </>
  );
}

export function GlassPageBackground() {
  const { themeId } = useTheme();

  if (themeId !== 'glassmorphism') {
    return null;
  }

  return (
    <div aria-hidden className="glass-page-bg pointer-events-none fixed inset-0 -z-10">
      <GlassBlobs />
    </div>
  );
}

export function GlassPageBackgroundPreview({ mode }: { mode: ColorMode }) {
  return (
    <div
      aria-hidden
      className="glass-page-bg glass-page-bg--contained"
      data-mode={mode}
    >
      <GlassBlobs />
    </div>
  );
}

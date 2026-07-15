'use client';

import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import { AppearanceSettings } from '@/components/organisms/AppearanceSettings';

export default function AparienciaPage() {
  return (
    <AuthGuard>
      <AppLayout title="Configuración · Apariencia">
        <AppearanceSettings />
      </AppLayout>
    </AuthGuard>
  );
}

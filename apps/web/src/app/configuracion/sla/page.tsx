'use client';

import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import { SlaSettingsForm } from '@/components/organisms/SlaSettingsForm';

export default function SlaConfigPage() {
  return (
    <AuthGuard roles={['ADMIN']}>
      <AppLayout title="Configuración · SLA">
        <SlaSettingsForm />
      </AppLayout>
    </AuthGuard>
  );
}

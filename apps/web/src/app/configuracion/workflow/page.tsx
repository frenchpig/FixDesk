'use client';

import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import { WorkflowSettingsForm } from '@/components/organisms/WorkflowSettingsForm';

export default function WorkflowConfigPage() {
  return (
    <AuthGuard roles={['ADMIN']}>
      <AppLayout title="Configuración · Workflow">
        <WorkflowSettingsForm />
      </AppLayout>
    </AuthGuard>
  );
}

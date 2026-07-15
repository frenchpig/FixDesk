'use client';

import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { TicketForm } from '@/components/organisms/TicketForm';

export default function ReportarPage() {
  return (
    <AuthGuard>
      <AppLayout title="Nuevo reporte">
        <AnimatedPage className="mx-auto max-w-2xl">
          <AnimatedSection delay={1}>
            <TicketForm />
          </AnimatedSection>
        </AnimatedPage>
      </AppLayout>
    </AuthGuard>
  );
}

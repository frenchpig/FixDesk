'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import { DashboardViewNav } from '@/components/molecules/DashboardViewNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={['TECHNICIAN', 'ADMIN']}>
      <AppLayout title="Panel del técnico">
        <div className="space-y-6">
          <DashboardViewNav />
          {children}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

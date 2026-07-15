'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/types';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  roles?: Role[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === 'TECHNICIAN' ? '/dashboard' : '/mis-tickets');
    }
  }, [user, isLoading, roles, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}

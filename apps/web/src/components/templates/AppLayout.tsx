import { AppHeader } from '@/components/organisms/AppHeader';
import { Sidebar } from '@/components/organisms/Sidebar';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export function AppLayout({
  children,
  title,
  showSidebar = true,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title={title} />
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { WorkflowProvider } from '@/lib/workflow-context';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { ThemeScript } from '@/lib/theme/theme-script';
import { GlassPageBackground } from '@/components/atoms/GlassPageBackground';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FixDesk — Gestión de incidencias',
  description: 'Sistema de reporte y seguimiento de problemas de infraestructura',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <GlassPageBackground />
          <AuthProvider>
            <WorkflowProvider>{children}</WorkflowProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

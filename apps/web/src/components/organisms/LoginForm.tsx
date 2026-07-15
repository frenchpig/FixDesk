'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FormField } from '@/components/molecules/FormField';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/types';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const res = await api.post<{
        data: { accessToken: string; user: User };
      }>('/auth/login', { email, password });

      login(res.data.accessToken, res.data.user);

      if (res.data.user.role === 'TECHNICIAN' || res.data.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/mis-tickets');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <Text variant="h2" className="mb-2 text-center">
        Iniciar sesión
      </Text>
      <Text variant="muted" className="mb-6 text-center">
        Accede a FixDesk para reportar o gestionar incidencias
      </Text>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Correo" htmlFor="email">
          <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
        </FormField>

        <FormField label="Contraseña" htmlFor="password">
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </FormField>

        {error && (
          <Text variant="caption" className="text-danger text-center">
            {error}
          </Text>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-6 space-y-1 text-center">
        <Text variant="caption" className="block font-medium text-muted">
          Cuentas demo
        </Text>
        <Text variant="caption" className="block">
          Usuario: usuario@fixdesk.dev / fixdesk123
        </Text>
        <Text variant="caption" className="block">
          Técnico: tecnico@fixdesk.dev / fixdesk123
        </Text>
      </div>
    </Card>
  );
}

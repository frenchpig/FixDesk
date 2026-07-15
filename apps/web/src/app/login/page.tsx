import { LoginForm } from '@/components/organisms/LoginForm';
import { Text } from '@/components/atoms/Text';
import { Wrench } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="flex items-center gap-3">
        <Wrench className="text-primary" size={32} />
        <Text as="h1" variant="h1">
          FixDesk
        </Text>
      </div>
      <LoginForm />
    </div>
  );
}

// Responsabilidad: mostrar adjunto del ticket (placeholder o enlace real)
// Usado por: detalle dashboard y mis-tickets
// NO hace: fetch de blobs ni upload
import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import {
  getPlaceholderFilename,
  isPlaceholderPhotoUrl,
} from '@/lib/photo-placeholder';

interface TicketAttachmentPreviewProps {
  photoUrl?: string | null;
}

export function TicketAttachmentPreview({
  photoUrl,
}: TicketAttachmentPreviewProps) {
  if (!photoUrl) return null;

  const placeholder = isPlaceholderPhotoUrl(photoUrl);
  const filename = placeholder
    ? getPlaceholderFilename(photoUrl)
    : photoUrl;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="h3">Adjunto</Text>
        {placeholder && <Badge variant="warning">Simulado</Badge>}
      </div>

      {placeholder ? (
        <div className="flex items-start gap-3 rounded-theme border border-border bg-surface-secondary p-3">
          <ImageIcon
            size={28}
            className="mt-0.5 shrink-0 text-muted"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <Text variant="body" className="truncate font-medium">
              {filename}
            </Text>
            <Text variant="caption">
              Adjunto simulado: no hay imagen almacenada en este entorno.
            </Text>
          </div>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa opcional
        <img
          src={photoUrl}
          alt="Adjunto del ticket"
          className="max-h-64 w-full rounded-theme object-contain border border-border"
        />
      )}
    </Card>
  );
}

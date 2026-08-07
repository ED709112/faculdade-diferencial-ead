'use client';

import { useParams } from 'next/navigation';
import MessagesPanel from '@/components/messages/MessagesPanel';

export default function ProfessorMessagePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <MessagesPanel
      key={Number.isFinite(id) ? id : 'default'}
      role="teacher"
      initialConversationId={Number.isFinite(id) ? id : undefined}
    />
  );
}

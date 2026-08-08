'use client';

import { useParams } from 'next/navigation';
import MessagesPanel from '@/components/messages/MessagesPanel';
import StudentComposer from '@/components/messages/StudentComposer';

export default function AlunoMessagePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <MessagesPanel
      key={Number.isFinite(id) ? id : 'default'}
      role="student"
      initialConversationId={Number.isFinite(id) ? id : undefined}
      composePanel={<StudentComposer />}
    />
  );
}

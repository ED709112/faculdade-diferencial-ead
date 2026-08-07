'use client';

import { useParams } from 'next/navigation';
import MessagesPanel from '@/components/messages/MessagesPanel';
import AdminComposer from '@/components/messages/AdminComposer';

export default function AdminMessagePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <MessagesPanel
      key={Number.isFinite(id) ? id : 'default'}
      role="admin"
      initialConversationId={Number.isFinite(id) ? id : undefined}
      composePanel={<AdminComposer />}
    />
  );
}

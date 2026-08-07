'use client';

import MessagesPanel from '@/components/messages/MessagesPanel';
import AdminComposer from '@/components/messages/AdminComposer';

export default function AdminMessagesPage() {
  return (
    <MessagesPanel
      role="admin"
      composePanel={<AdminComposer />}
    />
  );
}

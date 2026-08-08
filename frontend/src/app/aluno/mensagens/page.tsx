'use client';

import MessagesPanel from '@/components/messages/MessagesPanel';
import StudentComposer from '@/components/messages/StudentComposer';

export default function AlunoMessagesPage() {
  return (
    <MessagesPanel
      role="student"
      composePanel={<StudentComposer />}
    />
  );
}

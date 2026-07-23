'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDisciplinesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/aluno/cursos'); }, [router]);
  return null;
}

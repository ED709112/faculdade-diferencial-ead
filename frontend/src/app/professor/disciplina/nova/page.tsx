'use client';

import React from 'react';
import Link from 'next/link';
import { FiLock, FiArrowLeft } from 'react-icons/fi';

export default function NewDisciplinePage() {
  return (
    <div className="max-w-xl mx-auto">
      <Link href="/professor/disciplinas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <FiArrowLeft /> Voltar para Minhas Disciplinas
      </Link>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <FiLock className="text-2xl text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Criação de disciplinas é exclusiva do administrador</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          O administrador cria as disciplinas dos cursos e lota o professor responsável por cada uma.
          Quando você for lotado, a disciplina aparecerá automaticamente em{" "}
          <Link href="/professor/disciplinas" className="text-primary-500 font-medium hover:underline">
            Minhas Disciplinas
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

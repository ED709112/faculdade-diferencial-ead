'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiHelpCircle,
  FiAward,
  FiPlay,
  FiExternalLink,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number | null;
  passing_grade: number;
  max_attempts: number;
  questions_count: number;
  attempts?: {
    total: number;
    best_score: number | null;
    passed: number | null;
  };
}

interface Props {
  courseId: string;
}

export default function QuizTab({ courseId }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(data);
    } catch {
      toast.error('Erro ao carregar avaliações.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const getStatusBadge = (quiz: Quiz) => {
    if (quiz.attempts?.passed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <FiCheckCircle className="w-3 h-3" /> Aprovado
        </span>
      );
    }
    if ((quiz.attempts?.total || 0) >= quiz.max_attempts) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <FiXCircle className="w-3 h-3" /> Esgotado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <FiHelpCircle className="w-3 h-3" /> Disponível
      </span>
    );
  };

  const canAttempt = (quiz: Quiz): boolean => {
    return (quiz.attempts?.total || 0) < quiz.max_attempts && !quiz.attempts?.passed;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-gray-500 dark:text-gray-400">
        Carregando avaliações...
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <FiHelpCircle className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma avaliação disponível</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            As avaliações do curso aparecerão aqui quando estiverem disponíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FiAward /> Avaliações do Curso
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Complete as avaliações para progredir no curso e obter o certificado.
      </p>

      <div className="grid gap-4">
        {quizzes.map((quiz) => {
          const passed = !!quiz.attempts?.passed;
          const attemptsUsed = quiz.attempts?.total || 0;
          const bestScore = quiz.attempts?.best_score;
          const available = canAttempt(quiz);

          return (
            <div
              key={quiz.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 transition-all ${
                passed ? 'ring-2 ring-green-200 dark:ring-green-800' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                    {getStatusBadge(quiz)}
                  </div>

                  {quiz.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{quiz.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FiHelpCircle className="text-xs" /> {quiz.questions_count} questões
                    </span>
                    {quiz.time_limit_minutes && (
                      <span className="flex items-center gap-1">
                        <FiClock className="text-xs" /> {quiz.time_limit_minutes} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiAward className="text-xs" /> Nota mínima: {quiz.passing_grade}%
                    </span>
                    <span>
                      Tentativas: {attemptsUsed}/{quiz.max_attempts}
                    </span>
                    {bestScore !== null && bestScore !== undefined && (
                      <span className={`font-semibold ${passed ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        Melhor nota: {Math.round(Number(bestScore))}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {passed ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium">
                      <FiCheckCircle className="text-sm" /> Aprovado
                    </span>
                  ) : available ? (
                    <Link
                      href={`/aluno/curso/${courseId}/avaliacoes`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FiPlay className="text-sm" /> Iniciar
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
                      Sem tentativas
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

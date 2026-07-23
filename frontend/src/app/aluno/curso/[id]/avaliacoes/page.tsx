'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowLeft,
  FiArrowRight,
  FiSend,
  FiAward,
  FiPlay,
  FiRotateCcw,
  FiHelpCircle,
} from 'react-icons/fi';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: QuizOption[];
  points: number;
  explanation?: string;
}

interface QuizAttempt {
  attempt_id: string;
  score: number;
  is_passed: boolean;
  total_points: number;
  time_spent_seconds: number;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  question_count: number;
  passing_grade: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  attempts_used: number;
  best_score: number | null;
  is_passed: boolean;
  last_attempt?: QuizAttempt;
}

interface StartResponse {
  attempt_id: string;
  questions: QuizQuestion[];
  time_limit_minutes: number | null;
}

interface SubmitResponse {
  score: number;
  is_passed: boolean;
  total_points: number;
}

interface ResultQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: QuizOption[];
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  points: number;
  points_earned: number;
  explanation?: string;
}

interface ResultResponse {
  attempt: QuizAttempt;
  questions: ResultQuestion[];
}

type ViewState = 'list' | 'taking' | 'results';

export default function AvaliacoesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [viewState, setViewState] = useState<ViewState>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const [resultData, setResultData] = useState<ResultResponse | null>(null);
  const [resultQuiz, setResultQuiz] = useState<Quiz | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(response.data);
    } catch {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          toast.error('Tempo esgotado! Enviando respostas automaticamente...');
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining !== null && timeRemaining > 0 ? 'active' : 'inactive']);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const canAttempt = (quiz: Quiz): boolean => {
    return quiz.attempts_used < quiz.max_attempts && !quiz.is_passed;
  };

  const getStatusBadge = (quiz: Quiz) => {
    if (quiz.is_passed) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <FiCheckCircle className="w-3 h-3" />
          Aprovado
        </span>
      );
    }
    if (quiz.attempts_used >= quiz.max_attempts && !quiz.is_passed) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <FiXCircle className="w-3 h-3" />
          Reprovado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <FiHelpCircle className="w-3 h-3" />
        Disponível
      </span>
    );
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      setLoading(true);
      const response = await api.post(`/quizzes/${quiz.id}/start`);
      const data: StartResponse = response.data;

      setCurrentQuiz(quiz);
      setAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers({});
      setShowConfirmSubmit(false);

      if (data.time_limit_minutes && data.time_limit_minutes > 0) {
        setTimeRemaining(data.time_limit_minutes * 60);
      } else {
        setTimeRemaining(null);
      }

      setViewState('taking');
      toast.success('Avaliação iniciada! Boa sorte!');
    } catch {
      toast.error('Erro ao iniciar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const fetchResults = async (quizId: string, attId: string) => {
    try {
      const response = await api.get(`/quizzes/${quizId}/results/${attId}`);
      setResultData(response.data);
    } catch {
      toast.error('Erro ao carregar resultados');
    }
  };

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!currentQuiz || !attemptId) return;

      const unansweredCount = questions.length - Object.keys(answers).length;
      if (!autoSubmit && unansweredCount > 0) {
        setShowConfirmSubmit(true);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      try {
        setSubmitting(true);
        const formattedAnswers = questions.map((q) => ({
          question_id: q.id,
          answer: answers[q.id] || '',
        }));

        const response = await api.post(`/quizzes/${currentQuiz.id}/submit`, {
          attempt_id: attemptId,
          answers: formattedAnswers,
          time_spent_seconds: timeRemaining !== null ? (currentQuiz.time_limit_minutes || 0) * 60 - timeRemaining : null,
        });

        const submitData: SubmitResponse = response.data;

        toast.success(
          submitData.is_passed
            ? 'Parabéns! Você foi aprovado!'
            : 'Avaliação enviada.'
        );

        await fetchResults(currentQuiz.id, attemptId);

        setViewState('results');
      } catch {
        toast.error('Erro ao enviar respostas');
      } finally {
        setSubmitting(false);
        setShowConfirmSubmit(false);
      }
    },
    [currentQuiz, attemptId, questions, answers, fetchResults]
  );

  const handleViewResults = async (quiz: Quiz) => {
    if (!quiz.last_attempt) {
      toast.error('Nenhum resultado disponível');
      return;
    }
    try {
      setLoading(true);
      setResultQuiz(quiz);
      await fetchResults(quiz.id, quiz.last_attempt.attempt_id);
      setViewState('results');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (quiz: Quiz) => {
    setViewState('list');
    setResultData(null);
    setResultQuiz(null);
    setCurrentQuiz(null);
    setAttemptId(null);
    setQuestions([]);
    handleStartQuiz(quiz);
  };

  const handleBackToList = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setViewState('list');
    setResultData(null);
    setResultQuiz(null);
    setCurrentQuiz(null);
    setAttemptId(null);
    setQuestions([]);
    setTimeRemaining(null);
    setShowConfirmSubmit(false);
    fetchQuizzes();
  };

  const handleScrollToQuestion = (index: number) => {
    setCurrentIndex(index);
    const el = document.getElementById(`question-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading && viewState === 'list') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (viewState === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#1a56db] mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Avaliações</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Responda as avaliações do curso para ser avaliado
          </p>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={<FiHelpCircle className="w-12 h-12 text-gray-400" />}
              title="Nenhuma avaliação disponível"
              description="Ainda não há avaliações publicadas para este curso."
            />
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {quiz.title}
                        </h2>
                        {getStatusBadge(quiz)}
                      </div>

                      {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          {quiz.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiHelpCircle className="w-4 h-4" />
                          {quiz.question_count} perguntas
                        </span>
                        <span className="flex items-center gap-1">
                          <FiAward className="w-4 h-4" />
                          Nota mínima: {quiz.passing_grade}%
                        </span>
                        <span className="flex items-center gap-1">
                          <FiRotateCcw className="w-4 h-4" />
                          {quiz.attempts_used}/{quiz.max_attempts} tentativas
                        </span>
                        {quiz.time_limit_minutes && (
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {quiz.time_limit_minutes} min
                          </span>
                        )}
                        {quiz.best_score !== null && (
                          <span className="flex items-center gap-1 font-semibold text-[#1a56db]">
                            <FiAward className="w-4 h-4" />
                            Melhor nota: {quiz.best_score}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {canAttempt(quiz) ? (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          <FiPlay className="w-4 h-4" />
                          Iniciar
                        </button>
                      ) : (
                        quiz.last_attempt && (
                          <button
                            onClick={() => handleViewResults(quiz)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                            Ver Resultados
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'taking') {
    const totalAnswered = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const progress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToList}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {currentQuiz?.title}
                </h1>
              </div>

              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                    timeRemaining <= 60
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : timeRemaining <= 300
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-50 text-[#1a56db]'
                  }`}
                >
                  <FiClock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-[#1a56db] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalAnswered} de {totalQuestions} respondidas
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                id={`question-${index}`}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-6 transition-all duration-200 ${
                  index === currentIndex
                    ? 'border-[#1a56db]'
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                } ${answers[question.id] ? 'border-l-4 border-l-green-400' : ''}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      answers[question.id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#1a56db]/10 text-[#1a56db]'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{question.text}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 inline-block">
                      {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  {question.type === 'true_false' ? (
                    <div className="flex gap-4">
                      {['Verdadeiro', 'Falso'].map((option) => (
                        <label
                          key={option}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[question.id] === option
                              ? 'border-[#1a56db] bg-[#1a56db]/5 text-[#1a56db]'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={() => handleAnswer(question.id, option)}
                            className="sr-only"
                          />
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              answers[question.id] === option
                                ? 'border-[#1a56db]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {answers[question.id] === option && (
                              <span className="w-2 h-2 rounded-full bg-[#1a56db]" />
                            )}
                          </span>
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[question.id] === option.id
                              ? 'border-[#1a56db] bg-[#1a56db]/5'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={answers[question.id] === option.id}
                            onChange={() => handleAnswer(question.id, option.id)}
                            className="sr-only"
                          />
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              answers[question.id] === option.id
                                ? 'border-[#1a56db]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {answers[question.id] === option.id && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#1a56db]" />
                            )}
                          </span>
                          <span className="text-gray-700 dark:text-gray-200">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pb-8">
            <button
              onClick={() =>
                handleScrollToQuestion(Math.max(0, currentIndex - 1))
              }
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-xs">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => handleScrollToQuestion(i)}
                    className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                      i === currentIndex
                        ? 'bg-[#1a56db] text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  handleScrollToQuestion(
                    Math.min(questions.length - 1, currentIndex + 1)
                  )
                }
                disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 -mx-4 px-4">
            <div className="max-w-4xl mx-auto flex justify-center">
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                <FiSend className="w-5 h-5" />
                {submitting ? 'Enviando...' : 'Enviar Respostas'}
              </button>
            </div>
          </div>
        </div>

        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Confirmar envio
              </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                {totalAnswered < totalQuestions
                  ? `Você respondeu ${totalAnswered} de ${totalQuestions} perguntas. Deseja enviar mesmo assim?`
                  : 'Todas as perguntas foram respondidas. Deseja enviar?'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Confirmar Envio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewState === 'results' && resultData) {
    const displayQuiz = resultQuiz || currentQuiz;
    const attempt = resultData.attempt;
    const correctCount = resultData.questions.filter((q) => q.is_correct).length;
    const totalPoints = resultData.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = resultData.questions.reduce(
      (sum, q) => sum + q.points_earned,
      0
    );
    const canRetryNow =
      displayQuiz && !resultData.attempt.is_passed && displayQuiz.attempts_used < displayQuiz.max_attempts;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#1a56db] mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar para avaliações</span>
          </button>

          <div
            className={`rounded-xl p-6 mb-8 text-center ${
              attempt.is_passed
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className="flex justify-center mb-3">
              {attempt.is_passed ? (
                <FiCheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <FiXCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {attempt.is_passed ? 'Parabéns! Você foi aprovado!' : 'Não atingiu a nota mínima'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {displayQuiz?.title}
            </p>

            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1a56db]">
                  {attempt.score}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nota</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#f97316]">
                  {earnedPoints}/{totalPoints}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pontos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">
                  {correctCount}/{resultData.questions.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Corretas</p>
              </div>
              {attempt.time_spent_seconds > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">
                    {formatTime(attempt.time_spent_seconds)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tempo</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {displayQuiz?.passing_grade}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nota mínima</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Revisão das Respostas
          </h3>

          <div className="space-y-4 mb-8">
            {resultData.questions.map((q, index) => (
              <div
                key={q.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-6 ${
                  q.is_correct ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      q.is_correct
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {q.is_correct ? (
                      <FiCheckCircle className="w-4 h-4" />
                    ) : (
                      <FiXCircle className="w-4 h-4" />
                    )}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        <span className="text-gray-400 dark:text-gray-500 mr-1">#{index + 1}</span>
                        {q.text}
                      </p>
                      <span
                        className={`flex-shrink-0 text-sm font-semibold ${
                          q.is_correct ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {q.points_earned}/{q.points} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-11 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Sua resposta:</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        q.is_correct
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {q.user_answer
                        ? q.options.length > 0
                          ? q.options.find((o) => o.id === q.user_answer)?.text ||
                            q.user_answer
                          : q.user_answer
                        : 'Não respondida'}
                    </span>
                  </div>

                  {!q.is_correct && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        Resposta correta:
                      </span>
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                        {q.options.length > 0
                          ? q.options.find((o) => o.id === q.correct_answer)
                              ?.text || q.correct_answer
                          : q.correct_answer}
                      </span>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-blue-800">
                      <span className="font-medium">Explicação: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 pb-8">
            {canRetryNow && displayQuiz && (
              <button
                onClick={() => handleRetry(displayQuiz)}
                className="flex items-center gap-2 px-6 py-3 bg-[#1a56db] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <FiRotateCcw className="w-5 h-5" />
                Tentar Novamente
              </button>
            )}
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              Voltar para Avaliações
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

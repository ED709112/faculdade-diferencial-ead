'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheckSquare,
  FiClock,
  FiHelpCircle,
  FiArrowLeft,
} from 'react-icons/fi';

interface QuizQuestionOption {
  id?: number;
  label: string;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id?: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: QuizQuestionOption[];
  points: number;
  explanation: string;
  sort_order: number;
}

interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_grade: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_answers_after: 'after_submit' | 'never';
  is_active: boolean;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

interface QuizFormData {
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_grade: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_answers_after: 'after_submit' | 'never';
}

interface QuestionFormData {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: QuizQuestionOption[];
  points: number;
  explanation: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const defaultQuizForm: QuizFormData = {
  title: '',
  description: '',
  time_limit_minutes: 120,
  passing_grade: 60,
  max_attempts: 3,
  shuffle_questions: false,
  show_answers_after: 'after_submit',
};

const defaultQuestionForm: QuestionFormData = {
  question_text: '',
  question_type: 'multiple_choice',
  options: [
    { label: 'A', text: '', is_correct: true },
    { label: 'B', text: '', is_correct: false },
  ],
  points: 1,
  explanation: '',
};

export default function AvaliacoesPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizFormData>(defaultQuizForm);

  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [quizDetail, setQuizDetail] = useState<Quiz | null>(null);
  const [quizDetailLoading, setQuizDetailLoading] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>(defaultQuestionForm);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(data.quizzes || data.data || data || []);
    } catch {
      toast.error('Erro ao carregar avaliações.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const fetchQuizDetail = async (quizId: number) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      setQuizDetail(null);
      return;
    }
    try {
      setQuizDetailLoading(true);
      const { data } = await api.get(`/quizzes/${quizId}`);
      setQuizDetail(data.quiz || data);
      setExpandedQuizId(quizId);
    } catch {
      toast.error('Erro ao carregar detalhes da avaliação.');
    } finally {
      setQuizDetailLoading(false);
    }
  };

  const openCreateQuizModal = () => {
    setEditingQuiz(null);
    setQuizForm(defaultQuizForm);
    setShowQuizModal(true);
  };

  const openEditQuizModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || '',
      time_limit_minutes: quiz.time_limit_minutes || 0,
      passing_grade: quiz.passing_grade,
      max_attempts: quiz.max_attempts,
      shuffle_questions: quiz.shuffle_questions,
      show_answers_after: quiz.show_answers_after,
    });
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error('O título da avaliação é obrigatório.');
      return;
    }
    if (quizForm.passing_grade < 0 || quizForm.passing_grade > 100) {
      toast.error('A nota de aprovação deve estar entre 0 e 100.');
      return;
    }
    if (quizForm.max_attempts < 1) {
      toast.error('O número máximo de tentativas deve ser pelo menos 1.');
      return;
    }
    try {
      setSavingQuiz(true);
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, {
          ...quizForm,
        });
        toast.success('Avaliação atualizada com sucesso!');
      } else {
        await api.post('/quizzes', {
          course_id: Number(courseId),
          ...quizForm,
        });
        toast.success('Avaliação criada com sucesso!');
      }
      setShowQuizModal(false);
      fetchQuizzes();
      if (expandedQuizId && editingQuiz && editingQuiz.id === expandedQuizId) {
        fetchQuizDetail(editingQuiz.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar avaliação.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Avaliação excluída com sucesso!');
      if (expandedQuizId === quizId) {
        setExpandedQuizId(null);
        setQuizDetail(null);
      }
      fetchQuizzes();
    } catch {
      toast.error('Erro ao excluir avaliação.');
    }
  };

  const handleToggleActive = async (quiz: Quiz) => {
    try {
      await api.put(`/quizzes/${quiz.id}`, {
        is_active: !quiz.is_active,
      });
      toast.success(quiz.is_active ? 'Avaliação desativada.' : 'Avaliação ativada.');
      fetchQuizzes();
      if (expandedQuizId === quiz.id) {
        fetchQuizDetail(quiz.id);
      }
    } catch {
      toast.error('Erro ao alterar status da avaliação.');
    }
  };

  const openAddQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({ ...defaultQuestionForm });
    setShowQuestionForm(true);
  };

  const openEditQuestionForm = (question: QuizQuestion) => {
    setEditingQuestion(question);
    if (question.question_type === 'true_false') {
      setQuestionForm({
        question_text: question.question_text,
        question_type: 'true_false',
        options: question.options.length > 0 ? question.options : [
          { label: 'A', text: 'Verdadeiro', is_correct: true },
          { label: 'B', text: 'Falso', is_correct: false },
        ],
        points: question.points,
        explanation: question.explanation || '',
      });
    } else {
      const opts = (question.options || []).map((o, i) => ({
        ...o,
        label: OPTION_LABELS[i],
      }));
      setQuestionForm({
        question_text: question.question_text,
        question_type: question.question_type,
        options: opts.length >= 2 ? opts : defaultQuestionForm.options,
        points: question.points,
        explanation: question.explanation || '',
      });
    }
    setShowQuestionForm(true);
  };

  const closeQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm(defaultQuestionForm);
  };

  const handleQuestionTypeChange = (type: 'multiple_choice' | 'true_false') => {
    if (type === 'true_false') {
      setQuestionForm((prev) => ({
        ...prev,
        question_type: 'true_false',
        options: [
          { label: 'A', text: 'Verdadeiro', is_correct: true },
          { label: 'B', text: 'Falso', is_correct: false },
        ],
      }));
    } else {
      setQuestionForm((prev) => ({
        ...prev,
        question_type: 'multiple_choice',
        options: [
          { label: 'A', text: '', is_correct: true },
          { label: 'B', text: '', is_correct: false },
        ],
      }));
    }
  };

  const updateOptionText = (index: number, text: string) => {
    setQuestionForm((prev) => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], text };
      return { ...prev, options: opts };
    });
  };

  const setCorrectOption = (index: number) => {
    setQuestionForm((prev) => {
      const opts = prev.options.map((o, i) => ({
        ...o,
        is_correct: i === index,
      }));
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    if (questionForm.options.length >= 6) {
      toast.error('Máximo de 6 alternativas permitidas.');
      return;
    }
    const nextIndex = questionForm.options.length;
    setQuestionForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { label: OPTION_LABELS[nextIndex], text: '', is_correct: false },
      ],
    }));
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) {
      toast.error('Mínimo de 2 alternativas necessárias.');
      return;
    }
    setQuestionForm((prev) => {
      const opts = prev.options.filter((_, i) => i !== index);
      const relabeled = opts.map((o, i) => ({ ...o, label: OPTION_LABELS[i] }));
      if (!relabeled.some((o) => o.is_correct)) {
        relabeled[0].is_correct = true;
      }
      return { ...prev, options: relabeled };
    });
  };

  const handleSaveQuestion = async () => {
    if (!quizDetail) return;
    if (!questionForm.question_text.trim()) {
      toast.error('O texto da questão é obrigatório.');
      return;
    }
    if (questionForm.points < 0.5) {
      toast.error('Os pontos devem ser pelo menos 0.5.');
      return;
    }
    const validOptions = questionForm.options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      toast.error('Preencha pelo menos 2 alternativas com texto.');
      return;
    }
    if (!questionForm.options.some((o) => o.is_correct)) {
      toast.error('Selecione a resposta correta.');
      return;
    }

    const payload = {
      ...quizDetail,
      questions: quizDetail.questions
        .filter((q) => editingQuestion && q.id === editingQuestion.id ? false : true)
        .map((q, i) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          points: q.points,
          explanation: q.explanation || '',
          sort_order: i + 1,
        })),
    };

    const newQuestion = {
      id: undefined,
      question_text: questionForm.question_text,
      question_type: questionForm.question_type,
      options: questionForm.options.filter((o) => o.text.trim()),
      points: questionForm.points,
      explanation: questionForm.explanation,
      sort_order: (quizDetail.questions.filter((q) => editingQuestion && q.id === editingQuestion.id ? false : true).length) + 1,
    };

    payload.questions.push(newQuestion);

    try {
      setSavingQuestion(true);
      await api.put(`/quizzes/${quizDetail.id}`, payload);
      toast.success(editingQuestion ? 'Questão atualizada!' : 'Questão adicionada!');
      closeQuestionForm();
      fetchQuizDetail(quizDetail.id);
      fetchQuizzes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar questão.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!quizDetail) return;
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return;

    const remaining = quizDetail.questions
      .filter((q) => q.id !== questionId)
      .map((q, i) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        points: q.points,
        explanation: q.explanation || '',
        sort_order: i + 1,
      }));

    try {
      await api.put(`/quizzes/${quizDetail.id}`, {
        ...quizDetail,
        questions: remaining,
      });
      toast.success('Questão excluída!');
      fetchQuizDetail(quizDetail.id);
      fetchQuizzes();
    } catch {
      toast.error('Erro ao excluir questão.');
    }
  };

  const moveQuestion = async (questionId: number, direction: 'up' | 'down') => {
    if (!quizDetail) return;
    const questions = [...quizDetail.questions];
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    [questions[idx], questions[swapIdx]] = [questions[swapIdx], questions[idx]];
    const reordered = questions.map((q, i) => ({ ...q, sort_order: i + 1 }));

    const payload = {
      ...quizDetail,
      questions: reordered.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        points: q.points,
        explanation: q.explanation || '',
        sort_order: q.sort_order,
      })),
    };

    try {
      await api.put(`/quizzes/${quizDetail.id}`, payload);
      setQuizDetail({ ...quizDetail, questions: reordered });
    } catch {
      toast.error('Erro ao reordenar questões.');
    }
  };

  const getTotalPoints = (questions: QuizQuestion[]) =>
    questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) return <Loading text="Carregando avaliações..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/professor/curso/${courseId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiArrowLeft className="text-xl text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Avaliações</h2>
          <p className="text-gray-500 text-sm">Crie e gerencie quizzes e provas do curso</p>
        </div>
        <button
          onClick={openCreateQuizModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a56db] text-white rounded-xl text-sm font-medium hover:bg-[#1648b8] transition-colors shadow-md shadow-blue-200"
        >
          <FiPlus className="text-lg" />
          Nova Avaliação
        </button>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <EmptyState
            icon={<FiCheckSquare className="text-3xl text-[#1a56db]" />}
            title="Nenhuma avaliação criada"
            description="Crie avaliações para testar o conhecimento dos alunos neste curso."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            >
              {/* Quiz Card */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => fetchQuizDetail(quiz.id)}
                        className="font-semibold text-gray-900 text-lg hover:text-[#1a56db] transition-colors text-left truncate"
                      >
                        {quiz.title}
                      </button>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          quiz.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {quiz.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <FiHelpCircle className="text-[#1a56db]" />
                        {quiz.questions?.length || 0} questão{(quiz.questions?.length || 0) !== 1 ? 'ões' : ''}
                        {quiz.questions?.length > 0 && (
                          <span className="text-gray-400">({getTotalPoints(quiz.questions)} pts)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiCheckSquare className="text-[#f97316]" />
                        Nota mínima: {quiz.passing_grade}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock className="text-gray-400" />
                        {quiz.time_limit_minutes > 0
                          ? `${quiz.time_limit_minutes} min`
                          : 'Sem limite'}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-400">
                        {quiz.max_attempts} tentativa{quiz.max_attempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => fetchQuizDetail(quiz.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a56db] transition-colors"
                      title="Gerenciar questões"
                    >
                      <FiHelpCircle className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(quiz)}
                      className={`p-2 rounded-lg transition-colors ${
                        quiz.is_active
                          ? 'hover:bg-yellow-50 text-yellow-500 hover:text-yellow-600'
                          : 'hover:bg-green-50 text-green-500 hover:text-green-600'
                      }`}
                      title={quiz.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <FiCheckSquare className="text-lg" />
                    </button>
                    <button
                      onClick={() => openEditQuizModal(quiz)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a56db] transition-colors"
                      title="Editar avaliação"
                    >
                      <FiEdit2 className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir avaliação"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Quiz Detail */}
              {expandedQuizId === quiz.id && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {quizDetailLoading ? (
                    <Loading fullScreen={false} text="Carregando questões..." />
                  ) : quizDetail ? (
                    <div className="p-5 space-y-4">
                      {/* Quiz Info Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">Questões</h4>
                          <span className="text-sm text-gray-500">
                            {quizDetail.questions?.length || 0}_questão{(quizDetail.questions?.length || 0) !== 1 ? 'ões' : ''}
                          </span>
                          {quizDetail.shuffle_questions && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              Embaralhar
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {quizDetail.show_answers_after === 'after_submit'
                              ? 'Mostra respostas ao enviar'
                              : 'Nunca mostra respostas'}
                          </span>
                        </div>
                        <button
                          onClick={openAddQuestionForm}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1648b8] transition-colors"
                        >
                          <FiPlus />
                          Adicionar Questão
                        </button>
                      </div>

                      {/* Question Form */}
                      {showQuestionForm && (
                        <div className="bg-white rounded-xl border-2 border-[#1a56db]/20 p-5 space-y-5">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">
                              {editingQuestion ? 'Editar Questão' : 'Nova Questão'}
                            </h5>
                            <button
                              onClick={closeQuestionForm}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <FiX />
                            </button>
                          </div>

                          {/* Question Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Texto da Questão *
                            </label>
                            <textarea
                              value={questionForm.question_text}
                              onChange={(e) =>
                                setQuestionForm((prev) => ({
                                  ...prev,
                                  question_text: e.target.value,
                                }))
                              }
                              rows={3}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all resize-none"
                              placeholder="Digite o enunciado da questão..."
                            />
                          </div>

                          {/* Question Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tipo de Questão
                            </label>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleQuestionTypeChange('multiple_choice')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                  questionForm.question_type === 'multiple_choice'
                                    ? 'border-[#1a56db] bg-[#1a56db]/5 text-[#1a56db]'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                              >
                                <FiHelpCircle />
                                Múltipla Escolha
                              </button>
                              <button
                                onClick={() => handleQuestionTypeChange('true_false')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                  questionForm.question_type === 'true_false'
                                    ? 'border-[#1a56db] bg-[#1a56db]/5 text-[#1a56db]'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                              >
                                <FiCheckSquare />
                                Verdadeiro / Falso
                              </button>
                            </div>
                          </div>

                          {/* Options */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Alternativas (selecione a correta)
                            </label>
                            <div className="space-y-2.5">
                              {questionForm.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setCorrectOption(index)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                      option.is_correct
                                        ? 'border-[#1a56db] bg-[#1a56db] text-white'
                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                    }`}
                                    title={
                                      option.is_correct
                                        ? 'Resposta correta'
                                        : 'Marcar como correta'
                                    }
                                  >
                                    {option.is_correct ? '✓' : option.label}
                                  </button>
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) =>
                                      updateOptionText(index, e.target.value)
                                    }
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                                    placeholder={`Alternativa ${option.label}${
                                      option.is_correct ? ' (correta)' : ''
                                    }`}
                                    disabled={
                                      questionForm.question_type === 'true_false'
                                    }
                                  />
                                  {questionForm.question_type ===
                                    'multiple_choice' &&
                                    questionForm.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remover alternativa"
                                      >
                                        <FiX className="text-sm" />
                                      </button>
                                    )}
                                </div>
                              ))}
                            </div>
                            {questionForm.question_type === 'multiple_choice' &&
                              questionForm.options.length < 6 && (
                                <button
                                  type="button"
                                  onClick={addOption}
                                  className="mt-2.5 flex items-center gap-1.5 text-sm text-[#1a56db] hover:text-[#1648b8] font-medium transition-colors"
                                >
                                  <FiPlus className="text-sm" />
                                  Adicionar alternativa
                                </button>
                              )}
                          </div>

                          {/* Points and Explanation */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pontos
                              </label>
                              <input
                                type="number"
                                value={questionForm.points}
                                onChange={(e) =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    points: Number(e.target.value) || 1,
                                  }))
                                }
                                min="0.5"
                                step="0.5"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Explicação (opcional)
                              </label>
                              <input
                                type="text"
                                value={questionForm.explanation}
                                onChange={(e) =>
                                  setQuestionForm((prev) => ({
                                    ...prev,
                                    explanation: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                                placeholder="Explanar a resposta..."
                              />
                            </div>
                          </div>

                          {/* Save/Cancel */}
                          <div className="flex gap-3 justify-end pt-2">
                            <button
                              onClick={closeQuestionForm}
                              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveQuestion}
                              disabled={savingQuestion}
                              className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1648b8] transition-colors disabled:opacity-50"
                            >
                              {savingQuestion ? 'Salvando...' : editingQuestion ? 'Atualizar Questão' : 'Adicionar Questão'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Questions List */}
                      {(!quizDetail.questions || quizDetail.questions.length === 0) &&
                      !showQuestionForm ? (
                        <div className="text-center py-8 text-gray-400">
                          <FiHelpCircle className="mx-auto text-3xl mb-2" />
                          <p className="text-sm">Nenhuma questão adicionada ainda.</p>
                          <p className="text-xs text-gray-300 mt-1">
                            Clique em &quot;Adicionar Questão&quot; para começar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {quizDetail.questions
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((question, index) => (
                              <div
                                key={question.id || index}
                                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Order Controls */}
                                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                                    <button
                                      onClick={() => moveQuestion(question.id!, 'up')}
                                      disabled={index === 0}
                                      className="text-xs text-gray-300 hover:text-[#1a56db] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                                      title="Mover para cima"
                                    >
                                      ▲
                                    </button>
                                    <span className="text-xs font-bold text-gray-400">
                                      {question.sort_order}
                                    </span>
                                    <button
                                      onClick={() => moveQuestion(question.id!, 'down')}
                                      disabled={
                                        index ===
                                        quizDetail.questions.length - 1
                                      }
                                      className="text-xs text-gray-300 hover:text-[#1a56db] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                                      title="Mover para baixo"
                                    >
                                      ▼
                                    </button>
                                  </div>

                                  {/* Question Content */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                      {question.question_text}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                          question.question_type ===
                                          'multiple_choice'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-[#f97316]/10 text-[#f97316]'
                                        }`}
                                      >
                                        {question.question_type ===
                                        'multiple_choice'
                                          ? 'Múltipla Escolha'
                                          : 'Verdadeiro/Falso'}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                        {question.points} pt{question.points !== 1 ? 's' : ''}
                                      </span>
                                    </div>

                                    {/* Show Options */}
                                    <div className="space-y-1">
                                      {question.options.map((opt, oi) => (
                                        <div
                                          key={oi}
                                          className="flex items-center gap-2 text-xs"
                                        >
                                          <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                              opt.is_correct
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                            }`}
                                          >
                                            {opt.is_correct ? '✓' : opt.label}
                                          </span>
                                          <span
                                            className={`${
                                              opt.is_correct
                                                ? 'text-green-700 font-medium'
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            {opt.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>

                                    {question.explanation && (
                                      <p className="text-xs text-gray-400 mt-2 italic">
                                        Explicação: {question.explanation}
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() =>
                                        openEditQuestionForm(question)
                                      }
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1a56db] transition-colors"
                                      title="Editar questão"
                                    >
                                      <FiEdit2 className="text-sm" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteQuestion(question.id!)
                                      }
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                      title="Excluir questão"
                                    >
                                      <FiTrash2 className="text-sm" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingQuiz ? 'Editar Avaliação' : 'Nova Avaliação'}
              </h3>
              <button
                onClick={() => setShowQuizModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Título *
                </label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) =>
                    setQuizForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                  placeholder="Ex: Prova Módulo 1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all resize-none"
                  placeholder="Descrição opcional da avaliação..."
                />
              </div>

              {/* Time Limit and Passing Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Limite de Tempo (min)
                  </label>
                  <input
                    type="number"
                    value={quizForm.time_limit_minutes}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        time_limit_minutes: Number(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                    placeholder="0 = sem limite"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    0 = sem limite de tempo
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nota de Aprovação (%)
                  </label>
                  <input
                    type="number"
                    value={quizForm.passing_grade}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        passing_grade: Number(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Max Attempts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Máximo de Tentativas
                </label>
                <input
                  type="number"
                  value={quizForm.max_attempts}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      max_attempts: Number(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1a56db]/20 focus:border-[#1a56db] outline-none transition-all"
                />
              </div>

              {/* Shuffle Questions */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quizForm.shuffle_questions}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        shuffle_questions: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a56db]" />
                </label>
                <span className="text-sm font-medium text-gray-700">
                  Embaralhar questões aleatoriamente
                </span>
              </div>

              {/* Show Answers After */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mostrar Respostas
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setQuizForm((prev) => ({
                        ...prev,
                        show_answers_after: 'after_submit',
                      }))
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      quizForm.show_answers_after === 'after_submit'
                        ? 'border-[#1a56db] bg-[#1a56db]/5 text-[#1a56db]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Após enviar
                  </button>
                  <button
                    onClick={() =>
                      setQuizForm((prev) => ({
                        ...prev,
                        show_answers_after: 'never',
                      }))
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      quizForm.show_answers_after === 'never'
                        ? 'border-[#1a56db] bg-[#1a56db]/5 text-[#1a56db]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Nunca
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={savingQuiz}
                className="flex items-center gap-2 px-5 py-2 bg-[#1a56db] text-white rounded-xl text-sm font-medium hover:bg-[#1648b8] transition-colors disabled:opacity-50 shadow-md shadow-blue-200"
              >
                {savingQuiz
                  ? 'Salvando...'
                  : editingQuiz
                  ? 'Salvar Alterações'
                  : 'Criar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

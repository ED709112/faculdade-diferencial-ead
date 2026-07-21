'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiPlay,
  FiFileText,
  FiCheck,
  FiCheckCircle,
  FiArrowLeft,
  FiMessageSquare,
  FiDownload,
  FiAward,
  FiChevronDown,
  FiChevronRight,
  FiBook,
  FiSend,
} from 'react-icons/fi';
import ReactPlayer from 'react-player';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'text' | 'pdf';
  content?: string;
  video_url?: string;
  file_url?: string;
  duration?: number;
  order: number;
  completed: boolean;
}

interface Module {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  image?: string;
  teacher: { name: string };
}

interface Comment {
  id: number;
  user: { id: number; name: string; avatar?: string };
  content: string;
  created_at: string;
}

interface EnrollmentProgress {
  progress: number;
  completed: boolean;
  current_lesson_id: number;
  completed_lessons: number;
  total_lessons: number;
  quizzes_total: number;
  quizzes_passed: number;
}

type ActiveTab = 'aula' | 'material' | 'avaliacoes' | 'certificado';

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState<EnrollmentProgress | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('aula');
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [sendingComment, setSendingComment] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const myEnrollments = await api.get('/enrollments/my');
      const enrollment = (myEnrollments.data || []).find(
        (e: any) => String(e.course_id) === String(courseId)
      );

      if (!enrollment) {
        toast.error('Matrícula não encontrada');
        router.push('/aluno/cursos');
        return;
      }

      const enrollmentId = enrollment.id;

      const [enrollmentRes, progressRes] = await Promise.all([
        api.get(`/enrollments/${enrollmentId}`),
        api.get(`/enrollments/${enrollmentId}/course-progress`),
      ]);

      const enrollmentData = enrollmentRes.data;
      const progressData = progressRes.data;

      setCourse(enrollmentData.course || enrollmentData);
      setModules(enrollmentData.modules || enrollmentData.course?.modules || []);
      setEnrollmentProgress(progressData);

      if (progressData.current_lesson_id) {
        const lessonRes = await api.get(`/lessons/${progressData.current_lesson_id}`);
        setCurrentLesson(lessonRes.data);
      } else if (enrollmentData.modules?.[0]?.lessons?.[0]) {
        setCurrentLesson(enrollmentData.modules[0].lessons[0]);
      }
    } catch {
      toast.error('Erro ao carregar curso');
      router.push('/aluno/cursos');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  const fetchComments = useCallback(async (lessonId: number) => {
    try {
      const { data } = await api.get(`/lessons/${lessonId}/comments`);
      setComments(data.comments || data || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentLesson) {
      fetchComments(currentLesson.id);
      setOpenModules((prev) => {
        const next = new Set(prev);
        modules.forEach((m) => {
          if (m.lessons?.some((l) => l.id === currentLesson.id)) {
            next.add(m.id);
          }
        });
        return next;
      });
    }
  }, [currentLesson, modules, fetchComments]);

  const toggleModule = (moduleId: number) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('aula');
  };

  const completeLesson = async () => {
    if (!currentLesson) return;
    try {
      setCompletingLesson(true);
      await api.post(`/lessons/${currentLesson.id}/complete`);

      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) =>
            l.id === currentLesson.id ? { ...l, completed: true } : l
          ),
        }))
      );

      toast.success('Aula concluída!');

      const myEnrollments = await api.get('/enrollments/my');
      const enrollment = (myEnrollments.data || []).find(
        (e: any) => String(e.course_id) === String(courseId)
      );
      if (enrollment) {
        const { data } = await api.get(`/enrollments/${enrollment.id}/course-progress`);
        setEnrollmentProgress(data);
        if (data.completed) {
          toast.success('Parabéns! Curso concluído!');
        }
      }
    } catch {
      toast.error('Erro ao concluir aula');
    } finally {
      setCompletingLesson(false);
    }
  };

  const sendComment = async () => {
    if (!currentLesson || !newComment.trim()) return;
    try {
      setSendingComment(true);
      const { data } = await api.post(`/lessons/${currentLesson.id}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, data.comment || data]);
      setNewComment('');
      toast.success('Comentário enviado!');
    } catch {
      toast.error('Erro ao enviar comentário');
    } finally {
      setSendingComment(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) return <Loading text="Carregando curso..." />;

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; disabled?: boolean }[] = [
    { id: 'aula', label: 'Aula', icon: FiPlay },
    { id: 'material', label: 'Material', icon: FiFileText },
    { id: 'avaliacoes', label: 'Avaliações', icon: FiBook },
    ...(enrollmentProgress?.completed
      ? [{ id: 'certificado' as ActiveTab, label: 'Certificado', icon: FiAward }]
      : []),
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-0 -m-4 lg:-m-6 min-h-[calc(100vh-4rem)]">
      {/* Sidebar - Modules */}
      <aside className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <Link
            href="/aluno/cursos"
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 mb-3 transition-colors"
          >
            <FiArrowLeft /> Voltar para Meus Cursos
          </Link>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{course?.title}</h2>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progresso do curso</span>
              <span className="font-bold text-secondary-500">{Math.round(enrollmentProgress?.progress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-secondary-500 to-secondary-400 transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(enrollmentProgress?.progress || 0, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              <span>
                {enrollmentProgress?.completed_lessons || 0}/{enrollmentProgress?.total_lessons || 0} aulas
              </span>
              {(enrollmentProgress?.quizzes_total || 0) > 0 && (
                <span>
                  {enrollmentProgress?.quizzes_passed || 0}/{enrollmentProgress?.quizzes_total} provas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((module) => {
            const isOpen = openModules.has(module.id);
            const completedCount = (module.lessons || []).filter((l) => l.completed).length;

            return (
              <div key={module.id} className="border-b border-gray-50 dark:border-gray-700/50">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? (
                      <FiChevronDown className="text-gray-400 dark:text-gray-500 shrink-0" />
                    ) : (
                      <FiChevronRight className="text-gray-400 dark:text-gray-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {module.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {completedCount}/{module.lessons?.length || 0}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-2 pl-6 pr-2">
                    {(module.lessons || [])
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => {
                        const isActive = currentLesson?.id === lesson.id;
                        const LessonIcon =
                          lesson.type === 'video'
                            ? FiPlay
                            : lesson.type === 'pdf'
                            ? FiFileText
                            : FiBook;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`flex items-center gap-2 w-full p-2 rounded-lg text-left transition-colors ${
                              isActive
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {lesson.completed ? (
                              <FiCheckCircle className="text-green-500 shrink-0" />
                            ) : (
                              <LessonIcon className="text-gray-400 dark:text-gray-500 shrink-0" />
                            )}
                            <span className="text-sm truncate">{lesson.title}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <TabIcon />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Aula Tab */}
          {activeTab === 'aula' && currentLesson && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentLesson.title}</h3>

              {/* Video Player */}
              {currentLesson.type === 'video' && currentLesson.video_url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                  <ReactPlayer
                    url={currentLesson.video_url}
                    width="100%"
                    height="100%"
                    controls
                  />
                </div>
              )}

              {/* Text Content */}
              {currentLesson.type === 'text' && currentLesson.content && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm prose prose-gray max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                </div>
              )}

              {/* PDF Viewer */}
              {currentLesson.type === 'pdf' && currentLesson.file_url && (
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                  <iframe
                    src={currentLesson.file_url}
                    className="w-full min-h-[600px]"
                    title={currentLesson.title}
                  />
                </div>
              )}

              {/* Complete Button */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {currentLesson.completed ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <FiCheckCircle className="text-xl" />
                      <span className="font-medium">Aula concluída</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Assista/atenda a aula e clique para concluir
                    </span>
                  )}
                </div>
                <button
                  onClick={completeLesson}
                  disabled={currentLesson.completed || completingLesson}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    currentLesson.completed
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  } disabled:opacity-60`}
                >
                  <FiCheck />
                  {completingLesson
                    ? 'Concluindo...'
                    : currentLesson.completed
                    ? 'Concluída'
                    : 'Concluir Aula'}
                </button>
              </div>

              {/* Comments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                    <FiMessageSquare /> Comentários
                  </h4>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                  {comments.length === 0 ? (
                    <p className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                      Nenhum comentário ainda. Seja o primeiro!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {comment.user.avatar ? (
                              <img
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-primary-500">
                                {comment.user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {comment.user.name}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Comment */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                      placeholder="Escreva um comentário..."
                      className="input-field text-sm"
                    />
                    <button
                      onClick={sendComment}
                      disabled={!newComment.trim() || sendingComment}
                      className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
                    >
                      <FiSend />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Material Tab */}
          {activeTab === 'material' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Materiais do Curso</h3>
              {modules.map((module) => {
                const materials = (module.lessons || []).filter((l) => l.file_url);
                if (materials.length === 0) return null;
                return (
                  <div key={module.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{module.title}</h4>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {materials.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FiFileText className="text-gray-400 dark:text-gray-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                                {lesson.type.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={lesson.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm font-medium shrink-0"
                          >
                            <FiDownload /> Baixar
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {modules.every((m) =>
                (m.lessons || []).every((l) => !l.file_url)
              ) && (
                <p className="text-center text-gray-400 dark:text-gray-500 py-12">
                  Nenhum material disponível para este curso.
                </p>
              )}
            </div>
          )}

          {/* Avaliações Tab */}
          {activeTab === 'avaliacoes' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Avaliações</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  As avaliações do curso aparecerão aqui quando estiverem disponíveis.
                </p>
              </div>
            </div>
          )}

          {/* Certificado Tab */}
          {activeTab === 'certificado' && enrollmentProgress?.completed && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAward className="text-4xl text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Parabéns! Curso Concluído!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Você concluiu o curso e está elegível para o certificado.
                </p>
                <Link
                  href="/aluno/certificados"
                  className="inline-flex items-center gap-2 btn-primary"
                >
                  <FiAward /> Ver Meus Certificados
                </Link>
              </div>

              {/* Overall Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="w-32 h-32 mx-auto">
                  <CircularProgressbar
                    value={enrollmentProgress.progress}
                    text={`${Math.round(enrollmentProgress.progress)}%`}
                    styles={buildStyles({
                      textSize: '24px',
                      textColor: '#16a34a',
                      pathColor: '#16a34a',
                      trailColor: '#e5e7eb',
                    })}
                  />
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  {enrollmentProgress.completed_lessons} de{' '}
                  {enrollmentProgress.total_lessons} aulas concluídas
                </p>
              </div>
            </div>
          )}

          {/* No lesson selected */}
          {!currentLesson && activeTab === 'aula' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FiPlay className="text-5xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Selecione uma aula
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Escolha uma aula no menu lateral para começar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

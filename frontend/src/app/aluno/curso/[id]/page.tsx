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
  FiFolder,
  FiExternalLink,
  FiLink,
  FiVideo,
  FiClock,
  FiUser,
} from 'react-icons/fi';
import ReactPlayer from 'react-player';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';
import AnexarAtividadeTab from '@/components/courses/AnexarAtividadeTab';

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

interface DisciplineMaterial {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_url: string;
  external_url: string;
  created_at: string;
}

interface CourseDiscipline {
  id: number;
  name: string;
  workload: number;
  titulacao: string;
  ementa: string;
  objetivo: string;
  conteudo_programatico: string;
  metodologia: string;
  metodologia_ensino: string;
  avaliacao: string;
  recursos_didaticos: string;
  referencias: string;
  teacher_name: string;
  materials_count: number;
  materials: DisciplineMaterial[];
  module_id: number | null;
  module_name: string | null;
}

type ActiveTab = 'material' | 'disciplina' | 'avaliacoes' | 'certificado';

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
  const [disciplines, setDisciplines] = useState<CourseDiscipline[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

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

      const discRes = await api.get(`/student/disciplines/course/${courseId}`).catch(() => null);
      if (discRes) {
        setDisciplines(Array.isArray(discRes.data) ? discRes.data : []);
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
    ...(disciplines.length > 0 ? [{ id: 'disciplina' as ActiveTab, label: 'Disciplina', icon: FiBook }] : []),
    { id: 'material', label: 'Anexar Atividade', icon: FiFileText },
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
            const moduleDiscipline = disciplines.find(d => d.module_id === module.id);

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

                {/* Discipline link for this module */}
                {moduleDiscipline && (
                  <button
                    onClick={() => {
                      setSelectedModuleId(module.id);
                      setActiveTab('disciplina');
                    }}
                    className="w-full flex items-center gap-2 pl-8 pr-3 py-2 text-left hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors group"
                  >
                    <FiBook className="text-secondary-500 shrink-0 text-xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 truncate">
                        {moduleDiscipline.name}
                      </p>
                      <p className="text-[10px] text-secondary-400 dark:text-secondary-500 truncate">
                        {moduleDiscipline.teacher_name}
                      </p>
                    </div>
                  </button>
                )}

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
          {/* Material Tab - Anexar Atividade */}
          {activeTab === 'material' && (
            <AnexarAtividadeTab courseId={courseId} disciplines={selectedModuleId ? disciplines.filter(d => d.module_id === selectedModuleId) : disciplines} modules={modules} />
          )}

          {/* Disciplina Tab */}
          {activeTab === 'disciplina' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {(() => {
                const filtered = selectedModuleId
                  ? disciplines.filter(d => d.module_id === selectedModuleId)
                  : disciplines;
                if (filtered.length === 0) {
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                      <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {selectedModuleId
                          ? 'Nenhuma disciplina vinculada a este módulo.'
                          : 'Nenhuma disciplina vinculada a este curso.'}
                      </p>
                    </div>
                  );
                }
                return filtered.map((disc) => (
                  <div key={disc.id} className="space-y-4">
                    {/* Discipline Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center shrink-0">
                          <FiBook className="text-secondary-500 text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{disc.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><FiUser className="text-xs" /> {disc.teacher_name}</span>
                            {disc.workload > 0 && <span className="flex items-center gap-1"><FiClock className="text-xs" /> {disc.workload}h</span>}
                            {disc.module_name && (
                              <span className="flex items-center gap-1 text-secondary-500 dark:text-secondary-400">
                                <FiBook className="text-xs" /> {disc.module_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ementa Sections */}
                    {[
                      { label: 'EMENTA', content: disc.ementa },
                      { label: 'OBJETIVO', content: disc.objetivo },
                      { label: 'CONTEÚDO PROGRAMÁTICO', content: disc.conteudo_programatico },
                      { label: 'METODOLOGIA', content: disc.metodologia },
                      { label: 'METODOLOGIA DO ENSINO', content: disc.metodologia_ensino },
                      { label: 'AVALIAÇÃO', content: disc.avaliacao },
                      { label: 'RECURSOS DIDÁTICOS', content: disc.recursos_didaticos },
                      { label: 'REFERÊNCIAS', content: disc.referencias },
                    ].filter(s => s.content).map((section) => (
                      <div key={section.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                        <h4 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide mb-3">{section.label}</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{section.content}</p>
                      </div>
                    ))}

                    {/* Materials */}
                    {disc.materials && disc.materials.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Materiais da Disciplina</h4>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {disc.materials.map((mat) => {
                            const isLink = mat.material_type === 'link' && mat.external_url;
                            const typeColors: Record<string, string> = {
                              apostila: 'bg-blue-100 text-blue-600',
                              atividade: 'bg-emerald-100 text-emerald-600',
                              video: 'bg-red-100 text-red-600',
                              documento: 'bg-gray-100 text-gray-600',
                              link: 'bg-violet-100 text-violet-600',
                              outro: 'bg-yellow-100 text-yellow-600',
                            };
                            const typeLabels: Record<string, string> = {
                              apostila: 'Apostila', atividade: 'Atividade', video: 'Vídeo',
                              documento: 'Documento', link: 'Link', outro: 'Outro',
                            };
                            return (
                              <div key={mat.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${(typeColors[mat.material_type] || typeColors.outro).split(' ')[0]}`}>
                                  <FiFolder className={`text-sm ${(typeColors[mat.material_type] || typeColors.outro).split(' ')[1]}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{mat.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {typeLabels[mat.material_type] || mat.material_type} • {new Date(mat.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  {mat.description && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{mat.description}</p>
                                  )}
                                </div>
                                <div className="shrink-0">
                                  {isLink ? (
                                    <a href={mat.external_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                                      <FiExternalLink className="text-xs" /> Abrir Link
                                    </a>
                                  ) : mat.file_url ? (
                                    <a href={mat.file_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                                      <FiDownload className="text-xs" /> Baixar
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
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
        </div>
      </div>
    </div>
  );
}

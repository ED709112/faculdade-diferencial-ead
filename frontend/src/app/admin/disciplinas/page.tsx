'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBook, FiBookOpen, FiUser, FiClock, FiPlus, FiX, FiChevronDown, FiChevronRight,
  FiAlertCircle, FiCheck, FiSearch, FiLayers, FiGrid,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';

interface Course {
  id: number;
  title: string;
  slug: string;
  teacher_name?: string;
}

interface Module {
  id: number;
  title: string;
  sort_order: number;
  description?: string;
}

interface Discipline {
  id: number;
  name: string;
  workload: number;
  titulacao: string;
  status: string;
  teacher_name: string;
  teacher_id: number;
  materials_count?: number;
}

interface CourseDiscipline extends Discipline {
  discipline_id: number;
  sort_order: number;
  discipline_name: string;
  discipline_status: string;
  module_id: number | null;
  module_name: string | null;
}

export default function AdminDisciplinesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [courseDisciplines, setCourseDiscDisciplines] = useState<CourseDiscipline[]>([]);
  const [availableDisciplines, setAvailableDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/courses?limit=100');
      const list = Array.isArray(data) ? data : data.data || data.courses || [];
      setCourses(list);
    } catch (err) {
      console.error('Erro ao buscar cursos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fetchModules = useCallback(async (courseId: number) => {
    try {
      const { data } = await api.get(`/admin/course-disciplines/courses/${courseId}/modules`);
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar módulos:', err);
      setModules([]);
    }
  }, []);

  const fetchCourseDisciplines = useCallback(async (courseId: number, moduleId?: number) => {
    try {
      setLoadingDisciplines(true);
      const params = moduleId ? `?module_id=${moduleId}` : '';
      const { data } = await api.get(`/admin/course-disciplines/courses/${courseId}/disciplines${params}`);
      setCourseDiscDisciplines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar disciplinas:', err);
      setCourseDiscDisciplines([]);
    } finally {
      setLoadingDisciplines(false);
    }
  }, []);

  const fetchAvailableDisciplines = useCallback(async (courseId: number, moduleId?: number) => {
    try {
      const params = moduleId ? `?module_id=${moduleId}` : '';
      const { data } = await api.get(`/admin/course-disciplines/courses/${courseId}/disciplines/available${params}`);
      setAvailableDisciplines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar disciplinas disponíveis:', err);
      setAvailableDisciplines([]);
    }
  }, []);

  const handleSelectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedModule(null);
    await fetchModules(course.id);
    setCourseDiscDisciplines([]);
  };

  const handleSelectModule = async (module: Module) => {
    setSelectedModule(module);
    await fetchCourseDisciplines(selectedCourse!.id, module.id);
  };

  const handleLinkDiscipline = async (disciplineId: number) => {
    if (!selectedCourse || !selectedModule) return;
    try {
      await api.post(`/admin/course-disciplines/courses/${selectedCourse.id}/disciplines`, {
        discipline_id: disciplineId,
        module_id: selectedModule.id,
      });
      setMessage({ type: 'success', text: 'Disciplina vinculada ao módulo com sucesso!' });
      await fetchCourseDisciplines(selectedCourse.id, selectedModule.id);
      await fetchAvailableDisciplines(selectedCourse.id, selectedModule.id);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao vincular disciplina.' });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleUnlinkDiscipline = async (disciplineId: number) => {
    if (!selectedCourse || !selectedModule) return;
    if (!confirm('Deseja desvincular esta disciplina do módulo?')) return;
    try {
      await api.delete(`/admin/course-disciplines/courses/${selectedCourse.id}/disciplines/${disciplineId}?module_id=${selectedModule.id}`);
      setMessage({ type: 'success', text: 'Disciplina desvinculada com sucesso!' });
      await fetchCourseDisciplines(selectedCourse.id, selectedModule.id);
      await fetchAvailableDisciplines(selectedCourse.id, selectedModule.id);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao desvincular.' });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleOpenAddModal = async () => {
    if (!selectedCourse || !selectedModule) return;
    await fetchAvailableDisciplines(selectedCourse.id, selectedModule.id);
    setShowAddModal(true);
    setSearchAvailable('');
  };

  const filteredAvailable = availableDisciplines.filter(d =>
    d.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    d.teacher_name.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  if (loading) return <Loading text="Carregando cursos..." />;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Disciplinas dos Cursos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selecione um curso e um módulo para vincular disciplinas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Column 1: Courses */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/20">
              <h2 className="font-semibold text-secondary-800 dark:text-secondary-200 flex items-center gap-2">
                <FiBookOpen className="text-secondary-500" /> Cursos
              </h2>
            </div>
            <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50 bg-secondary-50/30 dark:bg-secondary-900/10 max-h-[500px] overflow-y-auto">
              {courses.length === 0 ? (
                <div className="p-6 text-center text-secondary-600 dark:text-secondary-400 text-sm">
                  Nenhum curso encontrado.
                </div>
              ) : (
                courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`w-full text-left p-3 transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'bg-secondary-100 dark:bg-secondary-900/30 border-l-4 border-secondary-500'
                        : 'hover:bg-secondary-100/50 dark:hover:bg-secondary-900/20'
                    }`}
                  >
                    <h3 className="text-sm font-medium text-secondary-800 dark:text-secondary-200 line-clamp-2">
                      {course.title}
                    </h3>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Modules */}
        <div className="lg:col-span-1">
          {!selectedCourse ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FiLayers className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Selecione um curso primeiro
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/20">
                <h2 className="font-semibold text-secondary-800 dark:text-secondary-200 flex items-center gap-2">
                  <FiLayers className="text-secondary-500" /> Módulos
                </h2>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{selectedCourse.title}</p>
              </div>
              <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50 bg-secondary-50/30 dark:bg-secondary-900/10 max-h-[420px] overflow-y-auto">
                {modules.length === 0 ? (
                  <div className="p-6 text-center text-secondary-600 dark:text-secondary-400 text-sm">
                    Nenhum módulo encontrado neste curso.
                  </div>
                ) : (
                  modules.map(module => (
                    <button
                      key={module.id}
                      onClick={() => handleSelectModule(module)}
                      className={`w-full text-left p-3 transition-colors ${
                        selectedModule?.id === module.id
                          ? 'bg-secondary-100 dark:bg-secondary-900/30 border-l-4 border-secondary-500'
                          : 'hover:bg-secondary-100/50 dark:hover:bg-secondary-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiGrid className="text-xs text-secondary-400 dark:text-secondary-500 shrink-0" />
                        <span className="text-sm font-medium text-secondary-800 dark:text-secondary-200 line-clamp-2">
                          {module.title}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Discipline Panel */}
        <div className="lg:col-span-2">
          {!selectedCourse || !selectedModule ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {!selectedCourse
                  ? 'Selecione um curso para gerenciar disciplinas'
                  : 'Selecione um módulo para ver suas disciplinas'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm">
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-secondary-800 dark:text-secondary-200">
                    {selectedModule.title}
                  </h2>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    {courseDisciplines.length} disciplina(s) vinculada(s)
                  </p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm font-medium"
                >
                  <FiPlus /> Vincular Disciplina
                </button>
              </div>

              <div className="p-4 bg-secondary-50/30 dark:bg-secondary-900/10">
                {loadingDisciplines ? (
                  <div className="text-center py-8 text-secondary-600 dark:text-secondary-400 text-sm">
                    Carregando disciplinas...
                  </div>
                ) : courseDisciplines.length === 0 ? (
                  <div className="text-center py-8">
                    <FiBook className="text-3xl text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm mb-3">
                      Nenhuma disciplina vinculada a este módulo.
                    </p>
                    <p className="text-secondary-400 dark:text-secondary-500 text-xs">
                      Clique em &quot;Vincular Disciplina&quot; para adicionar disciplinas ao módulo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {courseDisciplines.map(cd => (
                      <div
                        key={cd.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-gray-800 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center shrink-0">
                          <FiBook className="text-secondary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-800 dark:text-secondary-200 line-clamp-1">
                            {cd.discipline_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <FiUser className="text-xs" /> {cd.teacher_name}
                            </span>
                            {cd.workload > 0 && (
                              <span className="flex items-center gap-1">
                                <FiClock className="text-xs" /> {cd.workload}h
                              </span>
                            )}
                            {cd.materials_count !== undefined && (
                              <span>{cd.materials_count} material(is)</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkDiscipline(cd.discipline_id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                          title="Desvincular disciplina"
                        >
                          <FiX className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Discipline Modal */}
      {showAddModal && selectedCourse && selectedModule && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Vincular Disciplina
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Módulo: {selectedModule.title}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FiX />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar disciplina ou professor..."
                  value={searchAvailable}
                  onChange={e => setSearchAvailable(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8">
                  <FiBook className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {availableDisciplines.length === 0
                      ? 'Todas as disciplinas ativas já estão vinculadas a este módulo.'
                      : 'Nenhuma disciplina encontrada.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map(d => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center shrink-0">
                        <FiBook className="text-secondary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {d.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <FiUser className="text-xs" /> {d.teacher_name}
                          </span>
                          {d.workload > 0 && (
                            <span className="flex items-center gap-1">
                              <FiClock className="text-xs" /> {d.workload}h
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkDiscipline(d.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors shrink-0"
                      >
                        <FiPlus className="text-xs" /> Vincular
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

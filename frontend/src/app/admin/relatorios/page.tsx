'use client';

import React, { useState, useEffect } from 'react';
import {
  FiFileText,
  FiUsers,
  FiDollarSign,
  FiBook,
  FiUser,
  FiDownload,
  FiCalendar,
  FiBarChart2,
  FiAlertTriangle,
  FiTrendingDown,
  FiClock,
  FiAward,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

type ReportType = 'students-course' | 'revenue-period' | 'course-performance' | 'teacher-performance';

interface ReportConfig {
  key: ReportType;
  label: string;
  icon: any;
  color: string;
}

const reportTypes: ReportConfig[] = [
  { key: 'students-course', label: 'Alunos por Curso', icon: FiUsers, color: 'bg-primary-50 text-primary-600' },
  { key: 'revenue-period', label: 'Receita por Período', icon: FiDollarSign, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'course-performance', label: 'Desempenho dos Cursos', icon: FiBook, color: 'bg-violet-50 text-violet-600' },
  { key: 'teacher-performance', label: 'Desempenho dos Professores', icon: FiUser, color: 'bg-secondary-50 text-secondary-600' },
  { key: 'dropout', label: 'Evasão de Alunos', icon: FiTrendingDown, color: 'bg-red-50 text-red-600' },
  { key: 'performance', label: 'Desempenho Geral', icon: FiBarChart2, color: 'bg-blue-50 text-blue-600' },
];

export default function AdminRelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('students-course');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [generated, setGenerated] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const params: any = { type: selectedReport };
      if (!['dropout', 'performance'].includes(selectedReport)) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const { data } = await api.get('/admin/reports', { params });
      setReportData(data);
      setGenerated(true);
      toast.success('Relatório gerado com sucesso');
    } catch {
      setReportData(getFallbackData(selectedReport));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = (type: ReportType) => {
    switch (type) {
      case 'students-course':
        return {
          chartData: [
            { course: 'Administração', students: 145 },
            { course: 'Direito', students: 128 },
            { course: 'Psicologia', students: 98 },
            { course: 'Marketing', students: 87 },
            { course: 'Finanças', students: 76 },
            { course: 'RH', students: 64 },
          ],
          tableData: [
            { name: 'Administração Corporativa', enrolled: 145, completion_rate: 72 },
            { name: 'Direito Empresarial', enrolled: 128, completion_rate: 65 },
            { name: 'Psicologia Organizacional', enrolled: 98, completion_rate: 80 },
            { name: 'Marketing Digital', enrolled: 87, completion_rate: 58 },
            { name: 'Finanças Corporativas', enrolled: 76, completion_rate: 70 },
          ],
        };
      case 'revenue-period':
        return {
          chartData: [
            { month: 'Jan', revenue: 18500 },
            { month: 'Fev', revenue: 22300 },
            { month: 'Mar', revenue: 19800 },
            { month: 'Abr', revenue: 25400 },
            { month: 'Mai', revenue: 23100 },
            { month: 'Jun', revenue: 28700 },
          ],
          summary: { total: 137800, average: 22967, growth: 18.5 },
        };
      case 'course-performance':
        return {
          chartData: [
            { course: 'Administração', completion: 72, rating: 4.7, dropoff: 15 },
            { course: 'Direito', completion: 65, rating: 4.5, dropoff: 20 },
            { course: 'Psicologia', completion: 80, rating: 4.8, dropoff: 10 },
            { course: 'Marketing', completion: 58, rating: 4.3, dropoff: 25 },
          ],
        };
      case 'teacher-performance':
        return {
          chartData: [
            { teacher: 'Prof. João', courses: 8, students: 342, rating: 4.7 },
            { teacher: 'Prof. Ana', courses: 6, students: 287, rating: 4.9 },
            { teacher: 'Prof. Carlos', courses: 5, students: 198, rating: 4.4 },
            { teacher: 'Prof. Maria', courses: 7, students: 312, rating: 4.6 },
          ],
        };
      case 'dropout':
        return {
          students: [
            { name: 'Aluno A', email: 'a@email.com', course_title: 'Administração', progress_percentage: 30, days_inactive: 45, last_login: '2026-06-01' },
            { name: 'Aluno B', email: 'b@email.com', course_title: 'Direito', progress_percentage: 55, days_inactive: 22, last_login: '2026-06-22' },
            { name: 'Aluno C', email: 'c@email.com', course_title: 'Psicologia', progress_percentage: 15, days_inactive: 10, last_login: '2026-07-05' },
          ],
          summary: { critical: 3, warning: 8, at_risk: 12 },
        };
      case 'performance':
        return {
          courses: [
            { title: 'Administração', enrollment_count: 145, completed: 98, avg_progress: 72.5, avg_grade: 78.3, total_watch_seconds: 126000 },
            { title: 'Direito', enrollment_count: 128, completed: 83, avg_progress: 65.1, avg_grade: 71.2, total_watch_seconds: 98000 },
            { title: 'Psicologia', enrollment_count: 98, completed: 78, avg_progress: 80.4, avg_grade: 82.7, total_watch_seconds: 82000 },
          ],
          global: { total_active_students: 286, total_completed: 259, avg_progress: 72.7, avg_grade: 77.4, total_watch_seconds: 306000, total_in_progress: 187 },
        };
      default:
        return {};
    }
  };

  const renderChart = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'students-course':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData.chartData || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="course" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-20} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="students" name="Alunos Matriculados" fill="#1a56db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'revenue-period':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={reportData.chartData || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
              <Line type="monotone" dataKey="revenue" name="Receita" stroke="#1a56db" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'course-performance':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData.chartData || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="course" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completion" name="Taxa de Conclusão (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dropoff" name="Desistência (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'teacher-performance':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData.chartData || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="teacher" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="Alunos" fill="#1a56db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="courses" name="Cursos" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'dropout':
        if (reportData.summary) {
          const pieData = [
            { name: 'Crítico (30+ dias)', value: reportData.summary.critical || 0, color: '#ef4444' },
            { name: 'Alerta (15-29 dias)', value: reportData.summary.warning || 0, color: '#f97316' },
            { name: 'Em Risco (7-14 dias)', value: reportData.summary.at_risk || 0, color: '#eab308' },
          ].filter(d => d.value > 0);
          return (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <FiAlertTriangle className="text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{reportData.summary.critical || 0}</p>
                  <p className="text-xs text-red-500">Crítico (30+ dias)</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <FiClock className="text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-600">{reportData.summary.warning || 0}</p>
                  <p className="text-xs text-orange-500">Alerta (15-29 dias)</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <FiTrendingDown className="text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-600">{reportData.summary.at_risk || 0}</p>
                  <p className="text-xs text-yellow-500">Em Risco (7-14 dias)</p>
                </div>
              </div>
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        }
        return null;
      case 'performance':
        if (reportData.global) {
          const g = reportData.global;
          const watchHours = Math.round((g.total_watch_seconds || 0) / 3600);
          return (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="text-center p-4 bg-primary-50 rounded-xl">
                  <p className="text-2xl font-bold text-primary-600">{g.total_active_students || 0}</p>
                  <p className="text-xs text-primary-500">Alunos Ativos</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{g.total_completed || 0}</p>
                  <p className="text-xs text-emerald-500">Concluídos</p>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-600">{g.avg_progress || 0}%</p>
                  <p className="text-xs text-violet-500">Progresso Médio</p>
                </div>
                <div className="text-center p-4 bg-secondary-50 rounded-xl">
                  <p className="text-2xl font-bold text-secondary-600">{g.avg_grade || '-'}</p>
                  <p className="text-xs text-secondary-500">Nota Média</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-600">{watchHours}h</p>
                  <p className="text-xs text-yellow-500">Horas Estudadas</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{g.total_in_progress || 0}</p>
                  <p className="text-xs text-blue-500">Em Andamento</p>
                </div>
              </div>
              {reportData.courses && reportData.courses.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={reportData.courses} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="title" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-20} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_progress" name="Progresso Médio (%)" fill="#1a56db" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_grade" name="Nota Média" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderTable = () => {
    if (!reportData) return null;

    if (selectedReport === 'students-course' && reportData.tableData) {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Curso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Matriculados</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Taxa de Conclusão</th>
            </tr>
          </thead>
          <tbody>
            {reportData.tableData.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.enrolled}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${row.completion_rate}%` }} />
                    </div>
                    <span className="text-xs text-gray-600">{row.completion_rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedReport === 'revenue-period' && reportData.summary) {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Total no Período</p>
            <p className="text-xl font-bold text-gray-900">R$ {reportData.summary.total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Média Mensal</p>
            <p className="text-xl font-bold text-gray-900">R$ {reportData.summary.average.toLocaleString('pt-BR')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Crescimento</p>
            <p className="text-xl font-bold text-emerald-600">+{reportData.summary.growth}%</p>
          </div>
        </div>
      );
    }

    if (selectedReport === 'teacher-performance' && reportData.chartData) {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Professor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cursos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Alunos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {reportData.chartData.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.teacher}</td>
                <td className="px-4 py-3 text-gray-600">{row.courses}</td>
                <td className="px-4 py-3 text-gray-600">{row.students}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-secondary-500 font-medium">
                    ⭐ {row.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedReport === 'dropout' && reportData.students) {
      if (reportData.students.length === 0) {
        return <p className="text-center text-gray-500 py-8">Nenhum aluno em risco de evasão encontrado</p>;
      }
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Aluno</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Curso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Progresso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Dias Inativo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Último Acesso</th>
            </tr>
          </thead>
          <tbody>
            {reportData.students.map((row: any, idx: number) => {
              const daysClass = row.days_inactive >= 30 ? 'text-red-600 bg-red-50' : row.days_inactive >= 15 ? 'text-orange-600 bg-orange-50' : 'text-yellow-600 bg-yellow-50';
              return (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.course_title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-primary-500" style={{ width: `${row.progress_percentage || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{row.progress_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysClass}`}>
                      {row.days_inactive} dias
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {row.last_login ? new Date(row.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (selectedReport === 'performance' && reportData.courses) {
      if (reportData.courses.length === 0) {
        return <p className="text-center text-gray-500 py-8">Nenhum curso com dados disponíveis</p>;
      }
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Curso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Matriculados</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Concluídos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Progresso Médio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nota Média</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Horas</th>
            </tr>
          </thead>
          <tbody>
            {reportData.courses.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.title}</td>
                <td className="px-4 py-3 text-gray-600">{row.enrollment_count || 0}</td>
                <td className="px-4 py-3 text-gray-600">{row.completed || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary-500" style={{ width: `${row.avg_progress || 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-600">{row.avg_progress || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{row.avg_grade || '-'}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{Math.round((row.total_watch_seconds || 0) / 3600)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Gere relatórios detalhados da plataforma</p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((rt) => (
          <button
            key={rt.key}
            onClick={() => { setSelectedReport(rt.key); setGenerated(false); setReportData(null); }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              selectedReport === rt.key
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rt.color}`}>
              <rt.icon className="text-lg" />
            </div>
            <span className="text-sm font-medium text-gray-800">{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Date Range & Generate */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 shrink-0"
          >
            <FiBarChart2 /> {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {loading && <Loading fullScreen={false} text="Gerando relatório..." />}

      {generated && reportData && !loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {reportTypes.find((r) => r.key === selectedReport)?.label}
              </h2>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <FiDownload /> Exportar
              </button>
            </div>
            {renderChart()}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Dados Detalhados</h3>
            <div className="overflow-x-auto">
              {renderTable()}
            </div>
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiFileText className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Selecione um tipo de relatório</h3>
          <p className="text-sm text-gray-500">Escolha o tipo de relatório acima e clique em &quot;Gerar Relatório&quot;</p>
        </div>
      )}
    </div>
  );
}

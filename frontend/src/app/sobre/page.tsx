'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiTarget,
  FiEye,
  FiHeart,
  FiClock,
  FiAward,
  FiUsers,
  FiMonitor,
  FiFileText,
  FiDownload,
} from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import api from '@/lib/api';

interface Edital {
  id: number;
  title: string;
  description?: string;
  type: string;
  file_url: string;
  file_name?: string;
  published_at?: string;
}

const typeLabels: Record<string, string> = {
  edital: 'Edital',
  portaria: 'Portaria',
  resolucao: 'Resolução',
  outro: 'Outro',
};

const typeColors: Record<string, string> = {
  edital: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  portaria: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  resolucao: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  outro: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const stats = [
  { label: 'Alunos', value: '5.000+' },
  { label: 'Cursos', value: '120+' },
  { label: 'Professores', value: '80+' },
  { label: 'Certificados', value: '3.000+' },
];

const values = [
  {
    icon: FiTarget,
    title: 'Missão',
    description:
      'Proporcionar educação de qualidade e acessível, formando profissionais capacitados e comprometidos com a transformação social através do ensino superior.',
  },
  {
    icon: FiEye,
    title: 'Visão',
    description:
      'Ser referência em educação a distância no Brasil, reconhecida pela excelência acadêmica, inovação pedagógica e impacto positivo na vida dos nossos alunos.',
  },
  {
    icon: FiHeart,
    title: 'Valores',
    description:
      'Qualidade, acessibilidade, inovação, ética e compromisso com o sucesso de cada aluno. Acreditamos que a educação transforma vidas.',
  },
];

const features = [
  {
    icon: FiClock,
    title: 'Flexibilidade',
    description: 'Estude no seu ritmo, de qualquer lugar e a qualquer hora. Concilie estudos, trabalho e vida pessoal.',
  },
  {
    icon: FiAward,
    title: 'Certificação Reconhecida',
    description: 'Cursos com diplomas reconhecidos pelo MEC, validados pelo mercado de trabalho em todo o Brasil.',
  },
  {
    icon: FiUsers,
    title: 'Professores Qualificados',
    description: 'Corpo docente com mestres e doutores, profissionais atuantes no mercado e dedicação ao ensino.',
  },
  {
    icon: FiMonitor,
    title: 'Plataforma Moderna',
    description: 'Ambiner virtual intuitivo com videoaulas, materiais, quizzes, fóruns e acompanhamento de progresso.',
  },
];

export default function SobrePage() {
  const [editais, setEditais] = useState<Edital[]>([]);

  useEffect(() => {
    api.get('/editais/public').then(({ data }) => setEditais(data || [])).catch(() => {});
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-custom py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Sobre a Faculdade Diferencial
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 leading-relaxed mb-4">
              Somos uma instituição de ensino superior a distância comprometida com a excelência
              acadêmica e a transformação de carreiras. Nossa plataforma oferece educação de qualidade
              com flexibilidade para que você possa conciliar estudos, trabalho e vida pessoal.
            </p>
            <p className="text-base text-primary-200 leading-relaxed">
              Desde a nossa fundação, já formamos milhares de profissionais qualificados e
              reconhecidos pelo mercado de trabalho em todo o Brasil.
            </p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500" />
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="container-custom py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-primary-500 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Histórico */}
      <section id="historico" className="py-12 lg:py-16 bg-gray-50 dark:bg-gray-900 scroll-mt-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title">A União que Transformou a Educação em Teresina e Região</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 lg:p-12 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                A educação sempre foi o ponto de partida dos nossos sonhos. A <strong className="text-gray-900 dark:text-gray-100">Rota Assessoria Educacional</strong> nasceu com o propósito de orientar e transformar vidas por meio de oportunidades reais de crescimento profissional. Com anos de experiência, dedicação e compromisso com a excelência, conquistamos o respeito de alunos e instituições em todo o Brasil.
              </p>
              <p>
                Paralelamente, a <strong className="text-gray-900 dark:text-gray-100">Diferencial Pós</strong> construiu uma sólida reputação oferecendo cursos de pós-graduação reconhecidos, acessíveis e com foco no mercado de trabalho, tornando-se referência em educação continuada. Mas sabíamos que podíamos ir além. Foi dessa visão compartilhada que surgiu uma união estratégica entre a Rota Assessoria Educacional e a Diferencial Pós.
              </p>
              <p>
                Mais do que uma parceria, decidimos caminhar juntas rumo a um passo maior: a aquisição da <strong className="text-gray-900 dark:text-gray-100">Faculdade Diferencial</strong>, autorizada oficialmente pela <strong className="text-secondary-600 dark:text-secondary-400">Portaria MEC nº 949</strong>. Essa conquista representa muito mais do que um avanço institucional — ela simboliza o fortalecimento do nosso compromisso com a educação de qualidade, a autonomia acadêmica e a possibilidade de oferecer cursos superiores próprios, ampliando nosso impacto e gerando novas oportunidades para nossos alunos em todo o país.
              </p>
              <p>
                Com a Faculdade Diferencial, abrimos um novo capítulo da nossa história:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-4">
                <li>Cursos de graduação e pós-graduação com reconhecimento do MEC;</li>
                <li>Projetos acadêmicos inovadores;</li>
                <li>Corpo docente qualificado;</li>
                <li>Expansão para novas áreas do conhecimento.</li>
              </ul>
              <p>
                Estamos construindo uma instituição moderna, acessível, focada em resultados e no desenvolvimento humano. Essa é a nossa história — e ela está só começando. Seguimos firmes no propósito que sempre nos guiou: <strong className="text-primary-600 dark:text-primary-400">acelerar o crescimento de quem acredita na força da educação</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section id="missao" className="py-8 lg:py-12 bg-secondary-50 dark:bg-secondary-900/20 scroll-mt-24">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Missão, Visão e Valores</h2>
            <p className="section-subtitle mt-1">Os pilares que guiam a nossa atuação</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {values.map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <item.icon className="text-3xl text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editais e Portarias */}
      <section id="editais" className="py-12 lg:py-16 scroll-mt-24">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Editais e Portarias</h2>
            <p className="section-subtitle mt-1">Documentos oficiais da instituição</p>
          </div>
          {editais.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum documento publicado no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {editais.map((edital) => (
                <div
                  key={edital.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <FiFileText className="text-xl text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[edital.type] || typeColors.outro}`}>
                        {typeLabels[edital.type] || edital.type}
                      </span>
                      {edital.published_at && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(edital.published_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{edital.title}</h3>
                    {edital.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{edital.description}</p>
                    )}
                    <a
                      href={edital.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
                    >
                      <FiDownload className="text-sm" />
                      {edital.file_name || 'Baixar documento'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Por que escolher a Diferencial */}
      <section className="py-8 lg:py-12">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Por que escolher a Diferencial?</h2>
            <p className="section-subtitle mt-1">O que nos torna únicos no ensino a distância</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center group-hover:bg-secondary-500 transition-colors duration-300">
                  <feature.icon className="text-3xl text-secondary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="container-custom text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Pronto para transformar sua carreira?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
            Cadastre-se agora e comece sua jornada rumo ao sucesso profissional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/matricula"
              className="inline-flex items-center gap-2 bg-secondary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary-600 transition-colors shadow-lg"
            >
              Comece Agora
              <FiArrowRight className="text-xl" />
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 bg-white/15 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/25 transition-colors border border-white/20"
            >
              Ver Cursos
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

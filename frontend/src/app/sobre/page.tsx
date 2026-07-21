'use client';

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
  FiMapPin,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';

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

      {/* Missão, Visão e Valores */}
      <section className="py-8 lg:py-12 bg-secondary-50 dark:bg-secondary-900/20">
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

      {/* Localização e Contato */}
      <section className="py-8 lg:py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Localização e Contato</h2>
            <p className="section-subtitle mt-1">Estamos à disposição para atendê-lo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiMapPin className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Endereço</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Rua João da Cruz Monteiro, 1728<br />
                Cristo Rei, Teresina - PI<br />
                CEP 64.014-210
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiPhone className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Telefone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                (86) 99937-3900<br />
                <span className="text-gray-400 dark:text-gray-500">Seg - Sex: 8h às 18h</span>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiMail className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">E-mail</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                contato@faculdadediferencial.edu.br
              </p>
            </div>
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

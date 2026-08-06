import Link from 'next/link';
import { FiCheck, FiClock, FiArrowRight, FiAward, FiMonitor, FiEdit3, FiClipboard, FiBookOpen, FiCreditCard, FiShield } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import LpLeadForm from './LpLeadForm';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '5586994395019';

interface Course {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-gray-200 rounded-xl bg-white overflow-hidden">
      <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-4 text-sm font-semibold text-gray-800 list-none select-none">
        <span>{q}</span>
        <span className="text-secondary-500 text-lg leading-none transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="px-5 pb-4 text-sm text-gray-600">{a}</p>
    </details>
  );
}

export default function VestibularLp({ course }: { course: Course }) {
  const faqs = [
    { q: 'Como faço a inscrição no vestibular?', a: 'A inscrição é feita pelo próprio site, em poucos minutos. Basta preencher seus dados e escolher o polo de apoio desejado.' },
    { q: 'Como funciona a prova?', a: 'A prova é online, sem precisar sair de casa. Ela será aplicada em agosto/2026 e você recebe o acesso e todas as instruções por e-mail e WhatsApp.' },
    { q: 'O diploma é reconhecido?', a: 'Sim. A Licenciatura em Pedagogia tem certificação reconhecida, válida para atuação em Educação Infantil, Anos Iniciais do Ensino Fundamental e gestão escolar.' },
    { q: 'Qual o valor da mensalidade?', a: 'As mensalidades do curso começam em R$ 180,00 e podem ser parceladas. Consulte as condições promocionais para a turma de agosto/2026.' },
    { q: 'Quando começam as aulas?', a: 'A turma do Vestibular 2026.2 terá início após a matrícula, em agosto/2026, com flexibilidade de horário.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section id="topo" className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-600 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                <FiClock /> Vestibular 2026.2 · Turma agosto/2026
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
                Licenciatura em Pedagogia
              </h1>
              <p className="text-secondary-100 text-lg md:text-xl mb-8">
                Garanta sua vaga na turma de agosto/2026. Estude no seu ritmo, com certificado reconhecido.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl px-2 py-4 backdrop-blur">
                  <FiAward className="text-yellow-300 text-2xl mx-auto mb-1" />
                  <p className="text-white text-sm font-bold">Certificado reconhecido</p>
                </div>
                <div className="bg-white/10 rounded-xl px-2 py-4 backdrop-blur">
                  <FiMonitor className="text-yellow-300 text-2xl mx-auto mb-1" />
                  <p className="text-white text-sm font-bold">Prova online</p>
                </div>
                <div className="bg-white/10 rounded-xl px-2 py-4 backdrop-blur">
                  <FiCreditCard className="text-yellow-300 text-2xl mx-auto mb-1" />
                  <p className="text-white text-sm font-bold">A partir de R$ 180,00/mês</p>
                </div>
              </div>
            </div>
            <div id="lead" className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <FaWhatsapp className="text-secondary-500 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Receba informações</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Preencha seus dados e nossa equipe entrará em contato pelo WhatsApp sobre o Vestibular 2026.2 de Pedagogia.
              </p>
              <LpLeadForm courseTitle={course.title} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiShield, title: 'Certificação reconhecida', desc: 'Válida em todo o Brasil' },
              { icon: FiClock, title: 'Flexibilidade de horário', desc: 'Estude no seu ritmo' },
              { icon: FiEdit3, title: 'Prova online', desc: 'Sem sair de casa' },
              { icon: FiCreditCard, title: 'A partir de R$ 180,00/mês', desc: 'Condições para turma 2026.2' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-9 h-9 bg-secondary-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sobre a Licenciatura em Pedagogia</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {course.description || 'A Licenciatura em Pedagogia forma profissionais para atuar na Educação Infantil, nos Anos Iniciais do Ensino Fundamental e na gestão escolar, com ensino a distância, metodologia prática e certificação reconhecida.'}
            </p>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Onde você pode atuar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Educação Infantil', 'Anos Iniciais do Fundamental', 'Gestão Escolar'].map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-secondary-100 bg-secondary-50">
                  <FiBookOpen className="text-secondary-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">{a}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl p-6 md:p-8 text-white">
            <FiClipboard className="text-3xl mb-4" />
            <h3 className="text-xl font-bold mb-4">Como funciona o vestibular</h3>
            <ol className="space-y-5">
              {[
                { n: '01', t: 'Faça sua inscrição online', d: 'Preencha o formulário em poucos minutos e receba o acesso.' },
                { n: '02', t: 'Realize a prova online', d: 'Em agosto/2026, sem sair de casa. Simples e rápido.' },
                { n: '03', t: 'Faça sua matrícula', d: 'Confirme sua vaga e comece a estudar na turma 2026.2.' },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">{s.n}</span>
                  <div>
                    <p className="font-bold">{s.t}</p>
                    <p className="text-sm text-white/80">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Investimento</h2>
            <p className="text-gray-500">Condições especiais para a turma do Vestibular 2026.2</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-secondary-500 shadow-lg p-6 md:col-span-3">
              <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide mb-2">Mensalidade a partir de</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">R$ 180,00<span className="text-base font-semibold text-gray-400">/mês</span></p>
              <p className="text-sm text-gray-500 mb-4">Valor promocional para os primeiros matriculados na turma de agosto/2026.</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Inscrição e prova online</li>
                <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Parcelamento facilitado</li>
                <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Material e plataforma incluídos</li>
                <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Certificação reconhecida</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Perguntas frequentes</h2>
          <p className="text-gray-500">Tire suas dúvidas sobre o vestibular</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      <section className="bg-gradient-to-r from-secondary-500 to-primary-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Garanta sua vaga na turma de agosto/2026!
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#lead" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-secondary-600 rounded-xl font-bold hover:bg-secondary-50 transition-all shadow-lg">
              Quero me inscrever <FiArrowRight />
            </a>
            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Quero saber mais sobre o Vestibular 2026.2 de Pedagogia.')}`} target="_blank" rel="noopener noreferrer"
              className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all inline-flex items-center gap-2">
              <FaWhatsapp /> Falar com consultor
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

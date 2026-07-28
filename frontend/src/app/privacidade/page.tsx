'use client';

import React from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { FiShield, FiLock, FiUser, FiDatabase, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function PrivacidadePage() {
  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-16">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-4">
            <FiShield className="text-3xl" />
            <h1 className="text-3xl lg:text-4xl font-bold">Política de Privacidade</h1>
          </div>
          <p className="text-primary-100 text-lg max-w-2xl">
            Última atualização: Julho de 2026
          </p>
        </div>
      </div>

      <div className="container-custom py-12 lg:py-16">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Introdução
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A <strong>Faculdade Diferencial</strong>, pessoa jurídica de direito privado, inscrita no
              CNPJ sob o nº <strong>[INSERIR CNPJ]</strong>, com sede na Rua João da Cruz Monteiro, 1728,
              Cristo Rei, Teresina – PI, CEP 64.014-210, é a responsável pelo tratamento dos dados pessoais
              coletados por meio de seu site e plataforma de ensino a distância.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as
              informações dos nossos alunos, visitantes e usuários, em conformidade com a{' '}
              <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD)</strong> e demais
              legislações aplicáveis.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Dados Coletados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Podemos coletar os seguintes tipos de dados pessoais:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiUser className="text-primary-500" /> Dados Cadastrais
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Nome completo</li>
                  <li>CPF e RG</li>
                  <li>Data de nascimento</li>
                  <li>Endereço completo</li>
                  <li>Telefone e e-mail</li>
                  <li>Foto (quando aplicável)</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiDatabase className="text-primary-500" /> Dados Acadêmicos
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Histórico escolar</li>
                  <li>Notas e frequência</li>
                  <li>Progresso nas disciplinas</li>
                  <li>Certificados emitidos</li>
                  <li>Documentos enviados</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiLock className="text-primary-500" /> Dados de Acesso
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador e dispositivo</li>
                  <li>Datas e horários de acesso</li>
                  <li>Páginas visitadas na plataforma</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FiMail className="text-primary-500" /> Dados Financeiros
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Dados de pagamento (cartão, boleto)</li>
                  <li>Histórico de transações</li>
                  <li>Informações de fatura</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Finalidade do Tratamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Os dados pessoais são tratados para as seguintes finalidades:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Realização do cadastro e matrícula nos cursos</li>
              <li>Gestão acadêmica (notas, frequência, certificados)</li>
              <li>Processamento de pagamentos e cobranças</li>
              <li>Comunicação sobre prazos, atividades e novidades</li>
              <li>Envio de materiais didáticos e notificações</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Melhoria da experiência do usuário na plataforma</li>
              <li>Envio de informações marketing (com consentimento)</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Base Legal
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O tratamento dos seus dados pessoais é realizado com base em:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside mt-3">
              <li><strong>Execução de contrato</strong> – para cumprir obrigações decorrentes da matrícula</li>
              <li><strong>Consentimento</strong> – para envio de comunicações de marketing</li>
              <li><strong>Obrigação legal</strong> – para cumprimento de normas educacionais e fiscais</li>
              <li><strong>Legítimo interesse</strong> – para melhoria dos serviços e prevenção à fraude</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Compartilhamento de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Seus dados pessoais <strong>não serão vendidos ou compartilhados</strong> com terceiros para
              fins comerciais. Podemos compartilhar dados apenas nas seguintes situações:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside mt-3">
              <li>Com processadores de pagamento (para processar transações)</li>
              <li>Com autoridades educacionais (quando exigido por lei)</li>
              <li>Com prestadores de serviços tecnológicos (hospedagem, e-mail)</li>
              <li>Por determinação judicial ou ordem de autoridade competente</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">6</span>
              Armazenamento e Segurança
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Seus dados são armazenados em servidores seguros com criptografia e medidas técnicas e
              administrativas para protegê-los contra acessos não autorizados, alterações, divulgações ou
              destruições não autorizadas. Utilizamos protocolos SSL/TLS para transmissão segura de dados.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Os dados acadêmicos são mantidos pelo período necessário para cumprir as finalidades
              descritas nesta política e as obrigações legais aplicáveis, sendo eliminados de forma
              segura quando não forem mais necessários.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">7</span>
              Seus Direitos (LGPD)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              De acordo com a LGPD, você tem o direito de:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Confirmar a existência de tratamento de dados',
                'Acessar seus dados pessoais',
                'Corrigir dados incompletos ou desatualizados',
                'Solicitar a anonimização ou exclusão de dados',
                'Solicitar a portabilidade dos dados',
                'Revogar o consentimento a qualquer momento',
                'Opor-se ao tratamento em certas hipóteses',
                'Reclamar junto à ANPD',
              ].map((direito, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {direito}
                </div>
              ))}
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">8</span>
              Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência na plataforma,
              lembrar suas preferências e analisar o tráfego. Você pode configurar seu navegador para
              recusar cookies, mas isso pode afetar o funcionamento da plataforma.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">9</span>
              Menores de Idade
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nossos serviços são destinados a maiores de 18 anos ou menores emancipados. Caso
              identifiquemos o cadastro de menor de idade sem a devida autorização, os dados serão
              imediatamente excluídos.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">10</span>
              Alterações nesta Política
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta Política de Privacidade pode ser atualizada a qualquer momento. Recomendamos que
              você consulte esta página periodicamente. As alterações entrarão em vigor na data de sua
              publicação.
            </p>
          </section>

          {/* 11 */}
          <section className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">11</span>
              Contato
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FiMail className="text-primary-500" />
                contato@faculdadediferencial.edu.br
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FiPhone className="text-primary-500" />
                (86) 99937-3900
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600 mt-3">
              <FiMapPin className="text-primary-500 shrink-0 mt-0.5" />
              Rua João da Cruz Monteiro, 1728, Cristo Rei, Teresina – PI, CEP 64.014-210
            </div>
          </section>

        </div>
      </div>
    </PublicLayout>
  );
}

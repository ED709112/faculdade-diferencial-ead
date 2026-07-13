import React from 'react';
import Link from 'next/link';
import { FaGraduationCap, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

const courseLinks = [
  { label: 'Administração', href: '/cursos?categoria=administracao' },
  { label: 'Direito', href: '/cursos?categoria=direito' },
  { label: 'Enfermagem', href: '/cursos?categoria=enfermagem' },
  { label: 'Engenharia', href: '/cursos?categoria=engenharia' },
  { label: 'Psicologia', href: '/cursos?categoria=psicologia' },
];

const usefulLinks = [
  { label: 'Sobre Nós', href: '/sobre' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Política de Privacidade', href: '/privacidade' },
  { label: 'Termos de Uso', href: '/termos' },
];

const socialLinks = [
  { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaLinkedinIn, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-800 text-white">
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Sobre */}
          <div>
            <div className="mb-4">
              <img src="/images/logo.jpg" alt="Faculdade Diferencial EAD" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-primary-200 text-sm leading-relaxed mb-6">
              Oferecemos educação de qualidade com flexibilidade para que você possa
              conciliar estudos, trabalho e vida pessoal. Transformando carreiras
              através do ensino superior.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center
                             hover:bg-secondary-500 transition-colors duration-200"
                >
                  <social.icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Cursos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Cursos</h3>
            <ul className="space-y-2.5">
              {courseLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-200 text-sm hover:text-white hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Úteis */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2.5">
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-200 text-sm hover:text-white hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-secondary-500 mt-0.5 shrink-0" />
                <span className="text-primary-200 text-sm">
                  Av. Principal, 1000 - Centro<br />
                  São Paulo, SP - 01000-000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-secondary-500 shrink-0" />
                <span className="text-primary-200 text-sm">(11) 3000-0000</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-secondary-500 shrink-0" />
                <span className="text-primary-200 text-sm">contato@faculdadediferencial.edu.br</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary-700">
        <div className="container-custom py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-300 text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} Faculdade Diferencial EAD. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-primary-300">
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

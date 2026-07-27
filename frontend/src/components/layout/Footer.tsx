import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

const institutionalLinks = [
  { label: 'Graduação', href: 'https://faculdadediferencial.com.br/graduacao/pedagogia/' },
  { label: 'Pós-Graduação', href: '/cursos?tipo=pos' },
  { label: 'A FAD', href: '/sobre' },
  { label: 'Egressos', href: '/egressos' },
  { label: 'Fale Conosco', href: '/contato' },
  { label: 'Ouvidoria', href: '/ouvidoria' },
];

const socialLinks = [
  { icon: FaFacebookF, href: 'https://www.facebook.com/share/1CynLuVEnH/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: FaInstagram, href: 'https://www.instagram.com/faculdadediferencial', label: 'Instagram' },
  { icon: FaLinkedinIn, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: FaYoutube, href: 'https://www.youtube.com/@FaculdadeDiferencial', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-800 text-white">
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-8 lg:gap-16">
          {/* Sobre */}
          <div className="sm:col-span-1">
            <div className="mb-4">
              <span className="text-xl font-bold text-white">Faculdade Diferencial EAD</span>
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

          {/* Institucional */}
          <div className="sm:col-span-2 sm:text-center">
            <h3 className="text-lg font-semibold mb-4">Institucional</h3>
            <ul className="space-y-2.5 inline-block text-left">
              {institutionalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-primary-200 text-sm hover:text-white hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="sm:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-secondary-500 mt-0.5 shrink-0" />
                <span className="text-primary-200 text-sm">
                  Rua João da Cruz Monteiro, 1728<br />
                  Cristo Rei, Teresina - PI<br />
                  CEP 64.014-210
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-secondary-500 shrink-0" />
                <span className="text-primary-200 text-sm">(86) 99937-3900</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-secondary-500 shrink-0" />
                <span className="text-primary-200 text-sm">contato@faculdadediferencial.edu.br</span>
              </li>
            </ul>
          </div>

          {/* MEC QR Code */}
          <div className="sm:col-span-1 flex flex-col items-center sm:items-start">
            <h3 className="text-lg font-semibold mb-4">Cadastro MEC</h3>
            <a
              href="https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/MTkzMTk="
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img src="/images/qrcode-mec.png" alt="QR Code MEC" className="w-40 h-40 rounded-lg bg-white p-1" />
            </a>
            <p className="text-primary-200 text-xs mt-2 text-center sm:text-left">Consulte aqui o cadastro da instituição no MEC</p>
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

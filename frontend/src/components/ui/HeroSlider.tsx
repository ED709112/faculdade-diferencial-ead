'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const slides = [
  {
    image: '/images/hero-banner.jpg',
    title: 'Invista em você!',
    subtitle: 'Cursos EAD com flexibilidade, qualidade e certificação para o mercado de trabalho.',
    cta: 'Ver Cursos',
    ctaHref: '/cursos',
  },
  {
    image: '/images/hero-banner-2.jpg',
    title: 'Educação Intercultural',
    subtitle: 'Formação profissional com olhar humano, inclusivo e acessível para todos.',
    cta: 'Conheça Nossos Cursos',
    ctaHref: '/cursos',
  },
  {
    image: '/images/hero-banner-3.webp',
    title: 'Qualidade no Ensino Superior',
    subtitle: 'Cursos reconhecidos pelo MEC com corpo docente qualificado e metodologia inovadora.',
    cta: 'Matricule-se',
    ctaHref: '/matricula',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500">
      <div className="flex flex-col lg:flex-row min-h-[400px] lg:min-h-[480px]">
        {/* Image side */}
        <div className="w-full lg:w-1/2 relative h-[280px] lg:h-auto">
          {slides.map((slide, i) => (
            <img
              key={i}
              src={slide.image}
              alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === current ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary-600/80 hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-600/80 lg:hidden" />
        </div>

        {/* Text side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center text-center lg:text-left px-6 py-10 lg:px-12 lg:py-16 relative">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col items-center lg:items-start justify-center text-center lg:text-left px-6 py-10 lg:px-12 lg:py-16 transition-opacity duration-700 ${
                i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {slide.title}
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mt-4 leading-relaxed max-w-lg">
                {slide.subtitle}
              </p>
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 mt-8 bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                {slide.cta}
                <FiArrowRight className="text-xl" />
              </Link>
            </div>
          ))}

          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-20 lg:hidden"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-20 lg:hidden"
          >
            <FiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Desktop arrows */}
      <button
        onClick={prev}
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full items-center justify-center text-white transition-colors z-20"
      >
        <FiChevronLeft className="text-2xl" />
      </button>
      <button
        onClick={next}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full items-center justify-center text-white transition-colors z-20"
      >
        <FiChevronRight className="text-2xl" />
      </button>
    </section>
  );
}

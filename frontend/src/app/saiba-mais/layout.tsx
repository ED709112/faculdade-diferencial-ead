import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faculdade Diferencial | Saiba Mais',
  description: 'Faculdade Diferencial. Cursos de graduação e pós-graduação com qualidade, flexibilidade e certificação reconhecida.',
  openGraph: {
    title: 'Faculdade Diferencial | Saiba Mais',
    description: 'Cursos de graduação e pós-graduação com qualidade, flexibilidade e certificação reconhecida pelo MEC. Mensalidades a partir de R$ 49,90.',
    url: 'https://fadead.com.br/saiba-mais',
    siteName: 'Faculdade Diferencial',
    images: [{ url: 'https://fadead.com.br/images/students-hero.jpg', width: 612, height: 408 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faculdade Diferencial | Saiba Mais',
    description: 'Cursos de graduação e pós-graduação com qualidade, flexibilidade e certificação reconhecida pelo MEC.',
    images: ['https://fadead.com.br/images/students-hero.jpg'],
  },
};

export default function SaibaMaisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

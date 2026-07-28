import React from 'react';
import Link from 'next/link';

interface CategoryCardProps {
  name: string;
  slug: string;
  icon: React.ReactNode;
  courseCount: number;
}

export default function CategoryCard({ name, slug, icon, courseCount }: CategoryCardProps) {
  return (
    <Link
      href={`/cursos?categoria=${slug}`}
      className="card group p-6 flex flex-col items-center text-center gap-3 bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200"
    >
      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
        <span className="text-2xl text-white">
          {icon}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-white">
          {name}
        </h3>
        <p className="text-sm text-white/80 mt-1">
          {courseCount} {courseCount === 1 ? 'curso' : 'cursos'}
        </p>
      </div>
    </Link>
  );
}

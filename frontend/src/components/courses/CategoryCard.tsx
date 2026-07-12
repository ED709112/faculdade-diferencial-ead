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
      className="card group p-6 flex flex-col items-center text-center gap-3"
    >
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center
                      group-hover:bg-primary-500 transition-colors duration-200">
        <span className="text-2xl text-primary-500 group-hover:text-white transition-colors duration-200">
          {icon}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {courseCount} {courseCount === 1 ? 'curso' : 'cursos'}
        </p>
      </div>
    </Link>
  );
}

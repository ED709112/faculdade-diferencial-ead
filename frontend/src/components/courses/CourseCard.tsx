import React from 'react';
import Link from 'next/link';
import { FiStar, FiClock } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

interface Course {
  id: number;
  title: string;
  slug: string;
  image?: string;
  teacher_name: string;
  price: number;
  original_price?: number;
  workload: number;
  rating_avg: number;
  rating_count: number;
  category_name: string;
}

interface CourseCardProps {
  course: Course;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CourseCard({ course }: CourseCardProps) {
  const hasDiscount = course.original_price && course.original_price > course.price;

  return (
    <Link href={`/curso/${course.slug}`} className="card group block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-primary-500 text-4xl font-bold">
              {course.title.charAt(0)}
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 badge bg-white/90 text-primary-500 font-medium">
          {course.category_name}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-500 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">por {course.teacher_name}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`text-sm ${
                i < Math.round(course.rating_avg) ? 'text-yellow-400' : 'text-gray-200'
              }`}
            />
          ))}
          <span className="text-sm text-gray-500 ml-1">
            {Number(course.rating_avg).toFixed(1)} ({course.rating_count})
          </span>
        </div>

        {/* Workload */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <FiClock />
          <span>{course.workload}h de conteúdo</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {formatPrice(course.original_price!)}
              </span>
            )}
            <span className="text-lg font-bold text-secondary-500">
              {formatPrice(course.price)}
            </span>
          </div>
          <span className="text-sm font-medium text-primary-500 group-hover:underline">
            Ver Curso
          </span>
        </div>
      </div>
    </Link>
  );
}

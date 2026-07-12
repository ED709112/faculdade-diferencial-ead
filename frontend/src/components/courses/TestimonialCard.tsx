import React from 'react';
import { FaStar } from 'react-icons/fa';

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

export default function TestimonialCard({ name, role, content, rating, avatar }: TestimonialCardProps) {
  return (
    <div className="card p-6 flex flex-col">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar
            key={i}
            className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>

      {/* Content */}
      <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">
        &ldquo;{content}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-500 font-semibold text-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

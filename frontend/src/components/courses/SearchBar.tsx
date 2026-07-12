'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/courses/search?q=${encodeURIComponent(query)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.data || data || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/cursos?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (slug: string) => {
    router.push(`/curso/${slug}`);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          placeholder="Buscar cursos..."
          className="input-field pl-12 pr-12"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.slug)}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50
                         transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <FiSearch className="text-gray-300 mr-3 shrink-0" />
              {item.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

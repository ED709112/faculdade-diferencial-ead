'use client';

import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggle(index)}
              className="flex items-center justify-between w-full px-5 py-4 text-left
                         hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 text-sm pr-4">{item.question}</span>
              <FiChevronDown
                className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isOpen ? '500px' : '0px',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

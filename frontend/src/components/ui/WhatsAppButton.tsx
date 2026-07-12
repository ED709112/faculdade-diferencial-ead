'use client';

import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP;

  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');
  const href = `https://wa.me/${cleaned}?text=${encodeURIComponent('Olá! Gostaria de mais informações.')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="whatsapp-float"
    >
      <FaWhatsapp />
    </a>
  );
}

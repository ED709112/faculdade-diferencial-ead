'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiAward,
  FiStar,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiTarget,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  points: number;
  earned_at?: string;
}

interface UserBadgesData {
  earned: Badge[];
  all: Badge[];
  total_points: number;
  rank: number;
  history: { id: number; points: number; reason: string; created_at: string; badge_name?: string }[];
}

export default function ConquistasPage() {
  const [data, setData] = useState<UserBadgesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: result } = await api.get('/badges/my');
      setData(result);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getBadgeIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Primeiro Passo': '🚀',
      'Estudante Dedicado': '📚',
      'Mestre do Conhecimento': '🧠',
      'Primeiro Certificado': '🏆',
      'Explorador': '🔍',
      'Comentarista': '💬',
      'Perfeccionista': '💎',
      'Graduado': '🎓',
    };
    return icons[name] || '⭐';
  };

  if (loading) return <Loading text="Carregando conquistas..." />;
  if (!data) return null;

  const earnedIds = new Set(data.earned.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Minhas Conquistas</h2>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe suas badges, pontos e posição no ranking
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
            <FiStar className="text-xl text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Pontos</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_points}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <FiAward className="text-xl text-primary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Badges Conquistadas</p>
            <p className="text-2xl font-bold text-gray-900">{data.earned.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center">
            <FiTrendingUp className="text-xl text-secondary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ranking Geral</p>
            <p className="text-2xl font-bold text-gray-900">#{data.rank}</p>
          </div>
        </div>
      </div>

      {/* All badges grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Todas as Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.all.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl p-5 text-center transition-all ${
                  earned
                    ? 'bg-white shadow-md border-2 border-primary-200'
                    : 'bg-gray-50 border-2 border-transparent opacity-60'
                }`}
              >
                <div className={`text-4xl mb-3 ${earned ? '' : 'grayscale'}`}>
                  {getBadgeIcon(badge.name)}
                </div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                <p className={`text-xs font-medium ${earned ? 'text-primary-600' : 'text-gray-400'}`}>
                  +{badge.points} pts
                </p>
                {earned && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <FiCheckCircle className="text-green-500" /> Conquistada
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Points history */}
      {data.history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pontos</h3>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {data.history.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                      <FiTarget className="text-sm text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.reason}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FiClock className="text-xs" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

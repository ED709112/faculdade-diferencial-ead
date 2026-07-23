'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiAward,
  FiStar,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiUsers,
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

interface RankingUser {
  id: number;
  name: string;
  avatar?: string;
  total_points: number;
  badge_count: number;
}

interface RankingData {
  ranking: RankingUser[];
  me: { rank: number; total_points: number; badge_count: number };
}

export default function ConquistasPage() {
  const [data, setData] = useState<UserBadgesData | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'badges' | 'ranking'>('badges');

  const fetchData = useCallback(async () => {
    try {
      const [badgesResult, rankingResult] = await Promise.all([
        api.get('/badges/my'),
        api.get('/badges/ranking?limit=20'),
      ]);
      setData(badgesResult.data);
      setRanking(rankingResult.data);
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
      'Participante Ativo': '🎯',
      'Colaborador': '🤝',
    };
    return icons[name] || '⭐';
  };

  const getRankMedal = (position: number) => {
    if (position === 1) return { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: '🥇' };
    if (position === 2) return { color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/50', label: '🥈' };
    if (position === 3) return { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: '🥉' };
    return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/30', label: `#${position}` };
  };

  if (loading) return <Loading text="Carregando conquistas..." />;
  if (!data) return null;

  const earnedIds = new Set(data.earned.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Minhas Conquistas</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Acompanhe suas badges, pontos e posição no ranking
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <FiStar className="text-xl text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Pontos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.total_points}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <FiAward className="text-xl text-primary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Badges Conquistadas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.earned.length}/{data.all.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center">
            <FiTrendingUp className="text-xl text-secondary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ranking Geral</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{ranking?.me.rank || data.rank}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('badges')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'badges'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FiAward className="inline mr-1.5" /> Badges
        </button>
        <button
          onClick={() => setTab('ranking')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'ranking'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FiAward className="inline mr-1.5" /> Ranking
        </button>
      </div>

      {tab === 'badges' ? (
        <>
          {/* All badges grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Todas as Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.all.map((badge) => {
                const earned = earnedIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-5 text-center transition-all ${
                      earned
                        ? 'bg-white dark:bg-gray-800 shadow-md border-2 border-primary-200 dark:border-primary-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent opacity-60'
                    }`}
                  >
                    <div className={`text-4xl mb-3 ${earned ? '' : 'grayscale'}`}>
                      {getBadgeIcon(badge.name)}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">{badge.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{badge.description}</p>
                    <p className={`text-xs font-medium ${earned ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      +{badge.points} pts
                    </p>
                    {earned && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Histórico de Pontos</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                          <FiTarget className="text-sm text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.reason}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
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
        </>
      ) : (
        /* Ranking tab */
        <div className="space-y-4">
          {/* My position highlight */}
          {ranking?.me && (
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    #{ranking.me.rank}
                  </div>
                  <div>
                    <p className="font-bold text-lg">Sua Posição</p>
                    <p className="text-white/80 text-sm">{ranking.me.total_points} pontos · {ranking.me.badge_count} badges</p>
                  </div>
                </div>
                <FiAward className="text-4xl text-white/30" />
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiUsers className="text-primary-500" /> Ranking Geral
              </h3>
            </div>
            {!ranking?.ranking || ranking.ranking.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <FiAward className="text-4xl mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">Nenhum aluno no ranking ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {ranking.ranking.map((user, index) => {
                  const position = index + 1;
                  const medal = getRankMedal(position);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                        user.id === data.rank ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${medal.bg} ${medal.color}`}>
                        {medal.label}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-primary-500">{user.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.badge_count} badge{user.badge_count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{user.total_points}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">pontos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

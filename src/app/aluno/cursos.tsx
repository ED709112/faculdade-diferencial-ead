import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

interface Enrollment {
  id: number;
  course_id: number;
  progress_percentage: number;
  status: string;
  started_at: string;
  last_accessed_at: string;
  course_title: string;
  course_slug: string;
  course_image: string;
  teacher_name: string;
  workload: number;
}

export default function MeusCursosScreen() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchEnrollments = async () => {
        try {
          const { data } = await api.get('/enrollments/my');
          if (!cancelled) setEnrollments(data.data || data || []);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchEnrollments();
      return () => { cancelled = true; };
    }, [])
  );

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return '#22c55e';
    if (pct >= 50) return '#f97316';
    return '#3b82f6';
  };

  const renderEnrollment = ({ item }: { item: Enrollment }) => (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-2xl mb-4 mx-6 overflow-hidden shadow-sm"
      onPress={() => router.push(`/curso/player/${item.id}`)}
    >
      {/* Image */}
      <View className="h-32 bg-primary-50 dark:bg-primary-900/20 items-center justify-center">
        <Ionicons name="school-outline" size={36} color="#1a56db" />
        {item.status === 'completed' && (
          <View className="absolute top-3 right-3 bg-green-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-semibold">Concluído</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={2}>
          {item.course_title}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {item.teacher_name} • {item.workload}h
        </Text>

        {/* Progress bar */}
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-gray-500 text-xs">Progresso</Text>
            <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
              {Math.round(item.progress_percentage)}%
            </Text>
          </View>
          <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(item.progress_percentage, 100)}%`,
                backgroundColor: getProgressColor(item.progress_percentage),
              }}
            />
          </View>
        </View>

        {/* Action */}
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-xs text-gray-400">
            {item.progress_percentage >= 100 ? 'Curso concluído' : 'Continue de onde parou'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Meus Cursos</Text>
        </View>
        <Text className="text-white/70 text-sm">
          {enrollments.length} curso{enrollments.length !== 1 ? 's' : ''} matriculado{enrollments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={enrollments}
        renderItem={renderEnrollment}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Ionicons name="school-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-lg">
              {loading ? 'Carregando...' : 'Nenhum curso matriculado'}
            </Text>
            <TouchableOpacity
              className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
              onPress={() => router.push('/(tabs)/cursos')}
            >
              <Text className="text-white font-semibold">Explorar Cursos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

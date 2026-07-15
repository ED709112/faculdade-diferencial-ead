import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface Course {
  id: number;
  title: string;
  slug: string;
  price: number;
  original_price: number;
  image: string;
  workload: number;
  teacher_name: string;
  category_name: string;
  rating_avg: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, catsRes] = await Promise.allSettled([
        api.get('/courses/featured'),
        api.get('/categories'),
      ]);
      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data.data || coursesRes.value.data || []);
      }
      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value.data.data || catsRes.value.data || []);
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-4 pb-8 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/70 text-sm">Bem-vindo(a),</Text>
              <Text className="text-white text-xl font-bold">{user?.name || 'Aluno'}</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="notifications-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TouchableOpacity
            className="bg-white/20 rounded-xl px-4 py-3 flex-row items-center gap-3"
            onPress={() => router.push('/(tabs)/cursos')}
          >
            <Ionicons name="search-outline" size={20} color="white" />
            <Text className="text-white/60">Buscar cursos...</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 -mt-4">
          {/* Quick Actions */}
          {user && (
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 bg-primary-600 rounded-xl p-4 flex-row items-center gap-3"
                onPress={() => router.push('/aluno/cursos')}
              >
                <Ionicons name="school-outline" size={24} color="white" />
                <View className="flex-1">
                  <Text className="text-white font-bold">Meus Cursos</Text>
                  <Text className="text-white/70 text-xs">Continue estudando</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-secondary-500 rounded-xl p-4 flex-row items-center gap-3"
                onPress={() => router.push('/certificados')}
              >
                <Ionicons name="ribbon-outline" size={24} color="white" />
                <View className="flex-1">
                  <Text className="text-white font-bold">Certificados</Text>
                  <Text className="text-white/70 text-xs">Seus diplomas</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            {[
              { icon: 'school-outline', value: '120+', label: 'Cursos' },
              { icon: 'people-outline', value: '5.000+', label: 'Alunos' },
              { icon: 'ribbon-outline', value: '3.000+', label: 'Certificados' },
            ].map((stat, i) => (
              <Card key={i} variant="elevated" padding="md" className="flex-1 mx-1 items-center">
                <Ionicons name={stat.icon as any} size={24} color="#1a56db" />
                <Text className="text-lg font-bold text-gray-900 dark:text-white mt-1">{stat.value}</Text>
                <Text className="text-xs text-gray-500">{stat.label}</Text>
              </Card>
            ))}
          </View>

          {/* Categories */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Categorias
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 mr-3 border border-gray-100 dark:border-gray-700"
                  onPress={() => router.push('/(tabs)/cursos')}
                >
                  <Text className="text-gray-900 dark:text-white font-medium">{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Courses */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Cursos em Destaque
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cursos')}>
                <Text className="text-primary-600 font-medium">Ver todos</Text>
              </TouchableOpacity>
            </View>

            {courses.map((course) => (
              <Card
                key={course.id}
                variant="elevated"
                padding="none"
                className="mb-4 overflow-hidden"
                onPress={() => router.push(`/curso/${course.slug}`)}
              >
                <View className="h-40 bg-gray-200">
                  {course.image && (
                    <View className="w-full h-full bg-primary-100 items-center justify-center">
                      <Ionicons name="school-outline" size={40} color="#1a56db" />
                    </View>
                  )}
                </View>
                <View className="p-4">
                  <Text className="text-xs text-primary-600 font-medium mb-1">
                    {course.category_name}
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-bold text-base mb-1" numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text className="text-gray-500 text-sm mb-2">
                    {course.teacher_name} • {course.workload}h
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text className="text-gray-600 text-sm">{course.rating_avg || '0.0'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {course.original_price && Number(course.original_price) > Number(course.price) && (
                        <Text className="text-gray-400 text-sm line-through">
                          R$ {Number(course.original_price).toFixed(2)}
                        </Text>
                      )}
                      <Text className="text-primary-600 font-bold text-lg">
                        {Number(course.price) === 0
                          ? 'Grátis'
                          : `R$ ${Number(course.price).toFixed(2)}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

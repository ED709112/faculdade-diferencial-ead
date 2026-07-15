import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { CardView } from '@/components/ui/Card';
import api from '@/lib/api';

interface Course {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  content_program: string;
  price: number;
  original_price: number;
  workload: number;
  workload_certificate: number;
  image: string;
  teacher_name: string;
  teacher_bio: string;
  category_name: string;
  enrollment_count: number;
  rating_avg: string;
  rating_count: number;
  requirements: string;
  target_audience: string;
  what_you_learn: string;
  has_certificate: number;
  is_free: number;
  max_installments: number;
}

export default function CursoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/slug/${slug}`);
        setCourse(data.data || data);
      } catch {} finally {
        setLoading(false);
      }
    };
    if (slug) fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-400 mt-4">Curso não encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View className="h-56 bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
          <Ionicons name="school-outline" size={64} color="#1a56db" />
        </View>

        {/* Back button */}
        <TouchableOpacity
          className="absolute top-12 left-4 bg-black/40 rounded-full p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Content */}
        <View className="px-6 py-6">
          <Text className="text-xs text-primary-600 font-semibold uppercase mb-2">
            {course.category_name}
          </Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {course.title}
          </Text>
          {course.subtitle && (
            <Text className="text-gray-500 text-base mb-3">{course.subtitle}</Text>
          )}

          {/* Meta */}
          <View className="flex-row items-center gap-4 mb-4">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text className="text-gray-600 text-sm">
                {course.rating_avg || '0.0'} ({course.rating_count} avaliações)
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="people-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm">{course.enrollment_count} alunos</Text>
            </View>
          </View>

          {/* Teacher */}
          <View className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary-600 font-bold text-lg">
                {course.teacher_name?.charAt(0) || '?'}
              </Text>
            </View>
            <View>
              <Text className="text-gray-900 dark:text-white font-semibold">
                {course.teacher_name}
              </Text>
              <Text className="text-gray-500 text-sm">Professor</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View className="flex-row justify-between mb-6">
            {[
              { icon: 'time-outline', value: `${course.workload}h`, label: 'Carga Horária' },
              { icon: 'book-outline', value: course.has_certificate ? 'Sim' : 'Não', label: 'Certificado' },
              { icon: 'repeat-outline', value: `12x`, label: 'Parcelamento' },
            ].map((info, i) => (
              <CardView key={i} variant="outlined" padding="md" className="flex-1 mx-1 items-center">
                <Ionicons name={info.icon as any} size={20} color="#1a56db" />
                <Text className="text-gray-900 dark:text-white font-bold mt-1">{info.value}</Text>
                <Text className="text-gray-500 text-xs">{info.label}</Text>
              </CardView>
            ))}
          </View>

          {/* Description */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Sobre o Curso
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-6">
            {course.description}
          </Text>

          {/* Program */}
          {course.content_program && (
            <>
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Programa do Curso
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-6">
                {course.content_program}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            {course.original_price && Number(course.original_price) > Number(course.price) && (
              <Text className="text-gray-400 text-sm line-through">
                R$ {Number(course.original_price).toFixed(2)}
              </Text>
            )}
            <Text className="text-2xl font-bold text-primary-600">
              {Number(course.price) === 0
                ? 'Grátis'
                : `R$ ${Number(course.price).toFixed(2)}`}
            </Text>
            {Number(course.price) > 0 && course.max_installments > 1 && (
              <Text className="text-gray-500 text-xs">
                ou até {course.max_installments}x de R$ {(Number(course.price) / course.max_installments).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <Button
          title="Matricular Agora"
          onPress={() => router.push(`/matricula/${course.id}`)}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

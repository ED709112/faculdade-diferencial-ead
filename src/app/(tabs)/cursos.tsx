import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
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

export default function CursosScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchCourses = async () => {
        try {
          const { data } = await api.get('/courses', {
            params: { status: 'published', limit: 50, search: search || undefined },
          });
          if (!cancelled) setCourses(data.data || data || []);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchCourses();
      return () => { cancelled = true; };
    }, [search])
  );

  const handleSearch = () => {
    setLoading(true);
    fetchCourses();
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <Card
      variant="elevated"
      padding="none"
      className="mb-4 mx-6 overflow-hidden"
      onPress={() => router.push(`/curso/${item.slug}`)}
    >
      <View className="h-36 bg-primary-50 dark:bg-primary-900/20 items-center justify-center">
        <Ionicons name="school-outline" size={36} color="#1a56db" />
      </View>
      <View className="p-4">
        <Text className="text-xs text-primary-600 font-medium mb-1">
          {item.category_name}
        </Text>
        <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {item.teacher_name} • {item.workload}h
        </Text>
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-gray-600 text-sm">{item.rating_avg || '0.0'}</Text>
          </View>
          <Text className="text-primary-600 font-bold text-lg">
            {Number(item.price) === 0
              ? 'Grátis'
              : `R$ ${Number(item.price).toFixed(2)}`}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-6">
        <Text className="text-white text-xl font-bold mb-4">Cursos</Text>
        <View className="flex-row items-center bg-white/20 rounded-xl px-3">
          <Ionicons name="search-outline" size={20} color="white" />
          <TextInput
            className="flex-1 text-white py-3 px-2"
            placeholder="Buscar curso..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); fetchCourses(); }}>
              <Ionicons name="close-circle" size={20} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Ionicons name="school-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4">
              {loading ? 'Carregando...' : 'Nenhum curso encontrado'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

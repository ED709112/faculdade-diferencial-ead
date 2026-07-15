import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz';
  video_url: string;
  text_content: string;
  pdf_url: string;
  sort_order: number;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
  total_lessons: number;
  completed_lessons: number;
}

interface CourseProgress {
  progress: number;
  completed: boolean;
  completed_lessons: number;
  total_lessons: number;
  quizzes_total: number;
  quizzes_passed: number;
  current_lesson_id: number | null;
}

interface Enrollment {
  id: number;
  course_id: number;
  course_title: string;
  modules: Module[];
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'aula' | 'material' | 'certificado'>('aula');
  const [showModules, setShowModules] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchData = async () => {
        try {
          const [enrollRes, progressRes] = await Promise.all([
            api.get(`/enrollments/${id}`),
            api.get(`/enrollments/${id}/course-progress`),
          ]);
          if (cancelled) return;
          const enroll = enrollRes.data.data || enrollRes.data;
          const prog = progressRes.data;
          setEnrollment(enroll);
          setProgress(prog);

          // Find current lesson
          if (prog.current_lesson_id && enroll.modules) {
            for (const mod of enroll.modules) {
              const lesson = mod.lessons?.find((l: Lesson) => l.id === prog.current_lesson_id);
              if (lesson) { setCurrentLesson(lesson); break; }
            }
          } else if (enroll.modules?.[0]?.lessons?.[0]) {
            setCurrentLesson(enroll.modules[0].lessons[0]);
          }

          // Load completed lessons
          const completedSet = new Set<number>();
          if (enroll.modules) {
            for (const mod of enroll.modules) {
              if (mod.completed_lessons === mod.total_lessons) {
                mod.lessons?.forEach((l: Lesson) => completedSet.add(l.id));
              }
            }
          }
          setCompletedLessons(completedSet);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      if (id) fetchData();
      return () => { cancelled = true; };
    }, [id])
  );

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('aula');
    setShowModules(false);
  };

  const handleCompleteLesson = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      await api.post(`/lessons/${currentLesson.id}/complete`);
      setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
      // Refresh progress
      const { data } = await api.get(`/enrollments/${id}/course-progress`);
      setProgress(data);
      if (data.completed) {
        alert('Parabéns! Curso concluído!');
      }
    } catch {} finally { setCompleting(false); }
  };

  if (loading) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><Text className="text-gray-400">Carregando...</Text></SafeAreaView>;
  }

  if (!enrollment || !currentLesson) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><Text className="text-gray-400">Curso não encontrado</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Top Bar */}
      <View className="bg-gray-900 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-semibold flex-1 mx-3" numberOfLines={1}>
          {enrollment.course_title}
        </Text>
        <TouchableOpacity onPress={() => setShowModules(!showModules)} className="p-1">
          <Ionicons name="list" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {progress && (
        <View className="h-1 bg-gray-800">
          <View
            className="h-full bg-secondary-500"
            style={{ width: `${progress.progress}%` }}
          />
        </View>
      )}

      {/* Content Area */}
      <View className="flex-1">
        {/* Module/Lesson selector (overlay) */}
        {showModules && (
          <View className="absolute inset-0 bg-gray-900 z-20">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
              <Text className="text-white font-bold text-lg">Módulos</Text>
              <TouchableOpacity onPress={() => setShowModules(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={enrollment.modules}
              keyExtractor={(m) => String(m.id)}
              renderItem={({ item: mod }) => (
                <View className="border-b border-gray-800">
                  <View className="px-4 py-3">
                    <Text className="text-white font-semibold">{mod.title}</Text>
                    <Text className="text-gray-400 text-xs">
                      {mod.completed_lessons}/{mod.total_lessons} aulas
                    </Text>
                  </View>
                  {mod.lessons?.map((lesson: Lesson) => (
                    <TouchableOpacity
                      key={lesson.id}
                      className={`px-6 py-3 flex-row items-center gap-3 ${
                        currentLesson.id === lesson.id ? 'bg-primary-900/30' : ''
                      }`}
                      onPress={() => handleSelectLesson(lesson)}
                    >
                      <Ionicons
                        name={
                          completedLessons.has(lesson.id)
                            ? 'checkmark-circle'
                            : lesson.content_type === 'video'
                            ? 'play-circle-outline'
                            : lesson.content_type === 'pdf'
                            ? 'document-text-outline'
                            : 'book-outline'
                        }
                        size={20}
                        color={completedLessons.has(lesson.id) ? '#22c55e' : '#9ca3af'}
                      />
                      <Text className={`flex-1 text-sm ${
                        currentLesson.id === lesson.id ? 'text-primary-400 font-semibold' : 'text-gray-300'
                      }`} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {/* Video/Content Area */}
        <View className="bg-gray-900" style={{ height: 220 }}>
          {currentLesson.content_type === 'video' && currentLesson.video_url ? (
            <Video
              ref={videoRef}
              source={{ uri: currentLesson.video_url }}
              style={{ flex: 1 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
            />
          ) : currentLesson.content_type === 'pdf' ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="document-text-outline" size={48} color="#6b7280" />
              <Text className="text-gray-400 mt-2">{currentLesson.title}</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Ionicons name="book-outline" size={48} color="#6b7280" />
              <Text className="text-white font-semibold mt-2">{currentLesson.title}</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="bg-white dark:bg-gray-900 flex-row border-b border-gray-200 dark:border-gray-800">
          {(['aula', 'material', 'certificado'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-3 items-center ${
                activeTab === tab ? 'border-b-2 border-primary-500' : ''
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`text-sm font-medium ${
                activeTab === tab ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {tab === 'aula' ? 'Aula' : tab === 'material' ? 'Material' : 'Certificado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView className="flex-1 bg-white dark:bg-gray-900" showsVerticalScrollIndicator={false}>
          {activeTab === 'aula' && (
            <View className="p-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLesson.title}
              </Text>
              {currentLesson.description && (
                <Text className="text-gray-600 dark:text-gray-400 mb-4">
                  {currentLesson.description}
                </Text>
              )}
              {currentLesson.content_type === 'text' && currentLesson.text_content && (
                <Text className="text-gray-700 dark:text-gray-300 leading-6">
                  {currentLesson.text_content}
                </Text>
              )}
              {currentLesson.content_type === 'quiz' && (
                <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 items-center">
                  <Ionicons name="help-circle-outline" size={48} color="#1a56db" />
                  <Text className="text-gray-900 dark:text-white font-bold text-lg mt-3 mb-2">
                    Avaliação do Curso
                  </Text>
                  <Text className="text-gray-500 text-center mb-4">
                    Responda as questões para ser aprovado e receber seu certificado.
                  </Text>
                  <Button
                    title="Iniciar Prova"
                    onPress={() => router.push(`/quiz/${currentLesson.id}`)}
                    fullWidth
                  />
                </View>
              )}
            </View>
          )}

          {activeTab === 'material' && (
            <View className="p-6">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Materiais</Text>
              {currentLesson.pdf_url ? (
                <TouchableOpacity className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex-row items-center gap-3">
                  <Ionicons name="document-text-outline" size={24} color="#1a56db" />
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium">PDF da Aula</Text>
                    <Text className="text-gray-500 text-xs">Toque para baixar</Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <Text className="text-gray-400">Nenhum material disponível</Text>
              )}
            </View>
          )}

          {activeTab === 'certificado' && (
            <View className="p-6 items-center">
              {progress?.completed ? (
                <>
                  <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                    <Ionicons name="ribbon-outline" size={36} color="#22c55e" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Parabéns!
                  </Text>
                  <Text className="text-gray-500 text-center mb-6">
                    Você concluiu o curso! Seu certificado está pronto.
                  </Text>
                  <Button
                    title="Ver Certificado"
                    onPress={() => router.push('/certificados')}
                    variant="primary"
                  />
                </>
              ) : (
                <>
                  <Ionicons name="ribbon-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-400 mt-4 text-center">
                    Complete o curso para gerar seu certificado
                  </Text>
                  {progress && (
                    <Text className="text-primary-600 font-semibold mt-2">
                      {Math.round(progress.progress)}% concluído
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Bottom Bar */}
      <View className="bg-white dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {progress && (
              <Text className="text-gray-500 text-xs">
                {progress.completed_lessons}/{progress.total_lessons} aulas • {progress.quizzes_passed}/{progress.quizzes_total} provas
              </Text>
            )}
          </View>
          {!completedLessons.has(currentLesson.id) ? (
            <Button
              title={completing ? 'Salvando...' : 'Concluir Aula'}
              onPress={handleCompleteLesson}
              loading={completing}
              size="sm"
            />
          ) : (
            <View className="flex-row items-center gap-2 bg-green-100 px-4 py-2 rounded-xl">
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text className="text-green-700 font-semibold text-sm">Concluída</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

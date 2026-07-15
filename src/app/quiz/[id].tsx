import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  options: string[];
  points: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_grade: number;
  max_attempts: number;
  questions: Question[];
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchQuiz = async () => {
        try {
          const { data } = await api.get(`/quizzes/${id}`);
          if (!cancelled) setQuiz(data.data || data);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      if (id) fetchQuiz();
      return () => { cancelled = true; };
    }, [id])
  );

  const handleStart = async () => {
    try {
      await api.post(`/quizzes/${id}/start`);
      setStarted(true);
      setCurrentQ(0);
      setAnswers({});
    } catch {}
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: Number(questionId),
        selected_option: answer,
      }));
      const { data } = await api.post(`/quizzes/${id}/submit`, {
        answers: answersArray,
      });
      setResult(data);
      setSubmitted(true);
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><Text className="text-gray-400">Carregando...</Text></SafeAreaView>;
  }

  if (!quiz) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><Text className="text-gray-400">Prova não encontrada</Text></SafeAreaView>;
  }

  // Result screen
  if (submitted && result) {
    const passed = result.is_passed || (result.score >= quiz.passing_grade);
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={56}
              color={passed ? '#22c55e' : '#ef4444'}
            />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? 'Aprovado!' : 'Não Aprovado'}
          </Text>
          <Text className="text-4xl font-bold text-gray-900 mb-2">
            {result.score || result.total_points || 0} pontos
          </Text>
          <Text className="text-gray-500 mb-2">
            Nota mínima: {quiz.passing_grade} pontos
          </Text>
          {result.total_points && (
            <Text className="text-gray-400 text-sm mb-6">
              {result.correct_answers || 0}/{result.total_questions || quiz.questions.length} questões corretas
            </Text>
          )}
          <Button
            title="Voltar ao Curso"
            onPress={() => router.back()}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  // Start screen
  if (!started) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-primary-600 px-6 pt-4 pb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Avaliação</Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-6">
            <Ionicons name="help-circle-outline" size={40} color="#1a56db" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {quiz.title}
          </Text>
          {quiz.description && (
            <Text className="text-gray-500 text-center mb-6">
              {quiz.description}
            </Text>
          )}

          <View className="bg-gray-50 rounded-xl p-4 w-full mb-6">
            {[
              { icon: 'help-circle-outline', label: 'Questões', value: String(quiz.questions?.length || 0) },
              { icon: 'time-outline', label: 'Tempo', value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Sem limite' },
              { icon: 'trophy-outline', label: 'Nota mínima', value: `${quiz.passing_grade} pts` },
              { icon: 'repeat-outline', label: 'Tentativas', value: String(quiz.max_attempts) },
            ].map((info, i) => (
              <View key={i} className="flex-row items-center gap-3 py-2">
                <Ionicons name={info.icon as any} size={20} color="#6b7280" />
                <Text className="text-gray-600 flex-1">{info.label}</Text>
                <Text className="text-gray-900 font-semibold">{info.value}</Text>
              </View>
            ))}
          </View>

          <Button title="Iniciar Prova" onPress={handleStart} fullWidth size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  // Quiz in progress
  const question = quiz.questions[currentQ];
  const totalQuestions = quiz.questions.length;
  const progressPct = ((currentQ + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQ === totalQuestions - 1;
  const hasAnswer = question ? !!answers[question.id] : false;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-semibold">
            Questão {currentQ + 1}/{totalQuestions}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <View className="h-full bg-white rounded-full" style={{ width: `${progressPct}%` }} />
        </View>
      </View>

      {/* Question */}
      {question && (
        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-4">
            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
              {question.question_text}
            </Text>
            <Text className="text-gray-400 text-xs">
              {question.points} ponto{question.points !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Options */}
          {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
            <View className="gap-3">
              {(question.options || []).map((option, i) => {
                const isSelected = answers[question.id] === String(i);
                return (
                  <TouchableOpacity
                    key={i}
                    className={`p-4 rounded-xl border-2 flex-row items-center gap-3 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                    onPress={() => handleAnswer(question.id, String(i))}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      isSelected ? 'bg-primary-500' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text className={`flex-1 ${isSelected ? 'text-primary-700 dark:text-primary-300 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#1a56db" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row gap-3">
          {currentQ > 0 && (
            <View className="flex-1">
              <Button
                title="Anterior"
                onPress={() => setCurrentQ(currentQ - 1)}
                variant="outline"
              />
            </View>
          )}
          <View className="flex-1">
            {isLastQuestion ? (
              <Button
                title={submitting ? 'Enviando...' : 'Enviar Prova'}
                onPress={handleSubmit}
                loading={submitting}
                fullWidth
                disabled={!hasAnswer}
              />
            ) : (
              <Button
                title="Próxima"
                onPress={() => setCurrentQ(currentQ + 1)}
                fullWidth
                disabled={!hasAnswer}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

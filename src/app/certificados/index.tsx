import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

interface Certificate {
  id: number;
  certificate_code: string;
  final_grade: number;
  workload_hours: number;
  issued_at: string;
  course_title: string;
  course_slug: string;
  teacher_name: string;
}

export default function CertificadosScreen() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchCertificates = async () => {
        try {
          const { data } = await api.get('/certificates/my');
          if (!cancelled) setCertificates(data.data || data || []);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchCertificates();
      return () => { cancelled = true; };
    }, [])
  );

  const handleDownload = async (cert: Certificate) => {
    try {
      const response = await api.get(`/certificates/${cert.id}/download`, {
        responseType: 'blob',
      });
      const fileUri = `${documentDirectory}certificado-${cert.certificate_code}.pdf`;
      await writeAsStringAsync(fileUri, response.data, {
        encoding: EncodingType.Base64,
      });
      await shareAsync(fileUri);
    } catch {}
  };

  const renderCertificate = ({ item }: { item: Certificate }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 mx-6 shadow-sm">
      <View className="flex-row items-start gap-4">
        <View className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/20 items-center justify-center">
          <Ionicons name="ribbon-outline" size={28} color="#1a56db" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={2}>
            {item.course_title}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {item.teacher_name}
          </Text>
          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs">{item.workload_hours}h</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="star-outline" size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs">Nota: {item.final_grade}</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xs mt-2">
            Código: {item.certificate_code}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2 mt-4">
        <TouchableOpacity
          className="flex-1 bg-primary-50 dark:bg-primary-900/20 py-2.5 rounded-xl items-center"
          onPress={() => handleDownload(item)}
        >
          <Text className="text-primary-600 font-semibold text-sm">Baixar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-gray-100 dark:bg-gray-700 py-2.5 rounded-xl items-center"
          onPress={() => router.push(`/verificar-certificado/${item.certificate_code}`)}
        >
          <Text className="text-gray-600 dark:text-gray-300 font-semibold text-sm">Verificar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Certificados</Text>
        </View>
        <Text className="text-white/70 text-sm">
          {certificates.length} certificado{certificates.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={certificates}
        renderItem={renderCertificate}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Ionicons name="ribbon-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-lg">
              {loading ? 'Carregando...' : 'Nenhum certificado ainda'}
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Conclua cursos para ganhar certificados
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

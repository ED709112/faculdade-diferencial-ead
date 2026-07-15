import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

const menuItems = [
  { icon: 'school-outline', label: 'Meus Cursos', route: '/aluno/cursos' },
  { icon: 'ribbon-outline', label: 'Certificados', route: '/certificados' },
  { icon: 'trophy-outline', label: 'Conquistas', route: '/aluno/conquistas' },
  { icon: 'calendar-outline', label: 'Calendário', route: '/aluno/calendario' },
  { icon: 'chatbubble-outline', label: 'Mensagens', route: '/mensagens' },
  { icon: 'heart-outline', label: 'Favoritos', route: '/aluno/favoritos' },
  { icon: 'download-outline', label: 'Downloads', route: '/aluno/downloads' },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-6 pb-10 rounded-b-3xl">
          <Text className="text-white text-xl font-bold mb-6">Perfil</Text>

          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {user?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{user?.name}</Text>
              <Text className="text-white/70 text-sm">{user?.email}</Text>
              <View className="bg-white/20 rounded-full px-3 py-1 mt-2 self-start">
                <Text className="text-white text-xs font-medium capitalize">
                  {user?.role === 'student' ? 'Aluno' : user?.role === 'teacher' ? 'Professor' : 'Administrador'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View className="px-6 -mt-4">
          <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center gap-4 px-5 py-4 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
                onPress={() => router.push(item.route as any)}
              >
                <Ionicons name={item.icon as any} size={22} color="#1a56db" />
                <Text className="flex-1 text-gray-900 dark:text-white font-medium">
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings & Logout */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-4 overflow-hidden">
            <TouchableOpacity className="flex-row items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <Ionicons name="settings-outline" size={22} color="#6b7280" />
              <Text className="flex-1 text-gray-900 dark:text-white font-medium">
                Configurações
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-4 px-5 py-4"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text className="text-red-500 font-medium">Sair da Conta</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-400 text-xs text-center mt-6 mb-8">
            Faculdade Diferencial EAD v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

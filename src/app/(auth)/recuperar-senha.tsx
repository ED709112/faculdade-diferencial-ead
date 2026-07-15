import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Digite seu e-mail');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 items-center justify-center">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="mail-open-outline" size={36} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            E-mail Enviado!
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </Text>
          <Button
            title="Voltar ao Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          {/* Header */}
          <View className="bg-primary-600 px-6 pt-8 pb-10 rounded-b-3xl">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold mb-1">
              Recuperar Senha
            </Text>
            <Text className="text-white/80 text-base">
              Informe seu e-mail para redefinir a senha
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 py-8 flex-1">
            <View className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-6">
              <Ionicons name="key-outline" size={28} color="#1a56db" />
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Button
              title="Enviar Instruções"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 items-center"
            >
              <Text className="text-primary-600 font-medium">
                Voltar ao Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

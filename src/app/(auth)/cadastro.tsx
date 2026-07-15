import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export default function CadastroScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Preencha nome, e-mail e senha');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (!lgpdConsent) {
      setError('Você precisa aceitar os termos de uso');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        lgpd_consent: true,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

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
              Criar Conta
            </Text>
            <Text className="text-white/80 text-base">
              Cadastre-se para acessar a plataforma
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 py-6 flex-1">
            {error ? (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <Input
              label="Nome Completo *"
              placeholder="Seu nome completo"
              value={form.name}
              onChangeText={(v) => handleChange('name', v)}
              autoCapitalize="words"
              leftIcon="person-outline"
            />

            <Input
              label="E-mail *"
              placeholder="seu@email.com"
              value={form.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
            />

            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChangeText={(v) => handleChange('phone', formatPhone(v))}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Input
              label="Senha *"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirmar Senha *"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
            />

            {/* LGPD Consent */}
            <TouchableOpacity
              onPress={() => setLgpdConsent(!lgpdConsent)}
              className="flex-row items-start gap-3 mb-6"
            >
              <View
                className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${
                  lgpdConsent
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {lgpdConsent && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text className="text-gray-600 dark:text-gray-400 text-xs flex-1">
                Li e aceito os Termos de Uso e a Política de Privacidade
                (LGPD). Concordo que meus dados possam ser utilizados para
                fins educacionais e de comunicação.
              </Text>
            </TouchableOpacity>

            <Button
              title="Criar Conta"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
            />

            <View className="flex-row items-center justify-center mt-6 mb-8">
              <Text className="text-gray-500">
                Já tem conta?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary-600 font-semibold">
                  Fazer Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

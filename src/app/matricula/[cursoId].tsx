import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const steps = ['Dados Pessoais', 'Pagamento', 'Confirmação'];
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function MatriculaScreen() {
  const { cursoId } = useLocalSearchParams<{ cursoId: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '', birth_date: '', gender: '',
    payment_method: 'boleto', address: '', city: '', state: '', zip_code: '',
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/${cursoId}`);
        setCourse(data.data || data);
      } catch {} finally { setLoading(false); }
    };
    if (cursoId) fetchCourse();
  }, [cursoId]);

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (step === 0) {
      if (!form.name || !form.email) return;
    }
    if (step < 2) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/enrollments/enroll-public', {
        ...form,
        course_id: Number(cursoId),
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
        zip_code: form.zip_code.replace(/\D/g, ''),
      });
      router.replace('/(tabs)');
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><Text>Carregando...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Matrícula</Text>
        </View>

        {/* Steps */}
        <View className="flex-row items-center justify-center">
          {steps.map((s, i) => (
            <View key={s} className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                i < step ? 'bg-secondary-500' : i === step ? 'bg-white' : 'bg-white/20'
              }`}>
                {i < step ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text className={`text-sm font-bold ${i === step ? 'text-primary-600' : 'text-white/70'}`}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text className={`text-xs ml-1 ${i <= step ? 'text-white' : 'text-white/50'}`}>
                {s}
              </Text>
              {i < steps.length - 1 && (
                <View className={`w-8 h-0.5 mx-2 ${i < step ? 'bg-secondary-400' : 'bg-white/20'}`} />
              )}
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Step 0: Dados Pessoais */}
        {step === 0 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Dados Pessoais
            </Text>
            <Text className="text-gray-500 text-sm mb-6">Preencha seus dados</Text>

            <Input label="Nome Completo *" placeholder="Seu nome" value={form.name} onChangeText={v => handleChange('name', v)} leftIcon="person-outline" />
            <Input label="E-mail *" placeholder="seu@email.com" value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
            <Input label="Telefone" placeholder="(00) 00000-0000" value={form.phone} onChangeText={v => handleChange('phone', v)} keyboardType="phone-pad" leftIcon="call-outline" />
            <Input label="CPF" placeholder="000.000.000-00" value={form.cpf} onChangeText={v => handleChange('cpf', v)} keyboardType="numeric" />
            <Input label="Cidade" placeholder="Sua cidade" value={form.city} onChangeText={v => handleChange('city', v)} leftIcon="location-outline" />

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estado</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {states.map(s => (
                <TouchableOpacity
                  key={s}
                  className={`px-3 py-2 rounded-lg mr-2 ${form.state === s ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-800'}`}
                  onPress={() => handleChange('state', s)}
                >
                  <Text className={`text-sm ${form.state === s ? 'text-white font-semibold' : 'text-gray-600'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 1: Pagamento */}
        {step === 1 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Pagamento
            </Text>
            <Text className="text-gray-500 text-sm mb-6">Escolha a forma de pagamento</Text>

            {course && (
              <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <Text className="font-semibold text-gray-900 dark:text-white">{course.title}</Text>
                <Text className="text-2xl font-bold text-primary-600 mt-2">
                  R$ {Number(course.price).toFixed(2)}
                </Text>
              </View>
            )}

            {[
              { key: 'boleto', icon: 'receipt-outline', title: 'Boleto Bancário', desc: 'Vencimento em 3 dias úteis' },
              { key: 'pix', icon: 'qr-code-outline', title: 'PIX', desc: 'Aprovação instantânea' },
              { key: 'credit_card', icon: 'card-outline', title: 'Cartão de Crédito', desc: 'Até 12x sem juros' },
            ].map(m => (
              <TouchableOpacity
                key={m.key}
                className={`flex-row items-center gap-4 p-4 rounded-xl border-2 mb-3 ${
                  form.payment_method === m.key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => handleChange('payment_method', m.key)}
              >
                <Ionicons name={m.icon as any} size={24} color={form.payment_method === m.key ? '#1a56db' : '#9ca3af'} />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">{m.title}</Text>
                  <Text className="text-xs text-gray-500">{m.desc}</Text>
                </View>
                {form.payment_method === m.key && (
                  <Ionicons name="checkmark-circle" size={22} color="#1a56db" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Confirmação */}
        {step === 2 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Confirme sua Matrícula
            </Text>
            <Text className="text-gray-500 text-sm mb-6">Revise os dados antes de finalizar</Text>

            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">Dados Pessoais</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">Nome: {form.name}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">E-mail: {form.email}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">Telefone: {form.phone || 'Não informado'}</Text>
            </View>

            {course && (
              <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <Text className="font-semibold text-gray-900 dark:text-white mb-2">Curso</Text>
                <Text className="font-medium">{course.title}</Text>
                <Text className="text-lg font-bold text-primary-600 mt-1">
                  R$ {Number(course.price).toFixed(2)}
                </Text>
              </View>
            )}

            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">Pagamento</Text>
              <Text className="text-sm capitalize">
                {form.payment_method === 'boleto' && 'Boleto Bancário'}
                {form.payment_method === 'pix' && 'PIX'}
                {form.payment_method === 'credit_card' && 'Cartão de Crédito'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-row justify-between">
        {step > 0 ? (
          <Button title="Voltar" onPress={() => setStep(step - 1)} variant="outline" />
        ) : (
          <Button title="Cancelar" onPress={() => router.back()} variant="ghost" />
        )}

        {step < 2 ? (
          <Button title="Próximo" onPress={handleNext} />
        ) : (
          <Button title="Finalizar" onPress={handleSubmit} loading={submitting} />
        )}
      </View>
    </SafeAreaView>
  );
}

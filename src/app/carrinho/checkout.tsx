import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/products/order-public', {
        ...form,
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
        zip_code: form.zip_code.replace(/\D/g, ''),
      });
      setOrderNumber(data.order_number || data.order?.order_number || 'PED-' + Date.now());
      clearCart();
      setSuccess(true);
    } catch {} finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Pedido Realizado!
          </Text>
          <Text className="text-gray-500 text-center mb-4">
            Número do pedido: {orderNumber}
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-8">
            Você receberá um e-mail com as instruções de pagamento.
          </Text>
          <Button
            title="Voltar às Compras"
            onPress={() => router.replace('/(tabs)/loja')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    router.replace('/(tabs)/loja');
    return null;
  }

  const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-secondary-500 px-6 pt-4 pb-6">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Checkout</Text>
        </View>

        {/* Steps */}
        <View className="flex-row items-center justify-center mt-4 gap-2">
          {['Dados', 'Pagamento', 'Confirmação'].map((s, i) => (
            <View key={s} className="flex-row items-center">
              <View className={`w-7 h-7 rounded-full items-center justify-center ${
                i < step ? 'bg-white/30' : i === step ? 'bg-white' : 'bg-white/20'
              }`}>
                <Text className={`text-xs font-bold ${i === step ? 'text-secondary-500' : 'text-white'}`}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text className={`text-xs ml-1 ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</Text>
              {i < 2 && <View className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-white/50' : 'bg-white/20'}`} />}
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
        {/* Step 0: Dados */}
        {step === 0 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Seus Dados</Text>
            <Input label="Nome *" value={form.name} onChangeText={v => handleChange('name', v)} leftIcon="person-outline" />
            <Input label="E-mail *" value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
            <Input label="Telefone" value={form.phone} onChangeText={v => handleChange('phone', v)} keyboardType="phone-pad" leftIcon="call-outline" />
            <Input label="CPF" value={form.cpf} onChangeText={v => handleChange('cpf', v)} keyboardType="numeric" />
            <Input label="Endereço" value={form.address} onChangeText={v => handleChange('address', v)} leftIcon="location-outline" />
            <Input label="Cidade" value={form.city} onChangeText={v => handleChange('city', v)} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">UF</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {states.map(s => (
                    <TouchableOpacity
                      key={s}
                      className={`px-3 py-2 rounded-lg mr-2 ${form.state === s ? 'bg-secondary-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                      onPress={() => handleChange('state', s)}
                    >
                      <Text className={`text-sm ${form.state === s ? 'text-white font-semibold' : 'text-gray-600'}`}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Input label="CEP" value={form.zip_code} onChangeText={v => handleChange('zip_code', v)} keyboardType="numeric" />
          </View>
        )}

        {/* Step 1: Pagamento */}
        {step === 1 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pagamento</Text>

            {/* Order Summary */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <Text className="font-semibold text-gray-900 dark:text-white mb-3">Resumo do Pedido</Text>
              {items.map(item => (
                <View key={item.id} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <Text className="text-gray-600 dark:text-gray-400 flex-1" numberOfLines={1}>
                    {item.name} x{item.quantity}
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-medium ml-2">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between pt-3">
                <Text className="font-bold text-gray-900 dark:text-white">Total</Text>
                <Text className="font-bold text-secondary-500 text-lg">R$ {total().toFixed(2)}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            {[
              { key: 'pix', icon: 'qr-code-outline', title: 'PIX', desc: 'Aprovação instantânea', discount: '-5%' },
              { key: 'boleto', icon: 'receipt-outline', title: 'Boleto Bancário', desc: 'Vencimento em 3 dias úteis' },
              { key: 'credit_card', icon: 'card-outline', title: 'Cartão de Crédito', desc: 'Até 12x sem juros' },
            ].map(m => (
              <TouchableOpacity
                key={m.key}
                className={`flex-row items-center gap-4 p-4 rounded-xl border-2 mb-3 ${
                  paymentMethod === m.key
                    ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
                onPress={() => setPaymentMethod(m.key)}
              >
                <Ionicons name={m.icon as any} size={24} color={paymentMethod === m.key ? '#f97316' : '#9ca3af'} />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-gray-900 dark:text-white">{m.title}</Text>
                    {'discount' in m && m.discount && (
                      <View className="bg-green-100 px-2 py-0.5 rounded-full">
                        <Text className="text-green-700 text-xs font-semibold">{m.discount}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500">{m.desc}</Text>
                </View>
                {paymentMethod === m.key && (
                  <Ionicons name="checkmark-circle" size={22} color="#f97316" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Confirmação */}
        {step === 2 && (
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirme seu Pedido</Text>

            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">Dados</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">{form.name}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">{form.email}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">{form.phone || 'Sem telefone'}</Text>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">Pagamento</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {paymentMethod === 'boleto' && 'Boleto Bancário'}
                {paymentMethod === 'pix' && 'PIX'}
                {paymentMethod === 'credit_card' && 'Cartão de Crédito'}
              </Text>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">Itens ({items.length})</Text>
              {items.map(item => (
                <View key={item.id} className="flex-row justify-between py-1">
                  <Text className="text-gray-600 text-sm" numberOfLines={1}>{item.name} x{item.quantity}</Text>
                  <Text className="text-gray-900 font-medium text-sm">R$ {(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View className="flex-row justify-between pt-2 mt-2 border-t border-gray-100">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold text-secondary-500 text-lg">R$ {total().toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-500">Total</Text>
          <Text className="text-xl font-bold text-secondary-500">R$ {total().toFixed(2)}</Text>
        </View>
        <View className="flex-row gap-3">
          {step > 0 && (
            <View className="flex-1">
              <Button title="Voltar" onPress={() => setStep(step - 1)} variant="outline" />
            </View>
          )}
          <View className={step === 0 ? 'flex-1' : 'flex-1'}>
            {step < 2 ? (
              <Button
                title="Próximo"
                onPress={() => setStep(step + 1)}
                variant="secondary"
                fullWidth
              />
            ) : (
              <Button
                title="Confirmar Pedido"
                onPress={handleOrder}
                loading={loading}
                variant="secondary"
                fullWidth
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

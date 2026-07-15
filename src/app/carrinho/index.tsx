import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

export default function CarrinhoScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-4 pb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Carrinho</Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cart-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-400 text-lg mt-4 mb-2">Carrinho vazio</Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            Adicione produtos da loja para continuar
          </Text>
          <Button
            title="Ver Produtos"
            onPress={() => router.push('/(tabs)/loja')}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">
              Carrinho ({items.length})
            </Text>
          </View>
          <TouchableOpacity onPress={clearCart}>
            <Text className="text-white/80 text-sm">Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View className="px-6 pt-4">
          {items.map((item) => (
            <View
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row gap-3">
                {/* Image placeholder */}
                <View className="w-20 h-20 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 items-center justify-center">
                  <Ionicons name="bag-handle-outline" size={24} color="#f97316" />
                </View>

                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="text-secondary-500 font-bold text-lg mt-1">
                    R$ {item.price.toFixed(2)}
                  </Text>

                  {/* Quantity controls */}
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center"
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#6b7280" />
                      </TouchableOpacity>
                      <Text className="text-gray-900 dark:text-white font-semibold w-6 text-center">
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center"
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="p-2"
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-500">Total</Text>
          <Text className="text-2xl font-bold text-secondary-500">
            R$ {total().toFixed(2)}
          </Text>
        </View>

        {!isAuthenticated ? (
          <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-3">
            <Text className="text-yellow-700 dark:text-yellow-400 text-sm text-center">
              Você precisará fazer login para finalizar a compra
            </Text>
          </View>
        ) : null}

        <Button
          title="Finalizar Compra"
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login');
            } else {
              router.push('/carrinho/checkout');
            }
          }}
          fullWidth
          size="lg"
        />

        <TouchableOpacity
          className="items-center mt-3"
          onPress={() => router.push('/(tabs)/loja')}
        >
          <Text className="text-primary-600 font-medium">Continuar comprando</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

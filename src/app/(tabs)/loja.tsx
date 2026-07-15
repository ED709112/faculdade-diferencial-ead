import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '@/stores/cartStore';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  image: string;
  stock: number;
  category_name: string;
}

export default function LojaScreen() {
  const router = useRouter();
  const { addItem, isInCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchProducts = async () => {
        try {
          const { data } = await api.get('/products', {
            params: { search: search || undefined },
          });
          if (!cancelled) setProducts(data.data || data || []);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchProducts();
      return () => { cancelled = true; };
    }, [search])
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      variant="elevated"
      padding="none"
      className="mb-4 mx-6 overflow-hidden"
      onPress={() => router.push(`/produto/${item.slug}`)}
    >
      <View className="h-32 bg-secondary-50 dark:bg-secondary-900/20 items-center justify-center">
        <Ionicons name="bag-handle-outline" size={32} color="#f97316" />
      </View>
      <View className="p-4">
        {item.category_name && (
          <Text className="text-xs text-secondary-500 font-medium mb-1">
            {item.category_name}
          </Text>
        )}
        <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-2">
            {item.original_price && Number(item.original_price) > Number(item.price) && (
              <Text className="text-gray-400 text-sm line-through">
                R$ {Number(item.original_price).toFixed(2)}
              </Text>
            )}
            <Text className="text-secondary-500 font-bold text-lg">
              R$ {Number(item.price).toFixed(2)}
            </Text>
          </View>
          {!isInCart(item.id) ? (
            <TouchableOpacity
              className="bg-secondary-500 px-4 py-2 rounded-lg"
              onPress={() =>
                addItem({
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  image: item.image,
                  price: Number(item.price),
                  original_price: item.original_price ? Number(item.original_price) : undefined,
                  stock: item.stock,
                })
              }
            >
              <Text className="text-white font-semibold text-sm">Adicionar</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-green-100 px-4 py-2 rounded-lg">
              <Text className="text-green-700 font-semibold text-sm">No carrinho</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-secondary-500 px-6 pt-4 pb-6">
        <Text className="text-white text-xl font-bold mb-4">Loja</Text>
        <View className="flex-row items-center bg-white/20 rounded-xl px-3">
          <Ionicons name="search-outline" size={20} color="white" />
          <TextInput
            className="flex-1 text-white py-3 px-2"
            placeholder="Buscar produto..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchProducts}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Cart Badge */}
      <TouchableOpacity
        className="absolute top-20 right-6 bg-white rounded-full p-3 shadow-lg z-10"
        onPress={() => router.push('/carrinho')}
      >
        <Ionicons name="cart-outline" size={24} color="#1a56db" />
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Ionicons name="bag-handle-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4">
              {loading ? 'Carregando...' : 'Nenhum produto encontrado'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

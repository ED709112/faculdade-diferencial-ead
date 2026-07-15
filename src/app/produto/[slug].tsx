import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { CardView } from '@/components/ui/Card';
import { useCartStore } from '@/stores/cartStore';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number;
  image: string;
  stock: number;
  category_name: string;
  author: string;
  pages: number;
  format: string;
  weight: string;
  isbn: string;
}

export default function ProdutoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addItem, isInCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const fetchProduct = async () => {
        try {
          const { data } = await api.get(`/products/${slug}`);
          if (!cancelled) setProduct(data.data || data);
        } catch {} finally {
          if (!cancelled) setLoading(false);
        }
      };
      if (slug) fetchProduct();
      return () => { cancelled = true; };
    }, [slug])
  );

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : undefined,
      stock: product.stock,
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-400 mt-4">Produto não encontrado</Text>
      </SafeAreaView>
    );
  }

  const inCart = isInCart(product.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View className="h-64 bg-secondary-50 dark:bg-secondary-900/20 items-center justify-center">
          <Ionicons name="bag-handle-outline" size={64} color="#f97316" />
        </View>

        {/* Back button */}
        <TouchableOpacity
          className="absolute top-12 left-4 bg-black/40 rounded-full p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Content */}
        <View className="px-6 py-6">
          {product.category_name && (
            <Text className="text-xs text-secondary-500 font-semibold uppercase mb-2">
              {product.category_name}
            </Text>
          )}
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {product.name}
          </Text>

          {/* Price */}
          <View className="flex-row items-center gap-3 mb-6">
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <Text className="text-gray-400 text-lg line-through">
                R$ {Number(product.original_price).toFixed(2)}
              </Text>
            )}
            <Text className="text-3xl font-bold text-secondary-500">
              R$ {Number(product.price).toFixed(2)}
            </Text>
          </View>

          {/* Stock */}
          <View className="flex-row items-center gap-2 mb-6">
            <Ionicons
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={20}
              color={product.stock > 0 ? "#22c55e" : "#ef4444"}
            />
            <Text className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <>
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Descrição
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-6">
                {product.description}
              </Text>
            </>
          )}

          {/* Product Details */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Detalhes do Produto
          </Text>
          <CardView variant="outlined" padding="md" className="mb-6">
            {product.author && (
              <View className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-500">Autor</Text>
                <Text className="text-gray-900 dark:text-white font-medium">{product.author}</Text>
              </View>
            )}
            {product.pages && (
              <View className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-500">Páginas</Text>
                <Text className="text-gray-900 dark:text-white font-medium">{product.pages}</Text>
              </View>
            )}
            {product.format && (
              <View className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-500">Formato</Text>
                <Text className="text-gray-900 dark:text-white font-medium">{product.format}</Text>
              </View>
            )}
            {product.isbn && (
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-500">ISBN</Text>
                <Text className="text-gray-900 dark:text-white font-medium">{product.isbn}</Text>
              </View>
            )}
          </CardView>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <Text className="text-gray-400 text-sm line-through">
                R$ {Number(product.original_price).toFixed(2)}
              </Text>
            )}
            <Text className="text-2xl font-bold text-secondary-500">
              R$ {Number(product.price).toFixed(2)}
            </Text>
          </View>
        </View>
        {inCart ? (
          <Button
            title="Ir para o Carrinho"
            onPress={() => router.push('/carrinho')}
            variant="secondary"
            fullWidth
            size="lg"
            icon={<Ionicons name="cart-outline" size={20} color="white" />}
          />
        ) : (
          <Button
            title="Adicionar ao Carrinho"
            onPress={handleAddToCart}
            variant="secondary"
            fullWidth
            size="lg"
            icon={<Ionicons name="cart-outline" size={20} color="white" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

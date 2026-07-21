'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiEyeOff, FiImage } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  stock: number;
  image?: string;
  category?: string;
  product_type: string;
  is_active: number;
  sales_count: number;
  created_at: string;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', short_description: '', price: '', original_price: '',
    stock: '', category: '', product_type: 'outro', weight: '', dimensions: '', is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = () => {
    setLoading(true);
    api.get(`/products/admin/all?search=${search}&is_active=${filterActive}`)
      .then(res => setProducts(res.data.data))
      .catch(() => toast.error('Erro ao carregar produtos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, [search, filterActive]);

  const openNew = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', short_description: '', price: '', original_price: '', stock: '', category: '', product_type: 'outro', weight: '', dimensions: '', is_active: true });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, description: '', short_description: '', price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : '', stock: String(p.stock),
      category: p.category || '', product_type: p.product_type, weight: '', dimensions: '', is_active: !!p.is_active
    });
    setImageFile(null);
    setImagePreview(p.image || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Nome e preço são obrigatórios.');
      return;
    }
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock) || 0,
      };

      let productId: number;
      if (editingProduct) {
        const { data } = await api.put(`/products/${editingProduct.id}`, payload);
        productId = editingProduct.id;
        toast.success('Produto atualizado!');
      } else {
        const { data } = await api.post('/products', payload);
        productId = data.id;
        toast.success('Produto criado!');
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post(`/products/${productId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar produto.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto excluído!');
      loadProducts();
    } catch {
      toast.error('Erro ao excluir produto.');
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await api.put(`/products/${p.id}`, { is_active: p.is_active ? 0 : 1 });
      loadProducts();
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  return (
    <DashboardLayout role="admin" title="Gerenciar Produtos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 px-4 py-2.5">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none text-sm"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            >
              <option value="">Todos</option>
              <option value="1">Ativos</option>
              <option value="0">Inativos</option>
            </select>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
          >
            <FiPlus /> Novo Produto
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Preço</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estoque</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vendas</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum produto encontrado</td></tr>
                ) : products.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-secondary-100 flex items-center justify-center text-secondary-400 text-xs">IMG</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category || product.product_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
                      {product.original_price && (
                        <span className="block text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${product.stock <= 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-500' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.sales_count}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {product.is_active ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nome do produto" />
              </div>
              <div>
                <label className="label">Imagem do Produto</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-secondary-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <FiImage className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP (máx. 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preço (R$) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Preço Original (R$)</label>
                  <input type="number" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} className="input" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Estoque</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="input">
                    <option value="livro">Livro</option>
                    <option value="apostila">Apostila</option>
                    <option value="material">Material</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Categoria</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input" placeholder="Ex: Direito, Enfermagem..." />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} placeholder="Descrição do produto..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Peso</label>
                  <input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input" placeholder="Ex: 500g" />
                </div>
                <div>
                  <label className="label">Dimensões</label>
                  <input value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} className="input" placeholder="Ex: 20x25cm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Produto ativo (visível na loja)</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-secondary-500 text-white font-semibold hover:bg-secondary-600">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

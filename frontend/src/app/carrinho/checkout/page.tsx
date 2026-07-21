'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiFileText, FiSmartphone, FiCheck, FiLock, FiShield, FiPackage, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'register' | 'payment' | 'done'>('register');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card'>('pix');
  const [installments, setInstallments] = useState(1);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    address: '', city: '', state: '', zip_code: '',
  });

  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });

  if (items.length === 0 && step !== 'done') {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Seu carrinho está vazio</h2>
          <Link href="/produtos" className="text-[#ff7849] font-medium hover:underline">Voltar à loja</Link>
        </div>
      </div>
    );
  }

  const pixDiscount = total * 0.05;
  const finalTotal = paymentMethod === 'pix' ? total - pixDiscount : total;
  const installmentValue = finalTotal / installments;

  const handleCheckEmail = async () => {
    if (!form.email) {
      toast.error('Digite seu e-mail.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('E-mail inválido.');
      return;
    }

    setCheckingEmail(true);
    try {
      const { data } = await api.post('/products/check-email', { email: form.email });
      if (data.exists) {
        setEmailExists(true);
        setExistingUserName(data.name);
      } else {
        setEmailExists(false);
        setEmailChecked(true);
      }
    } catch {
      toast.error('Erro ao verificar e-mail. Tente novamente.');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleRegister = () => {
    if (!form.name) {
      toast.error('Nome é obrigatório.');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { data } = await api.post('/products/order-public', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        cpf: form.cpf,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        payment_method: paymentMethod,
        installments: paymentMethod === 'credit_card' ? installments : 1,
        items: orderItems,
      });

      setOrderResult(data);
      clearCart();
      setStep('done');
      toast.success('Pedido realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-3xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Parabéns pela sua compra!</h2>
            <p className="text-gray-500">Pedido <strong>{orderResult?.order_number}</strong> realizado com sucesso.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Enviamos um e-mail para <strong>{form.email}</strong> com:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Confirmação do pedido</li>
              <li>Detalhes do(s) produto(s)</li>
              {orderResult?.user?.is_new_user && (
                <li>Link para criar sua senha de acesso</li>
              )}
            </ul>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Próximos passos:</strong> Acesse seu e-mail, crie sua senha e faça login para acessar seus produtos.
            </p>
          </div>

          <Link
            href="/produtos"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#ff7849] text-white font-semibold rounded-lg hover:bg-[#e56a3d] transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Top bar */}
      <div className="bg-[#2d2d2d] py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/carrinho" className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
            <FiArrowLeft size={16} />
            <span>Voltar ao carrinho</span>
          </Link>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <FiLock size={14} />
            <span>Compra 100% segura</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-0">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'register' ? 'bg-[#ff7849] text-white' : 'bg-[#ff7849] text-white'}`}>
                <FiCheck size={16} />
              </div>
              <span className="text-sm font-medium text-[#ff7849]">Cadastro</span>
            </div>
            <div className={`w-16 h-0.5 mx-3 ${step === 'payment' ? 'bg-[#ff7849]' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-[#ff7849] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
              <span className={`text-sm font-medium ${step === 'payment' ? 'text-[#ff7849]' : 'text-gray-500'}`}>Pagamento</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left */}
          <div className="order-2 lg:order-1">
            {/* STEP 1: Cadastro */}
            {step === 'register' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Preencha seus dados</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {emailChecked ? 'Complete seu cadastro para continuar.' : 'Comece informando seu e-mail.'}
                </p>

                {/* Email check first */}
                {!emailChecked ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setEmailExists(false); }}
                        onKeyDown={e => e.key === 'Enter' && handleCheckEmail()}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none"
                      />
                    </div>

                    {emailExists && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <FiAlertCircle className="text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">E-mail já cadastrado</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Olá <strong>{existingUserName}</strong>! Este e-mail já possui uma conta.
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Link
                              href="/auth/login"
                              className="px-4 py-2 bg-[#ff7849] text-white text-sm font-semibold rounded-lg hover:bg-[#e56a3d] transition-colors"
                            >
                              Fazer Login
                            </Link>
                            <button
                              onClick={() => { setEmailExists(false); setForm({ ...form, email: '' }); }}
                              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Usar outro e-mail
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCheckEmail}
                      disabled={checkingEmail}
                      className="w-full py-3 bg-[#ff7849] text-white font-bold rounded-lg hover:bg-[#e56a3d] transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      {checkingEmail ? 'Verificando...' : 'Continuar'}
                    </button>
                  </div>
                ) : (
                  /* Full form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={form.email}
                          readOnly
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700"
                        />
                        <button
                          onClick={() => { setEmailChecked(false); setEmailExists(false); }}
                          className="text-xs text-[#ff7849] hover:underline whitespace-nowrap"
                        >Alterar</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo *</label>
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                        <input
                          type="text"
                          placeholder="(00) 00000-0000"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={form.cpf}
                          onChange={e => setForm({ ...form, cpf: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none"
                          maxLength={14}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
                      <input
                        type="text"
                        placeholder="Rua, número, bairro"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                        <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
                        <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" maxLength={2} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                        <input type="text" value={form.zip_code} onChange={e => setForm({ ...form, zip_code: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" maxLength={9} />
                      </div>
                    </div>

                    <button
                      onClick={handleRegister}
                      className="w-full py-3 bg-[#ff7849] text-white font-bold rounded-lg hover:bg-[#e56a3d] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      Continuar para Pagamento <FiArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Pagamento */}
            {step === 'payment' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <button onClick={() => setStep('register')} className="text-sm text-gray-500 hover:text-[#ff7849] mb-4 flex items-center gap-1">
                  <FiArrowLeft size={14} /> Editar dados
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Forma de Pagamento</h2>
                <p className="text-sm text-gray-500 mb-6">Escolha como deseja pagar.</p>

                {/* Payment tabs */}
                <div className="flex border-b border-gray-100 mb-6">
                  {[
                    { key: 'pix' as const, label: 'PIX', icon: FiSmartphone, badge: '-5%' },
                    { key: 'boleto' as const, label: 'Boleto', icon: FiFileText, badge: null },
                    { key: 'credit_card' as const, label: 'Cartão', icon: FiCreditCard, badge: null },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setPaymentMethod(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                        paymentMethod === tab.key
                          ? 'border-[#ff7849] text-[#ff7849]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                      {tab.badge && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded">{tab.badge}</span>
                      )}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'pix' && (
                  <div className="bg-green-50 rounded-lg p-4 mb-6 text-center">
                    <p className="text-sm text-green-700">
                      Ao confirmar, geraremos um <strong>QR Code</strong> para pagamento instantâneo com <strong>5% de desconto</strong>.
                    </p>
                  </div>
                )}

                {paymentMethod === 'boleto' && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-700">
                      O boleto será gerado com vencimento em <strong>3 dias úteis</strong>. Confirmação em até 2 dias úteis.
                    </p>
                  </div>
                )}

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número do cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" maxLength={19} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Validade</label>
                        <input type="text" placeholder="MM/AA" value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" maxLength={5} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                        <input type="text" placeholder="000" value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" maxLength={4} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome no cartão</label>
                      <input type="text" placeholder="Nome como está no cartão" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                      <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#ff7849] focus:ring-1 focus:ring-[#ff7849] outline-none bg-white">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}x de {formatPrice(finalTotal / n)} {n === 1 ? '(à vista)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#ff7849] text-white font-bold text-base rounded-lg hover:bg-[#e56a3d] transition-all disabled:opacity-50 shadow-lg shadow-[#ff7849]/25 active:scale-[0.98]"
                >
                  {loading ? 'Processando...' : paymentMethod === 'pix' ? 'Gerar QR Code PIX' : 'Finalizar Compra'}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400"><FiLock size={12} /> <span>SSL Seguro</span></div>
                  <div className="flex items-center gap-1 text-xs text-gray-400"><FiShield size={12} /> <span>Compra Protegida</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Right - Summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Seu Pedido</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary-100 flex items-center justify-center">
                          <FiPackage className="text-secondary-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(total)}</span>
                </div>
                {paymentMethod === 'pix' && step === 'payment' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Desconto PIX (5%)</span>
                    <span className="text-green-600">-{formatPrice(pixDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-[#ff7849]">{formatPrice(step === 'payment' ? finalTotal : total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

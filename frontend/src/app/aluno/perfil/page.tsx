'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FiUser,
  FiSave,
  FiCamera,
  FiLock,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiMapPin,
} from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  avatar?: string;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const states = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    avatar: '',
  });
  const [password, setPassword] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setProfile({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          cpf: data.cpf || '',
          birth_date: data.birth_date || '',
          gender: data.gender || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          avatar: data.avatar || '',
        });
        if (data.avatar) setAvatarPreview(data.avatar);
      } catch {
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPassword((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (key !== 'id' && value) formData.append(key, value);
      });
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data.user || data);
      if (data.user?.avatar || data.avatar) {
        const newAvatar = data.user?.avatar || data.avatar;
        setAvatarPreview(newAvatar);
        updateUser({ avatar: newAvatar });
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password.current_password || !password.new_password) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    if (password.new_password !== password.confirm_password) {
      toast.error('As senhas não conferem');
      return;
    }
    if (password.new_password.length < 6) {
      toast.error('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    try {
      setChangingPassword(true);
      await api.put('/users/profile/password', {
        current_password: password.current_password,
        new_password: password.new_password,
      });
      setPassword({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Senha alterada com sucesso!');
    } catch {
      toast.error('Erro ao alterar senha. Verifique a senha atual.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <Loading text="Carregando perfil..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-4xl text-primary-300" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiCamera className="text-white text-xl" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Alterar foto
            </button>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          Informações Pessoais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">
              <FiUser className="inline mr-1" /> Nome completo
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">
              <FiMail className="inline mr-1" /> E-mail
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label">
              <FiPhone className="inline mr-1" /> Telefone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">
              <FiCreditCard className="inline mr-1" /> CPF
            </label>
            <input
              type="text"
              value={profile.cpf}
              onChange={(e) => handleProfileChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Data de nascimento</label>
            <input
              type="date"
              value={profile.birth_date}
              onChange={(e) => handleProfileChange('birth_date', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Gênero</label>
            <select
              value={profile.gender}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              className="input-field"
            >
              <option value="">Selecione</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
              <option value="not_informed">Prefiro não informar</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">
          <FiMapPin className="inline mr-1" /> Endereço
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label">Endereço</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => handleProfileChange('address', e.target.value)}
              placeholder="Rua, número, complemento"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Cidade</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => handleProfileChange('city', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estado</label>
              <select
                value={profile.state}
                onChange={(e) => handleProfileChange('state', e.target.value)}
                className="input-field"
              >
                <option value="">UF</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">CEP</label>
              <input
                type="text"
                value={profile.zip_code}
                onChange={(e) => handleProfileChange('zip_code', e.target.value)}
                placeholder="00000-000"
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            <FiSave />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          <FiLock className="inline mr-2" />
          Alterar Senha
        </h3>

        <div className="max-w-md space-y-4">
          <div>
            <label className="label">Senha atual</label>
            <input
              type="password"
              value={password.current_password}
              onChange={(e) => handlePasswordChange('current_password', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Nova senha</label>
            <input
              type="password"
              value={password.new_password}
              onChange={(e) => handlePasswordChange('new_password', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input
              type="password"
              value={password.confirm_password}
              onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-primary flex items-center gap-2"
            >
              <FiLock />
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

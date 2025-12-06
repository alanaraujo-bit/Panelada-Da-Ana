'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Mail, Phone, Calendar, LogOut } from 'lucide-react';

export default function GarcomPerfil() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [nome, setNome] = useState('');
  const [foto, setFoto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    setNome(user.nome);
    // Carregar dados adicionais do perfil
    fetchPerfil();
  }, [token, user]);

  const fetchPerfil = async () => {
    try {
      const response = await fetch('/api/garcom/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFoto(data.foto || '');
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSalvar = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/garcom/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome, foto }),
      });

      if (response.ok) {
        alert('Perfil atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white p-6 pb-12">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-sm opacity-90">Gerencie suas informações</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-24">
        {/* Foto do Perfil */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {foto ? (
                    <img
                      src={foto}
                      alt="Foto do perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400">
                      {user?.nome.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="foto-input"
                  className="absolute bottom-0 right-0 bg-primary-orange text-white p-2 rounded-full cursor-pointer hover:bg-primary-brown transition-colors shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                </label>
                <input
                  id="foto-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Toque no ícone da câmera para alterar sua foto
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="h-12 pl-10 bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  value={user?.role === 'garcom' ? 'Garçom' : 'Administrador'}
                  disabled
                  className="h-12 pl-10 bg-gray-50"
                />
              </div>
            </div>

            <Button
              onClick={handleSalvar}
              disabled={loading}
              className="w-full h-12 text-base"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

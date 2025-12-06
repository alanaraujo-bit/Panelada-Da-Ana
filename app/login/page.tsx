'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { token, user, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Aguardar hidratação do Zustand
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isHydrated && token && user) {
      const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/garcom/mesas';
      router.replace(redirectUrl);
    }
  }, [isHydrated, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      if (!data.user || !data.token) {
        throw new Error('Dados de autenticação inválidos');
      }

      // Salvar no Zustand
      setAuth(data.user, data.token);
      
      // Aguardar persistência
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirecionar
      const redirectUrl = data.user.role === 'admin' ? '/admin/dashboard' : '/garcom/mesas';
      router.push(redirectUrl);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao realizar login');
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (!isHydrated || (token && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-cream to-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-bold">PA</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-cream to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-20 h-20 bg-primary-orange rounded-full flex items-center justify-center">
            <span className="text-3xl text-white font-bold">PA</span>
          </div>
          <CardTitle className="text-3xl font-bold text-primary-brown">
            Panelada da Ana
          </CardTitle>
          <CardDescription className="text-base">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="password"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12"
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

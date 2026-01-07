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
  const { token, user, remembered, setAuth, removeRemembered } = useAuthStore();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

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
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Erro ao realizar login';
      setError(message);
      setLoading(false);
    }
  };

  const handleRememberedLogin = async (rememberedToken: string, rememberedEmail: string) => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      // Valida token e obtém o user atual do backend
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${rememberedToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        removeRemembered(rememberedEmail);
        throw new Error(data.error || 'Sessão expirada. Faça login novamente.');
      }

      if (!data.user) {
        removeRemembered(rememberedEmail);
        throw new Error('Dados de autenticação inválidos');
      }

      setAuth(data.user, rememberedToken);
      await new Promise(resolve => setTimeout(resolve, 200));

      const redirectUrl = data.user.role === 'admin' ? '/admin/dashboard' : '/garcom/mesas';
      router.push(redirectUrl);
    } catch (err: unknown) {
      console.error('Remembered login error:', err);
      const message = err instanceof Error ? err.message : 'Erro ao entrar com conta salva';
      setError(message);
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
          <div className="space-y-4">
            {remembered.length > 0 && !showLoginForm ? (
              <>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-primary-brown">
                    Contas salvas
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {remembered.map((entry) => (
                      <Button
                        key={entry.user.email}
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="w-full justify-between"
                        disabled={loading}
                        onClick={() => handleRememberedLogin(entry.token, entry.user.email)}
                      >
                        <span className="flex flex-col items-start leading-tight">
                          <span className="text-base font-semibold text-primary-brown">
                            {entry.user.nome}
                          </span>
                          <span className="text-xs text-primary-brown/70">
                            {entry.user.email} • {entry.user.role === 'admin' ? 'Administrador' : 'Garçom'}
                          </span>
                        </span>
                        <span className="text-xs text-primary-brown/70">Entrar</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLoginForm(true)}
                >
                  Adicionar outro acesso
                </Button>
              </>
            ) : (
              <>
                {remembered.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setShowLoginForm(false);
                      setError('');
                      setEmail('');
                      setSenha('');
                    }}
                  >
                    ← Voltar para contas salvas
                  </Button>
                )}

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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

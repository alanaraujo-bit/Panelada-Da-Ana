'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, Clock, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  vendasHoje: number;
  pedidosHoje: number;
  ticketMedio: number;
  pedidosAbertos: number;
  mesasMaisVendidas: { nome: string; total: number }[];
  horariosAtivos: { hora: string; vendas: number }[];
  ranking: number;
  totalGarcons: number;
}

export default function GarcomDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/garcom/dashboard?data=${hoje}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white p-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Olá,</p>
              <h1 className="text-2xl font-bold">{user?.nome || 'Garçom'}</h1>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Star className="h-8 w-8" />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 w-fit">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">
              #{data.ranking}º lugar no ranking ({data.totalGarcons} garçons)
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
        {/* Vendas Hoje */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Vendas Hoje</p>
                <h2 className="text-3xl font-bold">
                  {formatCurrency(Number(data.vendasHoje))}
                </h2>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pedidos</p>
                  <p className="text-2xl font-bold">{data.pedidosHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(data.ticketMedio))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pedidos em Andamento</p>
                    <p className="text-2xl font-bold">{data.pedidosAbertos}</p>
                  </div>
                </div>
                {data.pedidosAbertos > 0 && (
                  <span className="animate-pulse bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Ativo
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mesas Mais Vendidas */}
        {data.mesasMaisVendidas.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                🏆 Suas Mesas Top Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.mesasMaisVendidas.map((mesa, idx) => (
                <div
                  key={mesa.nome}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span className="font-medium">{mesa.nome}</span>
                  </div>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(Number(mesa.total))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Motivação */}
        <Card className="shadow-md bg-gradient-to-br from-primary-orange to-primary-brown text-white">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium mb-2">
              {data.vendasHoje > 500
                ? '🔥 Excelente trabalho hoje!'
                : data.vendasHoje > 200
                ? '💪 Continue assim!'
                : '🚀 Vamos lá, você consegue!'}
            </p>
            <p className="text-sm opacity-90">
              {data.pedidosAbertos > 0
                ? `Você tem ${data.pedidosAbertos} pedido${data.pedidosAbertos > 1 ? 's' : ''} em andamento`
                : 'Todas as suas mesas estão em dia!'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Table,
  Activity,
  Award,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  pedidosAbertos: number;
  mesasOcupadas: number;
  mesasLivres: number;
  vendasHoje: number;
  pedidosHoje: number;
  ticketMedioHoje: number;
  vendasMes: number;
  pedidosMes: number;
  ticketMedioMes: number;
  pratosVendidosHoje: number;
  pratoMaisVendidoHoje: { nome: string; quantidade: number } | null;
  garcomMaisVendas: { nome: string; total: number } | null;
  totalGarcons: number;
  ultimosPedidos: Array<{
    id: number;
    mesa: string;
    garcom: string;
    total: number;
    status: string;
    criadoEm: string;
  }>;
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-orange mx-auto mb-4"></div>
          <p className="text-xl text-primary-brown font-semibold">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-brown mb-1">Dashboard</h1>
          <p className="text-gray-600">Visão geral do restaurante em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-white ${
              autoRefresh 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            <Activity className={`h-4 w-4 inline mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Ao Vivo' : 'Pausado'}
          </button>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary-orange hover:bg-primary-brown text-white rounded-lg font-medium transition-all"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="h-10 w-10 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Tempo Real</span>
            </div>
            <div className="text-4xl font-bold mb-1">{stats.pedidosAbertos}</div>
            <p className="text-sm opacity-90">Pedidos Abertos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Table className="h-10 w-10 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ocupação</span>
            </div>
            <div className="text-4xl font-bold mb-1">
              {stats.mesasOcupadas}/{stats.mesasOcupadas + stats.mesasLivres}
            </div>
            <p className="text-sm opacity-90">Mesas em Uso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-10 w-10 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Hoje</span>
            </div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(stats.vendasHoje)}</div>
            <p className="text-sm opacity-90">{stats.pedidosHoje} pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-10 w-10 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Média</span>
            </div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(stats.ticketMedioHoje)}</div>
            <p className="text-sm opacity-90">Ticket Médio Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance do Mês e Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-primary-brown mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Performance do Mês
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Vendido:</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(stats.vendasMes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pedidos:</span>
                <span className="text-xl font-bold text-gray-900">{stats.pedidosMes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ticket Médio:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(stats.ticketMedioMes)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-primary-brown mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Prato Hoje
            </h3>
            {stats.pratoMaisVendidoHoje ? (
              <div className="text-center py-2">
                <div className="text-4xl mb-2">🏆</div>
                <h4 className="font-bold text-lg text-gray-900 mb-1">{stats.pratoMaisVendidoHoje.nome}</h4>
                <p className="text-3xl font-bold text-primary-orange">{stats.pratoMaisVendidoHoje.quantidade}</p>
                <p className="text-sm text-gray-500">unidades vendidas</p>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma venda hoje</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-primary-brown mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Garçom Destaque
            </h3>
            {stats.garcomMaisVendas ? (
              <div className="text-center py-2">
                <div className="text-4xl mb-2">👨‍🍳</div>
                <h4 className="font-bold text-lg text-gray-900 mb-1">{stats.garcomMaisVendas.nome}</h4>
                <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(stats.garcomMaisVendas.total)}</p>
                <p className="text-sm text-gray-500">em vendas hoje</p>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma venda hoje</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Pedidos */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-primary-brown mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-orange" />
            Últimos Pedidos
          </h3>
          <div className="space-y-2">
            {stats.ultimosPedidos.length > 0 ? (
              stats.ultimosPedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      pedido.status === 'aberto' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="font-semibold text-gray-900">{pedido.mesa} • {pedido.garcom}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(pedido.criadoEm).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(pedido.total)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum pedido recente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

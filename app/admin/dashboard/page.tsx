'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Table,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Activity,
  Award,
  BarChart3,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  // Tempo Real
  pedidosAbertos: number;
  mesasOcupadas: number;
  mesasLivres: number;
  
  // Vendas Hoje
  vendasHoje: number;
  pedidosHoje: number;
  ticketMedioHoje: number;
  
  // Período (Mês)
  vendasMes: number;
  pedidosMes: number;
  ticketMedioMes: number;
  
  // Performance
  pratosVendidosHoje: number;
  pratoMaisVendidoHoje: { nome: string; quantidade: number } | null;
  
  // Garçons
  garcomMaisVendas: { nome: string; total: number } | null;
  totalGarcons: number;
  
  // Histórico
  ultimosPedidos: Array<{
    id: number;
    mesa: string;
    garcom: string;
    total: number;
    status: string;
    criadoEm: string;
  }>;
  
  // Gráfico (últimos 7 dias)
  vendasPorDia: Array<{
    data: string;
    total: number;
    pedidos: number;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [token, user]);

  // Auto refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-orange mx-auto mb-4"></div>
          <p className="text-xl text-primary-brown font-semibold">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard Admin</h1>
              <p className="text-sm opacity-90">
                Bem-vindo, {user?.nome} • Atualização em tempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6 pb-8">
        {/* Cards de Status em Tempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pedidos Abertos */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="h-10 w-10 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Tempo Real</span>
              </div>
              <div className="currency-value currency-large font-bold mb-1">
                {stats.pedidosAbertos}
              </div>
              <p className="text-sm opacity-90">Pedidos Abertos</p>
            </CardContent>
          </Card>

          {/* Mesas Ocupadas */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Table className="h-10 w-10 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ocupação</span>
              </div>
              <div className="currency-value currency-large font-bold mb-1">
                {stats.mesasOcupadas}/{stats.mesasOcupadas + stats.mesasLivres}
              </div>
              <p className="text-sm opacity-90">Mesas em Uso</p>
            </CardContent>
          </Card>

          {/* Vendas Hoje */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-10 w-10 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Hoje</span>
              </div>
              <div className="currency-value currency-large font-bold mb-1">
                {formatCurrency(stats.vendasHoje)}
              </div>
              <p className="text-sm opacity-90">{stats.pedidosHoje} pedidos</p>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-10 w-10 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Média</span>
              </div>
              <div className="currency-value currency-large font-bold mb-1">
                {formatCurrency(stats.ticketMedioHoje)}
              </div>
              <p className="text-sm opacity-90">Ticket Médio Hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance do Mês e Destaques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Vendas do Mês */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-orange" />
                Performance do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Vendido:</span>
                <span className="currency-value currency-medium font-bold text-green-600">
                  {formatCurrency(stats.vendasMes)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pedidos:</span>
                <span className="text-xl font-bold text-gray-900">{stats.pedidosMes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ticket Médio:</span>
                <span className="currency-value currency-small font-bold text-blue-600">
                  {formatCurrency(stats.ticketMedioMes)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Prato Mais Vendido */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Prato Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pratoMaisVendidoHoje ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {stats.pratoMaisVendidoHoje.nome}
                  </h3>
                  <p className="text-3xl font-bold text-primary-orange">
                    {stats.pratoMaisVendidoHoje.quantidade}
                  </p>
                  <p className="text-sm text-gray-500">unidades vendidas</p>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhuma venda hoje</p>
              )}
            </CardContent>
          </Card>

          {/* Garçom Destaque */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Garçom Destaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.garcomMaisVendas ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">👨‍🍳</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {stats.garcomMaisVendas.nome}
                  </h3>
                  <p className="currency-value currency-medium font-bold text-green-600 mb-1">
                    {formatCurrency(stats.garcomMaisVendas.total)}
                  </p>
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-orange" />
              Últimos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <p className="font-semibold text-gray-900">
                          {pedido.mesa} • {pedido.garcom}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(pedido.criadoEm).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="currency-value currency-small font-bold text-green-600">
                      {formatCurrency(pedido.total)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhum pedido recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

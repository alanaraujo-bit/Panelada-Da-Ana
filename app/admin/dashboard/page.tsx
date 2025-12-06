'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Users, UtensilsCrossed, Table, Receipt, TrendingUp, DollarSign, ShoppingCart, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se acabou de fazer login
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      sessionStorage.removeItem('justLoggedIn');
      console.log('Just logged in, skipping redirect check');
    }

    // Verificar token do Zustand ou localStorage
    const storedToken = token || localStorage.getItem('token');
    
    if (!storedToken) {
      console.log('No token found, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('Token found, fetching stats');
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Pegar token do Zustand ou localStorage
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.error('No token available');
        return;
      }

      const response = await fetch(
        `/api/relatorios?dataInicio=${hoje.toISOString()}&dataFim=${amanha.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-primary-orange border-t-transparent rounded-full mx-auto mb-6"
          />
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-primary-brown"
          >
            Carregando dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const statsCards = [
    {
      icon: DollarSign,
      label: 'Faturamento',
      value: formatCurrency(stats?.faturamentoTotal || 0),
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      delay: 0,
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      value: stats?.totalPedidos || 0,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      delay: 0.1,
    },
    {
      icon: TrendingUp,
      label: 'Ticket Médio',
      value: formatCurrency(
        stats?.totalPedidos > 0
          ? stats.faturamentoTotal / stats.totalPedidos
          : 0
      ),
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      delay: 0.2,
    },
    {
      icon: Award,
      label: 'Pratos Vendidos',
      value: stats?.pratosMaisVendidos?.reduce(
        (acc: number, p: any) => acc + p.quantidade,
        0
      ) || 0,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      delay: 0.3,
    },
  ];

  const menuItems = [
    { icon: Table, label: 'Mesas', href: '/admin/mesas', gradient: 'from-blue-500 to-blue-600', emoji: '🪑' },
    { icon: UtensilsCrossed, label: 'Pratos', href: '/admin/pratos', gradient: 'from-green-500 to-green-600', emoji: '🍽️' },
    { icon: Users, label: 'Usuários', href: '/admin/usuarios', gradient: 'from-purple-500 to-purple-600', emoji: '👥' },
    { icon: Receipt, label: 'Pedidos', href: '/admin/pedidos', gradient: 'from-pink-500 to-pink-600', emoji: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header Animado */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-orange-200/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4"
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="w-14 h-14 bg-gradient-to-br from-primary-orange via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <span className="text-3xl">🍲</span>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-orange to-orange-600 bg-clip-text text-transparent">
                  Panelada da Ana
                </h1>
                <p className="text-sm text-gray-600">Dashboard Administrativo</p>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-primary-orange to-orange-600 hover:from-orange-600 hover:to-primary-orange transition-all duration-300 shadow-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards com Animação */}
        <section>
          <motion.h2 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-primary-brown mb-6 flex items-center gap-3"
          >
            <span className="text-4xl">📊</span>
            Visão Geral de Hoje
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: stat.delay, type: "spring", stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative group`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <stat.icon className="h-7 w-7 text-white" />
                      </motion.div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Formas de Pagamento */}
        {stats?.faturamentoPorPagamento && Object.keys(stats.faturamentoPorPagamento).length > 0 && (
          <motion.section
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-primary-brown mb-6 flex items-center gap-3">
              <span className="text-4xl">💳</span>
              Formas de Pagamento
            </h2>
            <Card className="bg-white border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(stats.faturamentoPorPagamento).map(
                    ([forma, valor]: [string, any], index) => (
                      <motion.div
                        key={forma}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 text-center border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all"
                      >
                        <p className="text-sm font-bold text-gray-700 capitalize mb-3 uppercase tracking-wide">
                          {forma}
                        </p>
                        <p className="text-3xl font-black bg-gradient-to-r from-primary-orange to-orange-600 bg-clip-text text-transparent">
                          {formatCurrency(valor)}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Top Pratos */}
        {stats?.pratosMaisVendidos && stats.pratosMaisVendidos.length > 0 && (
          <motion.section
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-primary-brown mb-6 flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              Top 5 Pratos Mais Vendidos
            </h2>
            <Card className="bg-white border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {stats.pratosMaisVendidos.slice(0, 5).map((prato: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7 + idx * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="flex items-center gap-5 p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-transparent rounded-2xl border-2 border-orange-200/50 hover:border-orange-300 transition-all shadow-md hover:shadow-lg"
                    >
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-orange to-orange-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg"
                      >
                        #{idx + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-gray-900 truncate mb-1">
                          {prato.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {prato.quantidade} unidades vendidas
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-2xl font-black bg-gradient-to-r from-primary-orange to-orange-600 bg-clip-text text-transparent">
                          {formatCurrency(prato.total)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Menu de Gerenciamento */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-primary-brown mb-6 flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            Gerenciamento
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item, index) => (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer">
                    <CardContent className="p-8 text-center relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className={`relative z-10 w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:shadow-2xl transition-shadow`}
                      >
                        <span className="text-4xl">{item.emoji}</span>
                      </motion.div>
                      <p className="relative z-10 font-black text-lg text-gray-900">{item.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

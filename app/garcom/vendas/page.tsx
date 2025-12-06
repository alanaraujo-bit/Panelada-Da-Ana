'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react';

interface VendasData {
  hoje: { total: number; pedidos: number };
  semana: { total: number; pedidos: number };
  mes: { total: number; pedidos: number };
  historico: { data: string; total: number; pedidos: number }[];
}

export default function GarcomVendas() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<VendasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordemCrescente, setOrdemCrescente] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchVendas();
  }, [token]);

  const fetchVendas = async () => {
    try {
      const response = await fetch('/api/garcom/vendas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
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
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Minhas Vendas</h1>
          <p className="text-sm opacity-90">Acompanhe seu desempenho</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Cards de Resumo */}
        <div className="grid gap-4">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Hoje</p>
                  <h2 className="text-3xl font-bold">
                    R$ {Number(data.hoje.total).toFixed(2)}
                  </h2>
                  <p className="text-sm opacity-90 mt-1">
                    {data.hoje.pedidos} pedido{data.hoje.pedidos !== 1 ? 's' : ''}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-medium">Esta Semana</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {Number(data.semana.total).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.semana.pedidos} pedidos
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-gray-500 font-medium">Este Mês</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {Number(data.mes.total).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.mes.pedidos} pedidos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">📊 Últimos 7 Dias</CardTitle>
              <button
                onClick={() => setOrdemCrescente(!ordemCrescente)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowUpDown className="h-3 w-3" />
                {ordemCrescente ? 'Crescente' : 'Decrescente'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.historico.length > 0 ? (
              [...data.historico]
                .sort((a, b) => {
                  if (ordemCrescente) {
                    return new Date(a.data).getTime() - new Date(b.data).getTime();
                  }
                  return new Date(b.data).getTime() - new Date(a.data).getTime();
                })
                .map((item) => {
                const [ano, mes, dia] = item.data.split('-');
                const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                
                let dataLabel = '';
                if (dataObj.getTime() === hoje.getTime()) {
                  dataLabel = 'Hoje';
                } else if (dataObj.getTime() === ontem.getTime()) {
                  dataLabel = 'Ontem';
                } else {
                  dataLabel = dataObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  });
                }

                return (
                  <div
                    key={item.data}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{dataLabel}</p>
                      <p className="text-xs text-gray-500">
                        {item.pedidos} pedido{item.pedidos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      R$ {Number(item.total).toFixed(2)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">
                Nenhuma venda registrada ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

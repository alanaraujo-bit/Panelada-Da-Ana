'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Mesa {
  id: number;
  nome: string;
  status: string;
  pedidos: any[];
}

export default function MesasPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMesas();
  }, [token]);

  const fetchMesas = async () => {
    try {
      const response = await fetch('/api/mesas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMesas(data);
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirPedido = async (mesaId: number) => {
    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mesaId }),
      });

      const pedido = await response.json();
      router.push(`/garcom/pedido/${pedido.id}`);
    } catch (error) {
      console.error('Erro ao abrir pedido:', error);
      alert('Erro ao abrir pedido');
    }
  };

  const handleVerPedido = (pedidoId: number) => {
    router.push(`/garcom/pedido/${pedidoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mesas...</p>
        </div>
      </div>
    );
  }

  const mesasLivres = mesas.filter((m) => m.status === 'livre');
  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Mesas</h1>
          <p className="text-sm opacity-90">Selecione uma mesa para atender</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{mesasLivres.length}</p>
              <p className="text-xs text-gray-500">Mesas Livres</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{mesasOcupadas.length}</p>
              <p className="text-xs text-gray-500">Em Atendimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Mesas Ocupadas - Prioridade */}
        {mesasOcupadas.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Mesas em Atendimento
            </h2>
            <div className="space-y-3">
              {mesasOcupadas.map((mesa) => {
                const pedidoAberto = mesa.pedidos.find((p: any) => p.status === 'aberto');
                return (
                  <Card
                    key={mesa.id}
                    className="shadow-md border-2 border-orange-300 bg-orange-50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{mesa.nome}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              <Clock className="h-3 w-3" />
                              Em andamento
                            </span>
                          </div>
                        </div>
                        {pedidoAberto && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">
                              R$ {Number(pedidoAberto.total).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {pedidoAberto.itens?.length || 0} item(ns)
                            </p>
                          </div>
                        )}
                      </div>
                      {pedidoAberto && (
                        <Button
                          onClick={() => handleVerPedido(pedidoAberto.id)}
                          className="w-full h-12 bg-orange-600 hover:bg-orange-700"
                        >
                          Ver Pedido
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Mesas Livres */}
        {mesasLivres.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Mesas Disponíveis
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {mesasLivres.map((mesa) => (
                <Card
                  key={mesa.id}
                  className="shadow-md border-2 border-green-300 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleAbrirPedido(mesa.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      {mesa.nome.replace('Mesa ', '')}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{mesa.nome}</h3>
                    <div className="flex items-center justify-center gap-1 text-green-600 text-sm font-medium">
                      <Plus className="h-4 w-4" />
                      <span>Abrir Mesa</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {mesas.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma mesa cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

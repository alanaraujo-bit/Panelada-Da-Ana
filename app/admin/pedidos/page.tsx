'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Pedido {
  id: number;
  status: string;
  total: number;
  formaPagamento?: string;
  criadoEm: string;
  finalizadoEm?: string;
  mesa: { nome: string };
  garcom: { nome: string };
  itens: Array<{
    quantidade: number;
    prato: { nome: string };
  }>;
}

export default function PedidosAdminPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filter, setFilter] = useState<'todos' | 'aberto' | 'fechado'>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPedidos();
  }, [token, filter]);

  const fetchPedidos = async () => {
    try {
      const url = filter === 'todos' ? '/api/pedidos' : `/api/pedidos?status=${filter}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPedidos(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-cream">
        <p className="text-xl text-primary-brown">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-cream">
      <div className="bg-primary-orange text-white p-4 shadow-lg">
        <div className="flex items-center max-w-7xl mx-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" className="mr-3 text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Pedidos</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'todos' ? 'default' : 'outline'}
            onClick={() => setFilter('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'aberto' ? 'default' : 'outline'}
            onClick={() => setFilter('aberto')}
          >
            Em Andamento
          </Button>
          <Button
            variant={filter === 'fechado' ? 'default' : 'outline'}
            onClick={() => setFilter('fechado')}
          >
            Finalizados
          </Button>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            pedidos.map((pedido) => (
              <Card key={pedido.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Pedido #{pedido.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {pedido.mesa.nome} • {pedido.garcom.nome}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em {formatDate(pedido.criadoEm)}
                      </p>
                      {pedido.finalizadoEm && (
                        <p className="text-xs text-muted-foreground">
                          Finalizado em {formatDate(pedido.finalizadoEm)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          pedido.status === 'aberto'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {pedido.status === 'aberto' ? 'EM ANDAMENTO' : 'FINALIZADO'}
                      </p>
                      <p className="text-2xl font-bold text-primary-orange mt-2">
                        {formatCurrency(Number(pedido.total))}
                      </p>
                      {pedido.formaPagamento && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {pedido.formaPagamento}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-primary-brown">Itens:</p>
                    {pedido.itens.map((item, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        {item.quantidade}x {item.prato.nome}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

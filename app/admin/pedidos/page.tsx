'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Clock, CheckCircle2, Search, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface Pedido {
  id: number;
  mesa: { nome: string };
  garcom: { nome: string };
  fechadoPor?: { nome: string };
  status: string;
  total: number;
  formaPagamento?: string;
  criadoEm: string;
  finalizadoEm?: string;
  itens: Array<{
    id: number;
    prato: { nome: string };
    quantidade: number;
    subtotal: number;
    observacao?: string;
  }>;
}

export default function PedidosAdminPage() {
  const { token } = useAuthStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);

  useEffect(() => {
    fetchPedidos();
    // Auto refresh a cada 30 segundos
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos', {
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

  const handleFecharPedido = async (pedidoId: number) => {
    if (!confirm('Deseja fechar este pedido?')) return;

    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'fechado' }),
      });
      fetchPedidos();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const filtros = ['Todos', 'aberto', 'fechado'];
  
  let pedidosFiltrados = filtroStatus === 'Todos'
    ? pedidos
    : pedidos.filter((p) => p.status === filtroStatus);

  if (busca) {
    pedidosFiltrados = pedidosFiltrados.filter((p) =>
      p.mesa.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.garcom.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.id.toString().includes(busca)
    );
  }

  // Ordenar: abertos primeiro, depois por data
  pedidosFiltrados.sort((a, b) => {
    if (a.status === 'aberto' && b.status !== 'aberto') return -1;
    if (a.status !== 'aberto' && b.status === 'aberto') return 1;
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-brown mb-1">Gerenciar Pedidos</h1>
        <p className="text-gray-600">Visualize e gerencie todos os pedidos do restaurante</p>
      </div>

      {/* Stats Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Pedidos Abertos</p>
                <p className="text-4xl font-bold">
                  {pedidos.filter((p) => p.status === 'aberto').length}
                </p>
              </div>
              <ShoppingCart className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Pedidos Fechados</p>
                <p className="text-4xl font-bold">
                  {pedidos.filter((p) => p.status === 'fechado').length}
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total de Pedidos</p>
                <p className="text-4xl font-bold">{pedidos.length}</p>
              </div>
              <Filter className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por mesa, garçom ou número do pedido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {filtros.map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filtroStatus === status
                  ? 'bg-primary-orange text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {status === 'Todos' ? 'Todos' : status === 'aberto' ? 'Abertos' : 'Fechados'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {pedidosFiltrados.map((pedido) => {
          const totalItens = pedido.itens.reduce((sum, item) => sum + item.quantidade, 0);
          const isExpandido = pedidoExpandido === pedido.id;
          
          return (
            <Card
              key={pedido.id}
              className={`shadow-lg hover:shadow-xl transition-all border-l-4 ${
                pedido.status === 'aberto' ? 'border-blue-500' : 'border-green-500'
              }`}
            >
              <CardContent className="p-6">
                {/* Header do Pedido */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      pedido.status === 'aberto' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {pedido.status === 'aberto' ? (
                        <Clock className="h-6 w-6 text-blue-600" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Pedido #{pedido.id} • {pedido.mesa.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Garçom: <span className="font-medium">{pedido.garcom.nome}</span>
                        {pedido.fechadoPor && (
                          <> • Fechado por: <span className="font-medium">{pedido.fechadoPor.nome}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(Number(pedido.total))}
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      pedido.status === 'aberto'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {pedido.status === 'aberto' ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                </div>

                {/* Informações do Pedido */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Itens:</span>
                    <p className="font-bold text-gray-900">{totalItens} unidades</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Aberto em:</span>
                    <p className="font-bold text-gray-900">
                      {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {pedido.finalizadoEm && (
                    <div>
                      <span className="text-gray-600">Fechado em:</span>
                      <p className="font-bold text-gray-900">
                        {new Date(pedido.finalizadoEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {pedido.formaPagamento && (
                    <div>
                      <span className="text-gray-600">Pagamento:</span>
                      <p className="font-bold text-gray-900 capitalize">{pedido.formaPagamento}</p>
                    </div>
                  )}
                </div>

                {/* Botão Expandir/Recolher */}
                <button
                  onClick={() => setPedidoExpandido(isExpandido ? null : pedido.id)}
                  className="w-full text-sm text-primary-orange hover:text-primary-brown font-medium mb-3"
                >
                  {isExpandido ? '▲ Ocultar itens' : '▼ Ver itens do pedido'}
                </button>

                {/* Lista de Itens (Expandido) */}
                {isExpandido && (
                  <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-lg">
                    {pedido.itens.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.quantidade}x {item.prato.nome}
                          </p>
                          {item.observacao && (
                            <p className="text-xs text-gray-600 mt-1">Obs: {item.observacao}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(Number(item.subtotal))}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(Number(item.subtotal) / item.quantidade)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ações */}
                {pedido.status === 'aberto' && (
                  <button
                    onClick={() => handleFecharPedido(pedido.id)}
                    className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
                  >
                    Fechar Pedido
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pedidosFiltrados.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500">
              {busca
                ? 'Tente uma busca diferente'
                : filtroStatus === 'Todos'
                ? 'Ainda não há pedidos no sistema'
                : `Não há pedidos com status "${filtroStatus}"`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

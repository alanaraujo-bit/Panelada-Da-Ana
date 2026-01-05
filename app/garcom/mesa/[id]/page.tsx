'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Categoria {
  id: number;
  nome: string;
}

interface Prato {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: Categoria | null;
  categoriaId?: number;
}

interface PedidoItem {
  id: number;
  quantidade: number;
  observacao?: string;
  subtotal: number;
  prato: Prato;
}

interface Pedido {
  id: number;
  status: string;
  total: number;
  mesa: { nome: string };
  itens: PedidoItem[];
}

export default function MesaPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedPrato, setSelectedPrato] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(true);

  const categorias: string[] = useMemo(() => {
    console.log('[MesaPage] Processando categorias dos pratos:', pratos);

    const nomes = pratos
      .filter((p) => {
        return (
          p.categoria !== null &&
          p.categoria !== undefined &&
          typeof p.categoria === 'object' &&
          'nome' in p.categoria &&
          p.categoria.nome &&
          typeof p.categoria.nome === 'string'
        );
      })
      .map((p) => String(p.categoria!.nome))
      .filter((nome) => nome.trim() !== '');

    const uniqueNomes = Array.from(new Set(nomes)).sort();
    console.log('[MesaPage] Categorias únicas:', uniqueNomes);

    return uniqueNomes;
  }, [pratos]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPedido();
    fetchPratos();
  }, [token]);

  const fetchPedido = async () => {
    try {
      const response = await fetch(`/api/pedidos/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPedido(data);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPratos = async () => {
    try {
      const response = await fetch('/api/pratos?ativos=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('[MesaPage] Pratos recebidos:', data);
      setPratos(data);
    } catch (error) {
      console.error('Erro ao buscar pratos:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedPrato) return;

    try {
      await fetch(`/api/pedidos/${params.id}/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pratoId: selectedPrato,
          quantidade,
          observacao: observacao || undefined,
        }),
      });

      setShowAddItem(false);
      setSelectedPrato(null);
      setQuantidade(1);
      setObservacao('');
      fetchPedido();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await fetch(`/api/pedidos/${params.id}/item/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPedido();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const handleFinalizarPedido = () => {
    router.push(`/garcom/checkout?pedidoId=${params.id}`);
  };

  if (loading || !pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-cream">
        <p className="text-xl text-primary-brown">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-cream pb-20">
      {/* Header */}
      <div className="bg-primary-orange text-white p-5 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/garcom/mesas')}
              className="mr-4 text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{pedido.mesa.nome}</h1>
              <p className="text-base opacity-95">
                Pedido #{pedido.id}
              </p>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm opacity-90 mb-1">Total</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(pedido.total))}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Lista de Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedido.itens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item adicionado ainda
              </p>
            ) : (
              pedido.itens.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-3 bg-primary-cream rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-primary-brown">
                      {item.quantidade}x {item.prato.nome}
                    </p>
                    {item.observacao && (
                      <p className="text-sm text-muted-foreground">
                        Obs: {item.observacao}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-primary-orange mt-1">
                      {formatCurrency(Number(item.subtotal))}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Adicionar Item */}
        {!showAddItem ? (
          <Button
            className="w-full h-14 text-lg"
            onClick={() => setShowAddItem(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Item
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pratos.length === 0 || categorias.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum prato disponível
                </p>
              ) : (
                <div className="space-y-4">
                  {categorias.filter(cat => cat && typeof cat === 'string').map((categoriaNome, index) => {
                    const pratosDaCategoria = pratos.filter(
                      (p) => {
                        if (!p.categoria || typeof p.categoria !== 'object') return false;
                        const nome = p.categoria.nome;
                        return typeof nome === 'string' && nome === categoriaNome;
                      }
                    );
                    
                    if (pratosDaCategoria.length === 0) return null;
                    
                    return (
                      <div key={`categoria-${index}-${categoriaNome}`}>
                        <h3 className="font-semibold text-primary-brown mb-2">
                          {categoriaNome}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {pratosDaCategoria.map((prato) => (
                          <button
                            key={`prato-${prato.id}`}
                            onClick={() => setSelectedPrato(prato.id)}
                            className={`p-3 text-left rounded-lg border-2 transition-all ${
                              selectedPrato === prato.id
                                ? 'border-primary-orange bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className="font-semibold">{prato.nome}</p>
                            {prato.descricao && (
                              <p className="text-sm text-muted-foreground">
                                {prato.descricao}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-primary-orange mt-1">
                              {formatCurrency(Number(prato.preco))}
                            </p>
                          </button>
                        ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPrato && (
                <>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(parseInt(e.target.value))}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label>Observação (opcional)</Label>
                    <Input
                      type="text"
                      placeholder="Ex: sem cebola"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddItem(false);
                    setSelectedPrato(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddItem}
                  disabled={!selectedPrato}
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finalizar */}
        {pedido.itens.length > 0 && (
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 mb-20"
            onClick={handleFinalizarPedido}
          >
            <Check className="mr-2 h-5 w-5" />
            Finalizar Pedido - {formatCurrency(Number(pedido.total))}
          </Button>
        )}
      </div>

      {/* Botão Fixo de Finalizar - Acima da Navegação */}
      {pedido.itens.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-gray-200 shadow-lg">
          <div className="bg-green-600 hover:bg-green-700 cursor-pointer transition-colors" onClick={handleFinalizarPedido}>
            <div className="max-w-lg mx-auto px-5 py-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Check className="h-7 w-7" />
                  <div>
                    <p className="text-sm opacity-90">Finalizar Pedido</p>
                    <p className="text-2xl font-bold">{formatCurrency(Number(pedido.total))}</p>
                  </div>
                </div>
                <div className="text-4xl font-bold">→</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

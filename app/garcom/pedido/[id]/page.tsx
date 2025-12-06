'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Minus, Trash2, DollarSign, Search, X, ShoppingCart, Check } from 'lucide-react';

interface Prato {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
}

interface ItemCarrinho {
  prato: Prato;
  quantidade: number;
  observacao: string;
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
  const [pratosExibidos, setPratosExibidos] = useState<Prato[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPedido();
    fetchPratos();
  }, [token]);

  useEffect(() => {
    let filtered = pratos;
    
    if (categoriaFiltro !== 'todas') {
      filtered = filtered.filter(p => p.categoria === categoriaFiltro);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setPratosExibidos(filtered);
  }, [pratos, categoriaFiltro, searchTerm]);

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
      setPratos(data);
      setPratosExibidos(data);
    } catch (error) {
      console.error('Erro ao buscar pratos:', error);
    }
  };

  // Adicionar item ao carrinho (adiciona quantidade)
  const adicionarAoCarrinho = (prato: Prato, qtd: number = 1) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.prato.id === prato.id);
      if (existente) {
        return prev.map(item => 
          item.prato.id === prato.id 
            ? { ...item, quantidade: item.quantidade + qtd }
            : item
        );
      }
      return [...prev, { prato, quantidade: qtd, observacao: '' }];
    });
  };

  // Remover do carrinho
  const removerDoCarrinho = (pratoId: number) => {
    setCarrinho(prev => prev.filter(item => item.prato.id !== pratoId));
  };

  // Alterar quantidade no carrinho
  const alterarQuantidadeCarrinho = (pratoId: number, novaQtd: number) => {
    if (novaQtd <= 0) {
      removerDoCarrinho(pratoId);
      return;
    }
    setCarrinho(prev => prev.map(item => 
      item.prato.id === pratoId 
        ? { ...item, quantidade: novaQtd }
        : item
    ));
  };

  // Alterar observação no carrinho
  const alterarObservacaoCarrinho = (pratoId: number, obs: string) => {
    setCarrinho(prev => prev.map(item => 
      item.prato.id === pratoId 
        ? { ...item, observacao: obs }
        : item
    ));
  };

  // Confirmar todos os itens do carrinho
  const confirmarCarrinho = async () => {
    if (carrinho.length === 0) return;

    setSalvando(true);
    try {
      // Enviar todos os itens do carrinho
      await Promise.all(
        carrinho.map(item =>
          fetch(`/api/pedidos/${params.id}/item`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              pratoId: item.prato.id,
              quantidade: item.quantidade,
              observacao: item.observacao || undefined,
            }),
          })
        )
      );

      // Limpar carrinho e fechar modal
      setCarrinho([]);
      setShowAddItems(false);
      setSearchTerm('');
      setCategoriaFiltro('todas');
      
      // Recarregar pedido
      await fetchPedido();
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
      alert('Erro ao adicionar alguns itens. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm('Remover este item do pedido?')) return;

    try {
      await fetch(`/api/pedidos/${params.id}/item/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPedido();
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item');
    }
  };

  const handleFecharPedido = () => {
    router.push(`/garcom/checkout?pedidoId=${params.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">Pedido não encontrado</p>
      </div>
    );
  }

  const categorias = ['todas', ...Array.from(new Set(pratos.map(p => p.categoria)))];
  const totalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.prato.preco) * item.quantidade), 0);
  const qtdItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-primary-brown text-white p-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/garcom/mesas')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{pedido.mesa.nome}</h1>
              <p className="text-sm opacity-90">Pedido #{pedido.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Itens */}
      {showAddItems && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
          <div className="bg-white flex flex-col h-full">
            {/* Header do Modal */}
            <div className="bg-primary-orange text-white p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (carrinho.length > 0) {
                      if (confirm('Descartar itens do carrinho?')) {
                        setCarrinho([]);
                        setShowAddItems(false);
                      }
                    } else {
                      setShowAddItems(false);
                    }
                  }}
                  className="p-2 hover:bg-white/20 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold">Adicionar Itens</h2>
              </div>
              
              {carrinho.length > 0 && (
                <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="font-bold">{qtdItensCarrinho}</span>
                </div>
              )}
            </div>

            {/* Busca e Filtros */}
            <div className="p-4 space-y-3 bg-white border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar prato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaFiltro(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                      categoriaFiltro === cat
                        ? 'bg-primary-orange text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Pratos */}
            <div className="flex-1 overflow-y-auto pb-96">
              <div className="p-4 space-y-2 pb-8">
                {pratosExibidos.map((prato) => {
                const noCarrinho = carrinho.find(item => item.prato.id === prato.id);
                
                return (
                  <Card
                    key={prato.id}
                    className={`transition-all ${noCarrinho ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{prato.nome}</h3>
                          {prato.descricao && (
                            <p className="text-sm text-gray-600 mt-1">
                              {prato.descricao}
                            </p>
                          )}
                          <p className="text-xl font-bold text-green-600 mt-2">
                            R$ {Number(prato.preco).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Botões de Ação Rápida */}
                        <div className="flex flex-col gap-2 justify-center">
                          {noCarrinho ? (
                            <div className="bg-green-100 rounded-lg p-2 flex items-center gap-2">
                              <span className="text-green-700 font-bold text-lg">
                                {noCarrinho.quantidade}
                              </span>
                            </div>
                          ) : null}
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => adicionarAoCarrinho(prato, 1)}
                              className="bg-primary-orange text-white px-3 py-2 rounded-lg font-bold hover:bg-primary-brown transition-colors"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => adicionarAoCarrinho(prato, 2)}
                              className="bg-primary-orange text-white px-3 py-2 rounded-lg font-bold hover:bg-primary-brown transition-colors"
                            >
                              +2
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {pratosExibidos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum prato encontrado</p>
                </div>
              )}
            </div>
          </div>

            {/* Footer Fixo com Botão de Confirmar */}
            {carrinho.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 shadow-2xl z-50">
                {/* Resumo do Carrinho Expansível */}
                {mostrarCarrinho && (
                  <div className="border-b bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="p-4 max-w-lg mx-auto space-y-2">
                      {carrinho.map(item => (
                        <div key={item.prato.id} className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidadeCarrinho(item.prato.id, item.quantidade - 1)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-bold text-lg w-8 text-center">{item.quantidade}</span>
                            <button
                              onClick={() => alterarQuantidadeCarrinho(item.prato.id, item.quantidade + 1)}
                              className="w-8 h-8 bg-primary-orange text-white rounded-full flex items-center justify-center hover:bg-primary-brown"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.prato.nome}</p>
                            <p className="text-xs text-green-600 font-bold">
                              R$ {(Number(item.prato.preco) * item.quantidade).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removerDoCarrinho(item.prato.id)}
                            className="text-red-500 p-2 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão de Confirmar */}
                <div className="p-5 bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <div className="max-w-lg mx-auto space-y-4">
                    {/* Resumo Rápido */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="font-medium">
                          {qtdItensCarrinho} {qtdItensCarrinho === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">R$ {totalCarrinho.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Botão Grande de Confirmar */}
                    <Button
                      onClick={confirmarCarrinho}
                      disabled={salvando}
                      className="w-full h-16 bg-white text-green-700 hover:bg-gray-100 font-bold text-xl shadow-lg border-4 border-white"
                    >
                      {salvando ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700 mr-3"></div>
                          <span>Adicionando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Check className="mr-3 h-8 w-8" />
                          <span>CONFIRMAR PEDIDO</span>
                        </div>
                      )}
                    </Button>

                    {/* Link para ver detalhes */}
                    {carrinho.length > 1 && (
                      <button
                        onClick={() => setMostrarCarrinho(!mostrarCarrinho)}
                        className="w-full text-center text-sm opacity-90 hover:opacity-100 underline"
                      >
                        {mostrarCarrinho ? 'Ocultar detalhes ▼' : 'Ver detalhes dos itens ▲'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Itens do Pedido */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Itens do Pedido</h2>
            <span className="text-sm text-gray-500">
              {pedido.itens.length} item{pedido.itens.length !== 1 ? 's' : ''}
            </span>
          </div>

          {pedido.itens.length > 0 ? (
            <div className="space-y-2">
              {pedido.itens.map((item) => (
                <Card key={item.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-orange text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                        {item.quantidade}x
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{item.prato.nome}</h3>
                        {item.observacao && (
                          <p className="text-sm text-gray-600 mt-1">
                            Obs: {item.observacao}
                          </p>
                        )}
                        <p className="text-lg font-bold text-green-600 mt-1">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum item adicionado ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Toque no botão abaixo para começar
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Botão Adicionar Itens */}
        <Button
          onClick={() => setShowAddItems(true)}
          className="w-full h-16 text-lg bg-primary-orange hover:bg-primary-brown shadow-lg"
        >
          <Plus className="mr-2 h-6 w-6" />
          Adicionar Itens ao Pedido
        </Button>
      </div>

      {/* Footer Fixo com Total */}
      {pedido.itens.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-10">
          <div className="max-w-lg mx-auto p-4 space-y-3">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total do Pedido</p>
                  <p className="text-3xl font-bold">R$ {Number(pedido.total).toFixed(2)}</p>
                </div>
                <DollarSign className="h-12 w-12 opacity-80" />
              </div>
            </div>
            
            <Button
              onClick={handleFecharPedido}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 font-bold"
            >
              Fechar Conta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

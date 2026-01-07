'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, ChevronRight, Wallet, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Pagamento {
  id: number;
  valor: number;
  formaPagamento: string;
  criadoEm: string;
  registradoPor: {
    nome: string;
  };
}

const formasPagamentoConfig = {
  dinheiro: { label: 'Dinheiro', icon: DollarSign, color: 'bg-green-500' },
  pix: { label: 'PIX', icon: Smartphone, color: 'bg-teal-500' },
  debito: { label: 'Débito', icon: CreditCard, color: 'bg-blue-500' },
  credito: { label: 'Crédito', icon: CreditCard, color: 'bg-purple-500' },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuthStore();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'choose' | 'partial'>('choose');
  const [customValue, setCustomValue] = useState('');
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState('');

  const pedidoId = searchParams.get('pedidoId');

  useEffect(() => {
    if (!token || !pedidoId) {
      router.push('/garcom/mesas');
      return;
    }
    fetchPedido();
  }, [token, pedidoId]);

  const fetchPedido = async () => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}?include=pagamentos`, {
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

  const handlePagamento = async (formaPagamento: string, valorParcial?: number) => {
    setProcessing(true);
    try {
      const totalPago = Number(pedido.totalPago || 0);
      const total = Number(pedido.total);
      const faltaPagar = total - totalPago;
      const valor = valorParcial || faltaPagar;

      const response = await fetch(`/api/pedidos/${pedidoId}/pagamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          valor,
          formaPagamento,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao registrar pagamento');
        setProcessing(false);
        return;
      }

      // Se foi totalmente pago, redirecionar
      if (data.faltaPagar <= 0) {
        router.push('/garcom/mesas');
      } else {
        // Atualizar dados do pedido
        await fetchPedido();
        setMode('choose');
        setCustomValue('');
        setSelectedFormaPagamento('');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  const handleQuickPayment = (formaPagamento: string) => {
    handlePagamento(formaPagamento);
  };

  const handleCustomPayment = () => {
    const valor = parseFloat(customValue);
    const totalPago = Number(pedido.totalPago || 0);
    const total = Number(pedido.total);
    const faltaPagar = total - totalPago;
    
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido');
      return;
    }
    if (valor > faltaPagar) {
      alert(`Valor não pode ser maior que ${formatCurrency(faltaPagar)}`);
      return;
    }
    if (!selectedFormaPagamento) {
      alert('Selecione uma forma de pagamento');
      return;
    }
    handlePagamento(selectedFormaPagamento, valor);
  };

  if (loading || !pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-cream">
        <p className="text-xl text-primary-brown">Carregando...</p>
      </div>
    );
  }

  const formasPagamento = [
    { id: 'dinheiro', label: 'Dinheiro' },
    { id: 'pix', label: 'PIX' },
    { id: 'debito', label: 'Débito' },
    { id: 'credito', label: 'Crédito' },
  ];

  const totalPago = Number(pedido.totalPago || 0);
  const total = Number(pedido.total);
  const faltaPagar = total - totalPago;
  const pagamentos = pedido.pagamentos || [];
  const percentPago = (totalPago / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-cream via-white to-primary-cream pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-orange to-orange-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-3 text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Pagamento</h1>
            <p className="text-xs opacity-90">Mesa {pedido.mesa.nome}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Card de Resumo com Progresso */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-primary-orange/10 to-orange-50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-primary-brown/70">Total do pedido</p>
                <p className="text-3xl font-bold text-primary-brown">{formatCurrency(total)}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary-orange" />
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary-brown/70">Progresso do pagamento</span>
                <span className="font-semibold text-primary-brown">{percentPago.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(percentPago, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs sm:text-sm pt-1">
                <span className="text-green-600 font-semibold">Pago: {formatCurrency(totalPago)}</span>
                <span className="text-primary-orange font-semibold">Falta: {formatCurrency(faltaPagar)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Histórico de Pagamentos */}
        {pagamentos.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Pagamentos Registrados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pagamentos.map((pag: Pagamento) => {
                const config = formasPagamentoConfig[pag.formaPagamento as keyof typeof formasPagamentoConfig];
                const Icon = config?.icon || Wallet;
                return (
                  <div
                    key={pag.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${config?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm capitalize">{config?.label || pag.formaPagamento}</p>
                        <p className="text-xs text-muted-foreground">{pag.registradoPor.nome}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(Number(pag.valor))}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Formas de Pagamento */}
        {faltaPagar > 0 && mode === 'choose' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-primary-brown px-1">Como deseja pagar?</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {formasPagamento.map((forma) => {
                const config = formasPagamentoConfig[forma.id as keyof typeof formasPagamentoConfig];
                const Icon = config?.icon || Wallet;
                return (
                  <button
                    key={forma.id}
                    onClick={() => handleQuickPayment(forma.id)}
                    disabled={processing}
                    className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-orange-50 border-2 border-gray-200 hover:border-primary-orange rounded-xl p-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 ${config?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold text-sm text-primary-brown">{forma.label}</span>
                      <span className="text-xs text-primary-orange font-bold">{formatCurrency(faltaPagar)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setMode('partial')}
              variant="outline"
              className="w-full h-12 border-2 border-dashed border-primary-orange/30 hover:border-primary-orange hover:bg-orange-50 text-primary-brown font-semibold"
              disabled={processing}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Pagar valor parcial
            </Button>
          </div>
        )}

        {/* Modo Pagamento Parcial */}
        {faltaPagar > 0 && mode === 'partial' && (
          <Card className="border-2 border-primary-orange/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-orange" />
                  Pagamento Parcial
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode('choose');
                    setCustomValue('');
                    setSelectedFormaPagamento('');
                  }}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-brown">
                  Valor a pagar <span className="text-xs text-muted-foreground">(máx: {formatCurrency(faltaPagar)})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-brown font-semibold">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={faltaPagar}
                    placeholder="0,00"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="h-14 text-xl font-bold pl-12 border-2 focus:border-primary-orange"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-brown">Forma de pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {formasPagamento.map((forma) => {
                    const config = formasPagamentoConfig[forma.id as keyof typeof formasPagamentoConfig];
                    const Icon = config?.icon || Wallet;
                    const isSelected = selectedFormaPagamento === forma.id;
                    return (
                      <button
                        key={forma.id}
                        onClick={() => setSelectedFormaPagamento(forma.id)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-orange bg-orange-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-10 h-10 ${config?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center ${isSelected ? 'scale-110' : ''} transition-transform`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-xs">{forma.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleCustomPayment}
                disabled={processing || !customValue || !selectedFormaPagamento}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange/90 hover:to-orange-600/90"
              >
                {processing ? 'Processando...' : (
                  <>
                    Confirmar Pagamento
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Processamento */}
      {processing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Check className="h-10 w-10 text-white" />
              </div>
              <p className="text-xl font-bold text-primary-brown mb-2">
                Processando pagamento
              </p>
              <p className="text-sm text-muted-foreground">
                Aguarde um momento...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary-cream">
        <p className="text-xl text-primary-brown">Carregando...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

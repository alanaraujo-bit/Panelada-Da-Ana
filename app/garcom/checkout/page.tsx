'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X } from 'lucide-react';
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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuthStore();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCustomValue, setShowCustomValue] = useState(false);
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
        setShowCustomValue(false);
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

  const handleCustomPayment = () => {
    const valor = parseFloat(customValue);
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido');
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
    { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { id: 'pix', label: 'PIX', icon: '📱' },
    { id: 'debito', label: 'Débito', icon: '💳' },
    { id: 'credito', label: 'Crédito', icon: '💳' },
  ];

  const totalPago = Number(pedido.totalPago || 0);
  const total = Number(pedido.total);
  const faltaPagar = total - totalPago;
  const pagamentos = pedido.pagamentos || [];

  return (
    <div className="min-h-screen bg-primary-cream pb-20">
      {/* Header */}
      <div className="bg-primary-orange text-white p-3 sm:p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2 sm:mr-3 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-xl font-bold">Pagamento do Pedido</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Resumo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mesa:</span>
              <span className="font-semibold">{pedido.mesa.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-semibold">{pedido.itens.length}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-primary-brown">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Pago:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(totalPago)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base sm:text-lg">
              <span className="font-bold">Falta pagar:</span>
              <span className="font-bold text-primary-orange">
                {formatCurrency(faltaPagar)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Pagamentos */}
        {pagamentos.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Pagamentos Registrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pagamentos.map((pag: Pagamento) => (
                <div
                  key={pag.id}
                  className="flex justify-between items-center text-xs sm:text-sm p-2 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-semibold capitalize">{pag.formaPagamento}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      por {pag.registradoPor.nome}
                    </span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(Number(pag.valor))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Formas de Pagamento - Pagar Total */}
        {faltaPagar > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Pagar Total ({formatCurrency(faltaPagar)})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:gap-3">
              {formasPagamento.map((forma) => (
                <button
                  key={forma.id}
                  onClick={() => handlePagamento(forma.id)}
                  disabled={processing}
                  className="p-4 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-primary-orange hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{forma.icon}</div>
                  <div className="font-semibold text-primary-brown text-xs sm:text-base">
                    {forma.label}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pagamento Parcial */}
        {faltaPagar > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Pagamento Parcial</CardTitle>
                {showCustomValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomValue(false);
                      setCustomValue('');
                      setSelectedFormaPagamento('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showCustomValue ? (
                <Button
                  onClick={() => setShowCustomValue(true)}
                  variant="outline"
                  className="w-full"
                  disabled={processing}
                >
                  Informar valor parcial
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={faltaPagar}
                      placeholder="0,00"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      {formasPagamento.map((forma) => (
                        <button
                          key={forma.id}
                          onClick={() => setSelectedFormaPagamento(forma.id)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            selectedFormaPagamento === forma.id
                              ? 'border-primary-orange bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{forma.icon}</div>
                          <div className="font-medium text-xs">{forma.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleCustomPayment}
                    disabled={processing || !customValue || !selectedFormaPagamento}
                    className="w-full h-11"
                  >
                    {processing ? 'Processando...' : 'Confirmar Pagamento'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {processing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-sm mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xl font-semibold text-primary-brown">
                Processando pagamento...
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

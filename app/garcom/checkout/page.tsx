'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

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
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
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

  const handleFinalizarPedido = async (formaPagamento: string) => {
    setFinalizing(true);
    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'fechado',
          formaPagamento,
        }),
      });

      router.push('/garcom/mesas');
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      setFinalizing(false);
    }
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
    { id: 'debito', label: 'Cartão Débito', icon: '💳' },
    { id: 'credito', label: 'Cartão Crédito', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-primary-cream">
      {/* Header */}
      <div className="bg-primary-orange text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-3 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Finalizar Pedido</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mesa:</span>
              <span className="font-semibold">{pedido.mesa.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-semibold">{pedido.itens.length}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-primary-orange">
                {formatCurrency(Number(pedido.total))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {formasPagamento.map((forma) => (
              <button
                key={forma.id}
                onClick={() => handleFinalizarPedido(forma.id)}
                disabled={finalizing}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-orange hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-4xl mb-2">{forma.icon}</div>
                <div className="font-semibold text-primary-brown">
                  {forma.label}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {finalizing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-sm mx-4">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-primary-brown">
                  Finalizando pedido...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

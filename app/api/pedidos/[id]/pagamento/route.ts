import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const pagamentoSchema = z.object({
  valor: z.number().positive('Valor deve ser maior que zero'),
  formaPagamento: z.enum(['dinheiro', 'pix', 'debito', 'credito']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const pedidoId = parseInt(params.id);
    const body = await request.json();
    const validation = pagamentoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { valor, formaPagamento } = validation.data;

    // Buscar pedido atual
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagamentos: true },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.status === 'fechado') {
      return NextResponse.json({ error: 'Pedido já foi fechado' }, { status: 400 });
    }

    const totalPago = Number(pedido.totalPago);
    const total = Number(pedido.total);
    const faltaPagar = total - totalPago;

    if (valor > faltaPagar) {
      return NextResponse.json(
        { error: `Valor informado (${valor.toFixed(2)}) é maior que o restante a pagar (${faltaPagar.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Registrar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        pedidoId,
        valor,
        formaPagamento,
        registradoPorId: payload.userId,
      },
    });

    // Atualizar totalPago do pedido
    const novoTotalPago = totalPago + valor;
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        totalPago: novoTotalPago,
        // Se o valor pago for igual ao total, fechar o pedido
        status: novoTotalPago >= total ? 'fechado' : pedido.status,
        finalizadoEm: novoTotalPago >= total ? new Date() : pedido.finalizadoEm,
        fechadoPorId: novoTotalPago >= total ? payload.userId : pedido.fechadoPorId,
      },
      include: {
        pagamentos: {
          include: {
            registradoPor: {
              select: { id: true, nome: true, email: true },
            },
          },
        },
        mesa: true,
      },
    });

    // Se foi totalmente pago, liberar mesa
    if (novoTotalPago >= total) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: 'livre' },
      });
    }

    return NextResponse.json({
      pagamento,
      pedido: pedidoAtualizado,
      totalPago: novoTotalPago,
      faltaPagar: total - novoTotalPago,
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar pagamento' },
      { status: 500 }
    );
  }
}

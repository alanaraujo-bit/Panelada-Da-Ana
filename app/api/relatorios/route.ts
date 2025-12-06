import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const whereClause: any = {
      status: 'fechado',
    };

    if (dataInicio && dataFim) {
      whereClause.finalizadoEm = {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      };
    }

    // Faturamento total
    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        itens: {
          include: {
            prato: true,
          },
        },
      },
    });

    const faturamentoTotal = pedidos.reduce((acc: number, pedido: any) => {
      return acc + parseFloat(pedido.total.toString());
    }, 0);

    // Faturamento por forma de pagamento
    const faturamentoPorPagamento = pedidos.reduce((acc: any, pedido: any) => {
      const forma = pedido.formaPagamento || 'outros';
      acc[forma] = (acc[forma] || 0) + parseFloat(pedido.total.toString());
      return acc;
    }, {});

    // Pratos mais vendidos
    const pratosVendidos: any = {};
    pedidos.forEach((pedido: any) => {
      pedido.itens.forEach((item: any) => {
        if (!pratosVendidos[item.prato.nome]) {
          pratosVendidos[item.prato.nome] = {
            nome: item.prato.nome,
            quantidade: 0,
            total: 0,
          };
        }
        pratosVendidos[item.prato.nome].quantidade += item.quantidade;
        pratosVendidos[item.prato.nome].total += parseFloat(item.subtotal.toString());
      });
    });

    const pratosMaisVendidos = Object.values(pratosVendidos)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 10);

    return NextResponse.json({
      faturamentoTotal,
      totalPedidos: pedidos.length,
      faturamentoPorPagamento,
      pratosMaisVendidos,
    });
  } catch (error) {
    console.error('Error fetching relatorios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios' },
      { status: 500 }
    );
  }
}

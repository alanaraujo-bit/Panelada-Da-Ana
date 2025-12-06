import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo') || 'completo';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Construir filtro de data
    const filtroData: any = {};
    if (dataInicio) {
      filtroData.gte = new Date(dataInicio);
    }
    if (dataFim) {
      const dataFimDate = new Date(dataFim);
      dataFimDate.setHours(23, 59, 59, 999);
      filtroData.lte = dataFimDate;
    }

    // Buscar pedidos
    const pedidos = await prisma.pedido.findMany({
      where: Object.keys(filtroData).length > 0 ? { criadoEm: filtroData } : {},
      include: {
        mesa: true,
        garcom: true,
        itens: {
          include: {
            prato: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    // Calcular estatísticas
    const totalPedidos = pedidos.length;
    const pedidosFechados = pedidos.filter((p: any) => p.status === 'fechado').length;
    const pedidosAbertos = pedidos.filter((p: any) => p.status === 'aberto').length;

    const totalVendas = pedidos.reduce((sum: number, p: any) => {
      const total = p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      return sum + total;
    }, 0);

    const ticketMedio = pedidosFechados > 0 ? totalVendas / pedidosFechados : 0;

    const totalItens = pedidos.reduce((sum: number, p: any) => {
      return sum + p.itens.reduce((s: number, i: any) => s + i.quantidade, 0);
    }, 0);

    let resultado: any = {
      totalRegistros: totalPedidos,
      totalPedidos,
      pedidosFechados,
      pedidosAbertos,
      totalVendas,
      ticketMedio,
      totalItens,
    };

    if (tipo === 'completo' || tipo === 'vendas') {
      resultado.pedidos = pedidos.map((p: any) => {
        const total = p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        return {
          id: p.id,
          mesa: p.mesa.nome,
          garcom: p.garcom.nome,
          status: p.status,
          total,
          data: p.criadoEm,
          itens: p.itens.map((i: any) => ({
            prato: i.prato.nome,
            quantidade: i.quantidade,
            subtotal: Number(i.subtotal),
          })),
        };
      });
    }

    if (tipo === 'produtos') {
      const produtosMap: { [key: string]: { nome: string; quantidade: number; total: number } } = {};

      pedidos.forEach((pedido: any) => {
        pedido.itens.forEach((item: any) => {
          const key = item.prato.id;
          if (!produtosMap[key]) {
            produtosMap[key] = { nome: item.prato.nome, quantidade: 0, total: 0 };
          }
          produtosMap[key].quantidade += item.quantidade;
          produtosMap[key].total += Number(item.subtotal);
        });
      });

      resultado.produtos = Object.values(produtosMap)
        .sort((a, b) => b.quantidade - a.quantidade)
        .map((p) => ({
          ...p,
          precoMedio: p.quantidade > 0 ? p.total / p.quantidade : 0,
        }));
    }

    if (tipo === 'garcons') {
      const garconsMap: { [key: number]: { nome: string; pedidos: number; total: number } } = {};

      pedidos.forEach((pedido: any) => {
        const key = pedido.garcom.id;
        const totalPedido = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);

        if (!garconsMap[key]) {
          garconsMap[key] = { nome: pedido.garcom.nome, pedidos: 0, total: 0 };
        }
        garconsMap[key].pedidos += 1;
        garconsMap[key].total += totalPedido;
      });

      resultado.garcons = Object.values(garconsMap)
        .sort((a, b) => b.total - a.total)
        .map((g) => ({
          ...g,
          ticketMedio: g.pedidos > 0 ? g.total / g.pedidos : 0,
        }));
    }

    if (tipo === 'mesas') {
      const mesasMap: { [key: number]: { nome: string; pedidos: number; total: number } } = {};

      pedidos.forEach((pedido: any) => {
        const key = pedido.mesa.id;
        const totalPedido = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);

        if (!mesasMap[key]) {
          mesasMap[key] = { nome: pedido.mesa.nome, pedidos: 0, total: 0 };
        }
        mesasMap[key].pedidos += 1;
        mesasMap[key].total += totalPedido;
      });

      resultado.mesas = Object.values(mesasMap)
        .sort((a, b) => b.total - a.total);
    }

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do relatório' },
      { status: 500 }
    );
  }
}

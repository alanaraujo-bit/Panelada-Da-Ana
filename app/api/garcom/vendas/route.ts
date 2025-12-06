import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - 7);
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);

    // Vendas hoje (apenas pedidos fechados)
    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        status: 'fechado',
        criadoEm: { gte: inicioHoje, lte: fimHoje },
      },
    });

    // Vendas semana (apenas pedidos fechados)
    const pedidosSemana = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        status: 'fechado',
        criadoEm: { gte: inicioSemana },
      },
    });

    // Vendas mês (apenas pedidos fechados)
    const pedidosMes = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        status: 'fechado',
        criadoEm: { gte: inicioMes },
      },
    });

    // Histórico últimos 7 dias
    const historico = [];
    for (let i = 6; i >= 0; i--) {
      const diaAtual = new Date();
      diaAtual.setDate(diaAtual.getDate() - i);
      const inicioDia = new Date(diaAtual.getFullYear(), diaAtual.getMonth(), diaAtual.getDate(), 0, 0, 0, 0);
      const fimDia = new Date(diaAtual.getFullYear(), diaAtual.getMonth(), diaAtual.getDate(), 23, 59, 59, 999);

      const pedidosDia = await prisma.pedido.findMany({
        where: {
          garcomId: decoded.userId,
          status: 'fechado',
          criadoEm: { gte: inicioDia, lte: fimDia },
        },
      });

      const total = pedidosDia.reduce((acc: number, p: any) => acc + Number(p.total), 0);
      
      // Formatar data corretamente
      const dataFormatada = new Date(inicioDia.getTime() - inicioDia.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      
      historico.push({
        data: dataFormatada,
        total,
        pedidos: pedidosDia.length,
      });
    }

    return NextResponse.json({
      hoje: {
        total: pedidosHoje.reduce((acc: number, p: any) => acc + Number(p.total), 0),
        pedidos: pedidosHoje.length,
      },
      semana: {
        total: pedidosSemana.reduce((acc: number, p: any) => acc + Number(p.total), 0),
        pedidos: pedidosSemana.length,
      },
      mes: {
        total: pedidosMes.reduce((acc: number, p: any) => acc + Number(p.total), 0),
        pedidos: pedidosMes.length,
      },
      historico,
    });
  } catch (error) {
    console.error('Vendas error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    );
  }
}

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

    const hoje = new Date();
    const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
    const fimHoje = new Date(hoje.setHours(23, 59, 59, 999));

    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    // Vendas hoje
    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        criadoEm: { gte: inicioHoje, lte: fimHoje },
      },
    });

    // Vendas semana
    const pedidosSemana = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        criadoEm: { gte: inicioSemana },
      },
    });

    // Vendas mês
    const pedidosMes = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        criadoEm: { gte: inicioMes },
      },
    });

    // Histórico últimos 7 dias
    const historico = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      const inicioDia = new Date(dia.setHours(0, 0, 0, 0));
      const fimDia = new Date(dia.setHours(23, 59, 59, 999));

      const pedidosDia = await prisma.pedido.findMany({
        where: {
          garcomId: decoded.userId,
          criadoEm: { gte: inicioDia, lte: fimDia },
        },
      });

      const total = pedidosDia.reduce((acc: number, p: any) => acc + Number(p.total), 0);
      historico.push({
        data: inicioDia.toISOString().split('T')[0],
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

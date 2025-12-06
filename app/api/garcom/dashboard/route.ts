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

    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data') || new Date().toISOString().split('T')[0];

    const inicioHoje = new Date(data + 'T00:00:00');
    const fimHoje = new Date(data + 'T23:59:59');

    // Buscar pedidos do garçom hoje
    const pedidos = await prisma.pedido.findMany({
      where: {
        garcomId: decoded.userId,
        criadoEm: {
          gte: inicioHoje,
          lte: fimHoje,
        },
      },
      include: {
        itens: {
          include: {
            prato: true,
          },
        },
        mesa: true,
      },
    });

    // Calcular métricas
    const vendasHoje = pedidos.reduce((acc: number, p: any) => acc + Number(p.total), 0);
    const pedidosHoje = pedidos.length;
    const ticketMedio = pedidosHoje > 0 ? vendasHoje / pedidosHoje : 0;
    const pedidosAbertos = pedidos.filter((p: any) => p.status === 'aberto').length;

    // Mesas mais vendidas
    const mesasMap = new Map<string, number>();
    pedidos.forEach((p: any) => {
      const mesaNome = p.mesa.nome;
      mesasMap.set(mesaNome, (mesasMap.get(mesaNome) || 0) + Number(p.total));
    });

    const mesasMaisVendidas = Array.from(mesasMap.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Ranking entre garçons
    const todosGarcons = await prisma.user.findMany({
      where: { role: 'garcom' },
      select: { id: true },
    });

    const vendasGarcons = await Promise.all(
      todosGarcons.map(async (g: any) => {
        const pedidosGarcom = await prisma.pedido.findMany({
          where: {
            garcomId: g.id,
            criadoEm: { gte: inicioHoje, lte: fimHoje },
          },
        });
        const total = pedidosGarcom.reduce((acc: number, p: any) => acc + Number(p.total), 0);
        return { id: g.id, total };
      })
    );

    vendasGarcons.sort((a: any, b: any) => b.total - a.total);
    const ranking = vendasGarcons.findIndex((g: any) => g.id === decoded.userId) + 1;

    return NextResponse.json({
      vendasHoje,
      pedidosHoje,
      ticketMedio,
      pedidosAbertos,
      mesasMaisVendidas,
      horariosAtivos: [],
      ranking,
      totalGarcons: todosGarcons.length,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dashboard' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { tipo } = body;

    let resultado = { message: '', deletados: 0 };

    switch (tipo) {
      case 'pedidos':
        // Limpar apenas pedidos fechados
        const pedidosFechados = await prisma.pedido.findMany({
          where: { status: 'fechado' },
          select: { id: true },
        });

        // Deletar itens dos pedidos primeiro (devido a foreign key)
        await prisma.pedidoItem.deleteMany({
          where: {
            pedidoId: {
              in: pedidosFechados.map((p) => p.id),
            },
          },
        });

        // Deletar pedidos
        const deletedPedidos = await prisma.pedido.deleteMany({
          where: { status: 'fechado' },
        });

        resultado = {
          message: 'Pedidos fechados removidos com sucesso',
          deletados: deletedPedidos.count,
        };
        break;

      case 'antigos':
        // Limpar dados com mais de 90 dias
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 90);

        const pedidosAntigos = await prisma.pedido.findMany({
          where: {
            criadoEm: { lt: dataLimite },
            status: 'fechado',
          },
          select: { id: true },
        });

        // Deletar itens dos pedidos antigos
        await prisma.pedidoItem.deleteMany({
          where: {
            pedidoId: {
              in: pedidosAntigos.map((p) => p.id),
            },
          },
        });

        // Deletar pedidos antigos
        const deletedAntigos = await prisma.pedido.deleteMany({
          where: {
            criadoEm: { lt: dataLimite },
            status: 'fechado',
          },
        });

        resultado = {
          message: 'Dados com mais de 90 dias removidos com sucesso',
          deletados: deletedAntigos.count,
        };
        break;

      case 'todos':
        // Limpar TODOS os dados (exceto usuários)
        // Ordem importante devido a foreign keys
        
        // 1. Deletar todos os itens de pedidos
        await prisma.pedidoItem.deleteMany({});
        
        // 2. Deletar todos os pedidos
        const deletedTodosPedidos = await prisma.pedido.deleteMany({});
        
        // 3. Resetar status das mesas
        await prisma.mesa.updateMany({
          data: { status: 'livre' },
        });

        resultado = {
          message: 'Todos os dados removidos com sucesso (usuários preservados)',
          deletados: deletedTodosPedidos.count,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de limpeza inválido' },
          { status: 400 }
        );
    }

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar dados' },
      { status: 500 }
    );
  }
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const pedido = await prisma.pedido.findUnique({
      where: { id: parseInt(id) },
      include: {
        mesa: true,
        garcom: {
          select: { id: true, nome: true },
        },
        // fechadoPor: {
        //   select: { id: true, nome: true },
        // },
        itens: {
          include: {
            prato: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error fetching pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Se estiver finalizando o pedido
    if (body.status === 'fechado' && body.formaPagamento) {
      const pedido = await prisma.pedido.update({
        where: { id: parseInt(id) },
        data: {
          status: 'fechado',
          formaPagamento: body.formaPagamento,
          // fechadoPorId: payload.userId,
          finalizadoEm: new Date(),
        },
        include: { 
          mesa: true,
          garcom: { select: { id: true, nome: true } },
          // fechadoPor: { select: { id: true, nome: true } },
        },
      });

      // Liberar mesa
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: 'livre' },
      });

      return NextResponse.json(pedido);
    }

    const pedido = await prisma.pedido.update({
      where: { id: parseInt(id) },
      data: body,
      include: {
        mesa: true,
        garcom: {
          select: { nome: true },
        },
        itens: {
          include: {
            prato: true,
          },
        },
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error updating pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}

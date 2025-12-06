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

async function recalcularTotal(pedidoId: number) {
  const itens = await prisma.pedidoItem.findMany({
    where: { pedidoId },
  });

  const total = itens.reduce((acc: number, item: any) => {
    return acc + parseFloat(item.subtotal.toString());
  }, 0);

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { total },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, itemId } = await params;

    await prisma.pedidoItem.delete({
      where: { id: parseInt(itemId) },
    });

    await recalcularTotal(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Erro ao remover item' },
      { status: 500 }
    );
  }
}

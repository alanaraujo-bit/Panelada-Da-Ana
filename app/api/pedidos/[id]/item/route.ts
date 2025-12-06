import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const itemSchema = z.object({
  pratoId: z.number().int().positive(),
  quantidade: z.number().int().positive(),
  observacao: z.string().optional(),
});

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

export async function POST(
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
    const validation = itemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { pratoId, quantidade, observacao } = validation.data;

    const prato = await prisma.prato.findUnique({
      where: { id: pratoId },
    });

    if (!prato) {
      return NextResponse.json(
        { error: 'Prato não encontrado' },
        { status: 404 }
      );
    }

    const subtotal = parseFloat(prato.preco.toString()) * quantidade;

    const item = await prisma.pedidoItem.create({
      data: {
        pedidoId: parseInt(id),
        pratoId,
        quantidade,
        observacao,
        subtotal,
      },
      include: {
        prato: true,
      },
    });

    await recalcularTotal(parseInt(id));

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar item' },
      { status: 500 }
    );
  }
}

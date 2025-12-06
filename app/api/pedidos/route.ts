import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const pedidoSchema = z.object({
  mesaId: z.number().int().positive(),
});

const itemSchema = z.object({
  pratoId: z.number().int().positive(),
  quantidade: z.number().int().positive(),
  observacao: z.string().optional(),
});

const finalizarSchema = z.object({
  formaPagamento: z.enum(['dinheiro', 'pix', 'debito', 'credito']),
});

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
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const pedidos = await prisma.pedido.findMany({
      where: status ? { status } : undefined,
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
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = pedidoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Atualizar mesa para ocupada
    await prisma.mesa.update({
      where: { id: validation.data.mesaId },
      data: { status: 'ocupada' },
    });

    const pedido = await prisma.pedido.create({
      data: {
        mesaId: validation.data.mesaId,
        garcomId: payload.userId,
        status: 'aberto',
        total: 0,
      },
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

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error('Error creating pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}

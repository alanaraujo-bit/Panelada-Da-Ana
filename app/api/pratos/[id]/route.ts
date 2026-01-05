import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const pratoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  categoriaId: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
  estoque: z.number().int().nonnegative().nullable().optional(),
  estoqueMinimo: z.number().int().nonnegative().nullable().optional(),
});

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = pratoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const prato = await prisma.prato.update({
      where: { id: parseInt(id) },
      data: validation.data,
    });

    return NextResponse.json(prato);
  } catch (error) {
    console.error('Error updating prato:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar prato' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.prato.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prato:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir prato' },
      { status: 500 }
    );
  }
}

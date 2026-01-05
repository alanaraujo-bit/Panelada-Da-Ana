import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nome, ordem, ativo } = body;

    const categoria = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome }),
        ...(ordem !== undefined && { ordem }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar se há pratos usando esta categoria
    const pratosCount = await prisma.prato.count({
      where: { categoriaId: parseInt(id) }
    });

    if (pratosCount > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir esta categoria pois existem ${pratosCount} pratos associados` },
        { status: 400 }
      );
    }

    await prisma.categoria.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar categoria' },
      { status: 500 }
    );
  }
}

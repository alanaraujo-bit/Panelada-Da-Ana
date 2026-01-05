import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    console.log('[API Categorias] Iniciando busca de categorias...');
    const categorias = await prisma.categoria.findMany({
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' }
      ],
      include: {
        _count: {
          select: { pratos: true }
        }
      }
    });

    console.log('[API Categorias] Categorias encontradas:', categorias.length);
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('[API Categorias] Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, ordem, ativo } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe categoria com esse nome
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { nome }
    });

    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome,
        ordem: ordem ?? 0,
        ativo: ativo ?? true,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
}

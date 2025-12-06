import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const pratoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  preco: z.number().positive('Preço deve ser positivo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  ativo: z.boolean().optional(),
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
    const apenasAtivos = searchParams.get('ativos') === 'true';

    const pratos = await prisma.prato.findMany({
      where: apenasAtivos ? { ativo: true } : undefined,
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });

    return NextResponse.json(pratos);
  } catch (error) {
    console.error('Error fetching pratos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pratos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = pratoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const prato = await prisma.prato.create({
      data: validation.data,
    });

    return NextResponse.json(prato, { status: 201 });
  } catch (error) {
    console.error('Error creating prato:', error);
    return NextResponse.json(
      { error: 'Erro ao criar prato' },
      { status: 500 }
    );
  }
}

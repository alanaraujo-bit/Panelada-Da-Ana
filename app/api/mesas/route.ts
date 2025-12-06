import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const mesaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  status: z.enum(['livre', 'ocupada']).optional(),
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

    const mesas = await prisma.mesa.findMany({
      orderBy: { nome: 'asc' },
      include: {
        pedidos: {
          where: { status: 'aberto' },
          include: {
            garcom: {
              select: { nome: true },
            },
          },
        },
      },
    });

    return NextResponse.json(mesas);
  } catch (error) {
    console.error('Error fetching mesas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mesas' },
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
    const validation = mesaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const mesa = await prisma.mesa.create({
      data: validation.data,
    });

    return NextResponse.json(mesa, { status: 201 });
  } catch (error) {
    console.error('Error creating mesa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar mesa' },
      { status: 500 }
    );
  }
}

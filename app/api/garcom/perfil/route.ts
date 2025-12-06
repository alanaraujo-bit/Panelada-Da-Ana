import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        telefone: true, 
        foto: true,
        role: true 
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Perfil error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, foto, telefone } = body;

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (foto !== undefined) updateData.foto = foto;
    if (telefone !== undefined) updateData.telefone = telefone;

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        telefone: true, 
        foto: true,
        role: true 
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update perfil error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Data de hoje (início e fim)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Início do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // ===== TEMPO REAL =====
    const pedidosAbertos = await prisma.pedido.count({
      where: { status: 'aberto' }
    });

    const mesas = await prisma.mesa.findMany();
    const mesasOcupadas = mesas.filter((m: any) => m.status === 'ocupada').length;
    const mesasLivres = mesas.filter((m: any) => m.status === 'livre').length;

    // ===== VENDAS HOJE =====
    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        criadoEm: {
          gte: hoje,
          lt: amanha
        }
      },
      include: {
        itens: true
      }
    });

    const vendasHoje = pedidosHoje.reduce((sum: number, p: any) => {
      const total = p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      return sum + total;
    }, 0);

    const ticketMedioHoje = pedidosHoje.length > 0 ? vendasHoje / pedidosHoje.length : 0;
    const pratosVendidosHoje = pedidosHoje.reduce((sum: number, p: any) => 
      sum + p.itens.reduce((s: number, i: any) => s + i.quantidade, 0)
    , 0);

    // ===== VENDAS MÊS =====
    const pedidosMes = await prisma.pedido.findMany({
      where: {
        criadoEm: {
          gte: inicioMes
        }
      },
      include: {
        itens: true
      }
    });

    const vendasMes = pedidosMes.reduce((sum: number, p: any) => {
      const total = p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      return sum + total;
    }, 0);

    const ticketMedioMes = pedidosMes.length > 0 ? vendasMes / pedidosMes.length : 0;

    // ===== PRATO MAIS VENDIDO HOJE =====
    const pratoContagem: { [key: string]: { nome: string; quantidade: number } } = {};
    
    for (const pedido of pedidosHoje) {
      for (const item of pedido.itens) {
        const prato = await prisma.prato.findUnique({
          where: { id: item.pratoId }
        });
        
        if (prato) {
          if (!pratoContagem[prato.id]) {
            pratoContagem[prato.id] = { nome: prato.nome, quantidade: 0 };
          }
          pratoContagem[prato.id].quantidade += item.quantidade;
        }
      }
    }

    const pratoMaisVendidoHoje = Object.values(pratoContagem)
      .sort((a, b) => b.quantidade - a.quantidade)[0] || null;

    // ===== GARÇOM MAIS VENDAS HOJE =====
    const garcomVendas: { [key: number]: { nome: string; total: number } } = {};

    for (const pedido of pedidosHoje) {
      const garcom = await prisma.user.findUnique({
        where: { id: pedido.garcomId }
      });

      if (garcom) {
        const total = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        
        if (!garcomVendas[garcom.id]) {
          garcomVendas[garcom.id] = { nome: garcom.nome, total: 0 };
        }
        garcomVendas[garcom.id].total += total;
      }
    }

    const garcomMaisVendas = Object.values(garcomVendas)
      .sort((a, b) => b.total - a.total)[0] || null;

    const totalGarcons = await prisma.user.count({
      where: { role: 'garcom' }
    });

    // ===== ÚLTIMOS PEDIDOS =====
    const ultimosPedidosData = await prisma.pedido.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 10,
      include: {
        mesa: true,
        garcom: true,
        itens: true
      }
    });

    const ultimosPedidos = ultimosPedidosData.map((p: any) => ({
      id: p.id,
      mesa: p.mesa.nome,
      garcom: p.garcom.nome,
      total: p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0),
      status: p.status,
      criadoEm: p.criadoEm
    }));

    // ===== VENDAS POR DIA (Últimos 7 dias) =====
    const vendasPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(dia.getDate() - i);
      dia.setHours(0, 0, 0, 0);
      
      const proximoDia = new Date(dia);
      proximoDia.setDate(proximoDia.getDate() + 1);

      const pedidosDia = await prisma.pedido.findMany({
        where: {
          criadoEm: {
            gte: dia,
            lt: proximoDia
          }
        },
        include: {
          itens: true
        }
      });

      const totalDia = pedidosDia.reduce((sum, p) => {
        const total = p.itens.reduce((s, i) => s + Number(i.subtotal), 0);
        return sum + total;
      }, 0);

      vendasPorDia.push({
        data: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total: totalDia,
        pedidos: pedidosDia.length
      });
    }

    return NextResponse.json({
      // Tempo Real
      pedidosAbertos,
      mesasOcupadas,
      mesasLivres,
      
      // Vendas Hoje
      vendasHoje,
      pedidosHoje: pedidosHoje.length,
      ticketMedioHoje,
      pratosVendidosHoje,
      
      // Vendas Mês
      vendasMes,
      pedidosMes: pedidosMes.length,
      ticketMedioMes,
      
      // Destaques
      pratoMaisVendidoHoje,
      garcomMaisVendas,
      totalGarcons,
      
      // Histórico
      ultimosPedidos,
      vendasPorDia
    });

  } catch (error) {
    console.error('Erro no dashboard admin:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}

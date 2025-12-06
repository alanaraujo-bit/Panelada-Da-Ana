import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo') || 'completo';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Construir filtro de data
    const filtroData: any = {};
    if (dataInicio) {
      filtroData.gte = new Date(dataInicio);
    }
    if (dataFim) {
      const dataFimDate = new Date(dataFim);
      dataFimDate.setHours(23, 59, 59, 999);
      filtroData.lte = dataFimDate;
    }

    // Buscar dados
    const pedidos = await prisma.pedido.findMany({
      where: Object.keys(filtroData).length > 0 ? { criadoEm: filtroData } : {},
      include: {
        mesa: true,
        garcom: true,
        itens: {
          include: {
            prato: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    let csv = '';

    if (tipo === 'completo' || tipo === 'vendas') {
      // CSV de Vendas
      csv = 'ID Pedido,Mesa,Garçom,Status,Total (R$),Forma Pagamento,Data Abertura,Data Fechamento\n';
      
      pedidos.forEach((pedido: any) => {
        const total = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        csv += `${pedido.id},`;
        csv += `"${pedido.mesa.nome}",`;
        csv += `"${pedido.garcom.nome}",`;
        csv += `${pedido.status},`;
        csv += `${total.toFixed(2)},`;
        csv += `"${pedido.formaPagamento || 'N/A'}",`;
        csv += `"${new Date(pedido.criadoEm).toLocaleString('pt-BR')}",`;
        csv += `"${pedido.finalizadoEm ? new Date(pedido.finalizadoEm).toLocaleString('pt-BR') : 'N/A'}"\n`;
      });
    }

    if (tipo === 'produtos') {
      // CSV de Produtos
      csv = 'Produto,Quantidade Vendida,Total (R$),Preço Médio (R$)\n';
      
      const produtosMap: { [key: string]: { nome: string; quantidade: number; total: number } } = {};
      
      pedidos.forEach((pedido: any) => {
        pedido.itens.forEach((item: any) => {
          const key = item.prato.id;
          if (!produtosMap[key]) {
            produtosMap[key] = { nome: item.prato.nome, quantidade: 0, total: 0 };
          }
          produtosMap[key].quantidade += item.quantidade;
          produtosMap[key].total += Number(item.subtotal);
        });
      });

      const produtosOrdenados = Object.values(produtosMap).sort((a, b) => b.quantidade - a.quantidade);

      produtosOrdenados.forEach((produto) => {
        const precoMedio = produto.quantidade > 0 ? produto.total / produto.quantidade : 0;
        csv += `"${produto.nome}",`;
        csv += `${produto.quantidade},`;
        csv += `${produto.total.toFixed(2)},`;
        csv += `${precoMedio.toFixed(2)}\n`;
      });
    }

    if (tipo === 'garcons') {
      // CSV de Garçons
      csv = 'Garçom,Quantidade Pedidos,Total Vendas (R$),Ticket Médio (R$)\n';
      
      const garconsMap: { [key: number]: { nome: string; pedidos: number; total: number } } = {};
      
      pedidos.forEach((pedido: any) => {
        const key = pedido.garcom.id;
        const totalPedido = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        
        if (!garconsMap[key]) {
          garconsMap[key] = { nome: pedido.garcom.nome, pedidos: 0, total: 0 };
        }
        garconsMap[key].pedidos += 1;
        garconsMap[key].total += totalPedido;
      });

      const garconsOrdenados = Object.values(garconsMap).sort((a, b) => b.total - a.total);

      garconsOrdenados.forEach((garcom) => {
        const media = garcom.pedidos > 0 ? garcom.total / garcom.pedidos : 0;
        csv += `"${garcom.nome}",`;
        csv += `${garcom.pedidos},`;
        csv += `${garcom.total.toFixed(2)},`;
        csv += `${media.toFixed(2)}\n`;
      });
    }

    if (tipo === 'mesas') {
      // CSV de Mesas
      csv = 'Mesa,Quantidade Pedidos,Total (R$),Status Atual\n';
      
      const mesasMap: { [key: number]: { nome: string; status: string; pedidos: number; total: number } } = {};
      
      pedidos.forEach((pedido: any) => {
        const key = pedido.mesa.id;
        const totalPedido = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        
        if (!mesasMap[key]) {
          mesasMap[key] = { nome: pedido.mesa.nome, status: pedido.mesa.status, pedidos: 0, total: 0 };
        }
        mesasMap[key].pedidos += 1;
        mesasMap[key].total += totalPedido;
      });

      const mesasOrdenadas = Object.values(mesasMap).sort((a, b) => b.total - a.total);

      mesasOrdenadas.forEach((mesa) => {
        csv += `"${mesa.nome}",`;
        csv += `${mesa.pedidos},`;
        csv += `${mesa.total.toFixed(2)},`;
        csv += `${mesa.status}\n`;
      });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar CSV:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório CSV' },
      { status: 500 }
    );
  }
}

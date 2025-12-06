import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import PDFDocument from 'pdfkit';

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
    const detalhes = searchParams.get('detalhes') === 'true';

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

    // Buscar dados baseado no tipo
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

    // Criar PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Cabeçalho
    doc.fontSize(24).font('Helvetica-Bold').text('Panelada da Ana', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Relatório Gerencial', { align: 'center' });
    doc.moveDown();

    // Informações do relatório
    doc.fontSize(10).font('Helvetica-Bold').text('Tipo de Relatório: ', { continued: true });
    doc.font('Helvetica').text(
      tipo === 'completo' ? 'Completo' :
      tipo === 'vendas' ? 'Vendas' :
      tipo === 'produtos' ? 'Produtos Mais Vendidos' :
      tipo === 'garcons' ? 'Performance dos Garçons' :
      tipo === 'mesas' ? 'Uso de Mesas' : tipo
    );

    doc.font('Helvetica-Bold').text('Período: ', { continued: true });
    doc.font('Helvetica').text(
      dataInicio && dataFim
        ? `${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`
        : 'Todo o período'
    );

    doc.font('Helvetica-Bold').text('Data de Geração: ', { continued: true });
    doc.font('Helvetica').text(new Date().toLocaleString('pt-BR'));
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Estatísticas Gerais
    const totalVendas = pedidos.reduce((sum: number, p: any) => {
      const total = p.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      return sum + total;
    }, 0);

    const pedidosFechados = pedidos.filter((p: any) => p.status === 'fechado');
    const ticketMedio = pedidosFechados.length > 0 ? totalVendas / pedidosFechados.length : 0;

    doc.fontSize(14).font('Helvetica-Bold').text('Resumo Geral');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de Pedidos: ${pedidos.length}`);
    doc.text(`Pedidos Fechados: ${pedidosFechados.length}`);
    doc.text(`Pedidos Abertos: ${pedidos.filter((p: any) => p.status === 'aberto').length}`);
    doc.text(`Total em Vendas: R$ ${totalVendas.toFixed(2).replace('.', ',')}`);
    doc.text(`Ticket Médio: R$ ${ticketMedio.toFixed(2).replace('.', ',')}`);
    doc.moveDown();

    if (tipo === 'completo' || tipo === 'vendas') {
      // Lista de Pedidos
      doc.fontSize(14).font('Helvetica-Bold').text('Detalhamento de Pedidos');
      doc.moveDown(0.5);

      for (const pedido of pedidos.slice(0, 50)) { // Limitar a 50 para não ficar muito grande
        const totalPedido = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        
        doc.fontSize(10).font('Helvetica-Bold').text(
          `Pedido #${pedido.id} - ${pedido.mesa.nome} - ${pedido.status.toUpperCase()}`,
          { continued: true }
        );
        doc.font('Helvetica').text(` - R$ ${totalPedido.toFixed(2).replace('.', ',')}`);
        doc.fontSize(9).text(`Garçom: ${pedido.garcom.nome}`);
        doc.text(`Data: ${new Date(pedido.criadoEm).toLocaleString('pt-BR')}`);

        if (detalhes && pedido.itens.length > 0) {
          doc.fontSize(8).text('Itens:');
          pedido.itens.forEach((item: any) => {
            doc.text(`  • ${item.quantidade}x ${item.prato.nome} - R$ ${Number(item.subtotal).toFixed(2).replace('.', ',')}`);
          });
        }

        doc.moveDown(0.5);

        // Nova página se necessário
        if (doc.y > 700) {
          doc.addPage();
        }
      }
    }

    if (tipo === 'completo' || tipo === 'produtos') {
      // Produtos mais vendidos
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Produtos Mais Vendidos');
      doc.moveDown(0.5);

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

      doc.fontSize(10).font('Helvetica');
      produtosOrdenados.slice(0, 20).forEach((produto, index) => {
        doc.text(
          `${index + 1}. ${produto.nome} - ${produto.quantidade} unidades - R$ ${produto.total.toFixed(2).replace('.', ',')}`
        );
      });
    }

    if (tipo === 'completo' || tipo === 'garcons') {
      // Performance dos garçons
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Performance dos Garçons');
      doc.moveDown(0.5);

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

      doc.fontSize(10).font('Helvetica');
      garconsOrdenados.forEach((garcom, index) => {
        const media = garcom.pedidos > 0 ? garcom.total / garcom.pedidos : 0;
        doc.text(
          `${index + 1}. ${garcom.nome} - ${garcom.pedidos} pedidos - R$ ${garcom.total.toFixed(2).replace('.', ',')} (média: R$ ${media.toFixed(2).replace('.', ',')})`
        );
      });
    }

    // Rodapé
    doc.fontSize(8).text(
      `Relatório gerado em ${new Date().toLocaleString('pt-BR')} - Panelada da Ana © ${new Date().getFullYear()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório PDF' },
      { status: 500 }
    );
  }
}

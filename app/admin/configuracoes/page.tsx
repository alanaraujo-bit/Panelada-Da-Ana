'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  FileText, 
  Download, 
  AlertTriangle,
  Calendar,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ConfiguracoesPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Filtros para relatórios
  const [relatorioTipo, setRelatorioTipo] = useState('completo');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [incluirDetalhes, setIncluirDetalhes] = useState(true);

  // Limpeza de dados
  const [confirmacao, setConfirmacao] = useState('');
  const [tipoLimpeza, setTipoLimpeza] = useState('');

  const handleGerarRelatorio = async () => {
    setLoading(true);
    try {
      // Buscar dados da API
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      params.append('tipo', relatorioTipo);

      const response = await fetch(`/api/relatorios/dados?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const dados = await response.json();
      
      console.log('Dados recebidos:', dados);      
      console.log('Dados recebidos:', dados);

      // Gerar PDF bonito e simples
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // ===== CABEÇALHO =====
      // Fundo laranja do topo
      doc.setFillColor(164, 79, 28);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Título em branco
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('🍲 PANELADA DA ANA', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório Gerencial', pageWidth / 2, 30, { align: 'center' });

      yPos = 50;

      // ===== INFORMAÇÕES DO RELATÓRIO =====
      doc.setFillColor(243, 228, 206);
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
      
      doc.setTextColor(106, 58, 26);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      yPos += 10;
      const tipoTexto = relatorioTipo === 'completo' ? 'Relatório Completo' :
        relatorioTipo === 'vendas' ? 'Relatório de Vendas' :
        relatorioTipo === 'produtos' ? 'Produtos Mais Vendidos' :
        relatorioTipo === 'garcons' ? 'Performance dos Garçons' : 'Uso de Mesas';
      
      doc.text('TIPO: ', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(tipoTexto, 35, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('PERÍODO: ', 20, yPos);
      doc.setFont('helvetica', 'normal');
      const periodoTexto = dataInicio && dataFim
        ? `${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`
        : 'Todo o período';
      doc.text(periodoTexto, 35, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('GERADO: ', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString('pt-BR'), 35, yPos);

      yPos += 15;

      // ===== RESUMO EXECUTIVO =====
      doc.setFillColor(164, 79, 28);
      doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 RESUMO GERAL', 20, yPos + 5);

      yPos += 15;

      // Box de estatísticas
      doc.setDrawColor(164, 79, 28);
      doc.setLineWidth(0.5);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 2, 2, 'FD');

      doc.setTextColor(106, 58, 26);
      doc.setFontSize(9);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Total de Pedidos:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text((dados.totalPedidos || 0).toString(), 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('Pedidos Fechados:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text((dados.pedidosFechados || 0).toString(), 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('Pedidos Abertos:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text((dados.pedidosAbertos || 0).toString(), 70, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('💰 TOTAL EM VENDAS:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94);
      doc.text(`R$ ${(dados.totalVendas || 0).toFixed(2).replace('.', ',')}`, 70, yPos);

      yPos += 8;
      doc.setTextColor(106, 58, 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Ticket Médio:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${(dados.ticketMedio || 0).toFixed(2).replace('.', ',')}`, 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('Total de Itens:', 20, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text((dados.totalItens || 0).toString(), 70, yPos);

      yPos += 15;

      // ===== TABELAS DE DADOS =====
      if ((relatorioTipo === 'completo' || relatorioTipo === 'vendas') && dados.pedidos && dados.pedidos.length > 0) {
        // Cabeçalho da seção
        doc.setFillColor(164, 79, 28);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('📋 DETALHAMENTO DE PEDIDOS', 20, yPos + 5);

        yPos += 15;

        // Cabeçalho da tabela
        doc.setFillColor(106, 58, 26);
        doc.rect(15, yPos, pageWidth - 30, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('ID', 20, yPos + 5);
        doc.text('MESA', 35, yPos + 5);
        doc.text('GARÇOM', 70, yPos + 5);
        doc.text('STATUS', 120, yPos + 5);
        doc.text('TOTAL', 150, yPos + 5);
        doc.text('DATA', 175, yPos + 5);

        yPos += 7;

        // Linhas da tabela
        dados.pedidos.slice(0, 20).forEach((pedido: any, index: number) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          // Fundo alternado
          if (index % 2 === 0) {
            doc.setFillColor(250, 245, 235);
            doc.rect(15, yPos, pageWidth - 30, 6, 'F');
          }

          doc.setTextColor(50, 50, 50);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(`#${pedido.id}`, 20, yPos + 4);
          doc.text(pedido.mesa.substring(0, 15), 35, yPos + 4);
          doc.text(pedido.garcom.substring(0, 20), 70, yPos + 4);
          doc.text(pedido.status === 'aberto' ? 'ABERTO' : 'FECHADO', 120, yPos + 4);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text(`R$ ${pedido.total.toFixed(2).replace('.', ',')}`, 150, yPos + 4);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'normal');
          doc.text(new Date(pedido.data).toLocaleDateString('pt-BR'), 175, yPos + 4);

          yPos += 6;
        });

        yPos += 5;
      }

      if (relatorioTipo === 'produtos' && dados.produtos && dados.produtos.length > 0) {
        // Cabeçalho da seção
        doc.setFillColor(164, 79, 28);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('🏆 RANKING DE PRODUTOS', 20, yPos + 5);

        yPos += 15;

        // Cabeçalho da tabela
        doc.setFillColor(106, 58, 26);
        doc.rect(15, yPos, pageWidth - 30, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, yPos + 5);
        doc.text('PRODUTO', 30, yPos + 5);
        doc.text('QTD', 120, yPos + 5);
        doc.text('TOTAL', 145, yPos + 5);
        doc.text('PREÇO MÉDIO', 175, yPos + 5);

        yPos += 7;

        // Linhas da tabela
        dados.produtos.slice(0, 25).forEach((produto: any, index: number) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          // Fundo alternado
          if (index % 2 === 0) {
            doc.setFillColor(250, 245, 235);
            doc.rect(15, yPos, pageWidth - 30, 6, 'F');
          }

          doc.setTextColor(50, 50, 50);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}º`, 20, yPos + 4);
          doc.setFont('helvetica', 'normal');
          doc.text(produto.nome.substring(0, 35), 30, yPos + 4);
          doc.text(produto.quantidade.toString(), 120, yPos + 4);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text(`R$ ${produto.total.toFixed(2).replace('.', ',')}`, 145, yPos + 4);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'normal');
          doc.text(`R$ ${produto.precoMedio.toFixed(2).replace('.', ',')}`, 175, yPos + 4);

          yPos += 6;
        });

        yPos += 5;
      }

      if (relatorioTipo === 'garcons' && dados.garcons && dados.garcons.length > 0) {
        // Cabeçalho da seção
        doc.setFillColor(164, 79, 28);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('👨‍🍳 PERFORMANCE DOS GARÇONS', 20, yPos + 5);

        yPos += 15;

        // Cabeçalho da tabela
        doc.setFillColor(106, 58, 26);
        doc.rect(15, yPos, pageWidth - 30, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, yPos + 5);
        doc.text('GARÇOM', 30, yPos + 5);
        doc.text('PEDIDOS', 110, yPos + 5);
        doc.text('TOTAL VENDAS', 145, yPos + 5);
        doc.text('TICKET MÉDIO', 175, yPos + 5);

        yPos += 7;

        // Linhas da tabela
        dados.garcons.forEach((garcom: any, index: number) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          // Fundo alternado
          if (index % 2 === 0) {
            doc.setFillColor(250, 245, 235);
            doc.rect(15, yPos, pageWidth - 30, 6, 'F');
          }

          doc.setTextColor(50, 50, 50);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}º`, 20, yPos + 4);
          doc.setFont('helvetica', 'normal');
          doc.text(garcom.nome.substring(0, 30), 30, yPos + 4);
          doc.text(garcom.pedidos.toString(), 110, yPos + 4);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text(`R$ ${garcom.total.toFixed(2).replace('.', ',')}`, 145, yPos + 4);
          doc.setTextColor(50, 50, 50);
          doc.setFont('helvetica', 'normal');
          doc.text(`R$ ${garcom.ticketMedio.toFixed(2).replace('.', ',')}`, 175, yPos + 4);

          yPos += 6;
        });
      }

      // ===== RODAPÉ =====
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(106, 58, 26);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Panelada da Ana © ${new Date().getFullYear()} • Relatório Confidencial • Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }

      // Salvar PDF
      const nomeArquivo = `relatorio-${relatorioTipo}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      alert('✅ Relatório PDF gerado com sucesso!');

    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao gerar relatório: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarCSV = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      params.append('tipo', relatorioTipo);

      const response = await fetch(`/api/relatorios/csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${relatorioTipo}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Relatório CSV gerado com sucesso!');
      } else {
        alert('Erro ao gerar relatório CSV');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar relatório CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleLimparDados = async () => {
    if (confirmacao !== 'LIMPAR') {
      alert('Digite "LIMPAR" para confirmar a ação');
      return;
    }

    if (!tipoLimpeza) {
      alert('Selecione o tipo de limpeza');
      return;
    }

    const confirmFinal = confirm(
      `ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nDeseja realmente ${
        tipoLimpeza === 'pedidos' ? 'limpar todos os pedidos fechados' :
        tipoLimpeza === 'todos' ? 'LIMPAR TODOS OS DADOS DO SISTEMA' :
        'limpar dados antigos'
      }?`
    );

    if (!confirmFinal) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/limpar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo: tipoLimpeza }),
      });

      if (response.ok) {
        alert('Dados limpos com sucesso!');
        setConfirmacao('');
        setTipoLimpeza('');
      } else {
        alert('Erro ao limpar dados');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao limpar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-brown mb-1">Configurações</h1>
        <p className="text-gray-600">Gerencie relatórios e dados do sistema</p>
      </div>

      {/* Geração de Relatórios */}
      <Card className="shadow-lg border-l-4 border-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gerar Relatórios</h2>
              <p className="text-gray-600">Exporte relatórios detalhados em PDF ou CSV</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tipo de Relatório */}
            <div>
              <Label htmlFor="tipoRelatorio" className="text-base font-semibold">
                Tipo de Relatório
              </Label>
              <select
                id="tipoRelatorio"
                value={relatorioTipo}
                onChange={(e) => setRelatorioTipo(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg text-base"
              >
                <option value="completo">Relatório Completo (Todas as informações)</option>
                <option value="vendas">Relatório de Vendas</option>
                <option value="produtos">Produtos Mais Vendidos</option>
                <option value="garcons">Performance dos Garçons</option>
                <option value="mesas">Uso de Mesas</option>
              </select>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio" className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Início
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Fim
                </Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Opções Adicionais */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="incluirDetalhes"
                checked={incluirDetalhes}
                onChange={(e) => setIncluirDetalhes(e.target.checked)}
                className="w-5 h-5 text-blue-600"
              />
              <Label htmlFor="incluirDetalhes" className="text-base cursor-pointer">
                Incluir detalhes completos dos pedidos (itens, observações, etc.)
              </Label>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleGerarRelatorio}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
              >
                <Download className="h-5 w-5 mr-2" />
                {loading ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Button
                onClick={handleGerarCSV}
                disabled={loading}
                variant="outline"
                className="flex-1 border-green-500 text-green-600 hover:bg-green-50 py-6 text-base"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                {loading ? 'Gerando...' : 'Gerar CSV'}
              </Button>
            </div>

            <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              💡 <strong>Dica:</strong> Deixe as datas em branco para gerar relatório de todo o período.
              O CSV é ideal para análise em Excel ou Google Sheets.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Limpeza de Dados */}
      <Card className="shadow-lg border-l-4 border-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Limpeza de Dados</h2>
              <p className="text-gray-600">Remova dados antigos do sistema (ação irreversível)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900 mb-1">⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL</p>
                  <p className="text-sm text-red-700">
                    A limpeza de dados remove permanentemente informações do banco de dados.
                    Esta ação não pode ser desfeita. Recomendamos gerar um relatório antes de prosseguir.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="tipoLimpeza" className="text-base font-semibold">
                Tipo de Limpeza
              </Label>
              <select
                id="tipoLimpeza"
                value={tipoLimpeza}
                onChange={(e) => setTipoLimpeza(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg text-base"
              >
                <option value="">Selecione o tipo de limpeza</option>
                <option value="pedidos">Limpar apenas pedidos fechados</option>
                <option value="antigos">Limpar dados com mais de 90 dias</option>
                <option value="todos">⚠️ LIMPAR TODOS OS DADOS (exceto usuários)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="confirmacao" className="text-base font-semibold">
                Digite "LIMPAR" para confirmar
              </Label>
              <Input
                id="confirmacao"
                type="text"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value.toUpperCase())}
                placeholder="Digite LIMPAR em maiúsculas"
                className="mt-2 font-mono text-lg"
              />
            </div>

            <Button
              onClick={handleLimparDados}
              disabled={loading || confirmacao !== 'LIMPAR' || !tipoLimpeza}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-base"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {loading ? 'Limpando...' : 'Confirmar Limpeza'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="shadow-lg border-l-4 border-gray-400">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Sistema</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Os relatórios em PDF são formatados profissionalmente com logotipo e informações detalhadas</p>
            <p>• Os relatórios em CSV podem ser importados em Excel, Google Sheets ou Power BI</p>
            <p>• A limpeza de dados não afeta usuários cadastrados nem configurações do sistema</p>
            <p>• Recomendamos fazer backup dos dados (exportar relatórios) antes de limpezas</p>
            <p>• Dados de pedidos abertos nunca são removidos nas limpezas automáticas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      params.append('tipo', relatorioTipo);
      params.append('detalhes', incluirDetalhes.toString());

      const response = await fetch(`/api/relatorios/pdf?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${relatorioTipo}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Relatório gerado com sucesso!');
      } else {
        alert('Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar relatório');
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

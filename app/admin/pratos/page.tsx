'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Prato {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  ativo: boolean;
}

export default function PratosAdminPage() {
  const { token } = useAuthStore();
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrato, setEditingPrato] = useState<Prato | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    ativo: true,
  });
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  useEffect(() => {
    fetchPratos();
  }, []);

  const fetchPratos = async () => {
    try {
      const response = await fetch('/api/pratos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPratos(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPrato ? `/api/pratos/${editingPrato.id}` : '/api/pratos';
      const method = editingPrato ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          preco: parseFloat(formData.preco),
        }),
      });

      setShowForm(false);
      setEditingPrato(null);
      setFormData({ nome: '', descricao: '', preco: '', categoria: '', ativo: true });
      fetchPratos();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (prato: Prato) => {
    setEditingPrato(prato);
    setFormData({
      nome: prato.nome,
      descricao: prato.descricao || '',
      preco: prato.preco.toString(),
      categoria: prato.categoria,
      ativo: prato.ativo,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este prato?')) return;

    try {
      await fetch(`/api/pratos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPratos();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const toggleAtivo = async (prato: Prato) => {
    try {
      await fetch(`/api/pratos/${prato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...prato,
          ativo: !prato.ativo,
        }),
      });
      fetchPratos();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPrato(null);
    setFormData({ nome: '', descricao: '', preco: '', categoria: '', ativo: true });
  };

  const categorias = ['Todas', ...Array.from(new Set(pratos.map((p) => p.categoria)))];
  const pratosFiltrados = filtroCategoria === 'Todas'
    ? pratos
    : pratos.filter((p) => p.categoria === filtroCategoria);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-brown mb-1">Gerenciar Pratos</h1>
          <p className="text-gray-600">Adicione, edite ou remova pratos do cardápio</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-orange hover:bg-primary-brown text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prato
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="shadow-lg border-2 border-primary-orange">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary-brown mb-4">
              {editingPrato ? 'Editar Prato' : 'Novo Prato'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Prato *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Feijoada"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Prato Principal, Bebida, Sobremesa"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do prato"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ativo">Status</Label>
                  <select
                    id="ativo"
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  {editingPrato ? 'Salvar Alterações' : 'Criar Prato'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtroCategoria === cat
                ? 'bg-primary-orange text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Pratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pratosFiltrados.map((prato) => (
          <Card
            key={prato.id}
            className={`shadow-lg hover:shadow-xl transition-all border-l-4 ${
              prato.ativo ? 'border-green-500' : 'border-gray-400 opacity-60'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UtensilsCrossed className={`h-5 w-5 ${
                      prato.ativo ? 'text-primary-orange' : 'text-gray-400'
                    }`} />
                    <h3 className="text-lg font-bold text-gray-900">{prato.nome}</h3>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {prato.categoria}
                  </span>
                </div>
                <button
                  onClick={() => toggleAtivo(prato)}
                  className={`p-2 rounded-lg transition-colors ${
                    prato.ativo
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={prato.ativo ? 'Desativar' : 'Ativar'}
                >
                  {prato.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>

              {prato.descricao && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{prato.descricao}</p>
              )}

              <div className="text-2xl font-bold text-green-600 mb-4">
                {formatCurrency(Number(prato.preco))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(prato)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(prato.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pratosFiltrados.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {filtroCategoria === 'Todas'
                ? 'Nenhum prato cadastrado'
                : `Nenhum prato na categoria "${filtroCategoria}"`}
            </h3>
            <p className="text-gray-500 mb-4">
              {filtroCategoria === 'Todas'
                ? 'Clique em "Novo Prato" para adicionar o primeiro prato'
                : 'Tente selecionar outra categoria'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

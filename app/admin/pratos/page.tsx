'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Prato {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  ativo: boolean;
}

export default function PratosAdminPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPratos();
  }, [token]);

  const fetchPratos = async () => {
    try {
      const response = await fetch('/api/pratos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPratos(data);
    } catch (error) {
      console.error('Erro:', error);
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

  const categorias = Array.from(new Set(pratos.map((p) => p.categoria)));

  return (
    <div className="min-h-screen bg-primary-cream">
      <div className="bg-primary-orange text-white p-4 shadow-lg">
        <div className="flex items-center max-w-7xl mx-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" className="mr-3 text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Gerenciar Pratos</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Prato
          </Button>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPrato ? 'Editar Prato' : 'Novo Prato'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Pratos Principais"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingPrato(null);
                    setFormData({ nome: '', descricao: '', preco: '', categoria: '', ativo: true });
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {categorias.map((categoria) => (
          <div key={categoria}>
            <h3 className="font-bold text-primary-brown mb-3 text-lg">{categoria}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {pratos
                .filter((p) => p.categoria === categoria)
                .map((prato) => (
                  <Card key={prato.id} className={!prato.ativo ? 'opacity-50' : ''}>
                    <CardHeader>
                      <CardTitle className="text-base">{prato.nome}</CardTitle>
                      {prato.descricao && (
                        <p className="text-sm text-muted-foreground">{prato.descricao}</p>
                      )}
                      <p className="text-lg font-bold text-primary-orange">
                        {formatCurrency(Number(prato.preco))}
                      </p>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(prato)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(prato.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

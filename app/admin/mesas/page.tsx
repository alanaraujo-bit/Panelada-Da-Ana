'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Table as TableIcon } from 'lucide-react';

interface Mesa {
  id: number;
  nome: string;
  status: string;
}

export default function MesasAdminPage() {
  const { token } = useAuthStore();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMesas();
  }, []);

  const fetchMesas = async () => {
    try {
      const response = await fetch('/api/mesas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMesas(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMesa ? `/api/mesas/${editingMesa.id}` : '/api/mesas';
      const method = editingMesa ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome }),
      });

      setShowForm(false);
      setEditingMesa(null);
      setNome('');
      fetchMesas();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setNome(mesa.nome);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta mesa?')) return;

    try {
      await fetch(`/api/mesas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMesas();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMesa(null);
    setNome('');
  };

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
          <h1 className="text-3xl font-bold text-primary-brown mb-1">Gerenciar Mesas</h1>
          <p className="text-gray-600">Adicione, edite ou remova mesas do sistema</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-orange hover:bg-primary-brown text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="shadow-lg border-2 border-primary-orange">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary-brown mb-4">
              {editingMesa ? 'Editar Mesa' : 'Nova Mesa'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Mesa</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mesa 1, Mesa VIP, etc."
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  {editingMesa ? 'Salvar' : 'Criar Mesa'}
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

      {/* Lista de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mesas.map((mesa) => (
          <Card
            key={mesa.id}
            className="shadow-lg hover:shadow-xl transition-shadow border-l-4"
            style={{
              borderLeftColor: mesa.status === 'livre' ? '#10b981' : '#f59e0b'
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    mesa.status === 'livre' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    <TableIcon className={`h-6 w-6 ${
                      mesa.status === 'livre' ? 'text-green-600' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{mesa.nome}</h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      mesa.status === 'livre'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {mesa.status === 'livre' ? 'Livre' : 'Ocupada'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleEdit(mesa)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(mesa.id)}
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

      {mesas.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <TableIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma mesa cadastrada</h3>
            <p className="text-gray-500 mb-4">Clique em "Nova Mesa" para adicionar a primeira mesa</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

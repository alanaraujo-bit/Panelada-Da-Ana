'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Mesa {
  id: number;
  nome: string;
  status: string;
}

export default function MesasAdminPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMesas();
  }, [token]);

  const fetchMesas = async () => {
    try {
      const response = await fetch('/api/mesas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMesas(data);
    } catch (error) {
      console.error('Erro:', error);
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

  return (
    <div className="min-h-screen bg-primary-cream">
      <div className="bg-primary-orange text-white p-4 shadow-lg">
        <div className="flex items-center max-w-7xl mx-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" className="mr-3 text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Gerenciar Mesas</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingMesa ? 'Editar Mesa' : 'Nova Mesa'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome da Mesa</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Mesa 1"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingMesa(null);
                    setNome('');
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mesas.map((mesa) => (
            <Card key={mesa.id}>
              <CardHeader>
                <CardTitle>{mesa.nome}</CardTitle>
                <p className={`text-sm ${mesa.status === 'livre' ? 'text-green-600' : 'text-orange-600'}`}>
                  {mesa.status.toUpperCase()}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(mesa)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(mesa.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

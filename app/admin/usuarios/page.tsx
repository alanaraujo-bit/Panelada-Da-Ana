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

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export default function UsuariosAdminPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'garcom',
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUsuarios();
  }, [token]);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUsuario ? `/api/usuarios/${editingUsuario.id}` : '/api/usuarios';
      const method = editingUsuario ? 'PUT' : 'POST';

      const body: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
      };

      if (formData.senha || !editingUsuario) {
        body.senha = formData.senha;
      }

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      setShowForm(false);
      setEditingUsuario(null);
      setFormData({ nome: '', email: '', senha: '', role: 'garcom' });
      fetchUsuarios();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      role: usuario.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;

    try {
      await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsuarios();
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
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
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
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Senha {editingUsuario && '(deixe em branco para não alterar)'}</Label>
                  <Input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required={!editingUsuario}
                  />
                </div>
                <div>
                  <Label>Perfil</Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2"
                  >
                    <option value="garcom">Garçom</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingUsuario(null);
                    setFormData({ nome: '', email: '', senha: '', role: 'garcom' });
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id}>
              <CardHeader>
                <CardTitle className="text-base">{usuario.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                <p className={`text-sm font-semibold ${usuario.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                  {usuario.role === 'admin' ? 'ADMINISTRADOR' : 'GARÇOM'}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(usuario)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(usuario.id)}>
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

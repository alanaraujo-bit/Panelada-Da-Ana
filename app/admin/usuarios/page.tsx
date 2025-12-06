'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Users, Shield, UserCircle } from 'lucide-react';

interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  telefone?: string;
  criadoEm: string;
}

export default function UsuariosAdminPage() {
  const { token } = useAuthStore();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'garcom',
    telefone: '',
  });
  const [loading, setLoading] = useState(true);
  const [filtroRole, setFiltroRole] = useState('Todos');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios';
      const method = editingUser ? 'PUT' : 'POST';

      const body: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        telefone: formData.telefone,
      };

      // Só envia senha se for criação ou se foi preenchida na edição
      if (!editingUser || formData.senha) {
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
      setEditingUser(null);
      setFormData({ nome: '', email: '', senha: '', role: 'garcom', telefone: '' });
      fetchUsuarios();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      role: user.role,
      telefone: user.telefone || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ nome: '', email: '', senha: '', role: 'garcom', telefone: '' });
  };

  const roles = ['Todos', 'admin', 'garcom'];
  const usuariosFiltrados = filtroRole === 'Todos'
    ? usuarios
    : usuarios.filter((u) => u.role === filtroRole);

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
          <h1 className="text-3xl font-bold text-primary-brown mb-1">Gerenciar Usuários</h1>
          <p className="text-gray-600">Adicione, edite ou remova usuários do sistema</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-orange hover:bg-primary-brown text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="shadow-lg border-2 border-primary-orange">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary-brown mb-4">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required={!editingUser}
                    minLength={6}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Função *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  required
                >
                  <option value="garcom">Garçom</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
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
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setFiltroRole(role)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              filtroRole === role
                ? 'bg-primary-orange text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {role === 'Todos' ? 'Todos' : role === 'admin' ? 'Administradores' : 'Garçons'}
          </button>
        ))}
      </div>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.map((usuario) => (
          <Card
            key={usuario.id}
            className="shadow-lg hover:shadow-xl transition-all border-l-4"
            style={{
              borderLeftColor: usuario.role === 'admin' ? '#ef4444' : '#3b82f6'
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    usuario.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {usuario.role === 'admin' ? (
                      <Shield className="h-6 w-6 text-red-600" />
                    ) : (
                      <UserCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{usuario.nome}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      usuario.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {usuario.role === 'admin' ? 'Admin' : 'Garçom'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{usuario.email}</span>
                </div>
                {usuario.telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Tel:</span>
                    <span>{usuario.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Desde:</span>
                  <span>{new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(usuario)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(usuario.id)}
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

      {usuariosFiltrados.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {filtroRole === 'Todos'
                ? 'Nenhum usuário cadastrado'
                : `Nenhum ${filtroRole} cadastrado`}
            </h3>
            <p className="text-gray-500 mb-4">
              {filtroRole === 'Todos'
                ? 'Clique em "Novo Usuário" para adicionar o primeiro usuário'
                : 'Tente selecionar outro filtro'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

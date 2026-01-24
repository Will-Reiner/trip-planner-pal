import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripData } from '@/contexts/TripDataContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Users, Crown, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: number;
  nome: string;
  role: 'admin' | 'membro';
  titulo_engracado?: string;
  avatar_url?: string;
}

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reloadData } = useTripData();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'membro'>('membro');
  const [newUserTitle, setNewUserTitle] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('trip_planner_user') || '{}');
  const token = localStorage.getItem('trip_planner_token');

  useEffect(() => {
    // Verificar se é admin
    if (currentUser.role !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem acessar esta página',
        variant: 'destructive',
      });
      navigate('/gastronomia');
      return;
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e senha são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/auth/users`,
        {
          nome: newUserName,
          senha: newUserPassword,
          role: newUserRole,
          titulo_engracado: newUserTitle || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso',
      });

      // Reset form
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('membro');
      setNewUserTitle('');
      setIsAddDialogOpen(false);

      // Reload users
      await loadUsers();
      
      // Recarregar dados globais para atualizar painel de participantes
      await reloadData();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível criar o usuário',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'membro') => {
    try {
      await axios.patch(
        `${API_URL}/users/${userId}`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: 'Sucesso!',
        description: 'Role atualizada com sucesso',
      });

      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'Sucesso!',
        description: 'Usuário excluído com sucesso',
      });

      await loadUsers();
      
      // Recarregar dados globais para atualizar painel de participantes
      await reloadData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          </div>
          <p className="text-muted-foreground">
            Adicione membros, defina roles e gerencie o acesso ao sistema
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add User Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Adicionar Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie um novo membro ou administrador do sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha de acesso"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Acesso</Label>
                <Select value={newUserRole} onValueChange={(value: 'admin' | 'membro') => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título Engraçado (opcional)</Label>
                <Input
                  id="title"
                  placeholder="Ex: Mestre do Churrasquinho"
                  value={newUserTitle}
                  onChange={(e) => setNewUserTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleAddUser}>
                Criar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Users List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários Cadastrados
          </h2>

          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{user.nome}</h3>
                        {user.role === 'admin' && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      {user.titulo_engracado && (
                        <p className="text-sm text-muted-foreground">{user.titulo_engracado}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Change Role */}
                    {user.id !== currentUser.userId && (
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'membro') => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membro">Membro</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Delete User */}
                    {user.id !== currentUser.userId && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id, user.nome)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

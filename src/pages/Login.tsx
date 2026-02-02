import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plane, Lock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentUser } = useUser();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !senha) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e senha',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        nome,
        senha,
      });

      const { token, user } = response.data.data;

      // Salvar token no localStorage
      localStorage.setItem('trip_planner_token', token);
      localStorage.setItem('trip_planner_user', JSON.stringify(user));

      // Popular UserContext (mapear nome -> name para compatibilidade)
      setCurrentUser({
        id: user.id,
        name: user.nome,
        photo: user.avatar_url
      });

      toast({
        title: `Bem-vindo, ${user.nome}!`,
        description: user.role === 'admin' ? '👑 Você é um administrador' : 'Pronto para a trip!',
      });

      // Redirecionar para página principal
      navigate('/gastronomia');

    } catch (error: unknown) {
      console.error('Erro no login:', error);
      const apiMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message
        : undefined;
      toast({
        title: 'Erro no login',
        description: apiMessage || 'Verifique suas credenciais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Trip Planner Pal</CardTitle>
          <CardDescription>Faça login para organizar sua viagem</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome de usuário</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

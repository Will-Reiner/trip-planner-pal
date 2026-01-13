import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTripData } from '../contexts/TripDataContext';
import BottomNav from '../components/BottomNav';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Car,
  Users,
  Check,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Category {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  is_system: boolean;
}

interface Estimate {
  id: number;
  category_id: number;
  categoria_nome: string;
  categoria_icone: string;
  categoria_cor: string;
  descricao: string;
  valor_estimado: number;
  participantes: Array<{
    user_id: number;
    user_nome: string;
  }>;
}

interface Expense {
  id: number;
  category_id: number;
  categoria_nome: string;
  categoria_icone: string;
  descricao: string;
  valor_total: number;
  pagador_id: number;
  pagador_nome: string;
  data_despesa: string;
  participantes: Array<{
    user_id: number;
    user_nome: string;
    valor_individual: number | null;
    pagamento_confirmado: boolean;
  }>;
}

interface Debt {
  devedor_id: number;
  devedor_nome: string;
  credor_id: number;
  credor_nome: string;
  valor_devido: number;
}

interface Ride {
  id: number;
  titulo: string;
  motorista_id: number;
  motorista_nome: string;
  origem: string;
  destino: string;
  valor_gasolina: number;
  passageiros: Array<{
    user_id: number;
    user_nome: string;
    contribuicao: number | null;
    pagamento_confirmado: boolean;
  }>;
}

const Custos = () => {
  const { currentUser } = useUser();
  const { data } = useTripData();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEstimateDialogOpen, setIsEstimateDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isRideDialogOpen, setIsRideDialogOpen] = useState(false);
  
  const [estimateForm, setEstimateForm] = useState({
    category_id: '',
    descricao: '',
    valor_estimado: '',
    participantes: [] as number[],
  });
  
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    descricao: '',
    valor_total: '',
    pagador_id: currentUser?.id || 0,
    participantes: [] as Array<{ user_id: number; valor_individual: string }>,
  });
  
  const [rideForm, setRideForm] = useState({
    titulo: '',
    origem: '',
    destino: '',
    valor_gasolina: '',
    passageiros: [] as Array<{ user_id: number; contribuicao: string }>,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, estimatesRes, expensesRes, debtsRes, ridesRes] = await Promise.all([
        axios.get(`${API_URL}/finances/categories`),
        axios.get(`${API_URL}/finances/estimates`),
        axios.get(`${API_URL}/finances/expenses`),
        axios.get(`${API_URL}/finances/debts-summary`),
        axios.get(`${API_URL}/rides`),
      ]);
      
      setCategories(categoriesRes.data.data || []);
      setEstimates(estimatesRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
      setDebts(debtsRes.data.data || []);
      setRides(ridesRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEstimate = async () => {
    if (!estimateForm.category_id || !estimateForm.descricao || !estimateForm.valor_estimado) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/finances/estimates`, {
        ...estimateForm,
        valor_estimado: parseFloat(estimateForm.valor_estimado),
        criado_por_id: currentUser?.id,
      });

      toast({ title: 'Estimativa criada!' });
      setIsEstimateDialogOpen(false);
      setEstimateForm({ category_id: '', descricao: '', valor_estimado: '', participantes: [] });
      loadAllData();
    } catch (error) {
      console.error('Erro ao criar estimativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a estimativa',
        variant: 'destructive',
      });
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.category_id || !expenseForm.descricao || !expenseForm.valor_total) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/finances/expenses`, {
        ...expenseForm,
        valor_total: parseFloat(expenseForm.valor_total),
        participantes: expenseForm.participantes.map(p => ({
          user_id: p.user_id,
          valor_individual: p.valor_individual ? parseFloat(p.valor_individual) : null,
        })),
      });

      toast({ title: 'Despesa criada!' });
      setIsExpenseDialogOpen(false);
      setExpenseForm({ 
        category_id: '', 
        descricao: '', 
        valor_total: '', 
        pagador_id: currentUser?.id || 0,
        participantes: [] 
      });
      loadAllData();
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a despesa',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRide = async () => {
    if (!rideForm.titulo) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o título da carona',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/rides`, {
        ...rideForm,
        motorista_id: currentUser?.id,
        valor_gasolina: rideForm.valor_gasolina ? parseFloat(rideForm.valor_gasolina) : null,
        passageiros: rideForm.passageiros.map(p => ({
          user_id: p.user_id,
          contribuicao: p.contribuicao ? parseFloat(p.contribuicao) : null,
        })),
      });

      toast({ title: 'Carona criada!' });
      setIsRideDialogOpen(false);
      setRideForm({ titulo: '', origem: '', destino: '', valor_gasolina: '', passageiros: [] });
      loadAllData();
    } catch (error) {
      console.error('Erro ao criar carona:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a carona',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPayment = async (expenseId: number, userId: number) => {
    try {
      await axios.patch(`${API_URL}/finances/expenses/confirm-payment`, {
        expense_id: expenseId,
        user_id: userId,
      });
      toast({ title: 'Pagamento confirmado!' });
      loadAllData();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
    }
  };

  const handleDeleteEstimate = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/finances/estimates/${id}`);
      toast({ title: 'Estimativa removida!' });
      loadAllData();
    } catch (error) {
      console.error('Erro ao deletar estimativa:', error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/finances/expenses/${id}`);
      toast({ title: 'Despesa removida!' });
      loadAllData();
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
    }
  };

  const toggleEstimateParticipant = (userId: number) => {
    setEstimateForm(prev => ({
      ...prev,
      participantes: prev.participantes.includes(userId)
        ? prev.participantes.filter(id => id !== userId)
        : [...prev.participantes, userId],
    }));
  };

  const toggleExpenseParticipant = (userId: number) => {
    setExpenseForm(prev => {
      const exists = prev.participantes.find(p => p.user_id === userId);
      if (exists) {
        return {
          ...prev,
          participantes: prev.participantes.filter(p => p.user_id !== userId),
        };
      } else {
        return {
          ...prev,
          participantes: [...prev.participantes, { user_id: userId, valor_individual: '' }],
        };
      }
    });
  };

  const toggleRidePassenger = (userId: number) => {
    setRideForm(prev => {
      const exists = prev.passageiros.find(p => p.user_id === userId);
      if (exists) {
        return {
          ...prev,
          passageiros: prev.passageiros.filter(p => p.user_id !== userId),
        };
      } else {
        return {
          ...prev,
          passageiros: [...prev.passageiros, { user_id: userId, contribuicao: '' }],
        };
      }
    });
  };

  const totalEstimado = estimates.reduce((acc, e) => acc + parseFloat(e.valor_estimado.toString()), 0);
  const totalGasto = expenses.reduce((acc, e) => acc + parseFloat(e.valor_total.toString()), 0);
  const myDebts = debts.filter(d => d.devedor_id === currentUser?.id);
  const totalMyDebts = myDebts.reduce((acc, d) => acc + parseFloat(d.valor_devido.toString()), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Custos</h1>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Estimado</p>
              <p className="text-lg font-bold text-blue-600">R$ {totalEstimado.toFixed(2)}</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Gasto</p>
              <p className="text-lg font-bold text-orange-600">R$ {totalGasto.toFixed(2)}</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Eu devo</p>
              <p className="text-lg font-bold text-red-600">R$ {totalMyDebts.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="estimativas" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="estimativas">Estimativas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="caronas">Caronas</TabsTrigger>
            <TabsTrigger value="dividas">Dívidas</TabsTrigger>
          </TabsList>

          {/* ESTIMATIVAS */}
          <TabsContent value="estimativas" className="space-y-3">
            <Dialog open={isEstimateDialogOpen} onOpenChange={setIsEstimateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Estimativa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Estimativa</DialogTitle>
                  <DialogDescription>Crie uma estimativa de gasto para a viagem</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={estimateForm.category_id} onValueChange={(v) => setEstimateForm({...estimateForm, category_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.icone} {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={estimateForm.descricao}
                      onChange={(e) => setEstimateForm({...estimateForm, descricao: e.target.value})}
                      placeholder="Ex: Casa na praia"
                    />
                  </div>
                  <div>
                    <Label>Valor Estimado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={estimateForm.valor_estimado}
                      onChange={(e) => setEstimateForm({...estimateForm, valor_estimado: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Quem vai dividir?</Label>
                    <div className="space-y-2">
                      {data.participants.map(p => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`estimate-p-${p.id}`}
                            checked={estimateForm.participantes.includes(p.id)}
                            onCheckedChange={() => toggleEstimateParticipant(p.id)}
                          />
                          <Label htmlFor={`estimate-p-${p.id}`}>{p.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateEstimate}>Criar Estimativa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {estimates.map(estimate => (
              <div key={estimate.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{estimate.categoria_icone}</span>
                    <div>
                      <h3 className="font-semibold">{estimate.descricao}</h3>
                      <p className="text-sm text-muted-foreground">{estimate.categoria_nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">R$ {parseFloat(estimate.valor_estimado.toString()).toFixed(2)}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteEstimate(estimate.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {estimate.participantes?.map(p => (
                    <Badge key={p.user_id} variant="secondary" className="text-xs">
                      {p.user_nome}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* DESPESAS */}
          <TabsContent value="despesas" className="space-y-3">
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Despesa</DialogTitle>
                  <DialogDescription>Registre uma despesa real da viagem</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={expenseForm.category_id} onValueChange={(v) => setExpenseForm({...expenseForm, category_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.icone} {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={expenseForm.descricao}
                      onChange={(e) => setExpenseForm({...expenseForm, descricao: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Valor Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseForm.valor_total}
                      onChange={(e) => setExpenseForm({...expenseForm, valor_total: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Quem vai dividir? (deixe vazio para dividir igualmente)</Label>
                    <div className="space-y-2">
                      {data.participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`expense-p-${p.id}`}
                            checked={expenseForm.participantes.some(part => part.user_id === p.id)}
                            onCheckedChange={() => toggleExpenseParticipant(p.id)}
                          />
                          <Label htmlFor={`expense-p-${p.id}`} className="flex-1">{p.name}</Label>
                          {expenseForm.participantes.some(part => part.user_id === p.id) && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Valor fixo"
                              className="w-24 h-8"
                              value={expenseForm.participantes.find(part => part.user_id === p.id)?.valor_individual || ''}
                              onChange={(e) => {
                                setExpenseForm(prev => ({
                                  ...prev,
                                  participantes: prev.participantes.map(part =>
                                    part.user_id === p.id ? { ...part, valor_individual: e.target.value } : part
                                  ),
                                }));
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateExpense}>Criar Despesa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {expenses.map(expense => (
              <div key={expense.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{expense.categoria_icone}</span>
                    <div>
                      <h3 className="font-semibold">{expense.descricao}</h3>
                      <p className="text-xs text-muted-foreground">
                        Pago por: {expense.pagador_nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600">R$ {parseFloat(expense.valor_total.toString()).toFixed(2)}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteExpense(expense.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {expense.participantes?.map(p => (
                    <div key={p.user_id} className="flex items-center justify-between text-sm">
                      <span>{p.user_nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          R$ {p.valor_individual?.toFixed(2) || 'Dividir'}
                        </span>
                        {p.pagamento_confirmado ? (
                          <Badge className="text-xs bg-green-500">Pago ✓</Badge>
                        ) : (
                          p.user_id === currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => handleConfirmPayment(expense.id, p.user_id)}
                            >
                              Confirmar
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* CARONAS */}
          <TabsContent value="caronas" className="space-y-3">
            <Dialog open={isRideDialogOpen} onOpenChange={setIsRideDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Car className="w-4 h-4" />
                  Nova Carona
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Carona</DialogTitle>
                  <DialogDescription>Organize uma carona e divida a gasolina</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={rideForm.titulo}
                      onChange={(e) => setRideForm({...rideForm, titulo: e.target.value})}
                      placeholder="Ex: Ida para a praia"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Origem</Label>
                      <Input
                        value={rideForm.origem}
                        onChange={(e) => setRideForm({...rideForm, origem: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Destino</Label>
                      <Input
                        value={rideForm.destino}
                        onChange={(e) => setRideForm({...rideForm, destino: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Valor Gasolina (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rideForm.valor_gasolina}
                      onChange={(e) => setRideForm({...rideForm, valor_gasolina: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Passageiros</Label>
                    <div className="space-y-2">
                      {data.participants.filter(p => p.id !== currentUser?.id).map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`ride-p-${p.id}`}
                            checked={rideForm.passageiros.some(pass => pass.user_id === p.id)}
                            onCheckedChange={() => toggleRidePassenger(p.id)}
                          />
                          <Label htmlFor={`ride-p-${p.id}`} className="flex-1">{p.name}</Label>
                          {rideForm.passageiros.some(pass => pass.user_id === p.id) && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Valor"
                              className="w-24 h-8"
                              value={rideForm.passageiros.find(pass => pass.user_id === p.id)?.contribuicao || ''}
                              onChange={(e) => {
                                setRideForm(prev => ({
                                  ...prev,
                                  passageiros: prev.passageiros.map(pass =>
                                    pass.user_id === p.id ? { ...pass, contribuicao: e.target.value } : pass
                                  ),
                                }));
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateRide}>Criar Carona</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {rides.map(ride => (
              <div key={ride.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{ride.titulo}</h3>
                      <p className="text-xs text-muted-foreground">
                        Motorista: {ride.motorista_nome}
                      </p>
                      {ride.origem && ride.destino && (
                        <p className="text-xs text-muted-foreground">
                          {ride.origem} → {ride.destino}
                        </p>
                      )}
                    </div>
                  </div>
                  {ride.valor_gasolina && (
                    <span className="font-bold text-primary">R$ {parseFloat(ride.valor_gasolina.toString()).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {ride.passageiros?.map(p => (
                    <Badge key={p.user_id} variant={p.pagamento_confirmado ? "default" : "secondary"} className="text-xs">
                      {p.user_nome} {p.pagamento_confirmado && '✓'}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* DÍVIDAS */}
          <TabsContent value="dividas" className="space-y-3">
            {debts.length === 0 ? (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma dívida pendente!</p>
              </div>
            ) : (
              debts.map((debt, idx) => (
                <div key={idx} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{debt.devedor_nome}</p>
                      <p className="text-sm text-muted-foreground">deve para {debt.credor_nome}</p>
                    </div>
                    <span className="font-bold text-red-600">R$ {parseFloat(debt.valor_devido.toString()).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Custos;

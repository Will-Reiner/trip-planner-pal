import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTripData } from '../contexts/TripDataContext';
import BottomNav from '../components/BottomNav';
import { 
  DollarSign, 
  Plus, 
  Users,
  Edit2,
  Trash2,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Category {
  id: number;
  nome: string;
  icone: string;
  cor: string;
}

interface Estimate {
  id: number;
  category_id: number;
  categoria_nome: string;
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
  descricao: string;
  valor_total: number;
  pagador_id: number;
  pagador_nome: string;
  participantes: Array<{
    user_id: number;
    user_nome: string;
    valor_individual: number | null;
    pagamento_confirmado: boolean;
  }>;
}

const CustosNew = () => {
  const { currentUser } = useUser();
  const { data } = useTripData();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEstimates, setShowEstimates] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'estimate' | 'expense'>('expense');
  const [editingType, setEditingType] = useState<'estimate' | 'expense' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    category_id: '',
    descricao: '',
    valor: '',
    participantes: [] as number[] | Array<{ user_id: number; valor_individual: string }>,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, estimatesRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/finances/categories`),
        axios.get(`${API_URL}/finances/estimates`),
        axios.get(`${API_URL}/finances/expenses`),
      ]);
      
      setCategories(categoriesRes.data.data.filter((c: Category) => c.nome !== 'Gasolina') || []);
      setEstimates(estimatesRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
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

  const openDialog = (mode: 'estimate' | 'expense', item?: Estimate | Expense) => {
    setDialogMode(mode);
    if (item) {
      setEditingId(item.id);
      setEditingType(mode);
      const estimateParticipants = (item as Estimate).participantes ?? [];
      const expenseParticipants = (item as Expense).participantes ?? [];
      setForm({
        category_id: item.category_id.toString(),
        descricao: item.descricao,
        valor: mode === 'estimate' ? (item as Estimate).valor_estimado.toString() : (item as Expense).valor_total.toString(),
        participantes: mode === 'estimate' 
          ? estimateParticipants.map(p => p.user_id)
          : expenseParticipants.map(p => ({ user_id: p.user_id, valor_individual: p.valor_individual?.toString() || '' })),
      });
    } else {
      setEditingId(null);
      setEditingType(null);
      setForm({
        category_id: '',
        descricao: '',
        valor: '',
        participantes: mode === 'estimate' ? [] : [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.category_id || !form.descricao || !form.valor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      const isSwitchingType = editingId && editingType && editingType !== dialogMode;
      if (dialogMode === 'estimate') {
        const estimateParticipants = (form.participantes as Array<number | { user_id: number }>)
          .map((p) => (typeof p === 'number' ? p : p.user_id))
          .filter((userId) => typeof userId === 'number');
        const payload = {
          category_id: parseInt(form.category_id),
          descricao: form.descricao,
          valor_estimado: parseFloat(form.valor),
          participantes: estimateParticipants,
          criado_por_id: currentUser?.id,
        };

        if (editingId) {
          if (isSwitchingType) {
            await axios.post(`${API_URL}/finances/estimates`, payload);
            await axios.delete(`${API_URL}/finances/expenses/${editingId}`);
            toast({ title: 'Estimativa criada a partir da despesa!' });
          } else {
            await axios.patch(`${API_URL}/finances/estimates/${editingId}`, payload);
            toast({ title: 'Estimativa atualizada!' });
          }
        } else {
          await axios.post(`${API_URL}/finances/estimates`, payload);
          toast({ title: 'Estimativa criada!' });
        }
      } else {
        const expenseParticipantsRaw = form.participantes as Array<
          number | { user_id: number; valor_individual?: string }
        >;
        const expenseParticipants = expenseParticipantsRaw
          .map((p) =>
            typeof p === 'number'
              ? { user_id: p, valor_individual: null }
              : {
                  user_id: p.user_id,
                  valor_individual: p.valor_individual
                    ? parseFloat(p.valor_individual)
                    : null,
                }
          )
          .filter((p) => typeof p.user_id === 'number');
        const payload = {
          category_id: parseInt(form.category_id),
          descricao: form.descricao,
          valor_total: parseFloat(form.valor),
          pagador_id: currentUser?.id,
          participantes: expenseParticipants,
        };

        if (editingId) {
          if (isSwitchingType) {
            await axios.post(`${API_URL}/finances/expenses`, payload);
            await axios.delete(`${API_URL}/finances/estimates/${editingId}`);
            toast({ title: 'Despesa criada a partir da estimativa!' });
          } else {
            await axios.patch(`${API_URL}/finances/expenses/${editingId}`, payload);
            toast({ title: 'Despesa atualizada!' });
          }
        } else {
          await axios.post(`${API_URL}/finances/expenses`, payload);
          toast({ title: 'Despesa criada!' });
        }
      }

      setIsDialogOpen(false);
      setEditingId(null);
      loadAllData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number, type: 'estimate' | 'expense') => {
    try {
      if (type === 'estimate') {
        await axios.delete(`${API_URL}/finances/estimates/${id}`);
        toast({ title: 'Estimativa removida!' });
      } else {
        await axios.delete(`${API_URL}/finances/expenses/${id}`);
        toast({ title: 'Despesa removida!' });
      }
      loadAllData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const toggleParticipant = (userId: number) => {
    if (dialogMode === 'estimate') {
      const participants = form.participantes as number[];
      setForm({
        ...form,
        participantes: participants.includes(userId)
          ? participants.filter(id => id !== userId)
          : [...participants, userId],
      });
    } else {
      const participants = form.participantes as Array<{ user_id: number; valor_individual: string }>;
      const exists = participants.find(p => p.user_id === userId);
      setForm({
        ...form,
        participantes: exists
          ? participants.filter(p => p.user_id !== userId)
          : [...participants, { user_id: userId, valor_individual: '' }],
      });
    }
  };

  const selectAllParticipants = () => {
    if (dialogMode === 'estimate') {
      const allSelected = (form.participantes as number[]).length === data.participants.length;
      setForm({
        ...form,
        participantes: allSelected ? [] : data.participants.map(p => p.id),
      });
    } else {
      const participants = form.participantes as Array<{ user_id: number; valor_individual: string }>;
      const allSelected = participants.length === data.participants.length;
      setForm({
        ...form,
        participantes: allSelected ? [] : data.participants.map(p => ({ user_id: p.id, valor_individual: '' })),
      });
    }
  };

  // Calcular dívidas por categoria
  const calculateDebts = () => {
    const debts: Record<string, { real: number; estimado: number; categoria: string }> = {};

    // Despesas reais
    expenses.forEach(expense => {
      const participantes = expense.participantes || [];
      const myParticipation = participantes.find(p => p.user_id === currentUser?.id);
      
      if (myParticipation) {
        const participantesComValorFixo = participantes.filter(p => p.valor_individual !== null);
        const totalValorFixo = participantesComValorFixo.reduce((sum, p) => sum + (p.valor_individual || 0), 0);
        const participantesSemValor = participantes.filter(p => p.valor_individual === null);
        const valorDividido = participantesSemValor.length > 0 
          ? (expense.valor_total - totalValorFixo) / participantesSemValor.length 
          : 0;
        
        const valorReal = myParticipation.valor_individual !== null 
          ? myParticipation.valor_individual 
          : valorDividido;

        if (!debts[expense.categoria_nome]) {
          debts[expense.categoria_nome] = { real: 0, estimado: 0, categoria: expense.categoria_nome };
        }
        debts[expense.categoria_nome].real += valorReal;
      }
    });

    // Estimativas
    estimates.forEach(estimate => {
      const myParticipation = estimate.participantes?.find(p => p.user_id === currentUser?.id);
      if (myParticipation) {
        const valorEstimado = estimate.valor_estimado / estimate.participantes.length;
        if (!debts[estimate.categoria_nome]) {
          debts[estimate.categoria_nome] = { real: 0, estimado: 0, categoria: estimate.categoria_nome };
        }
        debts[estimate.categoria_nome].estimado += valorEstimado;
      }
    });

    return Object.values(debts);
  };

  const myDebts = calculateDebts();
  const totalReal = myDebts.reduce((sum, d) => sum + d.real, 0);
  const totalEstimado = myDebts.reduce((sum, d) => sum + d.estimado, 0);
  const totalGeral = showEstimates ? totalReal + totalEstimado : totalReal;

  // Agrupar items por categoria
  const itemsByCategory = categories.reduce((acc, cat) => {
    const catEstimates = estimates.filter(e => e.category_id === cat.id);
    const catExpenses = expenses.filter(e => e.category_id === cat.id);
    if (catEstimates.length > 0 || catExpenses.length > 0) {
      acc[cat.nome] = { estimates: catEstimates, expenses: catExpenses, category: cat };
    }
    return acc;
  }, {} as Record<string, { estimates: Estimate[]; expenses: Expense[]; category: Category }>);

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
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Minhas Dívidas */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Minha Parte</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEstimates(!showEstimates)}
              className="gap-2"
            >
              {showEstimates ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showEstimates ? 'Só Real' : '+ Estimativas'}
            </Button>
          </div>

          <div className="mb-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Minha Parte</p>
            <p className="text-3xl font-bold text-primary">
              R$ {totalGeral.toFixed(2)}
            </p>
            {showEstimates && (
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-orange-600">Real: R$ {totalReal.toFixed(2)}</span>
                <span className="text-blue-600">Estimado: R$ {totalEstimado.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {myDebts.map((debt) => {
              // Encontrar pagadores para esta categoria
              const pagadoresNaCategoria = expenses
                .filter(e => e.categoria_nome === debt.categoria && 
                        e.participantes?.some(p => p.user_id === currentUser?.id) &&
                        e.pagador_id !== currentUser?.id)
                .map(e => ({ nome: e.pagador_nome, id: e.pagador_id }))
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // unique

              return (
                <div key={debt.categoria} className="flex items-center justify-between p-2 rounded bg-background">
                  <div className="flex-1">
                    <div className="font-medium">{debt.categoria}</div>
                    {pagadoresNaCategoria.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Pagar para: {pagadoresNaCategoria.map(p => p.nome).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {showEstimates ? (
                      <>
                        <div className="text-sm">
                          <span className="text-orange-600 font-medium">R$ {debt.real.toFixed(2)}</span>
                          {debt.estimado > 0 && (
                            <span className="text-blue-600 ml-2">+ R$ {debt.estimado.toFixed(2)}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="font-medium text-orange-600">R$ {debt.real.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão Adicionar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" onClick={() => openDialog('expense')}>
              <Plus className="w-4 h-4" />
              Adicionar Despesa ou Estimativa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Nova'} {dialogMode === 'estimate' ? 'Estimativa' : 'Despesa'}</DialogTitle>
              <DialogDescription>Escolha o tipo e preencha os campos.</DialogDescription>
            </DialogHeader>
            <Tabs value={dialogMode} onValueChange={(v) => setDialogMode(v as 'estimate' | 'expense')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Despesa</TabsTrigger>
                <TabsTrigger value="estimate">Estimativa</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-4 py-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
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
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Casa na praia"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quem vai dividir?</Label>
                  <Button type="button" size="sm" variant="outline" onClick={selectAllParticipants}>
                    {(dialogMode === 'estimate' 
                      ? (form.participantes as number[]).length 
                      : (form.participantes as Array<{user_id: number}>).length) === data.participants.length 
                      ? 'Desmarcar Todos' 
                      : 'Selecionar Todos'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {data.participants.map(p => {
                    const isEstimate = dialogMode === 'estimate';
                    const isChecked = isEstimate
                      ? (form.participantes as number[]).includes(p.id)
                      : (form.participantes as Array<{user_id: number}>).some(part => part.user_id === p.id);

                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`participant-${p.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleParticipant(p.id)}
                        />
                        <Label htmlFor={`participant-${p.id}`} className="flex-1">{p.name}</Label>
                        {!isEstimate && isChecked && (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Valor fixo"
                            className="w-24 h-8"
                            value={(form.participantes as Array<{user_id: number; valor_individual: string}>)
                              .find(part => part.user_id === p.id)?.valor_individual || ''}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                participantes: (form.participantes as Array<{user_id: number; valor_individual: string}>)
                                  .map(part => part.user_id === p.id 
                                    ? { ...part, valor_individual: e.target.value } 
                                    : part
                                  ),
                              });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>{editingId ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lista por Categoria */}
        {Object.entries(itemsByCategory).map(([catName, { estimates: catEstimates, expenses: catExpenses, category }]) => (
          <div key={catName} className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">{category.icone}</span>
              {catName}
            </h3>
            
            {catEstimates.map(estimate => (
              <div key={`est-${estimate.id}`} className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs bg-blue-100">Estimativa</Badge>
                      <h4 className="font-semibold">{estimate.descricao}</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      R$ {parseFloat(estimate.valor_estimado.toString()).toFixed(2)}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {estimate.participantes?.map(p => (
                        <Badge key={p.user_id} variant="outline" className="text-xs">
                          {p.user_nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openDialog('estimate', estimate)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(estimate.id, 'estimate')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {catExpenses.map(expense => {
              const participantes = expense.participantes || [];
              const participantesComValorFixo = participantes.filter(p => p.valor_individual !== null);
              const totalValorFixo = participantesComValorFixo.reduce((sum, p) => sum + (p.valor_individual || 0), 0);
              const participantesSemValor = participantes.filter(p => p.valor_individual === null);
              const valorDividido = participantesSemValor.length > 0 
                ? (expense.valor_total - totalValorFixo) / participantesSemValor.length 
                : 0;

              return (
                <div key={`exp-${expense.id}`} className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs bg-orange-100">Despesa</Badge>
                        <h4 className="font-semibold">{expense.descricao}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Pago por: {expense.pagador_nome}</p>
                      <p className="text-2xl font-bold text-orange-600 mb-2">
                        R$ {parseFloat(expense.valor_total.toString()).toFixed(2)}
                      </p>
                      <div className="space-y-1">
                        {participantes.map(p => {
                          const valorReal = p.valor_individual !== null ? p.valor_individual : valorDividido;
                          return (
                            <div key={p.user_id} className="flex items-center justify-between text-sm bg-white rounded p-2">
                              <span>{p.user_nome}</span>
                              <span className="font-medium">R$ {valorReal.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openDialog('expense', expense)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(expense.id, 'expense')}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default CustosNew;

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav';
import { ShoppingCart, Plus, X, Check, DollarSign, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface IngredientMeal {
  meal_id: number;
  tipo_refeicao: string;
  nome_refeicao: string;
  data: string;
}

interface MarketItem {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valor_por_porcao?: number;
  tamanho_porcao?: number;
  comprado: boolean;
  responsavel_id?: number;
  responsavel_nome?: string;
  responsavel_avatar?: string;
  adicionado_por_id?: number;
  adicionado_por_nome?: string;
  observacoes?: string;
  meals?: IngredientMeal[];
}

const categories = [
  { value: 'acougue', label: '🥩 Açougue', emoji: '🥩' },
  { value: 'hortifruti', label: '🥬 Hortifruti', emoji: '🥬' },
  { value: 'bebidas', label: '🥤 Bebidas', emoji: '🥤' },
  { value: 'limpeza', label: '🧽 Limpeza', emoji: '🧽' },
  { value: 'mercearia', label: '🛒 Mercearia', emoji: '🛒' },
  { value: 'congelados', label: '🧊 Congelados', emoji: '🧊' },
  { value: 'padaria', label: '🥖 Padaria', emoji: '🥖' },
  { value: 'outros', label: '📦 Outros', emoji: '📦' },
];

const unidades = ['kg', 'g', 'litro', 'ml', 'unidade', 'pacote', 'caixa', 'lata', 'garrafa'];

const ListaDeMercado = () => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    nome_item: '',
    categoria: 'mercearia',
    quantidade: 1,
    unidade_medida: 'unidade',
    valor_por_porcao: '',
    tamanho_porcao: '',
    observacoes: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/market-items`);
      const itemsData = response.data.data || [];
      
      // Carregar as refeições para cada item
      const itemsWithMeals = await Promise.all(
        itemsData.map(async (item: MarketItem) => {
          try {
            const mealsResponse = await axios.get(`${API_URL}/meal-ingredients/ingredient/${item.id}`);
            return { ...item, meals: mealsResponse.data.data || [] };
          } catch {
            return { ...item, meals: [] };
          }
        })
      );
      
      setItems(itemsWithMeals);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de mercado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!formData.nome_item.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o nome do item',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/market-items`, {
        ...formData,
        valor_por_porcao: formData.valor_por_porcao ? parseFloat(formData.valor_por_porcao) : null,
        tamanho_porcao: formData.tamanho_porcao ? parseFloat(formData.tamanho_porcao) : null,
        adicionado_por_id: currentUser?.id,
      });

      toast({
        title: 'Sucesso!',
        description: 'Item adicionado à lista',
      });

      setIsDialogOpen(false);
      setFormData({
        nome_item: '',
        categoria: 'mercearia',
        quantidade: 1,
        unidade_medida: 'unidade',
        valor_por_porcao: '',
        tamanho_porcao: '',
        observacoes: '',
      });
      loadItems();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o item',
        variant: 'destructive',
      });
    }
  };

  const handleToggleComprado = async (id: number) => {
    try {
      await axios.patch(`${API_URL}/market-items/${id}/toggle`);
      loadItems();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleTakeResponsibility = async (id: number) => {
    if (!currentUser) return;
    
    try {
      await axios.patch(`${API_URL}/market-items/${id}`, {
        responsavel_id: currentUser.id,
      });
      toast({
        title: 'Sucesso!',
        description: 'Você ficou responsável por este item',
      });
      loadItems();
    } catch (error) {
      console.error('Erro ao assumir responsabilidade:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/market-items/${id}`);
      toast({
        title: 'Sucesso!',
        description: 'Item removido da lista',
      });
      loadItems();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.categoria === selectedCategory);

  const totalValue = items.reduce((acc, item) => {
    if (item.valor_por_porcao && item.tamanho_porcao && item.quantidade) {
      return acc + (item.valor_por_porcao / item.tamanho_porcao) * item.quantidade;
    }
    return acc;
  }, 0);

  const purchasedCount = items.filter(i => i.comprado).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Lista de Mercado</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Item</DialogTitle>
                  <DialogDescription>
                    Adicione um novo item à lista de compras
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Item</Label>
                    <Input
                      id="nome"
                      value={formData.nome_item}
                      onChange={(e) => setFormData({ ...formData, nome_item: e.target.value })}
                      placeholder="Ex: Arroz, Feijão..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Select
                        value={formData.unidade_medida}
                        onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valor_por_porcao}
                        onChange={(e) => setFormData({ ...formData, valor_por_porcao: e.target.value })}
                        placeholder="15.90"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tamanho">Tamanho</Label>
                      <Input
                        id="tamanho"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tamanho_porcao}
                        onChange={(e) => setFormData({ ...formData, tamanho_porcao: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Marca específica, detalhes..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddItem}>Adicionar Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{items.length} itens</span>
            <span>•</span>
            <span>{purchasedCount} comprados</span>
            {totalValue > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  R$ {totalValue.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              {cat.emoji} {cat.label.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum item nesta categoria</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-card rounded-xl border border-border p-4 transition-all duration-200 ${
                  item.comprado ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComprado(item.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.comprado
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {item.comprado && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${item.comprado ? 'line-through' : ''}`}>
                          {item.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade} {item.unidade}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {item.observacoes && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.observacoes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === item.categoria)?.emoji}{' '}
                        {categories.find(c => c.value === item.categoria)?.label.split(' ')[1]}
                      </Badge>

                      {item.valor_por_porcao && item.tamanho_porcao && (
                        <Badge variant="secondary" className="text-xs">
                          R$ {((item.valor_por_porcao / item.tamanho_porcao) * item.quantidade).toFixed(2)}
                        </Badge>
                      )}

                      {item.meals && item.meals.length > 0 && (
                        item.meals.length === 1 ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            {item.meals[0].tipo_refeicao === 'cafe' ? '☕' : item.meals[0].tipo_refeicao === 'almoco' ? '🍽️' : '🌙'}{' '}
                            {item.meals[0].nome_refeicao || 'Sem nome'}
                          </Badge>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                                  <UtensilsCrossed className="w-3 h-3" />
                                  {item.meals.length} refeições
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  {item.meals.map((meal) => (
                                    <div key={meal.meal_id}>
                                      {meal.tipo_refeicao === 'cafe' ? '☕ Café' : meal.tipo_refeicao === 'almoco' ? '🍽️ Almoço' : '🌙 Jantar'}: {meal.nome_refeicao || 'Sem nome'}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      )}

                      {item.responsavel_id ? (
                        <Badge className="text-xs">
                          👤 {item.responsavel_nome}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTakeResponsibility(item.id)}
                          className="h-6 text-xs"
                        >
                          Eu compro! 🛒
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ListaDeMercado;

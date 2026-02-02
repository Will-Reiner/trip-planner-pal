import { useState, useEffect } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import MealCard from '../components/MealCard';
import DrinkVoting from '../components/DrinkVoting';
import { UtensilsCrossed, Wine, Coffee, ShoppingCart, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface MarketItem {
  id: number;
  nome: string;
}

const Gastronomia = () => {
  const { data, reloadData } = useTripData();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(() => {
    const saved = localStorage.getItem('gastronomia_selected_day');
    return saved ? parseInt(saved) : 14;
  });
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [mealName, setMealName] = useState('');
  const [chefId, setChefId] = useState<string>('none');
  const [helperId, setHelperId] = useState<string>('none');
  const [dishwasher1Id, setDishwasher1Id] = useState<string>('none');
  const [dishwasher2Id, setDishwasher2Id] = useState<string>('none');
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Estados para criar bebida
  const [isAddDrinkOpen, setIsAddDrinkOpen] = useState(false);
  const [drinkName, setDrinkName] = useState('');
  const [drinkEmoji, setDrinkEmoji] = useState('');
  const [drinkCategory, setDrinkCategory] = useState<string>('alc');
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('gastronomia_active_drink_tab');
    return saved || 'alcoholic';
  });

  // Salvar dia selecionado no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('gastronomia_selected_day', selectedDay.toString());
  }, [selectedDay]);

  // Salvar aba ativa de bebidas no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('gastronomia_active_drink_tab', activeTab);
  }, [activeTab]);

  const days = [14, 15, 16, 17];
  const mealsForDay = data.meals.filter(m => m.day === selectedDay);

  // Garantir que sempre mostre café, almoço e janta mesmo sem dados
  const mealTypes = [
    { type: 'breakfast', label: 'Café da Manhã', icon: '☕' },
    { type: 'lunch', label: 'Almoço', icon: '🍽️' },
    { type: 'dinner', label: 'Jantar', icon: '🌙' }
  ];

  const getMealsForType = (type: string) => {
    return mealsForDay.filter(m => m.type === type);
  };

  const loadMarketItems = async () => {
    try {
      setLoadingItems(true);
      console.log('Loading market items for meal dialog...');
      const response = await axios.get(`${API_URL}/market-items`);
      console.log('Market items loaded:', response.data);
      setMarketItems(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar itens do mercado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar ingredientes',
        variant: 'destructive',
      });
      setMarketItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenAddMeal = async (type: string) => {
    try {
      console.log('Opening add meal dialog for type:', type);
      setSelectedMealType(type);
      setIsAddMealOpen(true);
      await loadMarketItems();
    } catch (error) {
      console.error('Error opening meal dialog:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao abrir diálogo',
        variant: 'destructive',
      });
    }
  };

  const toggleIngredient = (itemId: number) => {
    setSelectedIngredients(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAddMeal = async () => {
    if (!mealName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da refeição',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Mapear tipo de refeição
      const tipoMapeamento: Record<string, string> = {
        'breakfast': 'cafe',
        'lunch': 'almoco',
        'dinner': 'jantar'
      };

      // Criar a refeição
      const mealData = {
        data: `2026-01-${selectedDay.toString().padStart(2, '0')}`,
        tipo_refeicao: tipoMapeamento[selectedMealType],
        nome_refeicao: mealName,
        cook_id: chefId && chefId !== 'none' ? parseInt(chefId) : null,
        helper_id: helperId && helperId !== 'none' ? parseInt(helperId) : null,
        dishwasher1_id: dishwasher1Id && dishwasher1Id !== 'none' ? parseInt(dishwasher1Id) : null,
        dishwasher2_id: dishwasher2Id && dishwasher2Id !== 'none' ? parseInt(dishwasher2Id) : null,
      };

      const mealResponse = await axios.post(`${API_URL}/meals`, mealData);
      const newMealId = mealResponse.data.data.id;

      // Adicionar ingredientes
      if (selectedIngredients.length > 0) {
        await Promise.all(
          selectedIngredients.map(async ingredientId => {
            return await axios.post(`${API_URL}/meal-ingredients`, {
              meal_id: newMealId,
              ingredient_id: ingredientId,
              quantidade_necessaria: 1,
            });
          })
        );
      }

      toast({
        title: 'Sucesso!',
        description: 'Refeição adicionada com sucesso',
      });

      // Resetar form
      setMealName('');
      setChefId('none');
      setHelperId('none');
      setDishwasher1Id('none');
      setDishwasher2Id('none');
      setSelectedIngredients([]);
      setIsAddMealOpen(false);

      // Recarregar dados (o dia selecionado será mantido pelo localStorage)
      await reloadData();

    } catch (error: unknown) {
      console.error('Erro ao adicionar refeição:', error);
      const apiMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message
        : undefined;
      toast({
        title: 'Erro',
        description: apiMessage || 'Não foi possível adicionar a refeição',
        variant: 'destructive',
      });
    }
  };

  const handleAddDrink = async () => {
    if (!drinkName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da bebida',
        variant: 'destructive',
      });
      return;
    }

    if (!drinkEmoji.trim()) {
      toast({
        title: 'Emoji obrigatório',
        description: 'Digite um emoji para a bebida',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/drinks`, {
        categoria: drinkCategory,
        nome_bebida: drinkName,
        emoji: drinkEmoji,
        created_by: currentUser.id,
      });

      toast({
        title: 'Sucesso!',
        description: 'Bebida criada com sucesso',
      });

      // Resetar form
      setDrinkName('');
      setDrinkEmoji('');
      setDrinkCategory('alc');
      setIsAddDrinkOpen(false);

      // Recarregar dados
      await reloadData();

    } catch (error: any) {
      console.error('Erro ao adicionar bebida:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível adicionar a bebida',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Gastronomia</h1>
          </div>
          <p className="text-muted-foreground">
            Olá, {currentUser?.name}! Organize as refeições 🍳
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              Dia {day}
            </button>
          ))}
        </div>

        {/* Meals */}
        <div className="space-y-6 mb-8">
          {mealTypes.map(({ type, label, icon }) => {
            const meals = getMealsForType(type);
            return (
              <div key={type}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>{icon}</span>
                  {label}
                </h3>
                {meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map(meal => (
                      <MealCard key={meal.id} meal={meal} />
                    ))}
                  </div>
                ) : (
                  <button 
                    className="w-full text-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => handleOpenAddMeal(type)}
                  >
                    <Plus className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Nenhuma refeição cadastrada</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique para adicionar</p>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Lista de Mercado Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Lista de Mercado
            </h2>
          </div>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => navigate('/lista-de-mercado')}
          >
            Ver Lista Completa
          </Button>
        </div>

        {/* Bebidas Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wine className="w-5 h-5" />
              Bebidas
            </h2>
            <Button 
              onClick={() => setIsAddDrinkOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Drink Voting */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="alcoholic" className="gap-2">
              <Wine className="w-4 h-4" />
              Alcoólicas
            </TabsTrigger>
            <TabsTrigger value="nonAlcoholic" className="gap-2">
              <Coffee className="w-4 h-4" />
              Sem Álcool
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alcoholic">
            <DrinkVoting type="alcoholic" drinks={data.drinks.alcoholic} />
          </TabsContent>
          
          <TabsContent value="nonAlcoholic">
            <DrinkVoting type="nonAlcoholic" drinks={data.drinks.nonAlcoholic} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Adicionar Bebida */}
      <Dialog open={isAddDrinkOpen} onOpenChange={setIsAddDrinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Bebida</DialogTitle>
            <DialogDescription>
              Crie uma nova bebida e convide pessoas para o racha!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Nome da Bebida */}
            <div className="grid gap-2">
              <Label htmlFor="drink-name">Nome da Bebida *</Label>
              <Input
                id="drink-name"
                value={drinkName}
                onChange={(e) => setDrinkName(e.target.value)}
                placeholder="Ex: Cerveja Artesanal, Vodka..."
              />
            </div>

            {/* Emoji */}
            <div className="grid gap-2">
              <Label htmlFor="drink-emoji">Emoji *</Label>
              <Input
                id="drink-emoji"
                value={drinkEmoji}
                onChange={(e) => setDrinkEmoji(e.target.value)}
                placeholder="Ex: 🍺 🍷 🍹 🥃"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Cole um emoji ou use vários emojis para representar a bebida
              </p>
            </div>

            {/* Categoria */}
            <div className="grid gap-2">
              <Label htmlFor="drink-category">Categoria</Label>
              <Select value={drinkCategory} onValueChange={setDrinkCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alc">🍺 Alcoólica</SelectItem>
                  <SelectItem value="non-alc">🥤 Sem Álcool</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDrinkOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDrink}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Bebida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Refeição */}
      <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Refeição</DialogTitle>
            <DialogDescription>
              {selectedMealType === 'breakfast' && '☕ Café da Manhã'}
              {selectedMealType === 'lunch' && '🍽️ Almoço'}
              {selectedMealType === 'dinner' && '🌙 Jantar'}
              {' - Dia ' + selectedDay}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Nome da Refeição */}
            <div className="grid gap-2">
              <Label htmlFor="meal-name">Nome da Refeição *</Label>
              <Input
                id="meal-name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Ex: Feijoada, Pizza, Churrasco..."
              />
            </div>

            {/* Chef */}
            <div className="grid gap-2">
              <Label htmlFor="chef">Chef (Quem cozinha)</Label>
              <Select value={chefId} onValueChange={setChefId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o chef" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguém</SelectItem>
                  {data.participants.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ajudante */}
            <div className="grid gap-2">
              <Label htmlFor="helper">Ajudante</Label>
              <Select value={helperId} onValueChange={setHelperId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ajudante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguém</SelectItem>
                  {data.participants.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lavadores de louça */}
            <div className="grid gap-2">
              <Label>Quem lava a louça</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dishwasher1" className="text-xs text-muted-foreground">Pessoa 1</Label>
                  <Select value={dishwasher1Id} onValueChange={setDishwasher1Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguém</SelectItem>
                      {data.participants.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dishwasher2" className="text-xs text-muted-foreground">Pessoa 2</Label>
                  <Select value={dishwasher2Id} onValueChange={setDishwasher2Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguém</SelectItem>
                      {data.participants.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ingredientes */}
            <div className="grid gap-2">
              <Label>Ingredientes (da lista de mercado)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {loadingItems ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Carregando ingredientes...
                  </p>
                ) : marketItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item na lista de mercado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {marketItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleIngredient(item.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIngredients.includes(item.id)}
                          onChange={() => toggleIngredient(item.id)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">{item.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedIngredients.map(id => {
                    const item = marketItems.find(i => i.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {item?.nome}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => toggleIngredient(id)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMealOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMeal}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Refeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Gastronomia;

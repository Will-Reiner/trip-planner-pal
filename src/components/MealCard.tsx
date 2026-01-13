import { useState, useEffect } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { getUserColor } from '../lib/userColors';
import { ChefHat, Droplets, ChevronDown, ChevronUp, Sparkles, Edit2, ShoppingCart, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface MarketItem {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  comprado: boolean;
}

interface MealIngredient {
  id: number;
  ingredient_id: number;
  ingredient_nome: string;
  quantidade_necessaria: number;
  quantidade_total: number;
  unidade: string;
  categoria: string;
  comprado: boolean;
}

interface MealCardProps {
  meal: {
    id: number;
    day: number;
    type: string;
    description: string;
    ingredients: string[];
    chef: number | null;
    helper: number | null;
    dishWashers: (number | null)[];
  };
}

const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [mealName, setMealName] = useState(meal.description || '');
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const { data, assignChef, assignHelper, assignDishWasher, reloadData } = useTripData();
  const { currentUser } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isIngredientsDialogOpen) {
      loadMarketItems();
      loadMealIngredients();
    }
  }, [isIngredientsDialogOpen]);

  const getParticipantName = (id: number | null) => {
    if (!id) return null;
    return data.participants.find(p => p.id === id)?.name;
  };

  const getMealEmoji = (type: string) => {
    switch (type) {
      case 'Café da Manhã': return '☕';
      case 'Almoço': return '🍽️';
      case 'Jantar': return '🌙';
      default: return '🍴';
    }
  };

  const handleVolunteerChef = () => {
    if (currentUser && !meal.chef) {
      assignChef(meal.id, currentUser.id);
    }
  };

  const handleVolunteerHelper = () => {
    if (currentUser && !meal.helper) {
      assignHelper(meal.id, currentUser.id);
    }
  };

  const handleVolunteerDishWasher = (slot: number) => {
    if (currentUser && !meal.dishWashers[slot]) {
      assignDishWasher(meal.id, slot, currentUser.id);
    }
  };

  const handleSaveMealName = async () => {
    try {
      await axios.patch(`${API_URL}/meals/${meal.id}`, {
        nome_refeicao: mealName,
      });
      setIsEditingName(false);
      reloadData();
      toast({
        title: 'Sucesso!',
        description: 'Nome da refeição atualizado',
      });
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o nome',
        variant: 'destructive',
      });
    }
  };

  const loadMarketItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/market-items`);
      setMarketItems(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const loadMealIngredients = async () => {
    try {
      const response = await axios.get(`${API_URL}/meal-ingredients/meal/${meal.id}`);
      const ingredients = response.data.data || [];
      setMealIngredients(ingredients);
      setSelectedItems(new Set(ingredients.map((i: MealIngredient) => i.ingredient_id)));
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error);
    }
  };

  const handleToggleIngredient = async (itemId: number, checked: boolean) => {
    try {
      if (checked) {
        const item = marketItems.find(i => i.id === itemId);
        if (!item) return;
        
        await axios.post(`${API_URL}/meal-ingredients`, {
          meal_id: meal.id,
          ingredient_id: itemId,
          quantidade_necessaria: item.quantidade,
        });
        
        setSelectedItems(prev => new Set([...prev, itemId]));
      } else {
        await axios.delete(`${API_URL}/meal-ingredients`, {
          data: {
            meal_id: meal.id,
            ingredient_id: itemId,
          },
        });
        
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
      
      loadMealIngredients();
      toast({
        title: checked ? 'Ingrediente adicionado!' : 'Ingrediente removido!',
      });
    } catch (error) {
      console.error('Erro ao atualizar ingrediente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o ingrediente',
        variant: 'destructive',
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:shadow-md">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{getMealEmoji(meal.type)}</span>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-foreground">{meal.type}</h3>
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Nome da refeição..."
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveMealName} className="h-8">
                    Salvar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {meal.description || 'Clique para adicionar nome'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {meal.chef && (
              <Badge 
                className="text-xs text-white"
                style={{ backgroundColor: getUserColor(meal.chef) }}
              >
                <ChefHat className="w-3 h-3 mr-1" />
                {getParticipantName(meal.chef)}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Ingredientes
                </h4>
                <Dialog open={isIngredientsDialogOpen} onOpenChange={setIsIngredientsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Gerenciar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Ingredientes da Refeição</DialogTitle>
                      <DialogDescription>
                        Selecione os itens da lista de mercado necessários para esta refeição
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                      {marketItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum item na lista de mercado
                        </p>
                      ) : (
                        marketItems.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => handleToggleIngredient(item.id, checked as boolean)}
                            />
                            <Label
                              htmlFor={`item-${item.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.quantidade} {item.unidade}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.categoria}
                                </Badge>
                                {item.comprado && (
                                  <Badge className="text-xs bg-green-500">
                                    ✓ Comprado
                                  </Badge>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {mealIngredients.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum ingrediente vinculado. Clique em "Gerenciar" para adicionar.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mealIngredients.map((ingredient) => (
                    <Badge 
                      key={ingredient.id} 
                      variant="outline" 
                      className={`text-xs ${ingredient.comprado ? 'bg-green-50' : ''}`}
                    >
                      {ingredient.ingredient_nome} ({ingredient.quantidade_necessaria} {ingredient.unidade})
                      {ingredient.comprado && ' ✓'}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Chef */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Chef</span>
              </div>
              {meal.chef ? (
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: getUserColor(meal.chef) }}
                >
                  {getParticipantName(meal.chef)}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVolunteerChef}
                  className="text-xs"
                >
                  Pode ser eu! 🙋
                </Button>
              )}
            </div>

            {/* Helper */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Ajudante</span>
              </div>
              {meal.helper ? (
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: getUserColor(meal.helper) }}
                >
                  {getParticipantName(meal.helper)}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVolunteerHelper}
                  className="text-xs"
                >
                  Posso ajudar! 👨‍🍳
                </Button>
              )}
            </div>

            {/* Dish Washers */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-accent-foreground" />
                Louça
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {meal.dishWashers.map((washer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {washer ? (
                      <Badge 
                        className="text-xs text-white"
                        style={{ backgroundColor: getUserColor(washer) }}
                      >
                        {getParticipantName(washer)}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVolunteerDishWasher(index)}
                        className="text-xs h-7 hover:bg-primary/10"
                      >
                        Eu lavo! 🧽
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default MealCard;

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as api from '../services/api';

interface Participant {
  id: number;
  name: string;
  photo: string | null;
  title: string;
}

interface Meal {
  id: number;
  day: number;
  type: string;
  description: string;
  ingredients: string[];
  chef: number | null;
  dishWashers: (number | null)[];
}

interface Drink {
  id: number;
  name: string;
  emoji: string;
  votes: number[];
}

interface Item {
  id: number;
  name: string;
  assignee: number | null;
}

interface Task {
  id: number;
  name: string;
  assignee: number | null;
}

interface Essential {
  id: number;
  name: string;
  checked: boolean;
}

interface PartyTheme {
  id: number;
  name: string;
  emoji: string;
  votes: number[];
}

interface Quote {
  id: number;
  text: string;
  author: number;
}

interface TripData {
  participants: Participant[];
  meals: Meal[];
  drinks: {
    alcoholic: Drink[];
    nonAlcoholic: Drink[];
  };
  communityItems: Item[];
  tasks: Task[];
  essentials: Essential[];
  partyThemes: PartyTheme[];
  quotes: Quote[];
}

interface TripDataContextType {
  data: TripData;
  updateParticipant: (id: number, updates: Partial<Participant>) => void;
  assignChef: (mealId: number, userId: number) => void;
  assignDishWasher: (mealId: number, slot: number, userId: number) => void;
  voteDrink: (type: 'alcoholic' | 'nonAlcoholic', drinkId: number, userId: number) => void;
  addCommunityItem: (name: string) => void;
  assignCommunityItem: (itemId: number, userId: number) => void;
  addTask: (name: string) => void;
  assignTask: (taskId: number, userId: number) => void;
  addEssential: (name: string) => void;
  toggleEssential: (essentialId: number) => void;
  votePartyTheme: (themeId: number, userId: number) => void;
  addQuote: (text: string, authorId: number) => void;
}

const TripDataContext = createContext<TripDataContextType | undefined>(undefined);

export const TripDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<TripData>({
    participants: [],
    meals: [],
    drinks: { alcoholic: [], nonAlcoholic: [] },
    communityItems: [],
    tasks: [],
    essentials: [],
    partyThemes: [],
    quotes: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados iniciais
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📡 Carregando dados da API...');
      
      const [users, meals, drinks, checklist, experiences] = await Promise.all([
        api.getUsers(),
        api.getMeals(),
        api.getDrinks(),
        api.getChecklist(),
        api.getExperiences()
      ]);

      console.log('✅ Dados carregados:', { users: users.length, meals: meals.length, drinks: drinks.length });

      // Mapear usuários
      const participants = users.map(u => ({
        id: u.id,
        name: u.nome,
        photo: u.avatar_url,
        title: u.titulo_engracado || ''
      }));

      // Mapear refeições
      const mappedMeals = meals.map(m => ({
        id: m.id,
        day: new Date(m.data).getDate(),
        type: m.tipo_refeicao === 'cafe' ? 'Café da Manhã' : m.tipo_refeicao === 'almoco' ? 'Almoço' : 'Jantar',
        description: '',
        ingredients: m.ingredientes || [],
        chef: m.cook_id,
        dishWashers: [m.dishwasher1_id, m.dishwasher2_id]
      }));

      // Mapear bebidas
      const alcoholic = drinks
        .filter(d => d.categoria === 'alc')
        .map(d => ({
          id: d.id,
          name: d.nome_bebida,
          emoji: '🍺',
          votes: Array(d.votos).fill(0).map((_, i) => i + 1)
        }));

      const nonAlcoholic = drinks
        .filter(d => d.categoria === 'non-alc')
        .map(d => ({
          id: d.id,
          name: d.nome_bebida,
          emoji: '🥤',
          votes: Array(d.votos).fill(0).map((_, i) => i + 1)
        }));

      // Mapear checklist
      const communityItems = checklist
        .filter(c => c.categoria === 'item')
        .map(c => ({
          id: c.id,
          name: c.descricao,
          assignee: c.owner_id
        }));

      const tasks = checklist
        .filter(c => c.categoria === 'tarefa')
        .map(c => ({
          id: c.id,
          name: c.descricao,
          assignee: c.owner_id
        }));

      const essentials = checklist
        .filter(c => c.categoria === 'nao_esqueca')
        .map(c => ({
          id: c.id,
          name: c.descricao,
          checked: c.completed
        }));

      // Mapear experiências
      const partyThemes = experiences
        .filter(e => e.tipo === 'tema_festa')
        .map(e => ({
          id: e.id,
          name: e.conteudo,
          emoji: '🎉',
          votes: Array(e.votos).fill(0).map((_, i) => i + 1)
        }));

      const quotes = experiences
        .filter(e => e.tipo === 'frase')
        .map(e => ({
          id: e.id,
          text: e.conteudo,
          author: e.autor_id || 0
        }));

      setData({
        participants,
        meals: mappedMeals,
        drinks: { alcoholic, nonAlcoholic },
        communityItems,
        tasks,
        essentials,
        partyThemes,
        quotes
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível conectar com o servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateParticipant = async (id: number, updates: Partial<Participant>) => {
    try {
      await api.updateUser(id, {
        nome: updates.name,
        avatar_url: updates.photo,
        titulo_engracado: updates.title
      });
      setData(prev => ({
        ...prev,
        participants: prev.participants.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      }));
      toast({ title: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    }
  };

  const assignChef = async (mealId: number, userId: number) => {
    try {
      const meal = data.meals.find(m => m.id === mealId);
      if (!meal) return;

      const tipoRefeicao = meal.type === 'Café da Manhã' ? 'cafe' : meal.type === 'Almoço' ? 'almoco' : 'jantar';
      await api.claimMealRole(mealId, 'cook', userId);
      
      setData(prev => ({
        ...prev,
        meals: prev.meals.map(m =>
          m.id === mealId ? { ...m, chef: userId } : m
        )
      }));
      toast({ title: 'Chef atribuído com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao atribuir chef', variant: 'destructive' });
    }
  };

  const assignDishWasher = async (mealId: number, slot: number, userId: number) => {
    try {
      const role = slot === 0 ? 'dishwasher1' : 'dishwasher2';
      await api.claimMealRole(mealId, role, userId);
      
      setData(prev => ({
        ...prev,
        meals: prev.meals.map(m => {
          if (m.id === mealId) {
            const newDishWashers = [...m.dishWashers];
            newDishWashers[slot] = userId;
            return { ...m, dishWashers: newDishWashers };
          }
          return m;
        })
      }));
      toast({ title: 'Lavador de louça atribuído!' });
    } catch (error) {
      toast({ title: 'Erro ao atribuir lavador', variant: 'destructive' });
    }
  };

  const voteDrink = async (type: 'alcoholic' | 'nonAlcoholic', drinkId: number, userId: number) => {
    try {
      await api.voteDrink(drinkId);
      setData(prev => ({
        ...prev,
        drinks: {
          ...prev.drinks,
          [type]: prev.drinks[type].map(d => {
            if (d.id === drinkId) {
              const hasVoted = d.votes.includes(userId);
              return {
                ...d,
                votes: hasVoted
                  ? d.votes.filter(v => v !== userId)
                  : [...d.votes, userId]
              };
            }
            return d;
          })
        }
      }));
    } catch (error) {
      toast({ title: 'Erro ao votar', variant: 'destructive' });
    }
  };

  const addCommunityItem = async (name: string) => {
    try {
      const newItem = await api.createChecklistItem({
        categoria: 'item',
        descricao: name
      });
      setData(prev => ({
        ...prev,
        communityItems: [
          ...prev.communityItems,
          { id: newItem.id, name: newItem.descricao, assignee: newItem.owner_id }
        ]
      }));
      toast({ title: 'Item adicionado!' });
    } catch (error) {
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    }
  };

  const assignCommunityItem = async (itemId: number, userId: number) => {
    try {
      await api.claimChecklistItem(itemId, userId);
      setData(prev => ({
        ...prev,
        communityItems: prev.communityItems.map(item =>
          item.id === itemId ? { ...item, assignee: userId } : item
        )
      }));
      toast({ title: 'Item reivindicado!' });
    } catch (error) {
      toast({ title: 'Erro ao reivindicar item', variant: 'destructive' });
    }
  };

  const addTask = async (name: string) => {
    try {
      const newTask = await api.createChecklistItem({
        categoria: 'tarefa',
        descricao: name
      });
      setData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { id: newTask.id, name: newTask.descricao, assignee: newTask.owner_id }]
      }));
      toast({ title: 'Tarefa adicionada!' });
    } catch (error) {
      toast({ title: 'Erro ao adicionar tarefa', variant: 'destructive' });
    }
  };

  const assignTask = async (taskId: number, userId: number) => {
    try {
      await api.claimChecklistItem(taskId, userId);
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId ? { ...task, assignee: userId } : task
        )
      }));
      toast({ title: 'Tarefa reivindicada!' });
    } catch (error) {
      toast({ title: 'Erro ao reivindicar tarefa', variant: 'destructive' });
    }
  };

  const addEssential = async (name: string) => {
    try {
      const newEssential = await api.createChecklistItem({
        categoria: 'nao_esqueca',
        descricao: name
      });
      setData(prev => ({
        ...prev,
        essentials: [...prev.essentials, { id: newEssential.id, name: newEssential.descricao, checked: false }]
      }));
      toast({ title: 'Item essencial adicionado!' });
    } catch (error) {
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    }
  };

  const toggleEssential = async (essentialId: number) => {
    try {
      const essential = data.essentials.find(e => e.id === essentialId);
      if (!essential) return;
      
      await api.updateChecklistItem(essentialId, { completed: !essential.checked });
      setData(prev => ({
        ...prev,
        essentials: prev.essentials.map(e =>
          e.id === essentialId ? { ...e, checked: !e.checked } : e
        )
      }));
    } catch (error) {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const votePartyTheme = async (themeId: number, userId: number) => {
    try {
      await api.voteExperience(themeId);
      setData(prev => ({
        ...prev,
        partyThemes: prev.partyThemes.map(t => {
          if (t.id === themeId) {
            const hasVoted = t.votes.includes(userId);
            return {
              ...t,
              votes: hasVoted
                ? t.votes.filter(v => v !== userId)
                : [...t.votes, userId]
            };
          }
          return t;
        })
      }));
    } catch (error) {
      toast({ title: 'Erro ao votar', variant: 'destructive' });
    }
  };

  const addQuote = async (text: string, authorId: number) => {
    try {
      const newQuote = await api.createExperience({
        tipo: 'frase',
        conteudo: text,
        autor_id: authorId
      });
      setData(prev => ({
        ...prev,
        quotes: [...prev.quotes, { id: newQuote.id, text: newQuote.conteudo, author: newQuote.autor_id || 0 }]
      }));
      toast({ title: 'Frase adicionada!' });
    } catch (error) {
      toast({ title: 'Erro ao adicionar frase', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <TripDataContext.Provider value={{
      data,
      updateParticipant,
      assignChef,
      assignDishWasher,
      voteDrink,
      addCommunityItem,
      assignCommunityItem,
      addTask,
      assignTask,
      addEssential,
      toggleEssential,
      votePartyTheme,
      addQuote
    }}>
      {children}
    </TripDataContext.Provider>
  );
};

export const useTripData = () => {
  const context = useContext(TripDataContext);
  if (context === undefined) {
    throw new Error('useTripData must be used within a TripDataProvider');
  }
  return context;
};

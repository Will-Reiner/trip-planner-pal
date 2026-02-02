import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from './UserContext';
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
  helper: number | null;
  dishWashers: (number | null)[];
}

interface Drink {
  id: number;
  name: string;
  emoji: string;
  createdBy: string | null;
  createdById: number | null;
  participants: { userId: number; userName: string }[];
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
  is_checked_by_user?: boolean;
  created_by_id?: number | null;
}

interface PartyTheme {
  id: number;
  nome: string;
  descricao: string | null;
  cor_card: string;
  autor_id: number | null;
  autor_nome?: string;
  positive_votes: number;
  negative_votes: number;
  userVote?: 'positive' | 'negative' | null;
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
  assignHelper: (mealId: number, userId: number) => void;
  assignDishWasher: (mealId: number, slot: number, userId: number) => void;
  joinDrink: (drinkId: number, userId: number) => Promise<void>;
  leaveDrink: (drinkId: number, userId: number) => Promise<void>;
  deleteDrink: (drinkId: number) => Promise<void>;
  addCommunityItem: (name: string) => void;
  assignCommunityItem: (itemId: number, userId: number | null) => void;
  addTask: (name: string) => void;
  assignTask: (taskId: number, userId: number | null) => void;
  addEssential: (name: string) => void;
  toggleEssential: (essentialId: number) => void;
  deleteEssential: (essentialId: number) => void;
  votePartyTheme: (themeId: number, voteType: 'positive' | 'negative') => Promise<void>;
  removeVotePartyTheme: (themeId: number) => Promise<void>;
  addPartyTheme: (nome: string, descricao: string, cor_card: string) => Promise<void>;
  deletePartyTheme: (themeId: number) => Promise<void>;
  addQuote: (text: string, authorId: number) => void;
  reloadData: () => Promise<void>;
}

const TripDataContext = createContext<TripDataContextType | undefined>(undefined);

export const TripDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
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
      console.log('Current user ID:', currentUser?.id);
      
      const userId = currentUser?.id;
      
      const [users, meals, drinks, checklist, experiences] = await Promise.all([
        api.getUsers(),
        api.getMeals(),
        api.getDrinks(),
        userId ? api.getChecklist(userId) : api.getChecklist(),
        api.getExperiences()
      ]);

      console.log('✅ Dados carregados:', { users: users.length, meals: meals.length, drinks: drinks.length });
      console.log('Checklist loaded with user_id=', userId, ':', checklist);

      // Mapear usuários
      const participants = users.map(u => ({
        id: u.id,
        name: u.nome,
        photo: u.avatar_url,
        title: u.titulo_engracado || ''
      }));

      // Mapear refeições
      const mappedMeals = meals.map(m => {
        const mealDate = new Date(m.data);
        const day = mealDate.getDate();
        const type = m.tipo_refeicao === 'cafe' ? 'breakfast' : m.tipo_refeicao === 'almoco' ? 'lunch' : 'dinner';
        
        console.log(`📅 Meal mapping: ${m.nome_refeicao} - data: ${m.data}, day: ${day}, type: ${type}`);
        
        return {
          id: m.id,
          day,
          type,
          description: m.nome_refeicao || '',
          ingredients: m.ingredientes || [],
          chef: m.cook_id,
          helper: m.helper_id,
          dishWashers: [m.dishwasher1_id, m.dishwasher2_id]
        };
      });

      // Mapear bebidas com nova estrutura
      const alcoholic = drinks
        .filter(d => d.categoria === 'alc')
        .map(d => ({
          id: d.id,
          name: d.nome_bebida,
          emoji: d.emoji,
          createdBy: d.created_by_nome || null,
          createdById: d.created_by || null,
          participants: Array.isArray(d.participants) ? d.participants.map((p: any) => ({
            userId: p.user_id,
            userName: p.user_nome
          })) : []
        }));

      const nonAlcoholic = drinks
        .filter(d => d.categoria === 'non-alc')
        .map(d => ({
          id: d.id,
          name: d.nome_bebida,
          emoji: d.emoji,
          createdBy: d.created_by_nome || null,
          createdById: d.created_by || null,
          participants: Array.isArray(d.participants) ? d.participants.map((p: any) => ({
            userId: p.user_id,
            userName: p.user_nome
          })) : []
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
          checked: c.is_checked_by_user || false, // Usa status individual do usuário
          created_by_id: c.created_by_id
        }));

      // Mapear experincias (apenas frases agora)
      const quotes = experiences
        .filter(e => e.tipo === 'frase')
        .map(e => ({
          id: e.id,
          text: e.conteudo,
          author: e.autor_id || 0
        }));

      // Carregar temas de festa da nova API
      const partyThemesResponse = await api.getPartyThemes();
      const partyThemes = partyThemesResponse.map(theme => ({
        ...theme,
        userVote: null as 'positive' | 'negative' | null
      }));

      // Carregar votos do usuário
      if (currentUser) {
        try {
          const userVotes = await api.getUserPartyThemeVotes();
          userVotes.forEach(vote => {
            const theme = partyThemes.find(t => t.id === vote.theme_id);
            if (theme) {
              theme.userVote = vote.vote_type;
            }
          });
        } catch (error) {
          console.error('Erro ao carregar votos do usuário:', error);
        }
      }

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

  const assignHelper = async (mealId: number, userId: number) => {
    try {
      await api.claimMealRole(mealId, 'helper', userId);
      
      setData(prev => ({
        ...prev,
        meals: prev.meals.map(m =>
          m.id === mealId ? { ...m, helper: userId } : m
        )
      }));
      toast({ title: 'Ajudante atribuído com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao atribuir ajudante', variant: 'destructive' });
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

  const joinDrink = async (drinkId: number, userId: number) => {
    try {
      await api.joinDrink(drinkId, userId);
      await loadAllData();
      toast({ title: 'Você entrou no racha!' });
    } catch (error) {
      toast({ title: 'Erro ao entrar no racha', variant: 'destructive' });
    }
  };

  const leaveDrink = async (drinkId: number, userId: number) => {
    try {
      await api.leaveDrink(drinkId, userId);
      await loadAllData();
      toast({ title: 'Você saiu do racha' });
    } catch (error) {
      toast({ title: 'Erro ao sair do racha', variant: 'destructive' });
    }
  };

  const deleteDrink = async (drinkId: number) => {
    try {
      await api.deleteDrink(drinkId);
      await loadAllData();
      toast({ title: 'Bebida deletada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao deletar bebida', variant: 'destructive' });
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

  const assignCommunityItem = async (itemId: number, userId: number | null) => {
    try {
      await api.claimChecklistItem(itemId, userId);
      setData(prev => ({
        ...prev,
        communityItems: prev.communityItems.map(item =>
          item.id === itemId ? { ...item, assignee: userId } : item
        )
      }));
      toast({ title: userId ? 'Item reivindicado!' : 'Responsabilidade removida' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
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

  const assignTask = async (taskId: number, userId: number | null) => {
    try {
      await api.claimChecklistItem(taskId, userId);
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId ? { ...task, assignee: userId } : task
        )
      }));
      toast({ title: userId ? 'Tarefa reivindicada!' : 'Responsabilidade removida' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
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
    if (!currentUser) return;
    
    try {
      const result = await api.toggleUserChecklistItem(essentialId, currentUser.id);
      
      // Atualizar apenas o estado local para o usuário atual
      setData(prev => ({
        ...prev,
        essentials: prev.essentials.map(e =>
          e.id === essentialId ? { ...e, checked: result.checked } : e
        )
      }));
      
    } catch (error) {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const deleteEssential = async (essentialId: number) => {
    if (!currentUser) return;
    
    try {
      await api.deleteChecklistItem(essentialId);
      
      // Remover do estado local sem recarregar tudo
      setData(prev => ({
        ...prev,
        essentials: prev.essentials.filter(e => e.id !== essentialId)
      }));
      
      toast({ title: 'Item removido com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    }
  };

  const votePartyTheme = async (themeId: number, voteType: 'positive' | 'negative') => {
    if (!currentUser) return;
    
    try {
      const updatedTheme = await api.votePartyTheme(themeId, voteType);
      
      setData(prev => ({
        ...prev,
        partyThemes: prev.partyThemes.map(t => 
          t.id === themeId ? { ...updatedTheme, userVote: voteType } : t
        )
      }));
      
      toast({ title: 'Voto registrado!' });
    } catch (error) {
      toast({ title: 'Erro ao votar', variant: 'destructive' });
    }
  };

  const removeVotePartyTheme = async (themeId: number) => {
    if (!currentUser) return;
    
    try {
      const updatedTheme = await api.removeVotePartyTheme(themeId);
      
      setData(prev => ({
        ...prev,
        partyThemes: prev.partyThemes.map(t => 
          t.id === themeId ? { ...updatedTheme, userVote: null } : t
        )
      }));
      
      toast({ title: 'Voto removido!' });
    } catch (error) {
      toast({ title: 'Erro ao remover voto', variant: 'destructive' });
    }
  };

  const addPartyTheme = async (nome: string, descricao: string, cor_card: string) => {
    if (!currentUser) return;
    
    try {
      const newTheme = await api.createPartyTheme({ nome, descricao, cor_card });
      
      setData(prev => ({
        ...prev,
        partyThemes: [{ ...newTheme, positive_votes: 0, negative_votes: 0, userVote: null }, ...prev.partyThemes]
      }));
      
      toast({ title: 'Tema criado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao criar tema', variant: 'destructive' });
    }
  };

  const deletePartyTheme = async (themeId: number) => {
    if (!currentUser) return;
    
    try {
      await api.deletePartyTheme(themeId);
      
      setData(prev => ({
        ...prev,
        partyThemes: prev.partyThemes.filter(t => t.id !== themeId)
      }));
      
      toast({ title: 'Tema removido com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao remover tema', variant: 'destructive' });
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
      assignHelper,
      assignDishWasher,
      joinDrink,
      leaveDrink,
      deleteDrink,
      addCommunityItem,
      assignCommunityItem,
      addTask,
      assignTask,
      addEssential,
      toggleEssential,
      deleteEssential,
      votePartyTheme,
      removeVotePartyTheme,
      addPartyTheme,
      deletePartyTheme,
      addQuote,
      reloadData: loadAllData
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
